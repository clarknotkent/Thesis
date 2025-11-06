import express from 'express';
const router = express.Router();
import { authenticateRequest, checkUserMapping } from '../middlewares/authMiddleware.js';
import { sendMessage, getMessages, markRead } from '../controllers/messageController.js';

// Fetch messages for a conversation (authenticated users mapped)
router.get('/:conversation_id', authenticateRequest, checkUserMapping, getMessages);

// Mark message read (authenticated)
router.post('/:message_id/read', authenticateRequest, checkUserMapping, markRead);

// Send message - Any authenticated user
router.post('/', authenticateRequest, checkUserMapping, sendMessage);

export default router;
