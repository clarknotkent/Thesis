const supabase = require('../db');

// Fetch all health workers
const getAllHealthWorkers = async (filters) => {
  const { search } = filters;
  let query = supabase.from('users').select('*').eq('role', 'HealthWorker');

  if (search) {
    query = query.ilike('surname', `%${search}%`).ilike('firstname', `%${search}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

// Fetch a health worker by ID
const getHealthWorkerById = async (id) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('user_id', id)
    .eq('role', 'HealthWorker')
    .single();

  if (error) throw error;
  return data;
};

// Create a new health worker
const createHealthWorker = async (workerData) => {
  const { data, error } = await supabase
    .from('users')
    .insert([{ ...workerData, role: 'HealthWorker' }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Update a health worker
const updateHealthWorker = async (id, workerData) => {
  const { data, error } = await supabase
    .from('users')
    .update(workerData)
    .eq('user_id', id)
    .eq('role', 'HealthWorker')
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Soft delete a health worker
const deleteHealthWorker = async (id) => {
  const { error } = await supabase
    .from('users')
    .update({ is_deleted: true })
    .eq('user_id', id)
    .eq('role', 'HealthWorker');

  if (error) throw error;
};

module.exports = {
  getAllHealthWorkers,
  getHealthWorkerById,
  createHealthWorker,
  updateHealthWorker,
  deleteHealthWorker,
};
