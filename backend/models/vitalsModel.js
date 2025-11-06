import serviceSupabase from '../db.js';

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

const updateVitalsignsByVisitId = async (visitId, vitalsData, client) => {
  const supabase = withClient(client);

  // Check if vitals exist for this visit
  const existing = await getVitalsignsByVisitId(visitId, supabase);

  const vitalsPayload = {
    temperature: vitalsData.temperature || null,
    muac: vitalsData.muac || null,
    respiration_rate: vitalsData.respiration || null,
    weight: vitalsData.weight || null,
    height_length: vitalsData.height || null,
    updated_at: new Date().toISOString()
  };

  if (existing) {
    // Update existing vitals
    const { data, error } = await supabase
      .from('vitalsigns')
      .update(vitalsPayload)
      .eq('visit_id', visitId)
      .select()
      .single();
    if (error) throw error;
    return data;
  } else {
    // Create new vitals for this visit
    const { data, error } = await supabase
      .from('vitalsigns')
      .insert({
        visit_id: visitId,
        ...vitalsPayload,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  }
};

export { getVitalsignsByVisitId, updateVitalsignsByVisitId };
