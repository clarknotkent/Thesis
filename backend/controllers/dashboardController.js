const dashboardModel = require('../models/dashboardModel');

// GET /api/dashboard/stats - Get dashboard statistics
const getDashboardStats = async (req, res) => {
  try {
    const stats = await dashboardModel.getStats();
    res.json(stats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch dashboard statistics' });
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
const getDashboardOverview = async (req, res) => {
  try {
    // Fetch dashboard statistics from the model
    const dashboardStats = await dashboardModel.getDashboardStats();

    // Fetch recent vaccinations (mocked for now, replace with actual query if needed)
    const recentVaccs = recentVaccinations
      .sort((a, b) => new Date(b.dateAdministered) - new Date(a.dateAdministered))
      .slice(0, 5);

    const stats = {
      ...dashboardStats,
      recentVaccinations: recentVaccs,
    };

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error fetching dashboard overview:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard overview',
      error: error.message,
    });
  }
};

module.exports = {
  getDashboardStats,
  getRecentVaccinations,
  getVaccineChartData,
  getDashboardOverview
};
