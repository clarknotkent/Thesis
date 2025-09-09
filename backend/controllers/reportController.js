const reportModel = require('../models/reportModel');

// Generate a report
const generateReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const report = await reportModel.generateReport(startDate, endDate);
    res.json(report);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to generate report' });
  }
};

module.exports = {
  generateReport,
};