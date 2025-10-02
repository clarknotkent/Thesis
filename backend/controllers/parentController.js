const supabase = require('../db');

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
      const today = new Date(Date.now());
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

    // Get recent vaccinations
    const { data: vaccinations } = await supabase
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

    // Calculate age
    const dob = new Date(patient.date_of_birth);
    const today = new Date(Date.now());
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
      recentVaccinations: vaccinations?.map(v => ({
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
      const today = new Date(Date.now());
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
    .filter(s => !s.actual_date && new Date(s.scheduled_date) > new Date(Date.now()))
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

module.exports = {
  getParentProfile,
  getParentChildren,
  getChildDetails,
  getChildVaccinationSchedule
};