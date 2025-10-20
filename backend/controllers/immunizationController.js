const immunizationModel = require('../models/immunizationModel');
const notificationModel = require('../models/notificationModel');
const { getSupabaseForRequest } = require('../utils/supabaseClient');
const { logActivity } = require('../models/activityLogger');
const { ACTIVITY } = require('../constants/activityTypes');
const { getActorId } = require('../utils/actor');
const { debugReschedule } = require('../utils/scheduleDebugger');

async function resolveVaccineId(supabase, { inventory_id, vaccine_id }) {
  if (vaccine_id) return vaccine_id;
  if (inventory_id) {
    const { data, error } = await supabase.from('inventory').select('vaccine_id').eq('inventory_id', inventory_id).single();
    if (error || !data) throw new Error('Unable to resolve vaccine_id from inventory_id');
    return data.vaccine_id;
  }
  throw new Error('vaccine_id or inventory_id is required to resolve vaccine');
}

async function resolvePatientIdFromVisit(supabase, visit_id) {
  const { data, error } = await supabase.from('visits').select('patient_id').eq('visit_id', visit_id).single();
  if (error || !data) throw new Error('Unable to resolve patient_id from visit');
  return data.patient_id;
}

async function findTodayVisitWithVitals(supabase, patient_id) {
  // Use DB to check today based on server timezone; simplest approach: visits today with existing vitalsigns
  const { data, error } = await supabase
    .from('visits')
    .select('visit_id')
    .eq('patient_id', patient_id)
    .gte('visit_date', new Date(new Date().setHours(0,0,0,0)).toISOString())
    .lte('visit_date', new Date(new Date().setHours(23,59,59,999)).toISOString())
    .order('visit_date', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  // Confirm vitalsigns exist for this visit
  const { data: vit, error: vitErr } = await supabase.from('vitalsigns').select('vital_id').eq('visit_id', data.visit_id).eq('is_deleted', false).limit(1).maybeSingle();
  if (vitErr) throw vitErr;
  return vit ? data.visit_id : null;
}

// List all immunizations
const listImmunizations = async (req, res) => {
  try {
    const supabase = getSupabaseForRequest(req);
    // Read filters from query params (patient_id, vaccine_id, administered_by)
  const { patient_id, vaccine_id, administered_by, limit, sort } = req.query || {};
    const filters = {};
    // Coerce numeric-like values to numbers when possible
    if (patient_id !== undefined && patient_id !== '') {
      const v = Number(patient_id);
      filters.patient_id = Number.isNaN(v) ? patient_id : v;
    }
    if (vaccine_id !== undefined && vaccine_id !== '') {
      const v = Number(vaccine_id);
      filters.vaccine_id = Number.isNaN(v) ? vaccine_id : v;
    }
    if (administered_by !== undefined && administered_by !== '') {
      const v = Number(administered_by);
      filters.administered_by = Number.isNaN(v) ? administered_by : v;
    }
  if (limit !== undefined && limit !== '') filters.limit = limit;
  if (sort !== undefined && sort !== '') filters.sort = sort;
  const immunizations = await immunizationModel.listImmunizations(filters, supabase);
    res.json(immunizations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch immunizations' });
  }
};

// Get immunization record by ID
const getImmunizationRecord = async (req, res) => {
  try {
    const supabase = getSupabaseForRequest(req);
    const immunization = await immunizationModel.getImmunizationById(req.params.id, supabase);
    if (!immunization) {
      return res.status(404).json({ message: 'Immunization not found' });
    }
    res.json(immunization);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch immunization details' });
  }
};

// Create immunization record
const createImmunizationRecord = async (req, res) => {
  try {
    const supabase = getSupabaseForRequest(req);
    const actorId = getActorId(req);
    const payload = { ...req.body };
    
    // Sanitize bigint fields: convert empty strings to null
    const bigintFields = ['administered_by', 'created_by', 'updated_by', 'vital_id', 'visit_id'];
    for (const field of bigintFields) {
      if (payload[field] === '') {
        payload[field] = null;
      }
    }
    
    const outside = !!payload.outside;
    // Always stamp audit fields from actor if present
    if (actorId) {
      if (!payload.created_by) payload.created_by = actorId;
      if (!payload.updated_by) payload.updated_by = actorId;
    }

    // Determine linkage: outside vs in-facility
  if (outside) {
  // Outside flow: require patient_id, vaccine info; forbid inventory_id; vitals optional
      if (!payload.patient_id) return res.status(400).json({ success:false, message:'patient_id is required for outside immunization' });
      if (payload.inventory_id) return res.status(400).json({ success:false, message:'inventory_id is not allowed for outside immunization' });
      const vaccineId = await resolveVaccineId(supabase, { inventory_id: null, vaccine_id: payload.vaccine_id });
      if (!payload.dose_number || !payload.administered_date) return res.status(400).json({ success:false, message:'dose_number and administered_date are required for outside immunization' });

      // If no administered_by, suggest remark to capture provider name
      if (!payload.administered_by && !payload.remarks) {
        payload.remarks = 'Outside immunization: please record the administering provider\'s name.';
      }
      // Insert immunization with outside=true and patient_id
  // IMPORTANT: For outside immunization, administered_by may be null as per policy.
  // Do not overwrite administered_by automatically here.
  const insertData = { ...payload, outside: true, vaccine_id: vaccineId };
      const imm = await immunizationModel.createImmunization(insertData, supabase);

      // If vitals provided, create vitalsigns row and update immunization.vital_id
      if (payload.vitals) {
        const { data: vit, error: vitErr } = await supabase
          .from('vitalsigns')
          .insert({
            temperature: payload.vitals.temperature || null,
            muac: payload.vitals.muac || null,
            respiration_rate: payload.vitals.respiration || null,
            weight: payload.vitals.weight || null,
            height_length: payload.vitals.height || null,
            recorded_by: actorId || null,
            created_by: actorId || null,
            updated_by: actorId || null,
          })
          .select('vital_id')
          .single();
        if (vitErr) throw vitErr;
        await immunizationModel.updateImmunization(imm.immunization_id, { vital_id: vit.vital_id }, supabase);
      }

  await logActivity({ action_type: ACTIVITY.IMMUNIZATION.OUTSIDE_CREATE, description: `Outside immunization for patient ${imm.patient_id}`, user_id: actorId, entity_type: 'immunization', entity_id: imm.immunization_id, new_value: { vaccine_id: vaccineId, dose_number: imm.dose_number } });
      return res.status(201).json({ success: true, data: imm });
    }

    // In-facility: must link to same-day visit that has vitalsigns
    let visit_id = payload.visit_id || null;
    let patient_id = payload.patient_id || null;
    if (!visit_id) {
      if (!patient_id) return res.status(400).json({ success:false, message:'visit_id or patient_id is required for in-facility immunization' });
      visit_id = await findTodayVisitWithVitals(supabase, patient_id);
      if (!visit_id) {
  await logActivity({ action_type: ACTIVITY.IMMUNIZATION.BLOCKED_NO_VITALS, description: `Attempt in-facility immunization without same-day vitals`, user_id: actorId, entity_type: 'patient', entity_id: patient_id });
        return res.status(400).json({ success:false, message:'patient has not taken their vitalsigns yet' });
      }
    }
    if (!patient_id) patient_id = await resolvePatientIdFromVisit(supabase, visit_id);
  // Enforce inventory_id for in-facility
    if (!payload.inventory_id) return res.status(400).json({ success:false, message:'inventory_id is required for in-facility immunization' });
    const vaccineId = await resolveVaccineId(supabase, { inventory_id: payload.inventory_id, vaccine_id: payload.vaccine_id });

    // Derive vital_id from visit vitals
    const { data: visitVital, error: vitErr } = await supabase
      .from('vitalsigns')
      .select('vital_id')
      .eq('visit_id', visit_id)
      .eq('is_deleted', false)
      .order('vital_id', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (vitErr) throw vitErr;
  // For in-facility, default administered_by to actor if not provided
  if (!payload.administered_by && actorId) payload.administered_by = actorId;
  const insertData = { ...payload, visit_id, patient_id, vaccine_id: vaccineId, vital_id: visitVital ? visitVital.vital_id : null };
    if (!insertData.vital_id) return res.status(400).json({ success:false, message:'No vitals found for visit' });
    const imm = await immunizationModel.createImmunization(insertData, supabase);
    // Notify guardian about immunization confirmation
    try {
      const { data: patientRow } = await supabase.from('patients_view').select('patient_id, full_name, guardian_contact_number, guardian_email, guardian_user_id').eq('patient_id', imm.patient_id).maybeSingle();
      const msg = `Confirmation: ${imm.disease_prevented || 'vaccine'} was recorded for ${patientRow?.full_name || imm.patient_id} on ${imm.administered_date}`;
      const notif = {
        channel: 'Push',
        recipient_user_id: patientRow?.guardian_user_id || null,
        recipient_phone: patientRow?.guardian_contact_number || null,
        recipient_email: patientRow?.guardian_email || null,
        template_code: 'IMMUNIZATION_CONFIRM',
        message_body: msg,
        related_entity_type: 'immunization',
        related_entity_id: imm.immunization_id,
        scheduled_at: new Date().toISOString(),
        status: 'scheduled',
        created_by: req.user?.user_id || null
      };
      await notificationModel.createNotification(notif, req.user?.user_id || null);
    } catch (notifErr) {
      console.warn('[immunization.create] failed to enqueue confirmation notification:', notifErr.message || notifErr);
    }

    return res.status(201).json({ success: true, data: imm });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success:false, message: 'Failed to create immunization' });
  }
};

// Update immunization record
const updateImmunizationRecord = async (req, res) => {
  try {
    const supabase = getSupabaseForRequest(req);
    const actorId = getActorId(req);
    const payload = Object.assign({}, req.body);
    
    // Sanitize bigint fields: convert empty strings to null
    const bigintFields = ['administered_by', 'created_by', 'updated_by', 'vital_id', 'visit_id'];
    for (const field of bigintFields) {
      if (payload[field] === '') {
        payload[field] = null;
      }
    }
    
    // Ensure audit field on update
    if (actorId && !payload.updated_by) payload.updated_by = actorId;
    // Load old row for activity diff
    let oldRow = null;
    try { oldRow = await immunizationModel.getImmunizationById(req.params.id, supabase); } catch(_) {}
    if (!payload.administered_by && actorId) payload.administered_by = actorId;
    const updatedImmunization = await immunizationModel.updateImmunization(req.params.id, payload, supabase);
    if (!updatedImmunization) return res.status(404).json({ success:false, message: 'Immunization not found' });
    try {
      await logActivity({
        action_type: ACTIVITY.IMMUNIZATION.UPDATE,
        description: `Updated immunization ${updatedImmunization.immunization_id}`,
        user_id: actorId,
        entity_type: 'immunization',
        entity_id: updatedImmunization.immunization_id,
        old_value: oldRow || null,
        new_value: updatedImmunization || null,
      });
    } catch(_) {}
    res.json({ success:true, data: updatedImmunization });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success:false, message: 'Failed to update immunization' });
  }
};

// Delete immunization record
const deleteImmunizationRecord = async (req, res) => {
  try {
    const supabase = getSupabaseForRequest(req);
    await immunizationModel.deleteImmunization(req.params.id, supabase);
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to delete immunization' });
  }
};

// Schedule immunization
const scheduleImmunization = async (req, res) => {
  try {
    const supabase = getSupabaseForRequest(req);
    const result = await immunizationModel.scheduleImmunization(req.body, supabase);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to schedule immunization' });
  }
};

// Update patientschedule (manual edit)
const updatePatientSchedule = async (req, res) => {
  try {
    const id = req.params.id;
    const payload = { ...req.body };
    const supabase = getSupabaseForRequest(req);
    // Enforce: status cannot be manually edited
    if (Object.prototype.hasOwnProperty.call(payload, 'status')) {
      return res.status(400).json({ message: 'patientschedule.status cannot be edited manually' });
    }
    // Stamp updated_by if available
    if (req.user && req.user.user_id && !payload.updated_by) payload.updated_by = req.user.user_id;
    // Fetch old schedule for activity diff
    let oldRow = null;
    try {
      const { data: ps, error: psErr } = await supabase.from('patientschedule').select('*').eq('patient_schedule_id', id).single();
      if (!psErr) oldRow = ps;
    } catch(_) {}
    const updated = await immunizationModel.updatePatientSchedule(id, payload, supabase);
    if (!updated) return res.status(404).json({ message: 'Patient schedule not found' });
    try {
      await logActivity({
        action_type: ACTIVITY.SCHEDULE.UPDATE,
        description: `Manual update of patient schedule ${id}`,
        user_id: req.user?.user_id || null,
        entity_type: 'patientschedule',
        entity_id: id,
        old_value: oldRow || null,
        new_value: updated || null,
      });
    } catch(_) {}
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update patient schedule' });
  }
};

// Enforce vaccine interval
const enforceVaccineInterval = async (req, res) => {
  try {
    const supabase = getSupabaseForRequest(req);
    const result = await immunizationModel.enforceVaccineInterval(req.body, supabase);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to enforce vaccine interval' });
  }
};

// Manual reschedule patient schedule: delegate to SMART RPC to auto-adjust and cascade
const manualReschedulePatientSchedule = async (req, res) => {
  try {
    const supabase = getSupabaseForRequest(req);
  const { p_patient_schedule_id, p_new_scheduled_date, p_user_id, force_override, cascade } = req.body;

    if (!p_patient_schedule_id || !p_new_scheduled_date) {
      return res.status(400).json({ message: 'patient_schedule_id and new_scheduled_date are required' });
    }

    // Fetch current row (for logging and to detect no-change)
    let beforeRow = null;
    try {
      const { data: meta } = await supabase
        .from('patientschedule')
        .select('patient_id, vaccine_id, dose_number, scheduled_date')
        .eq('patient_schedule_id', p_patient_schedule_id)
        .maybeSingle();
      beforeRow = meta || null;
      console.info('[manualReschedule] Request:', {
        patient_schedule_id: p_patient_schedule_id,
        requested_date: p_new_scheduled_date,
        user_id: p_user_id || req.user?.user_id || null,
        meta
      });
    } catch (_) {}

    // Always run checkpoints debugger and print to console for visibility (read-only; no side effects)
    try {
      const { data: checks, error: dbgErr } = await supabase.rpc('debug_reschedule_checkpoints', {
        p_patient_schedule_id: p_patient_schedule_id,
        p_new_date: p_new_scheduled_date,
      });
      if (dbgErr) {
        console.warn('[manualReschedule][checkpoints] RPC error:', dbgErr.message);
      } else {
        console.info('[manualReschedule][checkpoints] Rule checks for candidate:', p_new_scheduled_date);
        // Pretty-print each rule result
        try {
          // Use console.table when available, fallback to JSON string
          if (console.table && Array.isArray(checks)) {
            console.table(checks.map(c => ({ rule: c.rule, passed: c.passed, detail: c.detail })));
          } else {
            console.info(JSON.stringify(checks, null, 2));
          }
        } catch (ppErr) {
          console.info(JSON.stringify(checks, null, 2));
        }
      }
    } catch (dbgEx) {
      console.warn('[manualReschedule][checkpoints] failed:', dbgEx?.message || dbgEx);
    }

    // Use the model helper which calls smart_reschedule_patientschedule inside the DB
    const result = await immunizationModel.updatePatientSchedule(
      p_patient_schedule_id,
      { scheduled_date: p_new_scheduled_date, updated_by: p_user_id || req.user?.user_id || null, force_override: !!force_override, cascade: !!cascade },
      supabase
    );

    // Fetch the updated schedule row for client convenience
    const { data: updatedRow, error: fetchErr } = await supabase
      .from('patientschedule')
      .select('*')
      .eq('patient_schedule_id', p_patient_schedule_id)
      .single();
    if (fetchErr) {
      return res.status(200).json({ success: true, data: null, warning: result?.warning || null, note: 'Rescheduled, but failed to fetch updated row.' });
    }

    // Determine if any change happened to scheduled_date
  const originalDate = beforeRow?.scheduled_date || null;
  const changed = !originalDate || (new Date(updatedRow.scheduled_date).toDateString() !== new Date(originalDate).toDateString());

    // Log only if the date actually changed
    if (changed) {
      try {
        await logActivity({
          action_type: 'SCHEDULE_UPDATE',
          entity_type: 'patientschedule',
          entity_id: p_patient_schedule_id,
          description: `Manual reschedule to ${updatedRow.scheduled_date} (smart rules applied)`,
          user_id: p_user_id || req.user?.user_id || null,
          skipValidation: true
        });
      } catch (_) {}
    }

    return res.status(200).json({ success: true, data: updatedRow, warning: result?.warning || null, noChange: !changed });
  } catch (error) {
    console.error('Manual reschedule error:', error);
    // On error, also run checkpoints for visibility
    try {
      const { data: checks } = await getSupabaseForRequest(req).rpc('debug_reschedule_checkpoints', {
        p_patient_schedule_id,
        p_new_date: p_new_scheduled_date,
      });
      console.info('[manualReschedule][checkpoints][onError]', JSON.stringify(checks, null, 2));
    } catch (_) {}
    // Propagate DB error details when available
    const message = error?.message || 'Failed to reschedule patient schedule';
    return res.status(400).json({ success: false, message, code: error?.code || null, details: error?.details || null, hint: error?.hint || null });
  }
};

module.exports = {
  createImmunizationRecord,
  getImmunizationRecord,
  updateImmunizationRecord,
  deleteImmunizationRecord,
  listImmunizations,
  scheduleImmunization,
  enforceVaccineInterval,
  updatePatientSchedule,
  manualReschedulePatientSchedule,
  // Debug only (non-modifying): traces candidate-date decisions for a reschedule
  async debugManualReschedule(req, res) {
    try {
      const supabase = getSupabaseForRequest(req);
      const { patient_schedule_id, requested_date } = req.query;
      if (!patient_schedule_id || !requested_date) {
        return res.status(400).json({ message: 'patient_schedule_id and requested_date are required' });
      }
      const out = await debugReschedule(supabase, Number(patient_schedule_id), requested_date);
      return res.json({ success: true, data: out });
    } catch (err) {
      console.error('[debugManualReschedule] error:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }
  ,
  // Debug (DB-level): run the instrumented DB RPC and return its decision trace + changes
  async debugManualRescheduleDB(req, res) {
    try {
      const supabase = getSupabaseForRequest(req);
      const { patient_schedule_id, new_date } = req.body || {};
      if (!patient_schedule_id || !new_date) {
        return res.status(400).json({ message: 'patient_schedule_id and new_date are required' });
      }
      const actorId = getActorId(req) || null;
      const { data, error } = await supabase.rpc('debug_reschedule_trace', {
        p_patient_schedule_id: Number(patient_schedule_id),
        p_new_date: new_date,
        p_user_id: actorId,
      });
      if (error) {
        return res.status(400).json({ success: false, message: error.message, code: error.code, details: error.details, hint: error.hint });
      }
      // data is an array with one row { trace, changes }
      const row = Array.isArray(data) ? data[0] : data;
      return res.json({ success: true, trace: row?.trace || [], changes: row?.changes || [] });
    } catch (err) {
      console.error('[debugManualRescheduleDB] error:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }
  ,
  // Debug: subject-first checkpoints — returns pass/fail per rule
  async debugRescheduleCheckpoints(req, res) {
    try {
      const supabase = getSupabaseForRequest(req);
      const { patient_schedule_id, new_date } = req.body || {};
      if (!patient_schedule_id || !new_date) {
        return res.status(400).json({ message: 'patient_schedule_id and new_date are required' });
      }
      const { data, error } = await supabase.rpc('debug_reschedule_checkpoints', {
        p_patient_schedule_id: Number(patient_schedule_id),
        p_new_date: new_date,
      });
      if (error) {
        return res.status(400).json({ success: false, message: error.message, code: error.code, details: error.details, hint: error.hint });
      }
      return res.json({ success: true, checks: data });
    } catch (err) {
      console.error('[debugRescheduleCheckpoints] error:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }
};