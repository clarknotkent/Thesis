import express from 'express';
const router = express.Router();
import { authenticateRequest, checkUserMapping } from '../middlewares/authMiddleware.js';
import { getConversations, create, startWithMessage, leaveConversation, getUnreadCount } from '../controllers/conversationController.js';

router.get('/', authenticateRequest, checkUserMapping, getConversations);

// Create conversation and add participants - Any authenticated user
router.post('/', authenticateRequest, checkUserMapping, create);

// Start conversation and send first message in one call - Any authenticated user
router.post('/start', authenticateRequest, checkUserMapping, startWithMessage);

// Participant leaves a conversation (sets left_at)
router.post('/:conversation_id/leave', authenticateRequest, checkUserMapping, leaveConversation);

// Unread count (fast badge fetch)
router.get('/unread/count', authenticateRequest, checkUserMapping, getUnreadCount);

export default router;
