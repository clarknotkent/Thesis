const express = require('express');
const router = express.Router();
const { authenticateRequest, checkUserMapping, authorizeRole } = require('../middlewares/authMiddleware');

// GET /api/notification-templates - list available templates (placeholder)
router.get('/', authenticateRequest, checkUserMapping, authorizeRole(['admin','health_worker']), async (req, res) => {
	res.json({ success: true, data: [] });
});

// POST /api/notification-templates - create template (placeholder)
router.post('/', authenticateRequest, checkUserMapping, authorizeRole(['admin']), async (req, res) => {
	// TODO: persist templates in notification_templates table
	res.status(201).json({ success: true, message: 'Template creation not implemented (placeholder)' });
});

module.exports = router;
