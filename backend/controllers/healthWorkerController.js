const userModel = require('../models/userModel');
const { getActorId } = require('../utils/actor');
const healthWorkerModel = require('../models/healthWorkerModel');

// List all health staff
const listHealthWorkers = async (req, res) => {
  try {
    // Remove BHS filter to get all health staff (BHS, nurses, nutritionists, etc.)
    const filters = { role: 'healthstaff' };
    // Set a high limit to ensure we get all health workers (no pagination for this endpoint)
    const result = await userModel.getAllUsers(filters, 1, 1000);
    const healthWorkers = result.users || [];
    console.log('[healthWorkerController.listHealthWorkers] filters:', filters, 'result.users count:', healthWorkers.length);
    console.log('[healthWorkerController.listHealthWorkers] health staff types:', [...new Set(healthWorkers.map(hw => hw.hs_type))]);
    console.log('[healthWorkerController.listHealthWorkers] first health staff:', healthWorkers[0]);
    res.json({
      success: true,
      data: {
        healthStaff: healthWorkers,
        totalCount: result.totalCount || healthWorkers.length
      }
    });
  } catch (error) {
    console.error('[healthWorkerController.listHealthWorkers] Error:', error);
    res.status(500).json({ message: 'Failed to fetch health workers' });
  }
};

// Get a health staff by ID
const getHealthWorker = async (req, res) => {
  try {
    const healthWorker = await healthWorkerModel.getHealthWorkerById(req.params.id);
    if (!healthWorker) {
      return res.status(404).json({ message: 'Health staff not found' });
    }
    res.json(healthWorker);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch health staff details' });
  }
};

// Create a health staff
const createHealthWorker = async (req, res) => {
  try {
  const actorId = getActorId(req);
  console.log('[healthWorkerController.createHealthWorker] ACTOR', actorId, 'USERNAME', req.body?.username);
  // Accept incoming role tokens but force canonical token; strip any spoofed audit fields
  const { created_by: _cb, updated_by: _ub, role: _roleIgnored, ...rest } = req.body;
  const healthWorkerData = { ...rest, role: 'HealthStaff', created_by: actorId, updated_by: actorId };
    try {
      const safeBody = { ...req.body };
      if (safeBody.password) safeBody.password = '***redacted***';
      const safeConstructed = { ...healthWorkerData };
      if (safeConstructed.password) safeConstructed.password = '***redacted***';
  console.log('[healthWorkerController.createHealthWorker] PAYLOAD created_by', healthWorkerData.created_by, 'updated_by', healthWorkerData.updated_by, 'role', healthWorkerData.role);
    } catch (logErr) { console.warn('HW create log failed', logErr); }
  const newHealthWorker = await userModel.createUser(healthWorkerData, actorId, { allowSelf: false });
    res.status(201).json(newHealthWorker);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to create health staff' });
  }
};

// Update a health staff
const updateHealthWorker = async (req, res) => {
  try {
    const actorId = req.user?.user_id || null;
    const updatedHealthWorker = await userModel.updateUser(req.params.id, { ...req.body, updated_by: actorId });
    if (!updatedHealthWorker) {
      return res.status(404).json({ message: 'Health staff not found' });
    }
    res.json(updatedHealthWorker);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update health staff' });
  }
};

// Delete a health staff
const deleteHealthWorker = async (req, res) => {
  try {
    await healthWorkerModel.deleteHealthWorker(req.params.id);
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to delete health staff' });
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