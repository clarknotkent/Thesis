const express = require('express');
const router = express.Router();
const {
  getDashboardMetrics,
  getWorkerProgress,
  getVaccineReport,
  getDashboardOverview
} = require('../controllers/dashboardController');

// GET /api/dashboard/metrics - Get dashboard metrics
router.get('/metrics', getDashboardMetrics);

// GET /api/dashboard/worker-progress - Get health worker progress
router.get('/worker-progress', getWorkerProgress);

// GET /api/dashboard/vaccine-report - Get vaccine report
router.get('/vaccine-report', getVaccineReport);

// GET /api/dashboard/overview - Get dashboard overview
router.get('/overview', getDashboardOverview);

module.exports = router;
