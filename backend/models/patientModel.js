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
      if (!data) return null;

      // Fetch guardian phone number and override patient contact_number
      if (data.guardian_id) {
        const { data: guardian, error: guardianErr } = await supabase
          .from('guardians')
          .select('contact_number')
          .eq('guardian_id', data.guardian_id)
          .eq('is_deleted', false)
          .single();
        if (!guardianErr && guardian && guardian.contact_number) {
          data.contact_number = guardian.contact_number;
        }
      }

      // Fetch birth history and attach place_of_birth and address_at_birth distinctly
      try {
        const { data: birthhistory, error: birthErr } = await supabase
          .from('birthhistory')
          .select('place_of_birth, address_at_birth')
          .eq('patient_id', id)
          .eq('is_deleted', false)
          .single();
        if (!birthErr && birthhistory) {
          data.place_of_birth = birthhistory.place_of_birth || null;
          data.address_at_birth = birthhistory.address_at_birth || null;
        }
      } catch (err) {
        console.error('Error fetching birthhistory for patient details:', err);
      }
      return data;
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
      // Validate guardian identifier if provided. The frontend may send either
      // the guardians.guardian_id (primary key) or the guardians.user_id
      // (the linked users.user_id). Normalize to the guardian primary key.
      let validGuardianId = null;
      if (patientData.guardian_id) {
        // Try to find by guardian_id first, then by user_id
        const { data: guardianById, error: byIdErr } = await supabase
          .from('guardians')
          .select('guardian_id')
          .eq('guardian_id', patientData.guardian_id)
          .limit(1)
          .single();

        if (!byIdErr && guardianById) {
          validGuardianId = guardianById.guardian_id;
        } else {
          // Try resolving by user_id (common when frontend passes selected user's id)
          const { data: guardianByUser, error: byUserErr } = await supabase
            .from('guardians')
            .select('guardian_id')
            .eq('user_id', patientData.guardian_id)
            .limit(1)
            .single();

          if (!byUserErr && guardianByUser) {
            validGuardianId = guardianByUser.guardian_id;
          } else {
            console.log(`Warning: Guardian not found for identifier ${patientData.guardian_id}, setting to null`);
          }
        }
      }
      
      const insertData = {
        firstname: patientData.firstname,
        surname: patientData.surname,
        middlename: patientData.middlename,
        date_of_birth: patientData.date_of_birth,
        sex: patientData.sex,
        address: patientData.address,
        barangay: patientData.barangay,
        health_center: patientData.health_center,
        guardian_id: validGuardianId, // Use validated guardian_id or null
        relationship_to_guardian: patientData.relationship_to_guardian || null,
        mother_name: patientData.mother_name,
        mother_occupation: patientData.mother_occupation,
        mother_contact_number: patientData.mother_contact_number,
        father_name: patientData.father_name,
        father_occupation: patientData.father_occupation,
        father_contact_number: patientData.father_contact_number,
        family_number: patientData.family_number || `FAM-${Date.now()}`, // Generate if null
        tags: null, // Force null for tags due to database constraint
        created_by: patientData.created_by || null
      };

      console.log('Creating patient:', {
        name: `${patientData.firstname} ${patientData.surname}`,
        date_of_birth: patientData.date_of_birth
      });

      const { data, error } = await supabase
        .from('patients')
        .insert(insertData)
        .select()
        .single();
          
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
      delete updateData.age_months;
      delete updateData.birthhistory; // Remove birthhistory if present

      // Normalize guardian_id to valid primary key
      let validGuardianId = null;
      if (updateData.guardian_id) {
        // Try to find by guardian_id first, then by user_id
        const { data: guardianById, error: byIdErr } = await supabase
          .from('guardians')
          .select('guardian_id')
          .eq('guardian_id', updateData.guardian_id)
          .limit(1)
          .single();
        if (!byIdErr && guardianById) {
          validGuardianId = guardianById.guardian_id;
        } else {
          const { data: guardianByUser, error: byUserErr } = await supabase
            .from('guardians')
            .select('guardian_id')
            .eq('user_id', updateData.guardian_id)
            .limit(1)
            .single();
          if (!byUserErr && guardianByUser) {
            validGuardianId = guardianByUser.guardian_id;
          } else {
            console.log(`Warning: Guardian not found for identifier ${updateData.guardian_id}, setting to null`);
          }
        }
      }
      updateData.guardian_id = validGuardianId;

      console.log('Updating patient:', {
        patient_id: id,
        date_of_birth: patientData.date_of_birth
      });

      // Ensure updated_by is present if provided
      if (patientData.updated_by) updateData.updated_by = patientData.updated_by;

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
      console.debug('updatePatientBirthHistory payload:', JSON.stringify(payload));
      // Try the straightforward upsert first
      const { data, error } = await supabase
        .from('birthhistory')
        .upsert(payload, { onConflict: 'patient_id' })
        .select()
        .single();

      if (!error) {
        console.debug('updatePatientBirthHistory result (upsert):', data);
        return data;
      }

      // If Postgres complains about missing unique constraint (42P10), fall back
      // to a safe select -> insert or update flow to avoid blocking patient creation.
      if (error && error.code === '42P10') {
        console.warn('Upsert failed due to missing unique constraint, falling back to select/insert/update');

        // Check if a birthhistory record already exists
        const { data: existing, error: selErr } = await supabase
          .from('birthhistory')
          .select('*')
          .eq('patient_id', patientId)
          .eq('is_deleted', false)
          .limit(1)
          .single();

        if (selErr && selErr.code !== 'PGRST116') {
          console.error('Error checking existing birthhistory during fallback:', selErr);
          throw selErr;
        }

        if (existing) {
          // Update the existing record
          const { data: updData, error: updErr } = await supabase
            .from('birthhistory')
            .update(payload)
            .eq('birthhistory_id', existing.birthhistory_id)
            .select()
            .single();

          if (updErr) {
            console.error('Error updating existing birthhistory during fallback:', updErr);
            throw updErr;
          }
          console.debug('updatePatientBirthHistory result (fallback update):', updData);
          return updData;
        }

        // No existing row - insert new
        const { data: insData, error: insErr } = await supabase
          .from('birthhistory')
          .insert(payload)
          .select()
          .single();

        if (insErr) {
          console.error('Error inserting birthhistory during fallback:', insErr);
          throw insErr;
        }
        console.debug('updatePatientBirthHistory result (fallback insert):', insData);
        return insData;
      }

      console.error('Supabase upsert birthhistory error:', error);
      throw error;
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

  // Update patient schedule statuses using database function
  updatePatientSchedules: async (patientId) => {
    try {
      // Call the database function to update schedule statuses for this patient
      const result = await supabase.rpc('update_patient_schedule_statuses');

      return { data: result, error: null };
    } catch (error) {
      console.error('Error updating patient schedules:', error);
      return { data: null, error };
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
