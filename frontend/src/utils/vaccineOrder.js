export function normalizeVaccineName(name) {
  const s = String(name || '').trim()
  if (!s) return ''
  return s
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .toUpperCase()
}

// Build an index of first-dose eligible_date per vaccine from patientschedule rows
// schedules: array of patient schedule rows containing at minimum:
// - vaccine name/id fields (vaccine_name | vaccine | antigen_name | antigen)
// - dose_number (1 for first dose) [optional; if missing, we take earliest eligible_date per vaccine]
// - eligible_date (string ISO or YYYY-MM-DD)
export function buildFirstDoseEligibleIndex(schedules) {
  const index = new Map()
  if (!Array.isArray(schedules)) return index
  for (const s of schedules) {
    const vName = s?.vaccine_name || s?.vaccine || s?.antigen_name || s?.antigen || s?.vaccineName
    const key = normalizeVaccineName(vName)
    if (!key) continue
    const doseNum = s?.dose_number || s?.doseNumber || s?.dose
    const eligible = s?.eligible_date || s?.eligibleDate
    if (!eligible) continue // strictly use eligible_date only
    // Only consider dose 1 when provided; if not provided, keep earliest eligible per vaccine
    if (doseNum && Number(doseNum) !== 1) continue
    const prev = index.get(key)
    if (!prev || new Date(eligible) < new Date(prev)) {
      index.set(key, eligible)
    }
  }
  return index
}

// Compare two vaccine groups using only first-dose eligible_date from patientschedule
// - a, b: { vaccineName: string, doses: [...] }
// - eligibleIndex: Map<normalizedVaccineName, eligible_date string>
export function compareGroupsByEligible(a, b, eligibleIndex) {
  const idx = eligibleIndex || new Map()
  const aKey = normalizeVaccineName(a?.vaccineName)
  const bKey = normalizeVaccineName(b?.vaccineName)
  const aDateStr = aKey ? idx.get(aKey) : null
  const bDateStr = bKey ? idx.get(bKey) : null
  if (aDateStr && bDateStr) {
    const ad = new Date(aDateStr)
    const bd = new Date(bDateStr)
    if (!isNaN(ad) && !isNaN(bd)) return ad - bd
  }
  if (aDateStr && !bDateStr) return -1
  if (!aDateStr && bDateStr) return 1
  // If both missing or invalid, leave order unchanged
  return 0
}

export default { normalizeVaccineName, buildFirstDoseEligibleIndex, compareGroupsByEligible }
