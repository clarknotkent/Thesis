const patientModel = require('../models/patientModel');

// List all patients with optional filters
const getAllPatients = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      gender, 
      status,
      age_group,
      barangay 
    } = req.query;
    
    const filters = { search, gender, status, age_group, barangay };
    const patients = await patientModel.getAllPatients(filters, page, limit);
    
    res.json({ 
      success: true, 
      data: patients 
    });
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch patients', 
      error: error.message 
    });
  }
};

// Register a new patient
const createPatient = async (req, res) => {
  try {
    const patientData = {
      first_name: req.body.first_name,
      last_name: req.body.last_name,
      middle_name: req.body.middle_name,
      birth_date: req.body.birth_date,
      gender: req.body.gender,
      address: req.body.address,
      barangay: req.body.barangay,
      parent_guardian: req.body.parent_guardian,
      contact_number: req.body.contact_number,
      birth_weight: req.body.birth_weight,
      birth_height: req.body.birth_height,
      birth_place: req.body.birth_place,
      mother_name: req.body.mother_name,
      father_name: req.body.father_name,
      emergency_contact: req.body.emergency_contact,
      medical_history: req.body.medical_history || [],
      allergies: req.body.allergies || [],
      status: req.body.status || 'active'
    };
    
    // Validate required fields
    if (!patientData.first_name || !patientData.last_name || !patientData.birth_date) {
      return res.status(400).json({ 
        success: false,
        message: 'Missing required fields: first_name, last_name, birth_date' 
      });
    }

    const newPatient = await patientModel.createPatient(patientData);
    res.status(201).json({ 
      success: true,
      message: 'Patient registered successfully', 
      data: newPatient 
    });
  } catch (error) {
    console.error('Error registering patient:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to register patient', 
      error: error.message 
    });
  }
};

// Get a specific patient by ID
const getPatientById = async (req, res) => {
  try {
    const { id } = req.params;
    const patient = await patientModel.getPatientById(id);
    
    if (!patient) {
      return res.status(404).json({ 
        success: false,
        message: 'Patient not found' 
      });
    }
    
    res.json({ 
      success: true, 
      data: patient 
    });
  } catch (error) {
    console.error('Error fetching patient:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch patient details', 
      error: error.message 
    });
  }
};

// Update a patient
const updatePatient = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const updatedPatient = await patientModel.updatePatient(id, updates);
    
    if (!updatedPatient) {
      return res.status(404).json({ 
        success: false,
        message: 'Patient not found' 
      });
    }
    
    res.json({ 
      success: true,
      message: 'Patient updated successfully',
      data: updatedPatient 
    });
  } catch (error) {
    console.error('Error updating patient:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to update patient', 
      error: error.message 
    });
  }
};

// Delete a patient (soft delete)
const deletePatient = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id; // From auth middleware
    
    const result = await patientModel.deletePatient(id, userId);
    
    if (!result) {
      return res.status(404).json({ 
        success: false,
        message: 'Patient not found' 
      });
    }
    
    res.json({ 
      success: true,
      message: 'Patient deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting patient:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to delete patient', 
      error: error.message 
    });
  }
};

// Get patient schedule (vaccination schedule)
const getPatientSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const schedule = await patientModel.getPatientVaccinationSchedule(id);
    if (!schedule) {
      return res.status(404).json({ message: 'Patient schedule not found' });
    }
    res.json(schedule);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch patient schedule', error });
  }
};

// Update patient tag
const updatePatientTag = async (req, res) => {
  try {
    const { id } = req.params;
    const { tag } = req.body;
    
    if (!tag) {
      return res.status(400).json({ message: 'Tag is required' });
    }

    const updatedPatient = await patientModel.updatePatientTag(id, tag);
    if (!updatedPatient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    res.json({ message: 'Patient tag updated successfully', patient: updatedPatient });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update patient tag', error });
  }
};

// Get birth history
const getBirthHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const birthHistory = await patientModel.getPatientBirthHistory(id);
    if (!birthHistory) {
      return res.status(404).json({ message: 'Birth history not found' });
    }
    res.json(birthHistory);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch birth history', error });
  }
};

// Update birth history
const updateBirthHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const birthData = req.body;
    
    const updatedHistory = await patientModel.updatePatientBirthHistory(id, birthData);
    if (!updatedHistory) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    res.json({ message: 'Birth history updated successfully', birthHistory: updatedHistory });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update birth history', error });
  }
};

// Get patient vitals
const getVitals = async (req, res) => {
  try {
    const { id } = req.params;
    const vitals = await patientModel.getPatientVitals(id);
    if (!vitals) {
      return res.status(404).json({ message: 'Patient vitals not found' });
    }
    res.json(vitals);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch patient vitals', error });
  }
};

// Update patient vitals
const updateVitals = async (req, res) => {
  try {
    const { id } = req.params;
    const vitalsData = req.body;
    
    const updatedVitals = await patientModel.updatePatientVitals(id, vitalsData);
    if (!updatedVitals) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    res.json({ message: 'Patient vitals updated successfully', vitals: updatedVitals });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update patient vitals', error });
  }
};

module.exports = {
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
};