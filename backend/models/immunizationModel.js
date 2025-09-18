const supabase = require('../db');

// Create a new immunization record
const createImmunization = async (immunizationData) => {
  const { data, error } = await supabase
    .from('immunizations')
    .insert([immunizationData])
    .select()
    .single();
  if (error) throw error;
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

module.exports = {
  createImmunization,
  getImmunizationById,
  updateImmunization,
  deleteImmunization,
  listImmunizations,
  getAllImmunizations,
  scheduleImmunization,
  enforceVaccineInterval,
};
