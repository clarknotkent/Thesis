const supabase = require('../db');

const listVisits = async (filters = {}, page = 1, limit = 20) => {
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

const getVisitById = async (id) => {
  const { data, error } = await supabase
    .from('visits_view')
    .select('*')
    .eq('visit_id', id)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data || null;
};

const createVisit = async (visitPayload) => {
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
      recorded_by: visitData.recorded_by || null
    })
    .select()
    .single();

  if (visitErr) {
    console.error('❌ [VISIT_SAVE] Failed to save visit:', visitErr);
    throw visitErr;
  }
  console.log('✅ [VISIT_SAVE] Visit saved successfully, ID:', visit.visit_id);

  // Insert vitalsigns if provided
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
        height_length: height || null
      })
      .select()
      .single();

    if (vitErr) {
      console.error('❌ [VITALS_SAVE] Failed to save vitals:', vitErr);
      throw vitErr;
    }
    console.log('✅ [VITALS_SAVE] Vitals saved successfully');
  }

  // Insert collected vaccinations with visit_id
  console.log('💾 [VACCINATIONS_SAVE] Saving collected vaccinations...');
  for (const vaccination of collectedVaccinations) {
    console.log('💉 [VACCINATION_ITEM] Processing vaccination:', vaccination.inventory_id, 'for patient:', vaccination.patient_id);
    const immunizationData = {
      inventory_id: vaccination.inventory_id,
      disease_prevented: vaccination.disease_prevented,
      dose_number: vaccination.dose_number,
      administered_date: vaccination.administered_date,
      age_at_administration: vaccination.age_at_administration,
      administered_by: vaccination.administered_by,
      facility_name: vaccination.facility_name,
      remarks: vaccination.remarks,
      visit_id: visit.visit_id // Link to this visit
    };

    const { error: immErr } = await supabase
      .from('immunizations')
      .insert(immunizationData);

    if (immErr) {
      console.error('❌ [VACCINATIONS_SAVE] Failed to save vaccination:', immErr);
      throw immErr;
    }
  }
  console.log('✅ [VACCINATIONS_SAVE] All vaccinations saved successfully');

  // Insert other services (deworming, etc.) - assuming they go to a services table
  console.log('💾 [SERVICES_SAVE] Saving additional services...');
  for (const service of services) {
    if (service.name?.toLowerCase() === 'deworming') {
      console.log('🪱 [DEWORMING] Processing deworming service');
      // Insert into deworming table
      const dewormingData = {
        visit_id: visit.visit_id,
        administered_by: service.administered_by || visitData.recorded_by,
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

module.exports = { listVisits, getVisitById, createVisit };
