const express = require('express');
const router = express.Router();
const { authenticateRequest, checkUserMapping } = require('../middlewares/authMiddleware');
const { 
  getMonthlyReport,
  getAnnualReport,
  getDefaultersReport,
  getDueSoonReport,
  getInventoryLowStockReport,
  getTCLReport
} = require('../controllers/reportController');

// GET /api/reports/monthly - Get monthly report
router.get('/monthly', authenticateRequest, checkUserMapping, getMonthlyReport);

// GET /api/reports/annual - Get annual report
router.get('/annual', authenticateRequest, checkUserMapping, getAnnualReport);

// GET /api/reports/defaulters - Get defaulters report
router.get('/defaulters', authenticateRequest, checkUserMapping, getDefaultersReport);

// GET /api/reports/due-soon - Get due soon report
router.get('/due-soon', authenticateRequest, checkUserMapping, getDueSoonReport);

// GET /api/reports/low-stock - Get inventory low stock report
router.get('/low-stock', authenticateRequest, checkUserMapping, getInventoryLowStockReport);

// GET /api/reports/tcl - Get Target Client List report
router.get('/tcl', authenticateRequest, checkUserMapping, getTCLReport);



module.exports = router;
