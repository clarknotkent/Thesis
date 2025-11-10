import supabase from '../db.js';
import bcrypt from 'bcrypt';

// Normalization functions
const toTitleCase = (str) => {
  if (!str || typeof str !== 'string') return str;
  return str.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
};

// Map any incoming variant to DB-enforced tokens: 'Admin','HealthStaff','Guardian'
const mapIncomingRoleToStored = (role) => {
  const r = (role || '').trim().toLowerCase();
  if (!r) return null;
  if (['admin','administrator','system admin'].includes(r)) return 'Admin';
  if (['health worker','health_worker','healthworker','health-worker','hw','healthworkers','health workers','health-workers','healthworker(s)','health staff','health_staff','healthstaff','health-staff','hs','healthstaffs','health staffs','health-staffs','healthstaff(s)'].includes(r) || /^health[-_ ]?(workers?|staffs?)$/.test(r)) return 'HealthStaff';
  if (['guardian','parent','guardian-parent'].includes(r)) return 'Guardian';
  return role; // let constraint reject invalid token
};
const toDisplayRole = (stored) => {
  if (stored === 'HealthStaff') return 'Health Staff';
  if (stored === 'Guardian') return 'Parent';
  return stored;
};

const HS_TYPES = ['nurse','nutritionist','bhs'];

// Normalize incoming hs_type to stored tokens
// Accepts common variants and casing; returns one of HS_TYPES or null if unknown
const mapIncomingHsTypeToStored = (hsType) => {
  const t = (hsType || '').trim().toLowerCase();
  if (!t) return null;
  if (['nurse', 'registered nurse', 'rn'].includes(t)) return 'nurse';
  if (['nutritionist', 'dietician', 'dietitian'].includes(t)) return 'nutritionist';
  if (['bhs', 'barangay health staff', 'barangay health station', 'barangay health worker', 'barangay health workers'].includes(t)) return 'bhs';
  return HS_TYPES.includes(t) ? t : null;
};

// Normalize contact number to +639... format
const normalizeContactNumber = (contact) => {
  if (!contact) return null;
  const cleaned = contact.replace(/\D/g, '');
  if (cleaned.length === 11 && cleaned.startsWith('09')) {
    return '+639' + cleaned.slice(2);
  } else if (cleaned.length === 11 && cleaned.startsWith('639')) {
    return '+639' + cleaned.slice(3);
  } else if (cleaned.length === 12 && cleaned.startsWith('639')) {
    return '+639' + cleaned.slice(3);
  } else {
    return contact; // keep original if can't normalize
  }
};

const userModel = {
  // Get all users with filtering and pagination
  getAllUsers: async (filters = {}, page = 1, limit = 10) => {
    try {
      let query = supabase
        .from('users_with_uuid')
        .select('user_id, username, email, role, hs_type, firstname, middlename, surname, last_login, contact_number, employee_id, professional_license_no, is_deleted, supabase_uuid, created_by, updated_by', { count: 'exact' });

      // Apply filters
      if (filters.search) {
        query = query.or(`username.ilike.%${filters.search}%,email.ilike.%${filters.search}%,firstname.ilike.%${filters.search}%,surname.ilike.%${filters.search}%`);
      }

      if (filters.role) {
        const raw = (filters.role || '').trim().toLowerCase();
        if (!['all','all-users','all_users','alluser','allusers'].includes(raw)) {
          const stored = mapIncomingRoleToStored(filters.role);
          const ROLE_VARIANTS = {
            'Admin': ['Admin','admin','administrator','system admin'],
            'HealthStaff': ['HealthStaff','healthstaff','health staff','health_staff','health-staffs','health staffs','Health Staff','hs','healthstaffs'],
            'Guardian': ['Guardian','guardian','parent','guardian-parent']
          };
          const variants = ROLE_VARIANTS[stored];
          if (variants && variants.length) {
            query = query.in('role', variants);
          } else if (stored) {
            query = query.eq('role', stored);
          }
        }
      }

      if (filters.status) {
        const st = String(filters.status).toLowerCase();
        if (st === 'archived') {
          query = query.eq('is_deleted', true);
        } else if (st === 'not_archived' || st === 'active' || st === 'inactive') {
          // Without a dedicated status column, treat all non-deleted as visible
          query = query.eq('is_deleted', false);
        }
      }

      if (filters.hs_type) {
        query = query.eq('hs_type', filters.hs_type);
      }

      // Apply pagination
      const offset = (page - 1) * limit;
      const { data, error, count } = await query
        .range(offset, offset + limit - 1)
        .order('user_id', { ascending: true });

      if (error) throw error;

      // Fetch base user_status from users table to support visible 'inactive' vs 'active'
      let statusMap = {};
      try {
        const ids = (data || []).map(u => u.user_id).filter(Boolean);
        if (ids.length) {
          const { data: srows } = await supabase
            .from('users')
            .select('user_id, user_status')
            .in('user_id', ids);
          if (Array.isArray(srows)) {
            statusMap = srows.reduce((acc, r) => { acc[r.user_id] = (r.user_status || 'active'); return acc; }, {});
          }
        }
      } catch (_) { /* if status column missing, treat all as active */ }

      if (data && data.length) {
        const f = data[0];
        console.log('[userModel.getAllUsers] RESULT count', count || data.length, 'firstUser', { id: f.user_id, created_by: f.created_by, updated_by: f.updated_by });
      } else {
        console.log('[userModel.getAllUsers] RESULT empty');
      }

      return {
        users: (data || []).map(u => {
          const roleDisplay = toDisplayRole(u.role);
          const baseStatus = String(statusMap[u.user_id] || 'active').toLowerCase();
          const derivedStatus = u.is_deleted ? 'archived' : (baseStatus === 'inactive' ? 'inactive' : 'active');
          return {
            id: u.user_id,
            username: u.username,
            email: u.email,
            role: roleDisplay,
            firstname: u.firstname,
            middlename: u.middlename || null,
            surname: u.surname,
            hs_type: u.hs_type || null,
            employee_id: u.employee_id || null,
            professional_license_no: u.professional_license_no || null,
            status: derivedStatus,
            user_status: baseStatus,
            lastLogin: u.last_login || null,
            contact_number: u.contact_number || null,
            name: [u.firstname, u.middlename, u.surname].filter(Boolean).join(' '),
            supabase_uuid: u.supabase_uuid || null,
            created_by: u.created_by || null,
            updated_by: u.updated_by || null
          };
        }),
        totalCount: count || 0,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil((count || 0) / limit)
      };
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  // Get user by ID (without password)
  getUserById: async (id) => {
    try {
      const { data, error } = await supabase
        .from('users_with_uuid')
        .select('user_id, username, email, role, hs_type, firstname, middlename, surname, contact_number, address, sex, birthdate, employee_id, professional_license_no, supabase_uuid, is_deleted')
        .eq('user_id', id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      if (!data) return null;
      // Enrich with status from base table if available
      try {
        const { data: srow } = await supabase
          .from('users')
          .select('user_status')
          .eq('user_id', id)
          .single();
        const baseStatus = (srow?.user_status || 'active').toLowerCase();
        const derivedStatus = data.is_deleted ? 'archived' : (baseStatus === 'inactive' ? 'inactive' : 'active');
        return { ...data, user_status: baseStatus, status: derivedStatus };
      } catch(_) {
        return { ...data, user_status: 'active', status: data.is_deleted ? 'archived' : 'active' };
      }
    } catch (error) {
      console.error('Error fetching user by ID:', error);
      throw error;
    }
  },

  // Create new user
  // options: { allowSelf: boolean } -> if false and no actorId provided, reject
  createUser: async (userData, actorId = null, options = { allowSelf: true }) => {
    try {
      // Enforce actor presence if self-registration not allowed
      if (!actorId && !options.allowSelf) {
        throw new Error('Actor context required for user creation');
      }
      // Do NOT store password locally; Supabase Auth holds credentials
      const storedRole = mapIncomingRoleToStored(userData.role);
      let hsType = null;
      if (storedRole === 'HealthStaff') {
        const normalizedHs = mapIncomingHsTypeToStored(userData.hs_type);
        if (normalizedHs && HS_TYPES.includes(normalizedHs)) {
          hsType = normalizedHs;
        }
      }
      // Ensure audit actor fallback (self is unknown yet; will patch after insert)
      const incomingCreatedBy = actorId || userData.created_by || null;
      const incomingUpdatedBy = actorId || userData.updated_by || incomingCreatedBy || null;
      // Derive username from email if not provided (only for legacy compatibility)
      if (!userData.username && userData.email && !userData.email.includes('@immunizeme.com')) {
        userData.username = userData.email.split('@')[0];
      }

      // Normalize text fields
      const normalizedFirstname = userData.firstname ? toTitleCase(userData.firstname) : userData.firstname;
      const normalizedMiddlename = userData.middlename ? toTitleCase(userData.middlename) : userData.middlename;
      const normalizedSurname = userData.surname ? toTitleCase(userData.surname) : userData.surname;
      const normalizedAddress = userData.address ? toTitleCase(userData.address) : userData.address;

      const payload = {
        username: userData.username,
        email: userData.email,
        role: storedRole,
        firstname: normalizedFirstname,
        middlename: normalizedMiddlename || null,
        surname: normalizedSurname,
        contact_number: normalizeContactNumber(userData.contact_number) || null,
        address: normalizedAddress || null,
        sex: userData.sex || 'Other',
        birthdate: userData.birthdate || null,
        // visible activity flag stored in users.user_status
        user_status: ((userData.user_status || userData.status) === 'inactive') ? 'inactive' : 'active',
        // archived is represented by is_deleted; default new users to not archived
        is_deleted: false,
        professional_license_no: (storedRole === 'HealthStaff' || storedRole === 'Admin') ? (userData.professional_license_no || null) : null,
        employee_id: null, // Autogenerated for Admin/HealthStaff after insert
        hs_type: hsType,
        created_by: incomingCreatedBy,
        updated_by: incomingUpdatedBy
      };
      // If BHS subtype, ensure license is null
      if (hsType === 'bhs') {
        payload.professional_license_no = null;
      }

      console.log('[userModel.createUser] STEP1 build', { actorId, created_by: payload.created_by, updated_by: payload.updated_by, role: payload.role });
      console.log('[userModel.createUser] STEP2 insert start user/email', payload.username, payload.email);

      const { data, error } = await supabase
        .from('users')
        .insert(payload)
        .select('user_id, username, email, role, hs_type, firstname, middlename, surname, contact_number, address, birthdate, employee_id, professional_license_no, created_by, updated_by')
        .single();

      if (error) throw error;

      // Autogenerate employee_id for Admin and HealthStaff roles
      if (storedRole === 'Admin' || storedRole === 'HealthStaff') {
        const prefix = storedRole === 'Admin' ? 'ADM' : 'HS';
        const generatedEmployeeId = `${prefix}${data.user_id.toString().padStart(4, '0')}`;
        const { error: updateError } = await supabase
          .from('users')
          .update({ employee_id: generatedEmployeeId })
          .eq('user_id', data.user_id);
        if (updateError) {
          console.warn('[userModel.createUser] Failed to update autogenerated employee_id:', updateError);
        } else {
          data.employee_id = generatedEmployeeId;
        }
      }

      // Post-insert correction logic:
      // 1. If actorId provided and created_by != actorId, update it.
      // 2. If no actorId and both null, self-assign to own user_id (true self-registration).
      if (actorId && data.created_by !== actorId) {
        console.log('[userModel.createUser] STEP3 correction needed', { user: data.user_id, actor: actorId, stored_created_by: data.created_by });
        const { data: corrected, error: corrErr } = await supabase
          .from('users')
          .update({ created_by: actorId, updated_by: actorId })
          .eq('user_id', data.user_id)
          .select('user_id, username, email, role, hs_type, firstname, middlename, surname, contact_number, employee_id, professional_license_no, created_by, updated_by')
          .single();
        if (!corrErr && corrected) return corrected;
      } else if (!actorId && data.created_by === null && data.updated_by === null) {
        console.log('[userModel.createUser] STEP3 self-assign (no actor) user', data.user_id);
        const { data: selfAssign, error: selfErr } = await supabase
          .from('users')
          .update({ created_by: data.user_id, updated_by: data.user_id })
          .eq('user_id', data.user_id)
          .select('user_id, username, email, role, hs_type, firstname, middlename, surname, contact_number, employee_id, professional_license_no, created_by, updated_by')
          .single();
        if (!selfErr && selfAssign) return selfAssign;
      }
      return data;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },

  // Update user
  updateUser: async (id, updates) => {
    try {
      const updateData = { ...updates };

      // Password updates should go through Supabase Auth; ignore local password field
      if (updateData.password) {
        delete updateData.password;
      }

      const incomingStatusToken = (typeof updates.user_status !== 'undefined') ? updates.user_status : updates.status;
      if (typeof incomingStatusToken !== 'undefined') {
        const st = String(incomingStatusToken).toLowerCase();
        if (st === 'archived') {
          updateData.is_deleted = true;
          updateData.user_status = 'inactive'; // keep a logical visible state for when restored
        } else if (st === 'active' || st === 'inactive') {
          updateData.is_deleted = false;
          updateData.user_status = st;
        } else {
          // unknown token: ignore status
          delete updateData.user_status;
        }
      }

      // Whitelist allowed columns to avoid unknown column errors
      let incomingRoleToken = null;
      if (typeof updateData.role !== 'undefined') {
        incomingRoleToken = mapIncomingRoleToStored(updateData.role);
        updateData.role = incomingRoleToken;
      }
      // Force updated_by fallback if not provided
      if (!updateData.updated_by && updates.actor_id) {
        updateData.updated_by = updates.actor_id;
      }

      const allowed = ['username', 'email', 'role', 'hs_type', 'firstname', 'middlename', 'surname', 'contact_number', 'address', 'sex', 'birthdate', 'user_status', 'is_deleted', 'professional_license_no', 'employee_id', 'updated_by'];
      const filtered = Object.fromEntries(Object.entries(updateData).filter(([k]) => allowed.includes(k)));

      // Normalize contact number
      if (filtered.contact_number) {
        filtered.contact_number = normalizeContactNumber(filtered.contact_number);
      }

      // Normalize text fields
      if (filtered.firstname) filtered.firstname = toTitleCase(filtered.firstname);
      if (filtered.middlename) filtered.middlename = toTitleCase(filtered.middlename);
      if (filtered.surname) filtered.surname = toTitleCase(filtered.surname);
      if (filtered.address) filtered.address = toTitleCase(filtered.address);
      // Role-based pruning
      // Decide effective role for pruning: newly provided or existing DB value
      let effectiveRole = (filtered.role || '').toLowerCase();
      if (!effectiveRole) {
        // fetch current to know existing role (single select minimal fields)
        try {
          const { data: currentRoleRow } = await supabase.from('users').select('role').eq('user_id', id).single();
          effectiveRole = (currentRoleRow?.role || '').toLowerCase();
        } catch (_) {}
      }
      if (['guardian','parent'].includes(effectiveRole)) {
        delete filtered.employee_id;
        delete filtered.professional_license_no;
        delete filtered.hs_type;
      } else if (['healthstaff','health staff','health_staff'].includes(effectiveRole)) {
        if (typeof filtered.hs_type !== 'undefined') {
          const normalizedHs = mapIncomingHsTypeToStored(filtered.hs_type);
          if (normalizedHs && HS_TYPES.includes(normalizedHs)) {
            filtered.hs_type = normalizedHs;
          } else {
            delete filtered.hs_type; // invalid subtype
          }
        }
        // PRC license required only for nurse / nutritionist? (Optionally enforce)
        if (filtered.hs_type === 'bhs') {
          // BHS should not carry professional license (optional prune)
          if (filtered.professional_license_no) delete filtered.professional_license_no;
        }
      } else if (['admin','administrator','system admin'].includes(effectiveRole)) {
        // allow both
        delete filtered.hs_type; // Admin not a HS subtype
      } else {
        delete filtered.employee_id;
        delete filtered.professional_license_no;
        delete filtered.hs_type;
      }

      const { data, error } = await supabase
        .from('users')
        .update(filtered)
        .eq('user_id', id)
        .select('user_id, username, email, role, hs_type, firstname, middlename, surname, contact_number, address, birthdate, employee_id, professional_license_no, created_by, updated_by')
        .single();

      if (error) throw error;
      console.log('[userModel.updateUser] updated user', { id, filtered });
      return data;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  },

  // Soft delete user
  deleteUser: async (id, actorId) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
          deleted_by: actorId || null
        })
        .eq('user_id', id)
        .select('user_id, username, email')
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  },

  // Restore soft deleted user
  restoreUser: async (id) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({ is_deleted: false, deleted_at: null, deleted_by: null, user_status: 'active' })
        .eq('user_id', id)
        .select('user_id')
        .single();
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error restoring user:', error);
      throw error;
    }
  },

  // Get user by username or email (for authentication)
  getUserByUsernameOrEmail: async (identifier) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('user_id, username, email, password_hash, role, firstname, surname')
        .or(`username.eq.${identifier},email.eq.${identifier}`)
        .eq('is_deleted', false)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching user by username/email:', error);
      throw error;
    }
  },

  // Verify user password
  verifyPassword: async (plainPassword, hashedPassword) => {
    try {
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
      console.error('Error verifying password:', error);
      throw error;
    }
  },

  // Update last login
  updateLastLogin: async (id) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          last_login: new Date().toISOString()
        })
        .eq('user_id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating last login:', error);
      throw error;
    }
  },

  // Assign role to user
  assignRole: async (userId, role) => {
    try {
      // Normalize incoming role to stored token
      const normalized = mapIncomingRoleToStored(role);
      const { data, error } = await supabase
        .from('users')
        .update({
          role: normalized
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error assigning role:', error);
      throw error;
    }
  },

  // Get user profile with additional information
  getUserProfile: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('users_with_uuid')
        .select(`
          user_id,
          username,
          email,
          firstname,
          middlename,
          surname,
          role,
          hs_type,
          contact_number,
          address,
          date_registered,
          last_login,
          supabase_uuid
        `)
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  },
};

export default userModel;
