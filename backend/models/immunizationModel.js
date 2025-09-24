const supabase = require('../db');

// Create a new immunization record
const createImmunization = async (immunizationData) => {
  const { data, error } = await supabase
    .from('immunizations')
    .insert([immunizationData])
    .select()
    .single();
  if (error) throw error;

  // After successful immunization insert, call DB helper to mark schedule completed and recompute
  try {
    if (data && data.patient_id && data.vaccine_id && data.dose_number && data.administered_date) {
      await supabase.rpc('recalc_patient_schedule_enhanced', { p_patient_id: data.patient_id, p_vaccine_id: data.vaccine_id, p_dose_number: data.dose_number, p_actual_date: data.administered_date, p_user_id: immunizationData.administered_by || null });
    }
  } catch (rpcErr) {
    console.error('[createImmunization] RPC recalc_patient_schedule_enhanced failed:', rpcErr);
  }
  return data;
};

// Get immunization by ID (base table OK; separate view exists for history)
const getImmunizationById = async (id) => {
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
const updateImmunization = async (id, immunizationData) => {
  const { data, error } = await supabase
    .from('immunizations')
    .update(immunizationData)
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
const deleteImmunization = async (id) => {
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
const listImmunizations = async (filters = {}) => {
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
const getAllImmunizations = async (filters = {}) => {
  return await listImmunizations(filters);
};

// Schedule immunization (insert into patientschedule)
const scheduleImmunization = async (scheduleData) => {
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
const enforceVaccineInterval = async (scheduleData) => {
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
const updatePatientSchedule = async (patientScheduleId, updateData) => {
  const { data, error } = await supabase
    .from('patientschedule')
    .update(updateData)
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
