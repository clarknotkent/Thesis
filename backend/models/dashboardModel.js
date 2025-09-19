const supabase = require('../db');

// Fetch dashboard metrics from dashboard_view with inventory data
const fetchDashboardMetrics = async () => {
  try {
    // Get basic dashboard stats
    const { data: dashboardData, error: dashboardError } = await supabase
      .from('dashboard_view')
      .select('*')
      .single();
    
    if (dashboardError) throw dashboardError;
    
    // Get inventory statistics
    const { data: inventoryStats, error: inventoryError } = await supabase
      .from('inventory')
      .select('inventory_id, current_stock_level, expiration_date')
      .eq('is_deleted', false);
      
    if (inventoryError) console.warn('Inventory stats error:', inventoryError);
    
    // Get recent inventory items with vaccine details
    const { data: inventoryItems, error: inventoryItemsError } = await supabase
      .from('inventory')
      .select(`
        *,
        vaccinemaster!inventory_vaccine_id_fkey (
          vaccine_id,
          antigen_name,
          brand_name,
          manufacturer,
          vaccine_type
        )
      `)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(5);
      
    if (inventoryItemsError) console.warn('Inventory items error:', inventoryItemsError);
    
    // If no inventory items, get available vaccines instead
    let displayItems = inventoryItems || [];
    if (!inventoryItems || inventoryItems.length === 0) {
      const { data: availableVaccines, error: vaccinesError } = await supabase
        .from('vaccinemaster')
        .select('*')
        .eq('is_deleted', false)
        .limit(5);
        
      if (!vaccinesError && availableVaccines) {
        // Transform vaccine data to match inventory structure for display
        displayItems = availableVaccines.map(vaccine => ({
          inventory_id: `vaccine_${vaccine.vaccine_id}`,
          vaccine_id: vaccine.vaccine_id,
          current_stock_level: 0, // No inventory yet
          expiration_date: null,
          lot_number: 'Not in inventory',
          storage_location: 'N/A',
          vaccinemaster: vaccine
        }));
      }
    }
    
    // Get recent vaccinations (simplified - handle table if it exists)
    let recentVaccinations = [];
    try {
      const { data, error } = await supabase
        .from('immunizations')
        .select('*')
        .order('date_administered', { ascending: false })
        .limit(5);
        
      if (!error) {
        recentVaccinations = data || [];
      }
    } catch (e) {
      console.warn('Recent vaccinations not available:', e.message);
    }
    
    // Calculate inventory statistics
    const inventoryCount = inventoryStats?.length || 0;
    const lowStockCount = inventoryStats?.filter(item => item.current_stock_level <= 10).length || 0;
    const expiringSoonCount = inventoryStats?.filter(item => {
      const daysToExpiry = Math.ceil((new Date(item.expiration_date) - new Date()) / (1000 * 60 * 60 * 24));
      return daysToExpiry <= 30;
    }).length || 0;
    
    // Get vaccine types count from vaccinemaster for accurate count
    const { data: vaccineTypes, error: vaccineTypeError } = await supabase
      .from('vaccinemaster')
      .select('vaccine_id')
      .eq('is_deleted', false);
    
    const totalVaccineTypes = vaccineTypes?.length || 0;
    const totalAvailableDoses = inventoryStats?.reduce((sum, item) => sum + (item.current_stock_level || 0), 0) || 0;
    
    // Format recent vaccinations data (simplified format)
    const formattedVaccinations = recentVaccinations?.map((vacc, index) => ({
      id: vacc.immunization_id || index,
      patientName: 'Patient ' + (index + 1),
      parentName: 'Guardian',
      vaccineName: 'Vaccination Record',
      healthWorker: 'Health Worker',
      dateAdministered: vacc.date_administered || new Date().toISOString(),
      status: vacc.status || 'completed'
    })) || [];
    
    // Return enhanced dashboard data
    return {
      stats: {
        ...dashboardData,
        totalVaccineTypes: totalVaccineTypes,
        totalInventoryItems: inventoryCount,
        totalAvailableDoses: totalAvailableDoses,
        lowStockItems: lowStockCount,
        expiringSoon: expiringSoonCount
      },
      inventoryItems: displayItems || [],
      recentVaccinations: formattedVaccinations,
      chartData: [] // Placeholder for chart data
    };
  } catch (error) {
    console.error('Error in fetchDashboardMetrics:', error);
    throw error;
  }
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
