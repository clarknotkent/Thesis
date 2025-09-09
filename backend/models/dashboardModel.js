const supabase = require('../db');

// Get summary statistics
const getSummaryStats = async () => {
  const { data, error } = await supabase.rpc('get_summary_stats');
  if (error) throw error;
  return data;
};

// Get recent activities
const getRecentActivities = async () => {
  const { data, error } = await supabase
    .from('activitylogs_view')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(10);

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

// Fetch dashboard statistics from the database
const getDashboardStats = async () => {
  try {
    // Fetch total patients
    const { data: patients, error: patientsError } = await supabase
      .from('patients')
      .select('*');
    if (patientsError) throw patientsError;

    // Fetch active health workers
    const { data: healthWorkers, error: healthWorkersError } = await supabase
      .from('health_workers')
      .select('*')
      .eq('status', 'active');
    if (healthWorkersError) throw healthWorkersError;

    // Fetch pending appointments
    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select('*')
      .eq('status', 'pending');
    if (appointmentsError) throw appointmentsError;

    // Fetch vaccine stock
    const { data: vaccines, error: vaccinesError } = await supabase
      .from('vaccine_inventory')
      .select('*');
    if (vaccinesError) throw vaccinesError;

    // Calculate statistics
    const totalPatients = patients.length;
    const activeHealthWorkers = healthWorkers.length;
    const pendingAppointments = appointments.length;
    const vaccineTypes = vaccines.length;
    const totalDoses = vaccines.reduce((sum, vaccine) => sum + vaccine.quantity, 0);
    const lowStockItems = vaccines.filter(vaccine => vaccine.quantity < 10).length;
    const expiringSoon = vaccines.filter(vaccine => {
      const expiryDate = new Date(vaccine.expiry_date);
      const today = new Date();
      return (expiryDate - today) / (1000 * 60 * 60 * 24) <= 30;
    }).length;

    return {
      totalPatients,
      activeHealthWorkers,
      pendingAppointments,
      vaccineTypes,
      totalDoses,
      lowStockItems,
      expiringSoon,
    };
  } catch (error) {
    console.error('Error fetching dashboard statistics:', error);
    throw error;
  }
};

module.exports = {
  getSummaryStats,
  getRecentActivities,
  getDefaulters,
  getDueSoon,
  getInventoryLowStock,
  getMonthlyReports,
  getDashboardStats,
};
