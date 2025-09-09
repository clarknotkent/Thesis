const supabase = require('../db');

// Fetch all vaccines
const getAllVaccines = async (filters) => {
  const { search } = filters;
  let query = supabase.from('vaccinemaster').select('*');

  if (search) {
    query = query.ilike('antigen_name', `%${search}%`).ilike('brand_name', `%${search}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

// Fetch a vaccine by ID
const getVaccineById = async (id) => {
  const { data, error } = await supabase
    .from('vaccinemaster')
    .select('*')
    .eq('vaccine_id', id)
    .single();

  if (error) throw error;
  return data;
};

// Create a new vaccine
const createVaccine = async (vaccineData) => {
  const { data, error } = await supabase
    .from('vaccinemaster')
    .insert([vaccineData])
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Update a vaccine
const updateVaccine = async (id, vaccineData) => {
  const { data, error } = await supabase
    .from('vaccinemaster')
    .update(vaccineData)
    .eq('vaccine_id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Soft delete a vaccine
const deleteVaccine = async (id) => {
  const { error } = await supabase
    .from('vaccinemaster')
    .update({ is_deleted: true })
    .eq('vaccine_id', id);

  if (error) throw error;
};

module.exports = {
  getAllVaccines,
  getVaccineById,
  createVaccine,
  updateVaccine,
  deleteVaccine,
};
