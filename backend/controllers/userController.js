const userModel = require('../models/userModel');
const { getActorId } = require('../utils/actor');
const { createUserMapping } = require('../models/authModel');
const { logActivity } = require('../models/activityLogger');
const { ACTIVITY } = require('../constants/activityTypes');
const { createClient } = require('@supabase/supabase-js');

const getAuthAdmin = () => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
};

// Create a new user
const createUser = async (req, res) => {
  try {
    const userData = req.body;

    // Validate required fields
    if (!userData.email || !userData.password || !userData.role) {
      return res.status(400).json({ message: 'Missing required fields: email, password, role' });
    }

    // 1) Create Supabase Auth user (email/password)
    const admin = getAuthAdmin();
  // ...existing code...
    const { data: created, error: sberr } = await admin.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true,
    });
    if (sberr) {
  console.warn('[users] supabase createUser failed', sberr);
      return res.status(400).json({ message: 'Supabase auth user creation failed', error: sberr.message });
    }

    // 2) Create application user record (with hashed password handled in model)
    let newUser;
    try {
  const actorId = getActorId(req);
  // ...existing code...
      // Ignore any client-supplied created_by/updated_by to prevent spoofing
      const { created_by: _cb, updated_by: _ub, ...rest } = userData;
      const constructed = { ...rest, created_by: actorId, updated_by: actorId };
      const safeLog = { ...constructed };
      if (safeLog.password) safeLog.password = '***redacted***';
  // ...existing code...
  newUser = await userModel.createUser(constructed, actorId, { allowSelf: false });
  // ...existing code...
    } catch (e) {
  console.error('[users] local user create failed, rolling back auth user', e);
      try { await admin.auth.admin.deleteUser(created.user.id); } catch (_) {}
      throw e;
    }

    // 3) Map Supabase UUID to local user_id
    try {
      await createUserMapping({ uuid: created.user.id, user_id: newUser.user_id });
    } catch (mapErr) {
      // Best-effort cleanup if mapping fails: delete the auth user to avoid orphans
      try { await admin.auth.admin.deleteUser(created.user.id); } catch (_) {}
      return res.status(500).json({ message: 'Failed to map Supabase user to local account' });
    }
    // 4) Ensure guardian row exists if role is Guardian
    try {
      const roleToken = (newUser.role || '').toLowerCase();
      if (['guardian','parent','guardian-parent'].includes(roleToken)) {
        const actorId = getActorId(req);
        const ensured = await require('../models/guardianModel').ensureGuardianForUser(newUser, actorId);
        console.log('[users:createUser] ensured guardian_id:', ensured && ensured.guardian_id);
      }
    } catch (e) {
      console.warn('[users:createUser] ensureGuardianForUser failed (non-fatal):', e && e.message);
    }

    const { password, ...safeUser } = newUser;
    try {
      await logActivity({ action_type: ACTIVITY.USER.CREATE, description: `Created user ${safeUser.user_id}`, user_id: req.user?.user_id || null, entity_id: safeUser.user_id, entity_type: 'user', new_value: safeUser });
  } catch (e) { /* activity log failed */ }
    res.status(201).json({ message: 'User created successfully', user: safeUser });
  } catch (error) {
  console.error(error);
    res.status(500).json({ message: 'Failed to create user', error });
  }
};

// Get a user by ID
const getUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await userModel.getUserById(id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Remove password from response
    const { password, ...safeUser } = user;
    res.json(safeUser);
  } catch (error) {
  console.error(error);
    res.status(500).json({ message: 'Failed to fetch user', error });
  }
};

// Update a user (captures old/new diff in activity log)
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const before = await userModel.getUserById(id);
  const actorId = req.user?.user_id || null;
  console.debug('[users:updateUser] before:', JSON.stringify(before || {}));
  console.debug('[users:updateUser] incoming updateData:', JSON.stringify(updateData || {}));
  const updatedUser = await userModel.updateUser(id, { ...updateData, updated_by: actorId });
  // If resulting role is Guardian, ensure guardian record exists
  try {
    const roleToken = (updatedUser && updatedUser.role || '').toLowerCase();
    if (['guardian','parent','guardian-parent'].includes(roleToken)) {
      const actorId2 = getActorId(req);
      const ensured = await require('../models/guardianModel').ensureGuardianForUser({
        user_id: updatedUser.user_id,
        role: updatedUser.role,
        surname: updatedUser.surname,
        firstname: updatedUser.firstname,
        middlename: updatedUser.middlename,
        email: updatedUser.email,
        address: updatedUser.address,
        contact_number: updatedUser.contact_number,
      }, actorId2);
      console.log('[users:updateUser] ensured guardian_id:', ensured && ensured.guardian_id);
    }
  } catch (e) {
    console.warn('[users:updateUser] ensureGuardianForUser failed (non-fatal):', e && e.message);
  }
  console.debug('[users:updateUser] after:', JSON.stringify(updatedUser || {}));
  // If user is guardian, sync guardian core fields from user
  try {
    const roleToken2 = (updatedUser && updatedUser.role || '').toLowerCase();
    if (['guardian','parent','guardian-parent'].includes(roleToken2)) {
      const actorSync = getActorId(req);
      await require('../models/guardianModel').syncGuardianFromUser(updatedUser, actorSync);
    }
  } catch (e) {
    console.warn('[users:updateUser] syncGuardianFromUser failed (non-fatal):', e && e.message);
  }
    
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Remove password from response
    const { password, ...safeUser } = updatedUser;
    try {
      const { password: _pwOld, ...oldSafe } = before || {};
      const activityPayload = {
        action_type: ACTIVITY.USER.UPDATE,
        description: `Updated user ${id}`,
        user_id: req.user?.user_id || null,
        entity_id: id,
        entity_type: 'user',
        old_value: oldSafe || null,
        new_value: safeUser
      };
      console.debug('[users:updateUser] activityPayload:', JSON.stringify(activityPayload));
      await logActivity(activityPayload);
  } catch (e) { /* activity log failed */ }
    res.json({ message: 'User updated successfully', user: safeUser });
  } catch (error) {
  console.error(error);
    res.status(500).json({ message: 'Failed to update user', error });
  }
};

// Delete a user
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
  const actorId = req.user?.user_id || null;
  const success = await userModel.deleteUser(id, actorId);
    
    if (!success) {
      return res.status(404).json({ message: 'User not found' });
    }
    
  try { await logActivity({ action_type: ACTIVITY.USER.SOFT_DELETE, description: `Soft deleted user ${id} by ${actorId}`, user_id: actorId, entity_id: id, entity_type: 'user', new_value: { deleted_by: actorId } }); } catch (e) { /* activity log failed */ }
  // Cascade soft-delete to guardian if exists
  try {
    const { data: g, error: gErr } = await require('../db')
      .from('guardians')
      .select('guardian_id')
      .eq('user_id', id)
      .maybeSingle();
    if (!gErr && g && g.guardian_id) {
      await require('../db')
        .from('guardians')
        .update({ is_deleted: true, deleted_at: new Date().toISOString(), deleted_by: actorId || null })
        .eq('guardian_id', g.guardian_id);
    }
  } catch (e) {
    console.warn('[users:deleteUser] guardian soft-delete cascade failed (non-fatal):', e && e.message);
  }
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
  console.error(error);
    res.status(500).json({ message: 'Failed to delete user', error });
  }
};

// List all users with pagination and filtering
const listUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', role = '', status = '' } = req.query;
    const { users, totalCount, totalPages } = await userModel.getAllUsers(
      { search, role, status },
      parseInt(page),
      parseInt(limit)
    );

    res.json({
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: totalCount,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
  console.error(error);
    res.status(500).json({ message: 'Failed to fetch users', error });
  }
};

// Get user profile
const getUserProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const profile = await userModel.getUserProfile(id);
    
    if (!profile) {
      return res.status(404).json({ message: 'User profile not found' });
    }
    
    res.json(profile);
  } catch (error) {
  console.error(error);
    res.status(500).json({ message: 'Failed to fetch user profile', error });
  }
};

// Update user role
const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    
    if (!role) {
      return res.status(400).json({ message: 'Role is required' });
    }

  const before = await userModel.getUserById(id);
  const updatedUser = await userModel.assignRole(id, role);
    
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    try {
      await logActivity({
        action_type: ACTIVITY.USER.ROLE_UPDATE,
        description: `Updated role for user ${id}`,
        user_id: req.user?.user_id || null,
        entity_id: id,
        entity_type: 'user',
        old_value: before ? { role: before.role } : null,
        new_value: { role: updatedUser.role }
      });
  } catch(e) { /* activity log failed */ }
    // Ensure guardian if role becomes Guardian
    try {
      const roleToken = (updatedUser && updatedUser.role || '').toLowerCase();
      if (['guardian','parent','guardian-parent'].includes(roleToken)) {
        const actorId3 = getActorId(req);
        const ensured = await require('../models/guardianModel').ensureGuardianForUser({ user_id: updatedUser.user_id, role: updatedUser.role }, actorId3);
        console.log('[users:updateUserRole] ensured guardian_id:', ensured && ensured.guardian_id);
      }
    } catch (e) {
      console.warn('[users:updateUserRole] ensureGuardianForUser failed (non-fatal):', e && e.message);
    }
    res.json({ message: 'User role updated successfully', user: updatedUser });
  } catch (error) {
  console.error(error);
    res.status(500).json({ message: 'Failed to update user role', error });
  }
};

// Deactivate user account
const deactivateUser = async (req, res) => {
  try {
    const { id } = req.params;
  const actorId = req.user?.user_id || null;
  const success = await userModel.deleteUser(id, actorId);
    
    if (!success) {
      return res.status(404).json({ message: 'User not found' });
    }
    
  try { await logActivity({ action_type: ACTIVITY.USER.DEACTIVATE, description: `Deactivated user ${id} by ${actorId}` , user_id: actorId, entity_id: id, entity_type: 'user', new_value: { deactivated_by: actorId } }); } catch (e) { /* activity log failed */ }
  // Cascade soft-delete to guardian if exists
  try {
    const { data: g, error: gErr } = await require('../db')
      .from('guardians')
      .select('guardian_id')
      .eq('user_id', id)
      .maybeSingle();
    if (!gErr && g && g.guardian_id) {
      await require('../db')
        .from('guardians')
        .update({ is_deleted: true, deleted_at: new Date().toISOString(), deleted_by: actorId || null })
        .eq('guardian_id', g.guardian_id);
    }
  } catch (e) {
    console.warn('[users:deactivateUser] guardian soft-delete cascade failed (non-fatal):', e && e.message);
  }
    res.json({ message: 'User account deactivated successfully' });
  } catch (error) {
  console.error(error);
    res.status(500).json({ message: 'Failed to deactivate user account', error });
  }
};

// Get user activity logs
const getUserActivityLogs = async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    
    const logs = [];
    res.json(logs);
  } catch (error) {
  console.error(error);
    res.status(500).json({ message: 'Failed to fetch user activity logs', error });
  }
};

// Restore a soft-deleted user
const restoreUser = async (req, res) => {
  try {
    const { id } = req.params;
    const restored = await userModel.restoreUser(id);
    if (!restored) return res.status(404).json({ message: 'User not found' });
    // Also restore linked guardian if exists (mirror of soft-delete cascade)
    try {
      const { data: g, error: gErr } = await require('../db')
        .from('guardians')
        .select('guardian_id, is_deleted')
        .eq('user_id', id)
        .maybeSingle();
      if (!gErr && g && g.guardian_id && g.is_deleted) {
        await require('../db')
          .from('guardians')
          .update({ is_deleted: false, deleted_at: null, deleted_by: null, updated_at: new Date().toISOString(), updated_by: req.user?.user_id || null })
          .eq('guardian_id', g.guardian_id);
      }
    } catch (e) {
      console.warn('[users:restoreUser] guardian restore cascade failed (non-fatal):', e && e.message);
    }
    try { await logActivity({ action_type: ACTIVITY.USER.RESTORE, description: `Restored user ${id}`, user_id: req.user?.user_id || null, entity_id: id, entity_type: 'user' }); } catch (e) { /* activity log failed */ }
    res.json({ message: 'User restored successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to restore user', error });
  }
};

// Reset password (self or admin others)
const resetPassword = async (req, res) => {
  try {
    const { id } = req.params; // target user id
    const { newPassword } = req.body;
    console.debug('[resetPassword] request', { targetId: id, actor: req.user && req.user.user_id, role: req.user && req.user.role });
    if (!newPassword || newPassword.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });
    const acting = req.user?.user_id;
    const actingRole = (req.user?.role || '').toLowerCase();
    if (parseInt(id) !== acting && actingRole !== 'admin') {
      return res.status(403).json({ message: 'Only admins can reset other users passwords' });
    }
    const admin = getAuthAdmin();
  // fetch mapping to supabase uuid
  const profile = await userModel.getUserById(id);
  if (!profile) return res.status(404).json({ message: 'User not found' });

  // Prefer explicit user_mapping lookup by user_id (may contain authoritative supabase UUID)
  let mapping = null;
  try { mapping = await require('../models/authModel').getUserMappingByUserId(id); } catch(e) { console.debug('[resetPassword] mapping lookup failed', e && (e.message||e)); }
  const supabaseUuid = (mapping && mapping.uuid) || profile.supabase_uuid;
  if (!supabaseUuid) return res.status(404).json({ message: 'User mapping not found' });

    // Call Supabase Admin API to update the user's password. Wrap and log errors clearly.
    let pwRes;
    try {
  pwRes = await admin.auth.admin.updateUserById(supabaseUuid, { password: newPassword });
    } catch (e) {
      console.error('[resetPassword] admin.updateUserById threw an exception', { userId: id, uuid: profile.supabase_uuid, err: e && (e.message || e) });
      // Supabase AuthApiError when user missing: allow admin to recreate the Supabase user
      if (e && (e.__isAuthError || e.status === 404 || e.code === 'user_not_found')) {
        if (actingRole === 'admin') {
          console.log('[resetPassword] Supabase user missing — admin requested recreate; attempting createUser');
          try {
            const { data: createdUserData, error: createErr } = await admin.auth.admin.createUser({
              email: profile.email,
              password: newPassword,
              email_confirm: true,
            });
            if (createErr || !createdUserData) {
              console.error('[resetPassword] admin.createUser failed', createErr || createdUserData);
              return res.status(500).json({ message: 'Failed to recreate Supabase user', error: (createErr && createErr.message) || createErr || createdUserData });
            }
            const newUuid = createdUserData.user?.id || createdUserData.id || null;
            if (!newUuid) {
              console.error('[resetPassword] createUser returned unexpected payload', createdUserData);
              return res.status(500).json({ message: 'Failed to recreate Supabase user (missing uuid)', data: createdUserData });
            }
            // Persist mapping (best-effort)
            try { await require('../models/authModel').createUserMapping({ uuid: newUuid, user_id: id }); } catch (mapErr) { console.debug('[resetPassword] createUserMapping failed (non-fatal)', mapErr && mapErr.message); }
            // Consider user created and password already set via createUser; continue to respond success
            try { await logActivity({ action_type: ACTIVITY.USER.PASSWORD_RESET, description: `Password reset (recreated supabase user) for user ${id} by ${acting}`, user_id: acting || null, entity_id: id, entity_type: 'user' }); } catch(_) {}
            return res.json({ message: 'Password reset successfully (Supabase user recreated)' });
          } catch (createEx) {
            console.error('[resetPassword] error while attempting to create Supabase user', createEx);
            return res.status(500).json({ message: 'Failed to recreate Supabase user', error: createEx && createEx.message ? createEx.message : String(createEx) });
          }
        }
        return res.status(404).json({ message: 'Supabase auth user not found (mapping may be stale)', error: e && e.message ? e.message : String(e) });
      }
      return res.status(500).json({ message: 'Failed to reset password (admin API exception)', error: e && e.message ? e.message : String(e) });
    }

    // Supabase admin client may return an object with `error` or `data` fields
    if (pwRes && pwRes.error) {
      console.error('[resetPassword] admin.updateUserById returned error', pwRes.error);
      const perr = pwRes.error || {};
      if (perr.status === 404 || perr.code === 'user_not_found') {
        return res.status(404).json({ message: 'Supabase auth user not found (mapping may be stale)', error: perr.message || perr });
      }
      return res.status(500).json({ message: 'Failed to reset password', error: perr.message || perr });
    }
    if (!pwRes) {
      console.error('[resetPassword] admin.updateUserById returned empty response', { userId: id, uuid: profile.supabase_uuid });
      return res.status(500).json({ message: 'Failed to reset password (empty admin response)' });
    }

    // Force logout -> revoke refresh tokens (best-effort)
    try {
      await admin.auth.admin.signOut(profile.supabase_uuid);
    } catch (e) {
      console.debug('[resetPassword] admin.signOut failed (non-fatal)', e && (e.message || e));
    }

    try {
      await logActivity({ action_type: ACTIVITY.USER.PASSWORD_RESET, description: `Password reset for user ${id} by ${acting}`, user_id: acting || null, entity_id: id, entity_type: 'user' });
    } catch (e) { console.debug('[resetPassword] activity log failed', e); }

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to reset password', error });
  }
};

module.exports = {
  createUser,
  getUser,
  updateUser,
  deleteUser,
  listUsers,
  getUserProfile,
  updateUserRole,
  deactivateUser,
  getUserActivityLogs,
  restoreUser,
  resetPassword,
};
