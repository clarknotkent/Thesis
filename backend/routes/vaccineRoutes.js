const express = require('express');
const router = express.Router();
const {
  getVaccineStock,
  addVaccineStock,
  updateVaccineStock,
  deleteVaccineStock,
  getVaccineStats
} = require('../controllers/vaccineController');

// GET /api/vaccines/stock - Get all vaccine stock
router.get('/stock', getVaccineStock);

// POST /api/vaccines/stock - Add new vaccine stock
router.post('/stock', addVaccineStock);

// PUT /api/vaccines/stock/:id - Update vaccine stock
router.put('/stock/:id', updateVaccineStock);

// DELETE /api/vaccines/stock/:id - Delete vaccine stock
router.delete('/stock/:id', deleteVaccineStock);

// GET /api/vaccines/stock/stats - Get vaccine statistics
router.get('/stock/stats', getVaccineStats);

module.exports = router;