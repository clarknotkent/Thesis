const express = require('express');
const router = express.Router();
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
  updateVitals
} = require('../controllers/patientController');

// GET /api/patients - Get all patients with pagination and filtering
router.get('/', getAllPatients);

// POST /api/patients - Register new patient
router.post('/', createPatient);

// GET /api/patients/:id - Get specific patient details
router.get('/:id', getPatientById);

// PUT /api/patients/:id - Update patient
router.put('/:id', updatePatient);

// DELETE /api/patients/:id - Delete patient
router.delete('/:id', deletePatient);

// GET /api/patients/:id/schedule - Get patient vaccination schedule
router.get('/:id/schedule', getPatientSchedule);

// PUT /api/patients/:id/tag - Update patient tag
router.put('/:id/tag', updatePatientTag);

// GET /api/patients/:id/birth-history - Get patient birth history
router.get('/:id/birth-history', getBirthHistory);

// PUT /api/patients/:id/birth-history - Update patient birth history
router.put('/:id/birth-history', updateBirthHistory);

// GET /api/patients/:id/vitals - Get patient vitals
router.get('/:id/vitals', getVitals);

// PUT /api/patients/:id/vitals - Update patient vitals
router.put('/:id/vitals', updateVitals);

module.exports = router;