const userModel = require('../models/userModel');

// Create a new user
const createUser = async (req, res) => {
  try {
    const userData = req.body;
    
    // Validate required fields
    if (!userData.username || !userData.email || !userData.password || !userData.role) {
      return res.status(400).json({ message: 'Missing required fields: username, email, password, role' });
    }

    const newUser = await userModel.createUser(userData);
    
    // Remove password from response
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
