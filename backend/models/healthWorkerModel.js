import supabase from '../db.js';

// Normalization functions
const toTitleCase = (str) => {
  if (typeof str !== 'string') return str;
  return str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
};

const toSentenceCase = (str) => {
  if (typeof str !== 'string') return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

// Create a new health staff
const createHealthWorker = async (workerData) => {
  // Apply normalization
  const normalizedData = { ...workerData };
  if (normalizedData.surname) normalizedData.surname = toTitleCase(normalizedData.surname);
  if (normalizedData.firstname) normalizedData.firstname = toTitleCase(normalizedData.firstname);
  if (normalizedData.middlename) normalizedData.middlename = toTitleCase(normalizedData.middlename);
  if (normalizedData.address) normalizedData.address = toTitleCase(normalizedData.address);

  const healthWorkerData = {
    ...normalizedData,
    role: 'HealthStaff',
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
    .in('role', ['HealthStaff', 'Nurse', 'Nutritionist'])
    .eq('is_deleted', false)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
};

// Update health worker
const updateHealthWorker = async (id, workerData) => {
  // Apply normalization
  const sanitized = { ...workerData };
  if (sanitized.surname) sanitized.surname = toTitleCase(sanitized.surname);
  if (sanitized.firstname) sanitized.firstname = toTitleCase(sanitized.firstname);
  if (sanitized.middlename) sanitized.middlename = toTitleCase(sanitized.middlename);
  if (sanitized.address) sanitized.address = toTitleCase(sanitized.address);

  const { data, error } = await supabase
    .from('users')
    .update(sanitized)
    .eq('user_id', id)
    .in('role', ['HealthStaff', 'Nurse', 'Nutritionist'])
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
    .in('role', ['HealthStaff', 'Nurse', 'Nutritionist'])
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
    .in('role', ['HealthStaff', 'Nurse', 'Nutritionist'])
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

export { createHealthWorker,
  getHealthWorkerById,
  updateHealthWorker,
  deleteHealthWorker,
  listHealthWorkers,
  getAllHealthWorkers,
  fetchHealthWorkerProgress,
  getHealthWorkerProgress };
