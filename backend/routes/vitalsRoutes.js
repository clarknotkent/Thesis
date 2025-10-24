const express = require('express');
const router = express.Router();
const { authenticateRequest, checkUserMapping } = require('../middlewares/authMiddleware');
const { getVitalsByVisitId, updateVitalsByVisitId } = require('../controllers/vitalsController');

router.get('/:visitId', authenticateRequest, checkUserMapping, getVitalsByVisitId);
router.put('/:visitId', authenticateRequest, checkUserMapping, updateVitalsByVisitId);

module.exports = router;