const supabase = require('../db');

const listActivityLogs = async (page = 1, limit = 20) => {
  const offset = (page - 1) * limit;
  const { data, error, count } = await supabase
    .from('activitylogs_view')
    .select('*', { count: 'exact' })
    .order('timestamp', { ascending: false })
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

module.exports = { listActivityLogs };
