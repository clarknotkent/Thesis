const immunizationModel = require('../models/immunizationModel');

// Get all immunizations
const getImmunizations = async (req, res) => {
  try {
    const immunizations = await immunizationModel.getAllImmunizations();
    res.json(immunizations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch immunizations' });
  }
};

// Get a specific immunization by ID
const getImmunizationDetails = async (req, res) => {
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

// Create a new immunization
const createImmunization = async (req, res) => {
  try {
    const newImmunization = await immunizationModel.createImmunization(req.body);
    res.status(201).json(newImmunization);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to create immunization' });
  }
};

// Update an immunization
const updateImmunization = async (req, res) => {
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

// Delete an immunization
const deleteImmunization = async (req, res) => {
  try {
    await immunizationModel.deleteImmunization(req.params.id);
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to delete immunization' });
  }
};

module.exports = {
  getImmunizations,
  getImmunizationDetails,
  createImmunization,
  updateImmunization,
  deleteImmunization,
};