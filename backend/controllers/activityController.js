const { listActivityLogs } = require('../models/activityModel');

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

module.exports = { getActivityLogs };
