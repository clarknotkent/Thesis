import express from 'express';
const router = express.Router();
import { authenticateRequest, authorizeRole, checkUserMapping } from '../middlewares/authMiddleware.js';
import { createUser,
  getUser,
  updateUser,
  deleteUser,
  listUsers,
  getUserProfile,
  updateUserRole,
  deactivateUser,
  getUserActivityLogs,
  restoreUser,
  resetPassword } from '../controllers/userController.js';

// GET /api/users - Get all users with pagination and filtering
router.get('/', authenticateRequest, checkUserMapping, listUsers);

// GET /api/users/:id - Get user by ID
router.get('/:id', authenticateRequest, checkUserMapping, getUser);

// GET /api/users/:id/profile - Get user profile
router.get('/:id/profile', authenticateRequest, checkUserMapping, getUserProfile);

// GET /api/users/:id/activity - Get user activity logs
router.get('/:id/activity', authenticateRequest, checkUserMapping, getUserActivityLogs);

// POST /api/users - Create new user
router.post('/', authenticateRequest, checkUserMapping, authorizeRole(['admin']), createUser);

// PUT /api/users/:id - Update user
router.put('/:id', authenticateRequest, checkUserMapping, authorizeRole(['admin']), updateUser);

// PUT /api/users/:id/role - Update user role
router.put('/:id/role', authenticateRequest, checkUserMapping, authorizeRole(['admin']), updateUserRole);

// PUT /api/users/:id/deactivate - Deactivate user
router.put('/:id/deactivate', authenticateRequest, checkUserMapping, authorizeRole(['admin']), deactivateUser);

// DELETE /api/users/:id - Delete user
router.delete('/:id', authenticateRequest, checkUserMapping, authorizeRole(['admin']), deleteUser);

// POST /api/users/:id/restore - Restore soft deleted user
router.post('/:id/restore', authenticateRequest, checkUserMapping, authorizeRole(['admin']), restoreUser);

// POST /api/users/:id/reset-password - Reset password (self or admin)
router.post('/:id/reset-password', authenticateRequest, checkUserMapping, resetPassword);

export default router;
