const { getVitalsignsByVisitId } = require('../models/vitalsModel');
const { getSupabaseForRequest } = require('../utils/supabaseClient');

const getVitalsByVisitId = async (req, res) => {
  try {
    const { visitId } = req.params;
    const supabase = getSupabaseForRequest(req);
    const vitals = await getVitalsignsByVisitId(visitId, supabase);
    if (!vitals) return res.status(404).json({ message: 'Vitals not found for this visit' });
    res.json({ data: vitals });
  } catch (error) {
    console.error('Error fetching vitals:', error);
    res.status(500).json({ message: 'Failed to fetch vitals' });
  }
};

module.exports = { getVitalsByVisitId };