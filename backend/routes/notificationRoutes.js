const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticateRequest } = require('../middlewares/authMiddleware');

// Create notification (admin)
router.post('/', authenticateRequest, notificationController.create);

// Get my notifications (inbox)
router.get('/', authenticateRequest, notificationController.list);

// Mark notification as read
router.put('/:id/read', authenticateRequest, notificationController.markAsRead);

// Delete notification
router.delete('/:id', authenticateRequest, notificationController.deleteNotification);

// Get pending notifications (for sending service - might need admin auth)
router.get('/pending', authenticateRequest, notificationController.getPendingNotifications);

// Update notification status (for sending service)
router.put('/:id/status', authenticateRequest, notificationController.updateNotificationStatus);

module.exports = router;