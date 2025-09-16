const supabase = require('../db');

// Create a new health worker
const createHealthWorker = async (workerData) => {
  const healthWorkerData = {
    ...workerData,
    role: 'HealthWorker',
    is_deleted: false,
    date_registered: new Date().toISOString()
  };
  
  const { data, error } = await supabase
    .from('users')
    .insert([healthWorkerData])
    .select()
    .single();
  if (error) throw error;
  return data;
};

// Get health worker by ID
const getHealthWorkerById = async (id) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('user_id', id)
    .in('role', ['HealthWorker', 'Nurse', 'Nutritionist'])
    .eq('is_deleted', false)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
};

// Update health worker
const updateHealthWorker = async (id, workerData) => {
  const { data, error } = await supabase
    .from('users')
    .update(workerData)
    .eq('user_id', id)
    .in('role', ['HealthWorker', 'Nurse', 'Nutritionist'])
    .eq('is_deleted', false)
    .select()
    .single();
  if (error) throw error;
  return data;
};

// Delete (soft delete) health worker
const deleteHealthWorker = async (id) => {
  const { data, error } = await supabase
    .from('users')
    .update({ 
      is_deleted: true, 
      deleted_at: new Date().toISOString() 
    })
    .eq('user_id', id)
    .in('role', ['HealthWorker', 'Nurse', 'Nutritionist'])
    .select()
    .single();
  if (error) throw error;
  return data;
};

// List all health workers
const listHealthWorkers = async (filters = {}) => {
  let query = supabase
    .from('users')
    .select('*')
    .in('role', ['HealthWorker', 'Nurse', 'Nutritionist'])
    .eq('is_deleted', false);

  if (filters.role) {
    query = query.eq('role', filters.role);
  }
  
  if (filters.search) {
    query = query.or(`surname.ilike.%${filters.search}%,firstname.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
  }

  const { data, error } = await query.order('date_registered', { ascending: false });
  if (error) throw error;
  return data;
};

// Get all health workers (alias for listHealthWorkers)
const getAllHealthWorkers = async () => {
  return await listHealthWorkers();
};

// Fetch health worker progress
const fetchHealthWorkerProgress = async (id = null) => {
  let query = supabase.from('worker_progress_view').select('*');
  
  if (id) {
    query = query.eq('user_id', id);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

// Get health worker progress (alias for fetchHealthWorkerProgress)
const getHealthWorkerProgress = async (id = null) => {
  return await fetchHealthWorkerProgress(id);
};

module.exports = {
  createHealthWorker,
  getHealthWorkerById,
  updateHealthWorker,
  deleteHealthWorker,
  listHealthWorkers,
  getAllHealthWorkers,
  fetchHealthWorkerProgress,
  getHealthWorkerProgress,
};
