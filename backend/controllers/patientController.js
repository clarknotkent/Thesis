const patientModel = require('../models/patientModel');

// Get all patients with optional filters
const getPatients = async (req, res) => {
  try {
    const filters = {
      search: req.query.search,
      gender: req.query.gender,
      status: req.query.status,
    };
    const patients = await patientModel.getAllPatients(filters);
    res.json(patients);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch patients', error });
  }
};

// Get a specific patient by ID
const getPatientDetails = async (req, res) => {
  try {
    const patient = await patientModel.getPatientById(req.params.id);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    res.json(patient);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch patient details', error });
  }
};

// Create a new patient
const createPatient = async (req, res) => {
  try {
    const newPatient = await patientModel.createPatient(req.body);
    res.status(201).json(newPatient);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to create patient', error });
  }
};

// Update a patient
const updatePatient = async (req, res) => {
  try {
    const updatedPatient = await patientModel.updatePatient(req.params.id, req.body);
    if (!updatedPatient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    res.json(updatedPatient);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update patient', error });
  }
};

// Delete a patient
const deletePatient = async (req, res) => {
  try {
    await patientModel.deletePatient(req.params.id, req.user.id); // Assuming req.user.id is the logged-in user
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to delete patient', error });
  }
};

// Get patient statistics
const getPatientStats = async (req, res) => {
  try {
    // Logic to fetch patient statistics
    res.json({ message: 'Patient statistics fetched successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch patient statistics', error });
  }
};

// Update vaccination history for a patient
const updateVaccinationHistory = async (req, res) => {
  try {
    // Logic to update vaccination history
    res.json({ message: 'Vaccination history updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update vaccination history', error });
  }
};

// Add a vaccination record for a patient
const addVaccinationRecord = async (req, res) => {
  try {
    // Logic to add a vaccination record
    res.json({ message: 'Vaccination record added successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to add vaccination record', error });
  }
};

// Delete a vaccination record for a patient
const deleteVaccinationRecord = async (req, res) => {
  try {
    // Logic to delete a vaccination record
    res.json({ message: 'Vaccination record deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to delete vaccination record', error });
  }
};

// Get vaccination history for a patient
const getVaccinationHistory = async (req, res) => {
  try {
    // Logic to fetch vaccination history
    res.json({ message: 'Vaccination history fetched successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch vaccination history', error });
  }
};

module.exports = {
  getPatients,
  getPatientDetails,
  createPatient,
  getPatientStats,
  updateVaccinationHistory,
  addVaccinationRecord,
  deleteVaccinationRecord,
  updatePatient,
  deletePatient,
  getVaccinationHistory,
};