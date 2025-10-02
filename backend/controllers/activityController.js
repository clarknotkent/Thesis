const { listActivityLogs } = require('../models/activityModel');

const getActivityLogs = async (req, res) => {
  try {
  const { page = 1, limit = 10, user_id, action_type, entity_type, entity_id } = req.query;
  const filters = { };
  if (user_id) filters.user_id = parseInt(user_id);
  if (action_type) filters.action_type = action_type;
  if (entity_type) filters.entity_type = entity_type;
  if (entity_id) filters.entity_id = parseInt(entity_id);
  const result = await listActivityLogs(parseInt(page), parseInt(limit), filters);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch activity logs' });
  }
};

module.exports = { getActivityLogs };
