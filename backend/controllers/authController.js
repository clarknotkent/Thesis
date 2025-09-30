const authModel = require('../models/authModel');
const userModel = require('../models/userModel');
const { ACTIVITY } = require('../constants/activityTypes');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const supabase = require('../db');
const { createClient } = require('@supabase/supabase-js');
const { getActorId } = require('../utils/actor');

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
    if (!contact_number || !String(contact_number).trim()) {
      console.warn('[registerUser] DEBUG: Missing contact_number');
      return res.status(400).json({ message: 'Contact number is required' });
    }
    const { normalizePhilippineMobile } = require('../utils/contact');
    const norm = normalizePhilippineMobile(contact_number);
    if (!norm.valid) {
      console.warn('[registerUser] DEBUG: Invalid contact_number format:', contact_number);
      return res.status(400).json({ message: norm.error });
    }
    const normalizedContact = norm.normalized;
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

    // Create application user record via unified userModel (ensures role canonicalization & audit handling)
    console.log('[registerUser] DEBUG: Building canonical app user payload');
  // Canonical role tokens (DB constraint): Admin | HealthWorker | Guardian
    let incomingRole = (role || '').trim().toLowerCase();
    let canonicalRole;
  if (['admin','administrator','system admin'].includes(incomingRole)) canonicalRole = 'Admin';
  else if (['health_worker','healthworker','health worker'].includes(incomingRole)) canonicalRole = 'HealthWorker';
  else if (['guardian','parent','guardian-parent'].includes(incomingRole)) canonicalRole = 'Guardian';
  else canonicalRole = 'Guardian'; // fallback

    // Sex normalization
    let normalizedSex;
    if (typeof sex === 'string') {
      const s = sex.trim().toLowerCase();
      if (s === 'male') normalizedSex = 'Male';
      else if (s === 'female') normalizedSex = 'Female';
      else normalizedSex = 'Other';
    } else normalizedSex = 'Other';

    // Accept additional optional fields from body
  const { middlename, hw_type, employee_id, created_by: _cb, updated_by: _ub } = req.body; // ignore spoofed audit fields
    let professionalLicense = professional_license_no || null;
    let hwType = hw_type || null;
    // If role is HealthWorker but subtype provided as role variants like 'nurse'
    if (canonicalRole === 'HealthWorker' && !hwType) {
      if (['nurse','nutritionist','bhw'].includes(incomingRole)) hwType = incomingRole; // edge case
    }
    if (hwType === 'bhw') professionalLicense = null; // BHW never keeps license

  // Actor (creator) id: middleware may set user_id or id
  const actorId = getActorId(req); // if an authenticated admin creates user
  console.log('[registerUser] actorId resolved =', actorId, 'req.user =', req.user);
    const appUserPayload = {
      username,
      email,
  role: canonicalRole,
      firstname,
      middlename: middlename || null,
      surname,
      contact_number: normalizedContact,
      sex: normalizedSex,
      birthdate: birthdate || null,
      address: address || null,
      status: status || 'active',
  professional_license_no: (canonicalRole === 'HealthWorker' || canonicalRole === 'Admin') ? professionalLicense : null,
  employee_id: (canonicalRole === 'HealthWorker' || canonicalRole === 'Admin') ? (employee_id || null) : null,
  hw_type: (canonicalRole === 'HealthWorker') ? (hwType || null) : null,
      created_by: actorId, // if null, will be self-assigned after insert
      updated_by: actorId,
      password // userModel ignores password for local hash, Supabase handles auth
    };
    const safeAppUserPayload = { ...appUserPayload }; if (safeAppUserPayload.password) safeAppUserPayload.password = '***redacted***';
    console.log('[registerUser] DEBUG: Canonical payload to userModel.createUser:', safeAppUserPayload);
    let newUser;
    try {
  newUser = await userModel.createUser(appUserPayload, actorId, { allowSelf: true });
    } catch (e) {
      console.error('[registerUser] DEBUG: userModel.createUser failed:', e?.message || e);
      // Rollback auth user if app user creation fails
      try { await admin.auth.admin.deleteUser(created?.user?.id); } catch (_) {}
      return res.status(500).json({ message: 'Failed to create application user', error: e?.message });
    }
    // If no actor (self-registration) ensure audit fields point to the user itself
    if (!newUser.created_by || !newUser.updated_by) {
      try {
        const { data: patched, error: patchErr } = await supabase
          .from('users')
          .update({ created_by: newUser.user_id, updated_by: newUser.user_id })
          .eq('user_id', newUser.user_id)
          .select('user_id, created_by, updated_by')
          .single();
        if (!patchErr && patched) {
          newUser.created_by = patched.created_by;
          newUser.updated_by = patched.updated_by;
          console.log('[registerUser] DEBUG: Self-assigned audit fields for user', newUser.user_id);
        }
      } catch (auditPatchErr) {
        console.warn('[registerUser] DEBUG: Failed self-assign audit fields', auditPatchErr?.message || auditPatchErr);
      }
    }
    console.log('[registerUser] DEBUG: App user created (canonical):', newUser?.user_id, 'stored role:', newUser?.role, 'hw_type:', newUser?.hw_type, 'created_by:', newUser?.created_by, 'updated_by:', newUser?.updated_by);

    // Map Supabase UUID to local user_id
    try {
      console.log('[registerUser] DEBUG: About to call authModel.createUserMapping');
      // Check if mapping already exists for this user_id or uuid to avoid unique violation
      const existingByUUID = await authModel.getUserMappingByUUID(created.user.id);
      if (!existingByUUID) {
        await authModel.createUserMapping({ uuid: created.user.id, user_id: newUser.user_id });
        console.log('[registerUser] DEBUG: User mapping created');
      } else {
        console.log('[registerUser] DEBUG: Mapping already exists, skipping');
      }
    } catch (e) {
      // If duplicate key, treat as non-fatal
      if (/(duplicate key)/i.test(e?.message)) {
        console.warn('[registerUser] DEBUG: Mapping already exists (duplicate), continuing');
      } else {
        console.error('[registerUser] DEBUG: Mapping create failed:', e?.message || e);
      }
    }

    // If role is Guardian, create guardian record
  if (newUser && newUser.role === 'Guardian') {
      try {
        const guardianModel = require('../models/guardianModel');
        await guardianModel.createGuardian({
          surname: newUser.surname,
          firstname: newUser.firstname,
          middlename: newUser.middlename || null,
          // Prefer birthdate from request body; fallback to stored user if included
          birthdate: birthdate || newUser.birthdate || null,
          address: newUser.address || null,
          occupation: null,
          contact_number: newUser.contact_number || normalizedContact,
          alternative_contact_number: null,
          email: newUser.email || null,
          user_id: newUser.user_id,
          created_by: actorId || newUser.created_by || newUser.user_id,
          updated_by: actorId || newUser.updated_by || newUser.user_id
        });
        console.log('[registerUser] DEBUG: Guardian record created');
      } catch (gErr) {
        console.error('[registerUser] DEBUG: Failed to create guardian record:', gErr.message || gErr);
      }
    }

    // Log activities: user registration (+ guardian profile creation)
    try {
      const { logActivity } = require('../models/activityLogger');
      const creatorId = actorId || newUser.user_id; // actor if present, else self (self-registration)
      await logActivity({
        action_type: ACTIVITY.USER.CREATE,
        description: `User registered: ${newUser.username || newUser.email}`,
        user_id: creatorId,
        entity_type: 'user',
        entity_id: newUser.user_id,
        new_value: { username: newUser.username, email: newUser.email, role: newUser.role, created_user_id: newUser.user_id }
      });
      if (newUser.role === 'Guardian') {
        await logActivity({
          action_type: ACTIVITY.GUARDIAN.CREATE,
          description: `Guardian profile created for user ${newUser.user_id}`,
          user_id: creatorId,
          entity_type: 'guardian',
          entity_id: newUser.user_id,
          new_value: { user_id: newUser.user_id }
        });
      }
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
      try {
        const { logActivity } = require('../models/activityLogger');
        await logActivity({ action_type: ACTIVITY.USER.LOGIN_FAILED, description: 'Failed login (no user)', user_id: null, entity_type: 'user', entity_id: null });
      } catch(_) {}
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
      try {
        const { logActivity } = require('../models/activityLogger');
        await logActivity({ action_type: ACTIVITY.USER.LOGIN_FAILED, description: 'Failed login (bad password)', user_id: appUser.user_id, entity_type: 'user', entity_id: appUser.user_id });
      } catch(_) {}
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

    // Log login activity
    try {
      const { logActivity } = require('../models/activityLogger');
      await logActivity({
        action_type: ACTIVITY.USER.LOGIN,
        description: 'User login',
        user_id: appUser.user_id,
        entity_type: 'user',
        entity_id: appUser.user_id
      });
    } catch (e) {
      console.debug('[loginUser] activity log failed', e.message || e);
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
    let actorId = null;
    if (req.user?.id) {
      actorId = req.user.id;
      console.log(`Logout: user_id=${req.user.id} role=${req.user.role}`);
    } else if (req.tokenPayload?.id) {
      actorId = req.tokenPayload.id;
      console.log(`Logout: user_id=${req.tokenPayload.id} role=${req.tokenPayload.role}`);
    } else {
      console.log('Logout requested (no user context)');
    }
    try {
      if (actorId) {
        const { logActivity } = require('../models/activityLogger');
        await logActivity({ action_type: ACTIVITY.USER.LOGOUT, description: 'User logout', user_id: actorId, entity_type: 'user', entity_id: actorId });
      }
    } catch(_) {}
    res.json({ message: 'Logged out successfully' });
  } catch (e) {
    console.error('Logout logging failed:', e);
    res.json({ message: 'Logged out successfully' });
  }
};

// Legacy resetPassword endpoint removed in favor of /api/users/:id/reset-password (Supabase Auth based)

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
  linkSupabaseUser,
  getUserMapping,
  refreshToken,
};