const supabase = require('../db')

const receivingReportModel = {}

// Helper to build full name
function fullName(u) {
  if (!u) return null
  const parts = [u.surname, u.firstname, u.middlename].filter(Boolean)
  return parts.join(' ').trim()
}

// Generate report number using DB function if available, fallback to Node computation
receivingReportModel.generateReportNumber = async () => {
  // Try RPC first
  try {
    const { data, error } = await supabase.rpc('generate_report_number')
    if (!error && data) return data
  } catch (_) {}
  // Fallback: compute RR-YYYY-NNNN by scanning latest
  const year = new Date().getFullYear()
  const like = `RR-${year}-%`
  const { data: rows, error } = await supabase
    .from('receiving_reports')
    .select('report_number, created_at')
    .like('report_number', like)
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) throw error
  let maxNum = 0
  for (const r of rows || []) {
    const m = String(r.report_number || '').match(/^RR-\d{4}-(\d{1,})$/)
    if (m) maxNum = Math.max(maxNum, parseInt(m[1], 10))
  }
  const next = String(maxNum + 1).padStart(4, '0')
  return `RR-${year}-${next}`
}

// Create report header (DRAFT)
receivingReportModel.createReport = async (payload, userId) => {
  const report_number = await receivingReportModel.generateReportNumber()
  const insert = {
    report_number,
    delivery_date: payload.delivery_date,
    delivered_by: payload.delivered_by,
    received_by: payload.received_by || userId || null,
    supplier_name: payload.supplier_name || 'Main Office',
    supplier_notes: payload.supplier_notes || null,
    status: 'DRAFT',
    created_by: userId || null,
    updated_by: userId || null
  }
  const { data, error } = await supabase.from('receiving_reports').insert(insert).select('*').single()
  if (error) throw error

  // If items provided, create them
  let createdItems = []
  if (payload.items && Array.isArray(payload.items)) {
    for (const item of payload.items) {
      try {
        const createdItem = await receivingReportModel.addItem(data.report_id, item, userId)
        createdItems.push(createdItem)
      } catch (itemError) {
        console.error('Failed to create item', item, itemError)
        // Continue, don't fail the whole report
      }
    }
  }

  return { ...data, items: createdItems }
}

receivingReportModel.updateReport = async (reportId, payload, userId) => {
  const update = {
    updated_by: userId || null
  }
  if (payload.delivery_date !== undefined && payload.delivery_date !== null && payload.delivery_date !== '') update.delivery_date = payload.delivery_date
  if (payload.delivered_by !== undefined && payload.delivered_by !== null && payload.delivered_by !== '') update.delivered_by = payload.delivered_by
  // received_by should not be updated
  if (payload.supplier_name !== undefined && payload.supplier_name !== null) update.supplier_name = payload.supplier_name
  if (payload.supplier_notes !== undefined && payload.supplier_notes !== null) update.supplier_notes = payload.supplier_notes

  const { data, error } = await supabase.from('receiving_reports').update(update).eq('report_id', reportId).select('*').single()
  if (error) throw error

  // Handle items if provided
  if (payload.items && Array.isArray(payload.items)) {
    // Get current items
    const { data: currentItems, error: currentError } = await supabase
      .from('receiving_report_items')
      .select('item_id')
      .eq('report_id', reportId)
    if (currentError) throw currentError
    const currentItemIds = new Set(currentItems.map(i => i.item_id))
    const sentItemIds = new Set(payload.items.filter(it => it.item_id).map(it => it.item_id))

    // Update or insert sent items
    for (const item of payload.items) {
      if (item.item_id) {
        // Update existing
        await receivingReportModel.updateItem(item.item_id, item, userId)
      } else {
        // Insert new
        await receivingReportModel.addItem(reportId, item, userId)
      }
    }

    // Soft delete items not in sent list
    const toDelete = Array.from(currentItemIds).filter(id => !sentItemIds.has(id))
    if (toDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from('receiving_report_items')
        .update({ is_deleted: true, deleted_at: new Date().toISOString(), deleted_by: userId || null })
        .in('item_id', toDelete)
      if (deleteError) console.error('Failed to soft delete items', deleteError)
    }
  } 

  // Update totals based on current items
  const { data: totalsData, error: totalsError } = await supabase
    .from('receiving_report_items')
    .select('quantity_received')
    .eq('report_id', reportId)
    .eq('is_deleted', false)
  if (totalsError) console.error('Failed to fetch totals', totalsError)
  else {
    const totalItems = totalsData.length
    const totalQuantity = totalsData.reduce((sum, item) => sum + (item.quantity_received || 0), 0)
    const { error: updateTotalsError } = await supabase
      .from('receiving_reports')
      .update({ total_items: totalItems, total_quantity: totalQuantity })
      .eq('report_id', reportId)
    if (updateTotalsError) console.error('Failed to update totals', updateTotalsError)
  }

  return data
}

receivingReportModel.listReports = async (filters = {}, page = 1, limit = 10) => {
  let query = supabase
    .from('receiving_reports')
    .select('*, received_by(user_id, surname, firstname, middlename)', { count: 'exact' })
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
  if (filters.status) query = query.eq('status', filters.status)
  if (filters.search) query = query.ilike('report_number', `%${filters.search}%`)
  if (filters.date_from) query = query.gte('delivery_date', filters.date_from)
  if (filters.date_to) query = query.lte('delivery_date', filters.date_to)
  const offset = (page - 1) * limit
  query = query.range(offset, offset + limit - 1)
  const { data, error, count } = await query
  if (error) throw error
  const items = (data || []).map(r => ({
    ...r,
    received_by_name: r.received_by && typeof r.received_by === 'object' ? fullName(r.received_by) : null
  }))
  return { items, totalCount: count || 0, page, limit, totalPages: count ? Math.ceil(count / limit) : 0 }
}

receivingReportModel.getReportById = async (reportId) => {
  const { data: header, error: e1 } = await supabase
    .from('receiving_reports')
    .select('*, received_by(user_id, surname, firstname, middlename)')
    .eq('report_id', reportId)
    .single()
  if (e1) throw e1
  const { data: items, error: e2 } = await supabase
    .from('receiving_report_items')
    .select('*, vaccinemaster(vaccine_id, antigen_name, brand_name, manufacturer, disease_prevented, vaccine_type, category)')
    .eq('report_id', reportId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: true })
  if (e2) throw e2
  return { header, items }
}

receivingReportModel.addItem = async (reportId, item, userId) => {
  const insert = {
    report_id: reportId,
    vaccine_id: item.vaccine_id && item.vaccine_id !== '' ? item.vaccine_id : null,
    antigen_name: item.antigen_name || null,
    brand_name: item.brand_name || null,
    manufacturer: item.manufacturer || null,
    lot_number: item.lot_number,
    expiration_date: item.expiration_date,
    quantity_received: item.quantity_received,
    storage_location: item.storage_location || null,
    unit_cost: item.unit_cost || null,
    remarks: item.remarks || null
  }
  const { data, error } = await supabase.from('receiving_report_items').insert(insert).select('*').single()
  if (error) throw error

  // Update totals in the report header
  const { data: totalsData, error: totalsError } = await supabase
    .from('receiving_report_items')
    .select('quantity_received')
    .eq('report_id', reportId)
    .eq('is_deleted', false)
  if (totalsError) console.error('Failed to fetch totals', totalsError)
  else {
    const totalItems = totalsData.length
    const totalQuantity = totalsData.reduce((sum, item) => sum + (item.quantity_received || 0), 0)
    const { error: updateError } = await supabase
      .from('receiving_reports')
      .update({ total_items: totalItems, total_quantity: totalQuantity })
      .eq('report_id', reportId)
    if (updateError) console.error('Failed to update totals', updateError)
  }

  return data
}

receivingReportModel.updateItem = async (itemId, item, userId) => {
  const update = {
    vaccine_id: item.vaccine_id && item.vaccine_id !== '' ? item.vaccine_id : null,
    antigen_name: item.antigen_name || null,
    brand_name: item.brand_name || null,
    manufacturer: item.manufacturer || null,
    lot_number: item.lot_number,
    expiration_date: item.expiration_date,
    quantity_received: item.quantity_received,
    storage_location: item.storage_location || null,
    unit_cost: item.unit_cost || null,
    remarks: item.remarks || null
  }
  const { data, error } = await supabase.from('receiving_report_items').update(update).eq('item_id', itemId).select('*').single()
  if (error) throw error

  // Update totals in the report header
  const reportId = data.report_id
  const { data: totalsData, error: totalsError } = await supabase
    .from('receiving_report_items')
    .select('quantity_received')
    .eq('report_id', reportId)
    .eq('is_deleted', false)
  if (totalsError) console.error('Failed to fetch totals', totalsError)
  else {
    const totalItems = totalsData.length
    const totalQuantity = totalsData.reduce((sum, item) => sum + (item.quantity_received || 0), 0)
    const { error: updateError } = await supabase
      .from('receiving_reports')
      .update({ total_items: totalItems, total_quantity: totalQuantity })
      .eq('report_id', reportId)
    if (updateError) console.error('Failed to update totals', updateError)
  }

  return data
}

receivingReportModel.completeReport = async (reportId, userId) => {
  // Prefer DB function to ensure transactional creation of inventory and transactions
  try {
    console.log('Calling RPC complete_receiving_report', { reportId, userId })
    const { error } = await supabase.rpc('complete_receiving_report', { p_report_id: reportId, p_user_id: userId })
    if (error) {
      console.log('RPC error', error)
      throw error
    }
    console.log('RPC success')
  } catch (err) {
    console.log('RPC failed, falling back to status update', err)
    // If RPC not available, at least mark status COMPLETED; inventory creation will be missing
    await supabase.from('receiving_reports').update({ status: 'COMPLETED', updated_by: userId || null }).eq('report_id', reportId)
  }
  // Return updated report
  return await receivingReportModel.getReportById(reportId)
}

receivingReportModel.cancelReport = async (reportId, userId, reason = null) => {
  try {
    const { error } = await supabase.rpc('cancel_receiving_report', { p_report_id: reportId, p_user_id: userId, p_reason: reason })
    if (error) throw error
  } catch (err) {
    await supabase.from('receiving_reports').update({ status: 'CANCELLED', updated_by: userId || null }).eq('report_id', reportId)
  }
  return await receivingReportModel.getReportById(reportId)
}

module.exports = receivingReportModel
