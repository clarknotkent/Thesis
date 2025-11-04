const express = require('express');
const router = express.Router();
const { authenticateRequest, checkUserMapping } = require('../middlewares/authMiddleware');
const {
  getParentProfile,
  getParentChildren,
  getChildDetails,
  getChildVaccinationSchedule,
  getChildImmunizationDetails,
  getChildVisitHistory,
  updateParentProfile,
  changeParentPassword,
} = require('../controllers/parentController');

// Apply auth middleware to all routes
router.use(authenticateRequest);
router.use(checkUserMapping);

// GET /api/parent/profile - Get parent profile
router.get('/profile', getParentProfile);

// PUT /api/parent/profile - Update parent profile
router.put('/profile', updateParentProfile);

// POST /api/parent/change-password - Change parent password
router.post('/change-password', changeParentPassword);

// GET /api/parent/children - Get parent's children
router.get('/children', getParentChildren);

// GET /api/parent/children/:childId - Get specific child details
router.get('/children/:childId', getChildDetails);

// GET /api/parent/children/:childId/schedule - Get child's vaccination schedule
router.get('/children/:childId/schedule', getChildVaccinationSchedule);

// GET /api/parent/children/:childId/visits - Get child's visit history
router.get('/children/:childId/visits', getChildVisitHistory);

// GET /api/parent/children/:childId/immunizations/:immunizationId - Get immunization details
router.get('/children/:childId/immunizations/:immunizationId', getChildImmunizationDetails);

module.exports = router;