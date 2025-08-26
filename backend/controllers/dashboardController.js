const { dashboardStats, recentVaccinations, patientDetails, vaccineStock } = require('../models/mockData');

// GET /api/dashboard/stats - Get dashboard statistics
const getDashboardStats = (req, res) => {
  try {
    // Calculate real-time statistics
    const stats = {
      ...dashboardStats,
      // Update with current data
      totalPatients: patientDetails.length,
      vaccineTypes: vaccineStock.length,
      totalDoses: vaccineStock.reduce((sum, vaccine) => sum + vaccine.quantity, 0),
      lowStockItems: vaccineStock.filter(vaccine => {
        if (vaccine.quantity === 0) return false;
        return vaccine.quantity <= 50;
      }).length,
      outOfStock: vaccineStock.filter(vaccine => vaccine.quantity === 0).length,
      expiringSoon: vaccineStock.filter(vaccine => {
        const currentDate = new Date();
        const expiryDate = new Date(vaccine.expiryDate);
        const daysDifference = Math.ceil((expiryDate - currentDate) / (1000 * 60 * 60 * 24));
        return daysDifference <= 30 && daysDifference > 0;
      }).length
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard statistics',
      error: error.message
    });
  }
};

// GET /api/dashboard/recent-vaccinations - Get recent vaccinations
const getRecentVaccinations = (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    // Sort by date and limit results
    const sortedVaccinations = recentVaccinations
      .sort((a, b) => new Date(b.dateAdministered) - new Date(a.dateAdministered))
      .slice(0, parseInt(limit));

    res.json({
      success: true,
      data: sortedVaccinations,
      count: sortedVaccinations.length
    });
  } catch (error) {
    console.error('Error fetching recent vaccinations:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching recent vaccinations',
      error: error.message
    });
  }
};

// GET /api/dashboard/vaccine-chart-data - Get vaccine chart data
const getVaccineChartData = (req, res) => {
  try {
    // Generate chart data based on vaccine stock and recent vaccinations
    const chartData = [
      { label: 'BCG', value: 35, color: '#0d6efd' },
      { label: 'Hepatitis B', value: 28, color: '#198754' },
      { label: 'Pentavalent', value: 42, color: '#0dcaf0' },
      { label: 'OPV', value: 38, color: '#ffc107' },
      { label: 'PCV', value: 24, color: '#dc3545' },
      { label: 'MMR', value: 18, color: '#6f42c1' },
      { label: 'Others', value: 15, color: '#fd7e14' }
    ];

    res.json({
      success: true,
      data: chartData
    });
  } catch (error) {
    console.error('Error fetching vaccine chart data:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching vaccine chart data',
      error: error.message
    });
  }
};

// GET /api/dashboard/overview - Get complete dashboard overview
const getDashboardOverview = (req, res) => {
  try {
    const stats = {
      ...dashboardStats,
      totalPatients: patientDetails.length,
      vaccineTypes: vaccineStock.length,
      totalDoses: vaccineStock.reduce((sum, vaccine) => sum + vaccine.quantity, 0)
    };

    const recentVaccs = recentVaccinations
      .sort((a, b) => new Date(b.dateAdministered) - new Date(a.dateAdministered))
      .slice(0, 5);

    const chartData = [
      { label: 'BCG', value: 35 },
      { label: 'Hepatitis B', value: 28 },
      { label: 'Pentavalent', value: 42 },
      { label: 'OPV', value: 38 }
    ];

    res.json({
      success: true,
      data: {
        stats,
        recentVaccinations: recentVaccs,
        chartData
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard overview:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard overview',
      error: error.message
    });
  }
};

module.exports = {
  getDashboardStats,
  getRecentVaccinations,
  getVaccineChartData,
  getDashboardOverview
};
