const express = require('express');
const router = express.Router();
const { authenticateRequest, checkUserMapping, authorizeRole } = require('../middlewares/authMiddleware');
const {
  listVitamina,
  getVitaminaRecord,
  createVitaminaRecord,
  updateVitaminaRecord,
  deleteVitaminaRecord,
} = require('../controllers/vitaminaController');

router.get('/', authenticateRequest, checkUserMapping, listVitamina);
router.get('/:id', authenticateRequest, checkUserMapping, getVitaminaRecord);
router.post('/', authenticateRequest, checkUserMapping, authorizeRole(['admin','health_worker','nurse','nutritionist']), createVitaminaRecord);
router.put('/:id', authenticateRequest, checkUserMapping, authorizeRole(['admin','health_worker','nurse','nutritionist']), updateVitaminaRecord);
router.delete('/:id', authenticateRequest, checkUserMapping, authorizeRole(['admin']), deleteVitaminaRecord);

module.exports = router;
