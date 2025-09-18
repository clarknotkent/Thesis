const { listActivityLogs } = require('../models/activityModel');

const getActivityLogs = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const result = await listActivityLogs(parseInt(page), parseInt(limit));
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch activity logs' });
  }
};

module.exports = { getActivityLogs };
