import supabase from '../db.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
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

// Verify authentication token with sliding inactivity window.
// Behavior:
// - Verifies JWT signature (and default expiration)
// - Enforces inactivity window using public.user_sessions.last_activity
// - On each successful verification, updates last_activity to now (sliding)
// Configuration:
// - INACTIVITY_MINUTES env var (default: 60 minutes)
const verifyToken = async (token) => {
  try {
    // Verify JWT signature and claims first (keeps exp enforcement unless tokens are issued with a longer exp)
    const decoded = jwt.verify(token, SECRET_KEY);

    // Resolve user info (includes supabase_uuid for mapping)
    const { data: row, error } = await supabase
      .from('users_with_uuid')
      .select('user_id, role, username, email, supabase_uuid')
      .eq('user_id', decoded.id)
      .single();

    if (error || !row) return null;

    // Enforce inactivity-based expiry using per-user last_activity
    const INACTIVITY_MINUTES = parseInt(process.env.INACTIVITY_MINUTES || '60', 10);
    const windowMs = Math.max(1, INACTIVITY_MINUTES) * 60 * 1000;

    // Fetch current last_activity
    const { data: sess, error: sessErr } = await supabase
      .from('user_sessions')
      .select('user_id, last_activity')
      .eq('user_id', row.user_id)
      .single();

    const now = new Date();
    let expiredForInactivity = false;
    if (!sessErr && sess && sess.last_activity) {
      const last = new Date(sess.last_activity);
      const diff = now.getTime() - last.getTime();
      if (diff > windowMs) expiredForInactivity = true;
    }

    if (expiredForInactivity) {
      // Mark as expired by inactivity
      try { console.warn('[auth] Inactivity window exceeded for user', row.user_id); } catch(_) {}
      return null;
    }

    // Touch session last_activity (upsert: create if missing)
    try {
      await supabase
        .from('user_sessions')
        .upsert({ user_id: row.user_id, last_activity: now.toISOString() }, { onConflict: 'user_id' });
    } catch (_) {
      // Non-fatal: continue without blocking the request
    }

    return {
      id: row.user_id,
      role: row.role,
      username: row.username,
      email: row.email,
      uuid: row.supabase_uuid || null,
    };
  } catch (_) {
    return null;
  }
};

// Generate JWT token
// Default to 7 days to avoid fighting the inactivity window policy.
const generateToken = (payload, expiresIn = '7d') => {
  return jwt.sign(payload, SECRET_KEY, { expiresIn });
};

// Refresh token
const refreshToken = async (token) => {
  try {
    const _decoded = jwt.verify(token, SECRET_KEY, { ignoreExpiration: true });
    const user = await verifyToken(token);
    if (!user) throw new Error('User not found');

    return generateToken({
      id: user.id,
      role: user.role
    });
  } catch (e) {
    throw e;
  }
};

export { createUser,
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
  refreshToken };
