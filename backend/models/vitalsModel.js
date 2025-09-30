const serviceSupabase = require('../db');

function withClient(client) {
  return client || serviceSupabase;
}

const getVitalsignsByVisitId = async (visitId, client) => {
  const supabase = withClient(client);
  const { data, error } = await supabase
    .from('vitalsigns')
    .select('*')
    .eq('visit_id', visitId)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  if (!data) return null;
  
  // Map database fields to frontend expected fields
  return {
    temperature: data.temperature,
    muac: data.muac,
    respiration: data.respiration_rate,
    weight: data.weight,
    height: data.height_length
  };
};

module.exports = { getVitalsignsByVisitId };