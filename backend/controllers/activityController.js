import { listActivityLogs, getActivityLogByIdModel, clearOldLogsModel } from '../models/activityModel.js';

const getActivityLogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      user_id,
      action_type,
      entity_type,
      entity_id,
      search,
      date_range,
      user_role,
      from_date,
      to_date
    } = req.query;

    const filters = {};
    if (user_id) filters.user_id = parseInt(user_id);
    if (action_type) filters.action_type = action_type;
    if (entity_type) filters.entity_type = entity_type;
    if (entity_id) filters.entity_id = parseInt(entity_id);
    if (search) filters.search = search;
    if (date_range) filters.date_range = date_range;
    if (user_role) filters.user_role = user_role;
    if (from_date) filters.from_date = from_date;
    if (to_date) filters.to_date = to_date;

    const result = await listActivityLogs(parseInt(page), parseInt(limit), filters);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activity logs',
      error: error.message
    });
  }
};

// Get single activity log by ID
const getActivityLogById = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (!id || Number.isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid log id' });
    }
    const log = await getActivityLogByIdModel(id);
    if (!log) return res.status(404).json({ success: false, message: 'Log not found' });
    // Enrich to match listActivityLogs shape so frontend can rely on the same fields
    const enriched = {
      ...log,
      user_role: log.user_role || 'System',
      display_user_name: log.user_fullname || log.username || (log.user_id === null ? 'System' : `User ${log.user_id}`),
      display_action: log.description || log.action_type,
      full_description: log.description || log.full_description,
    };
    res.json({ success: true, data: enriched });
  } catch (error) {
    console.error('Error fetching activity log by id:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch activity log', error: error.message });
  }
};

// Export activity logs as CSV
const exportActivityLogs = async (req, res) => {
  try {
    // Reuse same filters as list, but increase limit for export
    const {
      page = 1,
      limit = 1000,
      user_id,
      action_type,
      entity_type,
      entity_id,
      search,
      date_range,
      user_role,
      from_date,
      to_date
    } = req.query;

    const filters = {};
    if (user_id) filters.user_id = parseInt(user_id);
    if (action_type) filters.action_type = action_type;
    if (entity_type) filters.entity_type = entity_type;
    if (entity_id) filters.entity_id = parseInt(entity_id);
    if (search) filters.search = search;
    if (date_range) filters.date_range = date_range;
    if (user_role) filters.user_role = user_role;
    if (from_date) filters.from_date = from_date;
    if (to_date) filters.to_date = to_date;

    const result = await listActivityLogs(parseInt(page), Math.min(parseInt(limit) || 1000, 10000), filters);
    const items = result.items || [];

    // Build CSV
    const headers = ['log_id','timestamp','user_fullname','user_role','action_type','entity_type','entity_id','description','ip_address'];
    const escape = (v) => {
      if (v === null || v === undefined) return '';
      const s = String(v).replace(/\"/g, '""');
      // Wrap in quotes if value contains comma, quote, or newline
      return (s.includes(',') || s.includes('"') || s.includes('\n')) ? `"${s}"` : s;
    };
    const rows = [headers.join(',')];
    for (const r of items) {
      rows.push([
        r.log_id ?? r.id ?? '',
        r.timestamp ?? '',
        r.user_fullname ?? r.display_user_name ?? '',
        r.user_role ?? '',
        r.action_type ?? '',
        r.entity_type ?? '',
        r.entity_id ?? '',
        r.description ?? r.full_description ?? '',
        r.ip_address ?? ''
      ].map(escape).join(','));
    }
    const csv = rows.join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="activity-logs.csv"');
    return res.status(200).send(csv);
  } catch (error) {
    console.error('Error exporting activity logs:', error);
    res.status(500).json({ success: false, message: 'Failed to export activity logs', error: error.message });
  }
};

// Clear old logs by age in days
const clearOldActivityLogs = async (req, res) => {
  try {
    const days = parseInt(req.params.days);
    if (!days || Number.isNaN(days) || days < 1) {
      return res.status(400).json({ success: false, message: 'Invalid days parameter' });
    }
    const { count } = await clearOldLogsModel(days);
    res.json({ success: true, message: `Cleared ${count} old logs` });
  } catch (error) {
    console.error('Error clearing old activity logs:', error);
    res.status(500).json({ success: false, message: 'Failed to clear old logs', error: error.message });
  }
};

export { getActivityLogs,
  getActivityLogById,
  exportActivityLogs,
  clearOldActivityLogs };
