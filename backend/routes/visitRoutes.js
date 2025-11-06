import express from 'express';
const router = express.Router();
import { authenticateRequest, checkUserMapping } from '../middlewares/authMiddleware.js';
import { getVisits, getVisit, postVisit, updateVisit, ensureVisit, existsVisit } from '../controllers/visitController.js';

// GET routes - no user mapping required for admins to read visit data
router.get('/', authenticateRequest, getVisits);
// Place specific routes before parametric ':id'
router.get('/exists/check', authenticateRequest, existsVisit);
router.get('/:id', authenticateRequest, getVisit);

// Write operations - require user mapping
router.post('/', authenticateRequest, checkUserMapping, postVisit);
router.put('/:id', authenticateRequest, checkUserMapping, updateVisit);
router.post('/ensure', authenticateRequest, checkUserMapping, ensureVisit);

export default router;
