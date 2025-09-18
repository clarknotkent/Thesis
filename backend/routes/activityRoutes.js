const express = require('express');
const router = express.Router();
const { authenticateRequest, checkUserMapping } = require('../middlewares/authMiddleware');
const { getActivityLogs } = require('../controllers/activityController');

router.get('/', authenticateRequest, checkUserMapping, getActivityLogs);

module.exports = router;
