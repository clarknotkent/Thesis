function normalizePhilippineMobile(input) {
  if (!input) return { valid: false, normalized: null, error: 'Missing contact number' };
  let raw = String(input).replace(/\D/g, '');
  // Convert common international prefixes to local 0-based format
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

// Normalize to +639XXXXXXXXX format (E.164 for PH mobiles) for DB lookups/storage
function normalizeToPlus63Mobile(input) {
  if (!input) return { valid: false, normalized: null, error: 'Missing contact number' };
  let raw = String(input).trim();
  // Strip all non-digits except leading +
  const hasPlus = raw.startsWith('+');
  raw = raw.replace(/[^\d+]/g, '');
  // Remove leading + for easier handling below
  if (raw.startsWith('+')) raw = raw.slice(1);

  // Cases to handle: 09XXXXXXXXX, 9XXXXXXXXX, 63XXXXXXXXXX, 639XXXXXXXXX, 00963XXXXXXXXX
  if (/^09\d{9}$/.test(raw)) {
    return { valid: true, normalized: '+639' + raw.slice(2) };
  }
  if (/^9\d{9}$/.test(raw)) {
    return { valid: true, normalized: '+639' + raw };
  }
  if (/^639\d{9}$/.test(raw)) {
    return { valid: true, normalized: '+63' + raw.slice(0) };
  }
  if (/^63\d{10}$/.test(raw)) {
    return { valid: true, normalized: '+63' + raw };
  }
  if (/^00963\d{10}$/.test(raw)) {
    return { valid: true, normalized: '+63' + raw.slice(2) };
  }
  return { valid: false, normalized: null, error: 'Invalid Philippine mobile number' };
}

// Return both local 09... and +639... variants when valid; useful for tolerant comparisons
function getPhoneVariants(input) {
  const local = normalizePhilippineMobile(input);
  const intl = normalizeToPlus63Mobile(input);
  const out = [];
  if (local.valid) out.push(local.normalized);
  if (intl.valid) out.push(intl.normalized);
  return { valid: local.valid || intl.valid, variants: Array.from(new Set(out)), local, intl };
}

module.exports = { normalizePhilippineMobile, normalizeToPlus63Mobile, getPhoneVariants };
