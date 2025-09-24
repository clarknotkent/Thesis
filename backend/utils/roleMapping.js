// Central role mapping utility: converts arbitrary incoming role labels
// to canonical storage tokens enforced by DB constraints, and back to
// human-friendly display labels for the frontend.

const CANONICAL_ROLES = ['admin', 'health_worker', 'guardian'];

// Map many possible incoming variants to canonical
const INCOMING_TO_CANONICAL = {
  admin: 'admin',
  administrator: 'admin',
  'system admin': 'admin',

  'health worker': 'health_worker',
  health_worker: 'health_worker',
  healthworker: 'health_worker',
  'health-worker': 'health_worker',
  hw: 'health_worker',

  guardian: 'guardian',
  parent: 'guardian',
  'guardian-parent': 'guardian'
};

const CANONICAL_TO_DISPLAY = {
  admin: 'Admin',
  health_worker: 'Health Worker',
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

module.exports = {
  toCanonicalRole,
  toDisplayRole,
  isCanonicalRole,
  CANONICAL_ROLES
};
