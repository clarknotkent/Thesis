const express = require('express');
const router = express.Router();
const { authenticateRequest, authorizeRole, checkUserMapping } = require('../middlewares/authMiddleware');
const { sendMessage, getMessages, markRead } = require('../controllers/messageController');

// Fetch messages for a conversation (authenticated users mapped)
router.get('/:conversation_id', authenticateRequest, checkUserMapping, getMessages);

// Mark message read (authenticated)
router.post('/:message_id/read', authenticateRequest, checkUserMapping, markRead);

// Admin-only: send message on behalf of admin (can be extended for staff roles)
router.post('/', authenticateRequest, authorizeRole(['admin', 'superadmin']), sendMessage);

module.exports = router;
