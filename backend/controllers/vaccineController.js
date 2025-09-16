const vaccineModel = require('../models/vaccineModel');

// 1. Add a new vaccine type
const addVaccine = async (req, res) => {
	try {
		const vaccineData = {
			vaccine_name: req.body.vaccine_name,
			manufacturer: req.body.manufacturer,
			vaccine_type: req.body.vaccine_type,
			description: req.body.description,
			dosage: req.body.dosage,
			route_of_administration: req.body.route_of_administration,
			storage_temperature: req.body.storage_temperature,
			age_group: req.body.age_group,
			recommended_schedule: req.body.recommended_schedule,
			side_effects: req.body.side_effects,
			contraindications: req.body.contraindications,
			is_active: req.body.is_active !== undefined ? req.body.is_active : true
		};
		const vaccine = await vaccineModel.createVaccine(vaccineData);
		res.status(201).json({ success: true, message: 'Vaccine added successfully', data: vaccine });
	} catch (error) {
		console.error('Error adding vaccine:', error);
		res.status(500).json({ success: false, message: 'Failed to add vaccine', error: error.message });
	}
};

// 2. Retrieve vaccine details
const getVaccine = async (req, res) => {
	try {
		const { id } = req.params;
		const vaccine = await vaccineModel.getVaccineById(id);
		if (!vaccine) {
			return res.status(404).json({ success: false, message: 'Vaccine not found' });
		}
		res.json({ success: true, data: vaccine });
	} catch (error) {
		console.error('Error fetching vaccine:', error);
		res.status(500).json({ success: false, message: 'Failed to fetch vaccine', error: error.message });
	}
};

// 3. Edit vaccine info
const updateVaccine = async (req, res) => {
	try {
		const { id } = req.params;
		const updates = req.body;
		const vaccine = await vaccineModel.updateVaccine(id, updates);
		if (!vaccine) {
			return res.status(404).json({ success: false, message: 'Vaccine not found' });
		}
		res.json({ success: true, message: 'Vaccine updated successfully', data: vaccine });
	} catch (error) {
		console.error('Error updating vaccine:', error);
		res.status(500).json({ success: false, message: 'Failed to update vaccine', error: error.message });
	}
};

// 4. Remove vaccine type
const deleteVaccine = async (req, res) => {
	try {
		const { id } = req.params;
		const result = await vaccineModel.deleteVaccine(id);
		if (!result) {
			return res.status(404).json({ success: false, message: 'Vaccine not found' });
		}
		res.json({ success: true, message: 'Vaccine deleted successfully' });
	} catch (error) {
		console.error('Error deleting vaccine:', error);
		res.status(500).json({ success: false, message: 'Failed to delete vaccine', error: error.message });
	}
};

// 5. List all vaccines
const listVaccines = async (req, res) => {
	try {
		const { page = 1, limit = 10, vaccine_type, age_group, search } = req.query;
		const filters = { vaccine_type, age_group, search };
		const result = await vaccineModel.getAllVaccines(filters, page, limit);
		res.json({ success: true, data: result });
	} catch (error) {
		console.error('Error listing vaccines:', error);
		res.status(500).json({ success: false, message: 'Failed to list vaccines', error: error.message });
	}
};

// 6. Add vaccine stock
const addInventory = async (req, res) => {
	try {
		const inventoryData = {
			vaccine_id: req.body.vaccine_id,
			batch_number: req.body.batch_number,
			expiry_date: req.body.expiry_date,
			quantity: req.body.quantity,
			cost_per_dose: req.body.cost_per_dose,
			supplier: req.body.supplier,
			received_date: req.body.received_date || new Date(),
			location: req.body.location,
			status: req.body.status || 'available'
		};
		const inventory = await vaccineModel.addInventory(inventoryData);
		res.status(201).json({ success: true, message: 'Inventory added successfully', data: inventory });
	} catch (error) {
		console.error('Error adding inventory:', error);
		res.status(500).json({ success: false, message: 'Failed to add inventory', error: error.message });
	}
};

// 7. Retrieve inventory details
const getInventory = async (req, res) => {
	try {
		const { id } = req.params;
		const inventory = await vaccineModel.getInventoryById(id);
		if (!inventory) {
			return res.status(404).json({ success: false, message: 'Inventory not found' });
		}
		res.json({ success: true, data: inventory });
	} catch (error) {
		console.error('Error fetching inventory:', error);
		res.status(500).json({ success: false, message: 'Failed to fetch inventory', error: error.message });
	}
};

// 8. Edit inventory info
const updateInventory = async (req, res) => {
	try {
		const { id } = req.params;
		const updates = req.body;
		const inventory = await vaccineModel.updateInventory(id, updates);
		if (!inventory) {
			return res.status(404).json({ success: false, message: 'Inventory not found' });
		}
		res.json({ success: true, message: 'Inventory updated successfully', data: inventory });
	} catch (error) {
		console.error('Error updating inventory:', error);
		res.status(500).json({ success: false, message: 'Failed to update inventory', error: error.message });
	}
};

// 9. Remove inventory entry
const deleteInventory = async (req, res) => {
	try {
		const { id } = req.params;
		const result = await vaccineModel.deleteInventory(id);
		if (!result) {
			return res.status(404).json({ success: false, message: 'Inventory not found' });
		}
		res.json({ success: true, message: 'Inventory deleted successfully' });
	} catch (error) {
		console.error('Error deleting inventory:', error);
		res.status(500).json({ success: false, message: 'Failed to delete inventory', error: error.message });
	}
};

// 10. List all inventory items
const listInventory = async (req, res) => {
	try {
		const { page = 1, limit = 10, vaccine_id, status, location, expiring_soon } = req.query;
		const filters = { vaccine_id, status, location, expiring_soon };
		const result = await vaccineModel.getAllInventory(filters, page, limit);
		res.json({ success: true, data: result });
	} catch (error) {
		console.error('Error listing inventory:', error);
		res.status(500).json({ success: false, message: 'Failed to list inventory', error: error.message });
	}
};

// 11. Request new vaccine stock
const createInventoryRequest = async (req, res) => {
	try {
		const requestData = {
			vaccine_id: req.body.vaccine_id,
			requested_quantity: req.body.requested_quantity,
			priority: req.body.priority || 'medium',
			reason: req.body.reason,
			requested_by: req.user.id,
			facility_id: req.body.facility_id,
			urgency_date: req.body.urgency_date,
			notes: req.body.notes
		};
		const request = await vaccineModel.createInventoryRequest(requestData);
		res.status(201).json({ success: true, message: 'Inventory request created successfully', data: request });
	} catch (error) {
		console.error('Error creating inventory request:', error);
		res.status(500).json({ success: false, message: 'Failed to create inventory request', error: error.message });
	}
};

// 12. Approve or reject inventory requests
const approveInventoryRequest = async (req, res) => {
	try {
		const { id } = req.params;
		const { status, approved_quantity, approver_notes } = req.body;

		if (!['approved', 'rejected'].includes(status)) {
			return res.status(400).json({ success: false, message: 'Status must be approved or rejected' });
		}

		const updateData = {
			status,
			approved_quantity,
			approver_notes,
			approved_by: req.user.id,
			approved_date: new Date()
		};

		const request = await vaccineModel.updateInventoryRequest(id, updateData);
		if (!request) {
			return res.status(404).json({ success: false, message: 'Inventory request not found' });
		}

		res.json({ success: true, message: `Inventory request ${status} successfully`, data: request });
	} catch (error) {
		console.error('Error approving inventory request:', error);
		res.status(500).json({ success: false, message: 'Failed to approve inventory request', error: error.message });
	}
};

// 13. List all inventory requests
const getInventoryRequests = async (req, res) => {
	try {
		const { page = 1, limit = 10, status, priority, facility_id } = req.query;
		const filters = { status, priority, facility_id };
		const result = await vaccineModel.getAllInventoryRequests(filters, page, limit);
		res.json({ success: true, data: result });
	} catch (error) {
		console.error('Error fetching inventory requests:', error);
		res.status(500).json({ success: false, message: 'Failed to fetch inventory requests', error: error.message });
	}
};

// 14. Record inventory movement
const createInventoryTransaction = async (req, res) => {
	try {
		const transactionData = {
			inventory_id: req.body.inventory_id,
			transaction_type: req.body.transaction_type, // 'in', 'out', 'transfer', 'adjustment'
			quantity: req.body.quantity,
			reference_id: req.body.reference_id, // immunization_id, transfer_id, etc.
			reference_type: req.body.reference_type, // 'immunization', 'transfer', 'adjustment'
			performed_by: req.user.id,
			notes: req.body.notes,
			transaction_date: req.body.transaction_date || new Date()
		};
		const transaction = await vaccineModel.createInventoryTransaction(transactionData);
		res.status(201).json({ success: true, message: 'Inventory transaction recorded successfully', data: transaction });
	} catch (error) {
		console.error('Error creating inventory transaction:', error);
		res.status(500).json({ success: false, message: 'Failed to create inventory transaction', error: error.message });
	}
};

// 15. List all inventory transactions
const getInventoryTransactions = async (req, res) => {
	try {
		const { page = 1, limit = 10, inventory_id, transaction_type, date_from, date_to } = req.query;
		const filters = { inventory_id, transaction_type, date_from, date_to };
		const result = await vaccineModel.getAllInventoryTransactions(filters, page, limit);
		res.json({ success: true, data: result });
	} catch (error) {
		console.error('Error fetching inventory transactions:', error);
		res.status(500).json({ success: false, message: 'Failed to fetch inventory transactions', error: error.message });
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
	createInventoryRequest,
	approveInventoryRequest,
	getInventoryRequests,
	createInventoryTransaction,
	getInventoryTransactions
};