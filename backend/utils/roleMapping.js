// Central role mapping utility: converts arbitrary incoming role labels
// to canonical storage tokens enforced by DB constraints, and back to
// human-friendly display labels for the frontend.

const CANONICAL_ROLES = ['admin', 'health_staff', 'guardian'];

// Map many possible incoming variants to canonical
const INCOMING_TO_CANONICAL = {
  admin: 'admin',
  administrator: 'admin',
  'system admin': 'admin',

  'health worker': 'health_staff',
  health_worker: 'health_staff',
  healthworker: 'health_staff',
  'health-worker': 'health_staff',
  hw: 'health_staff',
  'health staff': 'health_staff',
  healthstaff: 'health_staff',
  'health_staff': 'health_staff',

  guardian: 'guardian',
  parent: 'guardian',
  'guardian-parent': 'guardian'
};

const CANONICAL_TO_DISPLAY = {
  admin: 'Admin',
  health_staff: 'Health Staff',
  guardian: 'Guardian'
};

function toCanonicalRole(role) {
  if (!role) return null;
  const key = String(role).trim().toLowerCase();
  return INCOMING_TO_CANONICAL[key] || key; // fallback allows visibility for unexpected values
}

function toDisplayRole(role) {
  if (!role) return '';
  const key = String(role).trim().toLowerCase();
  return CANONICAL_TO_DISPLAY[key] || role; // if already a legacy capitalized form keep it
}

function isCanonicalRole(role) {
  return CANONICAL_ROLES.includes(String(role || '').toLowerCase());
}

export { toCanonicalRole,
  toDisplayRole,
  isCanonicalRole,
  CANONICAL_ROLES };
