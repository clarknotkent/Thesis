const express = require('express');
const router = express.Router();
const { authenticateRequest, checkUserMapping } = require('../middlewares/authMiddleware');
const { getVisits, getVisit, postVisit, updateVisit, ensureVisit } = require('../controllers/visitController');

router.get('/', authenticateRequest, checkUserMapping, getVisits);
router.get('/:id', authenticateRequest, checkUserMapping, getVisit);
router.post('/', authenticateRequest, checkUserMapping, postVisit);
router.put('/:id', authenticateRequest, checkUserMapping, updateVisit);
router.post('/ensure', authenticateRequest, checkUserMapping, ensureVisit);

module.exports = router;
