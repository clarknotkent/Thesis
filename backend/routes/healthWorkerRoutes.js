const express = require('express');
const router = express.Router();
const {
  getHealthWorkers,
  getHealthWorkerDetails,
  createHealthWorker,
  updateHealthWorker,
  deleteHealthWorker
} = require('../controllers/healthWorkerController');

// GET /api/health-workers - Get all health workers
router.get('/', getHealthWorkers);

// GET /api/health-workers/:id - Get health worker details
router.get('/:id', getHealthWorkerDetails);

// POST /api/health-workers - Create a new health worker
router.post('/', createHealthWorker);

// PUT /api/health-workers/:id - Update health worker details
router.put('/:id', updateHealthWorker);

// DELETE /api/health-workers/:id - Delete a health worker
router.delete('/:id', deleteHealthWorker);

module.exports = router;
