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
	// Inventory endpoints removed – not implemented in model/schema here
	const addInventory = async (req, res) => res.status(501).json({ success: false, message: 'Inventory API not implemented' });

// 7. Retrieve inventory details
const getInventory = async (req, res) => res.status(501).json({ success: false, message: 'Inventory API not implemented' });

// 8. Edit inventory info
const updateInventory = async (req, res) => res.status(501).json({ success: false, message: 'Inventory API not implemented' });

// 9. Remove inventory entry
const deleteInventory = async (req, res) => res.status(501).json({ success: false, message: 'Inventory API not implemented' });

// 10. List all inventory items
const listInventory = async (req, res) => res.status(501).json({ success: false, message: 'Inventory API not implemented' });

// 11. Request new vaccine stock
const createInventoryRequest = async (req, res) => res.status(501).json({ success: false, message: 'Inventory requests not implemented' });

// 12. Approve or reject inventory requests
const approveInventoryRequest = async (req, res) => res.status(501).json({ success: false, message: 'Inventory requests not implemented' });

// 13. List all inventory requests
const getInventoryRequests = async (req, res) => res.status(501).json({ success: false, message: 'Inventory requests not implemented' });

// 14. Record inventory movement
const createInventoryTransaction = async (req, res) => res.status(501).json({ success: false, message: 'Inventory transactions not implemented' });

// 15. List all inventory transactions
const getInventoryTransactions = async (req, res) => res.status(501).json({ success: false, message: 'Inventory transactions not implemented' });

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