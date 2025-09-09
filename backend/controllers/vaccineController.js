const vaccineModel = require('../models/vaccineModel');

// Helper function to determine vaccine status
const getVaccineStatus = (vaccine) => {
  const currentDate = new Date();
  const expiryDate = new Date(vaccine.expiryDate);
  const daysDifference = Math.ceil((expiryDate - currentDate) / (1000 * 60 * 60 * 24));
  
  if (vaccine.quantity === 0) {
    return 'Out of Stock';
  } else if (daysDifference <= 30 && daysDifference > 0) {
    return 'Expiring Soon';
  } else if (vaccine.quantity > 0 && vaccine.quantity <= 50) {
    return 'Low Stock';
  } else {
    return 'Available';
  }
};

// GET /api/vaccines/stock - Get all vaccine stock with status
const getVaccineStock = async (req, res) => {
  try {
    const vaccines = await vaccineModel.getAllVaccines();
    
    // Add status property to each vaccine
    const stockWithStatus = vaccines.map(vaccine => ({
      ...vaccine,
      status: getVaccineStatus(vaccine)
    }));
    
    res.json({
      success: true,
      data: stockWithStatus,
      count: stockWithStatus.length
    });
  } catch (error) {
    console.error('Error fetching vaccine stock:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching vaccine stock',
      error: error.message
    });
  }
};

// POST /api/vaccines/stock - Add new vaccine stock
const addVaccineStock = async (req, res) => {
  try {
    const { vaccineName, manufacturer, batchNo, expiryDate, quantity } = req.body;
    
    // Validation
    if (!vaccineName || !manufacturer || !batchNo || !expiryDate || quantity === undefined) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required: vaccineName, manufacturer, batchNo, expiryDate, quantity'
      });
    }
    
    // Create new vaccine object
    const newVaccine = {
      vaccineName,
      manufacturer,
      batchNo,
      expiryDate,
      quantity: parseInt(quantity)
    };
    
    // Add to database
    const createdVaccine = await vaccineModel.createVaccine(newVaccine);
    
    // Add status before returning
    const vaccineWithStatus = {
      ...createdVaccine,
      status: getVaccineStatus(createdVaccine)
    };
    
    res.status(201).json({
      success: true,
      message: 'Vaccine stock added successfully',
      data: vaccineWithStatus
    });
  } catch (error) {
    console.error('Error adding vaccine stock:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding vaccine stock',
      error: error.message
    });
  }
};

// PUT /api/vaccines/stock/:id - Update vaccine stock
const updateVaccineStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { vaccineName, manufacturer, batchNo, expiryDate, quantity } = req.body;
    
    // Find and update vaccine
    const updatedVaccine = await vaccineModel.updateVaccine(id, {
      vaccineName,
      manufacturer,
      batchNo,
      expiryDate,
      quantity: parseInt(quantity)
    });
    
    if (!updatedVaccine) {
      return res.status(404).json({
        success: false,
        message: `Vaccine with ID ${id} not found`
      });
    }
    
    // Get updated vaccine with status
    const vaccineWithStatus = {
      ...updatedVaccine,
      status: getVaccineStatus(updatedVaccine)
    };
    
    res.json({
      success: true,
      message: 'Vaccine stock updated successfully',
      data: vaccineWithStatus
    });
  } catch (error) {
    console.error('Error updating vaccine stock:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating vaccine stock',
      error: error.message
    });
  }
};

// DELETE /api/vaccines/stock/:id - Delete vaccine stock
const deleteVaccineStock = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Delete vaccine from database
    await vaccineModel.deleteVaccine(id);
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting vaccine stock:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting vaccine stock',
      error: error.message
    });
  }
};

// GET /api/vaccines/stock/stats - Get vaccine stock statistics
const getVaccineStats = async (req, res) => {
  try {
    const vaccines = await vaccineModel.getAllVaccines();
    
    const stockWithStatus = vaccines.map(vaccine => ({
      ...vaccine,
      status: getVaccineStatus(vaccine)
    }));
    
    const stats = {
      totalTypes: stockWithStatus.length,
      totalDoses: stockWithStatus.reduce((sum, vaccine) => sum + vaccine.quantity, 0),
      available: stockWithStatus.filter(v => v.status === 'Available').length,
      lowStock: stockWithStatus.filter(v => v.status === 'Low Stock').length,
      outOfStock: stockWithStatus.filter(v => v.status === 'Out of Stock').length,
      expiringSoon: stockWithStatus.filter(v => v.status === 'Expiring Soon').length
    };
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching vaccine stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching vaccine statistics',
      error: error.message
    });
  }
};

module.exports = {
  getVaccineStock,
  addVaccineStock,
  updateVaccineStock,
  deleteVaccineStock,
  getVaccineStats
};