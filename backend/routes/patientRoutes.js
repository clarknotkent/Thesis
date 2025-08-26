const express = require('express');
const router = express.Router();
const { 
  getPatients, 
  getPatientDetails, 
  getVaccinationHistory,
  createPatient,
  updatePatient,
  deletePatient,
  getPatientStats,
  updateVaccinationHistory,
  addVaccinationRecord,
  deleteVaccinationRecord
} = require('../controllers/patientController');

// GET /api/patients - Get all patients with pagination and filtering
router.get('/', getPatients);

// GET /api/patients/stats - Get patient statistics
router.get('/stats', getPatientStats);

// GET /api/patients/:id/details - Get detailed patient information
router.get('/:id/details', getPatientDetails);

// GET /api/patients/:id - Get specific patient details
router.get('/:id', getPatientDetails);

// POST /api/patients - Create new patient
router.post('/', createPatient);

// PUT /api/patients/:id - Update patient
router.put('/:id', updatePatient);

// DELETE /api/patients/:id - Delete patient
router.delete('/:id', deletePatient);

// GET /api/patients/:id/vaccinations - Get vaccination history for a patient
router.get('/:id/vaccinations', getVaccinationHistory);

// PUT /api/patients/:id/vaccinations - Update vaccination history for a patient
router.put('/:id/vaccinations', updateVaccinationHistory);

// POST /api/patients/:id/vaccinations - Add a new vaccination record to a patient's history
router.post('/:id/vaccinations', addVaccinationRecord);

// DELETE /api/patients/:id/vaccinations/:recordIndex - Delete a specific vaccination record
router.delete('/:id/vaccinations/:recordIndex', deleteVaccinationRecord);

module.exports = router;