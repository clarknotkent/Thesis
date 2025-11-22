import supabase from '../db.js';

const listActivityLogs = async (page = 1, limit = 10, filters = {}) => {
  // Ensure reasonable limits to prevent memory issues
  const safeLimit = Math.min(Math.max(parseInt(limit) || 10, 1), 100);
  const safePage = Math.max(parseInt(page) || 1, 1);
  const offset = (safePage - 1) * safeLimit;

  // Query the view which now includes user_fullname and user_role from the LEFT JOIN
  let query = supabase
    .from('activitylogs_view')
    .select('*', { count: 'exact' });

  // Exclude SuperAdmin activities from logs (hide from everyone)
  query = query.not('user_role', 'eq', 'SuperAdmin');

  // Apply filters
  if (filters.user_id) query = query.eq('user_id', filters.user_id);

  // Action type filter normalization: accept friendly tokens and map to patterns/codes
  if (filters.action_type) {
    const at = String(filters.action_type).trim().toLowerCase();
    if (['create','update','delete','view','login','logout'].includes(at)) {
      switch (at) {
        case 'login':
          // Include success and failed logins
          query = query.or('action_type.eq.USER_LOGIN,action_type.eq.USER_LOGIN_FAILED');
          break;
        case 'logout':
          query = query.eq('action_type', 'USER_LOGOUT');
          break;
        case 'create':
          query = query.ilike('action_type', '%CREATE%');
          break;
        case 'update':
          query = query.ilike('action_type', '%UPDATE%');
          break;
        case 'delete':
          // Handle both hard and soft delete
          query = query.or('action_type.ilike.%DELETE%,action_type.eq.USER_SOFT_DELETE');
          break;
        case 'view':
          // Best effort: treat as read/view operations or description mentions
          query = query.or('action_type.ilike.%READ%,description.ilike.%view%');
          break;
      }
    } else {
      // Assume caller passed exact code like NOTIFICATION_CREATE
      query = query.eq('action_type', filters.action_type);
    }
  }
  if (filters.entity_type) query = query.eq('entity_type', filters.entity_type);
  if (filters.entity_id) query = query.eq('entity_id', filters.entity_id);

  // User role filter
  if (filters.user_role) {
    const roleRaw = String(filters.user_role).trim();
    const roleLc = roleRaw.toLowerCase();
    if (roleLc === 'system') {
      // Include rows where user_role is 'System' OR user_id is NULL (system-generated)
      query = query.or('user_role.eq.System,user_id.is.null');
    } else {
      // Normalize common variants to stored tokens
      const roleMap = (r) => {
        const s = String(r).trim().toLowerCase();
        if (['admin','administrator','system admin'].includes(s)) return ['Admin'];
        if (['health_staff','health staff','healthworker','health_worker','health-workers','health workers','healthstaff','hs'].includes(s)) return ['HealthStaff'];
        if (['parent','guardian','guardians'].includes(s)) return ['Guardian'];
        // Fallback: try raw and TitleCase
        const title = s.charAt(0).toUpperCase() + s.slice(1);
        return [roleRaw, title];
      };
      const variants = roleMap(roleRaw);
      query = query.in('user_role', variants);
    }
  }

  // Search filter (search in user name, action type, or description)
  if (filters.search) {
    query = query.or(`user_fullname.ilike.%${filters.search}%,action_type.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
  }

  // Date range filters
  // Precedence: if explicit from/to provided, honor them regardless of date_range
  const hasExplicitFrom = !!filters.from_date;
  const hasExplicitTo = !!filters.to_date;
  if (hasExplicitFrom || hasExplicitTo) {
    if (hasExplicitFrom) {
      const fromRaw = filters.from_date;
      if (typeof fromRaw === 'string') {
        // Use provided string as-is to avoid timezone shifts (DB may use timestamp without time zone)
        query = query.gte('timestamp', fromRaw);
      } else {
        query = query.gte('timestamp', new Date(fromRaw).toISOString());
      }
    }
    if (hasExplicitTo) {
      const toRaw = filters.to_date;
      if (typeof toRaw === 'string') {
        // If caller passed date-only (YYYY-MM-DD), ensure end-of-day inclusivity if not already time-specified
        const hasTime = /\d{2}:\d{2}/.test(toRaw);
        const value = hasTime ? toRaw : `${toRaw} 23:59:59`;
        query = query.lte('timestamp', value);
      } else {
        const toDate = new Date(toRaw);
        query = query.lte('timestamp', toDate.toISOString());
      }
    }
  } else if (filters.date_range) {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    switch (filters.date_range) {
      case 'today': {
        query = query.gte('timestamp', todayStart.toISOString())
          .lte('timestamp', todayEnd.toISOString());
        break;
      }
      case 'week': {
        // Start from Sunday of the current week
        const day = now.getDay(); // 0 = Sunday
        const diffToSunday = day; // days since Sunday
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - diffToSunday);
        weekStart.setHours(0, 0, 0, 0);
        // Inclusive up to end of today
        query = query.gte('timestamp', weekStart.toISOString())
          .lte('timestamp', todayEnd.toISOString());
        break;
      }
      case 'month': {
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        query = query.gte('timestamp', monthStart.toISOString())
          .lte('timestamp', todayEnd.toISOString());
        break;
      }
      case 'custom':
      case 'all':
      default:
        // 'all' or unknown -> no date constraints
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
    user_role: r.user_role || 'System',
    display_user_name: r.user_fullname || r.username || (r.user_id === null ? 'System' : `User ${r.user_id}`),
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

// Fetch single activity log by id from view
const getActivityLogByIdModel = async (id) => {
  const { data, error } = await supabase
    .from('activitylogs_view')
    .select('*')
    .eq('log_id', id)
    .limit(1)
    .maybeSingle();
  if (error) {
    console.error('Supabase getActivityLogById error:', error);
    throw error;
  }
  return data || null;
};

// Delete activity logs older than N days from base table
const clearOldLogsModel = async (days) => {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffIso = cutoff.toISOString();
  const { error, count } = await supabase
    .from('activitylogs')
    .delete({ count: 'exact' })
    .lt('timestamp', cutoffIso);
  if (error) {
    console.error('Supabase clearOldLogs error:', error);
    throw error;
  }
  return { count: count || 0 };
};

export {
  listActivityLogs,
  getActivityLogByIdModel,
  clearOldLogsModel
};
