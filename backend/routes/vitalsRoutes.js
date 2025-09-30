const express = require('express');
const router = express.Router();
const { authenticateRequest, checkUserMapping } = require('../middlewares/authMiddleware');
const { getVitalsByVisitId } = require('../controllers/vitalsController');

router.get('/:visitId', authenticateRequest, checkUserMapping, getVitalsByVisitId);

module.exports = router;