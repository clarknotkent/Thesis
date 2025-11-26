import serviceSupabase from '../db.js';
import { updateMessagesForPatient } from '../services/smsReminderService.js';
import capacityModel from './capacityModel.js';

function withClient(client) {
  return client || serviceSupabase;
}

// Title Case: Capitalize each word
function toTitleCase(str) {
  if (!str || typeof str !== 'string') return str;
  return str.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
}

// Sentence Case: First letter capital, rest lower
function toSentenceCase(str) {
  if (!str || typeof str !== 'string') return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

const patientModel = {
  // Fetch all patients with optional filters and pagination (reads from patients_view)
  getAllPatients: async (filters = {}, page = 1, limit = 5, client) => {
    try {
      const supabase = withClient(client);
      // Decide source: for archived/deleted listings we must query base table because views may exclude deleted rows
      const rawStatus = filters.status ? String(filters.status).toLowerCase() : '';
      const archivedMode = rawStatus === 'archived' || rawStatus === 'deleted';

      // Global ordering: when not archived and no explicit status slice, show Active patients on earlier pages and push Inactive to the end
      const globalStatusOrder = !archivedMode && (!rawStatus || rawStatus === 'not_archived');
      if (globalStatusOrder) {
        // Build base query with filters and order by status, then paginate
        let baseQuery = supabase
          .from('patients')
          .select('patient_id, is_deleted, status, tags', { count: 'exact' })
          .eq('is_deleted', false);

        if (filters.search) {
          const like = String(filters.search).trim().replace(/%/g, '');
          baseQuery = baseQuery.or(
            `firstname.ilike.%${like}%,middlename.ilike.%${like}%,surname.ilike.%${like}%`
          );
        }
        if (filters.sexOptions && Array.isArray(filters.sexOptions) && filters.sexOptions.length > 0) {
          baseQuery = baseQuery.in('sex', filters.sexOptions);
        } else if (filters.sex) {
          baseQuery = baseQuery.eq('sex', filters.sex);
        }
        if (filters.barangay) {
          baseQuery = baseQuery.eq('barangay', filters.barangay);
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
            baseQuery = baseQuery
              .gte('date_of_birth', startDate.toISOString())
              .lte('date_of_birth', endDate.toISOString());
          }
        }

        const offset = (page - 1) * limit;
        const { data: baseRows, error: baseErr, count } = await baseQuery
          .order('status', { ascending: true, nullsFirst: true })
          .order('patient_id', { ascending: true })
          .range(offset, offset + limit - 1);
        if (baseErr) throw baseErr;

        const ids = Array.from(new Set((baseRows || []).map(r => r.patient_id).filter(v => v !== null)));
        if (ids.length === 0) {
          return {
            patients: [],
            totalCount: count || 0,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil((count || 0) / limit)
          };
        }

        const { data: viewRows, error: viewErr } = await supabase
          .from('patients_view')
          .select('*')
          .in('patient_id', ids);
        if (viewErr) throw viewErr;

        // Compute ages
        const withAge = (viewRows || []).map(p => {
          const birth = p.date_of_birth ? new Date(p.date_of_birth) : null;
          if (!birth) return { ...p, age_months: null, age_days: null };
          const today = new Date();
          let months = (today.getFullYear() - birth.getFullYear()) * 12 + (today.getMonth() - birth.getMonth());
          if (today.getDate() < birth.getDate()) months--;
          const ref = new Date(today.getFullYear(), today.getMonth(), 0).getDate();
          const days = (today.getDate() >= birth.getDate()) ? (today.getDate() - birth.getDate()) : (ref - birth.getDate() + today.getDate());
          return { ...p, age_months: Math.max(0, months), age_days: Math.max(0, days) };
        });

        // Enrich last vaccination
        try {
          const { data: imms, error: immErr } = await supabase
            .from('immunizationhistory_view')
            .select('patient_id, vaccine_id, vaccine_antigen_name, administered_date')
            .in('patient_id', ids)
            .order('administered_date', { ascending: false });
          if (immErr) throw immErr;
          const latestByPatient = new Map();
          for (const row of (imms || [])) {
            const pid = row.patient_id;
            if (!pid) continue;
            if (!latestByPatient.has(pid)) latestByPatient.set(pid, row);
          }
          for (let i = 0; i < withAge.length; i++) {
            const p = withAge[i];
            const last = latestByPatient.get(p.patient_id);
            if (last) {
              withAge[i] = {
                ...p,
                last_vaccination_date: last.administered_date || null,
                last_vaccine_name: last.vaccine_antigen_name || null,
                last_vaccine_id: last.vaccine_id || null,
              };
            }
          }
        } catch (e) {
          console.warn('Failed to enrich patients with last vaccination (non-blocking):', e?.message || e);
        }

        // Attach derived status using the baseRows we already have
        const baseById = new Map((baseRows || []).map(r => [r.patient_id, r]));
        const enriched = withAge.map(p => {
          const base = baseById.get(p.patient_id) || p;
          const isArchived = !!base.is_deleted;
          const rs = (base.status || '').toString().toLowerCase();
          const status = isArchived ? 'archived' : (rs === 'inactive' ? 'inactive' : 'active');
          return { ...p, status };
        });

        // Keep the same order as ids (Active first)
        const orderIndex = new Map(ids.map((v, i) => [v, i]));
        enriched.sort((a, b) => (orderIndex.get(a.patient_id) ?? 0) - (orderIndex.get(b.patient_id) ?? 0));

        return {
          patients: enriched,
          totalCount: count || 0,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil((count || 0) / limit)
        };
      }
      let query = archivedMode
        ? supabase.from('patients').select('*', { count: 'exact' }).eq('is_deleted', true)
        : supabase.from('patients_view').select('*', { count: 'exact' });

      // Apply filters
      if (filters.search) {
        const term = String(filters.search).trim();
        if (archivedMode) {
          // Base table does not have full_name; search across name parts
          // Supabase or() syntax: field.ilike.*|field.ilike.*
          const like = term.replace(/%/g, '');
          query = query.or(
            `firstname.ilike.%${like}%,middlename.ilike.%${like}%,surname.ilike.%${like}%`
          );
        } else {
          // patients_view exposes 'full_name'
          query = query.ilike('full_name', `%${term}%`);
        }
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
        if (status === 'archived' || status === 'deleted') {
          // archivedMode already applies is_deleted=true for base table; nothing extra needed
        } else if (status === 'not_archived') {
          // Show only non-deleted patients
          query = query.eq('is_deleted', false);
        } else if (status === 'active' || status === 'inactive') {
          // Filter by new patients.status field from BASE table, then apply IDs to the listing query
          const desired = status === 'inactive' ? 'Inactive' : 'Active';
          const { data: baseMatch, error: baseMatchErr } = await supabase
            .from('patients')
            .select('patient_id')
            .eq('is_deleted', false)
            .eq('status', desired);
          if (baseMatchErr) throw baseMatchErr;
          const ids = Array.from(new Set((baseMatch || []).map(r => r.patient_id).filter(v => v !== null)));
          if (ids.length === 0) {
            return {
              patients: [],
              totalCount: 0,
              page: parseInt(page),
              limit: parseInt(limit),
              totalPages: 0
            };
          }
          query = query.in('patient_id', ids).eq('is_deleted', false);
        } else if (status === 'fic' || status === 'completed' || status === 'up_to_date' || status === 'uptodate' || status === 'up-to-date') {
          // Treat 'completed' as FIC
          query = query.ilike('tags', '%FIC%');
        } else if (status === 'cic') {
          query = query.ilike('tags', '%CIC%');
        } else if (status === 'defaulter') {
          query = query.ilike('tags', '%Defaulter%');
        } else if (status === 'due') {
          // Patients who have at least one schedule with status 'Due' or 'Overdue'
          const { data: sch, error: schErr } = await supabase
            .from('patientschedule_view')
            .select('patient_id')
            .in('status', ['Due', 'Overdue']);
          if (schErr) throw schErr;
          const ids = Array.from(new Set((sch || []).map(r => r.patient_id).filter(v => v !== null)));
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

      // No extra base-table status lookup required; derive from is_deleted and tags

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

      // Enrich with last vaccination details for this page of patients
      try {
        const ids = withAge.map(p => p.patient_id).filter(Boolean);
        if (ids.length > 0) {
          // Query immunization history for these patients and reduce to the most recent per patient
          const { data: imms, error: immErr } = await supabase
            .from('immunizationhistory_view')
            .select('patient_id, vaccine_id, vaccine_antigen_name, administered_date')
            .in('patient_id', ids)
            .order('administered_date', { ascending: false });
          if (immErr) throw immErr;

          const latestByPatient = new Map();
          for (const row of (imms || [])) {
            const pid = row.patient_id;
            if (!pid) continue;
            if (!latestByPatient.has(pid)) {
              latestByPatient.set(pid, row);
            }
          }

          // Merge last vaccination fields
          for (let i = 0; i < withAge.length; i++) {
            const p = withAge[i];
            const last = latestByPatient.get(p.patient_id);
            if (last) {
              const name = last.vaccine_antigen_name || null;
              withAge[i] = {
                ...p,
                last_vaccination_date: last.administered_date || null,
                last_vaccine_name: name,
                last_vaccine_id: last.vaccine_id || null,
              };
            }
          }
        }
      } catch (enrichErr) {
        console.warn('Failed to enrich patients with last vaccination (non-blocking):', enrichErr?.message || enrichErr);
      }

      // Attach derived status fields from BASE patients table (authoritative for status/is_deleted)
      let baseById = new Map();
      try {
        const ids = withAge.map(p => p.patient_id).filter(Boolean);
        if (ids.length > 0) {
          const { data: baseRows, error: baseErr } = await supabase
            .from('patients')
            .select('patient_id, is_deleted, status, tags')
            .in('patient_id', ids);
          if (baseErr) throw baseErr;
          baseById = new Map((baseRows || []).map(r => [r.patient_id, r]));
        }
      } catch (e) {
        console.warn('Failed to fetch base patient status (non-blocking):', e?.message || e);
      }

      const enriched = withAge.map(p => {
        const base = baseById.get(p.patient_id) || p;
        const isArchived = !!base.is_deleted;
        const rawStatus = (base.status || '').toString().toLowerCase();
        const status = isArchived ? 'archived' : (rawStatus === 'inactive' ? 'inactive' : 'active');
        return { ...p, status };
      });

      return {
        patients: enriched,
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
      const tgtOccupationField = isMother ? 'father_occupation' : 'mother_occupation';
      // First, try strict equality (fast, exact)
      // Use a mutable `data` var because we may replace/filter it in fallback steps below
      const _res = await supabase
        .from('patients')
        .select(`${tgtField}, ${tgtContactField}, ${tgtOccupationField}`)
        .eq(srcField, name)
        .neq(tgtField, null)
        .not(tgtField, 'eq', '')
        .eq('is_deleted', false)
        .limit(2000);
      let data = _res.data || [];
      const error = _res.error;
      if (error) throw error;
      // Fallback: if no rows matched due to case/spacing differences, try ilike and then post-filter by normalized equality
      const normalize = (s) => (s || '').toString().trim().replace(/\s+/g, ' ').toLowerCase();
      const normalizedTarget = normalize(name);
      if (!data || data.length === 0) {
        const likeTerm = name.toString().trim().replace(/%/g, '').replace(/\s+/g, ' ');
        const { data: altData, error: altErr } = await supabase
          .from('patients')
          .select(`${srcField}, ${tgtField}, ${tgtContactField}, ${tgtOccupationField}`)
          .ilike(srcField, `%${likeTerm}%`)
          .neq(tgtField, null)
          .not(tgtField, 'eq', '')
          .eq('is_deleted', false)
          .limit(2000);
        if (altErr) throw altErr;
        data = (altData || []).filter(r => normalize(r[srcField]) === normalizedTarget);
        // Additional fallback: match on first and last tokens ignoring middle names/initials
        if (!data || data.length === 0) {
          const tokens = normalizedTarget.split(' ').filter(Boolean);
          const firstToken = tokens[0] || '';
          const lastToken = tokens[tokens.length - 1] || '';
          if (lastToken) {
            const { data: altData2, error: altErr2 } = await supabase
              .from('patients')
              .select(`${srcField}, ${tgtField}, ${tgtContactField}, ${tgtOccupationField}`)
              .ilike(srcField, `%${lastToken}%`)
              .neq(tgtField, null)
              .not(tgtField, 'eq', '')
              .eq('is_deleted', false)
              .limit(2000);
            if (altErr2) throw altErr2;
            const tokenize = (s) => (s || '').toString().trim().replace(/\s+/g, ' ').toLowerCase().split(' ').filter(Boolean);
            data = (altData2 || []).filter(r => {
              const toks = tokenize(r[srcField]);
              if (toks.length === 0) return false;
              const candFirst = toks[0];
              const candLast = toks[toks.length - 1];
              return candLast === lastToken && (!firstToken || candFirst === firstToken);
            });
          }
        }
      }
      // Count frequency and capture most common contact per name
      const counts = new Map();
      const contactCounts = new Map(); // name -> Map(contact->count)
      const occupationCounts = new Map(); // name -> Map(occupation->count)
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
        const occ = row && row[tgtOccupationField] ? String(row[tgtOccupationField]).trim() : '';
        if (occ) {
          if (!occupationCounts.has(v)) occupationCounts.set(v, new Map());
          const omap = occupationCounts.get(v);
          omap.set(occ, (omap.get(occ) || 0) + 1);
        }
      });
      if (counts.size === 0) return null;
      // Pick the highest count; if tie, lexicographically smallest
      let best = null; let bestCount = -1;
      for (const [k, c] of counts.entries()) {
        if (c > bestCount || (c === bestCount && (best === null || k.localeCompare(best) < 0))) {
          best = k; bestCount = c;
        }
      }
      let bestContact = null;
      let bestOccupation = null;
      if (best && contactCounts.has(best)) {
        const cmap = contactCounts.get(best);
        // pick most common contact; if tie choose lexicographically smallest
        let bc = null; let bcCount = -1;
        for (const [contact, c] of cmap.entries()) {
          if (c > bcCount || (c === bcCount && (bc === null || contact.localeCompare(bc) < 0))) {
            bc = contact; bcCount = c;
          }
        }
        bestContact = bc;
      }
      if (best && occupationCounts.has(best)) {
        const omap = occupationCounts.get(best);
        let bo = null; let boCount = -1;
        for (const [occ, c] of omap.entries()) {
          if (c > boCount || (c === boCount && (bo === null || occ.localeCompare(bo) < 0))) {
            bo = occ; boCount = c;
          }
        }
        bestOccupation = bo;
      }
      // Secondary lookup: If no occupation derived from patient records, try resolving from guardians/users by exact normalized name match
      if (best && !bestOccupation) {
        try {
          const parts = best.trim().split(/\s+/);
          const _first = parts[0] || '';
          const last = parts[parts.length - 1] || '';
          // Query candidates by surname to keep result small, then filter in code
          const { data: users, error: uErr } = await supabase
            .from('users')
            .select('surname, firstname, middlename, role, guardians:guardians!guardians_user_id_fkey(occupation)')
            .eq('role', 'Guardian')
            .ilike('surname', `%${last}%`)
            .limit(50);
          if (!uErr && Array.isArray(users)) {
            const targetNorm = normalize(best);
            for (const u of users) {
              const full = [u.firstname, u.middlename, u.surname].filter(Boolean).join(' ');
              if (normalize(full) === targetNorm) {
                const g = Array.isArray(u.guardians) ? u.guardians.find(x => x) : u.guardians;
                if (g && g.occupation) { bestOccupation = g.occupation; break; }
              }
            }
          }
        } catch (_) { /* non-blocking */ }
      }
      return { name: best, count: bestCount, contact_number: bestContact, occupation: bestOccupation };
    } catch (error) {
      console.error('Error getting co-parent for name:', error);
      throw error;
    }
  },

  // Suggestions of parents with contacts and occupations, deduped, from patients table only (no guardians)
  listParentsWithContacts: async (type = 'mother', client) => {
    try {
      const supabase = withClient(client);
      const isMother = (type || 'mother').toString().toLowerCase() === 'mother';
      const nameField = isMother ? 'mother_name' : 'father_name';
      const contactField = isMother ? 'mother_contact_number' : 'father_contact_number';
      const occupationField = isMother ? 'mother_occupation' : 'father_occupation';
      const { data, error } = await supabase
        .from('patients')
        .select(`${nameField}, ${contactField}, ${occupationField}`)
        .neq(nameField, null)
        .not(nameField, 'eq', '')
        .eq('is_deleted', false)
        .limit(5000);
      if (error) throw error;
      // Build a map of name -> contact frequency and occupation frequency; prefer most common values
      const byName = new Map();
      (data || []).forEach(row => {
        const name = row && row[nameField] ? String(row[nameField]).trim() : '';
        if (!name) return;
        const contact = row && row[contactField] ? String(row[contactField]).trim() : '';
        const occupation = row && row[occupationField] ? String(row[occupationField]).trim() : '';
        if (!byName.has(name)) byName.set(name, { contacts: new Map(), occupations: new Map() });
        const entry = byName.get(name);
        if (contact) {
          entry.contacts.set(contact, (entry.contacts.get(contact) || 0) + 1);
        } else {
          entry.contacts.set('', (entry.contacts.get('') || 0) + 1);
        }
        if (occupation) {
          entry.occupations.set(occupation, (entry.occupations.get(occupation) || 0) + 1);
        }
      });
      // Create array, picking most common contact
      const list = [];
      for (const [name, entry] of byName.entries()) {
        let bestContact = '';
        let bestContactCount = -1;
        for (const [contact, c] of entry.contacts.entries()) {
          if (c > bestContactCount || (c === bestContactCount && contact.localeCompare(bestContact) < 0)) {
            bestContact = contact; bestContactCount = c;
          }
        }
        let bestOccupation = null;
        let bestOccCount = -1;
        for (const [occ, c] of entry.occupations.entries()) {
          if (c > bestOccCount || (c === bestOccCount && (bestOccupation === null || occ.localeCompare(bestOccupation) < 0))) {
            bestOccupation = occ; bestOccCount = c;
          }
        }
        list.push({ full_name: name, contact_number: bestContact || null, occupation: bestOccupation || null });
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

      // Derive status from BASE patients row to ensure accuracy regardless of view projection
      try {
        const { data: baseRow } = await supabase
          .from('patients')
          .select('is_deleted, status, tags')
          .eq('patient_id', id)
          .maybeSingle();
        const isArchived = !!(baseRow ? baseRow.is_deleted : data.is_deleted);
        const rawStatus = ((baseRow ? baseRow.status : data.status) || '').toString().toLowerCase();
        data.status = isArchived ? 'archived' : (rawStatus === 'inactive' ? 'inactive' : 'active');
      } catch (_) {}

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

      // Fetch birth history and attach all birth fields
      try {
        const { data: birthhistory, error: birthErr } = await supabase
          .from('birthhistory')
          .select('birth_weight, birth_length, place_of_birth, address_at_birth, time_of_birth, attendant_at_birth, type_of_delivery, ballards_score, newborn_screening_result, hearing_test_date, newborn_screening_date')
          .eq('patient_id', id)
          .eq('is_deleted', false)
          .single();
        if (!birthErr && birthhistory) {
          data.birth_weight = birthhistory.birth_weight || null;
          data.birth_length = birthhistory.birth_length || null;
          data.place_of_birth = birthhistory.place_of_birth || null;
          data.address_at_birth = birthhistory.address_at_birth || null;
          data.time_of_birth = birthhistory.time_of_birth || null;
          data.attendant_at_birth = birthhistory.attendant_at_birth || null;
          data.type_of_delivery = birthhistory.type_of_delivery || null;
          data.ballards_score = birthhistory.ballards_score || null;
          data.newborn_screening_result = birthhistory.newborn_screening_result || null;
          data.hearing_test_date = birthhistory.hearing_test_date || null;
          data.newborn_screening_date = birthhistory.newborn_screening_date || null;
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

      // Validate date_of_birth is not in the future
      if (patientData.date_of_birth) {
        const dob = new Date(patientData.date_of_birth);
        const today = new Date();
        today.setHours(23, 59, 59, 999); // End of today

        if (dob > today) {
          const err = new Error('Patient date of birth cannot be in the future.');
          err.status = 400;
          throw err;
        }
      }
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
        firstname: toTitleCase(patientData.firstname),
        surname: toTitleCase(patientData.surname),
        middlename: toTitleCase(patientData.middlename),
        date_of_birth: patientData.date_of_birth,
        sex: patientData.sex,
        address: toTitleCase(patientData.address),
        barangay: toTitleCase(patientData.barangay),
        health_center: toTitleCase(patientData.health_center),
        guardian_id: validGuardianId, // Use validated guardian_id or null
        relationship_to_guardian: patientData.relationship_to_guardian || null,
        mother_name: toTitleCase(patientData.mother_name),
        mother_occupation: toTitleCase(patientData.mother_occupation),
        mother_contact_number: patientData.mother_contact_number,
        father_name: toTitleCase(patientData.father_name),
        father_occupation: toTitleCase(patientData.father_occupation),
        father_contact_number: patientData.father_contact_number,
        family_number: patientData.family_number || `FAM-${Date.now()}`, // Generate if null
        tags: null, // Force null for tags due to database constraint
        status: 'Active', // Default to Active for new patients
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

      // Validate date_of_birth is not in the future if being updated
      if (patientData.date_of_birth) {
        const dob = new Date(patientData.date_of_birth);
        const today = new Date();
        today.setHours(23, 59, 59, 999); // End of today

        if (dob > today) {
          const err = new Error('Patient date of birth cannot be in the future.');
          err.status = 400;
          throw err;
        }
      }
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

      // Handle status updates and cascades (status vs archived)
      const incomingStatusToken = updateData.status;
      if (typeof incomingStatusToken !== 'undefined') {
        const st = String(incomingStatusToken).toLowerCase();
        if (st === 'archived' || st === 'deleted') {
          // Soft delete the patient and cascade
          const del = await patientModel.deletePatient(id, updateData.updated_by || null, supabase);
          return del && del.patient ? del.patient : del;
        } else if (st === 'inactive' || st === 'active') {
          // Update patients.status (Active/Inactive) without archiving
          const newStatus = (st === 'inactive') ? 'Inactive' : 'Active';
          const { error: statusErr } = await supabase
            .from('patients')
            .update({ status: newStatus, is_deleted: false, updated_at: new Date().toISOString(), updated_by: updateData.updated_by || null })
            .eq('patient_id', id);
          if (statusErr) {
            // Surface the error so the controller can return a 500 and the UI shows a failure toast
            throw statusErr;
          }
          if (newStatus === 'Inactive') {
            // Cascade: soft-delete pending schedules and cancel future SMS
            try {
              await supabase
                .from('patientschedule')
                .update({ is_deleted: true, updated_at: new Date().toISOString() })
                .eq('patient_id', id)
                .eq('is_deleted', false);
            } catch (_) {}
            try {
              const { data: updatedSms } = await supabase
                .from('sms_logs')
                .update({ is_deleted: true, status: 'cancelled', error_message: 'Cancelled: patient inactive', updated_at: new Date().toISOString() })
                .eq('patient_id', id)
                .eq('status', 'pending')
                .eq('type', 'scheduled')
                .select('id');
              console.log('[updatePatient] Inactive cascade cancelled SMS count:', Array.isArray(updatedSms) ? updatedSms.length : 0);
            } catch (_) {}
          } else {
            // newStatus === 'Active' → restore schedules and rebuild SMS
            try {
              await supabase
                .from('patientschedule')
                .update({ is_deleted: false, updated_at: new Date().toISOString() })
                .eq('patient_id', id);
            } catch (_) {}
            // Restore previously cancelled/deleted SMS reminders for future dates
            try {
              const nowIso = new Date().toISOString();
              // First, un-delete any sms_logs we cancelled when the patient was made Inactive
              await supabase
                .from('sms_logs')
                .update({ is_deleted: false, updated_at: new Date().toISOString() })
                .eq('patient_id', id)
                .eq('is_deleted', true);

              // Then, set future scheduled reminders back to pending so the scheduler can pick them up
              const { data: restored } = await supabase
                .from('sms_logs')
                .update({ status: 'pending', error_message: null, updated_at: new Date().toISOString() })
                .eq('patient_id', id)
                .eq('is_deleted', false)
                .eq('type', 'scheduled')
                .gte('scheduled_at', nowIso)
                .select('id');
              console.log('[updatePatient] Active cascade restored future SMS count:', Array.isArray(restored) ? restored.length : 0);
            } catch (restoreErr) {
              console.warn('[updatePatient] Failed to restore sms_logs on activation (non-blocking):', restoreErr?.message || restoreErr);
            }
            // Defer heavy message regeneration to avoid timeouts
            try {
              const runAsync = async () => { try { await updateMessagesForPatient(id, supabase); } catch (_) {} };
              if (typeof setImmediate === 'function') setImmediate(runAsync); else setTimeout(runAsync, 0);
            } catch (_) {}
          }
          // Return the updated patient row immediately for status-only updates
          const { data: updatedRow } = await supabase
            .from('patients')
            .select('*')
            .eq('patient_id', id)
            .single();
          return updatedRow;
        }
      }

      // Remove null/undefined keys to avoid overwriting required fields with nulls on partial updates
      const sanitized = Object.fromEntries(
        Object.entries(updateData).filter(([_, v]) => v !== undefined && v !== null)
      );

      // Apply Title Case normalization to string fields
      if (sanitized.firstname) sanitized.firstname = toTitleCase(sanitized.firstname);
      if (sanitized.surname) sanitized.surname = toTitleCase(sanitized.surname);
      if (sanitized.middlename) sanitized.middlename = toTitleCase(sanitized.middlename);
      if (sanitized.address) sanitized.address = toTitleCase(sanitized.address);
      if (sanitized.barangay) sanitized.barangay = toTitleCase(sanitized.barangay);
      if (sanitized.health_center) sanitized.health_center = toTitleCase(sanitized.health_center);
      if (sanitized.mother_name) sanitized.mother_name = toTitleCase(sanitized.mother_name);
      if (sanitized.mother_occupation) sanitized.mother_occupation = toTitleCase(sanitized.mother_occupation);
      if (sanitized.father_name) sanitized.father_name = toTitleCase(sanitized.father_name);
      if (sanitized.father_occupation) sanitized.father_occupation = toTitleCase(sanitized.father_occupation);

      // If nothing to update (e.g., only nulls were provided), return current row without writing
      if (Object.keys(sanitized).length === 0) {
        const { data: current } = await supabase
          .from('patients')
          .select('*')
          .eq('patient_id', id)
          .single();
        return current;
      }

      const { data, error } = await supabase
        .from('patients')
        .update(sanitized)
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
      // Cascade: soft-delete schedules
      try {
        await supabase
          .from('patientschedule')
          .update({ is_deleted: true, updated_at: new Date().toISOString() })
          .eq('patient_id', id)
          .eq('is_deleted', false);
      } catch (_) {}
      // Mark related pending scheduled SMS logs as soft-deleted/cancelled synchronously
      let cancelledSmsCount = 0;
      try {
        const { data: updatedSms, error: updErr } = await supabase
          .from('sms_logs')
          .update({
            is_deleted: true,
            status: 'cancelled',
            error_message: 'Cancelled: patient soft-deleted',
            updated_at: new Date().toISOString()
          })
          .eq('patient_id', id)
          .eq('status', 'pending')
          .eq('type', 'scheduled')
          .select('id');

        if (updErr) {
          console.warn('[deletePatient] Cascade update returned error:', updErr?.message || updErr);
        } else {
          cancelledSmsCount = Array.isArray(updatedSms) ? updatedSms.length : 0;
          console.log(`[deletePatient] Marked ${cancelledSmsCount} pending scheduled SMS for patient ${id} as cancelled and is_deleted=true`);
        }
      } catch (cascadeErr) {
        console.warn('[deletePatient] Failed to cascade cancel SMS:', cascadeErr?.message || cascadeErr);
      }

      return { patient: data, cancelledSmsCount };
    } catch (error) {
      console.error('Error deleting patient:', error);
      throw error;
    }
  },

  // Restore a soft-deleted patient and cascade restore
  restorePatient: async (id, actorId = null, client) => {
    try {
      const supabase = withClient(client);
      // Validate guardian is active (not deleted) before restoring patient
      let guardianId = null;
      try {
        const { data: prow, error: pErr } = await supabase
          .from('patients')
          .select('guardian_id')
          .eq('patient_id', id)
          .maybeSingle();
        if (pErr) throw pErr;
        guardianId = prow?.guardian_id || null;
      } catch (preErr) {
        console.warn('[restorePatient] Failed to fetch patient guardian_id (non-blocking):', preErr?.message || preErr);
      }
      if (guardianId) {
        const { data: grow, error: gErr } = await supabase
          .from('guardians')
          .select('is_deleted')
          .eq('guardian_id', guardianId)
          .maybeSingle();
        if (gErr) {
          console.warn('[restorePatient] Guardian lookup error (non-blocking):', gErr?.message || gErr);
        } else if (grow && grow.is_deleted) {
          const err = new Error('Cannot restore patient: the guardian is archived. Restore the guardian first.');
          err.statusCode = 400;
          err.code = 'GUARDIAN_DELETED';
          throw err;
        }
      }
      const { data, error } = await supabase
        .from('patients')
        .update({ is_deleted: false, deleted_at: null, deleted_by: null, status: 'Active', updated_at: new Date().toISOString(), updated_by: actorId || null })
        .eq('patient_id', id)
        .select('patient_id')
        .single();
      if (error) throw error;
      try {
        await supabase
          .from('patientschedule')
          .update({ is_deleted: false, updated_at: new Date().toISOString() })
          .eq('patient_id', id);
      } catch (_) {}
      // Restore SMS logs: mark all as not deleted, and re-pend future scheduled messages
      try {
        const nowIso = new Date().toISOString();
        // First, mark sms_logs as not deleted
        await supabase
          .from('sms_logs')
          .update({ is_deleted: false, updated_at: new Date().toISOString() })
          .eq('patient_id', id)
          .eq('is_deleted', true);

        // Restore scheduled future messages to pending so scheduler can pick them again
        await supabase
          .from('sms_logs')
          .update({ status: 'pending', updated_at: new Date().toISOString(), error_message: null })
          .eq('patient_id', id)
          .eq('is_deleted', false)
          .eq('type', 'scheduled')
          .gte('scheduled_at', nowIso);
      } catch (restoreErr) {
        console.warn('[restorePatient] Failed to restore sms_logs (non-blocking):', restoreErr?.message || restoreErr);
      }
      // Defer potentially heavy message regeneration to avoid request timeout
      try {
        const runAsync = async () => { try { await updateMessagesForPatient(id, supabase); } catch (_) {} };
        if (typeof setImmediate === 'function') setImmediate(runAsync); else setTimeout(runAsync, 0);
      } catch (_) {}
      return data;
    } catch (error) {
      console.error('Error restoring patient:', error);
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

  // Lightweight read-only schedule fetch that does NOT perform any status writes.
  // Use this for latency-sensitive endpoints (e.g., patient creation response).
  getPatientVaccinationScheduleFast: async (patientId, client) => {
    try {
      const supabase = withClient(client);
      const { data, error } = await supabase
        .from('patientschedule_view')
        .select('*')
        .eq('patient_id', patientId)
        .order('scheduled_date', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching patient schedule (fast):', error);
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
        place_of_birth: toTitleCase(birthData.place_of_birth),
        address_at_birth: toTitleCase(birthData.address_at_birth),
        time_of_birth: birthData.time_of_birth,
        attendant_at_birth: toTitleCase(birthData.attendant_at_birth),
        type_of_delivery: toTitleCase(birthData.type_of_delivery),
        ballards_score: birthData.ballards_score,
        hearing_test_date: birthData.hearing_test_date,
        newborn_screening_date: birthData.newborn_screening_date,
        newborn_screening_result: toSentenceCase(birthData.newborn_screening_result),
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
          notes: toSentenceCase(vitalsData.notes),
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

  /**
   * Assign time slots to patient schedules that don't have them
   * This is called after schedule generation/recalculation
   */
  assignTimeSlotsToSchedules: async (patientId, client) => {
    try {
      const supabase = withClient(client);

      // Get all schedules for this patient that don't have time slots assigned
      const { data: schedules, error: schedErr } = await supabase
        .from('patientschedule')
        .select('patient_schedule_id, scheduled_date, time_slot')
        .eq('patient_id', patientId)
        .eq('is_deleted', false)
        .not('status', 'in', '(Completed,Cancelled)')
        .order('scheduled_date', { ascending: true });

      if (schedErr) throw schedErr;
      if (!schedules || schedules.length === 0) return { assigned: 0 };

      let assignedCount = 0;

      for (const schedule of schedules) {
        // Skip if already has a time slot
        if (schedule.time_slot) continue;

        try {
          // Get available slot for this date
          const availableSlot = await capacityModel.getAvailableSlot(schedule.scheduled_date, supabase);

          if (availableSlot) {
            // Assign the slot
            await supabase
              .from('patientschedule')
              .update({
                time_slot: availableSlot,
                updated_at: new Date().toISOString()
              })
              .eq('patient_schedule_id', schedule.patient_schedule_id);

            assignedCount++;
            console.log(`[assignTimeSlotsToSchedules] Assigned ${availableSlot} to schedule ${schedule.patient_schedule_id} on ${schedule.scheduled_date}`);
          } else {
            // Both slots full - find next available day
            const nextAvailable = await capacityModel.findNextAvailableSlot(schedule.scheduled_date, 90, supabase);

            await supabase
              .from('patientschedule')
              .update({
                scheduled_date: nextAvailable.date,
                time_slot: nextAvailable.slot,
                updated_at: new Date().toISOString()
              })
              .eq('patient_schedule_id', schedule.patient_schedule_id);

            assignedCount++;
            console.log(`[assignTimeSlotsToSchedules] Moved schedule ${schedule.patient_schedule_id} from ${schedule.scheduled_date} to ${nextAvailable.date} ${nextAvailable.slot} due to capacity`);
          }
        } catch (slotErr) {
          console.warn(`[assignTimeSlotsToSchedules] Failed to assign slot to schedule ${schedule.patient_schedule_id}:`, slotErr?.message);
          // Continue with next schedule
        }
      }

      return { assigned: assignedCount };
    } catch (error) {
      console.error('[assignTimeSlotsToSchedules] Error:', error);
      throw error;
    }
  },

  // Alias functions for test compatibility
  getAllChildren: (filters = {}, page = 1, limit = 10) => {
    return patientModel.getAllPatients(filters, page, limit);
  },

  getChildById: (id) => {
    return patientModel.getPatientById(id);
  }
};

export default patientModel;
