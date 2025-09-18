const express = require('express');
const router = express.Router();
const { authenticateRequest, authorizeRole, checkUserMapping } = require('../middlewares/authMiddleware');
const {
  listImmunizations,
  getImmunizationRecord,
  createImmunizationRecord,
  updateImmunizationRecord,
  deleteImmunizationRecord,
  scheduleImmunization,
  enforceVaccineInterval
} = require('../controllers/immunizationController');

// GET /api/immunizations - Get all immunizations
router.get('/', listImmunizations);

// GET /api/immunizations/:id - Get immunization details
router.get('/:id', getImmunizationRecord);

// POST /api/immunizations - Create a new immunization
router.post('/', authenticateRequest, checkUserMapping, authorizeRole(['admin','health_worker']), createImmunizationRecord);

// PUT /api/immunizations/:id - Update immunization details
router.put('/:id', authenticateRequest, checkUserMapping, authorizeRole(['admin','health_worker']), updateImmunizationRecord);

// DELETE /api/immunizations/:id - Delete an immunization
router.delete('/:id', authenticateRequest, checkUserMapping, authorizeRole(['admin']), deleteImmunizationRecord);

// POST /api/immunizations/schedule - Schedule immunization
router.post('/schedule', authenticateRequest, checkUserMapping, authorizeRole(['admin','health_worker']), scheduleImmunization);

// POST /api/immunizations/enforce-interval - Enforce vaccine interval
router.post('/enforce-interval', authenticateRequest, checkUserMapping, authorizeRole(['admin','health_worker']), enforceVaccineInterval);

module.exports = router;
