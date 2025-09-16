const express = require('express');
const router = express.Router();
const {
  createUser,
  getUser,
  updateUser,
  deleteUser,
  listUsers,
  getUserProfile,
  updateUserRole,
  deactivateUser,
  getUserActivityLogs
} = require('../controllers/userController');

// GET /api/users - Get all users with pagination and filtering
router.get('/', listUsers);

// GET /api/users/:id - Get user by ID
router.get('/:id', getUser);

// GET /api/users/:id/profile - Get user profile
router.get('/:id/profile', getUserProfile);

// GET /api/users/:id/activity - Get user activity logs
router.get('/:id/activity', getUserActivityLogs);

// POST /api/users - Create new user
router.post('/', createUser);

// PUT /api/users/:id - Update user
router.put('/:id', updateUser);

// PUT /api/users/:id/role - Update user role
router.put('/:id/role', updateUserRole);

// PUT /api/users/:id/deactivate - Deactivate user
router.put('/:id/deactivate', deactivateUser);

// DELETE /api/users/:id - Delete user
router.delete('/:id', deleteUser);

module.exports = router;