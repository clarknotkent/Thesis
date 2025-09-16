const userModel = require('../models/userModel');

// List all health workers
const listHealthWorkers = async (req, res) => {
  try {
    const filters = { role: 'HealthWorker' };
    const healthWorkers = await userModel.getAllUsers(filters);
    res.json(healthWorkers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch health workers' });
  }
};

// Get a health worker by ID
const getHealthWorker = async (req, res) => {
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

// Create a health worker
const createHealthWorker = async (req, res) => {
  try {
    const healthWorkerData = { ...req.body, role: 'HealthWorker' };
    const newHealthWorker = await userModel.createUser(healthWorkerData);
    res.status(201).json(newHealthWorker);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to create health worker' });
  }
};

// Update a health worker
const updateHealthWorker = async (req, res) => {
  try {
    const updatedHealthWorker = await userModel.updateUser(req.params.id, req.body);
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

// Get health worker progress
const getHealthWorkerProgress = async (req, res) => {
  try {
    const progress = await healthWorkerModel.getHealthWorkerProgress(req.params.id);
    res.json(progress);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch health worker progress' });
  }
};

module.exports = {
  createHealthWorker,
  getHealthWorker,
  updateHealthWorker,
  deleteHealthWorker,
  listHealthWorkers,
  getHealthWorkerProgress,
};