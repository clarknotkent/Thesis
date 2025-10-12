// Debug utility to simulate rescheduling logic and log candidate dates and reasons
// This does NOT modify the database. It only queries current schedules and constraints.

function toISODate(d) {
  return new Date(d).toISOString().split('T')[0];
}

async function debugReschedule(supabase, patientScheduleId, requestedDate) {
  const trace = [];
  const reqDate = new Date(requestedDate);

  // Load subject schedule
  const { data: s, error: sErr } = await supabase
    .from('patientschedule')
    .select('*')
    .eq('patient_schedule_id', patientScheduleId)
    .eq('is_deleted', false)
    .single();
  if (sErr || !s) throw new Error('debug: patient schedule not found');

  // Load schedule rules for subject
  const { data: sm, error: smErr } = await supabase
    .from('schedule_master')
    .select('id, vaccine_id, concurrent_allowed')
    .eq('vaccine_id', s.vaccine_id)
    .single();
  if (smErr || !sm) throw new Error('debug: schedule_master not found');

  const { data: sd, error: sdErr } = await supabase
    .from('schedule_doses')
    .select('dose_number, due_after_days, min_interval_days, max_interval_days, min_interval_other_vax')
    .eq('schedule_id', sm.id)
    .eq('dose_number', s.dose_number)
    .single();
  if (sdErr || !sd) throw new Error('debug: schedule_doses not found');

  // Previous same-vaccine reference date (actual first else scheduled)
  const { data: prev, error: prevErr } = await supabase
    .from('patientschedule')
    .select('actual_date, scheduled_date')
    .eq('patient_id', s.patient_id)
    .eq('vaccine_id', s.vaccine_id)
    .lt('dose_number', s.dose_number)
    .eq('is_deleted', false)
    .order('dose_number', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (prevErr) throw prevErr;
  const prevRef = prev ? new Date(prev.actual_date || prev.scheduled_date) : null;

  // All other schedules for this patient (both same vaccine other doses and other vaccines)
  const { data: allSched, error: allErr } = await supabase
    .from('patientschedule')
    .select('patient_schedule_id, vaccine_id, dose_number, scheduled_date, actual_date')
    .eq('patient_id', s.patient_id)
    .eq('is_deleted', false);
  if (allErr) throw allErr;

  // Build quick maps for other vaccines' concurrency flags
  const vaccineIds = Array.from(new Set(allSched.map(r => r.vaccine_id).concat([s.vaccine_id])));
  const { data: masters, error: mErr } = await supabase
    .from('schedule_master')
    .select('vaccine_id, concurrent_allowed')
    .in('vaccine_id', vaccineIds);
  if (mErr) throw mErr;
  const concMap = new Map(masters.map(m => [m.vaccine_id, !!m.concurrent_allowed]));

  // Start candidate at max(requested, prev+min)
  let candidate = new Date(reqDate);
  if (prevRef && sd.min_interval_days != null) {
    const minDate = new Date(prevRef);
    minDate.setDate(minDate.getDate() + sd.min_interval_days);
    if (candidate < minDate) candidate = minDate;
  }

  // Define helpers
  const subjectConc = !!sm.concurrent_allowed;
  const maxBoundary = (prevRef && sd.max_interval_days != null)
    ? new Date(prevRef.getFullYear(), prevRef.getMonth(), prevRef.getDate() + sd.max_interval_days)
    : null;

  const sameVaccineOtherDoses = allSched.filter(r => r.vaccine_id === s.vaccine_id && r.patient_schedule_id !== s.patient_schedule_id)
    .map(r => new Date(r.actual_date || r.scheduled_date)).filter(Boolean);

  const otherVaccines = allSched.filter(r => r.vaccine_id !== s.vaccine_id)
    .map(r => ({
      date: new Date(r.actual_date || r.scheduled_date),
      vaccine_id: r.vaccine_id,
      conc: !!concMap.get(r.vaccine_id)
    }))
    .filter(r => r.date && !isNaN(r.date));

  // Iterate day by day, logging reasons
  let steps = 0;
  while (steps < 120) {
    steps += 1;
    const cISO = toISODate(candidate);

    // Hard stop: max interval
    if (maxBoundary && candidate > maxBoundary) {
      trace.push({ step: steps, candidate: cISO, decision: 'fail', reason: `exceeds max_interval_days: ${sd.max_interval_days}` });
      break;
    }

    // 1) Same vaccine: no same-day with any dose
    const sameDaySameVax = sameVaccineOtherDoses.some(d => toISODate(d) === cISO);
    if (sameDaySameVax) {
      trace.push({ step: steps, candidate: cISO, decision: 'reject', reason: 'same vaccine same-day not allowed' });
      candidate.setDate(candidate.getDate() + 1);
      continue;
    }

    // 2) Cross-vaccine same-day concurrency
    const sameDayOthers = otherVaccines.filter(o => toISODate(o.date) === cISO);
    if (sameDayOthers.length > 0) {
      // All same-day others must be concurrent with subject
      const allConcurrent = subjectConc && sameDayOthers.every(o => o.conc);
      if (!allConcurrent) {
        trace.push({ step: steps, candidate: cISO, decision: 'reject', reason: 'same-day other vaccine without mutual concurrency' });
        candidate.setDate(candidate.getDate() + 1);
        continue;
      }
    }

    // 3) Cross-vaccine min spacing
    if (sd.min_interval_other_vax != null) {
      const conflict = otherVaccines.find(o => {
        const diffDays = Math.abs((o.date - candidate) / 86400000);
        const sameDay = toISODate(o.date) === cISO;
        const allowedSameDay = subjectConc && o.conc;
        return (diffDays < sd.min_interval_other_vax) && !(sameDay && allowedSameDay);
      });
      if (conflict) {
        trace.push({ step: steps, candidate: cISO, decision: 'reject', reason: `min_interval_other_vax ${sd.min_interval_other_vax}d with vaccine ${conflict.vaccine_id} on ${toISODate(conflict.date)}` });
        candidate.setDate(candidate.getDate() + 1);
        continue;
      }
    }

    // 4) Passed all checks
    trace.push({ step: steps, candidate: cISO, decision: 'accept', reason: 'all constraints satisfied' });
    break;
  }

  // Surface in backend logs
  try { console.table(trace); } catch { console.log(JSON.stringify(trace, null, 2)); }

  return { finalCandidate: toISODate(candidate), trace };
}

module.exports = { debugReschedule };
