const express = require('express');
const router = express.Router();
const { 
  getMonthlyReport,
  getAnnualReport,
  getDefaultersReport,
  getDueSoonReport,
  getInventoryLowStockReport,
  getTCLReport
} = require('../controllers/reportController');

// GET /api/reports/monthly - Get monthly report
router.get('/monthly', getMonthlyReport);

// GET /api/reports/annual - Get annual report
router.get('/annual', getAnnualReport);

// GET /api/reports/defaulters - Get defaulters report
router.get('/defaulters', getDefaultersReport);

// GET /api/reports/due-soon - Get due soon report
router.get('/due-soon', getDueSoonReport);

// GET /api/reports/low-stock - Get inventory low stock report
router.get('/low-stock', getInventoryLowStockReport);

// GET /api/reports/tcl - Get Target Client List report
router.get('/tcl', getTCLReport);



module.exports = router;
