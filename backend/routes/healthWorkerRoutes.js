import express from 'express';
const router = express.Router();
import { authenticateRequest, authorizeRole, checkUserMapping } from '../middlewares/authMiddleware.js';
import { listHealthWorkers,
  getHealthWorker,
  createHealthWorker,
  updateHealthWorker,
  deleteHealthWorker,
  getHealthWorkerProgress } from '../controllers/healthWorkerController.js';

// GET /api/health-staff - List all health staff
router.get('/', authenticateRequest, checkUserMapping, listHealthWorkers);

// GET /api/health-staff/:id - Get health staff by ID
router.get('/:id', authenticateRequest, checkUserMapping, getHealthWorker);

// POST /api/health-staff - Create health staff
router.post('/', authenticateRequest, checkUserMapping, authorizeRole(['admin']), createHealthWorker);

// PUT /api/health-staff/:id - Update health staff
router.put('/:id', authenticateRequest, checkUserMapping, authorizeRole(['admin']), updateHealthWorker);

// DELETE /api/health-staff/:id - Delete health staff
router.delete('/:id', authenticateRequest, checkUserMapping, authorizeRole(['admin']), deleteHealthWorker);

// GET /api/health-staff/:id/progress - Get health staff progress
router.get('/:id/progress', authenticateRequest, checkUserMapping, getHealthWorkerProgress);

export default router;
