import supabase from '../db.js';
import { updatePhoneNumberForPatient, updateMessagesForPatient } from '../services/smsReminderService.js';

const guardianModel = {
  // Fetch all guardians (for dropdown) from users table where role is Guardian/Parent and ensure active guardian rows exist
  getAllGuardians: async () => {
    try {
      // Join users with guardians table to get family_number (left join to include users without guardian records)
      const { data, error } = await supabase
        .from('users')
        .select(`
          user_id,
          surname,
          firstname,
          middlename,
          sex,
          contact_number,
          email,
          address,
          guardians:guardians!guardians_user_id_fkey (
            guardian_id,
            user_id,
            family_number,
            is_deleted,
            occupation
          )
        `)
        // Support both Guardian and Parent roles (and mixed variants) in case naming varies
        .in('role', ['Guardian','Parent','guardian','parent','guardian-parent'])
        .eq('is_deleted', false)
        .order('surname', { ascending: true });

      if (error) throw error;

      const result = []
      // Ensure each eligible user has an active guardian row; restore/create when missing
      for (const user of (data || [])) {
        let g = Array.isArray(user.guardians) ? user.guardians.find(x => x && x.is_deleted === false) || null : null;

        // If no active guardian row, try to ensure it exists/restored based on user role
        if (!g) {
          try {
            const ensured = await guardianModel.ensureGuardianForUser(user.user_id)
            if (ensured && ensured.guardian_id && ensured.is_deleted === false) {
              g = ensured
            }
          } catch (ensureErr) {
            // Non-blocking: if ensure fails, we just skip adding this entry
            console.warn('[getAllGuardians] ensureGuardianForUser failed for user', user.user_id, ensureErr?.message || ensureErr)
          }
        }

        // Only include entries with a valid active guardian_id (frontend requires guardian_id to bind)
        if (g && g.guardian_id) {
          result.push({
            guardian_id: g.guardian_id,
            user_id: user.user_id,
            surname: user.surname,
            firstname: user.firstname,
            middlename: user.middlename,
            sex: user.sex || null,
            contact_number: user.contact_number,
            email: user.email,
            address: user.address,
            family_number: g.family_number || '',
            occupation: g.occupation || null,
            full_name: `${user.surname}, ${user.firstname} ${user.middlename || ''}`.trim()
          })
        }
      }

      return result;
    } catch (error) {
      console.error('Error fetching guardians:', error);
      throw error;
    }
  },

  // Get guardian by ID
  getGuardianById: async (id) => {
    try {
      const { data, error } = await supabase
        .from('guardians')
        .select('*')
        .eq('guardian_id', id)
        .eq('is_deleted', false)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data || null;
    } catch (error) {
      console.error('Error fetching guardian by ID:', error);
      throw error;
    }
  },

  // Create a new guardian
  createGuardian: async (guardianData) => {
    try {
      // Auto-generate family_number if not provided (column is NOT NULL)
      let familyNumber = guardianData.family_number;
      if (!familyNumber) {
        familyNumber = 'FAM-' + Date.now().toString(36).toUpperCase() + '-' + Math.floor(Math.random() * 1e4).toString().padStart(4, '0');
      }
      const { data, error } = await supabase
        .from('guardians')
        .insert({
          surname: guardianData.surname,
          firstname: guardianData.firstname,
          middlename: guardianData.middlename,
          birthdate: guardianData.birthdate,
          address: guardianData.address,
          occupation: guardianData.occupation,
          contact_number: guardianData.contact_number,
          alternative_contact_number: guardianData.alternative_contact_number,
          email: guardianData.email,
          family_number: familyNumber,
          user_id: guardianData.user_id,
          created_by: guardianData.created_by || guardianData.user_id || null,
          updated_by: guardianData.updated_by || guardianData.user_id || null
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating guardian:', error);
      throw error;
    }
  },

  // Update a guardian
  updateGuardian: async (id, guardianData) => {
    try {
      // Check if contact_number is being updated
      const isPhoneUpdate = guardianData.contact_number !== undefined;
      const oldContactNumber = isPhoneUpdate ? await (async () => {
        const { data } = await supabase
          .from('guardians')
          .select('contact_number')
          .eq('guardian_id', id)
          .single();
        return data?.contact_number;
      })() : null;

      const { data, error } = await supabase
        .from('guardians')
        .update({
          ...guardianData,
          updated_at: new Date().toISOString()
        })
        .eq('guardian_id', id)
        .eq('is_deleted', false)
        .select()
        .single();

      if (error) throw error;

      // CASCADE UPDATE: Update phone numbers in SMS logs if contact changed (NON-BLOCKING)
      if (isPhoneUpdate && guardianData.contact_number !== oldContactNumber) {
        // Run cascade in background without awaiting
        setImmediate(async () => {
          try {
            const { data: patients, error: pErr } = await supabase
              .from('patients')
              .select('patient_id')
              .eq('guardian_id', id)
              .eq('is_deleted', false);

            if (!pErr && patients && patients.length > 0) {
              for (const patient of patients) {
                await updatePhoneNumberForPatient(patient.patient_id, guardianData.contact_number, supabase);
              }
              console.log(`[updateGuardian] Successfully cascaded phone update to ${patients.length} patient(s)`);
            }
          } catch (cascadeErr) {
            console.warn('[guardianModel] Failed to cascade phone update to SMS logs:', cascadeErr?.message || cascadeErr);
          }
        });
      }

      // CASCADE UPDATE: Update messages if name changed (NON-BLOCKING)
      if (guardianData.firstname || guardianData.lastname || guardianData.middlename) {
        // Run cascade in background without awaiting
        setImmediate(async () => {
          try {
            const { data: patients, error: pErr } = await supabase
              .from('patients')
              .select('patient_id')
              .eq('guardian_id', id)
              .eq('is_deleted', false);

            if (!pErr && patients && patients.length > 0) {
              for (const patient of patients) {
                await updateMessagesForPatient(patient.patient_id, supabase);
              }
              console.log(`[updateGuardian] Successfully cascaded name update to ${patients.length} patient(s)`);
            }
          } catch (cascadeErr) {
            console.warn('[guardianModel] Failed to cascade name update to SMS messages:', cascadeErr?.message || cascadeErr);
          }
        });
      }

      return data;
    } catch (error) {
      console.error('Error updating guardian:', error);
      throw error;
    }
  },

  // Soft delete a guardian
  deleteGuardian: async (id, deletedBy) => {
    try {
      const { data, error } = await supabase
        .from('guardians')
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
          deleted_by: deletedBy
        })
        .eq('guardian_id', id)
        .select()
        .single();

      if (error) throw error;
      // Mark related pending scheduled SMS logs as soft-deleted/cancelled synchronously
      let cancelledSmsCount = 0;
      try {
        const { data: updatedSms, error: updErr } = await supabase
          .from('sms_logs')
          .update({
            is_deleted: true,
            status: 'cancelled',
            error_message: 'Cancelled: guardian soft-deleted',
            updated_at: new Date().toISOString()
          })
          .eq('guardian_id', id)
          .eq('status', 'pending')
          .eq('type', 'scheduled')
          .select('id');

        if (updErr) {
          console.warn('[deleteGuardian] Cascade update returned error:', updErr?.message || updErr);
        } else {
          cancelledSmsCount = Array.isArray(updatedSms) ? updatedSms.length : 0;
          console.log(`[deleteGuardian] Marked ${cancelledSmsCount} pending scheduled SMS for guardian ${id} as cancelled and is_deleted=true`);
        }
      } catch (cascadeErr) {
        console.warn('[deleteGuardian] Failed to cascade cancel SMS:', cascadeErr?.message || cascadeErr);
      }

      // Return both the guardian update result and number of cancelled SMS for visibility
      return { guardian: data, cancelledSmsCount };
    } catch (error) {
      console.error('Error deleting guardian:', error);
      throw error;
    }
  },

  // Ensure a guardian row exists for a given users.user_id when role is Guardian
  // If a guardian exists (even soft-deleted), it will be returned/restored; otherwise, it will insert a new row.
  ensureGuardianForUser: async (userOrId, actorId = null) => {
    try {
      // Resolve user basic fields
      let userRow = null;
      if (userOrId && typeof userOrId === 'object' && userOrId.user_id) {
        userRow = userOrId;
      } else {
        const userId = userOrId;
        const { data: fetched, error: uErr } = await supabase
          .from('users')
          .select('user_id, role, surname, firstname, middlename, email, address, contact_number, birthdate')
          .eq('user_id', userId)
          .single();
        if (uErr) throw uErr;
        userRow = fetched;
      }

      if (!userRow) throw new Error('ensureGuardianForUser: user not found');

      // Only proceed if role indicates Guardian
      const r = String(userRow.role || '').toLowerCase();
      if (!['guardian', 'parent', 'guardian-parent'].includes(r)) {
        return null; // nothing to do
      }

      // Check for existing guardian by user_id
      const { data: existing, error: gErr } = await supabase
        .from('guardians')
        .select('guardian_id, is_deleted, family_number')
        .eq('user_id', userRow.user_id)
        .limit(1)
        .maybeSingle();
      if (gErr) throw gErr;

      if (existing && existing.guardian_id) {
        if (existing.is_deleted) {
          // Restore and patch core fields from user
          const { data: restored, error: restErr } = await supabase
            .from('guardians')
            .update({
              is_deleted: false,
              deleted_at: null,
              deleted_by: null,
              surname: userRow.surname,
              firstname: userRow.firstname,
              middlename: userRow.middlename || null,
              email: userRow.email || null,
              address: userRow.address || null,
              contact_number: userRow.contact_number || null,
              updated_at: new Date().toISOString(),
              birthdate: userRow.birthdate || null,
              updated_by: actorId || userRow.user_id || null,
            })
            .eq('guardian_id', existing.guardian_id)
            .select('*')
            .single();
          if (restErr) throw restErr;
          // Non-blocking: restore any sms_logs that were soft-deleted when guardian was deleted
          setImmediate(async () => {
            try {
              const nowIso = new Date().toISOString();
              // First, mark sms_logs as not deleted
              await supabase
                .from('sms_logs')
                .update({ is_deleted: false, updated_at: new Date().toISOString() })
                .eq('guardian_id', existing.guardian_id)
                .eq('is_deleted', true);

              // Restore scheduled future messages to pending so scheduler can pick them again
              await supabase
                .from('sms_logs')
                .update({ status: 'pending', updated_at: new Date().toISOString(), error_message: null })
                .eq('guardian_id', existing.guardian_id)
                .eq('is_deleted', false)
                .eq('type', 'scheduled')
                .gte('scheduled_at', nowIso);

              console.log(`[ensureGuardianForUser] Restored sms_logs for guardian ${existing.guardian_id}`);
            } catch (restoreErr) {
              console.warn('[ensureGuardianForUser] Failed to restore sms_logs for guardian (non-blocking):', restoreErr?.message || restoreErr);
            }
          });
          return restored;
        }
        return existing; // already present and active
      }

      // Insert new guardian row using user details
      const familyNumber = 'FAM-' + Date.now().toString(36).toUpperCase() + '-' + Math.floor(Math.random() * 1e4).toString().padStart(4, '0');
      const { data: inserted, error: insErr } = await supabase
        .from('guardians')
        .insert({
          user_id: userRow.user_id,
          surname: userRow.surname,
          firstname: userRow.firstname,
          middlename: userRow.middlename || null,
          email: userRow.email || null,
          address: userRow.address || null,
          contact_number: userRow.contact_number || null,
          family_number: familyNumber,
          birthdate: userRow.birthdate || null,
          created_by: actorId || userRow.user_id || null,
          updated_by: actorId || userRow.user_id || null,
        })
        .select('*')
        .single();
      if (insErr) throw insErr;
      return inserted;
    } catch (error) {
      console.error('Error ensuring guardian for user:', error);
      throw error;
    }
  },

  // Synchronize an existing guardian's core fields from the corresponding users row.
  // If guardian row does not exist, it will be created/restored first.
  syncGuardianFromUser: async (userOrId, actorId = null) => {
    try {
      // Resolve user
      let userRow = null;
      if (userOrId && typeof userOrId === 'object' && userOrId.user_id) {
        userRow = userOrId;
      } else {
        const userId = userOrId;
        const { data: fetched, error: uErr } = await supabase
          .from('users')
          .select('user_id, role, surname, firstname, middlename, email, address, contact_number, birthdate')
          .eq('user_id', userId)
          .single();
        if (uErr) throw uErr;
        userRow = fetched;
      }

      if (!userRow) throw new Error('syncGuardianFromUser: user not found');

      const r = String(userRow.role || '').toLowerCase();
      if (!['guardian','parent','guardian-parent'].includes(r)) return null;

      // Ensure guardian exists or restore
      const ensured = await guardianModel.ensureGuardianForUser(userRow, actorId);
      const guardianId = ensured?.guardian_id;
      if (!guardianId) return ensured;

      // Get old contact number before update (for cascade comparison)
      const { data: oldGuardian } = await supabase
        .from('guardians')
        .select('contact_number')
        .eq('guardian_id', guardianId)
        .single();

      const oldContactNumber = oldGuardian?.contact_number;

      // Apply sync update
      const { data: updated, error: updErr } = await supabase
        .from('guardians')
        .update({
          surname: userRow.surname,
          firstname: userRow.firstname,
          middlename: userRow.middlename || null,
          email: userRow.email || null,
          address: userRow.address || null,
          contact_number: userRow.contact_number || null,
          birthdate: userRow.birthdate || null,
          updated_by: actorId || userRow.user_id || null,
          updated_at: new Date().toISOString(),
        })
        .eq('guardian_id', guardianId)
        .select('*')
        .single();
      if (updErr) throw updErr;

      // CASCADE UPDATE: Update phone numbers in SMS logs if contact changed (NON-BLOCKING)
      if (userRow.contact_number && userRow.contact_number !== oldContactNumber) {
        // Run cascade in background without awaiting
        setImmediate(async () => {
          try {
            const { data: patients, error: pErr } = await supabase
              .from('patients')
              .select('patient_id')
              .eq('guardian_id', guardianId)
              .eq('is_deleted', false);

            if (!pErr && patients && patients.length > 0) {
              for (const patient of patients) {
                await updatePhoneNumberForPatient(patient.patient_id, userRow.contact_number, supabase);
              }
              console.log(`[syncGuardianFromUser] Successfully cascaded phone update to ${patients.length} patient(s)`);
            }
          } catch (cascadeErr) {
            console.warn('[syncGuardianFromUser] Failed to cascade phone update to SMS logs:', cascadeErr?.message || cascadeErr);
          }
        });
      }

      // CASCADE UPDATE: Update messages if name changed (NON-BLOCKING)
      if (userRow.firstname || userRow.lastname || userRow.middlename) {
        // Run cascade in background without awaiting
        setImmediate(async () => {
          try {
            const { data: patients, error: pErr } = await supabase
              .from('patients')
              .select('patient_id')
              .eq('guardian_id', guardianId)
              .eq('is_deleted', false);

            if (!pErr && patients && patients.length > 0) {
              for (const patient of patients) {
                await updateMessagesForPatient(patient.patient_id, supabase);
              }
              console.log(`[syncGuardianFromUser] Successfully cascaded name update to ${patients.length} patient(s)`);
            }
          } catch (cascadeErr) {
            console.warn('[syncGuardianFromUser] Failed to cascade name update to SMS messages:', cascadeErr?.message || cascadeErr);
          }
        });
      }

      return updated;
    } catch (error) {
      console.error('Error syncing guardian from user:', error);
      throw error;
    }
  }
};

export default guardianModel;
