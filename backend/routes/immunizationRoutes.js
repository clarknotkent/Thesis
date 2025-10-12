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
  enforceVaccineInterval,
  updatePatientSchedule,
  manualReschedulePatientSchedule,
  debugManualReschedule
  , debugManualRescheduleDB
  , debugRescheduleCheckpoints
} = require('../controllers/immunizationController');

// GET /api/immunizations - Get all immunizations
router.get('/', authenticateRequest, checkUserMapping, listImmunizations);

// GET /api/immunizations/:id - Get immunization details
router.get('/:id', authenticateRequest, checkUserMapping, getImmunizationRecord);

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

// PUT /api/immunizations/schedule/:id - Update a scheduled appointment (manual edit)
router.put('/schedule/:id', authenticateRequest, checkUserMapping, authorizeRole(['admin','health_worker']), updatePatientSchedule);

// POST /api/immunizations/manual-reschedule - Manual reschedule with status update
router.post('/manual-reschedule', authenticateRequest, checkUserMapping, authorizeRole(['admin','health_worker']), manualReschedulePatientSchedule);

// GET /api/immunizations/debug-reschedule?patient_schedule_id=...&requested_date=YYYY-MM-DD - Debug decision trace
router.get('/debug-reschedule', authenticateRequest, checkUserMapping, authorizeRole(['admin','health_worker']), debugManualReschedule);

// POST /api/immunizations/debug-reschedule-db - DB-level trace (writes temp table and returns trace + changes)
router.post('/debug-reschedule-db', authenticateRequest, checkUserMapping, authorizeRole(['admin','health_worker']), debugManualRescheduleDB);

// POST /api/immunizations/debug-reschedule-checkpoints - Subject-first checkpoints (pass/fail per rule)
router.post('/debug-reschedule-checkpoints', authenticateRequest, checkUserMapping, authorizeRole(['admin','health_worker']), debugRescheduleCheckpoints);

module.exports = router;
