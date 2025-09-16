const express = require('express');
const router = express.Router();
const {
  listHealthWorkers,
  getHealthWorker,
  createHealthWorker,
  updateHealthWorker,
  deleteHealthWorker,
  getHealthWorkerProgress
} = require('../controllers/healthWorkerController');

// GET /api/health-workers - List all health workers
router.get('/', listHealthWorkers);

// GET /api/health-workers/:id - Get health worker by ID
router.get('/:id', getHealthWorker);

// POST /api/health-workers - Create health worker
router.post('/', createHealthWorker);

// PUT /api/health-workers/:id - Update health worker
router.put('/:id', updateHealthWorker);

// DELETE /api/health-workers/:id - Delete health worker
router.delete('/:id', deleteHealthWorker);

// GET /api/health-workers/:id/progress - Get health worker progress
router.get('/:id/progress', getHealthWorkerProgress);

module.exports = router;
