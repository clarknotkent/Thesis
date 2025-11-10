// Utility string helpers
// Title-case transformation tailored for notification headers.
// - Preserves known acronyms (e.g., SMS, BCG, OPV, IPV, PCV, MMR, JE, HPV, COVID, DPT)
// - Converts separators (_,-) to spaces
// - Collapses multiple spaces
// - Capitalizes first letter of each word, lowercases the rest unless acronym
// - Leaves words shorter than 3 chars (e.g., 'of', 'to', 'and') in lowercase except if first word

const ACRONYMS = new Set(['SMS','BCG','OPV','IPV','PCV','MMR','JE','HPV','COVID','DPT','HIB','JE','TD','TT']);
const SMALL_WORDS = new Set(['of','and','or','to','in','on','at','for','by','vs','vs.','the','a','an']);

export function toTitleCase(input) {
  if (!input) return ''
  let str = String(input).trim()
  if (!str) return ''
  // Normalize separators
  str = str.replace(/[_.-]+/g, ' ')
  // Collapse whitespace
  str = str.replace(/\s+/g, ' ')
  const words = str.split(' ')
  return words.map((w, idx) => {
    const clean = w.replace(/[^A-Za-z0-9]/g, '')
    const upper = clean.toUpperCase()
    if (ACRONYMS.has(upper)) return upper
    if (idx !== 0 && SMALL_WORDS.has(clean.toLowerCase())) return clean.toLowerCase()
    // Handle mixed alphanumeric like HepaB -> Hepa B (split camel)
    const parts = clean.split(/(?=[A-Z][a-z])|(?<=[a-z])(?=[A-Z0-9])/g)
    return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ')
  }).join(' ').replace(/\s{2,}/g, ' ').trim()
}

export function normalizeNotificationTitle(raw) {
  if (!raw) return 'Notification'
  return toTitleCase(raw)
}

export default { toTitleCase, normalizeNotificationTitle }
