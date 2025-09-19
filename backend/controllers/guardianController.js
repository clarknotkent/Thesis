const guardianModel = require('../models/guardianModel');

// Get all guardians for dropdown
const getAllGuardians = async (req, res) => {
  try {
    const guardians = await guardianModel.getAllGuardians();
    
    res.json({ 
      success: true, 
      data: guardians 
    });
  } catch (error) {
    console.error('Error fetching guardians:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch guardians', 
      error: error.message 
    });
  }
};

// Get guardian by ID
const getGuardianById = async (req, res) => {
  try {
    const { id } = req.params;
    const guardian = await guardianModel.getGuardianById(id);
    
    if (!guardian) {
      return res.status(404).json({ 
        success: false,
        message: 'Guardian not found' 
      });
    }
    
    res.json({ 
      success: true, 
      data: guardian 
    });
  } catch (error) {
    console.error('Error fetching guardian:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch guardian details', 
      error: error.message 
    });
  }
};

// Create a new guardian
const createGuardian = async (req, res) => {
  try {
    const guardianData = req.body;
    
    // Validate required fields
    if (!guardianData.firstname || !guardianData.surname) {
      return res.status(400).json({ 
        success: false,
        message: 'Missing required fields: firstname, surname' 
      });
    }

    const newGuardian = await guardianModel.createGuardian(guardianData);

    res.status(201).json({ 
      success: true,
      message: 'Guardian created successfully', 
      data: newGuardian
    });
  } catch (error) {
    console.error('Error creating guardian:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to create guardian', 
      error: error.message 
    });
  }
};

// Update a guardian
const updateGuardian = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const updatedGuardian = await guardianModel.updateGuardian(id, updates);
    
    if (!updatedGuardian) {
      return res.status(404).json({ 
        success: false,
        message: 'Guardian not found' 
      });
    }
    
    res.json({ 
      success: true,
      message: 'Guardian updated successfully',
      data: updatedGuardian 
    });
  } catch (error) {
    console.error('Error updating guardian:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to update guardian', 
      error: error.message 
    });
  }
};

// Delete a guardian (soft delete)
const deleteGuardian = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id; // From auth middleware
    
    const result = await guardianModel.deleteGuardian(id, userId);
    
    if (!result) {
      return res.status(404).json({ 
        success: false,
        message: 'Guardian not found' 
      });
    }
    
    res.json({ 
      success: true,
      message: 'Guardian deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting guardian:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to delete guardian', 
      error: error.message 
    });
  }
};

module.exports = {
  getAllGuardians,
  getGuardianById,
  createGuardian,
  updateGuardian,
  deleteGuardian,
};