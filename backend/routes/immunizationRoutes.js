import express from 'express';
const router = express.Router();
import { authenticateRequest, authorizeRole, checkUserMapping } from '../middlewares/authMiddleware.js';
import { listImmunizations,
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
  , debugRescheduleCheckpoints } from '../controllers/immunizationController.js';

// GET /api/immunizations - Get all immunizations
router.get('/', authenticateRequest, checkUserMapping, listImmunizations);

// GET /api/immunizations/:id - Get immunization details
router.get('/:id', authenticateRequest, checkUserMapping, getImmunizationRecord);

// POST /api/immunizations - Create a new immunization
router.post('/', authenticateRequest, checkUserMapping, authorizeRole(['admin','health_worker','health_staff']), createImmunizationRecord);

// PUT /api/immunizations/:id - Update immunization details
router.put('/:id', authenticateRequest, checkUserMapping, authorizeRole(['admin','health_worker','health_staff']), updateImmunizationRecord);

// DELETE /api/immunizations/:id - Delete an immunization
router.delete('/:id', authenticateRequest, checkUserMapping, authorizeRole(['admin']), deleteImmunizationRecord);

// POST /api/immunizations/schedule - Schedule immunization
router.post('/schedule', authenticateRequest, checkUserMapping, authorizeRole(['admin','health_worker','health_staff']), scheduleImmunization);

// POST /api/immunizations/enforce-interval - Enforce vaccine interval
router.post('/enforce-interval', authenticateRequest, checkUserMapping, authorizeRole(['admin','health_worker','health_staff']), enforceVaccineInterval);

// PUT /api/immunizations/schedule/:id - Update a scheduled appointment (manual edit)
router.put('/schedule/:id', authenticateRequest, checkUserMapping, authorizeRole(['admin','health_worker','health_staff']), updatePatientSchedule);

// POST /api/immunizations/manual-reschedule - Manual reschedule with status update
router.post('/manual-reschedule', authenticateRequest, checkUserMapping, authorizeRole(['admin','health_worker','health_staff']), manualReschedulePatientSchedule);

// GET /api/immunizations/debug-reschedule?patient_schedule_id=...&requested_date=YYYY-MM-DD - Debug decision trace
router.get('/debug-reschedule', authenticateRequest, checkUserMapping, authorizeRole(['admin','health_worker','health_staff']), debugManualReschedule);

// POST /api/immunizations/debug-reschedule-db - DB-level trace (writes temp table and returns trace + changes)
router.post('/debug-reschedule-db', authenticateRequest, checkUserMapping, authorizeRole(['admin','health_worker','health_staff']), debugManualRescheduleDB);

// POST /api/immunizations/debug-reschedule-checkpoints - Subject-first checkpoints (pass/fail per rule)
router.post('/debug-reschedule-checkpoints', authenticateRequest, checkUserMapping, authorizeRole(['admin','health_worker','health_staff']), debugRescheduleCheckpoints);

export default router;
