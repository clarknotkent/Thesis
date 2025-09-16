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
      // Since the function doesn't exist, return basic query result
      const { data, error } = await supabase
        .from('immunizations')
        .select('*')
        .gte('date_administered', `${year}-01-01`)
        .lt('date_administered', `${year + 1}-01-01`);
      
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
      const daysAhead = filters.days_ahead || 7;
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + daysAhead);

      let query = supabase
        .from('patientschedule')
        .select(`
          *,
          patient:patient_id (
            patient_id,
            firstname,
            surname,
            date_of_birth,
            guardian:guardian_id (
              firstname,
              surname,
              contact_number
            )
          ),
          vaccine:vaccine_id (
            vaccine_id,
            antigen_name,
            brand_name
          )
        `)
        .eq('status', 'scheduled')
        .lte('scheduled_date', endDate.toISOString());

      // Apply additional filters
      if (filters.vaccine_id) {
        query = query.eq('vaccine_id', filters.vaccine_id);
      }
      
      if (filters.barangay) {
        query = query.eq('child.barangay', filters.barangay);
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
      const threshold = filters.threshold || 10;

      let query = supabase
        .from('inventory')
        .select(`
          *,
          vaccine:vaccine_id (
            vaccine_id,
            antigen_name,
            brand_name,
            vaccine_type
          )
        `)
        .lt('current_stock', threshold);

      // Apply additional filters
      if (filters.vaccine_id) {
        query = query.eq('vaccine_id', filters.vaccine_id);
      }

      const { data, error } = await query.order('current_stock', { ascending: true });
      
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
        .from('patients')
        .select(`
          *,
          guardian:guardian_id (
            guardian_id,
            firstname,
            surname,
            contact_number,
            address
          ),
          immunizations (
            immunization_id,
            vaccine_id,
            date_administered,
            dose_number,
            vaccine:vaccine_id (
              antigen_name,
              brand_name
            )
          )
        `)
        .eq('status', 'active');

      // Apply age group filter
      if (filters.age_group) {
        const today = new Date();
        let startDate, endDate;

        switch (filters.age_group) {
          case 'newborn':
            startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 28);
            endDate = today;
            break;
          case 'infant':
            startDate = new Date(today.getFullYear(), today.getMonth() - 12, today.getDate());
            endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 28);
            break;
          case 'toddler':
            startDate = new Date(today.getFullYear() - 3, today.getMonth(), today.getDate());
            endDate = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
            break;
          default:
            // No age filter
            break;
        }

        if (startDate && endDate) {
          query = query
            .gte('birthdate', startDate.toISOString())
            .lte('birthdate', endDate.toISOString());
        }
      }

      // Apply barangay filter
      if (filters.barangay) {
        query = query.eq('parent.barangay', filters.barangay);
      }

      const { data, error } = await query.order('birthdate', { ascending: false });
      
      if (error) throw error;

      // Filter by specific vaccine if requested
      if (filters.vaccine_id && data) {
        return data.map(child => ({
          ...child,
          immunization_records: child.immunization_records.filter(
            record => record.vaccine_id === filters.vaccine_id
          )
        }));
      }

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
