const patientModel = require('../models/patientModel');
const moment = require('moment-timezone');
const notificationModel = require('../models/notificationModel');
const { getSupabaseForRequest } = require('../utils/supabaseClient');
const immunizationModel = require('../models/immunizationModel');
const { logActivity } = require('../models/activityLogger');
const { ACTIVITY } = require('../constants/activityTypes');
const { mintPatientQrUrl } = require('../services/qrService');
const smsReminderService = require('../services/smsReminderService');
const svcSupabase = require('../db');
const serviceSupabase = require('../db');

// Normalize incoming payload to match DB schema
const mapPatientPayload = (body) => ({
  firstname: body.firstname || body.first_name || body.firstName || null,
  surname: body.surname || body.last_name || body.lastName || null,
  middlename: body.middlename || body.middle_name || body.middleName || null,
  date_of_birth: body.date_of_birth || body.birth_date || body.birthDate || null,
  sex: body.sex || body.gender || null,
  address: body.address || null,
  barangay: body.barangay || null,
  health_center: body.health_center || body.healthCenter || null,
  guardian_id: body.guardian_id || body.parent_guardian || body.parent_id || body.parentId || null, // Accept parent_id variants from frontend
  relationship_to_guardian: body.relationship_to_guardian || body.relationshipToGuardian || null,
  mother_name: body.mother_name || body.motherName || null,
  mother_occupation: body.mother_occupation || body.motherOccupation || null,
  mother_contact_number: body.mother_contact_number || body.motherContactNumber || null,
  father_name: body.father_name || body.fatherName || null,
  father_occupation: body.father_occupation || body.fatherOccupation || null,
  father_contact_number: body.father_contact_number || body.fatherContactNumber || null,
  family_number: body.family_number || body.familyNumber || null,
  tags: body.tags || null,
  // Pass through status for Active/Inactive/Archived flows
  status: body.status || body.patient_status || body.patientStatus || undefined,
  // Accept birth history nested payloads for onboarding
  birthhistory: body.birthhistory || body.birth_history || body.medical_history || null
});

// List all patients with optional filters
const getAllPatients = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 5, 
      search, 
      gender, 
      sex, 
      status,
      age_group,
      barangay 
    } = req.query;

    // Coerce pagination params to integers (req.query values are strings)
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 5;

    // Normalize sex/gender filter to match various DB encodings (Male/male/M, Female/female/F)
    let sexOptions;
    const rawSex = (sex || gender || '').toString().trim().toLowerCase();
    if (rawSex) {
      if (rawSex === 'male' || rawSex === 'm') {
        sexOptions = ['Male', 'male', 'M', 'm'];
      } else if (rawSex === 'female' || rawSex === 'f') {
        sexOptions = ['Female', 'female', 'F', 'f'];
      }
    }

    const filters = { search, status, age_group, barangay };
    if (sexOptions) {
      filters.sexOptions = sexOptions;
    } else if (rawSex) {
      // Fallback to single value if we couldn't map (future-proof)
      filters.sex = rawSex;
    }
    const supabase = getSupabaseForRequest(req);
    const patients = await patientModel.getAllPatients(filters, pageNum, limitNum, supabase);
    
    res.json({ 
      success: true, 
      data: patients 
    });
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch patients', 
      error: error.message 
    });
  }
};

// Register a new patient
const createPatient = async (req, res) => {
  try {
  const patientData = mapPatientPayload(req.body);
  console.debug('createPatient payload guardian_id (raw):', req.body.guardian_id, 'mapped:', patientData.guardian_id);
  // Attach acting user id so DB triggers that fallback to NEW.created_by can attribute the record
  if (req.user && req.user.user_id) patientData.created_by = req.user.user_id;
    
    // Validate required fields (general + guardian)
    if (!patientData.firstname || !patientData.surname || !patientData.date_of_birth || !patientData.guardian_id || !patientData.relationship_to_guardian) {
      return res.status(400).json({ 
        success: false,
        message: 'Missing required fields: firstname, surname, date_of_birth, guardian_id, relationship_to_guardian' 
      });
    }

    // Validate required birthhistory fields (ensure critical newborn info is captured)
    const birthHistoryPayload = req.body.birthhistory || req.body.birth_history || req.body.medical_history || null;
    console.debug('createPatient incoming birthhistory payload:', JSON.stringify(birthHistoryPayload));
    if (!birthHistoryPayload || !birthHistoryPayload.type_of_delivery) {
      return res.status(400).json({
        success: false,
        message: 'Missing required birth history fields: type_of_delivery'
      });
    }

  const supabase = getSupabaseForRequest(req);
  // Autofill mother/father fields if relationship_to_guardian is Mother/Father
  try {
    const rel = (patientData.relationship_to_guardian || '').toLowerCase();
    if ((rel === 'mother' || rel === 'father') && patientData.guardian_id) {
      const { data: g, error: gErr } = await supabase
        .from('guardians')
        .select('surname, firstname, middlename, occupation, contact_number')
        .eq('guardian_id', patientData.guardian_id)
        .eq('is_deleted', false)
        .single();
      if (!gErr && g) {
        const motherFullName = [g.firstname, g.middlename, g.surname].filter(Boolean).join(' ');
        if (rel === 'mother') {
          patientData.mother_name = patientData.mother_name || motherFullName;
          patientData.mother_occupation = patientData.mother_occupation || g.occupation || null;
          patientData.mother_contact_number = patientData.mother_contact_number || g.contact_number || null;
        } else if (rel === 'father') {
          patientData.father_name = patientData.father_name || motherFullName;
          patientData.father_occupation = patientData.father_occupation || g.occupation || null;
          patientData.father_contact_number = patientData.father_contact_number || g.contact_number || null;
        }
      }
    }
  } catch ( autofillErr ) {
    console.warn('Autofill mother fields failed (non-blocking):', autofillErr.message);
  }

  // If caller entered an occupation for the selected guardian (based on relationship),
  // persist it to guardians.occupation so it auto-fills next time.
  try {
    const rel = (patientData.relationship_to_guardian || '').toLowerCase();
    const enteredOccupation = rel === 'mother'
      ? (patientData.mother_occupation || null)
      : rel === 'father'
        ? (patientData.father_occupation || null)
        : null;
    if (patientData.guardian_id && enteredOccupation && String(enteredOccupation).trim()) {
      await supabase
        .from('guardians')
        .update({ occupation: String(enteredOccupation).trim(), updated_at: new Date().toISOString(), updated_by: req.user?.user_id || null })
        .eq('guardian_id', patientData.guardian_id)
        .eq('is_deleted', false);
    }
  } catch (occErr) {
    console.warn('[createPatient] Guardian occupation update skipped (non-blocking):', occErr?.message || occErr);
  }

  // Ensure created_by / updated_by defaults
  if (!patientData.updated_by && patientData.created_by) patientData.updated_by = patientData.created_by;

  const newPatient = await patientModel.createPatient(patientData, supabase);

    // Log the patient creation
    await logActivity({
      action_type: ACTIVITY.CHILD.CREATE,
      description: `Created patient ${newPatient.firstname} ${newPatient.surname}`,
      user_id: req.user?.user_id || null,
      entity_type: 'child',
      entity_id: newPatient.patient_id
    });

    // Optional onboarding: handle immunizations plan + notifications in background to avoid request timeout
    const immunizationsPlan = Array.isArray(req.body.immunizations) ? req.body.immunizations : [];
    setImmediate(async () => {
      try {
        // Create/schedule immunizations
        for (const item of immunizationsPlan) {
          const status = (item.status || '').toLowerCase();
          const base = {
            patient_id: newPatient.patient_id,
            vaccine_id: item.vaccine_id,
            dose_number: item.dose_number,
          };
          try {
            if (status === 'taken' || status === 'completed') {
              await immunizationModel.createImmunization({
                ...base,
                administered_date: item.administered_date || new Date().toISOString(),
                administered_by: (req.user && req.user.user_id) || item.administered_by || null,
                remarks: item.remarks || null,
              });
            } else if (item.scheduled_date) {
              await immunizationModel.scheduleImmunization({
                ...base,
                scheduled_date: item.scheduled_date,
                status: 'scheduled',
              });
            }
          } catch (imErr) {
            console.warn('[createPatient][async] immunization processing failed for', base, imErr?.message || imErr);
          }
        }

        // Notify guardian about schedule creation
        try {
          const { data: guardianInfo } = await serviceSupabase
            .from('patients_view')
            .select('guardian_user_id, guardian_contact_number, guardian_email, full_name')
            .eq('patient_id', newPatient.patient_id)
            .maybeSingle();
          if (guardianInfo?.guardian_user_id) {
            await notificationModel.createNotification({
              channel: 'Push',
              recipient_user_id: guardianInfo.guardian_user_id,
              template_code: 'schedule_created',
              message_body: `Vaccination schedule has been created for ${guardianInfo.full_name}.`,
              related_entity_type: 'patient',
              related_entity_id: newPatient.patient_id
            }, req.user?.user_id || null);
          }
        } catch (notifError) {
          console.warn('[createPatient][async] Failed to send schedule creation notification:', notifError.message);
        }
      } catch (e) {
        console.warn('[createPatient][async] background onboarding tasks error:', e?.message || e);
      }
    });

    // Return enriched patient data and schedule from views
  const patientView = await patientModel.getPatientById(newPatient.patient_id, getSupabaseForRequest(req));
    // If birth history payload was provided, persist it to birthhistory table (non-blocking)
    if (birthHistoryPayload) {
      setImmediate(async () => {
        try {
          const upsertPayload = {
            birth_weight: birthHistoryPayload.birth_weight || birthHistoryPayload.birthWeight || birthHistoryPayload.birthWeightKg || null,
            birth_length: birthHistoryPayload.birth_length || birthHistoryPayload.birthLength || birthHistoryPayload.birthLengthCm || null,
            place_of_birth: birthHistoryPayload.place_of_birth || birthHistoryPayload.placeOfBirth || null,
            address_at_birth: birthHistoryPayload.address_at_birth || birthHistoryPayload.addressAtBirth || null,
            time_of_birth: birthHistoryPayload.time_of_birth || birthHistoryPayload.timeOfBirth || null,
            attendant_at_birth: birthHistoryPayload.attendant_at_birth || birthHistoryPayload.attendantAtBirth || null,
            type_of_delivery: birthHistoryPayload.type_of_delivery || birthHistoryPayload.typeOfDelivery || null,
            ballards_score: birthHistoryPayload.ballards_score || birthHistoryPayload.ballardsScore || null,
            hearing_test_date: birthHistoryPayload.hearing_test_date || birthHistoryPayload.hearingTestDate || null,
            newborn_screening_date: birthHistoryPayload.newborn_screening_date || birthHistoryPayload.newbornScreeningDate || null,
            newborn_screening_result: birthHistoryPayload.newborn_screening_result || birthHistoryPayload.newbornScreeningResult || null,
            created_by: req.user?.user_id || null,
            updated_by: req.user?.user_id || null
          };
          console.debug('[createPatient][async] updatePatientBirthHistory with:', JSON.stringify(upsertPayload));
          await patientModel.updatePatientBirthHistory(newPatient.patient_id, upsertPayload);
        } catch (err) {
          console.error('[createPatient][async] Failed to persist birth history for new patient:', err);
        }
      });
    }
    // Use fast, read-only schedule fetch to keep request snappy
    const schedule = await patientModel.getPatientVaccinationScheduleFast(newPatient.patient_id);

    // Auto-create SMS reminders asynchronously to avoid slowing down the response
    try {
      const runAsync = async () => {
        const svc = serviceSupabase; // use service client outside request lifecycle
        const todayStr = new Date().toISOString().split('T')[0];
        const { data: upcoming, error: upErr } = await svc
          .from('patientschedule')
          .select('patient_schedule_id, scheduled_date')
          .eq('patient_id', newPatient.patient_id)
          .eq('is_deleted', false)
          .gte('scheduled_date', `${todayStr}T00:00:00`);
        if (!upErr && Array.isArray(upcoming) && upcoming.length > 0) {
          const pickPerDate = new Map();
          for (const row of upcoming) {
            const d = (row.scheduled_date || '').split('T')[0];
            if (!pickPerDate.has(d)) pickPerDate.set(d, row.patient_schedule_id);
          }
          for (const psid of pickPerDate.values()) {
            try {
              await smsReminderService.scheduleReminderLogsForPatientSchedule(psid, svc);
            } catch (e) {
              console.warn('[createPatient][async] scheduleReminderLogsForPatientSchedule failed for', psid, e?.message || e);
            }
          }
          try { await smsReminderService.updateMessagesForPatient(newPatient.patient_id, svc); } catch (_) {}
        }
      };
      if (typeof setImmediate === 'function') setImmediate(runAsync);
      else setTimeout(runAsync, 0);
    } catch (autoSmsErr) {
      console.warn('Queued async SMS reminder creation failed to start (non-blocking):', autoSmsErr?.message || autoSmsErr);
    }

    // Generate a QR URL for this patient (long-lived for printed cards; override via env TTL)
    let qr;
    try {
      qr = await mintPatientQrUrl(newPatient.patient_id);
    } catch (qrErr) {
      console.warn('QR mint (non-blocking) failed:', qrErr.message);
    }

    res.status(201).json({ 
      success: true,
      message: 'Patient registered successfully', 
      data: { patient: patientView, schedule, qr }
    });
  } catch (error) {
    console.error('Error registering patient:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to register patient', 
      error: error.message 
    });
  }
};

// Parents dropdown (mother/father) with name/occupation/numbers
const listParentsOptions = async (req, res) => {
  try {
    const supabase = getSupabaseForRequest(req);
    const { data: users, error } = await supabase
      .from('users')
      .select('user_id, surname, firstname, middlename, contact_number, address, role, guardians:guardians!guardians_user_id_fkey(guardian_id, occupation, contact_number, is_deleted)')
      .in('role', ['Guardian'])
      .eq('is_deleted', false)
      .order('surname', { ascending: true });
    if (error) throw error;

    const options = (users || []).map(u => {
      const g = Array.isArray(u.guardians) ? u.guardians.find(x => x && x.is_deleted === false) || u.guardians[0] : null;
      return {
        user_id: u.user_id,
        guardian_id: g?.guardian_id || null,
        full_name: `${u.surname}, ${u.firstname} ${u.middlename || ''}`.trim(),
        occupation: g?.occupation || null,
        contact_number: g?.contact_number || u.contact_number || null,
        role: u.role,
      };
    });
    res.json({ success: true, data: options });
  } catch (error) {
    console.error('Error fetching parents options:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch parents options', error: error.message });
  }
};

// Recorded parents list from existing patient records
const listRecordedParents = async (req, res) => {
  try {
    const type = (req.query.type || req.query.parent_type || 'mother').toString().toLowerCase();
    const supabase = getSupabaseForRequest(req);
    const items = await patientModel.listRecordedParents(type, supabase);
    res.json({ success: true, data: items });
  } catch (error) {
    console.error('Error fetching recorded parents:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch recorded parents', error: error.message });
  }
};

// Parents suggestions with contacts from patients table (no guardians), deduped
const listParentsWithContacts = async (req, res) => {
  try {
    const type = (req.query.type || 'mother').toString().toLowerCase();
    const items = await patientModel.listParentsWithContacts(type, getSupabaseForRequest(req));
    res.json({ success: true, data: items });
  } catch (error) {
    console.error('Error fetching parents with contacts:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch parents with contacts', error: error.message });
  }
};

// Distinct parent names from patients data (not guardians)
const listDistinctParentNames = async (req, res) => {
  try {
    const type = (req.query.type || 'mother').toString().toLowerCase();
    const names = await patientModel.listDistinctParentNames(type, getSupabaseForRequest(req));
    res.json({ success: true, data: names });
  } catch (error) {
    console.error('Error fetching distinct parent names:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch distinct parent names', error: error.message });
  }
};

// Co-parent inference: given a name on one side, return the most common co-parent from patients data
const getCoParentSuggestion = async (req, res) => {
  try {
    const type = (req.query.type || 'mother').toString().toLowerCase();
    const name = (req.query.name || '').toString();
    if (!name) return res.status(400).json({ success: false, message: 'name is required' });
    const result = await patientModel.getCoParentForName(type, name, getSupabaseForRequest(req));
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error fetching co-parent suggestion:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch co-parent suggestion', error: error.message });
  }
};

// Smart dose options: available dose_numbers for a patient and vaccine
const getSmartDoseOptions = async (req, res) => {
  try {
    const supabase = getSupabaseForRequest(req);
    const patientId = req.params.id;
    const vaccineId = req.query.vaccine_id || req.query.vaccineId;
    if (!vaccineId) return res.status(400).json({ success:false, message:'vaccine_id is required' });

    // Fetch schedule doses via schedule_master for this vaccine
    const { data: sm, error: smErr } = await supabase
      .from('schedule_master')
      .select('id, schedule_doses(dose_number)')
      .eq('vaccine_id', vaccineId)
      .eq('is_deleted', false)
      .maybeSingle();
    if (smErr) throw smErr;
    const allDoseNumbers = Array.isArray(sm?.schedule_doses) ? sm.schedule_doses.map(d => d.dose_number).filter(n => n != null).sort((a,b)=>a-b) : [];

    const { data: taken, error: tErr } = await supabase
      .from('immunizations')
      .select('dose_number')
      .eq('patient_id', patientId)
      .eq('vaccine_id', vaccineId)
      .eq('is_deleted', false);
    if (tErr) throw tErr;
    const completedSet = new Set((taken || []).map(x => x.dose_number));

  const remaining = allDoseNumbers.filter(n => !completedSet.has(n));
  const autoSelect = remaining.length === 1 ? remaining[0] : null;

  res.json({ success: true, data: { available_doses: remaining, all_doses: allDoseNumbers, completed_doses: Array.from(completedSet), auto_select: autoSelect } });
  } catch (error) {
    console.error('Error computing smart dose options:', error);
    res.status(500).json({ success:false, message:'Failed to compute smart dose options', error: error.message });
  }
};

// Get a specific patient by ID
const getPatientById = async (req, res) => {
  try {
  const { id } = req.params;
  const patient = await patientModel.getPatientById(id, getSupabaseForRequest(req));
    
    if (!patient) {
      return res.status(404).json({ 
        success: false,
        message: 'Patient not found' 
      });
    }
    
    // Fetch birth history and attach as medical_history for backward compatibility with frontend
    try {
  const birthHistory = await patientModel.getPatientBirthHistory(id, getSupabaseForRequest(req)).catch(() => null);
      const payload = { ...patient };
      if (birthHistory) {
        payload.medical_history = birthHistory;
        console.log('✅ Attached medical_history to payload');
      } else {
        console.warn('⚠️ No birth history found for patient', id);
      }
      
      // Fetch vaccination history
      const immunizationModel = require('../models/immunizationModel');
  const vaccinationHistory = await immunizationModel.listImmunizations({ patient_id: id }, getSupabaseForRequest(req));
      payload.vaccinationHistory = vaccinationHistory || [];
      
      // Fetch next scheduled vaccinations
  const nextScheduledVaccinations = await patientModel.getPatientVaccinationSchedule(id, getSupabaseForRequest(req));
      payload.nextScheduledVaccinations = nextScheduledVaccinations || [];
      
      // Attach QR url for display on patient details page
      try {
        console.log('Minting QR for patient', id)
        const { mintPatientQrUrl } = require('../services/qrService');
        const qr = await mintPatientQrUrl(id); // Use default TTL from environment
        payload.qr = qr;
        console.log('QR minted successfully:', !!qr)
      } catch (qrErr) {
        console.warn('QR mint on getPatientById failed (non-blocking):', qrErr.message);
      }
      res.json({ success: true, data: payload });
    } catch (err) {
      console.error('Error attaching additional data:', err);
      res.json({ success: true, data: patient });
    }
  } catch (error) {
    console.error('Error fetching patient:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch patient details', 
      error: error.message 
    });
  }
};

// Update a patient
const updatePatient = async (req, res) => {
  try {
  const { id } = req.params;
  const updates = mapPatientPayload(req.body);
  // Record who updated the patient for audit/triggers
  if (req.user && req.user.user_id) updates.updated_by = req.user.user_id;
  // Autofill mother/father fields if relationship_to_guardian is Mother/Father and fields are blank
  try {
    const rel = (updates.relationship_to_guardian || '').toLowerCase();
    if ((rel === 'mother' || rel === 'father') && updates.guardian_id) {
      const supabase = getSupabaseForRequest(req);
      const { data: g, error: gErr } = await supabase
        .from('guardians')
        .select('surname, firstname, middlename, occupation, contact_number')
        .eq('guardian_id', updates.guardian_id)
        .eq('is_deleted', false)
        .single();
      if (!gErr && g) {
        const motherFullName = [g.firstname, g.middlename, g.surname].filter(Boolean).join(' ');
        if (rel === 'mother') {
          updates.mother_name = updates.mother_name || motherFullName;
          updates.mother_occupation = updates.mother_occupation || g.occupation || null;
          updates.mother_contact_number = updates.mother_contact_number || g.contact_number || null;
        } else if (rel === 'father') {
          updates.father_name = updates.father_name || motherFullName;
          updates.father_occupation = updates.father_occupation || g.occupation || null;
          updates.father_contact_number = updates.father_contact_number || g.contact_number || null;
        }
      }
    }
  } catch (autofillErr) {
    console.warn('Autofill mother fields on update failed (non-blocking):', autofillErr.message);
  }
    
  // If user supplied occupation for selected guardian during update, propagate to guardians table
  try {
    const rel = (updates.relationship_to_guardian || '').toLowerCase();
    const occ = rel === 'mother'
      ? (updates.mother_occupation || null)
      : rel === 'father'
        ? (updates.father_occupation || null)
        : null;
    if (updates.guardian_id && occ && String(occ).trim()) {
      const supabase = getSupabaseForRequest(req);
      await supabase
        .from('guardians')
        .update({ occupation: String(occ).trim(), updated_at: new Date().toISOString(), updated_by: req.user?.user_id || null })
        .eq('guardian_id', updates.guardian_id)
        .eq('is_deleted', false);
    }
  } catch (occErr) {
    console.warn('[updatePatient] Guardian occupation update skipped (non-blocking):', occErr?.message || occErr);
  }

  // Pre-check: if birthdate is changing, enforce lock when any vaccine completed
  let dobChanged = false;
  let oldDob = null;
  let newDob = updates.date_of_birth || null;
  try {
    if (typeof newDob !== 'undefined' && newDob !== null) {
      const supabase = getSupabaseForRequest(req);
      const { data: currentRow } = await supabase
        .from('patients')
        .select('date_of_birth')
        .eq('patient_id', id)
        .maybeSingle();
      oldDob = currentRow?.date_of_birth || null;
      // Normalize comparison to YYYY-MM-DD
      const toISODate = (d) => d ? new Date(d).toISOString().split('T')[0] : null;
      dobChanged = toISODate(oldDob) !== toISODate(newDob);
      if (dobChanged) {
        // Check for any completed schedules (actual_date not null)
        const { data: completedRows, error: compErr } = await supabase
          .from('patientschedule')
          .select('patient_schedule_id')
          .eq('patient_id', id)
          .eq('is_deleted', false)
          .not('actual_date', 'is', null);
        if (compErr) {
          console.warn('[updatePatient] completed schedules check failed (non-fatal):', compErr?.message || compErr);
        }
        const completedCount = Array.isArray(completedRows) ? completedRows.length : 0;
        if (completedCount > 0) {
          return res.status(400).json({
            success: false,
            code: 'DOB_LOCKED_HAS_COMPLETED',
            message: 'Birthdate cannot be edited because at least one vaccine is already completed.',
            completedCount
          });
        }
      }
    }
  } catch (preErr) {
    console.warn('[updatePatient] pre-check for DOB change failed (continuing):', preErr?.message || preErr);
  }

  const updatedPatient = await patientModel.updatePatient(id, updates, getSupabaseForRequest(req));

    if (!updatedPatient) {
      return res.status(404).json({ 
        success: false,
        message: 'Patient not found' 
      });
    }

    // If birthhistory is present in payload, update birth history
    const birthHistoryPayload = req.body.birthhistory || req.body.birth_history || req.body.medical_history || null;
    if (birthHistoryPayload) {
      try {
        const upsertPayload = {
          birth_weight: birthHistoryPayload.birth_weight || birthHistoryPayload.birthWeight || birthHistoryPayload.birthWeightKg || null,
          birth_length: birthHistoryPayload.birth_length || birthHistoryPayload.birthLength || birthHistoryPayload.birthLengthCm || null,
          place_of_birth: birthHistoryPayload.place_of_birth || birthHistoryPayload.placeOfBirth || null,
          address_at_birth: birthHistoryPayload.address_at_birth || birthHistoryPayload.addressAtBirth || null,
          time_of_birth: birthHistoryPayload.time_of_birth || birthHistoryPayload.timeOfBirth || null,
          attendant_at_birth: birthHistoryPayload.attendant_at_birth || birthHistoryPayload.attendantAtBirth || null,
          type_of_delivery: birthHistoryPayload.type_of_delivery || birthHistoryPayload.typeOfDelivery || null,
          ballards_score: birthHistoryPayload.ballards_score || birthHistoryPayload.ballardsScore || null,
          hearing_test_date: birthHistoryPayload.hearing_test_date || birthHistoryPayload.hearingTestDate || null,
          newborn_screening_date: birthHistoryPayload.newborn_screening_date || birthHistoryPayload.newbornScreeningDate || null,
          newborn_screening_result: birthHistoryPayload.newborn_screening_result || birthHistoryPayload.newbornScreeningResult || null,
          updated_by: req.user?.user_id || null
        };
  await patientModel.updatePatientBirthHistory(id, upsertPayload, getSupabaseForRequest(req));
      } catch (err) {
        console.error('Failed to persist birth history for patient update:', err);
      }
    }

    // After successful update: if DOB changed and patient has no completed doses, queue a background REWRITE of schedules
    try {
      if (dobChanged && updatedPatient && updatedPatient.date_of_birth) {
        const toISODate = (d) => new Date(d).toISOString().split('T')[0];
        const birthISO = toISODate(updatedPatient.date_of_birth);
        const userId = req.user?.user_id || null;
        const patientIdForTask = id;
        const runAsync = async () => {
          try {
            await rewriteSchedulesForDob(patientIdForTask, birthISO, userId);
          } catch (e) {
            console.warn('[updatePatient] DOB schedule rewrite async failed:', e?.message || e);
          }
        };
        if (typeof setImmediate === 'function') setImmediate(runAsync); else setTimeout(runAsync, 0);
      }
    } catch (cascadeErr) {
      console.warn('[updatePatient] queue DOB schedule rewrite failed (non-fatal):', cascadeErr?.message || cascadeErr);
    }

    // Log the patient update
    await logActivity({
      action_type: ACTIVITY.CHILD.UPDATE,
      description: `Updated patient ${updatedPatient.firstname} ${updatedPatient.surname}`,
      user_id: req.user?.user_id || null,
      entity_type: 'child',
      entity_id: updatedPatient.patient_id
    });

    res.json({ 
      success: true,
      message: 'Patient updated successfully',
      data: updatedPatient,
      schedulesRewriteQueued: !!dobChanged
    });
  } catch (error) {
    console.error('Error updating patient:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to update patient', 
      error: error.message 
    });
  }
};

// Background task: rewrite pending schedules to align with new DOB baseline
async function rewriteSchedulesForDob(patientId, birthISO, userId) {
  const supabase = svcSupabase;

  // 1) Load schedule master/doses to compute the new baseline dates
  const { data: masters, error: mErr } = await supabase
    .from('schedule_master')
    .select('id, vaccine_id')
    .eq('is_deleted', false);
  if (mErr) throw mErr;
  const scheduleIds = (masters || []).map(m => m.id);
  const { data: doses, error: dErr } = await supabase
    .from('schedule_doses')
    .select('schedule_id, dose_number, due_after_days')
    .in('schedule_id', scheduleIds)
    .order('dose_number', { ascending: true });
  if (dErr) throw dErr;
  const masterById = new Map((masters || []).map(m => [m.id, m]));

  // Build target map: key `${vaccine_id}:${dose_number}` -> computed date (YYYY-MM-DD)
  const targets = new Map();
  const baseDate = new Date(birthISO + 'T00:00:00Z');
  for (const rec of doses || []) {
    const master = masterById.get(rec.schedule_id);
    if (!master) continue;
    const due = Number(rec.due_after_days || 0);
    const dt = new Date(baseDate.getTime());
    dt.setUTCDate(dt.getUTCDate() + due);
    const newDateIso = dt.toISOString().split('T')[0];
    targets.set(`${master.vaccine_id}:${rec.dose_number}`, newDateIso);
  }

  // 2) Load existing non-completed schedules for the patient
  const { data: existing, error: eErr } = await supabase
    .from('patientschedule')
    .select('patient_schedule_id, vaccine_id, dose_number, scheduled_date')
    .eq('patient_id', patientId)
    .eq('is_deleted', false)
    .is('actual_date', null);
  if (eErr) throw eErr;

  const existingKeySet = new Set();
  let updatedCount = 0;
  let insertedCount = 0;
  const toISODate = (d) => (d ? new Date(d).toISOString().split('T')[0] : null);

  // 2a) Update existing rows to the new computed dates
  for (const row of existing || []) {
    const key = `${row.vaccine_id}:${row.dose_number}`;
    existingKeySet.add(key);
    const newIso = targets.get(key);
    if (!newIso) continue; // no corresponding schedule defined
    const oldIso = toISODate(row.scheduled_date);
    if (oldIso === newIso) continue;
    // Update scheduled_date and eligible_date; preserve ID
    const { error: upErr } = await supabase
      .from('patientschedule')
      .update({
        scheduled_date: newIso,
        eligible_date: newIso,
        updated_at: new Date().toISOString(),
        updated_by: userId,
      })
      .eq('patient_schedule_id', row.patient_schedule_id);
    if (upErr) {
      console.warn('[rewriteSchedulesForDob] update failed for', row.patient_schedule_id, upErr?.message || upErr);
    } else {
      updatedCount++;
      // Recreate SMS reminders for this schedule
      try {
        await smsReminderService.handleScheduleReschedule(row.patient_schedule_id, oldIso, supabase);
      } catch (smsErr) {
        console.warn('[rewriteSchedulesForDob] SMS reschedule failed for', row.patient_schedule_id, smsErr?.message || smsErr);
      }
    }
  }

  // 2b) Insert missing schedules defined in master/doses but absent for this patient
  for (const [key, newIso] of targets.entries()) {
    if (existingKeySet.has(key)) continue;
    const [vaccineIdStr, doseNumStr] = key.split(':');
    const vaccine_id = Number(vaccineIdStr);
    const dose_number = Number(doseNumStr);
    const { data: inserted, error: insErr } = await supabase
      .from('patientschedule')
      .insert({
        patient_id: patientId,
        vaccine_id,
        dose_number,
        scheduled_date: newIso,
        eligible_date: newIso,
        status: 'Pending',
        created_by: userId,
        updated_by: userId,
      })
      .select('patient_schedule_id')
      .single();
    if (insErr) {
      console.warn('[rewriteSchedulesForDob] insert failed', key, insErr?.message || insErr);
    } else if (inserted?.patient_schedule_id) {
      insertedCount++;
      try {
        // Only schedule SMS if the newly computed date is today or in the future (Asia/Manila)
        const todayLocal = moment.tz('Asia/Manila').format('YYYY-MM-DD');
        if (newIso >= todayLocal) {
          await smsReminderService.scheduleReminderLogsForPatientSchedule(inserted.patient_schedule_id, supabase);
        } else {
          console.log(`[rewriteSchedulesForDob] Skipping SMS creation for inserted past-dated schedule ${inserted.patient_schedule_id} on ${newIso} (today ${todayLocal}).`);
        }
      } catch (smsErr) {
        console.warn('[rewriteSchedulesForDob] SMS logs create failed for new schedule', inserted.patient_schedule_id, smsErr?.message || smsErr);
      }
    }
  }

  // Refresh pending messages to reflect updated schedules/dates
  try {
    await smsReminderService.updateMessagesForPatient(patientId, supabase);
  } catch (_) {}

  console.log(`[rewriteSchedulesForDob] Complete for patient ${patientId}: updated ${updatedCount}, inserted ${insertedCount}`);
}

// Delete a patient (soft delete)
const deletePatient = async (req, res) => {
  try {
  const { id } = req.params;
  const userId = req.user?.user_id; // From checkUserMapping middleware
    
  const result = await patientModel.deletePatient(id, userId, getSupabaseForRequest(req));

    if (!result) {
      return res.status(404).json({ 
        success: false,
        message: 'Patient not found' 
      });
    }

    const cancelled = result.cancelledSmsCount || 0;
    console.log(`[patientController] deletePatient: cancelled ${cancelled} sms_logs for patient ${id}`);

    res.json({ 
      success: true,
      message: `Patient deleted successfully. Cancelled pending scheduled SMS: ${cancelled}` 
    });
  } catch (error) {
    console.error('Error deleting patient:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to delete patient', 
      error: error.message 
    });
  }
};

// Get patient schedule (vaccination schedule)
const getPatientSchedule = async (req, res) => {
  try {
    const { id } = req.params;
  const schedule = await patientModel.getPatientVaccinationSchedule(id, getSupabaseForRequest(req));
    if (!schedule) {
      return res.status(404).json({ message: 'Patient schedule not found' });
    }
    res.json(schedule);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch patient schedule', error });
  }
};

// Update patient tag
const updatePatientTag = async (req, res) => {
  try {
    const { id } = req.params;
    const { tag } = req.body;
    
    if (!tag) {
      return res.status(400).json({ message: 'Tag is required' });
    }

  const updatedPatient = await patientModel.updatePatientTag(id, tag, getSupabaseForRequest(req));
    if (!updatedPatient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    res.json({ message: 'Patient tag updated successfully', patient: updatedPatient });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update patient tag', error });
  }
};

// Get birth history
const getBirthHistory = async (req, res) => {
  try {
    const { id } = req.params;
  const birthHistory = await patientModel.getPatientBirthHistory(id, getSupabaseForRequest(req));
    if (!birthHistory) {
      return res.status(404).json({ message: 'Birth history not found' });
    }
    res.json(birthHistory);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch birth history', error });
  }
};

// Update birth history
const updateBirthHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const birthData = req.body;
    
  const updatedHistory = await patientModel.updatePatientBirthHistory(id, birthData, getSupabaseForRequest(req));
    if (!updatedHistory) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    res.json({ message: 'Birth history updated successfully', birthHistory: updatedHistory });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update birth history', error });
  }
};

// Get patient vitals
const getVitals = async (req, res) => {
  try {
    const { id } = req.params;
  return res.status(410).json({ message: 'Deprecated: use visit or service-specific endpoints to manage vitals' });
    if (!vitals) {
      return res.status(404).json({ message: 'Patient vitals not found' });
    }
    res.json(vitals);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch patient vitals', error });
  }
};

// Update patient vitals
const updateVitals = async (req, res) => {
  try {
    const { id } = req.params;
    const vitalsData = req.body;
    
    return res.status(410).json({ message: 'Deprecated: use visit or outside service endpoints to create vitals' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update patient vitals', error });
  }
};
// Update patient schedule statuses (manual only - not for automatic updates)
const updatePatientSchedules = async (req, res) => {
  try {
    const { id: patientId } = req.params;

    // Call the database function to update schedule statuses
    const result = await patientModel.updatePatientSchedules(patientId);

    if (result.error) {
      throw new Error(result.error.message || 'Database function error');
    }

    res.json({
      success: true,
      message: 'Patient schedule statuses updated successfully',
      data: result.data
    });
  } catch (error) {
    console.error('Error updating patient schedules:', error);
    res.status(500).json({
      message: 'Failed to update patient schedule statuses',
      error: error.message
    });
  }
};

// Restore a soft-deleted patient (and cascade restore)
const restorePatient = async (req, res) => {
  try {
    const { id } = req.params;
    const actorId = req.user?.user_id || null;
    const restored = await patientModel.restorePatient(id, actorId, getSupabaseForRequest(req));
    if (!restored) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }
    try {
      await logActivity({
        action_type: ACTIVITY.CHILD.RESTORE,
        description: `Restored patient ${id}`,
        user_id: actorId,
        entity_type: 'child',
        entity_id: id
      });
    } catch (_) {}
    res.json({ success: true, message: 'Patient restored successfully' });
  } catch (error) {
    console.error('Error restoring patient:', error);
    if (error && (error.statusCode === 400 || error.code === 'GUARDIAN_DELETED')) {
      return res.status(400).json({ success: false, message: error.message || 'Cannot restore patient: guardian is archived' });
    }
    res.status(500).json({ success: false, message: 'Failed to restore patient', error: error.message });
  }
};

module.exports = {
  createPatient,
  getPatientById,
  updatePatient,
  deletePatient,
  restorePatient,
  getAllPatients,
  getPatientSchedule,
  updatePatientTag,
  getBirthHistory,
  updateBirthHistory,
  getVitals,
  updateVitals,
  updatePatientSchedules,
  listParentsOptions,
  listRecordedParents,
  listParentsWithContacts,
  listDistinctParentNames,
  getCoParentSuggestion,
  getSmartDoseOptions,
};
