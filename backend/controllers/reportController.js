const reportModel = require('../models/reportModel');

// Get monthly report
const getMonthlyReport = async (req, res) => {
  try {
    const { month, year } = req.query;
    if (!month || !year) {
      return res.status(400).json({ 
        success: false, 
        message: 'Month and year parameters are required' 
      });
    }
    
    const report = await reportModel.fetchMonthlyReport(month, year);
    res.json({ success: true, data: report });
  } catch (error) {
    console.error('Error generating monthly report:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to generate monthly report', 
      error: error.message 
    });
  }
};

// Get annual report
const getAnnualReport = async (req, res) => {
  try {
    const { year } = req.query;
    if (!year) {
      return res.status(400).json({ 
        success: false, 
        message: 'Year parameter is required' 
      });
    }
    
    const report = await reportModel.fetchAnnualReport(year);
    res.json({ success: true, data: report });
  } catch (error) {
    console.error('Error generating annual report:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to generate annual report', 
      error: error.message 
    });
  }
};

// Get defaulters report
const getDefaultersReport = async (req, res) => {
  try {
    const filters = {
      days_overdue: req.query.days_overdue,
      vaccine_id: req.query.vaccine_id,
      barangay: req.query.barangay
    };
    
    const report = await reportModel.fetchDefaultersReport(filters);
    res.json({ success: true, data: report });
  } catch (error) {
    console.error('Error generating defaulters report:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to generate defaulters report', 
      error: error.message 
    });
  }
};

// Get due soon report
const getDueSoonReport = async (req, res) => {
  try {
    const { days_ahead = 7 } = req.query;
    const filters = {
      days_ahead: parseInt(days_ahead),
      vaccine_id: req.query.vaccine_id,
      barangay: req.query.barangay
    };
    
    const report = await reportModel.fetchDueSoonReport(filters);
    res.json({ success: true, data: report });
  } catch (error) {
    console.error('Error generating due soon report:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to generate due soon report', 
      error: error.message 
    });
  }
};

// Get inventory low stock report
const getInventoryLowStockReport = async (req, res) => {
  try {
    const { threshold = 10 } = req.query;
    const filters = {
      threshold: parseInt(threshold),
      vaccine_id: req.query.vaccine_id
    };
    
    const report = await reportModel.fetchInventoryLowStockReport(filters);
    res.json({ success: true, data: report });
  } catch (error) {
    console.error('Error generating low stock report:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to generate low stock report', 
      error: error.message 
    });
  }
};

// Get TCL (Target Client List) report
const getTCLReport = async (req, res) => {
  try {
    const filters = {
      age_group: req.query.age_group,
      barangay: req.query.barangay,
      vaccine_id: req.query.vaccine_id
    };
    
    const report = await reportModel.fetchTCLReport(filters);
    res.json({ success: true, data: report });
  } catch (error) {
    console.error('Error generating TCL report:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to generate TCL report', 
      error: error.message 
    });
  }
};

// Get Monthly Immunization Report (Comprehensive)
const getMonthlyImmunizationReport = async (req, res) => {
  try {
    const { month, year } = req.query;
    if (!month || !year) {
      return res.status(400).json({ 
        success: false, 
        message: 'Month and year parameters are required' 
      });
    }
    // Optional filters
    const outside = typeof req.query.outside !== 'undefined' ? String(req.query.outside).toLowerCase() : undefined;
    const includeDeleted = String(req.query.include_deleted || 'false').toLowerCase() === 'true';

    const report = await reportModel.fetchMonthlyImmunizationReport(
      parseInt(month),
      parseInt(year),
      {
        // When outside is 'true' or 'false', enforce filter; otherwise include both
        outside: outside === 'true' ? true : outside === 'false' ? false : undefined,
        includeDeleted
      }
    );
    res.json({ success: true, data: report });
  } catch (error) {
    console.error('Error generating monthly immunization report:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to generate monthly immunization report', 
      error: error.message 
    });
  }
};

module.exports = {
  getMonthlyReport,
  getAnnualReport,
  getDefaultersReport,
  getDueSoonReport,
  getInventoryLowStockReport,
  getTCLReport,
  getMonthlyImmunizationReport,
};