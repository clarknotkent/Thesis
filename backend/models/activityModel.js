const supabase = require('../db');

const listActivityLogs = async (page = 1, limit = 10, filters = {}) => {
  // Ensure reasonable limits to prevent memory issues
  const safeLimit = Math.min(Math.max(parseInt(limit) || 10, 1), 100);
  const safePage = Math.max(parseInt(page) || 1, 1);
  const offset = (safePage - 1) * safeLimit;
  
  let query = supabase
    .from('activitylogs_view')
    .select('*', { count: 'exact' });

  if (filters.user_id) query = query.eq('user_id', filters.user_id);
  if (filters.action_type) query = query.eq('action_type', filters.action_type);
  if (filters.entity_type) query = query.eq('entity_type', filters.entity_type);
  if (filters.entity_id) query = query.eq('entity_id', filters.entity_id);

  const { data, error, count } = await query
    .order('timestamp', { ascending: false })
    .range(offset, offset + safeLimit - 1);
  if (error) throw error;
  const enriched = (data || []).map(r => ({
    ...r,
    display_user_name: r.user_fullname || r.username || (r.user_id == null ? 'System' : String(r.user_id)),
    display_action: r.description || r.action_type
  }));
  return {
    items: enriched,
    totalCount: count || 0,
    page: safePage,
    limit: safeLimit,
    totalPages: Math.ceil((count || 0) / safeLimit)
  };
};

module.exports = { listActivityLogs };
