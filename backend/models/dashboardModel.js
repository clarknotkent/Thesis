const supabase = require('../db');

// Fetch dashboard metrics from dashboard_view
const fetchDashboardMetrics = async () => {
  const { data, error } = await supabase
    .from('dashboard_view')
    .select('*')
    .single();
  if (error) throw error;
  return data;
};

// Get summary statistics (alias for fetchDashboardMetrics)
const getSummaryStats = async () => {
  return await fetchDashboardMetrics();
};

// Fetch worker progress from worker_progress_view
const fetchWorkerProgress = async () => {
  const { data, error } = await supabase
    .from('worker_progress_view')
    .select('*');
  if (error) throw error;
  return data;
};

// Get worker progress (alias for fetchWorkerProgress)
const getWorkerProgress = async () => {
  return await fetchWorkerProgress();
};

// Fetch vaccine report from vaccine_report_view
const fetchVaccineReport = async () => {
  const { data, error } = await supabase
    .from('vaccine_report_view')
    .select('*');
  if (error) throw error;
  return data;
};

// Get vaccine report (alias for fetchVaccineReport)
const getVaccineReport = async () => {
  return await fetchVaccineReport();
};

// Get recent activities
const getRecentActivities = async (limit = 10) => {
  const { data, error } = await supabase
    .from('activitylogs_view')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
};

// Get defaulters
const getDefaulters = async () => {
  const { data, error } = await supabase
    .from('defaulters_view')
    .select('*');
  if (error) throw error;
  return data;
};

// Get patients due soon
const getDueSoon = async () => {
  const { data, error } = await supabase
    .from('duesoon_view')
    .select('*');
  if (error) throw error;
  return data;
};

// Get inventory low stock
const getInventoryLowStock = async () => {
  const { data, error } = await supabase
    .from('inventorylowstock_view')
    .select('*');
  if (error) throw error;
  return data;
};

// Get monthly reports
const getMonthlyReports = async (month) => {
  const { data, error } = await supabase
    .from('monthlyreports_view')
    .select('*')
    .eq('report_month', month);
  if (error) throw error;
  return data;
};

module.exports = {
  fetchDashboardMetrics,
  getSummaryStats,
  fetchWorkerProgress,
  getWorkerProgress,
  fetchVaccineReport,
  getVaccineReport,
  getRecentActivities,
  getDefaulters,
  getDueSoon,
  getInventoryLowStock,
  getMonthlyReports,
  
  // Alias function for test compatibility
  getDashboardStats: async () => {
    return await fetchDashboardMetrics();
  }
};
