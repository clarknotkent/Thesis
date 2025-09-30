const immunizationModel = require('../models/immunizationModel');
const { getSupabaseForRequest } = require('../utils/supabaseClient');
const { logActivity } = require('../models/activityLogger');
const { ACTIVITY } = require('../constants/activityTypes');
const { getActorId } = require('../utils/actor');

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
    const immunizations = await immunizationModel.listImmunizations({}, supabase);
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

// Manual reschedule patient schedule with status update to 'Rescheduled'
const manualReschedulePatientSchedule = async (req, res) => {
  try {
    const supabase = getSupabaseForRequest(req);
    const { p_patient_schedule_id, p_new_scheduled_date, p_user_id } = req.body;

    if (!p_patient_schedule_id || !p_new_scheduled_date) {
      return res.status(400).json({ message: 'patient_schedule_id and new_scheduled_date are required' });
    }

    // Get current schedule info first
    const { data: currentSchedule, error: fetchError } = await supabase
      .from('patientschedule')
      .select('*, vaccinemaster!inner(vaccine_id, antigen_name)')
      .eq('patient_schedule_id', p_patient_schedule_id)
      .eq('is_deleted', false)
      .single();

    if (fetchError || !currentSchedule) {
      return res.status(404).json({ message: 'Patient schedule not found' });
    }

    // Get schedule master and dose information for interval validation
    const { data: scheduleMaster, error: masterError } = await supabase
      .from('schedule_master')
      .select('id')
      .eq('vaccine_id', currentSchedule.vaccine_id)
      .single();

    let minInterval = 7; // Default 7 days
    if (!masterError && scheduleMaster) {
      const { data: doseInfo, error: doseError } = await supabase
        .from('schedule_doses')
        .select('min_interval_days')
        .eq('schedule_id', scheduleMaster.id)
        .eq('dose_number', currentSchedule.dose_number)
        .single();

      if (!doseError && doseInfo?.min_interval_days) {
        minInterval = doseInfo.min_interval_days;
      }
    }

    const newScheduledDate = new Date(p_new_scheduled_date);

    // Validate against previous dose
    if (currentSchedule.dose_number > 1) {
      const { data: prevDose, error: prevError } = await supabase
        .from('patientschedule')
        .select('scheduled_date, actual_date')
        .eq('patient_id', currentSchedule.patient_id)
        .eq('vaccine_id', currentSchedule.vaccine_id)
        .eq('dose_number', currentSchedule.dose_number - 1)
        .eq('is_deleted', false)
        .single();

      if (!prevError && prevDose) {
        const prevDate = new Date(prevDose.actual_date || prevDose.scheduled_date);
        const daysDiff = Math.floor((newScheduledDate - prevDate) / (1000 * 60 * 60 * 24));

        if (daysDiff < minInterval) {
          return res.status(400).json({
            message: `Cannot schedule dose ${currentSchedule.dose_number}. Minimum ${minInterval} days required after previous dose. Current gap: ${daysDiff} days.`
          });
        }
      }
    }

    // Check and auto-adjust next dose if necessary
    const { data: nextDose, error: nextError } = await supabase
      .from('patientschedule')
      .select('patient_schedule_id, scheduled_date, dose_number')
      .eq('patient_id', currentSchedule.patient_id)
      .eq('vaccine_id', currentSchedule.vaccine_id)
      .eq('dose_number', currentSchedule.dose_number + 1)
      .eq('is_deleted', false)
      .single();

    if (!nextError && nextDose) {
      const nextDate = new Date(nextDose.scheduled_date);
      const daysDiff = Math.floor((nextDate - newScheduledDate) / (1000 * 60 * 60 * 24));

      if (daysDiff < minInterval) {
        // Auto-adjust the next dose to maintain minimum interval
        const adjustedNextDate = new Date(newScheduledDate);
        adjustedNextDate.setDate(adjustedNextDate.getDate() + minInterval);

        await supabase
          .from('patientschedule')
          .update({
            scheduled_date: adjustedNextDate.toISOString().split('T')[0],
            eligible_date: adjustedNextDate.toISOString().split('T')[0],
            status: 'Rescheduled',
            updated_at: new Date().toISOString(),
            updated_by: p_user_id
          })
          .eq('patient_schedule_id', nextDose.patient_schedule_id);

        // Log the auto-adjustment
        await logActivity({
          action_type: 'SCHEDULE_UPDATE',
          entity_type: 'patientschedule',
          entity_id: nextDose.patient_schedule_id,
          description: `Auto-adjusted dose ${nextDose.dose_number} schedule due to manual reschedule of dose ${currentSchedule.dose_number}`,
          user_id: p_user_id,
          skipValidation: true
        });
      }
    }

    // Update the schedule with new date and set status to Rescheduled
    const { data, error } = await supabase
      .from('patientschedule')
      .update({
        scheduled_date: p_new_scheduled_date,
        eligible_date: p_new_scheduled_date,
        status: 'Rescheduled',
        updated_at: new Date().toISOString(),
        updated_by: p_user_id || req.user?.id
      })
      .eq('patient_schedule_id', p_patient_schedule_id)
      .select();

    if (error) {
      console.error('Manual reschedule error:', error);
      return res.status(500).json({ message: 'Failed to reschedule patient schedule', error: error.message });
    }

    // Log the manual rescheduling
    await logActivity({
      action_type: 'SCHEDULE_UPDATE',
      entity_type: 'patientschedule',
      entity_id: p_patient_schedule_id,
      description: `Manual reschedule of ${currentSchedule.vaccinemaster?.antigen_name || 'vaccine'} dose ${currentSchedule.dose_number} from ${currentSchedule.scheduled_date} to ${p_new_scheduled_date}`,
      user_id: p_user_id,
      skipValidation: true
    });

    res.json({ message: 'Patient schedule rescheduled successfully', data });
  } catch (error) {
    console.error('Manual reschedule error:', error);
    res.status(500).json({ message: 'Failed to reschedule patient schedule' });
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
};