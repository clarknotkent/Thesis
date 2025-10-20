const { listVisits, getVisitById, createVisit, ensureVisitForDate, updateVisitById } = require('../models/visitModel');
const { getSupabaseForRequest } = require('../utils/supabaseClient');
const { logActivity } = require('../models/activityLogger');
const { ACTIVITY } = require('../constants/activityTypes');
const { getActorId } = require('../utils/actor');

const getVisits = async (req, res) => {
  try {
    const { page = 1, limit = 20, patient_id, worker_id } = req.query;
    const supabase = getSupabaseForRequest(req);
    const result = await listVisits({ patient_id, worker_id }, parseInt(page), parseInt(limit), supabase);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch visits' });
  }
};

const getVisit = async (req, res) => {
  try {
    const { id } = req.params;
    const payload = req.body || {};
    const actorId = getActorId(req) || null;
    const supabase = getSupabaseForRequest(req);

    // Ensure created_by and updated_by have an entry even if recorded_by is null
    // Do NOT override recorded_by here; it may intentionally be null.
    if (payload.created_by === undefined || payload.created_by === null || payload.created_by === '') {
      payload.created_by = actorId;
    }
    if (payload.updated_by === undefined || payload.updated_by === null || payload.updated_by === '') {
      payload.updated_by = actorId;
    }
    const visit = await getVisitById(id, supabase);
    if (!visit) return res.status(404).json({ message: 'Visit not found' });
    res.json(visit);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch visit' });
  }
};

const postVisit = async (req, res) => {
  try {
    // Expect body to contain visit data and nested vitals
    const payload = req.body || {};
    const supabase = getSupabaseForRequest(req);
    const actorId = getActorId(req) || null;
    // Ensure created_by and updated_by have values; do not override recorded_by
    if (payload.created_by === undefined || payload.created_by === null || payload.created_by === '') {
      payload.created_by = actorId;
    }
    if (payload.updated_by === undefined || payload.updated_by === null || payload.updated_by === '') {
      payload.updated_by = actorId;
    }
    // Also pass actor_id explicitly so model can fallback when recorded_by is null
    payload.actor_id = actorId;

    const created = await createVisit(payload, supabase);
    res.status(201).json(created);
  } catch (error) {
    console.error('Error creating visit', error);
    res.status(500).json({ message: 'Failed to create visit' });
  }
};

const updateVisit = async (req, res) => {
  try {
    const { id } = req.params;
    const payload = req.body || {};
    
    // Set updated_by to current user if not provided or empty
    if (!payload.updated_by || payload.updated_by === '') {
      payload.updated_by = getActorId(req);
    }
    
    const supabase = getSupabaseForRequest(req);
    const updated = await updateVisitById(id, payload, supabase);
    if (!updated) return res.status(404).json({ message: 'Visit not found' });
    res.json(updated);
  } catch (error) {
    console.error('Error updating visit', error);
    res.status(500).json({ message: 'Failed to update visit' });
  }
};

// Ensure/existing visit for date
const ensureVisit = async (req, res) => {
  try {
    const { patient_id, visit_date } = req.body || {};
    if (!patient_id) return res.status(400).json({ message: 'patient_id is required' });
    const supabase = getSupabaseForRequest(req);
    const actorId = req.user?.user_id || null;
    const row = await ensureVisitForDate(patient_id, visit_date, actorId, supabase);
    try {
      await logActivity({
        action_type: ACTIVITY.SCHEDULE.UPDATE,
        description: `Ensured visit for patient ${patient_id} on ${visit_date || 'today'}`,
        user_id: actorId,
        entity_type: 'visit',
        entity_id: row.visit_id || null,
        new_value: row,
      });
    } catch(_) {}
    res.json(row);
  } catch (error) {
    console.error('Failed to ensure visit:', error);
    res.status(500).json({ message: 'Failed to ensure visit', error: error.message });
  }
};

module.exports = { getVisits, getVisit, postVisit, updateVisit, ensureVisit };

