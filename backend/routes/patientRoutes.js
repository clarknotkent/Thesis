const express = require('express');
const router = express.Router();
const { authenticateRequest, authorizeRole, checkUserMapping } = require('../middlewares/authMiddleware');
const { 
  createPatient,
  getPatientById,
  updatePatient,
  deletePatient,
  getAllPatients,
  getPatientSchedule,
  updatePatientTag,
  getBirthHistory,
  updateBirthHistory,
  getVitals,
  updateVitals,
  updatePatientSchedules
} = require('../controllers/patientController');

// GET /api/patients - Get all patients with pagination and filtering
router.get('/', getAllPatients);

// POST /api/patients - Register new patient
router.post('/', authenticateRequest, checkUserMapping, authorizeRole(['admin','health_worker']), createPatient);

// GET /api/patients/:id - Get specific patient details
router.get('/:id', getPatientById);

// PUT /api/patients/:id - Update patient
router.put('/:id', authenticateRequest, checkUserMapping, authorizeRole(['admin','health_worker']), updatePatient);

// DELETE /api/patients/:id - Delete patient
router.delete('/:id', authenticateRequest, checkUserMapping, authorizeRole(['admin']), deletePatient);

// GET /api/patients/:id/schedule - Get patient vaccination schedule
router.get('/:id/schedule', getPatientSchedule);

// PUT /api/patients/:id/tag - Update patient tag
router.put('/:id/tag', authenticateRequest, checkUserMapping, authorizeRole(['admin','health_worker']), updatePatientTag);

// GET /api/patients/:id/birth-history - Get patient birth history
router.get('/:id/birth-history', getBirthHistory);

// PUT /api/patients/:id/birth-history - Update patient birth history
router.put('/:id/birth-history', authenticateRequest, checkUserMapping, authorizeRole(['admin','health_worker']), updateBirthHistory);

// GET /api/patients/:id/vitals - Get patient vitals
router.get('/:id/vitals', getVitals);

// PUT /api/patients/:id/vitals - Update patient vitals
router.put('/:id/vitals', authenticateRequest, checkUserMapping, authorizeRole(['admin','health_worker']), updateVitals);

// Optional: dedicated onboarding endpoint (same handler as create with immunizations plan support)
router.post('/onboard', authenticateRequest, checkUserMapping, authorizeRole(['admin','health_worker']), createPatient);

// POST /api/patients/:id/update-schedules - Update patient schedule statuses
router.post('/:id/update-schedules', authenticateRequest, checkUserMapping, authorizeRole(['admin','health_worker']), updatePatientSchedules);

module.exports = router;