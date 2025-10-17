const supabase = require('../db');

const listActivityLogs = async (page = 1, limit = 10, filters = {}) => {
  // Ensure reasonable limits to prevent memory issues
  const safeLimit = Math.min(Math.max(parseInt(limit) || 10, 1), 100);
  const safePage = Math.max(parseInt(page) || 1, 1);
  const offset = (safePage - 1) * safeLimit;
  
  // Query the view which now includes user_fullname and user_role from the LEFT JOIN
  let query = supabase
    .from('activitylogs_view')
    .select('*', { count: 'exact' });

  // Apply filters
  if (filters.user_id) query = query.eq('user_id', filters.user_id);
  if (filters.action_type) query = query.eq('action_type', filters.action_type);
  if (filters.entity_type) query = query.eq('entity_type', filters.entity_type);
  if (filters.entity_id) query = query.eq('entity_id', filters.entity_id);
  
  // User role filter
  if (filters.user_role) {
    query = query.eq('user_role', filters.user_role);
  }
  
  // Search filter (search in user name, action type, or description)
  if (filters.search) {
    query = query.or(`user_fullname.ilike.%${filters.search}%,action_type.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
  }
  
  // Date range filters
  if (filters.date_range) {
    const now = new Date();
    let startDate;
    
    switch (filters.date_range) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        query = query.gte('timestamp', startDate.toISOString());
        break;
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        query = query.gte('timestamp', startDate.toISOString());
        break;
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        query = query.gte('timestamp', startDate.toISOString());
        break;
      case 'custom':
        if (filters.from_date) {
          query = query.gte('timestamp', new Date(filters.from_date).toISOString());
        }
        if (filters.to_date) {
          const endDate = new Date(filters.to_date);
          endDate.setHours(23, 59, 59, 999);
          query = query.lte('timestamp', endDate.toISOString());
        }
        break;
    }
  }

  const { data, error, count } = await query
    .order('timestamp', { ascending: false })
    .range(offset, offset + safeLimit - 1);
    
  if (error) {
    console.error('Supabase query error:', error);
    throw error;
  }
  
  const enriched = (data || []).map(r => ({
    ...r,
    user_role: r.user_role || 'unknown',
    display_user_name: r.user_fullname || r.username || (r.user_id == null ? 'System' : `User ${r.user_id}`),
    display_action: r.description || r.action_type,
    full_description: r.description
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
