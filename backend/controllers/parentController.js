const supabase = require('../db');
const guardianModel = require('../models/guardianModel');
const visitModel = require('../models/visitModel');
const { verifyPassword, changePassword } = require('../models/authModel');

// Get parent profile and basic information
const getParentProfile = async (req, res) => {
  try {
    const userId = req.user.user_id;

    // Get guardian information
    const { data: guardian, error: guardianError } = await supabase
      .from('guardians')
      .select('*')
      .eq('user_id', userId)
      .eq('is_deleted', false)
      .single();

    if (guardianError || !guardian) {
      return res.status(404).json({
        success: false,
        message: 'Guardian profile not found'
      });
    }

    // Get children count
    const { count: childrenCount, error: countError } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true })
      .eq('guardian_id', guardian.guardian_id)
      .eq('is_deleted', false);

    res.json({
      success: true,
      data: {
        ...guardian,
        childrenCount: childrenCount || 0
      }
    });
  } catch (error) {
    console.error('Error fetching parent profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch parent profile',
      error: error.message
    });
  }
};

// Get parent's children/patients
const getParentChildren = async (req, res) => {
  try {
    const userId = req.user.user_id;

    // First get guardian ID
    const { data: guardian, error: guardianError } = await supabase
      .from('guardians')
      .select('guardian_id')
      .eq('user_id', userId)
      .eq('is_deleted', false)
      .single();

    if (guardianError || !guardian) {
      return res.status(404).json({
        success: false,
        message: 'Guardian not found'
      });
    }

    // Get children with basic info
    const { data: children, error: childrenError } = await supabase
      .from('patients')
      .select(`
        patient_id,
        full_name,
        date_of_birth,
        sex,
        barangay,
        created_at,
        patientschedule!inner (
          patient_schedule_id,
          vaccine_id,
          dose_number,
          scheduled_date,
          actual_date,
          status
        )
      `)
      .eq('guardian_id', guardian.guardian_id)
      .eq('is_deleted', false)
      .eq('patientschedule.is_deleted', false);

    // Debug: Print fetched patients data
    console.log('Fetched children data:', JSON.stringify(children, null, 2));

    if (childrenError) {
      console.error('Children query error:', childrenError);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch children',
        error: childrenError.message
      });
    }

    // Process children data
    const processedChildren = children?.map(child => {
      const schedules = child.patientschedule || [];
      const completedCount = schedules.filter(s => s.actual_date).length;
      const totalCount = schedules.length;

      // Calculate age
      const dob = new Date(child.date_of_birth);
      const today = new Date();
      const ageInMs = today - dob;
      const ageInYears = Math.floor(ageInMs / (1000 * 60 * 60 * 24 * 365.25));

      return {
        id: child.patient_id,
        name: child.full_name,
        dateOfBirth: child.date_of_birth,
        age: ageInYears,
        gender: child.sex,
        barangay: child.barangay,
        vaccinationSummary: {
          completed: completedCount,
          total: totalCount,
          percentage: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
        },
        nextVaccine: getNextVaccine(schedules)
      };
    }) || [];

    res.json({
      success: true,
      data: processedChildren
    });
  } catch (error) {
    console.error('Error fetching parent children:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch children',
      error: error.message
    });
  }
};

// Get specific child details
const getChildDetails = async (req, res) => {
  try {
    const { childId } = req.params;
    const userId = req.user.user_id;

    // Verify the child belongs to this parent
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select(`
        *,
        guardians!inner (
          guardian_id,
          user_id
        )
      `)
      .eq('patient_id', childId)
      .eq('is_deleted', false)
      .eq('guardians.user_id', userId)
      .single();

    if (patientError || !patient) {
      return res.status(404).json({
        success: false,
        message: 'Child not found or access denied'
      });
    }

    // Get birth history
    const { data: birthHistory } = await supabase
      .from('birthhistory')
      .select('*')
      .eq('patient_id', childId)
      .eq('is_deleted', false)
      .single();

    // Get recent vaccinations (for summary)
    const { data: recentVaccinations } = await supabase
      .from('immunizations')
      .select(`
        *,
        vaccinemaster (
          vaccine_id,
          antigen_name,
          brand_name
        ),
        users (
          full_name
        )
      `)
      .eq('patient_id', childId)
      .eq('is_deleted', false)
      .order('administered_date', { ascending: false })
      .limit(10);

    // Get full vaccination history (for vaccine details page)
    const { data: allVaccinations, error: vaccinationError } = await supabase
      .from('immunizationhistory_view')
      .select('*')
      .eq('patient_id', childId)
      .order('administered_date', { ascending: false });

    if (vaccinationError) {
      console.error('Error fetching vaccination history:', vaccinationError);
    }
    
    console.log('All vaccinations for child', childId, ':', allVaccinations);

    // Calculate age
    const dob = new Date(patient.date_of_birth);
    const today = new Date();
    const ageInMs = today - dob;
    const ageInYears = Math.floor(ageInMs / (1000 * 60 * 60 * 24 * 365.25));
    const ageInMonths = Math.floor(ageInMs / (1000 * 60 * 60 * 24 * 30.44));
    const ageDisplay = ageInYears > 0 ? `${ageInYears} years` : `${ageInMonths} months`;

    const childDetails = {
      id: patient.patient_id,
      name: patient.full_name,
      dateOfBirth: patient.date_of_birth,
      age: ageInYears,
      ageDisplay: ageDisplay,
      gender: patient.sex,
      bloodType: patient.blood_type || 'Not specified',
      weight: birthHistory?.birth_weight || 'Not recorded',
      height: birthHistory?.birth_length || 'Not recorded',
      allergies: patient.allergies || [],
      conditions: patient.medical_conditions || [],
      medications: patient.current_medications || [],
      barangay: patient.barangay,
      vaccinationHistory: allVaccinations || [],
      recentVaccinations: recentVaccinations?.map(v => ({
        id: v.immunization_id,
        name: `${v.vaccinemaster?.antigen_name || 'Unknown Vaccine'} (${v.dose_number})`,
        date: v.administered_date,
        administeredBy: v.users?.full_name || 'Unknown'
      })) || []
    };

    res.json({
      success: true,
      data: childDetails
    });
  } catch (error) {
    console.error('Error fetching child details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch child details',
      error: error.message
    });
  }
};

// Get child's vaccination schedule
const getChildVaccinationSchedule = async (req, res) => {
  try {
    const { childId } = req.params;
    const userId = req.user.user_id;

    // Verify the child belongs to this parent
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select(`
        patient_id,
        full_name,
        guardians!inner (
          guardian_id,
          user_id
        )
      `)
      .eq('patient_id', childId)
      .eq('is_deleted', false)
      .eq('guardians.user_id', userId)
      .single();

    if (patientError || !patient) {
      return res.status(404).json({
        success: false,
        message: 'Child not found or access denied'
      });
    }

    // Get vaccination schedule
    const { data: schedule, error: scheduleError } = await supabase
      .from('patientschedule')
      .select(`
        *,
        vaccinemaster (
          vaccine_id,
          antigen_name,
          brand_name,
          category
        )
      `)
      .eq('patient_id', childId)
      .eq('is_deleted', false)
      .order('scheduled_date', { ascending: true });

    if (scheduleError) {
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch vaccination schedule',
        error: scheduleError.message
      });
    }

    // Process schedule data
    const processedSchedule = schedule?.map(item => {
      const scheduledDate = new Date(item.scheduled_date);
      const today = new Date();
      const daysDiff = Math.ceil((scheduledDate - today) / (1000 * 60 * 60 * 24));

      let status = 'upcoming';
      if (item.actual_date) {
        status = 'completed';
      } else if (daysDiff < 0) {
        status = 'overdue';
      }

      return {
        id: item.patient_schedule_id,
        name: `${item.vaccinemaster?.antigen_name || 'Unknown Vaccine'} (Dose ${item.dose_number})`,
        status: status,
        recommendedAge: getRecommendedAge(item.dose_number, item.vaccinemaster?.category),
        date: item.actual_date || item.scheduled_date,
        scheduledDate: item.scheduled_date,
        actualDate: item.actual_date,
        vaccineId: item.vaccine_id,
        doseNumber: item.dose_number,
        daysUntilDue: daysDiff > 0 ? daysDiff : 0,
        daysOverdue: daysDiff < 0 ? Math.abs(daysDiff) : 0
      };
    }) || [];

    // Calculate stats
    const stats = {
      completed: processedSchedule.filter(s => s.status === 'completed').length,
      upcoming: processedSchedule.filter(s => s.status === 'upcoming').length,
      overdue: processedSchedule.filter(s => s.status === 'overdue').length
    };

    res.json({
      success: true,
      data: {
        childName: patient.full_name,
        schedule: processedSchedule,
        stats: stats
      }
    });
  } catch (error) {
    console.error('Error fetching child vaccination schedule:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vaccination schedule',
      error: error.message
    });
  }
};

// Helper function to get next vaccine
const getNextVaccine = (schedules) => {
  const upcoming = schedules
    .filter(s => !s.actual_date && new Date(s.scheduled_date) > new Date())
    .sort((a, b) => new Date(a.scheduled_date) - new Date(b.scheduled_date));

  if (upcoming.length > 0) {
    return `Next: ${upcoming[0].vaccine_id} (Dose ${upcoming[0].dose_number})`;
  }
  return 'All caught up!';
};

// Helper function to get recommended age
const getRecommendedAge = (doseNumber, category) => {
  // This is a simplified mapping - you might want to make this more sophisticated
  const ageMappings = {
    1: 'At birth',
    2: '1-2 months',
    3: '2-4 months',
    4: '4-6 months',
    5: '6 months',
    6: '9 months',
    7: '12 months',
    8: '15 months',
    9: '18 months',
    10: '2 years'
  };

  return ageMappings[doseNumber] || `${doseNumber} months+`;
};

// Get immunization details for parent's child
const getChildImmunizationDetails = async (req, res) => {
  try {
    const { childId, immunizationId } = req.params;
    const userId = req.user.user_id;

    // Verify the child belongs to this parent
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select(`
        patient_id,
        guardians!inner (
          guardian_id,
          user_id
        )
      `)
      .eq('patient_id', childId)
      .eq('is_deleted', false)
      .eq('guardians.user_id', userId)
      .single();

    if (patientError || !patient) {
      return res.status(404).json({
        success: false,
        message: 'Child not found or access denied'
      });
    }

    // Get immunization details
    const { data: immunization, error: immunizationError } = await supabase
      .from('immunizations')
      .select(`
        *,
        vaccinemaster (
          vaccine_id,
          antigen_name,
          brand_name,
          description
        ),
        users!immunizations_administered_by_fkey (
          full_name
        ),
        inventory (
          batch_number,
          expiry_date
        )
      `)
      .eq('immunization_id', immunizationId)
      .eq('patient_id', childId)
      .eq('is_deleted', false)
      .single();

    if (immunizationError || !immunization) {
      return res.status(404).json({
        success: false,
        message: 'Immunization record not found'
      });
    }

    res.json({
      success: true,
      data: immunization
    });

  } catch (error) {
    console.error('Error fetching child immunization details:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching immunization details',
      error: error.message
    });
  }
};

// Get child's visit history
const getChildVisitHistory = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { childId } = req.params;

    // Verify guardian owns this child
    const { data: guardian, error: guardianError } = await supabase
      .from('guardians')
      .select('guardian_id')
      .eq('user_id', userId)
      .eq('is_deleted', false)
      .single();

    if (guardianError || !guardian) {
      return res.status(404).json({
        success: false,
        message: 'Guardian profile not found'
      });
    }

    // Verify child belongs to guardian
    const { data: child, error: childError } = await supabase
      .from('patients')
      .select('patient_id, guardian_id')
      .eq('patient_id', childId)
      .eq('guardian_id', guardian.guardian_id)
      .eq('is_deleted', false)
      .single();

    if (childError || !child) {
      return res.status(404).json({
        success: false,
        message: 'Child not found or access denied'
      });
    }

    // Fetch visit history for this child
    const visits = await visitModel.listVisits(
      { patient_id: childId },
      1,
      100, // Get up to 100 visits
      supabase
    );

    res.json({
      success: true,
      data: visits.items || []
    });

  } catch (error) {
    console.error('Error fetching child visit history:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching visit history',
      error: error.message
    });
  }
};

module.exports = {
  getParentProfile,
  getParentChildren,
  getChildDetails,
  getChildVaccinationSchedule,
  getChildImmunizationDetails,
  getChildVisitHistory,
  // Added below
  updateParentProfile: async (req, res) => {
    try {
      const userId = req.user.user_id;
      const body = req.body || {};

      // Build partial update for users table
      const allowed = ['surname', 'firstname', 'middlename', 'email', 'address', 'contact_number', 'birthdate'];
      const patch = {};
      for (const k of allowed) {
        if (body[k] !== undefined && body[k] !== null) patch[k] = body[k];
      }

      // Build partial update for guardians table (occupation, alternative contact)
      const guardianAllowed = ['occupation', 'alternative_contact_number'];
      const guardianPatch = {};
      for (const k of guardianAllowed) {
        if (body[k] !== undefined) guardianPatch[k] = body[k];
      }

      if (Object.keys(patch).length === 0 && Object.keys(guardianPatch).length === 0) {
        return res.status(400).json({ success: false, message: 'No fields to update' });
      }

      // Update users row
      if (Object.keys(patch).length > 0) {
        const { error: updErr } = await supabase
          .from('users')
          .update({
            ...patch,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId)
          .eq('is_deleted', false);

        if (updErr) {
          return res.status(400).json({ success: false, message: 'Failed to update profile', error: updErr.message });
        }
      }

      // Update guardian row if needed
      if (Object.keys(guardianPatch).length > 0) {
        // Find guardian by user_id
        const { data: guardianRow, error: gFindErr } = await supabase
          .from('guardians')
          .select('guardian_id')
          .eq('user_id', userId)
          .eq('is_deleted', false)
          .single();

        if (gFindErr || !guardianRow) {
          return res.status(404).json({ success: false, message: 'Guardian profile not found for update' });
        }

        const { error: gUpdErr } = await supabase
          .from('guardians')
          .update({
            ...guardianPatch,
            updated_by: userId,
            updated_at: new Date().toISOString(),
          })
          .eq('guardian_id', guardianRow.guardian_id)
          .eq('is_deleted', false);

        if (gUpdErr) {
          return res.status(400).json({ success: false, message: 'Failed to update guardian fields', error: gUpdErr.message });
        }
      }

      // Sync guardian record from users (also cascades phone/name to dependent records)
      try {
        await guardianModel.syncGuardianFromUser(userId, userId);
      } catch (e) {
        // Non-fatal; log and continue
        console.warn('[parentController] guardian sync warning:', e?.message || e);
      }

      // Return updated profile using the same shape as getParentProfile
      const { data: guardian, error: guardianError } = await supabase
        .from('guardians')
        .select('*')
        .eq('user_id', userId)
        .eq('is_deleted', false)
        .single();

      if (guardianError || !guardian) {
        return res.status(200).json({ success: true, data: null });
      }

      const { count: childrenCount } = await supabase
        .from('patients')
        .select('*', { count: 'exact', head: true })
        .eq('guardian_id', guardian.guardian_id)
        .eq('is_deleted', false);

      return res.json({ success: true, data: { ...guardian, childrenCount: childrenCount || 0 } });
    } catch (error) {
      console.error('Error updating parent profile:', error);
      return res.status(500).json({ success: false, message: 'Failed to update profile', error: error.message });
    }
  },

  changeParentPassword: async (req, res) => {
    try {
      const userId = req.user.user_id;
      const { currentPassword, newPassword } = req.body || {};

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ success: false, message: 'Current and new passwords are required' });
      }
      if (String(newPassword).length < 8) {
        return res.status(400).json({ success: false, message: 'New password must be at least 8 characters' });
      }

      // Fetch current password hash and email
      const { data: userRow, error: userErr } = await supabase
        .from('users')
        .select('user_id, password_hash, email')
        .eq('user_id', userId)
        .eq('is_deleted', false)
        .single();
      if (userErr || !userRow) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      // Verify current password: local hash if present else Supabase Auth sign-in
      let verified = false;
      let supabaseUUIDFromSignin = null;
      if (userRow.password_hash) {
        verified = await verifyPassword(currentPassword, userRow.password_hash || '');
      }
      if (!verified) {
        if (!userRow.email) {
          return res.status(400).json({ success: false, message: 'User email missing; cannot verify current password' });
        }
        try {
          const { createClient } = require('@supabase/supabase-js');
          const url = process.env.SUPABASE_URL;
          const key = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY;
          const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
          const { data: signin, error: signErr } = await sb.auth.signInWithPassword({ email: userRow.email, password: currentPassword });
          if (signErr || !signin?.user) {
            return res.status(400).json({ success: false, message: 'Current password is incorrect' });
          }
          supabaseUUIDFromSignin = signin.user?.id || null;
          verified = true;
        } catch (_) {
          return res.status(400).json({ success: false, message: 'Current password is incorrect' });
        }
      }

      // Update Supabase Auth password with least privilege first: user-scoped session; fallback to Admin
      let authUpdated = false;
      try {
        const { createClient } = require('@supabase/supabase-js');
        const url = process.env.SUPABASE_URL;
        const anonKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;
        if (!userRow.email || !anonKey) throw new Error('no-user-session');
        const anon = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
        const signRes = await anon.auth.signInWithPassword({ email: userRow.email, password: currentPassword });
        if (!signRes?.data?.session) throw new Error('signin-failed');
        await anon.auth.setSession({
          access_token: signRes.data.session.access_token,
          refresh_token: signRes.data.session.refresh_token
        });
        const { error: updErr } = await anon.auth.updateUser({ password: newPassword });
        if (updErr) throw updErr;
        authUpdated = true;
        console.log('[DEBUG] parent.changeParentPassword user-scoped updateUser OK', { userId });
      } catch (userScopedErr) {
        try {
          const { createClient } = require('@supabase/supabase-js');
          const url = process.env.SUPABASE_URL;
          const key = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY;
          const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });

          // Resolve supabase UUID for this user
          let supabaseUUID = supabaseUUIDFromSignin || null;
          try {
            const { data: uidRow } = await supabase
              .from('users_with_uuid')
              .select('supabase_uuid')
              .eq('user_id', userId)
              .single();
            supabaseUUID = supabaseUUID || uidRow?.supabase_uuid || null;
          } catch (_) {}
          if (!supabaseUUID) {
            try {
              const { data: mapRow } = await supabase
                .from('user_mapping')
                .select('uuid')
                .eq('user_id', userId)
                .single();
              supabaseUUID = supabaseUUID || mapRow?.uuid || null;
            } catch (_) {}
          }

          if (!supabaseUUID) {
            return res.status(409).json({ success: false, message: 'Unable to locate Supabase user mapping for this account' });
          }

          console.log('[DEBUG] parent.changeParentPassword admin.updateUserById', { userId, supabaseUUID });
          const { error: updAuthErr } = await admin.auth.admin.updateUserById(supabaseUUID, { password: newPassword });
          if (updAuthErr) {
            return res.status(500).json({ success: false, message: 'Failed to update Supabase Auth password', error: updAuthErr.message });
          }
          authUpdated = true;
          console.log('[DEBUG] parent.changeParentPassword admin.updateUserById OK', { userId, supabaseUUID });
        } catch (authErr) {
          console.error('[parentController] Supabase Auth password update failed:', authErr);
          return res.status(500).json({ success: false, message: 'Failed to update password (auth provider)' });
        }
      }

      // Update local shadow hash (best-effort)
      try {
        await changePassword(userId, newPassword);
      } catch (localErr) {
        console.warn('[parentController] Local password hash update failed after auth change:', localErr?.message || localErr);
      }

      return res.json({ success: true, message: 'Password changed successfully', authUpdated: !!authUpdated });
    } catch (error) {
      console.error('Error changing password:', error);
      return res.status(500).json({ success: false, message: 'Failed to change password', error: error.message });
    }
  }
};