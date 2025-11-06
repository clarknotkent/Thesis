import express from 'express';
const router = express.Router();
import { authenticateRequest, authorizeRole } from '../middlewares/authMiddleware.js';
import { create, list, update, remove } from '../controllers/faqController.js';

// Public: list FAQs
router.get('/', list);

// Admin: create/update/delete FAQs
router.post('/', authenticateRequest, authorizeRole(['admin', 'superadmin']), create);
router.put('/:faq_id', authenticateRequest, authorizeRole(['admin', 'superadmin']), update);
router.delete('/:faq_id', authenticateRequest, authorizeRole(['admin', 'superadmin']), remove);

export default router;
