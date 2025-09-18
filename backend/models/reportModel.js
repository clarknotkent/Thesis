const supabase = require('../db');

const reportModel = {
  // Fetch monthly immunization statistics report
  fetchMonthlyReport: async (month, year) => {
    try {
      // Use the monthlyreports_view which exists in schema
      const monthKey = `${year}-${month.toString().padStart(2, '0')}`;
      const { data, error } = await supabase
        .from('monthlyreports_view')
        .select('*')
        .eq('report_month', monthKey);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching monthly report:', error);
      throw error;
    }
  },

  // Fetch annual immunization statistics report
  fetchAnnualReport: async (year) => {
    try {
      // Fallback: aggregate monthly reports for the year from monthlyreports_view
      const { data, error } = await supabase
        .from('monthlyreports_view')
        .select('*')
        .like('report_month', `${year}-%`);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching annual report:', error);
      throw error;
    }
  },

  // Fetch defaulters report (overdue immunizations)
  fetchDefaultersReport: async (filters = {}) => {
    try {
      // Use defaulters_view which exists in schema
      let query = supabase
        .from('defaulters_view')
        .select('*');

      // Apply filters if provided
      if (filters.barangay) {
        query = query.eq('barangay', filters.barangay);
      }

      const { data, error } = await query.order('days_overdue', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching defaulters report:', error);
      throw error;
    }
  },

  // Fetch due soon report (upcoming immunizations)
  fetchDueSoonReport: async (filters = {}) => {
    try {
      let query = supabase
        .from('duesoon_view')
        .select('*');

      if (filters.vaccine_id) {
        query = query.eq('vaccine_id', filters.vaccine_id);
      }
      if (filters.barangay) {
        query = query.eq('barangay', filters.barangay);
      }

      const { data, error } = await query.order('scheduled_date', { ascending: true });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching due soon report:', error);
      throw error;
    }
  },

  // Fetch inventory low stock report
  fetchInventoryLowStockReport: async (filters = {}) => {
    try {
      let query = supabase
        .from('inventorylowstock_view')
        .select('*');

      if (filters.vaccine_id) {
        query = query.eq('vaccine_id', filters.vaccine_id);
      }

      const { data, error } = await query.order('current_stock_level', { ascending: true });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching inventory low stock report:', error);
      throw error;
    }
  },

  // Fetch Target Client List (TCL) report
  fetchTCLReport: async (filters = {}) => {
    try {
      let query = supabase
        .from('tcl_view')
        .select('*');

      if (filters.barangay) {
        query = query.eq('barangay', filters.barangay);
      }
      if (filters.vaccine_id) {
        // tcl_view has immunization_status as json; client can filter further if needed
        query = query; 
      }

      const { data, error } = await query.order('date_of_birth', { ascending: false });
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching TCL report:', error);
      throw error;
    }
  },

  // Alias function for test compatibility
  getImmunizationReport: async (filters = {}) => {
    // Return monthly report for current month as default
    const now = new Date();
    const month = filters.month || now.getMonth() + 1;
    const year = filters.year || now.getFullYear();
    return reportModel.fetchMonthlyReport(month, year);
  }
};

module.exports = reportModel;
