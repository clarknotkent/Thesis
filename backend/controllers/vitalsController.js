const { getVitalsignsByVisitId, updateVitalsignsByVisitId } = require('../models/vitalsModel');
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

const updateVitalsByVisitId = async (req, res) => {
  try {
    const { visitId } = req.params;
    const vitalsData = req.body;
    const supabase = getSupabaseForRequest(req);
    
    const updatedVitals = await updateVitalsignsByVisitId(visitId, vitalsData, supabase);
    res.json({ data: updatedVitals });
  } catch (error) {
    console.error('Error updating vitals:', error);
    res.status(500).json({ message: 'Failed to update vitals' });
  }
};

module.exports = { getVitalsByVisitId, updateVitalsByVisitId };