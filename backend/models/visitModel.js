const supabase = require('../db');

const listVisits = async (filters = {}, page = 1, limit = 20) => {
  let query = supabase.from('visits_view').select('*', { count: 'exact' });

  if (filters.patient_id) query = query.eq('patient_id', filters.patient_id);
  if (filters.worker_id) query = query.eq('health_worker_id', filters.worker_id);

  const offset = (page - 1) * limit;
  const { data, error, count } = await query
    .order('visit_date', { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) throw error;
  return {
    items: data || [],
    totalCount: count || 0,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages: Math.ceil((count || 0) / limit)
  };
};

const getVisitById = async (id) => {
  const { data, error } = await supabase
    .from('visits_view')
    .select('*')
    .eq('visit_id', id)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data || null;
};

module.exports = { listVisits, getVisitById };
