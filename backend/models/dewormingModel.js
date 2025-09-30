const serviceSupabase = require('../db');

function withClient(client) {
  return client || serviceSupabase;
}

const createDeworming = async (data, client) => {
  const supabase = withClient(client);
  const payload = {
    ...data,
    created_by: data.created_by || data.administered_by || null,
    updated_by: data.updated_by || data.administered_by || null,
  };
  const { data: row, error } = await supabase
    .from('deworming')
    .insert([payload])
    .select()
    .single();
  if (error) throw error;
  return row;
};

const getDewormingById = async (id, client) => {
  const supabase = withClient(client);
  const { data, error } = await supabase
    .from('deworming')
    .select('*')
    .eq('deworming_id', id)
    .eq('is_deleted', false)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
};

const listDeworming = async (filters = {}, client) => {
  const supabase = withClient(client);
  let query = supabase.from('deworming').select('*').eq('is_deleted', false);
  if (filters.patient_id) query = query.eq('patient_id', filters.patient_id);
  if (filters.visit_id) query = query.eq('visit_id', filters.visit_id);
  const { data, error } = await query;
  if (error) throw error;
  return data;
};

const updateDeworming = async (id, changes, client) => {
  const supabase = withClient(client);
  const payload = { ...changes, updated_at: new Date().toISOString() };
  const { data, error } = await supabase
    .from('deworming')
    .update(payload)
    .eq('deworming_id', id)
    .eq('is_deleted', false)
    .select()
    .single();
  if (error) throw error;
  return data;
};

const deleteDeworming = async (id, client) => {
  const supabase = withClient(client);
  const { data, error } = await supabase
    .from('deworming')
    .update({ is_deleted: true, deleted_at: new Date().toISOString() })
    .eq('deworming_id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

module.exports = {
  createDeworming,
  getDewormingById,
  listDeworming,
  updateDeworming,
  deleteDeworming,
};
