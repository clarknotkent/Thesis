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
    const newImmunization = await immunizationModel.createImmunization(req.body);
    res.status(201).json(newImmunization);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to create immunization' });
  }
};

// Update immunization record
const updateImmunizationRecord = async (req, res) => {
  try {
    const updatedImmunization = await immunizationModel.updateImmunization(req.params.id, req.body);
    if (!updatedImmunization) {
      return res.status(404).json({ message: 'Immunization not found' });
    }
    res.json(updatedImmunization);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update immunization' });
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
};