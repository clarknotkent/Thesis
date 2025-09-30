const serviceSupabase = require('../db');
const immunizationModel = require('./immunizationModel');

function withClient(client) {
  return client || serviceSupabase;
}

const listVisits = async (filters = {}, page = 1, limit = 20, client) => {
  const supabase = withClient(client);
  let query = supabase.from('visits_view').select('*', { count: 'exact' });

  if (filters.patient_id) query = query.eq('patient_id', filters.patient_id);
  if (filters.worker_id) query = query.eq('health_worker_id', filters.worker_id);

  const offset = (page - 1) * limit;
  const { data, error, count } = await query
    .order('visit_date', { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) throw error;
  return {
    items: data || [],
    totalCount: count || 0,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages: Math.ceil((count || 0) / limit)
  };
};

const getVisitById = async (id, client) => {
  const supabase = withClient(client);
  const { data, error } = await supabase
    .from('visits_view')
    .select('*')
    .eq('visit_id', id)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data || null;
};

const updateVisitById = async (id, updatePayload, client) => {
  const supabase = withClient(client);
  
  // Sanitize the payload: convert empty strings to null for bigint fields
  const sanitizedPayload = { ...updatePayload };
  const bigintFields = ['recorded_by', 'created_by', 'updated_by'];
  
  for (const field of bigintFields) {
    if (sanitizedPayload[field] === '') {
      sanitizedPayload[field] = null;
    }
  }
  
  const { data, error } = await supabase
    .from('visits')
    .update(sanitizedPayload)
    .eq('visit_id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

// Ensure a visit exists for a patient on a specific date; if not, create it.
const ensureVisitForDate = async (patient_id, visit_date, recorded_by = null, client) => {
  const supabase = withClient(client);
  // Normalize to day range in UTC
  const start = new Date(new Date(visit_date || Date.now()).setHours(0,0,0,0)).toISOString();
  const end = new Date(new Date(visit_date || Date.now()).setHours(23,59,59,999)).toISOString();
  const { data: existing, error: exErr } = await supabase
    .from('visits')
    .select('visit_id')
    .eq('patient_id', patient_id)
    .gte('visit_date', start)
    .lte('visit_date', end)
    .order('visit_id', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (exErr) throw exErr;
  if (existing && existing.visit_id) {
    const { data: viewRow, error: vErr } = await supabase.from('visits_view').select('*').eq('visit_id', existing.visit_id).single();
    if (!vErr) return viewRow;
    return existing;
  }
  const insert = {
    patient_id,
    visit_date: visit_date || new Date().toISOString(),
    findings: null,
    service_rendered: null,
    recorded_by: recorded_by || null,
    created_by: recorded_by || null,
    updated_by: recorded_by || null,
  };
  const { data: created, error: insErr } = await supabase.from('visits').insert(insert).select().single();
  if (insErr) throw insErr;
  const { data: viewRow, error: vErr } = await supabase.from('visits_view').select('*').eq('visit_id', created.visit_id).single();
  if (!vErr) return viewRow;
  return created;
};

const createVisit = async (visitPayload, client) => {
  const supabase = withClient(client);
  // visitPayload expected to contain:
  // patient_id, visit_date, recorded_by, vitals {...}, collectedVaccinations [...], services [...]
  const { vitals, collectedVaccinations = [], services = [], ...visitData } = visitPayload;

  console.log('🔄 [VISIT_CREATION] Starting visit creation process...');
  console.log('📋 [VISIT_DATA] Visit data received:', { patient_id: visitData.patient_id, visit_date: visitData.visit_date, recorded_by: visitData.recorded_by });
  console.log('💉 [VITALS] Vitals data received:', vitals ? 'Present' : 'None');
  console.log('🩹 [VACCINATIONS] Collected vaccinations:', collectedVaccinations.length, 'items');
  console.log('🔧 [SERVICES] Services to perform:', services.length, 'items');

  // Build concatenated service_rendered and findings
  let serviceRenderedParts = [];
  let findingsParts = [];

  // Add services from the services array (deworming, etc.)
  for (const service of services) {
    if (service.name) {
      serviceRenderedParts.push(service.name);
      if (service.remarks) {
        findingsParts.push(`${service.name} -- ${service.remarks}`);
      }
    }
  }

  // Add vaccination services
  if (collectedVaccinations.length > 0) {
    serviceRenderedParts.push('Vaccine Administration');
    // Add vaccination remarks to findings
    for (const vacc of collectedVaccinations) {
      if (vacc.remarks) {
        findingsParts.push(`Vaccine Administration -- ${vacc.remarks}`);
      }
    }
  }

  // Create final concatenated strings
  const serviceRendered = serviceRenderedParts.length > 0 ? serviceRenderedParts.join(', ') : null;
  const findings = findingsParts.length > 0 ? findingsParts.join(', ') : visitData.findings || null;

  console.log('🔗 [CONCATENATION] Service Rendered:', serviceRendered);
  console.log('🔍 [CONCATENATION] Findings:', findings);

  // Insert visit with concatenated data
  console.log('💾 [VISIT_SAVE] Saving visit record...');
  const { data: visit, error: visitErr } = await supabase
    .from('visits')
    .insert({
      patient_id: visitData.patient_id,
      visit_date: visitData.visit_date || new Date().toISOString(),
      findings: findings,
      service_rendered: serviceRendered,
      recorded_by: visitData.recorded_by || null,
      created_by: visitData.recorded_by || null,
      updated_by: visitData.recorded_by || null
    })
    .select()
    .single();

  if (visitErr) {
    console.error('❌ [VISIT_SAVE] Failed to save visit:', visitErr);
    throw visitErr;
  }
  console.log('✅ [VISIT_SAVE] Visit saved successfully, ID:', visit.visit_id);

  // Insert vitalsigns if provided
  let createdVitalId = null;
  if (vitals && visit && visit.visit_id) {
    console.log('💾 [VITALS_SAVE] Saving vitals data...');
    const { temperature, muac, respiration, weight, height } = vitals;
    const { data: vit, error: vitErr } = await supabase
      .from('vitalsigns')
      .insert({
        visit_id: visit.visit_id,
        temperature: temperature || null,
        muac: muac || null,
        respiration_rate: respiration || null,
        weight: weight || null,
        height_length: height || null,
        created_by: visitData.recorded_by || null,
        updated_by: visitData.recorded_by || null
      })
      .select()
      .single();

    if (vitErr) {
      console.error('❌ [VITALS_SAVE] Failed to save vitals:', vitErr);
      throw vitErr;
    }
    createdVitalId = vit && vit.vital_id ? vit.vital_id : null;
    console.log('✅ [VITALS_SAVE] Vitals saved successfully, vital_id:', createdVitalId);
  }

  // Enforce: if services/vaccinations present, vitals must be recorded for this visit
  const hasVaccinations = collectedVaccinations && collectedVaccinations.length > 0;
  const hasServices = services && services.length > 0;
  if ((hasVaccinations || hasServices) && !createdVitalId) {
    throw new Error('Vitals are required for in-facility services on a visit');
  }

  // Insert collected vaccinations with visit_id and propagate vital_id (using model to trigger schedule recalculation)
  console.log('💾 [VACCINATIONS_SAVE] Saving collected vaccinations...');
  for (const vaccination of collectedVaccinations) {
    console.log('💉 [VACCINATION_ITEM] Processing vaccination:', vaccination.inventory_id, 'for patient:', vaccination.patient_id);
    // Resolve vaccine_id from inventory
    let vaccine_id = vaccination.vaccine_id || null;
    if (!vaccine_id && vaccination.inventory_id) {
      const { data: inv, error: invErr } = await supabase
        .from('inventory')
        .select('vaccine_id')
        .eq('inventory_id', vaccination.inventory_id)
        .single();
      if (invErr || !inv) {
        console.error('❌ [VACCINATIONS_SAVE] Failed to resolve vaccine_id from inventory:', invErr);
        throw invErr || new Error('Unable to resolve vaccine_id');
      }
      vaccine_id = inv.vaccine_id;
    }

    const immunizationData = {
      inventory_id: vaccination.inventory_id || null,
      vaccine_id,
      patient_id: visitData.patient_id,
      disease_prevented: vaccination.disease_prevented || null,
      dose_number: vaccination.dose_number,
      administered_date: vaccination.administered_date,
      age_at_administration: vaccination.age_at_administration || null,
      administered_by: vaccination.administered_by || visitData.recorded_by || null,
      facility_name: vaccination.facility_name || null,
      remarks: vaccination.remarks || null,
      visit_id: visit.visit_id, // Link to this visit
      vital_id: createdVitalId || null,
      outside: vaccination.outside || false
    };

    try {
      await immunizationModel.createImmunization(immunizationData, supabase);
    } catch (immErr) {
      console.error('❌ [VACCINATIONS_SAVE] Failed to save vaccination via model:', immErr);
      throw immErr;
    }
  }
  console.log('✅ [VACCINATIONS_SAVE] All vaccinations saved successfully');

  // Insert other services (deworming, vitamina)
  console.log('💾 [SERVICES_SAVE] Saving additional services...');
  for (const service of services) {
    const name = (service.name || '').toLowerCase();
    if (name === 'deworming') {
      console.log('🪱 [DEWORMING] Processing deworming service');
      // Insert into deworming table
      const dewormingData = {
        visit_id: visit.visit_id,
        administered_by: service.administered_by || visitData.recorded_by,
        vital_id: createdVitalId || null,
        remarks: service.remarks || null,
        created_by: visitData.recorded_by || null,
        updated_by: visitData.recorded_by || null
      };

      const { error: dewErr } = await supabase
        .from('deworming')
        .insert(dewormingData);

      if (dewErr) {
        console.error('❌ [SERVICES_SAVE] Failed to save deworming:', dewErr);
        throw dewErr;
      }
      console.log('✅ [DEWORMING] Deworming service saved successfully');
    } else if (name === 'vitamina' || name === 'vitamin a' || name === 'vitamin_a') {
      console.log('🧡 [VITAMIN A] Processing vitamin A service');
      const vitaminaData = {
        visit_id: visit.visit_id,
        administered_by: service.administered_by || visitData.recorded_by,
        vital_id: createdVitalId || null,
        remarks: service.remarks || null,
        created_by: visitData.recorded_by || null,
        updated_by: visitData.recorded_by || null
      };
      const { error: vitAErr } = await supabase
        .from('vitamina')
        .insert(vitaminaData);
      if (vitAErr) {
        console.error('❌ [SERVICES_SAVE] Failed to save vitamina:', vitAErr);
        throw vitAErr;
      }
      console.log('✅ [VITAMIN A] Vitamina service saved successfully');
    } else {
      // For other services, you might want to create a generic visit_services table
      // For now, we'll skip unknown services or you can add more specific handling
      console.warn(`⚠️ [SERVICES_SAVE] Unknown service type: ${service.name}, skipping...`);
    }
  }
  console.log('✅ [SERVICES_SAVE] All services saved successfully');

  // Return the created visit (re-run read from visits_view for enriched data)
  console.log('📖 [VISIT_FETCH] Fetching final visit data...');
  const { data: createdVisit, error: fetchErr } = await supabase
    .from('visits_view')
    .select('*')
    .eq('visit_id', visit.visit_id)
    .single();

  if (fetchErr && fetchErr.code !== 'PGRST116') {
    console.error('❌ [VISIT_FETCH] Failed to fetch created visit:', fetchErr);
    throw fetchErr;
  }

  console.log('🎉 [VISIT_CREATION] Visit creation completed successfully!');
  console.log('📊 [SUMMARY] Created visit ID:', visit.visit_id, 'with', collectedVaccinations.length, 'vaccinations and', services.length, 'services');

  return createdVisit || visit;
};

module.exports = { listVisits, getVisitById, createVisit, ensureVisitForDate, updateVisitById };
