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

      const { data, error } = await query.order('patient_lastname', { ascending: true });
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

      // Fetch vaccinations from the denormalized view which uses administered_date and dose_number
      const { data: vaccinations, error: vacError } = await supabase
        .from('immunizationhistory_view')
        .select('immunization_id, patient_id, vaccine_id, dose_number, administered_date, patient_sex, patient_date_of_birth, vaccine_antigen_name')
        .gte('administered_date', startDate)
        .lte('administered_date', endDate);

      if (vacError) throw vacError;

      // Initialize vaccine data structure
      const vaccines = {
        BCG: { male: 0, female: 0, total: 0, coverage: 0 },
        HepB: [ { dose: 1, male: 0, female: 0, total: 0, coverage: 0 }, { dose: 2, male: 0, female: 0, total: 0, coverage: 0 }, { dose: 3, male: 0, female: 0, total: 0, coverage: 0 } ],
        Pentavalent: [ { dose: 1, male: 0, female: 0, total: 0, coverage: 0 }, { dose: 2, male: 0, female: 0, total: 0, coverage: 0 }, { dose: 3, male: 0, female: 0, total: 0, coverage: 0 } ],
        OPV: [ { dose: 1, male: 0, female: 0, total: 0, coverage: 0 }, { dose: 2, male: 0, female: 0, total: 0, coverage: 0 }, { dose: 3, male: 0, female: 0, total: 0, coverage: 0 } ],
        IPV: [ { dose: 1, male: 0, female: 0, total: 0, coverage: 0 }, { dose: 2, male: 0, female: 0, total: 0, coverage: 0 }, { dose: 3, male: 0, female: 0, total: 0, coverage: 0 } ],
        PCV: [ { dose: 1, male: 0, female: 0, total: 0, coverage: 0 }, { dose: 2, male: 0, female: 0, total: 0, coverage: 0 }, { dose: 3, male: 0, female: 0, total: 0, coverage: 0 } ],
        MMR: [ { dose: 1, male: 0, female: 0, total: 0, coverage: 0 }, { dose: 2, male: 0, female: 0, total: 0, coverage: 0 } ]
      };

      // Hidden / timing-specific counters
      let bcgWithin24 = 0;
      let bcgAfter24 = 0;
      let hepb1Within24 = 0;
      let hepb1After24 = 0;
      let ipv2CatchUp = 0;

      const hoursBetween = (d1, d2) => {
        try { return Math.abs(new Date(d1).getTime() - new Date(d2).getTime()) / (1000 * 60 * 60); }
        catch (e) { return Infinity; }
      };
      const daysBetween = (d1, d2) => Math.floor(hoursBetween(d1, d2) / 24);

      // Process vaccinations
      (vaccinations || []).forEach(vac => {
        const isMale = (vac.patient_sex === 'Male');
        const antigenName = vac.vaccine_antigen_name || '';
        const dose = vac.dose_number || vac.dose_ordinal || vac.dose || 1;

        if (antigenName.includes('BCG')) {
          vaccines.BCG.total++;
          if (isMale) vaccines.BCG.male++; else vaccines.BCG.female++;
          if (vac.patient_date_of_birth && vac.administered_date) {
            const hrs = hoursBetween(vac.administered_date, vac.patient_date_of_birth);
            if (hrs <= 24) bcgWithin24++; else bcgAfter24++;
          }
        } else if (antigenName.includes('Hepatitis B') || antigenName.includes('HepB')) {
          const idx = Math.max(0, dose - 1);
          if (vaccines.HepB[idx]) {
            vaccines.HepB[idx].total++;
            if (isMale) vaccines.HepB[idx].male++; else vaccines.HepB[idx].female++;
          }
          if (dose === 1 && vac.patient_date_of_birth && vac.administered_date) {
            const hrs = hoursBetween(vac.administered_date, vac.patient_date_of_birth);
            if (hrs <= 24) hepb1Within24++; else hepb1After24++;
          }
        } else if (antigenName.includes('Pentavalent') || antigenName.includes('DPT')) {
          const idx = Math.max(0, dose - 1);
          if (vaccines.Pentavalent[idx]) {
            vaccines.Pentavalent[idx].total++;
            if (isMale) vaccines.Pentavalent[idx].male++; else vaccines.Pentavalent[idx].female++;
          }
        } else if (antigenName.includes('OPV') || antigenName.includes('Oral Polio')) {
          const idx = Math.max(0, dose - 1);
          if (vaccines.OPV[idx]) {
            vaccines.OPV[idx].total++;
            if (isMale) vaccines.OPV[idx].male++; else vaccines.OPV[idx].female++;
          }
        } else if (antigenName.includes('IPV') || antigenName.includes('Inactivated Polio')) {
          const idx = Math.max(0, dose - 1);
          if (vaccines.IPV[idx]) {
            vaccines.IPV[idx].total++;
            if (isMale) vaccines.IPV[idx].male++; else vaccines.IPV[idx].female++;
          }
          if (dose === 2 && vac.patient_date_of_birth && vac.administered_date) {
            const days = daysBetween(vac.administered_date, vac.patient_date_of_birth);
            if (days > 60) ipv2CatchUp++;
          }
        } else if (antigenName.includes('PCV') || antigenName.includes('Pneumococcal')) {
          const idx = Math.max(0, dose - 1);
          if (vaccines.PCV[idx]) {
            vaccines.PCV[idx].total++;
            if (isMale) vaccines.PCV[idx].male++; else vaccines.PCV[idx].female++;
          }
        } else if (antigenName.includes('MMR') || antigenName.includes('Measles')) {
          const idx = Math.max(0, dose - 1);
          if (vaccines.MMR[idx]) {
            vaccines.MMR[idx].total++;
            if (isMale) vaccines.MMR[idx].male++; else vaccines.MMR[idx].female++;
          }
        }
      });

      // Coverage
      if (targetCount > 0) {
        vaccines.BCG.coverage = Math.round((vaccines.BCG.total / targetCount) * 100);
        Object.keys(vaccines).forEach(vn => {
          if (Array.isArray(vaccines[vn])) vaccines[vn].forEach(d => { d.coverage = Math.round((d.total / targetCount) * 100); });
        });
      }

      const bcgWithin24Obj = { male: 0, female: 0, total: bcgWithin24, coverage: targetCount > 0 ? Math.round((bcgWithin24 / targetCount) * 100) : 0 };
      const bcgAfter24Obj = { male: 0, female: 0, total: bcgAfter24, coverage: targetCount > 0 ? Math.round((bcgAfter24 / targetCount) * 100) : 0 };
      const hepb1Within24Obj = { male: 0, female: 0, total: hepb1Within24, coverage: targetCount > 0 ? Math.round((hepb1Within24 / targetCount) * 100) : 0 };
      const hepb1After24Obj = { male: 0, female: 0, total: hepb1After24, coverage: targetCount > 0 ? Math.round((hepb1After24 / targetCount) * 100) : 0 };
      const ipv2CatchUpObj = { male: 0, female: 0, total: ipv2CatchUp, coverage: targetCount > 0 ? Math.round((ipv2CatchUp / targetCount) * 100) : 0 };

      // Fully Immunized Children (FIC) and Completely Immunized Children (CIC)
      // Definition: patients who were tagged as 'FIC' or 'CIC' during the month.
      // We check patients.tags ILIKE '%FIC%' or '%CIC%' and where created_at or updated_at falls within the month.
      const fullStart = `${startDate}T00:00:00`;
      const fullEnd = `${endDate}T23:59:59`;

      // Build OR condition for created_at/updated_at falling within range.
      const dateOrCond = `and(updated_at.gte.${fullStart},updated_at.lte.${fullEnd}),and(created_at.gte.${fullStart},created_at.lte.${fullEnd})`;

      // Fetch FIC patients who were tagged/created as FIC in the range
      let fullyImmunizedMale = 0;
      let fullyImmunizedFemale = 0;
      let fullyImmunizedCount = 0;
      try {
        const { data: ficPatients, error: ficError } = await supabase
          .from('patients')
          .select('patient_id, sex')
          .ilike('tags', '%FIC%')
          .or(`(${dateOrCond})`);
        if (ficError) throw ficError;
        fullyImmunizedCount = ficPatients?.length || 0;
        fullyImmunizedMale = (ficPatients || []).filter(p => p.sex === 'Male').length;
        fullyImmunizedFemale = (ficPatients || []).filter(p => p.sex === 'Female').length;
      } catch (e) {
        console.warn('Error fetching FIC patients for month:', e?.message || e);
      }

      // Fetch CIC patients flagged during the month (for completeness)
      let completelyImmunizedMale = 0;
      let completelyImmunizedFemale = 0;
      let completelyImmunizedCount = 0;
      try {
        const { data: cicPatients, error: cicError } = await supabase
          .from('patients')
          .select('patient_id, sex')
          .ilike('tags', '%CIC%')
          .or(`(${dateOrCond})`);
        if (cicError) throw cicError;
        completelyImmunizedCount = cicPatients?.length || 0;
        completelyImmunizedMale = (cicPatients || []).filter(p => p.sex === 'Male').length;
        completelyImmunizedFemale = (cicPatients || []).filter(p => p.sex === 'Female').length;
      } catch (e) {
        console.warn('Error fetching CIC patients for month:', e?.message || e);
      }

      // Coverage for FIC/CIC against target populations
      const fullyImmunizedCoverage = targetCount > 0 ? Math.round((fullyImmunizedCount / targetCount) * 100) : 0;
      const completelyImmunizedCoverage = targetCount > 0 ? Math.round((completelyImmunizedCount / targetCount) * 100) : 0;

      // Note: CIC counts are taken from patients tagged as 'CIC' during the month (see above).

      return {
        month,
        year,
        targetPopulation: targetCount,
        maleTarget,
        femaleTarget,
        vaccines,
  fullyImmunizedMale,
  fullyImmunizedFemale,
  fullyImmunizedCount,
  fullyImmunizedCoverage,
        completelyImmunizedCount,
        completelyImmunizedCoverage,
        newbornScreening: { male: 0, female: 0, total: 0, coverage: 0 },
        hearingScreening: { male: 0, female: 0, total: 0, coverage: 0 },
        protectedAtBirth: { male: 0, female: 0, total: 0, coverage: 0 },
        bcgWithin24: bcgWithin24Obj,
        bcgAfter24: bcgAfter24Obj,
        hepb1Within24: hepb1Within24Obj,
        hepb1After24: hepb1After24Obj,
        ipv2CatchUp: ipv2CatchUpObj
      };
    } catch (error) {
      console.error('Error fetching monthly immunization report:', error);
      throw error;
    }
  },
};

module.exports = reportModel;
