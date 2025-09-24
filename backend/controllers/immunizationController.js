const immunizationModel = require('../models/immunizationModel');

// List all immunizations
const listImmunizations = async (req, res) => {
  try {
    const immunizations = await immunizationModel.listImmunizations();
    res.json(immunizations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch immunizations' });
  }
};

// Get immunization record by ID
const getImmunizationRecord = async (req, res) => {
  try {
    const immunization = await immunizationModel.getImmunizationById(req.params.id);
    if (!immunization) {
      return res.status(404).json({ message: 'Immunization not found' });
    }
    res.json(immunization);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch immunization details' });
  }
};

// Create immunization record
const createImmunizationRecord = async (req, res) => {
  try {
    const payload = Object.assign({}, req.body);
    if (!payload.administered_by && req.user && req.user.user_id) payload.administered_by = req.user.user_id;
    const newImmunization = await immunizationModel.createImmunization(payload);
    res.status(201).json({ success: true, data: newImmunization });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success:false, message: 'Failed to create immunization' });
  }
};

// Update immunization record
const updateImmunizationRecord = async (req, res) => {
  try {
    const payload = Object.assign({}, req.body);
    if (!payload.administered_by && req.user && req.user.user_id) payload.administered_by = req.user.user_id;
    const updatedImmunization = await immunizationModel.updateImmunization(req.params.id, payload);
    if (!updatedImmunization) return res.status(404).json({ success:false, message: 'Immunization not found' });
    res.json({ success:true, data: updatedImmunization });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success:false, message: 'Failed to update immunization' });
  }
};

// Delete immunization record
const deleteImmunizationRecord = async (req, res) => {
  try {
    await immunizationModel.deleteImmunization(req.params.id);
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to delete immunization' });
  }
};

// Schedule immunization
const scheduleImmunization = async (req, res) => {
  try {
    const result = await immunizationModel.scheduleImmunization(req.body);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to schedule immunization' });
  }
};

// Update patientschedule (manual edit)
const updatePatientSchedule = async (req, res) => {
  try {
    const id = req.params.id;
    const payload = req.body;
    const updated = await immunizationModel.updatePatientSchedule(id, payload);
    if (!updated) return res.status(404).json({ message: 'Patient schedule not found' });
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update patient schedule' });
  }
};

// Enforce vaccine interval
const enforceVaccineInterval = async (req, res) => {
  try {
    const result = await immunizationModel.enforceVaccineInterval(req.body);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to enforce vaccine interval' });
  }
};

module.exports = {
  createImmunizationRecord,
  getImmunizationRecord,
  updateImmunizationRecord,
  deleteImmunizationRecord,
  listImmunizations,
  scheduleImmunization,
  enforceVaccineInterval,
  updatePatientSchedule,
};