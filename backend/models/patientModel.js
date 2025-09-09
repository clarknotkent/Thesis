const supabase = require('../db');

// Fetch all patients with optional filters
const getAllPatients = async (filters) => {
  const { search, gender, status } = filters;
  let query = supabase.from('patients').select('*').eq('is_deleted', false);

  if (search) {
    query = query.ilike('surname', `%${search}%`).ilike('firstname', `%${search}%`);
  }

  if (gender) {
    query = query.eq('sex', gender);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

// Fetch a patient by ID
const getPatientById = async (id) => {
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .eq('patient_id', id)
    .eq('is_deleted', false)
    .single();

  if (error) throw error;
  return data;
};

// Create a new patient
const createPatient = async (patientData) => {
  const { data, error } = await supabase
    .from('patients')
    .insert([{ ...patientData, date_registered: new Date() }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Update a patient
const updatePatient = async (id, patientData) => {
  const { data, error } = await supabase
    .from('patients')
    .update(patientData)
    .eq('patient_id', id)
    .eq('is_deleted', false)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Soft delete a patient
const deletePatient = async (id, deletedBy) => {
  const { error } = await supabase
    .from('patients')
    .update({ is_deleted: true, deleted_at: new Date(), deleted_by: deletedBy })
    .eq('patient_id', id);

  if (error) throw error;
};

module.exports = {
  getAllPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient,
};
