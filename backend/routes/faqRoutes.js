const express = require('express');
const router = express.Router();
const { authenticateRequest, authorizeRole, checkUserMapping } = require('../middlewares/authMiddleware');
const { create, list, update, remove } = require('../controllers/faqController');

// Public: list FAQs
router.get('/', list);

// Admin: create/update/delete FAQs
router.post('/', authenticateRequest, authorizeRole(['admin', 'superadmin']), create);
router.put('/:faq_id', authenticateRequest, authorizeRole(['admin', 'superadmin']), update);
router.delete('/:faq_id', authenticateRequest, authorizeRole(['admin', 'superadmin']), remove);

module.exports = router;
