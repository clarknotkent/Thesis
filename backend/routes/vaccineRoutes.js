const express = require('express');
const router = express.Router();
const { authenticateRequest, authorizeRole, checkUserMapping } = require('../middlewares/authMiddleware');
const { manageScheduling, getScheduleForVaccine } = require('../controllers/vaccineController');
// Scheduling Management Route
// POST /api/vaccines/:id/schedule - Manage scheduling for a vaccine type
router.post('/:id/schedule', authenticateRequest, checkUserMapping, authorizeRole(['admin']), manageScheduling);
// GET /api/vaccines/:id/schedule - Retrieve schedule for a vaccine type
router.get('/:id/schedule', authenticateRequest, checkUserMapping, authorizeRole(['admin']), getScheduleForVaccine);
const {
  addVaccine,
  getVaccine,
  updateVaccine,
  deleteVaccine,
  listVaccines,
  addInventory,
  getInventory,
  updateInventory,
  deleteInventory,
  listInventory,
  createInventoryRequest,
  approveInventoryRequest,
  getInventoryRequests,
  createInventoryTransaction,
  getInventoryTransactions
} = require('../controllers/vaccineController');

const { listSchedules } = require('../controllers/vaccineController');

// GET /api/vaccines/schedules - list all schedules
router.get('/schedules', authenticateRequest, checkUserMapping, authorizeRole(['admin']), listSchedules);

// Vaccine Type Management Routes
// POST /api/vaccines - Add a new vaccine type
router.post('/', authenticateRequest, checkUserMapping, authorizeRole(['admin']), addVaccine);

// GET /api/vaccines - List all vaccines
router.get('/', listVaccines);

// Specific routes (Must come BEFORE /:id parameterized routes)

// Inventory Management Routes
// GET /api/vaccines/inventory - List all inventory items
router.get('/inventory', listInventory);

// POST /api/vaccines/inventory - Add vaccine stock
router.post('/inventory', authenticateRequest, checkUserMapping, authorizeRole(['admin']), addInventory);

// GET /api/vaccines/inventory/:id - Retrieve inventory details
router.get('/inventory/:id', getInventory);

// PUT /api/vaccines/inventory/:id - Edit inventory info
router.put('/inventory/:id', authenticateRequest, checkUserMapping, authorizeRole(['admin']), updateInventory);

// DELETE /api/vaccines/inventory/:id - Remove inventory entry
router.delete('/inventory/:id', authenticateRequest, checkUserMapping, authorizeRole(['admin']), deleteInventory);

// Inventory Request Management Routes
// GET /api/vaccines/requests - List all inventory requests
router.get('/requests', getInventoryRequests);

// POST /api/vaccines/requests - Request new vaccine stock
router.post('/requests', authenticateRequest, checkUserMapping, authorizeRole(['admin','health_worker']), createInventoryRequest);

// PUT /api/vaccines/requests/:id/approve - Approve or reject inventory requests
router.put('/requests/:id/approve', authenticateRequest, checkUserMapping, authorizeRole(['admin']), approveInventoryRequest);

// Inventory Transaction Management Routes
// GET /api/vaccines/transactions - List all inventory transactions
router.get('/transactions', getInventoryTransactions);

// POST /api/vaccines/transactions - Record inventory movement
router.post('/transactions', authenticateRequest, checkUserMapping, authorizeRole(['admin']), createInventoryTransaction);

// Parameterized routes (Must come AFTER specific routes)

// GET /api/vaccines/:id - Retrieve vaccine details
router.get('/:id', getVaccine);

// PUT /api/vaccines/:id - Edit vaccine info
router.put('/:id', authenticateRequest, checkUserMapping, authorizeRole(['admin']), updateVaccine);

// DELETE /api/vaccines/:id - Remove vaccine type
router.delete('/:id', authenticateRequest, checkUserMapping, authorizeRole(['admin']), deleteVaccine);

module.exports = router;