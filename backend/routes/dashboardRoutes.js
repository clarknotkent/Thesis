import express from 'express';
const router = express.Router();
import { authenticateRequest, checkUserMapping } from '../middlewares/authMiddleware.js';
import { getDashboardMetrics,
  getWorkerProgress,
  getVaccineReport,
  getDashboardOverview } from '../controllers/dashboardController.js';

// GET /api/dashboard/metrics - Get dashboard metrics
router.get('/metrics', authenticateRequest, checkUserMapping, getDashboardMetrics);

// GET /api/dashboard/worker-progress - Get health worker progress
router.get('/worker-progress', authenticateRequest, checkUserMapping, getWorkerProgress);

// GET /api/dashboard/vaccine-report - Get vaccine report
router.get('/vaccine-report', authenticateRequest, checkUserMapping, getVaccineReport);

// GET /api/dashboard/overview - Get dashboard overview
router.get('/overview', authenticateRequest, checkUserMapping, getDashboardOverview);

export default router;
