const express = require('express');
const router = express.Router();
const { authenticateRequest, checkUserMapping } = require('../middlewares/authMiddleware');
const { create, list, mark_sent } = require('../controllers/notificationController');

// Create a notification (admin/health worker can create)
router.post('/', authenticateRequest, checkUserMapping, create);

// List notifications (user-specific by default)
router.get('/', authenticateRequest, checkUserMapping, list);

// Mark notification as sent (internal)
router.post('/:id/mark-sent', authenticateRequest, checkUserMapping, mark_sent);

module.exports = router;
