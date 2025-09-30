const supabase = require('../db');

const listActivityLogs = async (page = 1, limit = 20, filters = {}) => {
  const offset = (page - 1) * limit;
  let query = supabase
    .from('activitylogs_view')
    .select('*', { count: 'exact' });

  if (filters.user_id) query = query.eq('user_id', filters.user_id);
  if (filters.action_type) query = query.eq('action_type', filters.action_type);
  if (filters.entity_type) query = query.eq('entity_type', filters.entity_type);
  if (filters.entity_id) query = query.eq('entity_id', filters.entity_id);

  const { data, error, count } = await query
    .order('timestamp', { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) throw error;
  const enriched = (data || []).map(r => ({
    ...r,
    display_user_name: r.user_fullname || r.username || (r.user_id == null ? 'System' : String(r.user_id)),
    display_action: r.description || r.action_type
  }));
  return {
    items: enriched,
    totalCount: count || 0,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages: Math.ceil((count || 0) / limit)
  };
};

module.exports = { listActivityLogs };
