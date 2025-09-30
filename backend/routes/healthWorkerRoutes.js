const express = require('express');
const router = express.Router();
const { authenticateRequest, authorizeRole, checkUserMapping } = require('../middlewares/authMiddleware');
const {
  listHealthWorkers,
  getHealthWorker,
  createHealthWorker,
  updateHealthWorker,
  deleteHealthWorker,
  getHealthWorkerProgress
} = require('../controllers/healthWorkerController');

// GET /api/health-workers - List all health workers
router.get('/', authenticateRequest, checkUserMapping, listHealthWorkers);

// GET /api/health-workers/:id - Get health worker by ID
router.get('/:id', authenticateRequest, checkUserMapping, getHealthWorker);

// POST /api/health-workers - Create health worker
router.post('/', authenticateRequest, checkUserMapping, authorizeRole(['admin']), createHealthWorker);

// PUT /api/health-workers/:id - Update health worker
router.put('/:id', authenticateRequest, checkUserMapping, authorizeRole(['admin']), updateHealthWorker);

// DELETE /api/health-workers/:id - Delete health worker
router.delete('/:id', authenticateRequest, checkUserMapping, authorizeRole(['admin']), deleteHealthWorker);

// GET /api/health-workers/:id/progress - Get health worker progress
router.get('/:id/progress', authenticateRequest, checkUserMapping, getHealthWorkerProgress);

module.exports = router;
