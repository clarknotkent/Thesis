import express from 'express';
const router = express.Router();
import { authenticateRequest, checkUserMapping, authorizeRole } from '../middlewares/authMiddleware.js';

// GET /api/notification-templates - list available templates (placeholder)
router.get('/', authenticateRequest, checkUserMapping, authorizeRole(['admin','health_worker']), (req, res) => {
  res.json({ success: true, data: [] });
});

// POST /api/notification-templates - create template (placeholder)
router.post('/', authenticateRequest, checkUserMapping, authorizeRole(['admin']), (req, res) => {
  // TODO: persist templates in notification_templates table
  res.status(201).json({ success: true, message: 'Template creation not implemented (placeholder)' });
});

export default router;
