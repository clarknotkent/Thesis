const { listConversations } = require('../models/conversationModel');

const getConversations = async (req, res) => {
  try {
    const { page = 1, limit = 20, user_id, patient_id } = req.query;
    const result = await listConversations({ user_id, patient_id }, parseInt(page), parseInt(limit));
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch conversations' });
  }
};

module.exports = { getConversations };
