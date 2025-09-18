const authModel = require('../models/authModel');
const userModel = require('../models/userModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const supabase = require('../db');
const { createClient } = require('@supabase/supabase-js');

// Create a fresh Supabase client for per-request auth without persisting session
const getAuthClient = () => {
  const url = process.env.SUPABASE_URL;
  // Prefer service role for server-side operations; fallback to generic key, then anon last
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!process.env.SUPABASE_SERVICE_KEY) {
    console.warn('[auth] Warning: SUPABASE_SERVICE_KEY is not set; falling back to a non-service key for admin calls.');
  }
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
};

// Register a new user: create Supabase Auth user (email-only), then app user, then user_mapping
const registerUser = async (req, res) => {
  try {
    const {
      username,
      password,
      email,
      firstname,
      surname,
      contact_number,
      role,
      sex,
      birthdate,
      address,
      professional_license_no,
      status
    } = req.body;
    console.log('[registerUser] DEBUG: Received request body:', req.body);
    if (!email || !password) {
      console.warn('[registerUser] DEBUG: Missing email or password');
      return res.status(400).json({ message: 'Email and password are required' });
    }
    // Create Supabase Auth user (email is the only enabled provider)
    const admin = getAuthClient();
    console.log('[registerUser] DEBUG: About to call admin.auth.admin.createUser');
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });
    if (createErr) {
      console.error('[registerUser] DEBUG: Supabase auth user creation failed:', createErr.message);
      return res.status(400).json({ message: 'Supabase auth user creation failed', error: createErr.message });
    }
    console.log('[registerUser] DEBUG: Supabase Auth user created:', created?.user?.id);

    // Create application user record (no password_hash)
    console.log('[registerUser] DEBUG: About to call authModel.registerUser (no password_hash)');
      // Normalize role and sex to match allowed values in DB
      let normalizedRole = role;
      if (typeof role === 'string') {
        const r = role.trim().toLowerCase().replace(/\s+/g, '');
        if (r === 'admin') normalizedRole = 'Admin';
        else if (r === 'healthworker' || r === 'health_worker') normalizedRole = 'HealthWorker';
        else if (r === 'nurse') normalizedRole = 'Nurse';
        else if (r === 'nutritionist') normalizedRole = 'Nutritionist';
        else if (r === 'guardian' || r === 'parent') normalizedRole = 'Guardian';
        else normalizedRole = 'Guardian'; // fallback
      }
      let normalizedSex = sex;
      if (typeof sex === 'string') {
        const s = sex.trim().toLowerCase();
        if (s === 'male') normalizedSex = 'Male';
        else if (s === 'female') normalizedSex = 'Female';
        else normalizedSex = 'Other';
      } else {
        normalizedSex = 'Other';
      }
      const newUser = await authModel.registerUser({
        username,
        email,
        firstname,
        surname,
        contact_number,
        role: normalizedRole,
        sex: normalizedSex,
        birthdate: birthdate || null,
        address: address || null,
        professional_license_no: professional_license_no || null,
        user_status: status || 'active'
      });
    console.log('[registerUser] DEBUG: App user created:', newUser?.user_id);

    // Map Supabase UUID to local user_id
    try {
      console.log('[registerUser] DEBUG: About to call authModel.createUserMapping');
      await authModel.createUserMapping({ uuid: created.user.id, user_id: newUser.user_id });
      console.log('[registerUser] DEBUG: User mapping created');
    } catch (e) {
      console.error('[registerUser] DEBUG: Mapping create failed:', e?.message || e);
    }

    // Log activity: user registration
    try {
      const { logActivity } = require('../models/activityLogger');
      await logActivity({
        action_type: 'USER_CREATED',
        description: `User registered: ${newUser.username || newUser.email}`,
        user_id: newUser.user_id
      });
    } catch (logErr) {
      console.error('[registerUser] DEBUG: Failed to log activity:', logErr);
    }
    console.log('[registerUser] DEBUG: Registration complete');
    res.status(201).json({ message: 'User registered', user: newUser });
  } catch (error) {
    console.error('[registerUser] DEBUG: Registration failed:', error);
    res.status(500).json({ message: 'Registration failed' });
  }
};

// Login user (accepts username/email/phone). Resolve to email and sign in via email-only Supabase Auth.
const loginUser = async (req, res) => {
  try {
    const { username, identifier: rawIdentifier, password } = req.body;
    const identifier = (rawIdentifier || username || '').trim();

    if (!identifier || !password) {
      return res.status(400).json({ message: 'Identifier and password are required' });
    }

    // Resolve application user first to map username -> email/phone
    const appUser = await authModel.findUserByIdentifier(identifier);
    if (!appUser) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Resolve email; we only use email sign-in
    const emailToUse = /@/.test(identifier) ? identifier : appUser.email;
    if (!emailToUse) {
      return res.status(400).json({ message: 'User record missing email for authentication' });
    }
  const sb = getAuthClient();
  const signInResult = await sb.auth.signInWithPassword({ email: emailToUse, password });

    const { data: sessionData, error: signInError } = signInResult || {};
    if (signInError || !sessionData?.user) {
      console.warn('Login failed:', { identifier, reason: signInError?.message || 'invalid' });
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const supabaseUUID = sessionData.user.id;

    // Ensure user mapping exists
    try {
      const existingMap = await authModel.getUserMappingByUUID(supabaseUUID);
      if (!existingMap) {
        await authModel.createUserMapping({ uuid: supabaseUUID, user_id: appUser.user_id });
      }
    } catch (e) {
      // Non-fatal: log and proceed
      console.error('User mapping check/create failed:', e?.message || e);
    }

    // Update last login timestamp
    try {
      await userModel.updateLastLogin(appUser.user_id);
      appUser.last_login = new Date().toISOString();
    } catch (e) {
      console.error('Failed to update last_login:', e);
    }

    // Issue application JWT for frontend
    const token = jwt.sign({ id: appUser.user_id, role: appUser.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    console.log(`Login success: user_id=${appUser.user_id} role=${appUser.role} identifier=${identifier}`);
    res.json({ token, user: appUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Login failed' });
  }
};

// Logout user (token-based, just client-side)
const logoutUser = async (req, res) => {
  try {
    // If auth middleware attaches user, log it. Otherwise just note anonymous logout request.
    if (req.user?.id) {
      console.log(`Logout: user_id=${req.user.id} role=${req.user.role}`);
    } else if (req.tokenPayload?.id) {
      console.log(`Logout: user_id=${req.tokenPayload.id} role=${req.tokenPayload.role}`);
    } else {
      console.log('Logout requested (no user context)');
    }
    res.json({ message: 'Logged out successfully' });
  } catch (e) {
    console.error('Logout logging failed:', e);
    res.json({ message: 'Logged out successfully' });
  }
};

// Reset password
const resetPassword = async (req, res) => {
  try {
    const { userId, newPassword } = req.body;
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await authModel.changePassword(userId, hashedPassword);
    res.json({ message: 'Password reset successful' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Password reset failed' });
  }
};

// Link Supabase Auth user to local user
const linkSupabaseUser = async (req, res) => {
  try {
    const { uuid, userId } = req.body;
    await authModel.createUserMapping({ uuid, user_id: userId });
    res.json({ message: 'User mapping created' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'User mapping failed' });
  }
};

// Get user mapping
const getUserMapping = async (req, res) => {
  try {
    const { uuid } = req.query;
    const mapping = await authModel.getUserMappingByUUID(uuid);
    res.json(mapping);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Get user mapping failed' });
  }
};

// Refresh token
const refreshToken = async (req, res) => {
  try {
    const { token } = req.body;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const newToken = jwt.sign({ id: decoded.id, role: decoded.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token: newToken });
  } catch (error) {
    console.error(error);
    res.status(401).json({ message: 'Token refresh failed' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  resetPassword,
  linkSupabaseUser,
  getUserMapping,
  refreshToken,
};