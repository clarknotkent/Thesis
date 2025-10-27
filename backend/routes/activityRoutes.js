const express = require('express');
const router = express.Router();
const { authenticateRequest, authorizeRole } = require('../middlewares/authMiddleware');
const { 
	getActivityLogs,
	getActivityLogById,
	exportActivityLogs,
	clearOldActivityLogs
} = require('../controllers/activityController');

// List activity logs (admin only)
router.get('/', authenticateRequest, authorizeRole(['admin', 'superadmin']), getActivityLogs);

// Export logs (admin only) - define specific routes before param routes
router.get('/export', authenticateRequest, authorizeRole(['admin', 'superadmin']), exportActivityLogs);

// Clear old logs by age in days (admin only)
router.delete('/clear-old/:days', authenticateRequest, authorizeRole(['admin', 'superadmin']), clearOldActivityLogs);

// Get single activity log by ID (admin only)
router.get('/:id', authenticateRequest, authorizeRole(['admin', 'superadmin']), getActivityLogById);

module.exports = router;
