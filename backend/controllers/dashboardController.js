const dashboardModel = require('../models/dashboardModel');

// Get dashboard metrics
const getDashboardMetrics = async (req, res) => {
  try {
    const metrics = await dashboardModel.getSummaryStats();
    res.json(metrics);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch dashboard metrics' });
  }
};

// Get health worker progress
const getWorkerProgress = async (req, res) => {
  try {
    const progress = await dashboardModel.getWorkerProgress();
    res.json(progress);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch worker progress' });
  }
};

// Get vaccine report
const getVaccineReport = async (req, res) => {
  try {
    const report = await dashboardModel.getVaccineReport();
    res.json(report);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch vaccine report' });
  }
};

// Get complete dashboard overview
const getDashboardOverview = async (req, res) => {
  try {
    const dashboardStats = await dashboardModel.fetchDashboardMetrics();
    
    res.json({
      success: true,
      data: dashboardStats
    });
  } catch (error) {
    console.error('Error fetching dashboard overview:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard overview',
      error: error.message
    });
  }
};

module.exports = {
  getDashboardMetrics,
  getWorkerProgress,
  getVaccineReport,
  getDashboardOverview
};
