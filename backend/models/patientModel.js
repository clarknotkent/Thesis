const supabase = require('../db');

const patientModel = {
  // Fetch all patients with optional filters and pagination (reads from patients_view)
  getAllPatients: async (filters = {}, page = 1, limit = 10) => {
    try {
      let query = supabase
        .from('patients_view')
        .select('*', { count: 'exact' });

      // Apply filters
      if (filters.search) {
        query = query.ilike('patient_name', `%${filters.search}%`);
      }

      if (filters.sex) {
        query = query.eq('sex', filters.sex);
      }

      if (filters.age_group) {
        const today = new Date();
        let startDate, endDate;

        switch (filters.age_group) {
          case 'newborn':
            startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 28);
            endDate = today;
            break;
          case 'infant':
            startDate = new Date(today.getFullYear(), today.getMonth() - 12, today.getDate());
            endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 28);
            break;
          case 'toddler':
            startDate = new Date(today.getFullYear() - 3, today.getMonth(), today.getDate());
            endDate = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
            break;
        }

        if (startDate && endDate) {
          query = query
            .gte('date_of_birth', startDate.toISOString())
            .lte('date_of_birth', endDate.toISOString());
        }
      }

      // Apply pagination
      const offset = (page - 1) * limit;
      const { data, error, count } = await query
        .range(offset, offset + limit - 1)
  .order('patient_id', { ascending: false });

      if (error) throw error;

      return {
        patients: data || [],
        totalCount: count || 0,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil((count || 0) / limit)
      };
    } catch (error) {
      console.error('Error fetching patients:', error);
      throw error;
    }
  },

  // Get patient by ID (reads from patients_view)
  getPatientById: async (id) => {
    try {
      const { data, error } = await supabase
        .from('patients_view')
        .select('*')
        .eq('patient_id', id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data || null;
    } catch (error) {
      console.error('Error fetching patient by ID:', error);
      throw error;
    }
  },

  // Helper function to calculate age in months
  calculateAgeInMonths: (birthDate) => {
    const birth = new Date(birthDate);
    const today = new Date();
    
    // Calculate total months difference
    let months = (today.getFullYear() - birth.getFullYear()) * 12;
    months += today.getMonth() - birth.getMonth();
    
    // Adjust if the day hasn't occurred yet this month
    if (today.getDate() < birth.getDate()) {
      months--;
    }
    
    // Ensure non-negative age
    return Math.max(0, months);
  },

  // Create a new patient
  createPatient: async (patientData) => {
    try {
      // Calculate age in months from date_of_birth
      // The database trigger will also calculate this, but we include it to be safe
      let ageInMonths = 0;
      if (patientData.date_of_birth) {
        ageInMonths = patientModel.calculateAgeInMonths(patientData.date_of_birth);
      }
      
      // Validate guardian_id if provided
      let validGuardianId = null;
      if (patientData.guardian_id) {
        const { data: guardian, error: guardianError } = await supabase
          .from('guardians')
          .select('guardian_id')
          .eq('guardian_id', patientData.guardian_id)
          .single();
        
        if (!guardianError && guardian) {
          validGuardianId = patientData.guardian_id;
        } else {
          console.log(`Warning: Guardian ID ${patientData.guardian_id} not found, setting to null`);
        }
      }
      
      const insertData = {
        firstname: patientData.firstname,
        surname: patientData.surname,
        middlename: patientData.middlename,
        date_of_birth: patientData.date_of_birth,
        age_months: ageInMonths, // Include calculated age in months
        sex: patientData.sex,
        address: patientData.address,
        barangay: patientData.barangay,
        health_center: patientData.health_center,
        guardian_id: validGuardianId, // Use validated guardian_id or null
        mother_name: patientData.mother_name,
        mother_occupation: patientData.mother_occupation,
        mother_contact_number: patientData.mother_contact_number,
        father_name: patientData.father_name,
        father_occupation: patientData.father_occupation,
        father_contact_number: patientData.father_contact_number,
        family_number: patientData.family_number || `FAM-${Date.now()}`, // Generate if null
        tags: null // Force null for tags due to database constraint
      };

      console.log('Creating patient with calculated age:', {
        name: `${patientData.firstname} ${patientData.surname}`,
        date_of_birth: patientData.date_of_birth,
        age_months: ageInMonths
      });

      // Try using the RPC function to bypass broken trigger
      const { data: rpcData, error: rpcError } = await supabase.rpc('insert_patient_bypass_trigger', {
        p_firstname: patientData.firstname,
        p_surname: patientData.surname,
        p_middlename: patientData.middlename,
        p_date_of_birth: patientData.date_of_birth,
        p_sex: patientData.sex,
        p_address: patientData.address,
        p_barangay: patientData.barangay,
        p_health_center: patientData.health_center,
        p_guardian_id: validGuardianId, // Use validated guardian_id or null
        p_mother_name: patientData.mother_name,
        p_mother_occupation: patientData.mother_occupation,
        p_mother_contact_number: patientData.mother_contact_number,
        p_father_name: patientData.father_name,
        p_father_occupation: patientData.father_occupation,
        p_father_contact_number: patientData.father_contact_number,
        p_family_number: patientData.family_number || `FAM-${Date.now()}`, // Generate if null
        p_tags: null // Force null for tags due to database constraint
      });

      if (rpcError) {
        console.log('RPC insert failed, trying direct insert fallback...');
        
        // Fallback to direct insert without age_months
        const insertDataWithoutAge = { ...insertData };
        delete insertDataWithoutAge.age_months;
        
        const { data, error } = await supabase
          .from('patients')
          .insert(insertDataWithoutAge)
          .select()
          .single();
          
        if (error) throw error;
        return data;
      }
      
      // RPC succeeded, return the data
      const data = rpcData;
      const error = null;

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating patient:', error);
      throw error;
    }
  },

  // Update a patient
  updatePatient: async (id, patientData) => {
    try {
      const updateData = { ...patientData };
      
      // Remove fields that don't exist in patients table
      delete updateData.birth_weight;
      delete updateData.birth_length;
      delete updateData.place_of_birth;

      // Recalculate age_months if date_of_birth is being updated
      if (patientData.date_of_birth) {
        updateData.age_months = patientModel.calculateAgeInMonths(patientData.date_of_birth);
      }

      console.log('Updating patient:', {
        patient_id: id,
        date_of_birth: patientData.date_of_birth,
        age_months: updateData.age_months
      });

      const { data, error } = await supabase
        .from('patients')
        .update(updateData)
        .eq('patient_id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating patient:', error);
      throw error;
    }
  },

  // Soft delete a patient
  deletePatient: async (id, deletedBy) => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .update({ 
          is_deleted: true,
          deleted_at: new Date().toISOString(),
          deleted_by: deletedBy 
        })
        .eq('patient_id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error deleting patient:', error);
      throw error;
    }
  },

  // Get patient vaccination schedule (reads from patientschedule_view)
  getPatientVaccinationSchedule: async (patientId) => {
    try {
      const { data, error } = await supabase
        .from('patientschedule_view')
        .select('*')
        .eq('patient_id', patientId)
        .order('scheduled_date', { ascending: true });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching patient schedule:', error);
      throw error;
    }
  },

  // Update patient tag(s)
  updatePatientTag: async (patientId, tag) => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .update({ 
          tags: tag,
          updated_at: new Date().toISOString()
        })
        .eq('patient_id', patientId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating patient tag:', error);
      throw error;
    }
  },

  // Get patient birth history (from birthhistory table)
  getPatientBirthHistory: async (patientId) => {
    try {
      const { data, error } = await supabase
        .from('birthhistory')
        .select(`
          birthhistory_id,
          patient_id,
          birth_weight,
          birth_length,
          place_of_birth,
          address_at_birth,
          time_of_birth,
          attendant_at_birth,
          type_of_delivery,
          ballards_score,
          hearing_test_date,
          newborn_screening_date,
          newborn_screening_result
        `)
        .eq('patient_id', patientId)
        .eq('is_deleted', false)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching birth history:', error);
      throw error;
    }
  },

  // Upsert patient birth history
  updatePatientBirthHistory: async (patientId, birthData) => {
    try {
      const payload = {
        patient_id: patientId,
        birth_weight: birthData.birth_weight,
        birth_length: birthData.birth_length,
        place_of_birth: birthData.place_of_birth,
        address_at_birth: birthData.address_at_birth,
        time_of_birth: birthData.time_of_birth,
        attendant_at_birth: birthData.attendant_at_birth,
        type_of_delivery: birthData.type_of_delivery,
        ballards_score: birthData.ballards_score,
        hearing_test_date: birthData.hearing_test_date,
        newborn_screening_date: birthData.newborn_screening_date,
        newborn_screening_result: birthData.newborn_screening_result,
        updated_at: new Date().toISOString()
      };
      const { data, error } = await supabase
        .from('birthhistory')
        .upsert(payload, { onConflict: 'patient_id' })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating birth history:', error);
      throw error;
    }
  },

  // Get patient vitals (latest)
  getPatientVitals: async (patientId) => {
    try {
      const { data, error } = await supabase
        .from('vitalsigns')
        .select('*')
        .eq('patient_id', patientId)
        .order('recorded_date', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching patient vitals:', error);
      throw error;
    }
  },

  // Add new patient vitals record
  updatePatientVitals: async (patientId, vitalsData) => {
    try {
      const { data, error } = await supabase
        .from('vitalsigns')
        .insert({
          patient_id: patientId,
          weight: vitalsData.weight,
          height: vitalsData.height,
          temperature: vitalsData.temperature,
          notes: vitalsData.notes,
          recorded_by: vitalsData.recorded_by,
          recorded_date: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating patient vitals:', error);
      throw error;
    }
  },

  // Alias functions for test compatibility
  getAllChildren: async (filters = {}, page = 1, limit = 10) => {
    return patientModel.getAllPatients(filters, page, limit);
  },

  getChildById: async (id) => {
    return patientModel.getPatientById(id);
  }
};

module.exports = patientModel;
