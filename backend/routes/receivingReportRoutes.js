const express = require('express')
const router = express.Router()
const { authenticateRequest, checkUserMapping } = require('../middlewares/authMiddleware')
const ctrl = require('../controllers/receivingReportController')

// List reports
router.get('/', authenticateRequest, checkUserMapping, ctrl.listReports)
// Create report (DRAFT)
router.post('/', authenticateRequest, checkUserMapping, ctrl.createReport)
// Get single report with items
router.get('/:id', authenticateRequest, checkUserMapping, ctrl.getReport)
// Update report header
router.put('/:id', authenticateRequest, checkUserMapping, ctrl.updateReport)
// Add item to report
router.post('/:id/items', authenticateRequest, checkUserMapping, ctrl.addItem)
// Update item in report
router.put('/:id/items/:itemId', authenticateRequest, checkUserMapping, ctrl.updateItem)
// Complete report (creates inventory via DB function)
router.post('/:id/complete', authenticateRequest, checkUserMapping, ctrl.completeReport)
// Cancel report
router.post('/:id/cancel', authenticateRequest, checkUserMapping, ctrl.cancelReport)

module.exports = router
