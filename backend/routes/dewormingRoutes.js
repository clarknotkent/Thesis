const express = require('express');
const router = express.Router();
const { authenticateRequest, checkUserMapping, authorizeRole } = require('../middlewares/authMiddleware');
const {
  listDeworming,
  getDewormingRecord,
  createDewormingRecord,
  updateDewormingRecord,
  deleteDewormingRecord,
} = require('../controllers/dewormingController');

router.get('/', authenticateRequest, checkUserMapping, listDeworming);
router.get('/:id', authenticateRequest, checkUserMapping, getDewormingRecord);
router.post('/', authenticateRequest, checkUserMapping, authorizeRole(['admin','health_worker','nurse','nutritionist']), createDewormingRecord);
router.put('/:id', authenticateRequest, checkUserMapping, authorizeRole(['admin','health_worker','nurse','nutritionist']), updateDewormingRecord);
router.delete('/:id', authenticateRequest, checkUserMapping, authorizeRole(['admin']), deleteDewormingRecord);

module.exports = router;
