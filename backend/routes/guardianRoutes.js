import express from 'express';
const router = express.Router();
import * as guardianController from '../controllers/guardianController.js';
import { authenticateRequest, authorizeRole } from '../middlewares/authMiddleware.js';

// Apply auth middleware to all routes (but don't require user mapping for reads)
router.use(authenticateRequest);

// GET /guardians - Get all guardians (no user mapping required for admins)
router.get('/', guardianController.getAllGuardians);

// GET /guardians/:id - Get guardian by ID (no user mapping required for admins)
router.get('/:id', guardianController.getGuardianById);

// POST /guardians - Create new guardian
router.post('/', guardianController.createGuardian);

// PUT /guardians/:id - Update guardian
router.put('/:id', guardianController.updateGuardian);

// DELETE /guardians/:id - Delete guardian (soft delete)
router.delete('/:id', guardianController.deleteGuardian);

// Admin helper to cancel pending scheduled SMS for a guardian (idempotent)
router.post('/:id/cancel-pending-sms', authenticateRequest, authorizeRole(['admin']), guardianController.cancelPendingSmsForGuardian);

export default router;
