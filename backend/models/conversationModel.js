const supabase = require('../db');

const listConversations = async (filters = {}, page = 1, limit = 20) => {
  let query = supabase.from('conversations_view').select('*', { count: 'exact' });
  if (filters.user_id) query = query.eq('user_id', filters.user_id);
  if (filters.patient_id) query = query.eq('patient_id', filters.patient_id);

  const offset = (page - 1) * limit;
  const { data, error, count } = await query
    .order('last_message_at', { ascending: false })
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

module.exports = { listConversations };
