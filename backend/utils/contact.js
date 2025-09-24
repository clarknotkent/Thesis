function normalizePhilippineMobile(input) {
  if (!input) return { valid: false, normalized: null, error: 'Missing contact number' };
  let raw = String(input).replace(/\D/g, '');
  if (raw.startsWith('00963') && raw.length === 15) {
    raw = '0' + raw.slice(5);
  } else if (raw.startsWith('63') && raw.length === 12) {
    raw = '0' + raw.slice(2);
  } else if (raw.startsWith('9') && raw.length === 10) {
    raw = '0' + raw;
  }
  const PH_MOBILE_REGEX = /^09\d{9}$/;
  if (!PH_MOBILE_REGEX.test(raw)) {
    return { valid: false, normalized: null, error: 'Contact number must be 11 digits starting with 09 (e.g. 09123456789)' };
  }
  return { valid: true, normalized: raw };
}

module.exports = { normalizePhilippineMobile };
