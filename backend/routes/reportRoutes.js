const express = require('express');
const router = express.Router();
const { generateReport } = require('../controllers/reportController');

// GET /api/reports - Generate a report
router.get('/', generateReport);

module.exports = router;
