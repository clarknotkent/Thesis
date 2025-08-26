const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getRecentVaccinations,
  getVaccineChartData,
  getDashboardOverview
} = require('../controllers/dashboardController');

// GET /api/dashboard/stats - Get dashboard statistics
router.get('/stats', getDashboardStats);

// GET /api/dashboard/recent-vaccinations - Get recent vaccinations
router.get('/recent-vaccinations', getRecentVaccinations);

// GET /api/dashboard/vaccine-chart-data - Get vaccine chart data
router.get('/vaccine-chart-data', getVaccineChartData);

// GET /api/dashboard/overview - Get complete dashboard overview
router.get('/overview', getDashboardOverview);

module.exports = router;
