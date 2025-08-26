const { users, userActivityLogs, dashboardStats, recentVaccinations } = require('../models/mockData');

// GET /api/users - Get all users with pagination and filtering
const getUsers = (req, res) => {
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
const getUserById = (req, res) => {
  try {
    const { id } = req.params;
    
    const user = users.find(u => u.id === id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: `User with ID ${id} not found`
      });
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
const createUser = (req, res) => {
  try {
    const { name, email, role, phone, status = 'active' } = req.body;
    
    // Validation
    if (!name || !email || !role) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and role are required'
      });
    }

    // Check if email already exists
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email already exists'
      });
    }
    
    // Generate new ID
    const newId = (Math.max(...users.map(u => parseInt(u.id))) + 1).toString();
    
    // Create new user
    const newUser = {
      id: newId,
      name,
      email,
      role,
      status,
      phone: phone || null,
      lastLogin: null,
      createdAt: new Date().toISOString(),
      avatar: null
    };
    
    // Add to array
    users.push(newUser);
    
    // Remove sensitive data before returning
    const { password, ...safeUser } = newUser;
    
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: safeUser
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating user',
      error: error.message
    });
  }
};

// PUT /api/users/:id - Update user
const updateUser = (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, phone, status } = req.body;
    
    // Find user index
    const userIndex = users.findIndex(u => u.id === id);
    
    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        message: `User with ID ${id} not found`
      });
    }
    
    // Check if new email already exists (exclude current user)
    if (email) {
      const existingUser = users.find(u => u.email === email && u.id !== id);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'Email already exists'
        });
      }
    }
    
    // Update user properties
    if (name !== undefined) users[userIndex].name = name;
    if (email !== undefined) users[userIndex].email = email;
    if (role !== undefined) users[userIndex].role = role;
    if (phone !== undefined) users[userIndex].phone = phone;
    if (status !== undefined) users[userIndex].status = status;
    
    // Remove sensitive data before returning
    const { password, ...safeUser } = users[userIndex];
    
    res.json({
      success: true,
      message: 'User updated successfully',
      data: safeUser
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user',
      error: error.message
    });
  }
};

// PUT /api/users/:id/password - Update user password
const updateUserPassword = (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;
    
    // Validation
    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }
    
    // Find user index
    const userIndex = users.findIndex(u => u.id === id);
    
    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        message: `User with ID ${id} not found`
      });
    }
    
    // In a real app, you would hash the password here
    users[userIndex].password = password;
    
    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating password',
      error: error.message
    });
  }
};

// DELETE /api/users/:id - Delete user
const deleteUser = (req, res) => {
  try {
    const { id } = req.params;
    
    // Find user index
    const userIndex = users.findIndex(u => u.id === id);
    
    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        message: `User with ID ${id} not found`
      });
    }
    
    // Prevent deletion of last admin
    const user = users[userIndex];
    if (user.role === 'admin') {
      const adminCount = users.filter(u => u.role === 'admin').length;
      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete the last admin user'
        });
      }
    }
    
    // Remove user from array
    const deletedUser = users.splice(userIndex, 1)[0];
    
    res.json({
      success: true,
      message: `User "${deletedUser.name}" deleted successfully`,
      data: { id: deletedUser.id, name: deletedUser.name }
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting user',
      error: error.message
    });
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

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  updateUserPassword,
  deleteUser,
  getUserStats,
  getUserActivityLogs
};