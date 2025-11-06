import express from 'express';
const router = express.Router();
import { authenticateRequest, checkUserMapping, authorizeRole } from '../middlewares/authMiddleware.js';
import { listVitamina,
  getVitaminaRecord,
  createVitaminaRecord,
  updateVitaminaRecord,
  deleteVitaminaRecord } from '../controllers/vitaminaController.js';

router.get('/', authenticateRequest, checkUserMapping, listVitamina);
router.get('/:id', authenticateRequest, checkUserMapping, getVitaminaRecord);
router.post('/', authenticateRequest, checkUserMapping, authorizeRole(['admin','health_worker','nurse','nutritionist']), createVitaminaRecord);
router.put('/:id', authenticateRequest, checkUserMapping, authorizeRole(['admin','health_worker','nurse','nutritionist']), updateVitaminaRecord);
router.delete('/:id', authenticateRequest, checkUserMapping, authorizeRole(['admin']), deleteVitaminaRecord);

export default router;
