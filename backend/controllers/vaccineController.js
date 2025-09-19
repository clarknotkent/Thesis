const vaccineModel = require('../models/vaccineModel');

// 1. Add a new vaccine type
const addVaccine = async (req, res) => {
	try {
		const vaccineData = {
			antigen_name: req.body.antigen_name,
			brand_name: req.body.brand_name,
			manufacturer: req.body.manufacturer,
			vaccine_type: req.body.vaccine_type,
			description: req.body.description,
			created_by: req.user?.user_id || 1
		};

		const vaccine = await vaccineModel.createVaccine(vaccineData);
		res.status(201).json({ 
			success: true, 
			message: 'Vaccine type added successfully', 
			data: vaccine 
		});
	} catch (error) {
		console.error('Error adding vaccine:', error);
		res.status(500).json({ 
			success: false, 
			message: 'Failed to add vaccine type', 
			error: error.message 
		});
	}
};

// 2. Get vaccine by ID
const getVaccine = async (req, res) => {
	try {
		const { id } = req.params;
		const vaccine = await vaccineModel.getvaccinemasterById(id);
		
		if (!vaccine) {
			return res.status(404).json({ 
				success: false, 
				message: 'Vaccine not found' 
			});
		}
		
		res.json({ 
			success: true, 
			data: vaccine 
		});
	} catch (error) {
		console.error('Error fetching vaccine:', error);
		res.status(500).json({ 
			success: false, 
			message: 'Failed to fetch vaccine', 
			error: error.message 
		});
	}
};

// 3. Update vaccine
const updateVaccine = async (req, res) => {
	try {
		const { id } = req.params;
		const vaccineData = {
			antigen_name: req.body.antigen_name,
			brand_name: req.body.brand_name,
			manufacturer: req.body.manufacturer,
			vaccine_type: req.body.vaccine_type,
			description: req.body.description,
			updated_by: req.user?.user_id || 1
		};

		const vaccine = await vaccineModel.updateVaccine(id, vaccineData);
		
		if (!vaccine) {
			return res.status(404).json({ 
				success: false, 
				message: 'Vaccine not found' 
			});
		}
		
		res.json({ 
			success: true, 
			message: 'Vaccine updated successfully', 
			data: vaccine 
		});
	} catch (error) {
		console.error('Error updating vaccine:', error);
		res.status(500).json({ 
			success: false, 
			message: 'Failed to update vaccine', 
			error: error.message 
		});
	}
};

// 4. Delete vaccine
const deleteVaccine = async (req, res) => {
	try {
		const { id } = req.params;
		const deletedBy = req.user?.user_id || 1;
		
		const result = await vaccineModel.deleteVaccine(id, deletedBy);
		
		if (!result) {
			return res.status(404).json({ 
				success: false, 
				message: 'Vaccine not found' 
			});
		}
		
		res.json({ 
			success: true, 
			message: 'Vaccine deleted successfully' 
		});
	} catch (error) {
		console.error('Error deleting vaccine:', error);
		res.status(500).json({ 
			success: false, 
			message: 'Failed to delete vaccine', 
			error: error.message 
		});
	}
};

// 5. List all vaccines
const listVaccines = async (req, res) => {
	try {
		const vaccines = await vaccineModel.getAllVaccines();
		res.json({ 
			success: true, 
			data: vaccines,
			message: 'Vaccines retrieved successfully' 
		});
	} catch (error) {
		console.error('Error listing vaccines:', error);
		res.status(500).json({ 
			success: false, 
			message: 'Failed to retrieve vaccines', 
			error: error.message 
		});
	}
};

// 8. Retrieve inventory details
const getInventory = async (req, res) => {
	try {
		const { id } = req.params;
		const inventory = await vaccineModel.getInventoryById(id);
		
		if (!inventory) {
			return res.status(404).json({ 
				success: false, 
				message: 'Inventory item not found' 
			});
		}
		
		res.json({ 
			success: true, 
			data: inventory 
		});
	} catch (error) {
		console.error('Error fetching inventory item:', error);
		res.status(500).json({ 
			success: false, 
			message: 'Failed to fetch inventory item', 
			error: error.message 
		});
	}
};

// 9. Edit inventory info
const updateInventory = async (req, res) => {
	try {
		const { id } = req.params;
		const inventoryData = {
			vaccine_id: req.body.vaccine_id,
			lot_number: req.body.lot_number,
			expiration_date: req.body.expiration_date,
			current_stock_level: parseInt(req.body.current_stock_level) || 0,
			storage_location: req.body.storage_location,
			updated_by: req.user?.user_id || 1
		};

		const inventory = await vaccineModel.updateInventoryItem(id, inventoryData);
		
		if (!inventory) {
			return res.status(404).json({ 
				success: false, 
				message: 'Inventory item not found' 
			});
		}
		
		res.json({ 
			success: true, 
			message: 'Inventory item updated successfully', 
			data: inventory 
		});
	} catch (error) {
		console.error('Error updating inventory item:', error);
		res.status(500).json({ 
			success: false, 
			message: 'Failed to update inventory item', 
			error: error.message 
		});
	}
};

// 10. Remove inventory entry
const deleteInventory = async (req, res) => {
	try {
		const { id } = req.params;
		const deletedBy = req.user?.user_id || 1;
		
		const result = await vaccineModel.deleteInventoryItem(id, deletedBy);
		
		if (!result) {
			return res.status(404).json({ 
				success: false, 
				message: 'Inventory item not found' 
			});
		}
		
		res.json({ 
			success: true, 
			message: 'Inventory item deleted successfully' 
		});
	} catch (error) {
		console.error('Error deleting inventory item:', error);
		res.status(500).json({ 
			success: false, 
			message: 'Failed to delete inventory item', 
			error: error.message 
		});
	}
};Vaccine = async (req, res) => {
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

// 7. Add vaccine stock
const addInventory = async (req, res) => {
	try {
		const inventoryData = {
			vaccine_id: req.body.vaccine_id,
			lot_number: req.body.lot_number,
			expiration_date: req.body.expiration_date,
			current_stock_level: parseInt(req.body.current_stock_level) || 0,
			storage_location: req.body.storage_location,
			created_by: req.user?.user_id || 1
		};

		const inventory = await vaccineModel.createInventoryItem(inventoryData);
		res.status(201).json({ 
			success: true, 
			message: 'Inventory item added successfully', 
			data: inventory 
		});
	} catch (error) {
		console.error('Error adding inventory:', error);
		res.status(500).json({ 
			success: false, 
			message: 'Failed to add inventory item', 
			error: error.message 
		});
	}
};

// 10. List all inventory items
const listInventory = async (req, res) => {
	try {
		const inventory = await vaccineModel.getAllInventory();
		res.json({ 
			success: true, 
			data: inventory,
			message: 'Inventory retrieved successfully' 
		});
	} catch (error) {
		console.error('Error fetching inventory:', error);
		res.status(500).json({ 
			success: false, 
			message: 'Failed to fetch inventory', 
			error: error.message 
		});
	}
};

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