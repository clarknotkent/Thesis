import supabase from '../db.js';

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

    // Get recent vaccinations from enriched view (if available)
    let recentVaccinations = [];
    try {
      // include guardian id and outside flag if available in the view
      const { data: recentData, error: recentErr } = await supabase
        .from('immunizationhistory_view')
        .select('immunization_id, patient_full_name, patient_guardian_id, administered_by_name, vaccine_antigen_name, administered_date, immunization_is_deleted, immunization_outside')
        .order('administered_date', { ascending: false })
        .limit(10);

      if (!recentErr && Array.isArray(recentData)) {
        // collect guardian ids to fetch guardian names
        const guardianIds = Array.from(new Set(recentData.map(r => r.patient_guardian_id).filter(Boolean)));
        const guardianMap = {};
        if (guardianIds.length > 0) {
          const { data: guardiansData, error: gErr } = await supabase
            .from('guardians')
            .select('guardian_id, firstname, middlename, surname')
            .in('guardian_id', guardianIds);

          if (!gErr && Array.isArray(guardiansData)) {
            guardiansData.forEach(g => {
              const full = [g.surname, g.firstname, g.middlename].filter(Boolean).join(' ');
              guardianMap[g.guardian_id] = full || '';
            });
          }
        }

        recentVaccinations = recentData.map((r) => ({
          id: r.immunization_id,
          patientName: r.patient_full_name || 'Unknown',
          parentName: r.patient_guardian_id ? (guardianMap[r.patient_guardian_id] || '') : '',
          vaccineName: r.vaccine_antigen_name || 'Unknown',
          healthWorker: r.administered_by_name || null,
          dateAdministered: r.administered_date || r.administered_date || null,
          status: r.immunization_is_deleted ? 'deleted' : 'completed',
          outside: !!r.immunization_outside
        }));
      }
    } catch (e) {
      console.warn('Recent vaccinations not available:', e.message || e);
    }

    // Calculate inventory statistics
    const inventoryCount = inventoryStats?.length || 0;
    const lowStockCount = inventoryStats?.filter(item => item.current_stock_level <= 10).length || 0;
    const expiringSoonCount = inventoryStats?.filter(item => {
      const daysToExpiry = Math.ceil((new Date(item.expiration_date) - new Date()) / (1000 * 60 * 60 * 24));
      return daysToExpiry <= 30;
    }).length || 0;

    // Get vaccine types count from vaccinemaster for accurate count
    const { data: vaccineTypes, error: _vaccineTypeError } = await supabase
      .from('vaccinemaster')
      .select('vaccine_id')
      .eq('is_deleted', false);

    const totalVaccineTypes = vaccineTypes?.length || 0;
    const totalAvailableDoses = inventoryStats?.reduce((sum, item) => sum + (item.current_stock_level || 0), 0) || 0;

    // Format recent vaccinations data for frontend using fetched recentVaccinations
    const formattedVaccinations = (recentVaccinations || []).map((vacc, index) => ({
      id: vacc.id || index,
      patientName: vacc.patientName || `Patient ${index + 1}`,
      parentName: vacc.parentName || '',
      vaccineName: vacc.vaccineName || 'Vaccination Record',
      healthWorker: vacc.healthWorker || null,
      dateAdministered: vacc.dateAdministered || null,
      status: vacc.status || 'completed',
      outside: !!vacc.outside
    }));

    // Build chart data: Show ALL 7 vaccines' usage across ALL records (zero if none)
    // Strategy:
    // 1) Determine the 7 vaccines to display from vaccinemaster
    //    - Prefer is_nip=true first, then fill with other category 'VACCINE' until reaching 7
    // 2) Count immunizations grouped by antigen name (no date filter)
    // 3) Return data in the baseline order with zeros for missing
    let chartData = [];
    try {
      // 1) Fetch baseline 7 vaccines from vaccinemaster
      let baselineVaccines = [];
      try {
        // Fetch NIP vaccines first
        const { data: nip, error: nipErr } = await supabase
          .from('vaccinemaster')
          .select('vaccine_id, antigen_name, is_nip, category')
          .eq('is_deleted', false)
          .eq('is_nip', true)
          .eq('category', 'VACCINE')
          .order('antigen_name', { ascending: true });
        if (nipErr) throw nipErr;
        baselineVaccines = Array.isArray(nip) ? nip.slice(0, 7) : [];

        // If fewer than 7, fill with other vaccines
        if (baselineVaccines.length < 7) {
          const need = 7 - baselineVaccines.length;
          const excludeIds = baselineVaccines.map(v => v.vaccine_id);
          let fillerQuery = supabase
            .from('vaccinemaster')
            .select('vaccine_id, antigen_name, is_nip, category')
            .eq('is_deleted', false)
            .eq('category', 'VACCINE')
            .order('antigen_name', { ascending: true });
          if (excludeIds.length > 0) fillerQuery = fillerQuery.not('vaccine_id', 'in', `(${excludeIds.join(',')})`);
          const { data: others, error: othersErr } = await fillerQuery.limit(need);
          if (othersErr) throw othersErr;
          baselineVaccines = baselineVaccines.concat(others || []);
        }
      } catch (baseErr) {
        console.warn('Failed to build baseline vaccines list:', baseErr.message || baseErr);
      }

      // As a final guard, limit to 7 if more (or keep as-is if fewer)
      baselineVaccines = (baselineVaccines || []).slice(0, 7);
      const baselineNames = baselineVaccines.map(v => (v.antigen_name || '').trim()).filter(Boolean);
      const idToName = new Map(baselineVaccines.map(v => [v.vaccine_id, (v.antigen_name || '').trim()]));

      // 2) Count immunizations for current month grouped by antigen name (preferred via view)
      let countsByName = new Map();
      try {
        const { data: vaccAll, error: vaccErr } = await supabase
          .from('immunizationhistory_view')
          .select('vaccine_antigen_name');
        if (vaccErr) throw vaccErr;
        (vaccAll || []).forEach((rec) => {
          const name = (rec.vaccine_antigen_name || '').trim();
          if (!name) return;
          countsByName.set(name, (countsByName.get(name) || 0) + 1);
        });
      } catch (viewErr) {
        // Fallback: count by vaccine_id from base table then map to names using baseline set
        console.warn('immunizationhistory_view unavailable, falling back to immunizations:', viewErr.message || viewErr);
        try {
          const { data: imm, error: immErr } = await supabase
            .from('immunizations')
            .select('vaccine_id');
          if (immErr) throw immErr;
          const countsById = new Map();
          (imm || []).forEach((r) => {
            const id = r.vaccine_id;
            if (!idToName.has(id)) return; // only count those in baseline 7
            countsById.set(id, (countsById.get(id) || 0) + 1);
          });
          // Convert to name-based counts
          countsByName = new Map(Array.from(countsById.entries()).map(([id, cnt]) => [idToName.get(id), cnt]));
        } catch (immFallbackErr) {
          console.warn('Fallback immunizations count failed:', immFallbackErr.message || immFallbackErr);
        }
      }

      // 3) Build chart in baseline order, include zeros for missing
      chartData = (baselineNames.length > 0
        ? baselineNames
        : Array.from(countsByName.keys()).slice(0, 7) // if no baseline, use observed up to 7
      ).map(name => ({ label: name, value: countsByName.get(name) || 0 }));

      // If after all this we still have no data, return empty to let UI handle
    } catch (e) {
      console.warn('Failed to build monthly vaccine usage chartData:', e.message || e);
      chartData = [];
    }

    // Return enhanced dashboard data with frontend-compatible field names
    // Compute vaccinationsToday by counting immunizations with today's administered_date
    let vaccinationsTodayCount = 0;
    try {
      const todayStr = new Date().toISOString().slice(0, 10);
      const { data: todayData, error: todayErr } = await supabase
        .from('immunizations')
        .select('immunization_id', { count: 'exact' })
        .eq('administered_date', todayStr);

      if (!todayErr) vaccinationsTodayCount = Array.isArray(todayData) ? todayData.length : 0;
    } catch (e) {
      console.warn('Error counting vaccinations today:', e.message || e);
    }

    return {
      stats: {
        vaccinationsToday: vaccinationsTodayCount || 0,
        totalPatients: dashboardData.total_patients || 0,
        activeHealthWorkers: (dashboardData.total_healthstaff || 0) + (dashboardData.total_nurses || 0) + (dashboardData.total_nutritionists || 0),
        pendingAppointments: dashboardData.total_due_soon || 0,
        totalVaccineTypes: totalVaccineTypes,
        totalInventoryItems: inventoryCount,
        totalAvailableDoses: totalAvailableDoses,
        lowStockItems: lowStockCount,
        expiringSoon: expiringSoonCount,
        totalDefaulters: dashboardData.total_defaulters || 0,
        totalGuardians: dashboardData.total_guardians || 0
      },
      inventoryItems: displayItems || [],
      recentVaccinations: formattedVaccinations,
      chartData: chartData
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

// Alias function for test compatibility
const getDashboardStats = async () => {
  return await fetchDashboardMetrics();
};

export {
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
  getDashboardStats
};
