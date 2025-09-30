const serviceSupabase = require('../db');

// Helper to use provided client or default service client
function withClient(client) {
  return client || serviceSupabase;
}

// Create a new immunization record
const createImmunization = async (immunizationData, client) => {
  const supabase = withClient(client);
  // Derive fields and defaults
  const payload = { ...immunizationData };
  
  // Resolve vaccine_id from inventory_id if present
  if (!payload.vaccine_id && payload.inventory_id) {
    const { data: inv, error: invErr } = await supabase
      .from('inventory')
      .select('vaccine_id')
      .eq('inventory_id', payload.inventory_id)
      .single();
    if (invErr || !inv) {
      throw new Error('Unable to resolve vaccine_id from inventory_id');
    }
    payload.vaccine_id = inv.vaccine_id;
  }
  // Compute age_at_administration if missing and patient_id with DOB available from view
  if (!payload.age_at_administration && payload.patient_id && payload.administered_date) {
    try {
      const { data: p, error: pErr } = await supabase
        .from('patients_view')
        .select('date_of_birth')
        .eq('patient_id', payload.patient_id)
        .single();
      if (!pErr && p && p.date_of_birth) {
        const dob = new Date(p.date_of_birth);
        const adm = new Date(payload.administered_date);
        const diffMs = adm - dob;
        const days = Math.floor(diffMs / (1000*60*60*24));
        const months = Math.floor(days / 30.44);
        const remDays = Math.max(0, Math.round(days - months * 30.44));
        payload.age_at_administration = `${months}m ${remDays}d`;
      }
    } catch(_) {}
  }
  // Ensure created_by/updated_by present
  if (!payload.created_by && payload.administered_by) payload.created_by = payload.administered_by;
  if (!payload.updated_by && payload.administered_by) payload.updated_by = payload.administered_by;

  // Per policy: update Patient Schedule to 'Completed' BEFORE inserting immunization record
  try {
    if (payload.patient_id && payload.vaccine_id && payload.dose_number && payload.administered_date) {
      console.log('[createImmunization] Calling recalc_patient_schedule_enhanced (pre-insert):', {
        patient_id: payload.patient_id,
        vaccine_id: payload.vaccine_id,
        dose_number: payload.dose_number,
        administered_date: payload.administered_date,
        user_id: payload.administered_by || null
      });
      
      // Test if RPC function exists first
      const { data: rpcResult, error: rpcErr } = await supabase.rpc('recalc_patient_schedule_enhanced', {
        p_patient_id: payload.patient_id,
        p_vaccine_id: payload.vaccine_id,
        p_dose_number: payload.dose_number,
        p_actual_date: payload.administered_date,
        p_user_id: payload.administered_by || null
      });
      
      if (rpcErr) {
        console.error('[createImmunization] Pre-insert RPC recalc_patient_schedule_enhanced failed:', {
          error: rpcErr,
          params: {
            p_patient_id: payload.patient_id,
            p_vaccine_id: payload.vaccine_id,
            p_dose_number: payload.dose_number,
            p_actual_date: payload.administered_date,
            p_user_id: payload.administered_by || null
          }
        });
        // Don't throw here - allow immunization to proceed, but log the error
      } else {
        console.log('[createImmunization] Pre-insert RPC recalc_patient_schedule_enhanced succeeded:', rpcResult);
      }
    }
  } catch (rpcPreErr) {
    console.error('[createImmunization] Pre-insert RPC call error:', rpcPreErr);
  }

  const { data, error } = await supabase
    .from('immunizations')
    .insert([payload])
    .select()
    .single();
  if (error) throw error;

  // After successful immunization insert, call DB helper to mark schedule completed and recompute
  try {
    if (data && data.patient_id && data.vaccine_id && data.dose_number && data.administered_date) {
      console.log('[createImmunization] Calling recalc_patient_schedule_enhanced (post-insert):', {
        patient_id: data.patient_id,
        vaccine_id: data.vaccine_id,
        dose_number: data.dose_number,
        administered_date: data.administered_date,
        user_id: payload.administered_by || null
      });
      
      const { data: rpcResult, error: rpcErr } = await supabase.rpc('recalc_patient_schedule_enhanced', {
        p_patient_id: data.patient_id,
        p_vaccine_id: data.vaccine_id,
        p_dose_number: data.dose_number,
        p_actual_date: data.administered_date,
        p_user_id: payload.administered_by || null
      });
      
      if (rpcErr) {
        console.error('[createImmunization] Post-insert RPC recalc_patient_schedule_enhanced failed:', rpcErr);
        
        // Fallback: Directly update the schedule status to Completed
        console.log('[createImmunization] Attempting direct schedule status update...');
        try {
          // Find the schedule first
          const { data: scheduleData, error: findErr } = await supabase
            .from('patientschedule')
            .select('patient_schedule_id')
            .eq('patient_id', data.patient_id)
            .eq('vaccine_id', data.vaccine_id)
            .eq('dose_number', data.dose_number)
            .eq('is_deleted', false)
            .single();
            
          if (findErr || !scheduleData) {
            console.error('[createImmunization] Could not find schedule to update:', findErr);
          } else {
            // Update the schedule by ID
            const { data: updateData, error: updateErr } = await supabase
              .from('patientschedule')
              .update({
                status: 'Completed',
                actual_date: data.administered_date,
                updated_at: new Date().toISOString(),
                updated_by: payload.administered_by || null
              })
              .eq('patient_schedule_id', scheduleData.patient_schedule_id)
              .select();
              
            if (updateErr) {
              console.error('[createImmunization] Direct schedule update failed:', updateErr);
            } else {
              console.log('[createImmunization] Direct schedule update succeeded');
              
              // Log the schedule completion
              await supabase.from('activitylogs').insert({
                action_type: 'SCHEDULE_UPDATE',
                user_id: payload.administered_by || null,
                entity_type: 'patientschedule',
                entity_id: scheduleData.patient_schedule_id,
                description: `Schedule marked as Completed due to immunization administration`,
                timestamp: new Date().toISOString()
              });
            }
          }
        } catch (directErr) {
          console.error('[createImmunization] Direct schedule update error:', directErr);
        }
      } else {
        console.log('[createImmunization] Post-insert RPC recalc_patient_schedule_enhanced succeeded');
      }
    }
  } catch (rpcErr) {
    console.error('[createImmunization] Post-insert RPC call error:', rpcErr);
    // Uncomment below to make immunization fail if schedule update fails
    // throw rpcErr;
  }
  return data;
};

// Get immunization by ID (base table OK; separate view exists for history)
const getImmunizationById = async (id, client) => {
  const supabase = withClient(client);
  const { data, error } = await supabase
    .from('immunizations')
    .select('*')
    .eq('immunization_id', id)
    .eq('is_deleted', false)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
};

// Update an immunization record
const updateImmunization = async (id, immunizationData, client) => {
  const supabase = withClient(client);
  const { data, error } = await supabase
    .from('immunizations')
    .update({ ...immunizationData, updated_at: new Date().toISOString() })
    .eq('immunization_id', id)
    .eq('is_deleted', false)
    .select()
    .single();
  if (error) throw error;

  // If actual/administered date provided, trigger schedule recalculation
  try {
    if (data && data.patient_id && data.vaccine_id && data.dose_number && (immunizationData.administered_date || data.date_administered || data.administered_date)) {
      const actualDate = immunizationData.administered_date || data.administered_date || data.date_administered || null;
      if (actualDate) {
        await supabase.rpc('recalc_patient_schedule_enhanced', { p_patient_id: data.patient_id, p_vaccine_id: data.vaccine_id, p_dose_number: data.dose_number, p_actual_date: actualDate, p_user_id: immunizationData.administered_by || null });
      }
    }
  } catch (rpcErr) {
    console.error('[updateImmunization] RPC recalc_patient_schedule_enhanced failed:', rpcErr);
  }
  return data;
};

// Delete (soft delete) immunization record
const deleteImmunization = async (id, client) => {
  const supabase = withClient(client);
  const { data, error } = await supabase
    .from('immunizations')
    .update({
      is_deleted: true,
      deleted_at: new Date().toISOString()
    })
    .eq('immunization_id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

// List all immunizations with filters (prefer immunizationhistory_view for denormalized reads)
const listImmunizations = async (filters = {}, client) => {
  const supabase = withClient(client);
  let query = supabase
    .from('immunizationhistory_view')
    .select('*');

  if (filters.patient_id) {
    query = query.eq('patient_id', filters.patient_id);
  }
  
  if (filters.vaccine_id) {
    query = query.eq('vaccine_id', filters.vaccine_id);
  }
  
  if (filters.administered_by) {
    query = query.eq('administered_by', filters.administered_by);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

// Get all immunizations (alias for listImmunizations)
const getAllImmunizations = async (filters = {}, client) => {
  return await listImmunizations(filters, client);
};

// Schedule immunization (insert into patientschedule)
const scheduleImmunization = async (scheduleData, client) => {
  const supabase = withClient(client);
  const { data, error } = await supabase
    .from('patientschedule')
    .insert([scheduleData])
    .select()
    .single();
  if (error) throw error;

  // Validate manual schedule edits via DB helper (non-blocking).
  // This will insert activity log warnings if the scheduled date violates rules.
  try {
    const userId = scheduleData.updated_by || scheduleData.created_by || null;
    if (data && data.patient_schedule_id) {
      await supabase.rpc('validate_manual_schedule_edit', { p_patient_schedule_id: data.patient_schedule_id, p_user_id: userId });
    }
  } catch (rpcErr) {
    console.error('[scheduleImmunization] validate_manual_schedule_edit RPC failed:', rpcErr);
  }

  return data;
};

// Enforce vaccine interval (this is handled by database trigger/policy)
const enforceVaccineInterval = async (scheduleData, client) => {
  const supabase = withClient(client);
  // This function validates interval rules before scheduling
  // The actual enforcement is done by the database trigger
  const { patient_id, vaccine_id, dose_number } = scheduleData;
  
  // Check if previous dose exists and validate interval
  const { data: lastDose, error } = await supabase
    .from('patientschedule')
    .select('*')
    .eq('patient_id', patient_id)
    .eq('vaccine_id', vaccine_id)
    .eq('dose_number', dose_number - 1)
    .eq('status', 'completed')
    .single();
  
  if (error && error.code !== 'PGRST116') throw error;
  
  if (!lastDose && dose_number > 1) {
    throw new Error('Previous dose not found or not completed');
  }
  
  return { valid: true, message: 'Interval validation passed' };
};

// Update patientschedule row (manual schedule edit)
const updatePatientSchedule = async (patientScheduleId, updateData, client) => {
  const supabase = withClient(client);
  // Load existing to detect scheduled_date change and prevent manual status edits
  const { data: current, error: curErr } = await supabase
    .from('patientschedule')
    .select('*')
    .eq('patient_schedule_id', patientScheduleId)
    .eq('is_deleted', false)
    .single();
  if (curErr && curErr.code !== 'PGRST116') throw curErr;
  if (!current) throw new Error('Patient schedule not found');

  const patch = { ...updateData };
  // Never allow status override at the model level
  if (Object.prototype.hasOwnProperty.call(patch, 'status')) delete patch.status;
  // If scheduled_date changed, set status to 'rescheduled' (DB may further adjust)
  if (patch.scheduled_date && current.scheduled_date && new Date(patch.scheduled_date).toISOString() !== new Date(current.scheduled_date).toISOString()) {
    patch.status = 'rescheduled';
  }
  const { data, error } = await supabase
    .from('patientschedule')
    .update(patch)
    .eq('patient_schedule_id', patientScheduleId)
    .eq('is_deleted', false)
    .select()
    .single();
  if (error) throw error;

  // Call DB helper to validate manual edit and emit warnings (non-blocking)
  try {
    const userId = updateData.updated_by || null;
    await supabase.rpc('validate_manual_schedule_edit', { p_patient_schedule_id: data.patient_schedule_id, p_user_id: userId });
  } catch (rpcErr) {
    console.error('[updatePatientSchedule] validate_manual_schedule_edit RPC failed:', rpcErr);
  }

  return data;
};

module.exports = {
  createImmunization,
  getImmunizationById,
  updateImmunization,
  deleteImmunization,
  listImmunizations,
  getAllImmunizations,
  scheduleImmunization,
  enforceVaccineInterval,
  updatePatientSchedule,
};
