import express from 'express';
const router = express.Router();
import { authenticateRequest, checkUserMapping } from '../middlewares/authMiddleware.js';
import { getVitalsByVisitId, updateVitalsByVisitId } from '../controllers/vitalsController.js';

router.get('/:visitId', authenticateRequest, checkUserMapping, getVitalsByVisitId);
router.put('/:visitId', authenticateRequest, checkUserMapping, updateVitalsByVisitId);

export default router;
