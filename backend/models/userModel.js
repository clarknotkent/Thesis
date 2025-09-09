const supabase = require('../db');

// Fetch all users
const getAllUsers = async (filters) => {
  const { search, role } = filters;
  let query = supabase.from('users').select('*');

  if (search) {
    query = query.ilike('surname', `%${search}%`).ilike('firstname', `%${search}%`);
  }

  if (role) {
    query = query.eq('role', role);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

// Fetch a user by ID
const getUserById = async (id) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('user_id', id)
    .single();

  if (error) throw error;
  return data;
};

// Create a new user
const createUser = async (userData) => {
  const { data, error } = await supabase
    .from('users')
    .insert([userData])
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Update a user
const updateUser = async (id, userData) => {
  const { data, error } = await supabase
    .from('users')
    .update(userData)
    .eq('user_id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Soft delete a user
const deleteUser = async (id) => {
  const { error } = await supabase
    .from('users')
    .update({ is_deleted: true })
    .eq('user_id', id);

  if (error) throw error;
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};