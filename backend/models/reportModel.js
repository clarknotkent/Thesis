const supabase = require('../db');

// Get monthly report
const getMonthlyReport = async (month) => {
  const { data, error } = await supabase
    .from('monthlyreports_view')
    .select('*')
    .eq('report_month', month);

  if (error) throw error;
  return data;
};

// Get patient report
const getPatientReport = async (patientId) => {
  const { data, error } = await supabase
    .from('patients_view')
    .select('*')
    .eq('patient_id', patientId)
    .single();

  if (error) throw error;
  return data;
};

// Get inventory report
const getInventoryReport = async () => {
  const { data, error } = await supabase
    .from('inventorylowstock_view')
    .select('*');

  if (error) throw error;
  return data;
};

module.exports = {
  getMonthlyReport,
  getPatientReport,
  getInventoryReport,
};
