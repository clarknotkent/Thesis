const serviceSupabase = require('../db');
const { updateMessagesForPatient } = require('../services/smsReminderService');

function withClient(client) {
  return client || serviceSupabase;
}

const patientModel = {
  // Fetch all patients with optional filters and pagination (reads from patients_view)
  getAllPatients: async (filters = {}, page = 1, limit = 5, client) => {
    try {
      const supabase = withClient(client);
      let query = supabase
        .from('patients_view')
        .select('*', { count: 'exact' });

      // Apply filters
      if (filters.search) {
        // patients_view exposes 'full_name' rather than 'patient_name'
        query = query.ilike('full_name', `%${filters.search}%`);
      }

      if (filters.sexOptions && Array.isArray(filters.sexOptions) && filters.sexOptions.length > 0) {
        // Match any of the provided encodings exactly (e.g., Male, male, M, m)
        query = query.in('sex', filters.sexOptions);
      } else if (filters.sex) {
        query = query.eq('sex', filters.sex);
      }

      if (filters.barangay) {
        query = query.eq('barangay', filters.barangay);
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

      // Additional tag/status filters
      if (filters.status) {
        const status = String(filters.status).toLowerCase();
        if (status === 'fic' || status === 'completed' || status === 'up_to_date' || status === 'uptodate' || status === 'up-to-date') {
          // Treat 'completed' as FIC
          query = query.ilike('tags', '%FIC%');
        } else if (status === 'cic') {
          query = query.ilike('tags', '%CIC%');
        } else if (status === 'defaulter') {
          query = query.ilike('tags', '%Defaulter%');
        } else if (status === 'active') {
          // Active patients (not deleted). Fallback to is_deleted=false if present
          query = query.eq('is_deleted', false);
        } else if (status === 'inactive') {
          // Inactive (soft-deleted) patients
          query = query.eq('is_deleted', true);
        } else if (status === 'due') {
          // Patients who have at least one schedule with status 'Due' or 'Overdue'
          const { data: sch, error: schErr } = await supabase
            .from('patientschedule_view')
            .select('patient_id')
            .in('status', ['Due', 'Overdue']);
          if (schErr) throw schErr;
          const ids = Array.from(new Set((sch || []).map(r => r.patient_id).filter(v => v != null)));
          if (ids.length === 0) {
            // No matches; short-circuit with empty result
            return {
              patients: [],
              totalCount: 0,
              page: parseInt(page),
              limit: parseInt(limit),
              totalPages: 0
            };
          }
          query = query.in('patient_id', ids);
        }
      }

      // Apply pagination
      const offset = (page - 1) * limit;
      const { data, error, count } = await query
        .range(offset, offset + limit - 1)
        .order('patient_id', { ascending: true });

      if (error) throw error;

      // Compute age months/days for each patient
      const withAge = (data || []).map(p => {
        const birth = p.date_of_birth ? new Date(p.date_of_birth) : null;
        if (!birth) return { ...p, age_months: null, age_days: null };
        const today = new Date();
        let months = (today.getFullYear() - birth.getFullYear()) * 12 + (today.getMonth() - birth.getMonth());
        if (today.getDate() < birth.getDate()) months--;
        const ref = new Date(today.getFullYear(), today.getMonth(), 0).getDate();
        const days = (today.getDate() >= birth.getDate()) ? (today.getDate() - birth.getDate()) : (ref - birth.getDate() + today.getDate());
        return { ...p, age_months: Math.max(0, months), age_days: Math.max(0, days) };
      });

      return {
        patients: withAge,
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

  // List recorded parents based on existing patient records' relationship_to_guardian and guardian links
  // type: 'mother' | 'father'
  listRecordedParents: async (type = 'mother', client) => {
    try {
      const supabase = withClient(client);
      const rel = (type || 'mother').toString().toLowerCase() === 'father' ? 'Father' : 'Mother';
      // Get distinct guardian_ids from patients where relationship matches
      const { data: rows, error: pErr } = await supabase
        .from('patients')
        .select('guardian_id')
        .eq('is_deleted', false)
        .eq('relationship_to_guardian', rel)
        .not('guardian_id', 'is', null);
      if (pErr) throw pErr;
      const ids = Array.from(new Set((rows || []).map(r => r.guardian_id).filter(Boolean)));
      if (ids.length === 0) return [];

      // Join guardians -> users to get names, sex, and contact
      const { data: guardians, error: gErr } = await supabase
        .from('guardians')
        .select(`
          guardian_id,
          contact_number,
          occupation,
          users:users!guardians_user_id_fkey (
            user_id,
            firstname,
            middlename,
            surname,
            sex,
            contact_number
          )
        `)
        .in('guardian_id', ids)
        .eq('is_deleted', false);
      if (gErr) throw gErr;

      const preferredSex = rel === 'Mother' ? 'Female' : 'Male';
      const list = (guardians || []).map(g => {
        const u = Array.isArray(g.users) ? g.users[0] : g.users;
        const firstname = u?.firstname || null;
        const middlename = u?.middlename || null;
        const surname = u?.surname || null;
        const name = [firstname, middlename, surname].filter(Boolean).join(' ').trim();
        return {
          guardian_id: g.guardian_id,
          full_name: name,
          sex: u?.sex || null,
          contact_number: g.contact_number || u?.contact_number || null,
          occupation: g.occupation || null,
        };
      });

      // Filter by sex if available; otherwise include all
      const filtered = list.filter(item => {
        if (!item.sex) return true; // no sex recorded, keep
        const s = item.sex.toString().trim().toLowerCase();
        if (preferredSex === 'Female') return s === 'female' || s === 'f' || s.startsWith('f');
        if (preferredSex === 'Male') return s === 'male' || s === 'm' || s.startsWith('m');
        return true;
      });
      // Sort by name for nicer suggestions
      filtered.sort((a,b) => (a.full_name || '').localeCompare(b.full_name || ''));
      return filtered;
    } catch (error) {
      console.error('Error listing recorded parents:', error);
      throw error;
    }
  },

  // Distinct list of parent names from patients table fields (mother_name/father_name)
  listDistinctParentNames: async (type = 'mother', client) => {
    try {
      const supabase = withClient(client);
      const field = (type || 'mother').toString().toLowerCase() === 'father' ? 'father_name' : 'mother_name';
      const { data, error } = await supabase
        .from('patients')
        .select(field)
        .neq(field, null)
        .not(field, 'eq', '')
        .eq('is_deleted', false)
        .limit(2000);
      if (error) throw error;
      const set = new Set();
      (data || []).forEach(row => {
        const v = (row && row[field]) ? String(row[field]).trim() : '';
        if (v) set.add(v);
      });
      return Array.from(set).sort((a,b) => a.localeCompare(b));
    } catch (error) {
      console.error('Error listing distinct parent names:', error);
      throw error;
    }
  },

  // Given a parent name on one side, infer the most common co-parent from patients data
  // type 'mother' => find most common father_name for this mother_name
  // type 'father' => find most common mother_name for this father_name
  getCoParentForName: async (type = 'mother', name, client) => {
    try {
      if (!name) return null;
      const supabase = withClient(client);
      const isMother = (type || 'mother').toString().toLowerCase() === 'mother';
      const srcField = isMother ? 'mother_name' : 'father_name';
      const tgtField = isMother ? 'father_name' : 'mother_name';
      const tgtContactField = isMother ? 'father_contact_number' : 'mother_contact_number';
      const { data, error } = await supabase
        .from('patients')
        .select(`${tgtField}, ${tgtContactField}`)
        .eq(srcField, name)
        .neq(tgtField, null)
        .not(tgtField, 'eq', '')
        .eq('is_deleted', false)
        .limit(2000);
      if (error) throw error;
      // Count frequency and capture most common contact per name
      const counts = new Map();
      const contactCounts = new Map(); // name -> Map(contact->count)
      (data || []).forEach(row => {
        const v = row && row[tgtField] ? String(row[tgtField]).trim() : '';
        if (!v) return;
        counts.set(v, (counts.get(v) || 0) + 1);
        const contact = row && row[tgtContactField] ? String(row[tgtContactField]).trim() : '';
        if (contact) {
          if (!contactCounts.has(v)) contactCounts.set(v, new Map());
          const cmap = contactCounts.get(v);
          cmap.set(contact, (cmap.get(contact) || 0) + 1);
        }
      });
      if (counts.size === 0) return null;
      // Pick the highest count; if tie, lexicographically smallest
      let best = null; let bestCount = -1;
      for (const [k, c] of counts.entries()) {
        if (c > bestCount || (c === bestCount && (best == null || k.localeCompare(best) < 0))) {
          best = k; bestCount = c;
        }
      }
      let bestContact = null;
      if (best && contactCounts.has(best)) {
        const cmap = contactCounts.get(best);
        // pick most common contact; if tie choose lexicographically smallest
        let bc = null; let bcCount = -1;
        for (const [contact, c] of cmap.entries()) {
          if (c > bcCount || (c === bcCount && (bc == null || contact.localeCompare(bc) < 0))) {
            bc = contact; bcCount = c;
          }
        }
        bestContact = bc;
      }
      return { name: best, count: bestCount, contact_number: bestContact };
    } catch (error) {
      console.error('Error getting co-parent for name:', error);
      throw error;
    }
  },

  // Suggestions of parents with contacts, deduped, from patients table only (no guardians)
  listParentsWithContacts: async (type = 'mother', client) => {
    try {
      const supabase = withClient(client);
      const isMother = (type || 'mother').toString().toLowerCase() === 'mother';
      const nameField = isMother ? 'mother_name' : 'father_name';
      const contactField = isMother ? 'mother_contact_number' : 'father_contact_number';
      const { data, error } = await supabase
        .from('patients')
        .select(`${nameField}, ${contactField}`)
        .neq(nameField, null)
        .not(nameField, 'eq', '')
        .eq('is_deleted', false)
        .limit(5000);
      if (error) throw error;
      // Build a map of name -> contact frequency; prefer most common contact
      const byName = new Map();
      (data || []).forEach(row => {
        const name = row && row[nameField] ? String(row[nameField]).trim() : '';
        if (!name) return;
        const contact = row && row[contactField] ? String(row[contactField]).trim() : '';
        if (!byName.has(name)) byName.set(name, new Map());
        if (contact) {
          const cmap = byName.get(name);
          cmap.set(contact, (cmap.get(contact) || 0) + 1);
        } else {
          // Record empty contact presence to ensure the name is included even if no contact recorded
          const cmap = byName.get(name);
          cmap.set('', (cmap.get('') || 0) + 1);
        }
      });
      // Create array, picking most common contact
      const list = [];
      for (const [name, cmap] of byName.entries()) {
        let bestContact = '';
        let bestCount = -1;
        for (const [contact, c] of cmap.entries()) {
          if (c > bestCount || (c === bestCount && contact.localeCompare(bestContact) < 0)) {
            bestContact = contact; bestCount = c;
          }
        }
        list.push({ full_name: name, contact_number: bestContact || null });
      }
      // Sort by name
      list.sort((a,b) => (a.full_name || '').localeCompare(b.full_name || ''));
      return list;
    } catch (error) {
      console.error('Error listing parents with contacts:', error);
      throw error;
    }
  },

  // Get patient by ID (reads from patients_view)
  getPatientById: async (id, client) => {
    try {
      const supabase = withClient(client);
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
  createPatient: async (patientData, client) => {
    try {
      const supabase = withClient(client);
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
        created_by: patientData.created_by || null,
        updated_by: patientData.created_by || patientData.updated_by || null
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
  updatePatient: async (id, patientData, client) => {
    try {
      const supabase = withClient(client);
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

      // CASCADE UPDATE: Update SMS messages if patient name changed (NON-BLOCKING)
      if (patientData.firstname || patientData.lastname || patientData.middlename) {
        // Run cascade in background without awaiting
        setImmediate(async () => {
          try {
            await updateMessagesForPatient(id, supabase);
            console.log(`[updatePatient] Successfully cascaded name update for patient ${id}`);
          } catch (cascadeErr) {
            console.warn('[patientModel] Failed to cascade patient name update to SMS messages:', cascadeErr?.message || cascadeErr);
          }
        });
      }

      return data;
    } catch (error) {
      console.error('Error updating patient:', error);
      throw error;
    }
  },

  // Soft delete a patient
  deletePatient: async (id, deletedBy, client) => {
    try {
      const supabase = withClient(client);
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
  getPatientVaccinationSchedule: async (patientId, client) => {
    try {
      const supabase = withClient(client);
      const { data, error } = await supabase
        .from('patientschedule_view')
        .select('*')
        .eq('patient_id', patientId)
        .order('scheduled_date', { ascending: true });

      if (error) throw error;

      // Compute status updates based on dates and update database
      const updates = [];
      const processedData = data.map(schedule => {
        const dbStatus = schedule.status;

        // Only override status for Pending, Rescheduled, or Scheduled
        if (['Pending', 'Rescheduled', 'Scheduled'].includes(dbStatus)) {
          const scheduledDate = new Date(schedule.scheduled_date);
          const today = new Date();

          // Normalize to date only (remove time)
          const scheduledDateOnly = new Date(scheduledDate.getFullYear(), scheduledDate.getMonth(), scheduledDate.getDate());
          const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());

          let newStatus = dbStatus;

          // Check if scheduled date is today
          if (scheduledDateOnly.getTime() === todayOnly.getTime()) {
            newStatus = 'Due';
          }
          // Check if scheduled date is in the future
          else if (scheduledDateOnly > todayOnly && dbStatus !== 'Rescheduled') {
            newStatus = 'Scheduled';
          }
          // Check if scheduled date is in the past but within the same week (before Sunday)
          else if (scheduledDateOnly < todayOnly) {
            // Find Sunday of the same week as scheduled_date
            const dayOfWeek = scheduledDateOnly.getDay(); // 0 = Sunday, 1 = Monday, etc.
            const sundayOfWeek = new Date(scheduledDateOnly);
            sundayOfWeek.setDate(scheduledDateOnly.getDate() - dayOfWeek + 7); // Next Sunday

            // If today is before or on Sunday of the scheduled week, mark as Overdue
            if (todayOnly <= sundayOfWeek) {
              newStatus = 'Overdue';
            }
          }

          // If status changed, add to update queue
          if (newStatus !== dbStatus) {
            updates.push({
              patient_schedule_id: schedule.patient_schedule_id,
              new_status: newStatus
            });
          }

          return { ...schedule, status: newStatus };
        }

        // Return original schedule if no status override
        return schedule;
      });

      // Perform database updates for status changes
      if (updates.length > 0) {
        console.log(`[Patient Schedule] Updating ${updates.length} schedule statuses for patient ${patientId}`);

        for (const update of updates) {
          const { error: updateError } = await supabase
            .from('patientschedule')
            .update({
              status: update.new_status,
              updated_at: new Date().toISOString()
            })
            .eq('patient_schedule_id', update.patient_schedule_id);

          if (updateError) {
            console.error(`Failed to update schedule ${update.patient_schedule_id}:`, updateError);
            // Continue with other updates even if one fails
          }
        }
      }

      return processedData;
    } catch (error) {
      console.error('Error fetching patient schedule:', error);
      throw error;
    }
  },

  // Update patient tag(s)
  updatePatientTag: async (patientId, tag, client) => {
    try {
      const supabase = withClient(client);
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
  getPatientBirthHistory: async (patientId, client) => {
    try {
      const supabase = withClient(client);
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
  updatePatientBirthHistory: async (patientId, birthData, client) => {
    try {
      const supabase = withClient(client);
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
        updated_at: new Date().toISOString(),
        created_by: birthData.created_by || null,
        updated_by: birthData.updated_by || null,
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
  getPatientVitals: async (patientId, client) => {
    try {
      const supabase = withClient(client);
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
  updatePatientVitals: async (patientId, vitalsData, client) => {
    try {
      const supabase = withClient(client);
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
  updatePatientSchedules: async (patientId, client) => {
    try {
      // Call the database function to update schedule statuses for this patient
      const supabase = withClient(client);
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
