const express = require('express');
const router = express.Router();
const {
  getImmunizations,
  getImmunizationDetails,
  createImmunization,
  updateImmunization,
  deleteImmunization
} = require('../controllers/immunizationController');

// GET /api/immunizations - Get all immunizations
router.get('/', getImmunizations);

// GET /api/immunizations/:id - Get immunization details
router.get('/:id', getImmunizationDetails);

// POST /api/immunizations - Create a new immunization
router.post('/', createImmunization);

// PUT /api/immunizations/:id - Update immunization details
router.put('/:id', updateImmunization);

// DELETE /api/immunizations/:id - Delete an immunization
router.delete('/:id', deleteImmunization);

module.exports = router;
