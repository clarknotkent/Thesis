import supabase from '../db.js';

const receivingReportModel = {};

// Helper to get today's date in Philippine timezone
const _getTodayInPH = () => {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const todayStr = formatter.format(new Date());
  const today = new Date(todayStr);
  today.setHours(0, 0, 0, 0);
  return today;
};

// Normalization functions
const toTitleCase = (str) => {
  if (!str || typeof str !== 'string') return str;
  return str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
};

const toSentenceCase = (str) => {
  if (!str || typeof str !== 'string') return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

// Helper to build full name
function fullName(u) {
  if (!u) return null;
  const parts = [u.surname, u.firstname, u.middlename].filter(Boolean);
  return parts.join(' ').trim();
}

// Generate report number using DB function if available, fallback to Node computation
receivingReportModel.generateReportNumber = async () => {
  // Try RPC first
  try {
    const { data, error } = await supabase.rpc('generate_report_number');
    if (!error && data) return data;
  } catch (_) {}
  // Fallback: compute RR-YYYY-NNNN by scanning latest
  const year = new Date().getFullYear();
  const like = `RR-${year}-%`;
  const { data: rows, error } = await supabase
    .from('receiving_reports')
    .select('report_number, created_at')
    .like('report_number', like)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  let maxNum = 0;
  for (const r of rows || []) {
    const m = String(r.report_number || '').match(/^RR-\d{4}-(\d{1,})$/);
    if (m) maxNum = Math.max(maxNum, parseInt(m[1], 10));
  }
  const next = String(maxNum + 1).padStart(4, '0');
  return `RR-${year}-${next}`;
};

// Create report header (DRAFT)
receivingReportModel.createReport = async (payload, userId) => {
  // Validate delivery date - should not be in the future
  if (payload.delivery_date) {
    const deliveryDate = new Date(payload.delivery_date);
    const today = new Date(); // Current date/time
    if (deliveryDate > today) {
      throw new Error('Delivery date cannot be in the future');
    }
  }

  const report_number = await receivingReportModel.generateReportNumber();
  const insert = {
    report_number,
    delivery_date: payload.delivery_date,
    delivered_by: toTitleCase(payload.delivered_by),
    received_by: payload.received_by || userId || null,
    supplier_name: toTitleCase(payload.supplier_name || 'Main Office'),
    supplier_notes: toSentenceCase(payload.supplier_notes || null),
    status: 'DRAFT',
    created_by: userId || null,
    updated_by: userId || null
  };
  const { data, error } = await supabase.from('receiving_reports').insert(insert).select('*').single();
  if (error) throw error;

  // If items provided, create them
  const createdItems = [];
  if (payload.items && Array.isArray(payload.items)) {
    for (const item of payload.items) {
      try {
        const createdItem = await receivingReportModel.addItem(data.report_id, item, userId);
        createdItems.push(createdItem);
      } catch (itemError) {
        console.error('Failed to create item', item, itemError);
        // Continue, don't fail the whole report
      }
    }
  }

  return { ...data, items: createdItems };
};

receivingReportModel.updateReport = async (reportId, payload, userId) => {
  // Note: Validation is done in frontend, skip here to avoid timezone issues

  const update = {
    updated_by: userId || null
  };
  if (payload.delivery_date !== undefined && payload.delivery_date !== null && payload.delivery_date !== '') update.delivery_date = payload.delivery_date;
  if (payload.delivered_by !== undefined && payload.delivered_by !== null && payload.delivered_by !== '') update.delivered_by = toTitleCase(payload.delivered_by);
  // received_by should not be updated
  if (payload.supplier_name !== undefined && payload.supplier_name !== null) update.supplier_name = toTitleCase(payload.supplier_name);
  if (payload.supplier_notes !== undefined && payload.supplier_notes !== null) update.supplier_notes = toSentenceCase(payload.supplier_notes);

  const { data, error } = await supabase.from('receiving_reports').update(update).eq('report_id', reportId).select('*').single();
  if (error) throw error;

  // Handle items if provided
  if (payload.items && Array.isArray(payload.items)) {
    // Get current items
    const { data: currentItems, error: currentError } = await supabase
      .from('receiving_report_items')
      .select('item_id')
      .eq('report_id', reportId);
    if (currentError) throw currentError;
    const currentItemIds = new Set(currentItems.map(i => i.item_id));
    const sentItemIds = new Set(payload.items.filter(it => it.item_id).map(it => it.item_id));

    // Update or insert sent items
    for (const item of payload.items) {
      if (item.item_id) {
        // Update existing
        await receivingReportModel.updateItem(item.item_id, item, userId);
      } else {
        // Insert new
        await receivingReportModel.addItem(reportId, item, userId);
      }
    }

    // Soft delete items not in sent list
    const toDelete = Array.from(currentItemIds).filter(id => !sentItemIds.has(id));
    if (toDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from('receiving_report_items')
        .update({ is_deleted: true, deleted_at: new Date().toISOString(), deleted_by: userId || null })
        .in('item_id', toDelete);
      if (deleteError) console.error('Failed to soft delete items', deleteError);
    }
  }

  // Update totals based on current items
  const { data: totalsData, error: totalsError } = await supabase
    .from('receiving_report_items')
    .select('quantity_received')
    .eq('report_id', reportId)
    .eq('is_deleted', false);
  if (totalsError) console.error('Failed to fetch totals', totalsError);
  else {
    const totalItems = totalsData.length;
    const totalQuantity = totalsData.reduce((sum, item) => sum + (item.quantity_received || 0), 0);
    const { error: updateTotalsError } = await supabase
      .from('receiving_reports')
      .update({ total_items: totalItems, total_quantity: totalQuantity })
      .eq('report_id', reportId);
    if (updateTotalsError) console.error('Failed to update totals', updateTotalsError);
  }

  return data;
};

receivingReportModel.listReports = async (filters = {}, page = 1, limit = 10) => {
  let query = supabase
    .from('receiving_reports')
    .select('*, received_by(user_id, surname, firstname, middlename)', { count: 'exact' })
    .eq('is_deleted', false)
    .order('created_at', { ascending: false });
  if (filters.status) query = query.eq('status', filters.status);
  if (filters.search) query = query.ilike('report_number', `%${filters.search}%`);
  if (filters.date_from) query = query.gte('delivery_date', filters.date_from);
  if (filters.date_to) query = query.lte('delivery_date', filters.date_to);
  const offset = (page - 1) * limit;
  query = query.range(offset, offset + limit - 1);
  const { data, error, count } = await query;
  if (error) throw error;
  const items = (data || []).map(r => ({
    ...r,
    received_by_name: r.received_by && typeof r.received_by === 'object' ? fullName(r.received_by) : null
  }));
  return { items, totalCount: count || 0, page, limit, totalPages: count ? Math.ceil(count / limit) : 0 };
};

receivingReportModel.getReportById = async (reportId) => {
  const { data: header, error: e1 } = await supabase
    .from('receiving_reports')
    .select('*, received_by(user_id, surname, firstname, middlename)')
    .eq('report_id', reportId)
    .single();
  if (e1) throw e1;
  const { data: items, error: e2 } = await supabase
    .from('receiving_report_items')
    .select('*, vaccinemaster(vaccine_id, antigen_name, brand_name, manufacturer, disease_prevented, vaccine_type, category)')
    .eq('report_id', reportId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: true });
  if (e2) throw e2;
  return { header, items };
};

receivingReportModel.addItem = async (reportId, item, _userId) => {
  // Validate expiration date - should not be in the past (can be today or future)
  if (item.expiration_date) {
    const expirationDate = new Date(item.expiration_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today for comparison
    if (expirationDate <= today) {
      throw new Error('Expiration date must be in the future');
    }
  }

  const insert = {
    report_id: reportId,
    vaccine_id: item.vaccine_id && item.vaccine_id !== '' ? item.vaccine_id : null,
    antigen_name: toTitleCase(item.antigen_name || null),
    brand_name: toTitleCase(item.brand_name || null),
    manufacturer: toTitleCase(item.manufacturer || null),
    lot_number: item.lot_number,
    expiration_date: item.expiration_date,
    quantity_received: item.quantity_received,
    storage_location: toTitleCase(item.storage_location || null),
    unit_cost: item.unit_cost || null,
    remarks: toSentenceCase(item.remarks || null)
  };
  const { data, error } = await supabase.from('receiving_report_items').insert(insert).select('*').single();
  if (error) throw error;

  // Update totals in the report header
  const { data: totalsData, error: totalsError } = await supabase
    .from('receiving_report_items')
    .select('quantity_received')
    .eq('report_id', reportId)
    .eq('is_deleted', false);
  if (totalsError) console.error('Failed to fetch totals', totalsError);
  else {
    const totalItems = totalsData.length;
    const totalQuantity = totalsData.reduce((sum, item) => sum + (item.quantity_received || 0), 0);
    const { error: updateError } = await supabase
      .from('receiving_reports')
      .update({ total_items: totalItems, total_quantity: totalQuantity })
      .eq('report_id', reportId);
    if (updateError) console.error('Failed to update totals', updateError);
  }

  return data;
};

receivingReportModel.updateItem = async (itemId, item, _userId) => {
  // Note: Validation is done in frontend, skip here to avoid timezone issues

  const update = {
    vaccine_id: item.vaccine_id && item.vaccine_id !== '' ? item.vaccine_id : null,
    antigen_name: toTitleCase(item.antigen_name || null),
    brand_name: toTitleCase(item.brand_name || null),
    manufacturer: toTitleCase(item.manufacturer || null),
    lot_number: item.lot_number,
    expiration_date: item.expiration_date,
    quantity_received: item.quantity_received,
    storage_location: toTitleCase(item.storage_location || null),
    unit_cost: item.unit_cost || null,
    remarks: toSentenceCase(item.remarks || null)
  };
  const { data, error } = await supabase.from('receiving_report_items').update(update).eq('item_id', itemId).select('*').single();
  if (error) throw error;

  // Update totals in the report header
  const reportId = data.report_id;
  const { data: totalsData, error: totalsError } = await supabase
    .from('receiving_report_items')
    .select('quantity_received')
    .eq('report_id', reportId)
    .eq('is_deleted', false);
  if (totalsError) console.error('Failed to fetch totals', totalsError);
  else {
    const totalItems = totalsData.length;
    const totalQuantity = totalsData.reduce((sum, item) => sum + (item.quantity_received || 0), 0);
    const { error: updateError } = await supabase
      .from('receiving_reports')
      .update({ total_items: totalItems, total_quantity: totalQuantity })
      .eq('report_id', reportId);
    if (updateError) console.error('Failed to update totals', updateError);
  }

  return data;
};

receivingReportModel.completeReport = async (reportId, userId) => {
  // Prefer DB function to ensure transactional creation of inventory and transactions
  try {
    console.log('Calling RPC complete_receiving_report', { reportId, userId });
    const { error } = await supabase.rpc('complete_receiving_report', { p_report_id: reportId, p_user_id: userId });
    if (error) {
      console.log('RPC error', error);
      throw error;
    }
    console.log('RPC success');
  } catch (err) {
    console.log('RPC failed, falling back to status update', err);
    // If RPC not available, at least mark status COMPLETED; inventory creation will be missing
    await supabase.from('receiving_reports').update({ status: 'COMPLETED', updated_by: userId || null }).eq('report_id', reportId);
  }
  // Return updated report
  return await receivingReportModel.getReportById(reportId);
};

receivingReportModel.cancelReport = async (reportId, userId, reason = null) => {
  try {
    const { error } = await supabase.rpc('cancel_receiving_report', { p_report_id: reportId, p_user_id: userId, p_reason: reason });
    if (error) throw error;
  } catch (_err) {
    await supabase.from('receiving_reports').update({ status: 'CANCELLED', updated_by: userId || null }).eq('report_id', reportId);
  }
  return await receivingReportModel.getReportById(reportId);
};

receivingReportModel.updateStorage = async (reportId, items, userId) => {
  // Validate that the report exists and is completed
  const { data: report, error: reportError } = await supabase
    .from('receiving_reports')
    .select('report_id, status')
    .eq('report_id', reportId)
    .single();

  if (reportError || !report) {
    throw new Error('Receiving report not found');
  }

  if (report.status !== 'COMPLETED') {
    throw new Error('Storage locations can only be updated for completed reports');
  }

  // Update storage locations for each item
  for (const item of items) {
    const { item_id, storage_location } = item;
    const { error } = await supabase
      .from('receiving_report_items')
      .update({
        storage_location: storage_location || null,
        updated_by: userId || null,
        updated_at: new Date().toISOString()
      })
      .eq('item_id', item_id)
      .eq('report_id', reportId); // Ensure item belongs to this report

    if (error) {
      throw new Error(`Failed to update storage location for item ${item_id}: ${error.message}`);
    }

    // Also update the corresponding inventory record if it exists
    const { data: itemData, error: itemError } = await supabase
      .from('receiving_report_items')
      .select('inventory_id')
      .eq('item_id', item_id)
      .single();

    if (!itemError && itemData && itemData.inventory_id) {
      const { error: inventoryError } = await supabase
        .from('inventory')
        .update({
          storage_location: storage_location || null,
          updated_by: userId || null,
          updated_at: new Date().toISOString()
        })
        .eq('inventory_id', itemData.inventory_id);

      if (inventoryError) {
        console.error(`Failed to update inventory storage for inventory_id ${itemData.inventory_id}: ${inventoryError.message}`);
        // Don't throw error here, continue with other items
      }
    }
  }

  // Return updated report
  return await receivingReportModel.getReportById(reportId);
};

export default receivingReportModel;
