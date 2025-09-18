const { listVisits, getVisitById } = require('../models/visitModel');

const getVisits = async (req, res) => {
  try {
    const { page = 1, limit = 20, patient_id, worker_id } = req.query;
    const result = await listVisits({ patient_id, worker_id }, parseInt(page), parseInt(limit));
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch visits' });
  }
};

const getVisit = async (req, res) => {
  try {
    const { id } = req.params;
    const visit = await getVisitById(id);
    if (!visit) return res.status(404).json({ message: 'Visit not found' });
    res.json(visit);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch visit' });
  }
};

module.exports = { getVisits, getVisit };
