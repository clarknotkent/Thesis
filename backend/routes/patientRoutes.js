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
  updatePatientSchedules,
  listParentsOptions,
  listRecordedParents,
  listParentsWithContacts,
  listDistinctParentNames,
  getCoParentSuggestion,
  getSmartDoseOptions
} = require('../controllers/patientController');

// NOTE: Define non-parameterized helper routes BEFORE any '/:id' routes to avoid shadowing
// Optional: compute age detail (months, days) from DOB
router.get('/helpers/age', authenticateRequest, (req, res, next) => {
  try {
    const dob = req.query.date_of_birth || req.query.dob;
    if (!dob) return res.status(400).json({ success:false, message:'date_of_birth is required' });
    const birth = new Date(dob);
    const today = new Date();
    let months = (today.getFullYear() - birth.getFullYear()) * 12 + (today.getMonth() - birth.getMonth());
    if (today.getDate() < birth.getDate()) months--;
    const ref = new Date(today.getFullYear(), today.getMonth(), 0).getDate();
    const days = (today.getDate() >= birth.getDate()) ? (today.getDate() - birth.getDate()) : (ref - birth.getDate() + today.getDate());
    return res.json({ success:true, data: { months: Math.max(0, months), days: Math.max(0, days) } });
  } catch (err) {
    console.error('age helper error', err);
    return res.status(500).json({ success:false, message:'Failed to compute age detail', error: err.message });
  }
});

// GET /api/patients - Get all patients with pagination and filtering (no user mapping required for reads)
router.get('/', authenticateRequest, getAllPatients);

// GET /api/patients/parents/options - Parents (mother/father) dropdown (place before param routes)
router.get('/parents/options', authenticateRequest, listParentsOptions);
// GET /api/patients/parents/recorded?type=mother|father - Recorded parents from existing patients
router.get('/parents/recorded', authenticateRequest, listRecordedParents);
// GET /api/patients/parents/suggestions?type=mother|father - Parents suggestions with contacts from patients data only
router.get('/parents/suggestions', authenticateRequest, listParentsWithContacts);
// GET /api/patients/parents/distinct?type=mother|father - Distinct parent names from patients data
router.get('/parents/distinct', authenticateRequest, listDistinctParentNames);
// GET /api/patients/parents/coparent?type=mother|father&name=... - Co-parent suggestion from patients data
router.get('/parents/coparent', authenticateRequest, getCoParentSuggestion);

// POST /api/patients - Register new patient
router.post('/', authenticateRequest, checkUserMapping, authorizeRole(['admin','health_worker','health_staff']), createPatient);

// GET /api/patients/:id - Get specific patient details (no user mapping required for reads)
router.get('/:id', authenticateRequest, getPatientById);

// PUT /api/patients/:id - Update patient
router.put('/:id', authenticateRequest, checkUserMapping, authorizeRole(['admin','health_worker','health_staff']), updatePatient);

// DELETE /api/patients/:id - Delete patient
router.delete('/:id', authenticateRequest, checkUserMapping, authorizeRole(['admin']), deletePatient);

// GET /api/patients/:id/schedule - Get patient vaccination schedule
router.get('/:id/schedule', authenticateRequest, checkUserMapping, getPatientSchedule);

// PUT /api/patients/:id/tag - Update patient tag
router.put('/:id/tag', authenticateRequest, checkUserMapping, authorizeRole(['admin','health_worker','health_staff']), updatePatientTag);

// GET /api/patients/:id/birth-history - Get patient birth history
router.get('/:id/birth-history', authenticateRequest, checkUserMapping, getBirthHistory);

// PUT /api/patients/:id/birth-history - Update patient birth history
router.put('/:id/birth-history', authenticateRequest, checkUserMapping, authorizeRole(['admin','health_worker','health_staff']), updateBirthHistory);

// GET /api/patients/:id/vitals - Get patient vitals (deprecated; still requires auth)
router.get('/:id/vitals', authenticateRequest, checkUserMapping, getVitals);

// PUT /api/patients/:id/vitals - Update patient vitals
router.put('/:id/vitals', authenticateRequest, checkUserMapping, authorizeRole(['admin','health_worker','health_staff']), updateVitals);

// Optional: dedicated onboarding endpoint (same handler as create with immunizations plan support)
router.post('/onboard', authenticateRequest, checkUserMapping, authorizeRole(['admin','health_worker','health_staff']), createPatient);

// POST /api/patients/:id/update-schedules - Update patient schedule statuses (admin-only maintenance)
router.post('/:id/update-schedules', authenticateRequest, checkUserMapping, authorizeRole(['admin']), updatePatientSchedules);

// GET /api/patients/:id/smart-doses?vaccine_id= - Smart dose options based on schedule and history
router.get('/:id/smart-doses', authenticateRequest, checkUserMapping, getSmartDoseOptions);

module.exports = router;