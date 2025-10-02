const patientModel = require('../models/patientModel');
const { getSupabaseForRequest } = require('../utils/supabaseClient');
const immunizationModel = require('../models/immunizationModel');
const { logActivity } = require('../models/activityLogger');
const { ACTIVITY } = require('../constants/activityTypes');

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
      status,
      age_group,
      barangay 
    } = req.query;
    
    const filters = { search, sex: gender, status, age_group, barangay };
  const supabase = getSupabaseForRequest(req);
  const patients = await patientModel.getAllPatients(filters, page, limit, supabase);
    
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
    if (!birthHistoryPayload || !birthHistoryPayload.time_of_birth || !birthHistoryPayload.attendant_at_birth || !birthHistoryPayload.type_of_delivery) {
      return res.status(400).json({
        success: false,
        message: 'Missing required birth history fields: time_of_birth, attendant_at_birth, type_of_delivery'
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

    // Optional onboarding: handle immunizations plan
    const immunizationsPlan = Array.isArray(req.body.immunizations) ? req.body.immunizations : [];
    for (const item of immunizationsPlan) {
      const status = (item.status || '').toLowerCase();
      const base = {
        patient_id: newPatient.patient_id,
        vaccine_id: item.vaccine_id,
        dose_number: item.dose_number,
      };
      if (status === 'taken' || status === 'completed') {
        await immunizationModel.createImmunization({
          ...base,
          administered_date: item.administered_date || new Date().toISOString(),
          administered_by: (req.user && req.user.user_id) || item.administered_by || null,
          remarks: item.remarks || null,
        });
      } else {
        if (!item.scheduled_date) {
          // If scheduled_date is not provided, skip scheduling to avoid invalid data
          continue;
        }
        await immunizationModel.scheduleImmunization({
          ...base,
          scheduled_date: item.scheduled_date,
          status: 'scheduled',
        });
      }
    }

    // Return enriched patient data and schedule from views
  const patientView = await patientModel.getPatientById(newPatient.patient_id, getSupabaseForRequest(req));
    // If birth history payload was provided, persist it to birthhistory table
    if (birthHistoryPayload) {
      try {
        const upsertPayload = {
          birth_weight: birthHistoryPayload.birth_weight || birthHistoryPayload.birthWeight || birthHistoryPayload.birthWeightKg || null,
          birth_length: birthHistoryPayload.birth_length || birthHistoryPayload.birthLength || birthHistoryPayload.birthLengthCm || null,
          place_of_birth: birthHistoryPayload.place_of_birth || birthHistoryPayload.placeOfBirth || patientData.date_of_birth || null,
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
        console.debug('createPatient calling updatePatientBirthHistory with:', JSON.stringify(upsertPayload));
        const upsertResult = await patientModel.updatePatientBirthHistory(newPatient.patient_id, upsertPayload);
        console.debug('updatePatientBirthHistory result:', upsertResult);
      } catch (err) {
        console.error('Failed to persist birth history for new patient:', err);
      }
    }
    const schedule = await patientModel.getPatientVaccinationSchedule(newPatient.patient_id);

    res.status(201).json({ 
      success: true,
      message: 'Patient registered successfully', 
      data: { patient: patientView, schedule }
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
      if (birthHistory) payload.medical_history = birthHistory;
      
      // Fetch vaccination history
      const immunizationModel = require('../models/immunizationModel');
  const vaccinationHistory = await immunizationModel.listImmunizations({ patient_id: id }, getSupabaseForRequest(req));
      payload.vaccinationHistory = vaccinationHistory || [];
      
      // Fetch next scheduled vaccinations
  const nextScheduledVaccinations = await patientModel.getPatientVaccinationSchedule(id, getSupabaseForRequest(req));
      payload.nextScheduledVaccinations = nextScheduledVaccinations || [];
      
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
      data: updatedPatient 
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
    
    res.json({ 
      success: true,
      message: 'Patient deleted successfully' 
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

module.exports = {
  createPatient,
  getPatientById,
  updatePatient,
  deletePatient,
  getAllPatients,
  getPatientSchedule,
  updatePatientTag,
  getBirthHistory,
  updateBirthHistory,
  getVitals,
  updateVitals,
  updatePatientSchedules,
  listParentsOptions,
  getSmartDoseOptions,
};