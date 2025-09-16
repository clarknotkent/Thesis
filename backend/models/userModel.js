const supabase = require('../db');
const bcrypt = require('bcrypt');

const userModel = {
  // Get all users with filtering and pagination
  getAllUsers: async (filters = {}, page = 1, limit = 10) => {
    try {
      let query = supabase
        .from('users')
        .select('user_id, username, email, role, firstname, surname, last_login, contact_number, is_deleted', { count: 'exact' });

      // Apply filters
      if (filters.search) {
        query = query.or(`username.ilike.%${filters.search}%,email.ilike.%${filters.search}%,firstname.ilike.%${filters.search}%,surname.ilike.%${filters.search}%`);
      }

      if (filters.role) {
        query = query.eq('role', filters.role);
      }

      if (filters.status) {
        if (filters.status === 'active') {
          query = query.eq('is_deleted', false);
        } else if (filters.status === 'inactive') {
          query = query.eq('is_deleted', true);
        }
      }

      // Apply pagination
      const offset = (page - 1) * limit;
      const { data, error, count } = await query
        .range(offset, offset + limit - 1)
        .order('user_id', { ascending: false });

      if (error) throw error;

      return {
        users: (data || []).map(u => ({
          id: u.user_id,
          username: u.username,
          email: u.email,
          role: u.role,
          firstname: u.firstname,
          surname: u.surname,
          status: u.is_deleted ? 'inactive' : 'active',
          lastLogin: u.last_login || null,
          contact_number: u.contact_number || null,
          name: [u.firstname, u.surname].filter(Boolean).join(' ')
        })),
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
        .from('users')
        .select('user_id, username, email, role, firstname, surname')
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
  createUser: async (userData) => {
    try {
      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

      const { data, error } = await supabase
        .from('users')
        .insert({
          username: userData.username,
          email: userData.email,
          password_hash: hashedPassword,
          role: userData.role,
          firstname: userData.firstname,
          surname: userData.surname,
          contact_number: userData.contact_number,
          address: userData.address,
          sex: userData.sex,
          birthdate: userData.birthdate
        })
        .select('user_id, username, email, role, firstname, surname, contact_number')
        .single();

      if (error) throw error;
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
      
      // Hash password if it's being updated
      if (updates.password) {
        const saltRounds = 12;
        updateData.password_hash = await bcrypt.hash(updates.password, saltRounds);
        delete updateData.password;
      }

      const { data, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('user_id', id)
        .select('user_id, username, email, role, firstname, surname, contact_number')
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  },

  // Soft delete user
  deleteUser: async (id) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({ 
          is_deleted: true,
          deleted_at: new Date().toISOString()
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
        .from('users')
        .select(`
          user_id,
          username,
          email,
          firstname,
          surname,
          role,
          contact_number,
          address,
          date_registered,
          last_login
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
