const express = require('express');
const router = express.Router();
const { authenticateRequest, checkUserMapping, authorizeRole } = require('../middlewares/authMiddleware');
const {
  createNotification,
  listNotifications,
  markAsRead,
  fetchPendingScheduled,
} = require('../controllers/notificationsController');

// POST /api/notifications - create a notification (admin/system)
router.post('/', authenticateRequest, checkUserMapping, authorizeRole(['admin', 'health_worker']), createNotification);

// GET /api/notifications - list inbox for current user (admin can pass recipient_user_id)
router.get('/', authenticateRequest, checkUserMapping, authorizeRole(['admin', 'health_worker', 'parent']), listNotifications);

// PUT /api/notifications/:id/read - mark as read
router.put('/:id/read', authenticateRequest, checkUserMapping, markAsRead);

// GET /api/notifications/pending - internal: fetch pending scheduled notifications (no auth required for scheduler if run locally)
router.get('/pending', fetchPendingScheduled);

module.exports = router;
