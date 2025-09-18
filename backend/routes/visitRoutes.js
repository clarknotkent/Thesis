const express = require('express');
const router = express.Router();
const { authenticateRequest, checkUserMapping } = require('../middlewares/authMiddleware');
const { getVisits, getVisit } = require('../controllers/visitController');

router.get('/', authenticateRequest, checkUserMapping, getVisits);
router.get('/:id', authenticateRequest, checkUserMapping, getVisit);

module.exports = router;
