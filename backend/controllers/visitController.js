const { listVisits, getVisitById, createVisit, ensureVisitForDate, updateVisitById, findExistingVisitForDay } = require('../models/visitModel');
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
    // Always stamp updated_by with the actor; created_by falls back to actor if missing
    if (payload.created_by === undefined || payload.created_by === null || payload.created_by === '') {
      payload.created_by = actorId;
    }
    payload.updated_by = actorId;
    // Also pass actor_id explicitly so model can fallback when recorded_by is null
    payload.actor_id = actorId;

    // Validate recorded_by: must be a numeric user_id if provided
    if (payload.recorded_by !== undefined && payload.recorded_by !== null && payload.recorded_by !== '') {
      const rb = String(payload.recorded_by).trim();
      if (!/^\d+$/.test(rb)) {
        return res.status(400).json({
          message: 'recorded_by must be a numeric user_id (not a name). Please reselect the staff from the list.',
          code: 'INVALID_RECORDED_BY',
        });
      }
    }

    const created = await createVisit(payload, supabase);
    res.status(201).json(created);
  } catch (error) {
    if (error && (error.code === 'VISIT_DUPLICATE_PER_DAY' || error.status === 409)) {
      return res.status(409).json({
        message: 'Visit already exists for this patient on this date. Please update the existing visit instead.',
        code: 'VISIT_DUPLICATE_PER_DAY',
        existing_visit_id: error.existingVisitId || null
      });
    }
    console.error('Error creating visit', error);
    res.status(500).json({ message: 'Failed to create visit' });
  }
};

const updateVisit = async (req, res) => {
  try {
    const { id } = req.params;
    const payload = req.body || {};
    // Debug payload types for troubleshooting bigint issues
    try {
      const dbg = { ...payload };
      for (const k of Object.keys(dbg)) {
        dbg[k] = typeof dbg[k];
      }
      console.debug('[updateVisit] payload field types:', dbg);
    } catch(_) {}
    
    // Always stamp updated_by as the acting user
    payload.updated_by = getActorId(req) || null;
    // Validate recorded_by: must be a numeric user_id if provided
    if (payload.recorded_by !== undefined && payload.recorded_by !== null && payload.recorded_by !== '') {
      const rb = String(payload.recorded_by).trim();
      if (!/^\d+$/.test(rb)) {
        return res.status(400).json({
          message: 'recorded_by must be a numeric user_id (not a name). Please reselect the staff from the list.',
          code: 'INVALID_RECORDED_BY',
        });
      }
    }
    
    const supabase = getSupabaseForRequest(req);
    const updated = await updateVisitById(id, payload, supabase);
    if (!updated) return res.status(404).json({ message: 'Visit not found' });
    res.json(updated);
  } catch (error) {
    console.error('Error updating visit', error);
    // Friendly handling for Postgres bigint parse errors
    if (error && error.code === '22P02') {
      return res.status(400).json({
        message: 'Invalid data for one or more ID fields (expected a numeric ID, got text). Please reselect the staff/patient and try again.',
        code: 'INVALID_NUMERIC_ID',
        error: error.message
      });
    }
    res.status(500).json({ message: 'Failed to update visit', error: error?.message || String(error) });
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
// Lightweight existence check (no writes) for UI pre-flight/toast
const existsVisit = async (req, res) => {
  try {
    const { patient_id, visit_date } = req.query || {};
    if (!patient_id) return res.status(400).json({ message: 'patient_id is required' });
    const supabase = getSupabaseForRequest(req);
    const existing = await findExistingVisitForDay(patient_id, visit_date, null, supabase);
    return res.json({ exists: !!existing, visit_id: existing?.visit_id || null });
  } catch (error) {
    console.error('Failed to check visit existence:', error);
    res.status(500).json({ message: 'Failed to check visit existence' });
  }
};

module.exports = { getVisits, getVisit, postVisit, updateVisit, ensureVisit, existsVisit };

