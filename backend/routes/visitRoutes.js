const express = require('express');
const router = express.Router();
const { authenticateRequest, checkUserMapping } = require('../middlewares/authMiddleware');
const { getVisits, getVisit, postVisit } = require('../controllers/visitController');

router.get('/', authenticateRequest, checkUserMapping, getVisits);
router.get('/:id', authenticateRequest, checkUserMapping, getVisit);
router.post('/', authenticateRequest, checkUserMapping, postVisit);

module.exports = router;
