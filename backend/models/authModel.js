const supabase = require('../db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const SECRET_KEY = process.env.JWT_SECRET || 'your-secret-key';

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

// Register a new user (alias for createUser with additional logic)
const registerUser = async (userData) => {
  return await createUser(userData);
};

// Find user by username or email
const findUserByUsernameOrEmail = async (identifier) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .or(`username.eq.${identifier},email.eq.${identifier}`)
    .single();
  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows found
  return data;
};

// Find user by username, email, or contact number (phone)
const findUserByIdentifier = async (identifier) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .or(`username.eq.${identifier},email.eq.${identifier},contact_number.eq.${identifier}`)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
};

// Fetch user by username (legacy function)
const getUserByUsername = async (username) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
};

// Verify password
const verifyPassword = async (plainPassword, hashedPassword) => {
  return await bcrypt.compare(plainPassword, hashedPassword);
};

// Update user password
const updatePassword = async (userId, newPassword) => {
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  const { data, error } = await supabase
    .from('users')
    .update({ password_hash: hashedPassword })
    .eq('user_id', userId)
    .select()
    .single();
  if (error) throw error;
  return data;
};

// Change user password (alias for updatePassword)
const changePassword = async (userId, newPassword) => {
  return await updatePassword(userId, newPassword);
};

// Create user mapping (Supabase UUID to user_id)
const createUserMapping = async (mapping) => {
  const { data, error } = await supabase
    .from('user_mapping')
    .insert([mapping])
    .select()
    .single();
  if (error) throw error;
  return data;
};

// Get user mapping by UUID
const getUserMappingByUUID = async (uuid) => {
  const { data, error } = await supabase
    .from('user_mapping')
    .select('*')
    .eq('uuid', uuid)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
};

// Get user mapping by local user_id
const getUserMappingByUserId = async (userId) => {
  const { data, error } = await supabase
    .from('user_mapping')
    .select('*')
    .eq('user_id', userId)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
};

// Link Supabase user to local user
const linkSupabaseUser = async (uuid, userId) => {
  return await createUserMapping({ uuid, user_id: userId });
};

// Verify authentication token
const verifyToken = async (token) => {
  try {
    const decoded = jwt.verify(token, SECRET_KEY);

    // Read from users_with_uuid view to include Supabase UUID for mapping
    const { data: row, error } = await supabase
      .from('users_with_uuid')
      .select('user_id, role, username, email, supabase_uuid')
      .eq('user_id', decoded.id)
      .single();

    if (error || !row) return null;

    return {
      id: row.user_id,
      role: row.role,
      username: row.username,
      email: row.email,
      uuid: row.supabase_uuid || null,
    };
  } catch (error) {
    return null;
  }
};

// Generate JWT token
const generateToken = (payload, expiresIn = '1h') => {
  return jwt.sign(payload, SECRET_KEY, { expiresIn });
};

// Refresh token
const refreshToken = async (token) => {
  try {
    const decoded = jwt.verify(token, SECRET_KEY, { ignoreExpiration: true });
    const user = await verifyToken(token);
    if (!user) throw new Error('User not found');
    
    return generateToken({ 
      id: user.id, 
      role: user.role 
    });
  } catch (error) {
    throw error;
  }
};

module.exports = {
  createUser,
  registerUser,
  findUserByUsernameOrEmail,
  findUserByIdentifier,
  getUserByUsername,
  verifyPassword,
  updatePassword,
  changePassword,
  createUserMapping,
  getUserMappingByUUID,
  getUserMappingByUserId,
  linkSupabaseUser,
  verifyToken,
  generateToken,
  refreshToken,
};
