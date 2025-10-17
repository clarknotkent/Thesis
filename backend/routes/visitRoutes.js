const express = require('express');
const router = express.Router();
const { authenticateRequest, checkUserMapping } = require('../middlewares/authMiddleware');
const { getVisits, getVisit, postVisit, updateVisit, ensureVisit } = require('../controllers/visitController');

// GET routes - no user mapping required for admins to read visit data
router.get('/', authenticateRequest, getVisits);
router.get('/:id', authenticateRequest, getVisit);

// Write operations - require user mapping
router.post('/', authenticateRequest, checkUserMapping, postVisit);
router.put('/:id', authenticateRequest, checkUserMapping, updateVisit);
router.post('/ensure', authenticateRequest, checkUserMapping, ensureVisit);

module.exports = router;
