const express = require('express');
const router = express.Router();
const guardianController = require('../controllers/guardianController');
const { authenticateRequest } = require('../middlewares/authMiddleware');

// Apply auth middleware to all routes
router.use(authenticateRequest);

// GET /guardians - Get all guardians
router.get('/', guardianController.getAllGuardians);

// GET /guardians/:id - Get guardian by ID
router.get('/:id', guardianController.getGuardianById);

// POST /guardians - Create new guardian
router.post('/', guardianController.createGuardian);

// PUT /guardians/:id - Update guardian
router.put('/:id', guardianController.updateGuardian);

// DELETE /guardians/:id - Delete guardian (soft delete)
router.delete('/:id', guardianController.deleteGuardian);

module.exports = router;