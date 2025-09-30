const vaccineModel = require('../models/vaccineModel');

// Helper to send standardized error
function sendError(res, error, fallback) {
  const status = error.status || 500;
  return res.status(status).json({ success: false, message: error.status ? error.message : fallback, error: error.message });
}

// Manage scheduling for a vaccine type
const manageScheduling = async (req, res) => {
  try {
    const actorId = req.user?.user_id || null;
    const { id } = req.params; // vaccine_id
    const scheduleData = req.body;
    // Call model to handle scheduling logic (auto or manual)
    const result = await vaccineModel.manageScheduling(id, scheduleData, actorId);
    return res.status(200).json({ success: true, message: 'Scheduling updated', data: result });
  } catch (error) {
    console.error('manageScheduling error:', error);
    return sendError(res, error, 'Failed to manage scheduling');
  }
};

// GET /api/vaccines/:id/schedule - retrieve schedule for vaccine
const getScheduleForVaccine = async (req, res) => {
  try {
    const { id } = req.params;
    const schedule = await vaccineModel.getScheduleByVaccineId(id);
    if (!schedule) return res.status(404).json({ success:false, message:'Schedule not found' });
    return res.json({ success:true, data: schedule });
  } catch (error) {
    console.error('[vaccineController.getScheduleForVaccine] error:', error);
    return sendError(res, error, 'Failed to fetch schedule');
  }
}

// Create vaccine
const addVaccine = async (req, res) => {
  try {
    const actorId = req.user?.user_id || null;
    const payload = {
      antigen_name: req.body.antigen_name,
      brand_name: req.body.brand_name,
      disease_prevented: req.body.disease_prevented,
      manufacturer: req.body.manufacturer,
      vaccine_type: req.body.vaccine_type,
      category: req.body.category,
      description: req.body.description
    };
    if (payload.category && !['VACCINE','DEWORMING','VITAMIN_A'].includes(payload.category)) {
      return res.status(400).json({ success:false, message:'Invalid category. Allowed: VACCINE, DEWORMING, VITAMIN_A' });
    }
    const dto = await vaccineModel.createVaccine(payload, actorId);
    return res.status(201).json({ success:true, message:'Vaccine created', data: dto });
  } catch (error) {
  console.debug('[vaccineController.addVaccine] payload:', req.body, 'actor:', req.user?.user_id);
  console.error('addVaccine error:', error);
    return sendError(res, error, 'Failed to create vaccine');
  }
};

// Get single vaccine (returns raw record or null)
const getVaccine = async (req, res) => {
  try {
    const { id } = req.params;
    const record = await vaccineModel.getVaccineById(id);
    if (!record) return res.status(404).json({ success:false, message:'Vaccine not found' });
    return res.json({ success:true, data: record });
  } catch (error) {
  console.debug('[vaccineController.getVaccine] id:', req.params.id);
  console.error('getVaccine error:', error);
    return sendError(res, error, 'Failed to fetch vaccine');
  }
};

// Update vaccine
const updateVaccine = async (req, res) => {
  try {
    const actorId = req.user?.user_id || null;
    const { id } = req.params;
    const updates = {
      antigen_name: req.body.antigen_name,
      brand_name: req.body.brand_name,
      disease_prevented: req.body.disease_prevented,
      manufacturer: req.body.manufacturer,
      vaccine_type: req.body.vaccine_type,
      category: req.body.category,
      description: req.body.description
    };
    if (updates.category && !['VACCINE','DEWORMING','VITAMIN_A'].includes(updates.category)) {
      return res.status(400).json({ success:false, message:'Invalid category. Allowed: VACCINE, DEWORMING, VITAMIN_A' });
    }
    const dto = await vaccineModel.updateVaccine(id, updates, actorId);
    if (!dto) return res.status(404).json({ success:false, message:'Vaccine not found' });
    return res.json({ success:true, message:'Vaccine updated', data: dto });
  } catch (error) {
  console.debug('[vaccineController.updateVaccine] id:', req.params.id, 'payload:', req.body, 'actor:', req.user?.user_id);
  console.error('updateVaccine error:', error);
    return sendError(res, error, 'Failed to update vaccine');
  }
};

// Delete vaccine (soft)
const deleteVaccine = async (req, res) => {
  try {
    const actorId = req.user?.user_id || null;
    const { id } = req.params;
    const dto = await vaccineModel.deleteVaccine(id, actorId);
    if (!dto) return res.status(404).json({ success:false, message:'Vaccine not found' });
    return res.json({ success:true, message:'Vaccine deleted', data: dto });
  } catch (error) {
  console.debug('[vaccineController.deleteVaccine] id:', req.params.id, 'actor:', req.user?.user_id);
  console.error('deleteVaccine error:', error);
    return sendError(res, error, 'Failed to delete vaccine');
  }
};

// List vaccines (model has getAllVaccines existing)
const listVaccines = async (_req, res) => {
  try {
    const result = await vaccineModel.getAllVaccines();
    return res.json({ success:true, data: result.vaccines });
  } catch (error) {
  console.debug('[vaccineController.listVaccines] error occurred while listing vaccines');
  console.error('listVaccines error:', error);
    return sendError(res, error, 'Failed to list vaccines');
  }
};

// Manual stock adjustment endpoint: inserts a single ledger transaction
const adjustInventoryStock = async (req, res) => {
  try {
    const actorId = req.user?.user_id || null;
    const { id } = req.params; // inventory_id
    const { type, quantity, note } = req.body;
    const allowed = ['ADJUST','RECEIVE','RETURN','EXPIRED'];
    if (!allowed.includes(type)) {
      return res.status(400).json({ success:false, message:`Invalid type. Allowed: ${allowed.join(', ')}` });
    }
    const qty = Number(quantity);
    if (!Number.isFinite(qty) || qty <= 0) {
      return res.status(400).json({ success:false, message:'Quantity must be a positive number' });
    }
    const result = await vaccineModel.applyInventoryTransaction(id, type, qty, actorId, note || 'Manual adjustment');
    return res.json({ success:true, message:'Inventory adjusted', data: result });
  } catch (error) {
    console.error('[vaccineController.adjustInventoryStock] error:', error);
    return sendError(res, error, 'Failed to adjust inventory');
  }
};

// Create inventory item
const addInventory = async (req, res) => {
  try {
    const actorId = req.user?.user_id || null;
    const payload = {
      vaccine_id: req.body.vaccine_id,
      lot_number: req.body.lot_number,
      expiration_date: req.body.expiration_date,
      current_stock_level: req.body.current_stock_level,
      storage_location: req.body.storage_location
    };
    const dto = await vaccineModel.createInventoryItem(payload, actorId);
    return res.status(201).json({ success:true, message:'Inventory item created', data: dto });
  } catch (error) {
  console.debug('[vaccineController.addInventory] payload:', req.body, 'actor:', req.user?.user_id);
  console.error('addInventory error:', error);
    return sendError(res, error, 'Failed to create inventory item');
  }
};

// Get inventory item
const getInventory = async (req, res) => {
  try {
    const { id } = req.params;
    const record = await vaccineModel.getInventoryById(id);
    if (!record) return res.status(404).json({ success:false, message:'Inventory item not found' });
    return res.json({ success:true, data: record });
  } catch (error) {
  console.debug('[vaccineController.getInventory] id:', req.params.id);
  console.error('getInventory error:', error);
    return sendError(res, error, 'Failed to fetch inventory item');
  }
};

// Update inventory item
const updateInventory = async (req, res) => {
  try {
    const actorId = req.user?.user_id || null;
    const { id } = req.params;
    const updates = {
      vaccine_id: req.body.vaccine_id,
      lot_number: req.body.lot_number,
      expiration_date: req.body.expiration_date,
      current_stock_level: req.body.current_stock_level,
      storage_location: req.body.storage_location
    };
    const dto = await vaccineModel.updateInventoryItem(id, updates, actorId);
    if (!dto) return res.status(404).json({ success:false, message:'Inventory item not found' });
    return res.json({ success:true, message:'Inventory item updated', data: dto });
  } catch (error) {
  console.debug('[vaccineController.updateInventory] id:', req.params.id, 'payload:', req.body, 'actor:', req.user?.user_id);
  console.error('updateInventory error:', error);
    return sendError(res, error, 'Failed to update inventory item');
  }
};

// Delete inventory item
const deleteInventory = async (req, res) => {
  try {
    const actorId = req.user?.user_id || null;
    const { id } = req.params;
    const dto = await vaccineModel.deleteInventoryItem(id, actorId);
    if (!dto) return res.status(404).json({ success:false, message:'Inventory item not found' });
    return res.json({ success:true, message:'Inventory item deleted', data: dto });
  } catch (error) {
  console.debug('[vaccineController.deleteInventory] id:', req.params.id, 'actor:', req.user?.user_id);
  console.error('deleteInventory error:', error);
    return sendError(res, error, 'Failed to delete inventory item');
  }
};

// List inventory
const listInventory = async (req, res) => {
  try {
    console.debug('[vaccineController.listInventory] Fetching inventory for table...');
    const list = await vaccineModel.getAllInventory();
    console.debug('[vaccineController.listInventory] Returning', Array.isArray(list) ? list.length : 0, 'inventory items');
    return res.json({ success:true, data: list });
  } catch (error) {
    console.debug('[vaccineController.listInventory] error');
    console.error('listInventory error:', error);
    return sendError(res, error, 'Failed to list inventory');
  }
};

// Read-only stock list for health worker portal
const listStock = async (_req, res) => {
  try {
    const rows = await vaccineModel.getAllInventory();
    const mapped = (rows || []).map(v => {
      const qty = (v.current_stock_level ?? v.quantity ?? 0);
      const status = v.status || (qty > 0 ? (qty < 10 ? 'Low Stock' : 'Available') : 'Out of Stock');
      return {
        id: v.inventory_id || v.id,
        vaccineName: v.vaccinemaster?.antigen_name || v.vaccine?.antigen_name || v.antigen_name || '',
        manufacturer: v.vaccinemaster?.manufacturer || v.vaccine?.manufacturer || v.manufacturer || '',
        batchNo: v.lot_number || v.batch_number || '',
        expiryDate: v.expiration_date || v.expiry_date || '',
        quantity: qty,
        status
      };
    });
    return res.json({ success: true, data: mapped });
  } catch (error) {
    console.error('[vaccineController.listStock] error:', error);
    return sendError(res, error, 'Failed to list stock');
  }
};

// Summary stats for health worker portal
const getStockStats = async (_req, res) => {
  try {
    const rows = await vaccineModel.getAllInventory();
    const items = (rows || []).map(v => ({
      qty: v.current_stock_level ?? v.quantity ?? 0,
      exp: v.expiration_date || v.expiry_date || null
    }));
    const now = new Date();
    const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const outOfStock = items.filter(x => (x.qty || 0) === 0).length;
    const lowStock = items.filter(x => (x.qty || 0) > 0 && (x.qty || 0) < 10).length;
    const available = items.filter(x => (x.qty || 0) >= 10).length;
    const expiringSoon = items.filter(x => {
      if (!x.exp) return false;
      const d = new Date(x.exp);
      return d >= now && d <= in30;
    }).length;
    return res.json({ success: true, data: { available, lowStock, outOfStock, expiringSoon } });
  } catch (error) {
    console.error('[vaccineController.getStockStats] error:', error);
    return sendError(res, error, 'Failed to compute stock stats');
  }
};

// Placeholders (not implemented yet)
const createInventoryRequest = async (_req, res) => res.status(501).json({ success:false, message:'Inventory requests not implemented' });
const approveInventoryRequest = async (_req, res) => res.status(501).json({ success:false, message:'Inventory requests not implemented' });
const getInventoryRequests = async (_req, res) => res.status(501).json({ success:false, message:'Inventory requests not implemented' });
// Manual creation blocked (ledger is system generated)
const createInventoryTransaction = async (_req, res) => res.status(400).json({ success:false, message:'Manual transaction creation not allowed; adjust inventory instead.' });
const getInventoryTransactions = async (req, res) => {
  try {
    const { page=1, limit=20, inventory_id, vaccine_id, transaction_type, date_from, date_to } = req.query;
    const filters = { inventory_id, vaccine_id, transaction_type, date_from, date_to };
    Object.keys(filters).forEach(k => filters[k] === undefined && delete filters[k]);
    const result = await vaccineModel.getAllInventoryTransactions(filters, Number(page), Number(limit));
    return res.json({ success:true, ...result });
  } catch (error) {
  console.debug('[vaccineController.getInventoryTransactions] inventory_id:', req.params.inventory_id);
  console.error('getInventoryTransactions error:', error);
    return sendError(res, error, 'Failed to fetch inventory transactions');
  }
};
// List all schedules
const listSchedules = async (req, res) => {
  try {
    const schedules = await vaccineModel.getAllSchedules();
    return res.json({ success: true, data: schedules });
  } catch (error) {
    console.error('[vaccineController.listSchedules] error:', error);
    return sendError(res, error, 'Failed to list schedules');
  }
};

module.exports = {
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
  adjustInventoryStock,
  listStock,
  getStockStats,
  createInventoryRequest,
  approveInventoryRequest,
  getInventoryRequests,
  createInventoryTransaction,
  getInventoryTransactions,
  manageScheduling,
  getScheduleForVaccine,
  listSchedules
};