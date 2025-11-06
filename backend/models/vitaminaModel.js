import serviceSupabase from '../db.js';

function withClient(client) {
  return client || serviceSupabase;
}

const createVitamina = async (data, client) => {
  const supabase = withClient(client);
  const payload = {
    ...data,
    created_by: data.created_by || data.administered_by || null,
    updated_by: data.updated_by || data.administered_by || null,
  };
  const { data: row, error } = await supabase
    .from('vitamina')
    .insert([payload])
    .select()
    .single();
  if (error) throw error;
  return row;
};

const getVitaminaById = async (id, client) => {
  const supabase = withClient(client);
  const { data, error } = await supabase
    .from('vitamina')
    .select('*')
    .eq('vitamina_id', id)
    .eq('is_deleted', false)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
};

const listVitamina = async (filters = {}, client) => {
  const supabase = withClient(client);
  let query = supabase.from('vitamina').select('*').eq('is_deleted', false);
  if (filters.patient_id) query = query.eq('patient_id', filters.patient_id);
  if (filters.visit_id) query = query.eq('visit_id', filters.visit_id);
  const { data, error } = await query;
  if (error) throw error;
  return data;
};

const updateVitamina = async (id, changes, client) => {
  const supabase = withClient(client);
  const payload = { ...changes, updated_at: new Date().toISOString() };
  const { data, error } = await supabase
    .from('vitamina')
    .update(payload)
    .eq('vitamina_id', id)
    .eq('is_deleted', false)
    .select()
    .single();
  if (error) throw error;
  return data;
};

const deleteVitamina = async (id, client) => {
  const supabase = withClient(client);
  const { data, error } = await supabase
    .from('vitamina')
    .update({ is_deleted: true, deleted_at: new Date().toISOString() })
    .eq('vitamina_id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export { createVitamina,
  getVitaminaById,
  listVitamina,
  updateVitamina,
  deleteVitamina };
