const { createFAQ, listFAQs, updateFAQ, deleteFAQ } = require('../models/faqModel');
const { ACTIVITY } = require('../constants/activityTypes');
const { logActivity } = require('../models/activityLogger');

const create = async (req, res) => {
  try {
    const user_id = req.user && (req.user.user_id || req.user.id);
    const { question, answer, tags = [] } = req.body;
    if (!question || !answer) return res.status(400).json({ message: 'question and answer are required' });
    const payload = { question, answer, tags: JSON.stringify(tags), created_by: user_id, created_at: new Date().toISOString() };
    const faq = await createFAQ(payload);
    try { await logActivity({ action_type: ACTIVITY.TASK.SUCCESS, user_id, entity_type: 'faq', entity_id: faq.faq_id, new_value: faq }); } catch (_) {}
    res.status(201).json({ faq });
  } catch (error) {
    console.error('[FAQ create]', error);
    res.status(500).json({ message: 'Failed to create FAQ' });
  }
};

const list = async (req, res) => {
  try {
    const items = await listFAQs();
    res.json({ items });
  } catch (error) {
    console.error('[FAQ list]', error);
    res.status(500).json({ message: 'Failed to list FAQs' });
  }
};

const update = async (req, res) => {
  try {
    const user_id = req.user && (req.user.user_id || req.user.id);
    const { faq_id } = req.params;
    const payload = req.body;
    const updated = await updateFAQ(faq_id, payload);
    try { await logActivity({ action_type: ACTIVITY.TASK.SUCCESS, user_id, entity_type: 'faq', entity_id: updated.faq_id, new_value: updated }); } catch (_) {}
    res.json({ faq: updated });
  } catch (error) {
    console.error('[FAQ update]', error);
    res.status(500).json({ message: 'Failed to update FAQ' });
  }
};

const remove = async (req, res) => {
  try {
    const { faq_id } = req.params;
    const deleted = await deleteFAQ(faq_id);
    res.json({ faq: deleted });
  } catch (error) {
    console.error('[FAQ delete]', error);
    res.status(500).json({ message: 'Failed to delete FAQ' });
  }
};

module.exports = { create, list, update, remove };
