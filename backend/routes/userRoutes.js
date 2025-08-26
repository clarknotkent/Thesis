const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  updateUserPassword,
  deleteUser,
  getUserStats,
  getUserActivityLogs
} = require('../controllers/userController');

// GET /api/users - Get all users with pagination and filtering
router.get('/', getUsers);

// GET /api/users/stats - Get user statistics
router.get('/stats', getUserStats);

// GET /api/users/activity - Get user activity logs
router.get('/activity', getUserActivityLogs);

// GET /api/users/:id - Get user by ID
router.get('/:id', getUserById);

// POST /api/users - Create new user
router.post('/', createUser);

// PUT /api/users/:id - Update user
router.put('/:id', updateUser);

// PUT /api/users/:id/password - Update user password
router.put('/:id/password', updateUserPassword);

// DELETE /api/users/:id - Delete user
router.delete('/:id', deleteUser);

module.exports = router;