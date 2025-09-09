const userModel = require('../models/userModel');

// GET /api/users - Get all users with pagination and filtering
const getUsers = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      role = '', 
      status = '',
      sortBy = 'createdAt',
      sortOrder = 'desc' 
    } = req.query;

    const users = await userModel.getAllUsers();

    let filteredUsers = [...users];

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filteredUsers = filteredUsers.filter(user => 
        user.name.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower)
      );
    }

    // Apply role filter
    if (role) {
      filteredUsers = filteredUsers.filter(user => user.role === role);
    }

    // Apply status filter
    if (status) {
      filteredUsers = filteredUsers.filter(user => user.status === status);
    }

    // Apply sorting
    filteredUsers.sort((a, b) => {
      let valueA = a[sortBy];
      let valueB = b[sortBy];
      
      if (sortBy === 'createdAt' || sortBy === 'lastLogin') {
        valueA = new Date(valueA);
        valueB = new Date(valueB);
      }
      
      if (sortOrder === 'desc') {
        return valueB > valueA ? 1 : valueB < valueA ? -1 : 0;
      } else {
        return valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
      }
    });

    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const totalItems = filteredUsers.length;
    const totalPages = Math.ceil(totalItems / limitNum);

    const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

    // Remove sensitive data
    const safeUsers = paginatedUsers.map(user => {
      const { password, ...safeUser } = user;
      return safeUser;
    });

    res.json({
      success: true,
      data: safeUsers,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalItems,
        limit: limitNum,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1
      },
      filters: {
        search,
        role, 
        status,
        sortBy,
        sortOrder
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
};

// GET /api/users/:id - Get user by ID
const getUserById = async (req, res) => {
  try {
    const user = await userModel.getUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    // Remove sensitive data
    const { password, ...safeUser } = user;
    
    res.json({
      success: true,
      data: safeUser
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: error.message
    });
  }
};

// POST /api/users - Create new user
const createUser = async (req, res) => {
  try {
    const newUser = await userModel.createUser(req.body);
    res.status(201).json(newUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to create user' });
  }
};

// PUT /api/users/:id - Update user
const updateUser = async (req, res) => {
  try {
    const updatedUser = await userModel.updateUser(req.params.id, req.body);
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(updatedUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update user' });
  }
};

// DELETE /api/users/:id - Delete user
const deleteUser = async (req, res) => {
  try {
    await userModel.deleteUser(req.params.id);
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to delete user' });
  }
};

// GET /api/users/stats - Get user statistics
const getUserStats = (req, res) => {
  try {
    const stats = {
      totalUsers: users.length,
      admins: users.filter(u => u.role === 'admin').length,
      healthWorkers: users.filter(u => u.role === 'health_worker').length,
      parents: users.filter(u => u.role === 'parent').length,
      activeUsers: users.filter(u => u.status === 'active').length,
      inactiveUsers: users.filter(u => u.status === 'inactive').length,
      recentlyJoined: users.filter(u => {
        const joinDate = new Date(u.createdAt);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return joinDate >= thirtyDaysAgo;
      }).length
    };
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user statistics',
      error: error.message
    });
  }
};

// GET /api/users/activity - Get user activity logs
const getUserActivityLogs = (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const totalItems = userActivityLogs.length;
    const totalPages = Math.ceil(totalItems / limitNum);

    // Sort by timestamp desc
    const sortedLogs = userActivityLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const paginatedLogs = sortedLogs.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: paginatedLogs,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalItems,
        limit: limitNum,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1
      }
    });
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching activity logs',
      error: error.message
    });
  }
};

// PUT /api/users/:id/password - Update user password
const updateUserPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    // Logic to update user password
    // Example: const result = await userModel.updatePassword(id, newPassword);

    res.json({ message: 'User password updated successfully' });
  } catch (error) {
    console.error('Error updating user password:', error);
    res.status(500).json({ message: 'Failed to update user password', error: error.message });
  }
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUserStats,
  getUserActivityLogs,
  updateUserPassword,
};