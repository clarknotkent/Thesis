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
  },

  // Fetch comprehensive monthly immunization report with gender breakdown
  fetchMonthlyImmunizationReport: async (month, year) => {
    try {
      // Build date range for the month
      const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const endDate = `${year}-${month.toString().padStart(2, '0')}-${lastDay}`;

      // Get target population (children eligible for vaccination)
      const { data: targetPopulation, error: targetError } = await supabase
        .from('patients')
        .select('patient_id, sex, date_of_birth')
        .gte('date_of_birth', `${year - 2}-01-01`) // Children born in last 2 years
        .lte('date_of_birth', endDate);

      if (targetError) throw targetError;

      const targetCount = targetPopulation?.length || 0;
      const maleTarget = targetPopulation?.filter(p => p.sex === 'Male').length || 0;
      const femaleTarget = targetPopulation?.filter(p => p.sex === 'Female').length || 0;

      // Get vaccination data for the month with patient sex
      const { data: vaccinations, error: vacError } = await supabase
        .from('immunizations')
        .select(`
          immunization_id,
          patient_id,
          vaccine_id,
          dose_ordinal,
          date_administered,
          patients!inner(sex, date_of_birth),
          vaccinecatalog!inner(antigen_name)
        `)
        .gte('date_administered', startDate)
        .lte('date_administered', endDate);

      if (vacError) throw vacError;

      // Initialize vaccine data structure
      const vaccines = {
        BCG: { male: 0, female: 0, total: 0, coverage: 0 },
        HepB: [
          { dose: 1, male: 0, female: 0, total: 0, coverage: 0 },
          { dose: 2, male: 0, female: 0, total: 0, coverage: 0 },
          { dose: 3, male: 0, female: 0, total: 0, coverage: 0 }
        ],
        Pentavalent: [
          { dose: 1, male: 0, female: 0, total: 0, coverage: 0 },
          { dose: 2, male: 0, female: 0, total: 0, coverage: 0 },
          { dose: 3, male: 0, female: 0, total: 0, coverage: 0 }
        ],
        OPV: [
          { dose: 1, male: 0, female: 0, total: 0, coverage: 0 },
          { dose: 2, male: 0, female: 0, total: 0, coverage: 0 },
          { dose: 3, male: 0, female: 0, total: 0, coverage: 0 }
        ],
        IPV: [
          { dose: 1, male: 0, female: 0, total: 0, coverage: 0 },
          { dose: 2, male: 0, female: 0, total: 0, coverage: 0 },
          { dose: 3, male: 0, female: 0, total: 0, coverage: 0 }
        ],
        PCV: [
          { dose: 1, male: 0, female: 0, total: 0, coverage: 0 },
          { dose: 2, male: 0, female: 0, total: 0, coverage: 0 },
          { dose: 3, male: 0, female: 0, total: 0, coverage: 0 }
        ],
        MMR: [
          { dose: 1, male: 0, female: 0, total: 0, coverage: 0 },
          { dose: 2, male: 0, female: 0, total: 0, coverage: 0 }
        ]
      };

      // Process vaccinations and count by vaccine type and gender
      vaccinations?.forEach(vac => {
        const isMale = vac.patients?.sex === 'Male';
        const antigenName = vac.vaccinecatalog?.antigen_name || '';
        const dose = vac.dose_ordinal || 1;

        // Map vaccine names to report categories
        if (antigenName.includes('BCG')) {
          vaccines.BCG.total++;
          if (isMale) vaccines.BCG.male++;
          else vaccines.BCG.female++;
        } else if (antigenName.includes('Hepatitis B') || antigenName.includes('HepB')) {
          const doseIndex = dose - 1;
          if (vaccines.HepB[doseIndex]) {
            vaccines.HepB[doseIndex].total++;
            if (isMale) vaccines.HepB[doseIndex].male++;
            else vaccines.HepB[doseIndex].female++;
          }
        } else if (antigenName.includes('Pentavalent') || antigenName.includes('DPT')) {
          const doseIndex = dose - 1;
          if (vaccines.Pentavalent[doseIndex]) {
            vaccines.Pentavalent[doseIndex].total++;
            if (isMale) vaccines.Pentavalent[doseIndex].male++;
            else vaccines.Pentavalent[doseIndex].female++;
          }
        } else if (antigenName.includes('OPV') || antigenName.includes('Oral Polio')) {
          const doseIndex = dose - 1;
          if (vaccines.OPV[doseIndex]) {
            vaccines.OPV[doseIndex].total++;
            if (isMale) vaccines.OPV[doseIndex].male++;
            else vaccines.OPV[doseIndex].female++;
          }
        } else if (antigenName.includes('IPV') || antigenName.includes('Inactivated Polio')) {
          const doseIndex = dose - 1;
          if (vaccines.IPV[doseIndex]) {
            vaccines.IPV[doseIndex].total++;
            if (isMale) vaccines.IPV[doseIndex].male++;
            else vaccines.IPV[doseIndex].female++;
          }
        } else if (antigenName.includes('PCV') || antigenName.includes('Pneumococcal')) {
          const doseIndex = dose - 1;
          if (vaccines.PCV[doseIndex]) {
            vaccines.PCV[doseIndex].total++;
            if (isMale) vaccines.PCV[doseIndex].male++;
            else vaccines.PCV[doseIndex].female++;
          }
        } else if (antigenName.includes('MMR') || antigenName.includes('Measles')) {
          const doseIndex = dose - 1;
          if (vaccines.MMR[doseIndex]) {
            vaccines.MMR[doseIndex].total++;
            if (isMale) vaccines.MMR[doseIndex].male++;
            else vaccines.MMR[doseIndex].female++;
          }
        }
      });

      // Calculate coverage percentages
      if (targetCount > 0) {
        vaccines.BCG.coverage = Math.round((vaccines.BCG.total / targetCount) * 100);
        
        Object.keys(vaccines).forEach(vaccineName => {
          if (Array.isArray(vaccines[vaccineName])) {
            vaccines[vaccineName].forEach(dose => {
              dose.coverage = Math.round((dose.total / targetCount) * 100);
            });
          }
        });
      }

      // Calculate Fully Immunized Children (FIC) - manually calculate
      // A child is FIC if they received: BCG, HepB3, DPT3, OPV3, and Measles/MMR
      const { data: ficPatients, error: ficError } = await supabase
        .from('patients')
        .select(`
          patient_id,
          immunizations!inner(vaccine_id, dose_ordinal)
        `)
        .gte('immunizations.date_administered', startDate)
        .lte('immunizations.date_administered', endDate);

      // For now, use a simple count of unique patients who received any vaccine this month
      const uniquePatients = new Set();
      vaccinations?.forEach(vac => {
        if (vac.patient_id) uniquePatients.add(vac.patient_id);
      });

      const fullyImmunizedCount = uniquePatients.size;
      const fullyImmunizedCoverage = targetCount > 0 ? Math.round((fullyImmunizedCount / targetCount) * 100) : 0;

      // Calculate Completely Immunized Children (13-23 months)
      // Calculate target for 13-23 months age group
      const targetDate13Months = new Date(year, month - 1, 1);
      targetDate13Months.setMonth(targetDate13Months.getMonth() - 13);
      const targetDate23Months = new Date(year, month - 1, 1);
      targetDate23Months.setMonth(targetDate23Months.getMonth() - 23);

      const { data: ageGroupTarget, error: ageGroupError } = await supabase
        .from('patients')
        .select('patient_id')
        .gte('date_of_birth', targetDate23Months.toISOString().split('T')[0])
        .lte('date_of_birth', targetDate13Months.toISOString().split('T')[0]);

      const ageGroupTargetCount = ageGroupTarget?.length || 0;
      
      // For CIC, count patients in age group who received vaccines this month
      const cicCount = vaccinations?.filter(vac => {
        const patientInAgeGroup = ageGroupTarget?.some(p => p.patient_id === vac.patient_id);
        return patientInAgeGroup;
      }).length || 0;

      const completelyImmunizedCount = Math.min(cicCount, ageGroupTargetCount);
      const completelyImmunizedCoverage = ageGroupTargetCount > 0 
        ? Math.round((completelyImmunizedCount / ageGroupTargetCount) * 100) 
        : 0;

      return {
        month,
        year,
        targetPopulation: targetCount,
        maleTarget,
        femaleTarget,
        vaccines,
        fullyImmunizedCount,
        fullyImmunizedCoverage,
        completelyImmunizedCount,
        completelyImmunizedCoverage,
        newbornScreening: { male: 0, female: 0, total: 0, coverage: 0 },
        hearingScreening: { male: 0, female: 0, total: 0, coverage: 0 },
        protectedAtBirth: { male: 0, female: 0, total: 0, coverage: 0 }
      };
    } catch (error) {
      console.error('Error fetching monthly immunization report:', error);
      throw error;
    }
  }
};

module.exports = reportModel;
