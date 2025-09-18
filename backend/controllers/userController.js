const userModel = require('../models/userModel');
const { createUserMapping } = require('../models/authModel');
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
    if (!userData.username || !userData.email || !userData.password || !userData.role) {
      return res.status(400).json({ message: 'Missing required fields: username, email, password, role' });
    }

    // 1) Create Supabase Auth user (email/password)
    const admin = getAuthAdmin();
    console.log('[users] creating Supabase auth user', { email: userData.email });
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
      newUser = await userModel.createUser(userData);
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

    const { password, ...safeUser } = newUser;
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

// Update a user
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const updatedUser = await userModel.updateUser(id, updateData);
    
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Remove password from response
    const { password, ...safeUser } = updatedUser;
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
    const success = await userModel.deleteUser(id);
    
    if (!success) {
      return res.status(404).json({ message: 'User not found' });
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

  const updatedUser = await userModel.assignRole(id, role);
    
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
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
  const success = await userModel.deleteUser(id);
    
    if (!success) {
      return res.status(404).json({ message: 'User not found' });
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
};
