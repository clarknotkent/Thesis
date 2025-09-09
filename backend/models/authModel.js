const supabase = require('../db');
const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.JWT_SECRET || 'your-secret-key';

// Authenticate user
const loginUser = async (credentials) => {
  const { username, password } = credentials;
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .eq('password_hash', password)
    .single(); // Ensure the query is properly closed

  if (error) throw error;
  return data;
};

// Register a new user
const registerUser = async (userData) => {
  const { data, error } = await supabase
    .from('users')
    .insert([userData])
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Fetch user by username
const getUserByUsername = async (username) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .single();

  if (error) throw error;
  return data;
};

// Change user password
const changePassword = async (userId, newPassword) => {
  const { data, error } = await supabase
    .from('users')
    .update({ password_hash: newPassword })
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Verify authentication token
const verifyToken = async (token) => {
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    return decoded; // Return decoded token payload if valid
  } catch (error) {
    return null; // Return null if token is invalid
  }
};

module.exports = {
  loginUser,
  registerUser,
  getUserByUsername,
  changePassword,
  verifyToken,
};
