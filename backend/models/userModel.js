const supabase = require('../db');

// Map any incoming variant to DB-enforced tokens: 'Admin','HealthWorker','Guardian'
const mapIncomingRoleToStored = (role) => {
  const r = (role || '').trim().toLowerCase();
  if (!r) return null;
  if (['admin','administrator','system admin'].includes(r)) return 'Admin';
  if (['health worker','health_worker','healthworker','health-worker','hw','healthworkers','health workers','health-workers','healthworker(s)'].includes(r) || /^health[-_ ]?workers?$/.test(r)) return 'HealthWorker';
  if (['guardian','parent','guardian-parent'].includes(r)) return 'Guardian';
  return role; // let constraint reject invalid token
};
const toDisplayRole = (stored) => {
  if (stored === 'HealthWorker') return 'Health Worker';
  if (stored === 'Guardian') return 'Parent';
  return stored;
};

const HW_TYPES = ['nurse','nutritionist','bhw'];

const userModel = {
  // Get all users with filtering and pagination
  getAllUsers: async (filters = {}, page = 1, limit = 10) => {
    try {
      let query = supabase
    .from('users_with_uuid')
  .select('user_id, username, email, role, hw_type, firstname, middlename, surname, last_login, contact_number, employee_id, professional_license_no, is_deleted, supabase_uuid, created_by, updated_by', { count: 'exact' });

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
            'HealthWorker': ['HealthWorker','healthworker','health worker','health_worker','health-workers','health workers','Health Worker','hw','healthworkers'],
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
        if (filters.status === 'active') {
          query = query.eq('is_deleted', false);
        } else if (filters.status === 'inactive') {
          query = query.eq('is_deleted', true);
        }
      }

      if (filters.hw_type) {
        query = query.eq('hw_type', filters.hw_type);
      }

      // Apply pagination
      const offset = (page - 1) * limit;
    const { data, error, count } = await query
  .range(offset, offset + limit - 1)
  .order('user_id', { ascending: true });

      if (error) throw error;

      if (data && data.length) {
        const f = data[0];
        console.log('[userModel.getAllUsers] RESULT count', count || data.length, 'firstUser', { id: f.user_id, created_by: f.created_by, updated_by: f.updated_by });
      } else {
        console.log('[userModel.getAllUsers] RESULT empty');
      }

      return {
        users: (data || []).map(u => {
          const roleDisplay = toDisplayRole(u.role);
          return {
            id: u.user_id,
            username: u.username,
            email: u.email,
            role: roleDisplay,
            firstname: u.firstname,
            middlename: u.middlename || null,
            surname: u.surname,
            hw_type: u.hw_type || null,
            employee_id: u.employee_id || null,
            professional_license_no: u.professional_license_no || null,
            status: u.is_deleted ? 'inactive' : 'active',
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
  .select('user_id, username, email, role, hw_type, firstname, middlename, surname, contact_number, address, sex, birthdate, employee_id, professional_license_no, supabase_uuid')
        .eq('user_id', id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data || null;
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
      let hwType = null;
      if (storedRole === 'HealthWorker' && userData.hw_type && HW_TYPES.includes(userData.hw_type)) {
        hwType = userData.hw_type;
      }
      // Ensure audit actor fallback (self is unknown yet; will patch after insert)
  const incomingCreatedBy = actorId || userData.created_by || null;
  const incomingUpdatedBy = actorId || userData.updated_by || incomingCreatedBy || null;
      const payload = {
        username: userData.username,
        email: userData.email,
        role: storedRole,
        firstname: userData.firstname,
        middlename: userData.middlename || null,
        surname: userData.surname,
        contact_number: userData.contact_number || null,
        address: userData.address || null,
        sex: userData.sex || 'Other',
        birthdate: userData.birthdate || null,
        is_deleted: userData.status === 'inactive',
  professional_license_no: (storedRole === 'HealthWorker' || storedRole === 'Admin') ? (userData.professional_license_no || null) : null,
  employee_id: (storedRole === 'HealthWorker' || storedRole === 'Admin') ? (userData.employee_id || null) : null,
        hw_type: hwType,
        created_by: incomingCreatedBy,
        updated_by: incomingUpdatedBy
      };
      // If BHW subtype, ensure license is null
      if (hwType === 'bhw') {
        payload.professional_license_no = null;
      }

  console.log('[userModel.createUser] STEP1 build', { actorId, created_by: payload.created_by, updated_by: payload.updated_by, role: payload.role });
  console.log('[userModel.createUser] STEP2 insert start user/email', payload.username, payload.email);

  const { data, error } = await supabase
        .from('users')
        .insert(payload)
  .select('user_id, username, email, role, hw_type, firstname, middlename, surname, contact_number, employee_id, professional_license_no, created_by, updated_by')
        .single();

      if (error) throw error;

      // Post-insert correction logic:
      // 1. If actorId provided and created_by != actorId, update it.
      // 2. If no actorId and both null, self-assign to own user_id (true self-registration).
      if (actorId && data.created_by !== actorId) {
        console.log('[userModel.createUser] STEP3 correction needed', { user: data.user_id, actor: actorId, stored_created_by: data.created_by });
        const { data: corrected, error: corrErr } = await supabase
          .from('users')
          .update({ created_by: actorId, updated_by: actorId })
          .eq('user_id', data.user_id)
          .select('user_id, username, email, role, hw_type, firstname, middlename, surname, contact_number, employee_id, professional_license_no, created_by, updated_by')
          .single();
        if (!corrErr && corrected) return corrected;
      } else if (!actorId && data.created_by == null && data.updated_by == null) {
        console.log('[userModel.createUser] STEP3 self-assign (no actor) user', data.user_id);
        const { data: selfAssign, error: selfErr } = await supabase
          .from('users')
          .update({ created_by: data.user_id, updated_by: data.user_id })
          .eq('user_id', data.user_id)
          .select('user_id, username, email, role, hw_type, firstname, middlename, surname, contact_number, employee_id, professional_license_no, created_by, updated_by')
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

      if (typeof updates.status !== 'undefined') {
        updateData.is_deleted = updates.status === 'inactive';
        delete updateData.status;
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

  const allowed = ['username', 'email', 'role', 'hw_type', 'firstname', 'middlename', 'surname', 'contact_number', 'address', 'sex', 'birthdate', 'is_deleted', 'professional_license_no', 'employee_id', 'updated_by'];
      const filtered = Object.fromEntries(Object.entries(updateData).filter(([k]) => allowed.includes(k)));

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
        delete filtered.hw_type;
      } else if (['healthworker','health worker','health_worker'].includes(effectiveRole)) {
        if (filtered.hw_type && !HW_TYPES.includes(filtered.hw_type)) {
          delete filtered.hw_type; // invalid subtype
        }
        // PRC license required only for nurse / nutritionist? (Optionally enforce)
        if (filtered.hw_type === 'bhw') {
          // BHW should not carry professional license (optional prune)
          if (filtered.professional_license_no) delete filtered.professional_license_no;
        }
      } else if (['admin','administrator','system admin'].includes(effectiveRole)) {
        // allow both
        delete filtered.hw_type; // Admin not a HW subtype
      } else {
        delete filtered.employee_id;
        delete filtered.professional_license_no;
        delete filtered.hw_type;
      }

      const { data, error } = await supabase
        .from('users')
        .update(filtered)
        .eq('user_id', id)
  .select('user_id, username, email, role, hw_type, firstname, middlename, surname, contact_number, employee_id, professional_license_no, created_by, updated_by')
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
        .update({ is_deleted: false, deleted_at: null, deleted_by: null })
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
      const { data, error } = await supabase
        .from('users')
        .update({ 
          role: role
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
          hw_type,
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

module.exports = userModel;
