const express = require('express');
const router = express.Router();
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
router.post('/', createImmunizationRecord);

// PUT /api/immunizations/:id - Update immunization details
router.put('/:id', updateImmunizationRecord);

// DELETE /api/immunizations/:id - Delete an immunization
router.delete('/:id', deleteImmunizationRecord);

// POST /api/immunizations/schedule - Schedule immunization
router.post('/schedule', scheduleImmunization);

// POST /api/immunizations/enforce-interval - Enforce vaccine interval
router.post('/enforce-interval', enforceVaccineInterval);

module.exports = router;
