const express = require('express');
const router = express.Router();
const { authenticateRequest, checkUserMapping } = require('../middlewares/authMiddleware');
const { getConversations } = require('../controllers/conversationController');

router.get('/', authenticateRequest, checkUserMapping, getConversations);

module.exports = router;
