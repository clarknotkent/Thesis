const { vaccineStock } = require('../models/mockData');

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
const getVaccineStock = (req, res) => {
  try {
    // Add status property to each vaccine
    const stockWithStatus = vaccineStock.map(vaccine => ({
      ...vaccine,
      status: getVaccineStatus(vaccine)
    }));
    
    // We'll handle pagination on the frontend to minimize API calls
    // but we could implement it here if needed
    
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
const addVaccineStock = (req, res) => {
  try {
    const { vaccineName, manufacturer, batchNo, expiryDate, quantity } = req.body;
    
    // Validation
    if (!vaccineName || !manufacturer || !batchNo || !expiryDate || quantity === undefined) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required: vaccineName, manufacturer, batchNo, expiryDate, quantity'
      });
    }
    
    // Generate new ID
    const newId = (Math.max(...vaccineStock.map(v => parseInt(v.id))) + 1).toString();
    
    // Create new vaccine object
    const newVaccine = {
      id: newId,
      vaccineName,
      manufacturer,
      batchNo,
      expiryDate,
      quantity: parseInt(quantity)
    };
    
    // Add to array
    vaccineStock.push(newVaccine);
    
    // Add status before returning
    const vaccineWithStatus = {
      ...newVaccine,
      status: getVaccineStatus(newVaccine)
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
const updateVaccineStock = (req, res) => {
  try {
    const { id } = req.params;
    const { vaccineName, manufacturer, batchNo, expiryDate, quantity } = req.body;
    
    // Find vaccine index
    const vaccineIndex = vaccineStock.findIndex(v => v.id === id);
    
    if (vaccineIndex === -1) {
      return res.status(404).json({
        success: false,
        message: `Vaccine with ID ${id} not found`
      });
    }
    
    // Update vaccine properties
    if (vaccineName !== undefined) vaccineStock[vaccineIndex].vaccineName = vaccineName;
    if (manufacturer !== undefined) vaccineStock[vaccineIndex].manufacturer = manufacturer;
    if (batchNo !== undefined) vaccineStock[vaccineIndex].batchNo = batchNo;
    if (expiryDate !== undefined) vaccineStock[vaccineIndex].expiryDate = expiryDate;
    if (quantity !== undefined) vaccineStock[vaccineIndex].quantity = parseInt(quantity);
    
    // Get updated vaccine with status
    const updatedVaccine = {
      ...vaccineStock[vaccineIndex],
      status: getVaccineStatus(vaccineStock[vaccineIndex])
    };
    
    res.json({
      success: true,
      message: 'Vaccine stock updated successfully',
      data: updatedVaccine
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
const deleteVaccineStock = (req, res) => {
  try {
    const { id } = req.params;
    
    // Find vaccine index
    const vaccineIndex = vaccineStock.findIndex(v => v.id === id);
    
    if (vaccineIndex === -1) {
      return res.status(404).json({
        success: false,
        message: `Vaccine with ID ${id} not found`
      });
    }
    
    // Remove vaccine from array
    const deletedVaccine = vaccineStock.splice(vaccineIndex, 1)[0];
    
    res.json({
      success: true,
      message: `Vaccine stock "${deletedVaccine.vaccineName}" deleted successfully`,
      data: deletedVaccine
    });
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
const getVaccineStats = (req, res) => {
  try {
    const stockWithStatus = vaccineStock.map(vaccine => ({
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