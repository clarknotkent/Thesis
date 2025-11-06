import { getSupabaseForRequest } from '../utils/supabaseClient.js';
import * as dewormingModel from '../models/dewormingModel.js';

async function resolveVaccineId(supabase, { inventory_id, vaccine_id }) {
  if (vaccine_id) return vaccine_id;
  if (inventory_id) {
    const { data, error } = await supabase.from('inventory').select('vaccine_id').eq('inventory_id', inventory_id).single();
    if (error || !data) throw new Error('Unable to resolve vaccine_id from inventory_id');
    return data.vaccine_id;
  }
  throw new Error('vaccine_id or inventory_id is required to resolve vaccine');
}

async function resolvePatientIdFromVisit(supabase, visit_id) {
  const { data, error } = await supabase.from('visits').select('patient_id').eq('visit_id', visit_id).single();
  if (error || !data) throw new Error('Unable to resolve patient_id from visit');
  return data.patient_id;
}

async function findTodayVisitWithVitals(supabase, patient_id) {
  const { data, error } = await supabase
    .from('visits')
    .select('visit_id')
    .eq('patient_id', patient_id)
    .gte('visit_date', new Date(new Date().setHours(0,0,0,0)).toISOString())
    .lte('visit_date', new Date(new Date().setHours(23,59,59,999)).toISOString())
    .order('visit_date', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const { data: vit, error: vitErr } = await supabase.from('vitalsigns').select('vital_id').eq('visit_id', data.visit_id).eq('is_deleted', false).limit(1).maybeSingle();
  if (vitErr) throw vitErr;
  return vit ? data.visit_id : null;
}

const listDeworming = async (req, res) => {
  try {
    const supabase = getSupabaseForRequest(req);
    const items = await dewormingModel.listDeworming({}, supabase);
    res.json(items);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch deworming records' });
  }
};

const getDewormingRecord = async (req, res) => {
  try {
    const supabase = getSupabaseForRequest(req);
    const item = await dewormingModel.getDewormingById(req.params.id, supabase);
    if (!item) return res.status(404).json({ message: 'Deworming record not found' });
    res.json(item);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch deworming record' });
  }
};

const createDewormingRecord = async (req, res) => {
  try {
    const supabase = getSupabaseForRequest(req);
    const actorId = req.user && req.user.user_id ? req.user.user_id : null;
    const payload = { ...req.body };
    const outside = !!payload.outside;
    if (!payload.administered_by && actorId) payload.administered_by = actorId;

    if (outside) {
      if (!payload.patient_id) return res.status(400).json({ success:false, message:'patient_id is required for outside deworming' });
      if (payload.inventory_id) return res.status(400).json({ success:false, message:'inventory_id is not allowed for outside deworming' });
      const vaccineId = await resolveVaccineId(supabase, { inventory_id: null, vaccine_id: payload.vaccine_id });
      // vitals optional by DB, but we accept and link if provided
      let vital_id = null;
      if (payload.vitals) {
        const { data: vit, error: vitErr } = await supabase
          .from('vitalsigns')
          .insert({
            temperature: payload.vitals.temperature || null,
            muac: payload.vitals.muac || null,
            respiration_rate: payload.vitals.respiration || null,
            weight: payload.vitals.weight || null,
            height_length: payload.vitals.height || null,
            recorded_by: actorId || null,
            created_by: actorId || null,
            updated_by: actorId || null,
          })
          .select('vital_id')
          .single();
        if (vitErr) throw vitErr;
        vital_id = vit.vital_id;
      }

      const insertData = { ...payload, outside: true, vaccine_id: vaccineId, vital_id };
      const row = await dewormingModel.createDeworming(insertData, supabase);
      return res.status(201).json({ success:true, data: row });
    }

    // In-facility
    let visit_id = payload.visit_id || null;
    let patient_id = payload.patient_id || null;
    if (!visit_id) {
      if (!patient_id) return res.status(400).json({ success:false, message:'visit_id or patient_id is required for in-facility deworming' });
      visit_id = await findTodayVisitWithVitals(supabase, patient_id);
      if (!visit_id) return res.status(400).json({ success:false, message:'patient has not taken their vitalsigns yet' });
    }
    if (!patient_id) patient_id = await resolvePatientIdFromVisit(supabase, visit_id);
    // Enforce inventory_id for in-facility
    if (!payload.inventory_id) return res.status(400).json({ success:false, message:'inventory_id is required for in-facility deworming' });
    const vaccineId = await resolveVaccineId(supabase, { inventory_id: payload.inventory_id, vaccine_id: payload.vaccine_id });

    // derive vital_id from visit vitals
    const { data: visitVital, error: vitErr } = await supabase
      .from('vitalsigns')
      .select('vital_id')
      .eq('visit_id', visit_id)
      .eq('is_deleted', false)
      .order('vital_id', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (vitErr) throw vitErr;
    const insertData = { ...payload, visit_id, patient_id, vaccine_id: vaccineId, vital_id: visitVital ? visitVital.vital_id : null };
    if (!insertData.vital_id) return res.status(400).json({ success:false, message:'No vitals found for visit' });

    const row = await dewormingModel.createDeworming(insertData, supabase);
    return res.status(201).json({ success:true, data: row });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success:false, message:'Failed to create deworming record' });
  }
};

const updateDewormingRecord = async (req, res) => {
  try {
    const supabase = getSupabaseForRequest(req);
    const data = await dewormingModel.updateDeworming(req.params.id, req.body, supabase);
    if (!data) return res.status(404).json({ success:false, message:'Deworming record not found' });
    res.json({ success:true, data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success:false, message: 'Failed to update deworming record' });
  }
};

const deleteDewormingRecord = async (req, res) => {
  try {
    const supabase = getSupabaseForRequest(req);
    await dewormingModel.deleteDeworming(req.params.id, supabase);
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to delete deworming record' });
  }
};

export { listDeworming,
  getDewormingRecord,
  createDewormingRecord,
  updateDewormingRecord,
  deleteDewormingRecord };
