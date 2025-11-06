import express from 'express';
const router = express.Router();
import * as notificationController from '../controllers/notificationController.js';
import { authenticateRequest } from '../middlewares/authMiddleware.js';

// Create notification (admin)
router.post('/', authenticateRequest, notificationController.create);

// Broadcast notifications by recipient group (admin)
router.post('/broadcast', authenticateRequest, notificationController.broadcast);

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

export default router;
