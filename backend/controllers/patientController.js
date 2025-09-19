const patientModel = require('../models/patientModel');
const immunizationModel = require('../models/immunizationModel');

// Normalize incoming payload to match DB schema
const mapPatientPayload = (body) => ({
  firstname: body.firstname || body.first_name || body.firstName || null,
  surname: body.surname || body.last_name || body.lastName || null,
  middlename: body.middlename || body.middle_name || body.middleName || null,
  date_of_birth: body.date_of_birth || body.birth_date || body.birthDate || null,
  sex: body.sex || body.gender || null,
  address: body.address || null,
  barangay: body.barangay || null,
  health_center: body.health_center || body.healthCenter || null,
  guardian_id: body.guardian_id || body.parent_guardian || null, // This is actually the user_id from users table
  mother_name: body.mother_name || body.motherName || null,
  mother_occupation: body.mother_occupation || body.motherOccupation || null,
  mother_contact_number: body.mother_contact_number || body.motherContactNumber || null,
  father_name: body.father_name || body.fatherName || null,
  father_occupation: body.father_occupation || body.fatherOccupation || null,
  father_contact_number: body.father_contact_number || body.fatherContactNumber || null,
  family_number: body.family_number || body.familyNumber || null,
  tags: body.tags || null,
});

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
    
    const filters = { search, sex: gender, status, age_group, barangay };
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
    const patientData = mapPatientPayload(req.body);
    
    // Validate required fields
    if (!patientData.firstname || !patientData.surname || !patientData.date_of_birth) {
      return res.status(400).json({ 
        success: false,
        message: 'Missing required fields: firstname, surname, date_of_birth' 
      });
    }

    const newPatient = await patientModel.createPatient(patientData);

    // Optional onboarding: handle immunizations plan
    const immunizationsPlan = Array.isArray(req.body.immunizations) ? req.body.immunizations : [];
    for (const item of immunizationsPlan) {
      const status = (item.status || '').toLowerCase();
      const base = {
        patient_id: newPatient.patient_id,
        vaccine_id: item.vaccine_id,
        dose_number: item.dose_number,
      };
      if (status === 'taken' || status === 'completed') {
        await immunizationModel.createImmunization({
          ...base,
          administered_date: item.administered_date || new Date().toISOString(),
          administered_by: (req.user && req.user.user_id) || item.administered_by || null,
          remarks: item.remarks || null,
        });
      } else {
        if (!item.scheduled_date) {
          // If scheduled_date is not provided, skip scheduling to avoid invalid data
          continue;
        }
        await immunizationModel.scheduleImmunization({
          ...base,
          scheduled_date: item.scheduled_date,
          status: 'scheduled',
        });
      }
    }

    // Return enriched patient data and schedule from views
    const patientView = await patientModel.getPatientById(newPatient.patient_id);
    const schedule = await patientModel.getPatientVaccinationSchedule(newPatient.patient_id);

    res.status(201).json({ 
      success: true,
      message: 'Patient registered successfully', 
      data: { patient: patientView, schedule }
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
  const updates = mapPatientPayload(req.body);
    
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