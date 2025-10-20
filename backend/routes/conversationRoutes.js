const express = require('express');
const router = express.Router();
const { authenticateRequest, checkUserMapping } = require('../middlewares/authMiddleware');
const { getConversations, create, startWithMessage, leaveConversation } = require('../controllers/conversationController');
const { authorizeRole } = require('../middlewares/authMiddleware');

router.get('/', authenticateRequest, checkUserMapping, getConversations);

// Admin: create conversation and add participants
router.post('/', authenticateRequest, authorizeRole(['admin','superadmin']), create);

// Admin: start conversation and send first message in one call
router.post('/start', authenticateRequest, authorizeRole(['admin','superadmin']), startWithMessage);

// Participant leaves a conversation (sets left_at)
router.post('/:conversation_id/leave', authenticateRequest, checkUserMapping, leaveConversation);

module.exports = router;
