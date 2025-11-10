import serviceSupabase from '../db.js';
import { scheduleReminderLogsForPatientSchedule, handleScheduleReschedule } from '../services/smsReminderService.js';

// Helper to use provided client or default service client
import { logActivity } from './activityLogger.js';
import { ACTIVITY } from '../constants/activityTypes.js';
function withClient(client) {
  return client || serviceSupabase;
}

// Normalization functions
const toTitleCase = (str) => {
  if (typeof str !== 'string') return str;
  return str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
};

const toSentenceCase = (str) => {
  if (typeof str !== 'string') return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

// Create a new immunization record
const createImmunization = async (immunizationData, client) => {
  const supabase = withClient(client);
  // Derive fields and defaults
  const payload = { ...immunizationData };
  // If administered_date is today, stamp current time-related fields
  try {
    if (payload.administered_date) {
      const today = new Date();
      const toISODate = (d) => new Date(d).toISOString().split('T')[0];
      const nowIso = new Date().toISOString();
      if (toISODate(payload.administered_date) === toISODate(today)) {
        // Immunizations table includes created_at/updated_at (timestamps). Stamp them with current time when administering today.
        payload.created_at = payload.created_at || nowIso;
        payload.updated_at = payload.updated_at || nowIso;
      }
    }
  } catch(_) {}

  // Smart date validation for administered_date
  if (payload.administered_date && payload.patient_id && payload.vaccine_id && payload.dose_number) {
    try {
      // Get the patient's schedule for this vaccine/dose to determine eligible date
      const { data: schedule, error: schedErr } = await supabase
        .from('patientschedule')
        .select('scheduled_date')
        .eq('patient_id', payload.patient_id)
        .eq('vaccine_id', payload.vaccine_id)
        .eq('dose_number', payload.dose_number)
        .eq('is_deleted', false)
        .single();

      // Get the vaccine schedule to determine absolute latest date
      const { data: vaccineSchedule, error: vaccineErr } = await supabase
        .from('schedule_master')
        .select('schedule_doses(absolute_latest_days)')
        .eq('vaccine_id', payload.vaccine_id)
        .eq('is_deleted', false)
        .single();

      let maxDate = new Date();
      maxDate.setHours(23, 59, 59, 999); // End of today as fallback

      // Calculate absolute latest date if available
      if (!vaccineErr && vaccineSchedule?.schedule_doses) {
        const doseInfo = Array.isArray(vaccineSchedule.schedule_doses)
          ? vaccineSchedule.schedule_doses.find(d => d.dose_number === payload.dose_number)
          : vaccineSchedule.schedule_doses;

        if (doseInfo?.absolute_latest_days) {
          // Get patient DOB to calculate absolute latest date
          const { data: patient, error: patientErr } = await supabase
            .from('patients')
            .select('date_of_birth')
            .eq('patient_id', payload.patient_id)
            .eq('is_deleted', false)
            .single();

          if (!patientErr && patient?.date_of_birth) {
            const birthDate = new Date(patient.date_of_birth);
            const absoluteLatest = new Date(birthDate);
            absoluteLatest.setDate(absoluteLatest.getDate() + doseInfo.absolute_latest_days);
            maxDate = new Date(Math.min(maxDate.getTime(), absoluteLatest.getTime()));
          }
        }
      }

      if (!schedErr && schedule && schedule.scheduled_date) {
        const eligibleDate = new Date(schedule.scheduled_date);
        const administeredDate = new Date(payload.administered_date);

        // Validate minimum: cannot administer before eligible date
        if (administeredDate < eligibleDate) {
          const err = new Error(`Cannot administer vaccine before eligible date (${eligibleDate.toISOString().split('T')[0]}). Patient is not yet eligible for this dose.`);
          err.status = 400;
          throw err;
        }

        // Validate maximum: cannot administer beyond absolute latest date
        if (administeredDate > maxDate) {
          const err = new Error(`Cannot administer vaccine beyond absolute latest date (${maxDate.toISOString().split('T')[0]}). This dose is no longer recommended.`);
          err.status = 400;
          throw err;
        }
      }
    } catch (validationErr) {
      // Re-throw validation errors
      if (validationErr.status === 400) throw validationErr;
      // Log but don't fail for other errors (schedule might not exist yet)
      console.warn('[createImmunization] Date validation warning:', validationErr.message);
    }
  }

  // Resolve vaccine_id from inventory_id if present
  if (!payload.vaccine_id && payload.inventory_id) {
    const { data: inv, error: invErr } = await supabase
      .from('inventory')
      .select('vaccine_id')
      .eq('inventory_id', payload.inventory_id)
      .single();
    if (invErr || !inv) {
      throw new Error('Unable to resolve vaccine_id from inventory_id');
    }
    payload.vaccine_id = inv.vaccine_id;
  }
  // Compute age_at_administration if missing and patient_id with DOB available from view
  if (!payload.age_at_administration && payload.patient_id && payload.administered_date) {
    try {
      const { data: p, error: pErr } = await supabase
        .from('patients_view')
        .select('date_of_birth')
        .eq('patient_id', payload.patient_id)
        .single();
      if (!pErr && p && p.date_of_birth) {
        const dob = new Date(p.date_of_birth);
        const adm = new Date(payload.administered_date);
        const diffMs = adm - dob;
        const days = Math.floor(diffMs / (1000*60*60*24));
        const months = Math.floor(days / 30.44);
        const remDays = Math.max(0, Math.round(days - months * 30.44));
        payload.age_at_administration = `${months}m ${remDays}d`;
      }
    } catch(_) {}
  }
  // Ensure created_by/updated_by present
  if (!payload.created_by && payload.administered_by) payload.created_by = payload.administered_by;
  if (!payload.updated_by && payload.administered_by) payload.updated_by = payload.administered_by;

  // Per policy: update Patient Schedule to 'Completed' BEFORE inserting immunization record
  try {
    if (payload.patient_id && payload.vaccine_id && payload.dose_number && payload.administered_date) {
      console.log('[createImmunization] Calling recalc_patient_schedule_enhanced (pre-insert):', {
        patient_id: payload.patient_id,
        vaccine_id: payload.vaccine_id,
        dose_number: payload.dose_number,
        administered_date: payload.administered_date,
        user_id: payload.administered_by || null
      });

      // Test if RPC function exists first
      const { data: rpcResult, error: rpcErr } = await supabase.rpc('recalc_patient_schedule_enhanced', {
        p_patient_id: payload.patient_id,
        p_vaccine_id: payload.vaccine_id,
        p_dose_number: payload.dose_number,
        p_actual_date: payload.administered_date,
        p_user_id: payload.administered_by || null
      });

      if (rpcErr) {
        console.error('[createImmunization] Pre-insert RPC recalc_patient_schedule_enhanced failed:', {
          error: rpcErr,
          params: {
            p_patient_id: payload.patient_id,
            p_vaccine_id: payload.vaccine_id,
            p_dose_number: payload.dose_number,
            p_actual_date: payload.administered_date,
            p_user_id: payload.administered_by || null
          }
        });
        // Don't throw here - allow immunization to proceed, but log the error
      } else {
        console.log('[createImmunization] Pre-insert RPC recalc_patient_schedule_enhanced succeeded:', rpcResult);
      }
    }
  } catch (rpcPreErr) {
    console.error('[createImmunization] Pre-insert RPC call error:', rpcPreErr);
  }

  // Whitelist fields to avoid PostgREST schema errors when extra client fields are present (e.g., vaccine_name)
  const allowedKeys = new Set([
    'inventory_id',
    'vaccine_id',
    'patient_id',
    'disease_prevented',
    'dose_number',
    'administered_date',
    'age_at_administration',
    'administered_by',
    'visit_id',
    'vital_id',
    'facility_name',
    'remarks',
    'outside',
    'created_by',
    'updated_by',
    'created_at',
    'updated_at',
  ]);
  // Apply normalization
  if (payload.facility_name) payload.facility_name = toTitleCase(payload.facility_name);
  if (payload.remarks) payload.remarks = toSentenceCase(payload.remarks);
  const insertPayload = Object.fromEntries(Object.entries(payload).filter(([k]) => allowedKeys.has(k)));
  const { data, error } = await supabase
    .from('immunizations')
    .insert([insertPayload])
    .select()
    .single();
  if (error) throw error;

  // After successful immunization insert, call DB helper to mark schedule completed and recompute
  try {
    if (data && data.patient_id && data.vaccine_id && data.dose_number && data.administered_date) {
      console.log('[createImmunization] Calling recalc_patient_schedule_enhanced (post-insert):', {
        patient_id: data.patient_id,
        vaccine_id: data.vaccine_id,
        dose_number: data.dose_number,
        administered_date: data.administered_date,
        user_id: payload.administered_by || null
      });

      const { data: _rpcResult, error: rpcErr } = await supabase.rpc('recalc_patient_schedule_enhanced', {
        p_patient_id: data.patient_id,
        p_vaccine_id: data.vaccine_id,
        p_dose_number: data.dose_number,
        p_actual_date: data.administered_date,
        p_user_id: payload.administered_by || null
      });

      if (rpcErr) {
        console.error('[createImmunization] Post-insert RPC recalc_patient_schedule_enhanced failed:', rpcErr);

        // Fallback: Directly update the schedule status to Completed
        console.log('[createImmunization] Attempting direct schedule status update...');
        try {
          // Find the schedule first
          const { data: scheduleData, error: findErr } = await supabase
            .from('patientschedule')
            .select('patient_schedule_id')
            .eq('patient_id', data.patient_id)
            .eq('vaccine_id', data.vaccine_id)
            .eq('dose_number', data.dose_number)
            .eq('is_deleted', false)
            .single();

          if (findErr || !scheduleData) {
            console.error('[createImmunization] Could not find schedule to update:', findErr);
          } else {
            // Update the schedule by ID
            const { data: _updateData, error: updateErr } = await supabase
              .from('patientschedule')
              .update({
                status: 'Completed',
                actual_date: data.administered_date,
                updated_at: new Date().toISOString(),
                updated_by: payload.administered_by || null
              })
              .eq('patient_schedule_id', scheduleData.patient_schedule_id)
              .select();

            if (updateErr) {
              console.error('[createImmunization] Direct schedule update failed:', updateErr);
            } else {
              console.log('[createImmunization] Direct schedule update succeeded');

              // Log the schedule completion (normalized via centralized logger)
              try {
                await logActivity({
                  action_type: ACTIVITY.SCHEDULE.UPDATE,
                  user_id: payload.administered_by || null,
                  entity_type: 'patientschedule',
                  entity_id: scheduleData.patient_schedule_id,
                  description: 'Schedule marked as Completed due to immunization administration'
                });
              } catch (_) {}
            }
          }
        } catch (directErr) {
          console.error('[createImmunization] Direct schedule update error:', directErr);
        }
      } else {
        console.log('[createImmunization] Post-insert RPC recalc_patient_schedule_enhanced succeeded');
      }
    }
  } catch (rpcErr) {
    console.error('[createImmunization] Post-insert RPC call error:', rpcErr);
    // Uncomment below to make immunization fail if schedule update fails
    // throw rpcErr;
  }
  return data;
};

// Get immunization by ID. Prefer the denormalized view (immunizationhistory_view)
// so callers (admin and BHS UI) receive the same enriched fields. Fall back
// to the base table join if the view does not return a row.
const getImmunizationById = async (id, client) => {
  const supabase = withClient(client);

  // Try to read from the denormalized view first (admin uses this)
  try {
    const { data: viewData, error: viewErr } = await supabase
      .from('immunizationhistory_view')
      .select('*')
      .eq('immunization_id', id)
      .maybeSingle();
    if (!viewErr && viewData) return viewData;
  } catch (e) {
    // Non-fatal - we'll try the base table below
    console.warn('[getImmunizationById] failed to query immunizationhistory_view, falling back:', e?.message || e);
  }

  // Fallback: query the base immunizations table and join vaccines
  try {
    const { data, error } = await supabase
      .from('immunizations')
      .select(`
        *,
        vaccines!inner(
          antigen_name,
          disease_prevented
        )
      `)
      .eq('immunization_id', id)
      .eq('is_deleted', false)
      .single();
    if (error && error.code !== 'PGRST116') throw error;

    // Flatten the vaccine data for easier access
    if (data && data.vaccines) {
      data.vaccine_antigen_name = data.vaccines.antigen_name;
      data.disease_prevented = data.vaccines.disease_prevented;
      delete data.vaccines;
    }

    return data;
  } catch (err) {
    // Bubble up the error so controller can return an appropriate status
    throw err;
  }
};

// Update an immunization record
const updateImmunization = async (id, immunizationData, client) => {
  const supabase = withClient(client);

  // Smart date validation for administered_date if being updated
  if (immunizationData.administered_date) {
    // First get the existing immunization to get patient_id, vaccine_id, dose_number
    const { data: existing, error: getErr } = await supabase
      .from('immunizations')
      .select('patient_id, vaccine_id, dose_number')
      .eq('immunization_id', id)
      .eq('is_deleted', false)
      .single();

    if (!getErr && existing && existing.patient_id && existing.vaccine_id && existing.dose_number) {
      try {
        // Get the patient's schedule for this vaccine/dose to determine eligible date
        const { data: schedule, error: schedErr } = await supabase
          .from('patientschedule')
          .select('scheduled_date')
          .eq('patient_id', existing.patient_id)
          .eq('vaccine_id', existing.vaccine_id)
          .eq('dose_number', existing.dose_number)
          .eq('is_deleted', false)
          .single();

        // Get the vaccine schedule to determine absolute latest date
        const { data: vaccineSchedule, error: vaccineErr } = await supabase
          .from('schedule_master')
          .select('schedule_doses(absolute_latest_days)')
          .eq('vaccine_id', existing.vaccine_id)
          .eq('is_deleted', false)
          .single();

        let maxDate = new Date();
        maxDate.setHours(23, 59, 59, 999); // End of today as fallback

        // Calculate absolute latest date if available
        if (!vaccineErr && vaccineSchedule?.schedule_doses) {
          const doseInfo = Array.isArray(vaccineSchedule.schedule_doses)
            ? vaccineSchedule.schedule_doses.find(d => d.dose_number === existing.dose_number)
            : vaccineSchedule.schedule_doses;

          if (doseInfo?.absolute_latest_days) {
            // Get patient DOB to calculate absolute latest date
            const { data: patient, error: patientErr } = await supabase
              .from('patients')
              .select('date_of_birth')
              .eq('patient_id', existing.patient_id)
              .eq('is_deleted', false)
              .single();

            if (!patientErr && patient?.date_of_birth) {
              const birthDate = new Date(patient.date_of_birth);
              const absoluteLatest = new Date(birthDate);
              absoluteLatest.setDate(absoluteLatest.getDate() + doseInfo.absolute_latest_days);
              maxDate = new Date(Math.min(maxDate.getTime(), absoluteLatest.getTime()));
            }
          }
        }

        if (!schedErr && schedule && schedule.scheduled_date) {
          const eligibleDate = new Date(schedule.scheduled_date);
          const administeredDate = new Date(immunizationData.administered_date);

          // Validate minimum: cannot administer before eligible date
          if (administeredDate < eligibleDate) {
            const err = new Error(`Cannot administer vaccine before eligible date (${eligibleDate.toISOString().split('T')[0]}). Patient is not yet eligible for this dose.`);
            err.status = 400;
            throw err;
          }

          // Validate maximum: cannot administer beyond absolute latest date
          if (administeredDate > maxDate) {
            const err = new Error(`Cannot administer vaccine beyond absolute latest date (${maxDate.toISOString().split('T')[0]}). This dose is no longer recommended.`);
            err.status = 400;
            throw err;
          }
        }
      } catch (validationErr) {
        // Re-throw validation errors
        if (validationErr.status === 400) throw validationErr;
        // Log but don't fail for other errors
        console.warn('[updateImmunization] Date validation warning:', validationErr.message);
      }
    }
  }

  // Apply normalization
  const sanitized = { ...immunizationData };
  if (sanitized.facility_name) sanitized.facility_name = toTitleCase(sanitized.facility_name);
  if (sanitized.remarks) sanitized.remarks = toSentenceCase(sanitized.remarks);

  // Set administered_by to null if not provided
  if (!sanitized.hasOwnProperty('administered_by')) {
    sanitized.administered_by = null;
  }

  const { data, error } = await supabase
    .from('immunizations')
    .update({ ...sanitized, updated_at: new Date().toISOString() })
    .eq('immunization_id', id)
    .eq('is_deleted', false)
    .select()
    .single();
  if (error) throw error;

  // If actual/administered date provided, trigger schedule recalculation
  try {
    if (data && data.patient_id && data.vaccine_id && data.dose_number && (immunizationData.administered_date || data.date_administered || data.administered_date)) {
      const actualDate = immunizationData.administered_date || data.administered_date || data.date_administered || null;
      if (actualDate) {
        await supabase.rpc('recalc_patient_schedule_enhanced', { p_patient_id: data.patient_id, p_vaccine_id: data.vaccine_id, p_dose_number: data.dose_number, p_actual_date: actualDate, p_user_id: immunizationData.administered_by || null });
      }
    }
  } catch (rpcErr) {
    console.error('[updateImmunization] RPC recalc_patient_schedule_enhanced failed:', rpcErr);
  }
  return data;
};

// Delete (soft delete) immunization record
const deleteImmunization = async (id, client) => {
  const supabase = withClient(client);
  const { data, error } = await supabase
    .from('immunizations')
    .update({
      is_deleted: true,
      deleted_at: new Date().toISOString()
    })
    .eq('immunization_id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

// List all immunizations with filters (prefer immunizationhistory_view for denormalized reads)
const listImmunizations = async (filters = {}, client) => {
  const supabase = withClient(client);
  let query = supabase
    .from('immunizationhistory_view')
    .select('*');

  if (filters.patient_id) {
    query = query.eq('patient_id', filters.patient_id);
  }

  if (filters.vaccine_id) {
    query = query.eq('vaccine_id', filters.vaccine_id);
  }

  if (filters.administered_by) {
    query = query.eq('administered_by', filters.administered_by);
  }

  // Optional sorting: filters.sort accepts "column:asc|desc" or just column (defaults desc for date fields)
  if (filters.sort) {
    try {
      const raw = String(filters.sort);
      const [col, dir] = raw.split(':');
      const ascending = (dir || '').toLowerCase() === 'asc';
      if (col) query = query.order(col, { ascending });
    } catch (_) {}
  }

  // Optional limit
  if (filters.limit) {
    const l = Number(filters.limit);
    if (!Number.isNaN(l) && l > 0) query = query.limit(l);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

// Get all immunizations (alias for listImmunizations)
const getAllImmunizations = async (filters = {}, client) => {
  return await listImmunizations(filters, client);
};

// Schedule immunization (insert into patientschedule)
const scheduleImmunization = async (scheduleData, client) => {
  const supabase = withClient(client);
  const { data, error } = await supabase
    .from('patientschedule')
    .insert([scheduleData])
    .select()
    .single();
  if (error) throw error;

  // Validate manual schedule edits via DB helper (non-blocking).
  // This will insert activity log warnings if the scheduled date violates rules.
  try {
    const userId = scheduleData.updated_by || scheduleData.created_by || null;
    if (data && data.patient_schedule_id) {
      await supabase.rpc('validate_manual_schedule_edit', { p_patient_schedule_id: data.patient_schedule_id, p_user_id: userId });
    }
  } catch (rpcErr) {
    console.error('[scheduleImmunization] validate_manual_schedule_edit RPC failed:', rpcErr);
  }

  // Auto-create scheduled SMS reminder logs for this patientschedule (non-blocking)
  try {
    if (data && data.patient_schedule_id) {
      await scheduleReminderLogsForPatientSchedule(data.patient_schedule_id, supabase);
    }
  } catch (remErr) {
    console.error('[scheduleImmunization] Failed to create SMS reminder logs:', remErr?.message || remErr);
  }

  return data;
};

// Enforce vaccine interval (this is handled by database trigger/policy)
const enforceVaccineInterval = async (scheduleData, client) => {
  const supabase = withClient(client);
  // This function validates interval rules before scheduling
  // The actual enforcement is done by the database trigger
  const { patient_id, vaccine_id, dose_number } = scheduleData;

  // Check if previous dose exists and validate interval
  const { data: lastDose, error } = await supabase
    .from('patientschedule')
    .select('*')
    .eq('patient_id', patient_id)
    .eq('vaccine_id', vaccine_id)
    .eq('dose_number', dose_number - 1)
    .eq('status', 'completed')
    .single();

  if (error && error.code !== 'PGRST116') throw error;

  if (!lastDose && dose_number > 1) {
    throw new Error('Previous dose not found or not completed');
  }

  return { valid: true, message: 'Interval validation passed' };
};

// Update patientschedule row (manual schedule edit)
const updatePatientSchedule = async (patientScheduleId, updateData, client) => {
  const supabase = withClient(client);
  // Load existing to detect scheduled_date change and prevent manual status edits
  const { data: current, error: curErr } = await supabase
    .from('patientschedule')
    .select('*')
    .eq('patient_schedule_id', patientScheduleId)
    .eq('is_deleted', false)
    .single();
  if (curErr && curErr.code !== 'PGRST116') throw curErr;
  if (!current) throw new Error('Patient schedule not found');

  const patch = { ...updateData };
  // Never allow status override at the model level
  if (Object.prototype.hasOwnProperty.call(patch, 'status')) delete patch.status;

  // If date change requested, use SMART RPC that validates min/max age and cascades
  if (patch.scheduled_date && current.scheduled_date && new Date(patch.scheduled_date).toDateString() !== new Date(current.scheduled_date).toDateString()) {
    const oldDate = current.scheduled_date; // ← Capture old date before update
    const userId = updateData.updated_by || null;
    const { data: res, error: rpcErr } = await supabase.rpc('smart_reschedule_patientschedule', {
      p_patient_schedule_id: patientScheduleId,
      p_new_date: patch.scheduled_date,
      p_user_id: userId,
      p_force_override: !!updateData.force_override,
      p_cascade: !!updateData.cascade,
    });
    if (rpcErr) throw rpcErr;
    // Return the main row (current id) if found, else first; include warning if present
    const normalizeId = (r) => (r?.out_patient_schedule_id ?? r?.patient_schedule_id);
    const main = Array.isArray(res) ? (res.find(r => normalizeId(r) === patientScheduleId) || res[0]) : res;

    // CASCADE UPDATE: Recreate SMS reminders for rescheduled date (NON-BLOCKING)
    setImmediate(async () => {
      try {
        await handleScheduleReschedule(patientScheduleId, oldDate, supabase); // ← Pass old date
        console.log(`[updatePatientSchedule] Successfully recreated SMS reminders for schedule ${patientScheduleId}`);
      } catch (smsErr) {
        console.warn('[updatePatientSchedule] Failed to update SMS reminders after reschedule:', smsErr?.message || smsErr);
      }
    });

    // Also run validator for visibility
    try {
      const mainId = normalizeId(main) ?? patientScheduleId;
      await supabase.rpc('validate_manual_schedule_edit', { p_patient_schedule_id: mainId, p_user_id: userId });
    } catch (e) {
      console.error('[updatePatientSchedule] validate_manual_schedule_edit RPC failed:', e);
    }
    return main;
  }

  // Otherwise, do a simple patch (non-date fields)
  const { data, error } = await supabase
    .from('patientschedule')
    .update(patch)
    .eq('patient_schedule_id', patientScheduleId)
    .eq('is_deleted', false)
    .select()
    .single();
  if (error) throw error;

  // Call DB helper to validate manual edit and emit warnings (non-blocking)
  try {
    const userId = updateData.updated_by || null;
    await supabase.rpc('validate_manual_schedule_edit', { p_patient_schedule_id: data.patient_schedule_id, p_user_id: userId });
  } catch (rpcErr) {
    console.error('[updatePatientSchedule] validate_manual_schedule_edit RPC failed:', rpcErr);
  }

  return data;
};

// Convenience: reschedule API to call directly
const reschedulePatientSchedule = async (patientScheduleId, newDate, userId, client) => {
  const supabase = withClient(client);

  // Get the old date before rescheduling
  const { data: current } = await supabase
    .from('patientschedule')
    .select('scheduled_date')
    .eq('patient_schedule_id', patientScheduleId)
    .eq('is_deleted', false)
    .maybeSingle();

  const oldDate = current?.scheduled_date;

  const { data, error } = await supabase.rpc('reschedule_patientschedule', {
    p_patient_schedule_id: patientScheduleId,
    p_new_date: newDate,
    p_user_id: userId || null,
    p_do_cascade: true,
    p_do_group: true,
  });
  if (error) throw error;

  // CASCADE UPDATE: Recreate SMS reminders for rescheduled date (NON-BLOCKING)
  setImmediate(async () => {
    try {
      await handleScheduleReschedule(patientScheduleId, oldDate, supabase); // ← Pass old date
      console.log(`[reschedulePatientSchedule] Successfully recreated SMS reminders for schedule ${patientScheduleId}`);
    } catch (smsErr) {
      console.warn('[reschedulePatientSchedule] Failed to update SMS reminders after reschedule:', smsErr?.message || smsErr);
    }
  });

  return data;
};

export { createImmunization,
  getImmunizationById,
  updateImmunization,
  deleteImmunization,
  listImmunizations,
  getAllImmunizations,
  scheduleImmunization,
  enforceVaccineInterval,
  updatePatientSchedule,
  reschedulePatientSchedule };
