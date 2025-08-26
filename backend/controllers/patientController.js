const { patientDetails } = require('../models/mockData');

// Get all patients with pagination and filtering
const getPatients = (req, res) => {
  try {
    const { page = 1, limit = 10, search, status, gender, sortBy = 'childInfo.name', sortOrder = 'asc' } = req.query;
    
    let filteredPatients = [...patientDetails];

    // Search functionality
    if (search) {
      const searchLower = search.toLowerCase();
      filteredPatients = filteredPatients.filter(patient => 
        patient.childInfo.name.toLowerCase().includes(searchLower) ||
        patient.motherInfo.name.toLowerCase().includes(searchLower) ||
        patient.childInfo.phoneNumber.includes(search)
      );
    }

    // Gender filter
    if (gender) {
      filteredPatients = filteredPatients.filter(patient => 
        patient.childInfo.sex.toLowerCase() === gender.toLowerCase()
      );
    }

    // Status filter (based on vaccination status)
    if (status) {
      switch (status) {
        case 'active':
          filteredPatients = filteredPatients.filter(patient => 
            patient.vaccinationHistory && patient.vaccinationHistory.length > 0
          );
          break;
        case 'inactive':
          filteredPatients = filteredPatients.filter(patient => 
            !patient.vaccinationHistory || patient.vaccinationHistory.length === 0
          );
          break;
        case 'due':
          // Check if next vaccination is due (within 30 days)
          const thirtyDaysFromNow = new Date();
          thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
          filteredPatients = filteredPatients.filter(patient => {
            const nextVaccination = getNextVaccinationDate(patient);
            return nextVaccination && new Date(nextVaccination) <= thirtyDaysFromNow;
          });
          break;
        case 'completed':
          // Check if patient is up to date with vaccinations
          filteredPatients = filteredPatients.filter(patient => 
            isVaccinationComplete(patient)
          );
          break;
      }
    }

    // Sorting
    filteredPatients.sort((a, b) => {
      let aValue = getNestedValue(a, sortBy);
      let bValue = getNestedValue(b, sortBy);
      
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (sortOrder === 'desc') {
        return bValue > aValue ? 1 : -1;
      }
      return aValue > bValue ? 1 : -1;
    });

    // Pagination
    const totalItems = filteredPatients.length;
    const totalPages = Math.ceil(totalItems / parseInt(limit));
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedPatients = filteredPatients.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: paginatedPatients,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems,
        itemsPerPage: parseInt(limit),
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching patients',
      error: error.message
    });
  }
};

// Get detailed patient information by ID
const getPatientDetails = (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the patient by ID (handle both string and integer IDs)
    const patient = patientDetails.find(p => p.id === id || p.id === parseInt(id) || p.id.toString() === id);
    
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: `Patient with ID ${id} not found`
      });
    }
    
    res.json({
      success: true,
      data: patient
    });
  } catch (error) {
    console.error('Error fetching patient details:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching patient details',
      error: error.message
    });
  }
};

// Create new patient
const createPatient = (req, res) => {
  try {
    const newPatient = {
      id: patientDetails.length + 1,
      ...req.body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      vaccinationHistory: [],
      nextScheduledVaccinations: []
    };

    patientDetails.push(newPatient);

    res.status(201).json({
      success: true,
      message: 'Patient created successfully',
      data: newPatient
    });
  } catch (error) {
    console.error('Error creating patient:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating patient',
      error: error.message
    });
  }
};

// Update patient
const updatePatient = (req, res) => {
  try {
    const { id } = req.params;
    const patientIndex = patientDetails.findIndex(p => p.id === id || p.id === parseInt(id) || p.id.toString() === id);

    if (patientIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    patientDetails[patientIndex] = {
      ...patientDetails[patientIndex],
      ...req.body,
      updatedAt: new Date().toISOString()
    };

    res.json({
      success: true,
      message: 'Patient updated successfully',
      data: patientDetails[patientIndex]
    });
  } catch (error) {
    console.error('Error updating patient:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating patient',
      error: error.message
    });
  }
};

// Delete patient
const deletePatient = (req, res) => {
  try {
    const { id } = req.params;
    const patientIndex = patientDetails.findIndex(p => p.id === id || p.id === parseInt(id) || p.id.toString() === id);

    if (patientIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    const deletedPatient = patientDetails.splice(patientIndex, 1)[0];

    res.json({
      success: true,
      message: 'Patient deleted successfully',
      data: deletedPatient
    });
  } catch (error) {
    console.error('Error deleting patient:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting patient',
      error: error.message
    });
  }
};

// Get vaccination history for a specific patient
const getVaccinationHistory = (req, res) => {
  try {
    const { id } = req.params;
    
    const patient = patientDetails.find(p => p.id === id || p.id === parseInt(id) || p.id.toString() === id);
    
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: `Patient with ID ${id} not found`
      });
    }
    
    res.json({
      success: true,
      data: {
        patientName: patient.childInfo.name,
        vaccinationHistory: patient.vaccinationHistory,
        nextScheduledVaccinations: patient.nextScheduledVaccinations
      }
    });
  } catch (error) {
    console.error('Error fetching vaccination history:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching vaccination history',
      error: error.message
    });
  }
};

// Update vaccination history for a specific patient
const updateVaccinationHistory = (req, res) => {
  try {
    const { id } = req.params;
    const { vaccinationHistory } = req.body;
    
    // Find patient index
    const patientIndex = patientDetails.findIndex(p => p.id === id || p.id === parseInt(id) || p.id.toString() === id);
    
    if (patientIndex === -1) {
      return res.status(404).json({
        success: false,
        message: `Patient with ID ${id} not found`
      });
    }
    
    // Update vaccination history
    if (Array.isArray(vaccinationHistory)) {
      patientDetails[patientIndex].vaccinationHistory = vaccinationHistory;
      patientDetails[patientIndex].updatedAt = new Date().toISOString();
    } else {
      return res.status(400).json({
        success: false,
        message: 'Vaccination history must be an array'
      });
    }
    
    res.json({
      success: true,
      message: 'Vaccination history updated successfully',
      data: {
        patientName: patientDetails[patientIndex].childInfo.name,
        vaccinationHistory: patientDetails[patientIndex].vaccinationHistory
      }
    });
  } catch (error) {
    console.error('Error updating vaccination history:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating vaccination history',
      error: error.message
    });
  }
};

// Add a single vaccination record to a patient's history
const addVaccinationRecord = (req, res) => {
  try {
    const { id } = req.params;
    const vaccinationRecord = req.body;
    
    // Find patient
    const patientIndex = patientDetails.findIndex(p => p.id === id || p.id === parseInt(id) || p.id.toString() === id);
    
    if (patientIndex === -1) {
      return res.status(404).json({
        success: false,
        message: `Patient with ID ${id} not found`
      });
    }
    
    // Validate vaccination record
    const requiredFields = ['vaccineName', 'dateAdministered', 'lotNumber'];
    for (const field of requiredFields) {
      if (!vaccinationRecord[field]) {
        return res.status(400).json({
          success: false,
          message: `Missing required field: ${field}`
        });
      }
    }
    
    // Add vaccination record to history
    if (!patientDetails[patientIndex].vaccinationHistory) {
      patientDetails[patientIndex].vaccinationHistory = [];
    }
    
    patientDetails[patientIndex].vaccinationHistory.push(vaccinationRecord);
    patientDetails[patientIndex].updatedAt = new Date().toISOString();
    
    res.status(201).json({
      success: true,
      message: 'Vaccination record added successfully',
      data: {
        patientName: patientDetails[patientIndex].childInfo.name,
        vaccinationRecord: vaccinationRecord
      }
    });
  } catch (error) {
    console.error('Error adding vaccination record:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding vaccination record',
      error: error.message
    });
  }
};

// Delete a vaccination record from a patient's history
const deleteVaccinationRecord = (req, res) => {
  try {
    const { id, recordIndex } = req.params;
    const recordIdxNum = parseInt(recordIndex);
    
    // Find patient
    const patientIndex = patientDetails.findIndex(p => p.id === id || p.id === parseInt(id) || p.id.toString() === id);
    
    if (patientIndex === -1) {
      return res.status(404).json({
        success: false,
        message: `Patient with ID ${id} not found`
      });
    }
    
    // Validate record index
    if (!patientDetails[patientIndex].vaccinationHistory || 
        recordIdxNum < 0 || 
        recordIdxNum >= patientDetails[patientIndex].vaccinationHistory.length) {
      return res.status(404).json({
        success: false,
        message: `Vaccination record at index ${recordIndex} not found`
      });
    }
    
    // Remove the record
    const deletedRecord = patientDetails[patientIndex].vaccinationHistory.splice(recordIdxNum, 1)[0];
    patientDetails[patientIndex].updatedAt = new Date().toISOString();
    
    res.json({
      success: true,
      message: 'Vaccination record deleted successfully',
      data: deletedRecord
    });
  } catch (error) {
    console.error('Error deleting vaccination record:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting vaccination record',
      error: error.message
    });
  }
};

// Get patient statistics
const getPatientStats = (req, res) => {
  try {
    const totalPatients = patientDetails.length;
    const activePatients = patientDetails.filter(p => 
      p.vaccinationHistory && p.vaccinationHistory.length > 0
    ).length;
    const malePatients = patientDetails.filter(p => 
      p.childInfo.sex.toLowerCase() === 'male'
    ).length;
    const femalePatients = patientDetails.filter(p => 
      p.childInfo.sex.toLowerCase() === 'female'
    ).length;

    // Calculate age distribution
    const ageGroups = {
      '0-1': 0,
      '1-3': 0,
      '3-5': 0,
      '5+': 0
    };

    patientDetails.forEach(patient => {
      const age = calculateAgeInYears(patient.childInfo.birthDate);
      if (age < 1) ageGroups['0-1']++;
      else if (age < 3) ageGroups['1-3']++;
      else if (age < 5) ageGroups['3-5']++;
      else ageGroups['5+']++;
    });

    res.json({
      success: true,
      data: {
        totalPatients,
        activePatients,
        inactivePatients: totalPatients - activePatients,
        malePatients,
        femalePatients,
        ageDistribution: ageGroups,
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching patient stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching patient statistics',
      error: error.message
    });
  }
};

// Utility functions
const getNestedValue = (obj, path) => {
  return path.split('.').reduce((current, key) => current && current[key], obj);
};

const calculateAgeInYears = (birthDate) => {
  const birth = new Date(birthDate);
  const today = new Date();
  return today.getFullYear() - birth.getFullYear();
};

const getNextVaccinationDate = (patient) => {
  // Simple logic to determine next vaccination date
  // This would typically be based on vaccination schedule and child's age
  if (!patient.vaccinationHistory || patient.vaccinationHistory.length === 0) {
    return new Date(); // Immediate vaccination needed
  }
  
  const lastVaccination = patient.vaccinationHistory[patient.vaccinationHistory.length - 1];
  const nextDate = new Date(lastVaccination.dateAdministered);
  nextDate.setMonth(nextDate.getMonth() + 2); // Assume 2-month intervals
  return nextDate.toISOString();
};

const isVaccinationComplete = (patient) => {
  // Simple check - in real app, this would check against vaccination schedule
  return patient.vaccinationHistory && patient.vaccinationHistory.length >= 5;
};

module.exports = {
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
};