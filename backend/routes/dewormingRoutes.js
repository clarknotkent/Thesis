import express from 'express';
const router = express.Router();
import { authenticateRequest, checkUserMapping, authorizeRole } from '../middlewares/authMiddleware.js';
import { listDeworming,
  getDewormingRecord,
  createDewormingRecord,
  updateDewormingRecord,
  deleteDewormingRecord } from '../controllers/dewormingController.js';

router.get('/', authenticateRequest, checkUserMapping, listDeworming);
router.get('/:id', authenticateRequest, checkUserMapping, getDewormingRecord);
router.post('/', authenticateRequest, checkUserMapping, authorizeRole(['admin','health_worker','nurse','nutritionist']), createDewormingRecord);
router.put('/:id', authenticateRequest, checkUserMapping, authorizeRole(['admin','health_worker','nurse','nutritionist']), updateDewormingRecord);
router.delete('/:id', authenticateRequest, checkUserMapping, authorizeRole(['admin']), deleteDewormingRecord);

export default router;
