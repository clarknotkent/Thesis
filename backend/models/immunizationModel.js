const supabase = require('../db');

// Fetch all immunizations
const getAllImmunizations = async (filters) => {
  const { patientId } = filters;
  let query = supabase.from('immunizations').select('*');

  if (patientId) {
    query = query.eq('patient_id', patientId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

// Fetch an immunization by ID
const getImmunizationById = async (id) => {
  const { data, error } = await supabase
    .from('immunizations')
    .select('*')
    .eq('immunization_id', id)
    .single();

  if (error) throw error;
  return data;
};

// Create a new immunization
const createImmunization = async (immunizationData) => {
  const { data, error } = await supabase
    .from('immunizations')
    .insert([immunizationData])
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Update an immunization
const updateImmunization = async (id, immunizationData) => {
  const { data, error } = await supabase
    .from('immunizations')
    .update(immunizationData)
    .eq('immunization_id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Soft delete an immunization
const deleteImmunization = async (id) => {
  const { error } = await supabase
    .from('immunizations')
    .update({ is_deleted: true })
    .eq('immunization_id', id);

  if (error) throw error;
};

module.exports = {
  getAllImmunizations,
  getImmunizationById,
  createImmunization,
  updateImmunization,
  deleteImmunization,
};
