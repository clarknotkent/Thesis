const express = require('express');
const router = express.Router();
const { authenticateRequest, checkUserMapping } = require('../middlewares/authMiddleware');
const {
  getParentProfile,
  getParentChildren,
  getChildDetails,
  getChildVaccinationSchedule
} = require('../controllers/parentController');

// Apply auth middleware to all routes
router.use(authenticateRequest);
router.use(checkUserMapping);

// GET /api/parent/profile - Get parent profile
router.get('/profile', getParentProfile);

// GET /api/parent/children - Get parent's children
router.get('/children', getParentChildren);

// GET /api/parent/children/:childId - Get specific child details
router.get('/children/:childId', getChildDetails);

// GET /api/parent/children/:childId/schedule - Get child's vaccination schedule
router.get('/children/:childId/schedule', getChildVaccinationSchedule);

module.exports = router;