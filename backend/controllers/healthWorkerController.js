const healthWorkerModel = require('../models/healthWorkerModel');

// Get all health workers
const getHealthWorkers = async (req, res) => {
  try {
    const healthWorkers = await healthWorkerModel.getAllHealthWorkers();
    res.json(healthWorkers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch health workers' });
  }
};

// Get a specific health worker by ID
const getHealthWorkerDetails = async (req, res) => {
  try {
    const healthWorker = await healthWorkerModel.getHealthWorkerById(req.params.id);
    if (!healthWorker) {
      return res.status(404).json({ message: 'Health worker not found' });
    }
    res.json(healthWorker);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch health worker details' });
  }
};

// Create a new health worker
const createHealthWorker = async (req, res) => {
  try {
    const newHealthWorker = await healthWorkerModel.createHealthWorker(req.body);
    res.status(201).json(newHealthWorker);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to create health worker' });
  }
};

// Update a health worker
const updateHealthWorker = async (req, res) => {
  try {
    const updatedHealthWorker = await healthWorkerModel.updateHealthWorker(req.params.id, req.body);
    if (!updatedHealthWorker) {
      return res.status(404).json({ message: 'Health worker not found' });
    }
    res.json(updatedHealthWorker);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update health worker' });
  }
};

// Delete a health worker
const deleteHealthWorker = async (req, res) => {
  try {
    await healthWorkerModel.deleteHealthWorker(req.params.id);
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to delete health worker' });
  }
};

module.exports = {
  getHealthWorkers,
  getHealthWorkerDetails,
  createHealthWorker,
  updateHealthWorker,
  deleteHealthWorker,
};