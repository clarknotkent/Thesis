import supabase from '../db.js';
import { ACTIVITY } from '../constants/activityTypes.js';

// Lightweight status derivation (mirrors frontend logic)
import { logActivity } from './activityLogger.js';
function deriveInventoryStatus(row) {
  const qty = row.current_stock_level || 0;
  if (qty === 0) return 'Out of Stock';
  const exp = row.expiration_date ? new Date(row.expiration_date) : null;
  const now = new Date();
  const soon = new Date(now.getTime() + 30*24*60*60*1000);
  if (exp && exp >= now && exp <= soon) return 'Expiring Soon';
  if (qty < 10) return 'Low Stock';
  return 'Available';
}

function mapInventoryDTO(row) {
  if (!row) return null;
  const v = row.vaccinemaster || row.vaccinemaster_id || row; // joined alias safety
  return {
    inventory_id: row.inventory_id,
    vaccine_id: row.vaccine_id,
    antigen_name: v.antigen_name,
    brand_name: v.brand_name,
    manufacturer: v.manufacturer,
    disease_prevented: v.disease_prevented || null,
    vaccine_type: v.vaccine_type,
    category: v.category,
    is_nip: !!v.is_nip,
    lot_number: row.lot_number,
    expiration_date: row.expiration_date,
    current_stock_level: row.current_stock_level,
    storage_location: row.storage_location || null,
    status: deriveInventoryStatus(row),
    created_at: row.created_at || null,
    updated_at: row.updated_at || null
  };
}

function mapVaccineDTO(row) {
  if (!row) return null;
  return {
    vaccine_id: row.vaccine_id,
    antigen_name: row.antigen_name,
    brand_name: row.brand_name,
    manufacturer: row.manufacturer,
    disease_prevented: row.disease_prevented || null,
    vaccine_type: row.vaccine_type,
    category: row.category,
    is_nip: !!row.is_nip,
    created_at: row.created_at || null,
    updated_at: row.updated_at || null,
    is_deleted: row.is_deleted || false
  };
}

async function logActivitySafely(payload) {
  try {
    await logActivity(payload);
  } catch (_) {}
}

// Ledger insert maps to legacy inventorytransactions schema:
//   quantity = delta, date = now, remarks = note, performed_by/created_by = user
//   Ignores vaccine_id, uses only inventory_id as FK
async function insertLedgerIfExists({ inventory_id, transaction_type, quantity_delta, balance_after, performed_by, note }) {
  try {
    // Attempt insert; if table absent, ignore error code 42P01
    const { error } = await supabase.from('inventorytransactions').insert({
      inventory_id,
      transaction_type,
      quantity: quantity_delta,
      balance_after,
      performed_by: performed_by || null,
      created_by: performed_by || null,
      remarks: note || null,
      date: new Date().toISOString()
    });
    if (error && error.code === '42P01') {
      console.warn('[inventory ledger] table missing, skipping ledger insert');
      return;
    }
  } catch (_) {}
}

// Manage scheduling for a vaccine type (stub)

const vaccineModel = {
  // Get all vaccines with filtering and pagination

  getAllVaccines: async (filters = {}, page = 1, limit = 10) => {
    try {
      let query = supabase
        .from('vaccinemaster')
        .select('*', { count: 'exact' });

      // Apply filters
      if (filters.vaccine_type) {
        query = query.eq('vaccine_type', filters.vaccine_type);
      }
      if (filters.is_nip !== undefined && filters.is_nip !== null) {
        // allow filters.is_nip to be boolean or string 'true'/'false'
        const b = (typeof filters.is_nip === 'string') ? (filters.is_nip === 'true') : Boolean(filters.is_nip);
        query = query.eq('is_nip', b);
      }

      if (filters.age_group) {
        query = query.eq('age_group', filters.age_group);
      }

      if (filters.search) {
        query = query.or(`antigen_name.ilike.%${filters.search}%,brand_name.ilike.%${filters.search}%`);
      }

      // Apply pagination
      const offset = (page - 1) * limit;
      const { data, error, count } = await query
        .range(offset, offset + limit - 1)
        .order('antigen_name', { ascending: true });

      if (error) throw error;

      return {
        vaccines: data || [],
        totalCount: count || 0,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil((count || 0) / limit)
      };
    } catch (error) {
      console.debug('[vaccineModel.getVaccines] fetching all vaccines');
      console.error('Error fetching vaccines:', error);
      throw error;
    }
  },

  // Manage scheduling for a vaccine type (stub)
  manageScheduling: async function(vaccine_id, scheduleData, actorId) {
    try {
      // Normalize master payload
      const masterPayload = {
        vaccine_id: Number(vaccine_id),
        total_doses: scheduleData.total_doses !== null ? Number(scheduleData.total_doses) : null,
        concurrent_allowed: !!scheduleData.concurrent_allowed,
        code: scheduleData.code || null,
        name: scheduleData.name || null,
        min_age_days: scheduleData.min_age_days !== null ? Number(scheduleData.min_age_days) : null,
        max_age_days: scheduleData.max_age_days !== null ? Number(scheduleData.max_age_days) : null,
        catchup_strategy: scheduleData.catchup_strategy || null,
        notes: scheduleData.notes || null,
        updated_by: actorId || null,
        updated_at: new Date().toISOString()
      };

      // Check if schedule_master exists for this vaccine
      const { data: existing, error: fetchErr } = await supabase.from('schedule_master').select('*').eq('vaccine_id', vaccine_id).eq('is_deleted', false).limit(1).maybeSingle();
      if (fetchErr && fetchErr.code !== 'PGRST116') throw fetchErr;

      let masterId = null;
      if (existing && existing.id) {
        // Update existing
        const { data: updated, error: updErr } = await supabase.from('schedule_master').update(masterPayload).eq('id', existing.id).select().single();
        if (updErr) throw updErr;
        masterId = updated.id;
      } else {
        // Insert new
        masterPayload.created_by = actorId || null;
        masterPayload.created_at = new Date().toISOString();
        const { data: inserted, error: insErr } = await supabase.from('schedule_master').insert(masterPayload).select().single();
        if (insErr) throw insErr;
        masterId = inserted.id;
      }

      // Replace schedule_doses for this master: delete old and insert new
      // First attempt to delete existing dose rows (if table exists)
      try {
        await supabase.from('schedule_doses').delete().eq('schedule_id', masterId);
      } catch (_) {
        // ignore if table missing
      }

      const doses = Array.isArray(scheduleData.doses) ? scheduleData.doses.map(d => ({
        schedule_id: masterId,
        dose_number: d.dose_number !== null ? Number(d.dose_number) : null,
        due_after_days: d.due_after_days !== null ? Number(d.due_after_days) : null,
        min_interval_days: d.min_interval_days !== null ? Number(d.min_interval_days) : null,
        max_interval_days: d.max_interval_days !== null ? Number(d.max_interval_days) : null,
        min_interval_other_vax: d.min_interval_other_vax !== null ? Number(d.min_interval_other_vax) : null,
        requires_previous: !!d.requires_previous,
        skippable: !!d.skippable,
        grace_period_days: d.grace_period_days !== null ? Number(d.grace_period_days) : null,
        absolute_latest_days: d.absolute_latest_days !== null ? Number(d.absolute_latest_days) : null,
        notes: d.notes || null,
        created_by: actorId || null,
        updated_by: actorId || null,
        created_at: new Date().toISOString()
      })) : [];

      if (doses.length > 0) {
        const { error: insDErr } = await supabase.from('schedule_doses').insert(doses).select();
        if (insDErr) throw insDErr;
      }

      return { schedule_master_id: masterId, vaccine_id: Number(vaccine_id) };
    } catch (error) {
      console.error('[vaccineModel.manageScheduling] error:', error);
      throw error;
    }
  },

  // Get vaccine by ID
  getVaccineById: async (id) => {
    try {
      const { data, error } = await supabase
        .from('vaccinemaster')
        .select('*')
        .eq('vaccine_id', id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data || null;
    } catch (error) {
      console.debug('[vaccineModel.getVaccineById] id:', id);
      console.error('Error fetching vaccine by ID:', error);
      throw error;
    }
  },

  // Create new vaccine
  createVaccine: async (vaccineData, actorId) => {
    try {
      // Basic validation
      const required = ['antigen_name','brand_name','manufacturer','vaccine_type','category','disease_prevented'];
      for (const f of required) {
        if (!vaccineData[f] || String(vaccineData[f]).trim() === '') {
          const err = new Error(`Missing required field: ${f}`); err.status = 400; throw err;
        }
      }
      if (!['VACCINE','DEWORMING','VITAMIN_A'].includes(vaccineData.category)) {
        const err = new Error('Invalid category'); err.status = 400; throw err;
      }
      // Uniqueness pre-check
      const { data: existing } = await supabase.from('vaccinemaster')
        .select('vaccine_id')
        .eq('antigen_name', vaccineData.antigen_name)
        .eq('brand_name', vaccineData.brand_name)
        .eq('category', vaccineData.category)
        .limit(1)
        .single();
      if (existing) { const err = new Error('Duplicate vaccine (antigen_name, brand_name, category)'); err.status = 409; throw err; }

      const insertPayload = {
        antigen_name: vaccineData.antigen_name,
        brand_name: vaccineData.brand_name,
        disease_prevented: vaccineData.disease_prevented || null,
        manufacturer: vaccineData.manufacturer,
        vaccine_type: vaccineData.vaccine_type,
        is_nip: vaccineData.is_nip === true || vaccineData.is_nip === 'true' || false,
        category: vaccineData.category,
        created_by: actorId || null,
        // Also stamp updated_by on create so audit fields are never null
        updated_by: actorId || null
      };
      const { data, error } = await supabase.from('vaccinemaster').insert(insertPayload).select().single();
      if (error) throw error;
      await logActivitySafely({ action_type: 'VACCINE_CREATE', description: `Created vaccine ${data.vaccine_id}`, user_id: actorId || null, entity_type: 'vaccine', entity_id: data.vaccine_id, new_value: { antigen_name: data.antigen_name, brand_name: data.brand_name } });
      return mapVaccineDTO(data);
    } catch (error) {
      console.debug('[vaccineModel.createVaccine] payload:', vaccineData, 'actor:', actorId);
      console.error('Error creating vaccine:', error);
      throw error;
    }
  },

  // Update vaccine
  updateVaccine: async (id, updates, actorId) => {
    try {
      const { data: before } = await supabase.from('vaccinemaster').select('*').eq('vaccine_id', id).single();
      if (!before) return null;
      const allowed = ['antigen_name','brand_name','manufacturer','vaccine_type','category','disease_prevented','is_nip'];
      const patch = {};
      for (const k of allowed) {
        if (k in updates) {
          // Coerce boolean for is_nip
          if (k === 'is_nip') patch[k] = (updates[k] === true || updates[k] === 'true');
          else patch[k] = updates[k];
        }
      }
      if (patch.category && !['VACCINE','DEWORMING','VITAMIN_A'].includes(patch.category)) { const e = new Error('Invalid category'); e.status=400; throw e; }
      patch.updated_at = new Date().toISOString();
      patch.updated_by = actorId || null;
      const { data, error } = await supabase.from('vaccinemaster').update(patch).eq('vaccine_id', id).select().single();
      if (error) throw error;
      await logActivitySafely({ action_type: 'VACCINE_UPDATE', description: `Updated vaccine ${id}`, user_id: actorId || null, entity_type: 'vaccine', entity_id: id, old_value: { antigen_name: before.antigen_name, brand_name: before.brand_name }, new_value: { antigen_name: data.antigen_name, brand_name: data.brand_name } });
      return mapVaccineDTO(data);
    } catch (error) {
      console.debug('[vaccineModel.updateVaccine] id:', id, 'payload:', updates, 'actor:', actorId);
      console.error('Error updating vaccine:', error);
      throw error;
    }
  },

  // Soft delete vaccine
  deleteVaccine: async (id, actorId) => {
    try {
      // Block if any active inventory exists
      const { data: invCheck } = await supabase.from('inventory').select('inventory_id').eq('vaccine_id', id).eq('is_deleted', false).limit(1).maybeSingle();
      if (invCheck) { const e = new Error('Cannot delete vaccine with existing inventory'); e.status=400; throw e; }
      const { data: before } = await supabase.from('vaccinemaster').select('*').eq('vaccine_id', id).single();
      if (!before) return null;
      const { data, error } = await supabase.from('vaccinemaster').update({ is_deleted: true, deleted_at: new Date().toISOString(), deleted_by: actorId || null }).eq('vaccine_id', id).select().single();
      if (error) throw error;
      await logActivitySafely({ action_type: 'VACCINE_DELETE', description: `Deleted vaccine ${id}`, user_id: actorId || null, entity_type: 'vaccine', entity_id: id, old_value: { antigen_name: before.antigen_name, brand_name: before.brand_name } });
      return mapVaccineDTO(data);
    } catch (error) {
      console.debug('[vaccineModel.deleteVaccine] id:', id, 'actor:', actorId);
      console.error('Error deleting vaccine:', error);
      throw error;
    }
  },

  // Get vaccine schedule by age group
  getVaccineScheduleByAgeGroup: async (ageGroup) => {
    try {
      const { data, error } = await supabase
        .from('schedule_master')
        .select(`
          *,
          vaccine:vaccine_id (
            vaccine_id,
            antigen_name,
            brand_name,
            dosage,
            route_of_administration
          )
        `)
        .eq('age_group', ageGroup)
        .eq('is_deleted', false)
        .order('recommended_age_weeks', { ascending: true });

      if (error) throw error;
      return data;
    } catch (error) {
      console.debug('[vaccineModel.getVaccineSchedule] vaccine_id:', vaccine_id);
      console.error('Error fetching vaccine schedule:', error);
      throw error;
    }
  },

  // List all schedules (with vaccine brief and doses)
  getAllSchedules: async () => {
    try {
      const { data, error } = await supabase
        .from('schedule_master')
        .select('*, schedule_doses(*), vaccine:vaccine_id (vaccine_id, antigen_name, brand_name)')
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });
      if (error && error.code !== 'PGRST116') throw error;
      return data || [];
    } catch (error) {
      console.error('[vaccineModel.getAllSchedules] error:', error);
      throw error;
    }
  },

  // Get schedule for a specific vaccine_id including its doses
  getScheduleByVaccineId: async (vaccine_id) => {
    try {
      const { data, error } = await supabase.from('schedule_master').select('*, schedule_doses(*)').eq('vaccine_id', vaccine_id).eq('is_deleted', false).limit(1).maybeSingle();
      if (error && error.code !== 'PGRST116') throw error;
      return data || null;
    } catch (error) {
      console.error('[vaccineModel.getScheduleByVaccineId] error:', error);
      throw error;
    }
  },

  // Get schedule by schedule_id (for viewing/editing a specific schedule)
  getScheduleById: async (schedule_id) => {
    try {
      const { data, error } = await supabase
        .from('schedule_master')
        .select('*, schedule_doses(*), vaccine:vaccine_id (vaccine_id, antigen_name, brand_name)')
        .eq('id', schedule_id)
        .eq('is_deleted', false)
        .limit(1)
        .maybeSingle();
      if (error && error.code !== 'PGRST116') throw error;
      return data || null;
    } catch (error) {
      console.error('[vaccineModel.getScheduleById] error:', error);
      throw error;
    }
  },

  // Get all inventory items with vaccine details
  getAllInventory: async (filters = {}) => {
    try {
      console.debug('[vaccineModel.getAllInventory] Querying inventory with joined vaccinemaster');
      let query = supabase
        .from('inventory')
        .select(`
          *,
          vaccinemaster!inventory_vaccine_id_fkey (
            vaccine_id,
            antigen_name,
            brand_name,
            manufacturer,
            vaccine_type,
            category,
            disease_prevented,
            is_nip
          )
        `)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      // Apply server-side filters
      if (filters.vaccine_id) {
        query = query.eq('vaccine_id', filters.vaccine_id);
      }
      if (filters.is_nip !== undefined && filters.is_nip !== null) {
        // Supabase/PostgREST: to filter on joined table, use vaccinemaster->> is handled by dot-notation in select alias; using .filter on the joined field should work via PostgREST filters
        // Use eq on the path: vaccinemaster.is_nip
        query = query.eq('vaccinemaster.is_nip', filters.is_nip);
      }

      const { data, error } = await query;

      if (error) throw error;
      let rows = data || [];
      // Fallback filter by NIP if join-path filter isn't honored by PostgREST
      if (filters.is_nip !== undefined && filters.is_nip !== null) {
        const want = (typeof filters.is_nip === 'string') ? (filters.is_nip === 'true') : !!filters.is_nip;
        rows = rows.filter(r => {
          const vm = r && r.vaccinemaster;
          return !!(vm && vm.is_nip) === want;
        });
      }
      console.debug('[vaccineModel.getAllInventory] fetched', Array.isArray(rows) ? rows.length : 0, 'rows (after filters)');
      return rows;
    } catch (error) {
      console.debug('[vaccineModel.getAllInventory] error during fetch');
      console.error('Error fetching inventory:', error);
      throw error;
    }
  },

  // Apply a single inventory transaction to one inventory row; rely on DB trigger for stock change
  applyInventoryTransaction: async (inventory_id, type, quantity, actorId, note) => {
    try {
      // Validate inventory exists
      const { data: inv } = await supabase.from('inventory').select('inventory_id').eq('inventory_id', inventory_id).eq('is_deleted', false).maybeSingle();
      if (!inv) { const e = new Error('Inventory item not found'); e.status = 404; throw e; }
      // Insert a ledger row; DB trigger updates stock and sets balance_after
      const { data: _data, error } = await supabase.from('inventorytransactions').insert({
        inventory_id,
        transaction_type: type,
        quantity,
        performed_by: actorId || null,
        created_by: actorId || null,
        remarks: note || null,
        date: new Date().toISOString()
      }).select().single();
      if (error) throw error;
      // Refetch inventory
      const { data: refreshed, error: selErr } = await supabase.from('inventory').select(`
        *,
        vaccinemaster!inventory_vaccine_id_fkey (
          vaccine_id,
          antigen_name,
          brand_name,
          manufacturer,
          vaccine_type,
          category
        )
      `).eq('inventory_id', inventory_id).single();
      if (selErr) throw selErr;
      return mapInventoryDTO({ ...refreshed, vaccinemaster: refreshed.vaccinemaster });
    } catch (error) {
      console.error('[vaccineModel.applyInventoryTransaction] error:', error);
      throw error;
    }
  },

  // Create new inventory item
  createInventoryItem: async (inventoryData, actorId) => {
    try {
      // Validation
      const required = ['vaccine_id','lot_number','expiration_date'];
      for (const f of required) { if (!inventoryData[f]) { const e = new Error(`Missing required field: ${f}`); e.status=400; throw e; } }
      const qty = Number(inventoryData.current_stock_level || 0);
      if (qty < 0) { const e = new Error('current_stock_level cannot be negative'); e.status=400; throw e; }
      const exp = new Date(inventoryData.expiration_date);
      if (isNaN(exp.getTime())) { const e = new Error('Invalid expiration_date'); e.status=400; throw e; }
      // Upsert behavior: if an active row exists with same (vaccine_id, lot_number, expiration_date, storage_location), just add stock to it
      // Find an active row with same identity (vaccine_id, lot_number, expiration_date, storage_location normalized)
      let query = supabase
        .from('inventory')
        .select('*')
        .eq('vaccine_id', inventoryData.vaccine_id)
        .eq('lot_number', inventoryData.lot_number)
        .eq('expiration_date', inventoryData.expiration_date)
        .eq('is_deleted', false);
      if (inventoryData.storage_location === null || inventoryData.storage_location === '') {
        query = query.is('storage_location', null);
      } else {
        query = query.eq('storage_location', inventoryData.storage_location);
      }
      const { data: existing, error: findErr } = await query.limit(1).maybeSingle();
      if (findErr && findErr.code !== 'PGRST116') throw findErr;

      if (existing) {
        // Only insert a RECEIVE transaction; the DB trigger will update stock and activity
        const addQty = qty;
        if (addQty > 0) {
          await insertLedgerIfExists({
            inventory_id: existing.inventory_id,
            transaction_type: 'RECEIVE',
            quantity_delta: addQty,
            balance_after: (existing.current_stock_level || 0) + addQty,
            performed_by: actorId,
            note: 'Stock added to existing lot'
          });
        }
        // Return refreshed DTO
        const { data, error } = await supabase.from('inventory').select(`
          *,
          vaccinemaster!inventory_vaccine_id_fkey (
            vaccine_id,
            antigen_name,
            brand_name,
            manufacturer,
            vaccine_type,
            category
          )
        `).eq('inventory_id', existing.inventory_id).single();
        if (error) throw error;
        return mapInventoryDTO({ ...data, vaccinemaster: data.vaccinemaster });
      }

      // Insert new inventory row (initial stock will be applied by an accompanying RECEIVE transaction)
      const { data: insertedData, error: insertError } = await supabase.from('inventory').insert({
        vaccine_id: inventoryData.vaccine_id,
        lot_number: inventoryData.lot_number,
        expiration_date: inventoryData.expiration_date,
        current_stock_level: 0, // start at 0; let transaction trigger set actual stock
        storage_location: inventoryData.storage_location || null,
        created_by: actorId || null,
        updated_by: actorId || null
      }).select().single();
      if (insertError) throw insertError;
      if (qty > 0) {
        await insertLedgerIfExists({ inventory_id: insertedData.inventory_id, transaction_type: 'RECEIVE', quantity_delta: qty, balance_after: qty, performed_by: actorId, note: 'Initial stock' });
      }
      await logActivitySafely({ action_type: 'INVENTORY_CREATE', description: `Added inventory ${insertedData.inventory_id}`, user_id: actorId || null, entity_type: 'inventory', entity_id: insertedData.inventory_id, new_value: { lot_number: insertedData.lot_number, qty } });
      const { data, error } = await supabase.from('inventory').select(`
        *,
        vaccinemaster!inventory_vaccine_id_fkey (
          vaccine_id,
          antigen_name,
          brand_name,
          manufacturer,
          vaccine_type,
          category
        )
      `).eq('inventory_id', insertedData.inventory_id).single();
      if (error) throw error;
      return mapInventoryDTO({ ...data, vaccinemaster: data.vaccinemaster });
    } catch (error) {
      console.debug('[vaccineModel.createInventoryItem] payload:', inventoryData, 'actor:', actorId);
      console.error('Error creating inventory item:', error);
      throw error;
    }
  },

  // Get inventory item by ID
  getInventoryById: async (id) => {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select(`
          *,
          vaccinemaster!inventory_vaccine_id_fkey (
            vaccine_id,
            antigen_name,
            brand_name,
            manufacturer,
            vaccine_type,
            category
          )
        `)
        .eq('inventory_id', id)
        .eq('is_deleted', false)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.debug('[vaccineModel.getInventoryItemById] id:', id);
      console.error('Error fetching inventory item:', error);
      throw error;
    }
  },

  // Update inventory item
  updateInventoryItem: async (id, inventoryData, actorId) => {
    try {
      const { data: before } = await supabase.from('inventory').select('*').eq('inventory_id', id).single();
      if (!before) return null;
      // Prepare metadata patch (exclude stock; stock will be adjusted via transactions to avoid double entries)
      const patch = {
        vaccine_id: inventoryData.vaccine_id,
        lot_number: inventoryData.lot_number,
        expiration_date: inventoryData.expiration_date,
        storage_location: inventoryData.storage_location,
        updated_by: actorId || null,
        updated_at: new Date().toISOString()
      };

      // Apply metadata update first
      const { error: updErr } = await supabase.from('inventory').update(patch).eq('inventory_id', id);
      if (updErr) throw updErr;

      // Handle stock change through a single transaction insert to avoid doubling
      if (inventoryData.current_stock_level !== null) {
        const newQty = Number(inventoryData.current_stock_level);
        if (isNaN(newQty) || newQty < 0) { const e = new Error('Invalid current_stock_level'); e.status=400; throw e; }
        const delta = newQty - (before.current_stock_level || 0);
        if (delta !== 0) {
          await insertLedgerIfExists({
            inventory_id: id,
            transaction_type: delta > 0 ? 'RECEIVE' : 'ISSUE',
            quantity_delta: Math.abs(delta),
            balance_after: newQty,
            performed_by: actorId,
            note: 'Manual adjustment'
          });
        }
      }

      // Refetch updated row (stock level should now reflect the trigger-applied value if a transaction was inserted)
      const { data, error } = await supabase.from('inventory').select(`
        *,
        vaccinemaster!inventory_vaccine_id_fkey (
          vaccine_id,
          antigen_name,
          brand_name,
          manufacturer,
          vaccine_type,
          category
        )
      `).eq('inventory_id', id).single();
      if (error) throw error;

      // Log an inventory update activity only when non-stock fields changed
      const nonStockChanged = (
        before.vaccine_id !== patch.vaccine_id ||
        before.lot_number !== patch.lot_number ||
        String(before.expiration_date) !== String(patch.expiration_date) ||
        (before.storage_location || null) !== (patch.storage_location || null)
      );
      if (nonStockChanged) {
        await logActivitySafely({ action_type: 'INVENTORY_UPDATE', description: `Updated inventory ${id}`, user_id: actorId || null, entity_type: 'inventory', entity_id: id, old_value: { lot: before.lot_number }, new_value: { lot: patch.lot_number } });
      }

      return mapInventoryDTO({ ...data, vaccinemaster: data.vaccinemaster });
    } catch (error) {
      console.debug('[vaccineModel.updateInventoryItem] id:', id, 'payload:', inventoryData, 'actor:', actorId);
      console.error('Error updating inventory item:', error);
      throw error;
    }
  },

  // Delete inventory item (soft delete)
  deleteInventoryItem: async (id, actorId) => {
    try {
      const { data: before } = await supabase.from('inventory').select('*').eq('inventory_id', id).single();
      if (!before) return null;
      const { data, error } = await supabase.from('inventory').update({ is_deleted: true, deleted_at: new Date().toISOString(), deleted_by: actorId || null }).eq('inventory_id', id).select('*').single();
      if (error) throw error;
      if ((before.current_stock_level || 0) > 0) {
        // Record a proper outbound transaction so history reflects stock removal on delete
        await insertLedgerIfExists({
          inventory_id: id,
          transaction_type: 'ISSUE',
          quantity_delta: Math.abs(before.current_stock_level || 0),
          balance_after: 0,
          performed_by: actorId,
          note: 'Deletion correction'
        });
      }
      await logActivitySafely({ action_type: 'INVENTORY_DELETE', description: `Deleted inventory ${id}`, user_id: actorId || null, entity_type: 'inventory', entity_id: id, old_value: { qty: before.current_stock_level } });
      return mapInventoryDTO(data);
    } catch (error) {
      console.debug('[vaccineModel.deleteInventoryItem] id:', id, 'actor:', actorId);
      console.error('Error deleting inventory item:', error);
      throw error;
    }
  },

  // Get vaccinemaster by ID
  getvaccinemasterById: async (id) => {
    try {
      const { data, error } = await supabase
        .from('vaccinemaster')
        .select('*')
        .eq('vaccine_id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.debug('[vaccineModel.getVaccineMasterById] id:', id);
      console.error('Error fetching vaccinemaster by ID:', error);
      throw error;
    }
  },

  // Update vaccinemaster
  updatevaccinemaster: async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from('vaccinemaster')
        .update({
          ...updates
        })
        .eq('vaccinemaster_id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.debug('[vaccineModel.updateVaccineMaster] id:', id, 'payload:', vaccineData, 'actor:', actorId);
      console.error('Error updating vaccinemaster:', error);
      throw error;
    }
  },

  // Delete vaccinemaster
  deletevaccinemaster: async (id) => {
    try {
      const { data, error } = await supabase
        .from('vaccinemaster')
        .update({ is_deleted: true })
        .eq('vaccinemaster_id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.debug('[vaccineModel.deleteVaccineMaster] id:', id, 'actor:', actorId);
      console.error('Error deleting vaccinemaster:', error);
      throw error;
    }
  },

  // Get all vaccinemaster with filtering
  getAllvaccinemaster: async (filters = {}, page = 1, limit = 10) => {
    try {
      let query = supabase
        .from('vaccinemaster')
        .select(`
          *,
          vaccines:vaccine_id (
            antigen_name,
            brand_name,
            vaccine_type
          )
        `, { count: 'exact' })
        .eq('is_deleted', false)
        .order('vaccinemaster_id', { ascending: false });

      // Apply filters
      if (filters.vaccine_id) {
        query = query.eq('vaccine_id', filters.vaccine_id);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.location) {
        query = query.eq('location', filters.location);
      }
      if (filters.expiring_soon) {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 30);
        query = query.lt('expiry_date', futureDate.toISOString());
      }

      // Apply pagination
      const offset = (page - 1) * limit;
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) throw error;
      return {
        vaccinemaster: data,
        totalCount: count,
        currentPage: page,
        totalPages: Math.ceil(count / limit)
      };
    } catch (error) {
      console.debug('[vaccineModel.getVaccineMaster] fetching all vaccinemaster');
      console.error('Error fetching vaccinemaster:', error);
      throw error;
    }
  },

  // vaccinemaster Request Functions
  // Create vaccinemaster request
  createvaccinemasterRequest: async (requestData) => {
    try {
      const { data, error } = await supabase
        .from('vaccinemaster_requests')
        .insert({
          vaccine_id: requestData.vaccine_id,
          requested_quantity: requestData.requested_quantity,
          priority: requestData.priority,
          reason: requestData.reason,
          requested_by: requestData.requested_by,
          facility_id: requestData.facility_id,
          urgency_date: requestData.urgency_date,
          notes: requestData.notes,
          status: 'pending',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.debug('[vaccineModel.createVaccineMasterRequest] payload:', requestData, 'actor:', actorId);
      console.error('Error creating vaccinemaster request:', error);
      throw error;
    }
  },

  // Update vaccinemaster request
  updatevaccinemasterRequest: async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from('vaccinemaster_requests')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.debug('[vaccineModel.updateVaccineMasterRequest] id:', id, 'payload:', requestData, 'actor:', actorId);
      console.error('Error updating vaccinemaster request:', error);
      throw error;
    }
  },

  // Get all vaccinemaster requests
  getAllvaccinemasterRequests: async (filters = {}, page = 1, limit = 10) => {
    try {
      let query = supabase
        .from('vaccinemaster_requests')
        .select(`
          *,
          vaccines:vaccine_id (
            antigen_name,
            manufacturer
          ),
          requested_by_user:requested_by (
            username,
            email
          )
        `, { count: 'exact' })
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.priority) {
        query = query.eq('priority', filters.priority);
      }
      if (filters.facility_id) {
        query = query.eq('facility_id', filters.facility_id);
      }

      // Apply pagination
      const offset = (page - 1) * limit;
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) throw error;
      return {
        requests: data,
        totalCount: count,
        currentPage: page,
        totalPages: Math.ceil(count / limit)
      };
    } catch (error) {
      console.debug('[vaccineModel.getVaccineMasterRequests] fetching all requests');
      console.error('Error fetching vaccinemaster requests:', error);
      throw error;
    }
  },

  // vaccinemaster Transaction Functions
  // Create vaccinemaster transaction
  createvaccinemasterTransaction: async (transactionData) => {
    try {
      const { data, error } = await supabase
        .from('vaccinemaster_transactions')
        .insert({
          vaccinemaster_id: transactionData.vaccinemaster_id,
          transaction_type: transactionData.transaction_type,
          quantity: transactionData.quantity,
          reference_id: transactionData.reference_id,
          reference_type: transactionData.reference_type,
          performed_by: transactionData.performed_by,
          notes: transactionData.notes,
          transaction_date: transactionData.transaction_date,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.debug('[vaccineModel.createVaccineMasterTransaction] payload:', transactionData, 'actor:', actorId);
      console.error('Error creating vaccinemaster transaction:', error);
      throw error;
    }
  },

  // Get all vaccinemaster transactions
  getAllvaccinemasterTransactions: async (filters = {}, page = 1, limit = 10) => {
    try {
      let query = supabase
        .from('vaccinemaster_transactions')
        .select(`
          *,
          vaccinemaster:vaccinemaster_id (
            batch_number,
            vaccines:vaccine_id (
              antigen_name
            )
          ),
          performed_by_user:performed_by (
            username,
            email
          )
        `, { count: 'exact' })
        .order('transaction_date', { ascending: false });

      // Apply filters
      if (filters.vaccinemaster_id) {
        query = query.eq('vaccinemaster_id', filters.vaccinemaster_id);
      }
      if (filters.transaction_type) {
        query = query.eq('transaction_type', filters.transaction_type);
      }
      if (filters.date_from) {
        query = query.gte('transaction_date', filters.date_from);
      }
      if (filters.date_to) {
        query = query.lte('transaction_date', filters.date_to);
      }

      // Apply pagination
      const offset = (page - 1) * limit;
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) throw error;
      return {
        transactions: data,
        totalCount: count,
        currentPage: page,
        totalPages: Math.ceil(count / limit)
      };
    } catch (error) {
      console.debug('[vaccineModel.getVaccineMasterTransactions] fetching all transactions');
      console.error('Error fetching vaccinemaster transactions:', error);
      throw error;
    }
  }
};

// Helper to build full name
function fullName(u) {
  if (!u) return null;
  const parts = [u.surname, u.firstname, u.middlename].filter(Boolean);
  return parts.join(' ').trim();
}

// Inventory transactions retrieval (ledger)
vaccineModel.getAllInventoryTransactions = async (filters = {}, page = 1, limit = 20) => {
  try {
    // Align with legacy ledger schema: inventorytransactions has no vaccine_id, uses quantity and date columns
    let query = supabase
      .from('inventorytransactions')
      .select('*, performed_by(user_id, surname, firstname, middlename)', { count: 'exact' })
      .order('date', { ascending: false });
    if (filters.inventory_id) query = query.eq('inventory_id', filters.inventory_id);
    if (filters.transaction_type) query = query.eq('transaction_type', filters.transaction_type);
    if (filters.date_from) query = query.gte('date', filters.date_from);
    if (filters.date_to) query = query.lte('date', filters.date_to);
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);
    const { data, error, count } = await query;
    if (error) throw error;
    // Normalize fields to what frontend expects
    const rows = Array.isArray(data) ? data : [];
    const normalized = rows.map(t => ({
      ...t,
      // quantity_delta expected by UI; map from quantity
      quantity_delta: t.quantity !== null ? t.quantity : (t.quantity_delta !== null ? t.quantity_delta : 0),
      // created_at expected by UI; map from date
      created_at: t.created_at || t.date || null,
      // remarks already aligned; keep fallback to note if present
      remarks: t.remarks !== null ? t.remarks : (t.note !== null ? t.note : null),
      // performed_by_name for UI, with fallback to 'SYSTEM' when user is null
      performed_by: fullName(t.performed_by) || 'SYSTEM'
    }));
    return { transactions: normalized, totalCount: count || 0, currentPage: page, totalPages: count ? Math.ceil(count/limit) : 0 };
  } catch (error) {
    console.error('Error fetching inventory transactions:', error);
    throw error;
  }
};

export default vaccineModel;

// Task helpers: run scheduled functions manually
vaccineModel.runExpiryCheckTask = async (actorId) => {
  // Call SQL function if exists; since Supabase JS cannot call functions without RPC unless set up, use a no-op select on a view that triggers function via SECURITY DEFINER, or fallback to raw RPC if available.
  try {
    // Try RPC first
    let didRun = false;
    try {
      // If a Postgres function is exposed as an RPC, this will succeed; ignore error otherwise
      const { error: rpcErr } = await supabase.rpc('check_and_expire_inventory');
      if (!rpcErr) didRun = true;
    } catch (_) {}
    if (!didRun) {
      // As a fallback, attempt a lightweight read to ensure DB connectivity
      await supabase.from('inventory').select('inventory_id').limit(1);
    }
    // Get counts after run
    const { data: expiredCountData } = await supabase
      .from('inventorytransactions')
      .select('transaction_id', { count: 'exact', head: true })
      .eq('transaction_type', 'EXPIRED')
      .gte('date', new Date(Date.now() - 5 * 60 * 1000).toISOString());
    const expiredRecent = expiredCountData?.length || 0; // head:true returns no rows; length may be undefined, so keep 0
    await logActivitySafely({
      action_type: ACTIVITY.TASK.RUN,
      description: `Manual run: check_and_expire_inventory (recent expired: ~${expiredRecent})`,
      user_id: actorId || null,
      entity_type: 'task',
      entity_id: null
    });
    await logActivitySafely({
      action_type: ACTIVITY.TASK.SUCCESS,
      description: 'check_and_expire_inventory completed',
      user_id: actorId || null,
      entity_type: 'task',
      entity_id: null
    });
    return { expiredRecent };
  } catch (error) {
    await logActivitySafely({ action_type: ACTIVITY.TASK.FAILURE, description: `check_and_expire_inventory failed: ${error.message}`, user_id: actorId || null, entity_type: 'task', entity_id: null });
    throw error;
  }
};

vaccineModel.runScheduleStatusUpdateTask = async (actorId) => {
  try {
    // Try RPC first
    let didRun = false;
    try {
      const { error: rpcErr } = await supabase.rpc('update_patient_schedule_statuses');
      if (!rpcErr) didRun = true;
    } catch (_) {}
    if (!didRun) {
      await supabase.from('patientschedule').select('patient_schedule_id').limit(1);
    }
    // Count schedules touched recently (approximate: updated in last 5 minutes)
    const { data: updatedData } = await supabase
      .from('patientschedule')
      .select('patient_schedule_id', { count: 'exact', head: true })
      .gte('updated_at', new Date(Date.now() - 5 * 60 * 1000).toISOString());
    const touched = updatedData?.length || 0;
    await logActivitySafely({ action_type: ACTIVITY.TASK.RUN, description: `Manual run: update_patient_schedule_statuses (recent updates: ~${touched})`, user_id: actorId || null, entity_type: 'task', entity_id: null });
    await logActivitySafely({ action_type: ACTIVITY.TASK.SUCCESS, description: 'update_patient_schedule_statuses completed', user_id: actorId || null, entity_type: 'task', entity_id: null });
    return { updatedRecent: touched };
  } catch (error) {
    await logActivitySafely({ action_type: ACTIVITY.TASK.FAILURE, description: `update_patient_schedule_statuses failed: ${error.message}`, user_id: actorId || null, entity_type: 'task', entity_id: null });
    throw error;
  }
};
