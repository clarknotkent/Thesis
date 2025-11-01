const express = require('express');
const router = express.Router();
const { authenticateRequest, checkUserMapping } = require('../middlewares/authMiddleware');
const { getConversations, create, startWithMessage, leaveConversation } = require('../controllers/conversationController');
const { authorizeRole } = require('../middlewares/authMiddleware');

router.get('/', authenticateRequest, checkUserMapping, getConversations);

// Create conversation and add participants - Any authenticated user
router.post('/', authenticateRequest, checkUserMapping, create);

// Start conversation and send first message in one call - Any authenticated user
router.post('/start', authenticateRequest, checkUserMapping, startWithMessage);

// Participant leaves a conversation (sets left_at)
router.post('/:conversation_id/leave', authenticateRequest, checkUserMapping, leaveConversation);

module.exports = router;
