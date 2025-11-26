import * as authModel from '../models/authModel.js';
import userModel from '../models/userModel.js';
import { ACTIVITY } from '../constants/activityTypes.js';
import jwt from 'jsonwebtoken';
import supabase from '../db.js';
import { createClient } from '@supabase/supabase-js';
import { getActorId } from '../utils/actor.js';

// Create a fresh Supabase client for per-request auth without persisting session
import { normalizePhilippineMobile } from '../utils/contact.js';
import guardianModel from '../models/guardianModel.js';
import { logActivity } from '../models/activityLogger.js';
import { normalizeToPlus63Mobile } from '../utils/contact.js';
import sb from '../db.js';
import smsService from '../services/smsService.js';
const getAuthClient = () => {
  const url = process.env.SUPABASE_URL;
  // Prefer service role for server-side operations; fallback to generic key, then anon last
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!process.env.SUPABASE_SERVICE_KEY) {
    console.warn('[auth] Warning: SUPABASE_SERVICE_KEY is not set; falling back to a non-service key for admin calls.');
  }
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
};

// Create an anon-scoped client for user-session operations (least privilege)
const getAnonClient = () => {
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY; // many setups use SUPABASE_KEY as anon key
  if (!anonKey) {
    console.warn('[auth] Warning: No SUPABASE_ANON_KEY/SUPABASE_KEY set; user-session operations may fail.');
  }
  return createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
};

// Register a new user: create Supabase Auth user (email-only), then app user, then user_mapping
const registerUser = async (req, res) => {
  try {
    const {
      username,
      password,
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
    if (!username || !password) {
      console.warn('[registerUser] DEBUG: Missing username or password');
      return res.status(400).json({ message: 'Username and password are required' });
    }
    if (!contact_number || !String(contact_number).trim()) {
      console.warn('[registerUser] DEBUG: Missing contact_number');
      return res.status(400).json({ message: 'Contact number is required' });
    }
    const norm = normalizePhilippineMobile(contact_number);
    if (!norm.valid) {
      console.warn('[registerUser] DEBUG: Invalid contact_number format:', contact_number);
      return res.status(400).json({ message: norm.error });
    }
    const normalizedContact = norm.normalized;

    // Generate email from username
    const email = `${username}@immunizeme.com`;

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
    // Canonical role tokens (DB constraint downstream via userModel): Admin | HealthStaff | Guardian
    // We'll keep using 'HealthWorker' here (historical) but broaden accepted inputs; userModel maps to stored token.
    const incomingRole = (role || '').trim().toLowerCase();
    let canonicalRole;
    if (['admin','administrator','system admin'].includes(incomingRole)) {
      canonicalRole = 'Admin';
    } else if ([
      'health_worker', 'healthworker', 'health worker',
      'health_staff', 'healthstaff', 'health staff', 'health-staff', 'hw'
    ].includes(incomingRole)) {
      canonicalRole = 'HealthWorker';
    } else if (['guardian','parent','guardian-parent'].includes(incomingRole)) {
      canonicalRole = 'Guardian';
    } else {
      // safest default is Guardian if unknown; log once for visibility
      console.warn('[registerUser] Unrecognized role token, defaulting to Guardian:', incomingRole);
      canonicalRole = 'Guardian';
    }

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
      if (['nurse','nutritionist','bhs'].includes(incomingRole)) hwType = incomingRole; // edge case
    }
    if (hwType === 'bhs') professionalLicense = null; // BHS never keeps license

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
    let identifier = (rawIdentifier || username || '').trim();

    if (!identifier || !password) {
      return res.status(400).json({ message: 'Identifier and password are required' });
    }

    // If identifier looks like a PH mobile, normalize to +639XXXXXXXXX for DB lookup
    try {
      const maybePhone = normalizeToPlus63Mobile(identifier);
      if (maybePhone && maybePhone.valid && maybePhone.normalized) {
        identifier = maybePhone.normalized;
      }
    } catch (_) { /* non-fatal */ }

    // Resolve application user first to map username/email/phone -> user
    const appUser = await authModel.findUserByIdentifier(identifier);
    if (!appUser) {
      try {
        await logActivity({ action_type: ACTIVITY.USER.LOGIN_FAILED, description: 'Failed login (no user)', user_id: null, entity_type: 'user', entity_id: null });
      } catch(_) {}
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Explicitly block soft-deleted users at login
    if (appUser.is_deleted === true) {
      try {
        await logActivity({ action_type: ACTIVITY.USER.LOGIN_FAILED, description: 'Failed login (user is soft-deleted)', user_id: appUser.user_id, entity_type: 'user', entity_id: appUser.user_id });
      } catch(_) {}
      return res.status(403).json({ message: 'Account is deactivated. Please contact an administrator.' });
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
    // Use longer absolute exp (7d); inactivity is enforced server-side via user_sessions
    const token = jwt.sign({ id: appUser.user_id, role: appUser.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    console.log(`Login success: user_id=${appUser.user_id} role=${appUser.role} identifier=${identifier}`);
    res.json({ token, user: appUser });

    // Update last_activity on login (treat as activity)
    try {
      await supabase
        .from('user_sessions')
        .upsert({ user_id: appUser.user_id, last_activity: new Date().toISOString() }, { onConflict: 'user_id' });
    } catch (_) {
      // Non-fatal
    }
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
    const newToken = jwt.sign({ id: decoded.id, role: decoded.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token: newToken });

    // Update last_activity on refresh (treat as activity)
    try {
      await supabase
        .from('user_sessions')
        .upsert({ user_id: decoded.id, last_activity: new Date().toISOString() }, { onConflict: 'user_id' });
    } catch (_) {
      // Non-fatal
    }
  } catch (error) {
    console.error(error);
    res.status(401).json({ message: 'Token refresh failed' });
  }
};

// Debug: Return current user's Supabase UUID and mapping details
const debugCurrentUserUUID = async (req, res) => {
  try {
    const userId = req.user && req.user.user_id ? req.user.user_id : req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    let viaView = null, viaMapping = null;
    try {
      const { data: v } = await sb
        .from('users_with_uuid')
        .select('user_id, email, role, supabase_uuid')
        .eq('user_id', userId)
        .single();
      viaView = v || null;
    } catch (_) {}
    try {
      const { data: m } = await sb
        .from('user_mapping')
        .select('user_id, uuid')
        .eq('user_id', userId)
        .single();
      viaMapping = m || null;
    } catch (_) {}

    const uuid = viaView?.supabase_uuid || viaMapping?.uuid || null;
    // Emit server-side debugger log
    console.log('[DEBUG] /api/auth/debug/uuid', { userId, uuid, viaView, viaMapping });
    return res.json({ userId, uuid, viaView, viaMapping });
  } catch (e) {
    console.error('[auth.debugCurrentUserUUID] error', e);
    return res.status(500).json({ message: 'Failed to resolve UUID' });
  }
};

// Get current user's profile
const getCurrentUserProfile = async (req, res) => {
  try {
    const userId = req.user && req.user.user_id ? req.user.user_id : req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const profile = await userModel.getUserProfile(userId);

    if (!profile) {
      return res.status(404).json({ message: 'User profile not found' });
    }

    res.json(profile);
  } catch (error) {
    console.error('[auth.getCurrentUserProfile] error', error);
    res.status(500).json({ message: 'Failed to fetch user profile', error });
  }
};

// Change password for currently authenticated user
const changeCurrentPassword = async (req, res) => {
  try {
    const userId = req.user && req.user.user_id ? req.user.user_id : req.user?.id;
    const { currentPassword, newPassword } = req.body || {};
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new passwords are required' });
    }
    if (String(newPassword).length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters' });
    }

    // Fetch current user password hash and email
    const { data: userRow, error: userErr } = await require('../db')
      .from('users')
      .select('user_id, password_hash, email')
      .eq('user_id', userId)
      .eq('is_deleted', false)
      .single();
    if (userErr || !userRow) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    let verified = false;
    let supabaseUUIDFromSignin = null;
    if (userRow.password_hash) {
      verified = await authModel.verifyPassword(currentPassword, userRow.password_hash || '');
    }
    if (!verified) {
      // Fallback: verify via Supabase Auth sign-in (source of truth)
      if (!userRow.email) {
        return res.status(400).json({ message: 'User email missing; cannot verify current password' });
      }
      try {
        const sb = getAuthClient();
        const { data: signin, error: signErr } = await sb.auth.signInWithPassword({ email: userRow.email, password: currentPassword });
        if (signErr || !signin?.user) {
          return res.status(400).json({ message: 'Current password is incorrect' });
        }
        supabaseUUIDFromSignin = signin.user?.id || null;
        verified = true;
      } catch (_) {
        // Treat as not verified if sign-in throws
        return res.status(400).json({ message: 'Current password is incorrect' });
      }
    }
    // 1) Try user-scoped update via anon client (least privilege): sign in as user then update
    let authUpdated = false;
    try {
      if (!userRow.email) throw new Error('no-email');
      const anon = getAnonClient();
      const signRes = await anon.auth.signInWithPassword({ email: userRow.email, password: currentPassword });
      if (!signRes?.data?.session) throw new Error('signin-failed');
      // set session and update password as the user
      await anon.auth.setSession({
        access_token: signRes.data.session.access_token,
        refresh_token: signRes.data.session.refresh_token
      });
      const { error: updErr } = await anon.auth.updateUser({ password: newPassword });
      if (updErr) throw updErr;
      authUpdated = true;
      console.log('[DEBUG] changeCurrentPassword user-scoped updateUser OK', { userId });
    } catch (_userScopedErr) {
      // Fallback to Admin API path (requires service role)
      try {
        // Resolve Supabase UUID via view (fallback to mapping if needed)
        let supabaseUUID = supabaseUUIDFromSignin || null;
        try {
          const { data: uidRow } = await sb
            .from('users_with_uuid')
            .select('supabase_uuid')
            .eq('user_id', userId)
            .single();
          supabaseUUID = supabaseUUID || uidRow?.supabase_uuid || null;
        } catch (_) {}
        if (!supabaseUUID) {
          try {
            const map = await authModel.getUserMappingByUserId(userId);
            supabaseUUID = supabaseUUID || map?.uuid || null;
          } catch (_) {}
        }

        if (!supabaseUUID) {
          return res.status(409).json({ message: 'Unable to locate Supabase user mapping for this account' });
        }

        const admin = getAuthClient();
        console.log('[DEBUG] changeCurrentPassword admin.updateUserById', { userId, supabaseUUID });
        const { error: updAuthErr } = await admin.auth.admin.updateUserById(supabaseUUID, { password: newPassword });
        if (updAuthErr) {
          return res.status(500).json({ message: 'Failed to update Supabase Auth password', error: updAuthErr.message });
        }
        authUpdated = true;
        console.log('[DEBUG] changeCurrentPassword admin.updateUserById OK', { userId, supabaseUUID });
      } catch (authUpdateErr) {
        console.error('[auth] Supabase Auth password update failed:', authUpdateErr);
        return res.status(500).json({ message: 'Failed to update password (auth provider)' });
      }
    }

    // 2) Update local shadow hash to keep in sync for any local checks
    try {
      await authModel.changePassword(userId, newPassword);
    } catch (localErr) {
      // Not fatal for login, but keep consistent state if possible
      console.warn('[auth] Local password hash update failed after auth change:', localErr?.message || localErr);
    }

    return res.json({ success: true, message: 'Password changed successfully', authUpdated: !!authUpdated });
  } catch (error) {
    console.error('[auth] changeCurrentPassword error:', error);
    return res.status(500).json({ message: 'Failed to change password' });
  }
};

// Store for password reset codes (in production, use Redis or database)
const resetCodes = new Map(); // Map<identifier, { code, expiresAt, userId }>

// Request password reset - send 6-digit code via SMS
const requestPasswordReset = async (req, res) => {
  try {
    const { identifier } = req.body;

    if (!identifier) {
      return res.status(400).json({ success: false, message: 'Email, username, or phone number is required' });
    }

    console.log('[requestPasswordReset] Looking up user:', identifier);

    // Normalize phone number if it looks like a phone number
    let normalizedPhone = null;
    if (/^[0-9+\s()-]+$/.test(identifier)) {
      normalizedPhone = smsService.formatPhoneNumber(identifier);
      console.log('[requestPasswordReset] Normalized phone:', normalizedPhone);
    }

    // Look up user by email, username, or contact_number
    // Also try normalized phone format if applicable
    let query = supabase
      .from('users')
      .select('user_id, username, email, contact_number, firstname, surname');

    if (normalizedPhone) {
      // Search by email, username, contact_number, or normalized phone
      query = query.or(`email.eq.${identifier},username.eq.${identifier},contact_number.eq.${identifier},contact_number.eq.${normalizedPhone}`);
    } else {
      query = query.or(`email.eq.${identifier},username.eq.${identifier},contact_number.eq.${identifier}`);
    }

    const { data: users, error } = await query.limit(1);

    if (error) {
      console.error('[requestPasswordReset] Database error:', error);
      return res.status(500).json({ success: false, message: 'Error looking up user' });
    }

    console.log('[requestPasswordReset] Query result - users found:', users?.length || 0);

    if (!users || users.length === 0) {
      console.log('[requestPasswordReset] No user found with identifier:', identifier);
      // Don't reveal whether user exists for security
      return res.status(200).json({
        success: true,
        message: 'If an account exists with that information, a reset code has been sent.'
      });
    }

    const user = users[0];
    console.log('[requestPasswordReset] User found:', { userId: user.user_id, username: user.username, hasContact: !!user.contact_number });

    // Check if user has a valid contact number
    if (!user.contact_number) {
      console.log('[requestPasswordReset] User has no contact number:', user.username);
      // Don't reveal this for security, but log it
      return res.status(200).json({
        success: true,
        message: 'If an account exists with that information, a reset code has been sent.'
      });
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes

    // Store the code
    resetCodes.set(identifier.toLowerCase(), {
      code,
      expiresAt,
      userId: user.user_id
    });

    // Format phone number and send SMS
    const phoneNumber = smsService.formatPhoneNumber(user.contact_number);
    const message = `This is your code for resetting your password: ${code}\n\nThis code will expire in 15 minutes.\n\n- Barangay Health Center`;

    console.log('[requestPasswordReset] Sending SMS to:', phoneNumber);

    const smsResult = await smsService.sendSMS(phoneNumber, message);

    if (!smsResult.success) {
      console.error('[requestPasswordReset] SMS sending failed:', smsResult.error);
      return res.status(500).json({
        success: false,
        message: 'Failed to send reset code. Please check your phone number.'
      });
    }

    console.log('[requestPasswordReset] Reset code sent successfully to:', phoneNumber);

    res.status(200).json({
      success: true,
      message: 'Reset code sent to your registered phone number.',
      phoneHint: phoneNumber.slice(0, 6) + '****' + phoneNumber.slice(-2) // Show partial number
    });

  } catch (error) {
    console.error('[requestPasswordReset] Error:', error);
    res.status(500).json({ success: false, message: 'Error processing password reset request' });
  }
};

// Verify reset code
const verifyResetCode = (req, res) => {
  try {
    const { identifier, code } = req.body;

    if (!identifier || !code) {
      return res.status(400).json({ success: false, message: 'Identifier and code are required' });
    }

    const resetData = resetCodes.get(identifier.toLowerCase());

    if (!resetData) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset code' });
    }

    if (Date.now() > resetData.expiresAt) {
      resetCodes.delete(identifier.toLowerCase());
      return res.status(400).json({ success: false, message: 'Reset code has expired. Please request a new one.' });
    }

    if (resetData.code !== code) {
      return res.status(400).json({ success: false, message: 'Invalid reset code' });
    }

    res.status(200).json({
      success: true,
      message: 'Code verified successfully'
    });

  } catch (error) {
    console.error('[verifyResetCode] Error:', error);
    res.status(500).json({ success: false, message: 'Error verifying reset code' });
  }
};

// Reset password with verified code
const resetPasswordWithCode = async (req, res) => {
  try {
    const { identifier, code, newPassword } = req.body;

    if (!identifier || !code || !newPassword) {
      return res.status(400).json({ success: false, message: 'Identifier, code, and new password are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long' });
    }

    const resetData = resetCodes.get(identifier.toLowerCase());

    if (!resetData) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset code' });
    }

    if (Date.now() > resetData.expiresAt) {
      resetCodes.delete(identifier.toLowerCase());
      return res.status(400).json({ success: false, message: 'Reset code has expired. Please request a new one.' });
    }

    if (resetData.code !== code) {
      return res.status(400).json({ success: false, message: 'Invalid reset code' });
    }

    // Get user's Supabase auth ID
    const { data: mapping, error: mappingError } = await supabase
      .from('user_mapping')
      .select('uuid')
      .eq('user_id', resetData.userId)
      .single();

    if (mappingError || !mapping) {
      console.error('[resetPasswordWithCode] Mapping error:', mappingError);
      return res.status(500).json({ success: false, message: 'Error finding user mapping' });
    }

    // Update password in Supabase Auth
    const authClient = getAuthClient();
    const { error: updateError } = await authClient.auth.admin.updateUserById(
      mapping.uuid,
      { password: newPassword }
    );

    if (updateError) {
      console.error('[resetPasswordWithCode] Password update error:', updateError);
      return res.status(500).json({ success: false, message: 'Error updating password' });
    }

    // Delete the used code
    resetCodes.delete(identifier.toLowerCase());

    // Log activity
    await logActivity({
      action_type: ACTIVITY.USER.PASSWORD_RESET,
      description: 'Password reset via SMS verification code',
      user_id: resetData.userId
    });

    console.log('[resetPasswordWithCode] Password reset successfully for user:', resetData.userId);

    res.status(200).json({
      success: true,
      message: 'Password reset successfully. You can now login with your new password.'
    });

  } catch (error) {
    console.error('[resetPasswordWithCode] Error:', error);
    res.status(500).json({ success: false, message: 'Error resetting password' });
  }
};

export {
  registerUser,
  loginUser,
  logoutUser,
  linkSupabaseUser,
  getUserMapping,
  refreshToken,
  debugCurrentUserUUID,
  changeCurrentPassword,
  getCurrentUserProfile,
  requestPasswordReset,
  verifyResetCode,
  resetPasswordWithCode
};
