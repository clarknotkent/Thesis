// File: backend/middlewares/authMiddleware.js

// Authorize user by role
const normalizeRole = (r) => {
  if (!r) return '';
  // lowercase, remove non-alphanumeric characters (spaces, dashes, underscores)
  return String(r).toLowerCase().replace(/[^a-z0-9]/g, '');
};

const authorizeRole = (roles) => (req, res, next) => {
  const allowed = (roles || []).map(r => normalizeRole(r));
  const current = normalizeRole((req.user && req.user.role) || '');
  const ok = allowed.includes(current);
  if (!ok) {
    console.warn('[auth] forbidden role', { required: allowed, got: current, userId: req.user && (req.user.user_id || req.user.id) });
    return res.status(403).json({ error: 'Forbidden: insufficient role' });
  }
  next();
};

export { authorizeRole };

// Figure X. Key middleware for role authorization.

// ============================================================================
// PWA Configuration
// ============================================================================

// File: frontend/vite.config.js

import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'ImmunizeMe - Healthcare Management System',
        short_name: 'ImmunizeMe',
        theme_color: '#0d6efd',
        icons: [/* icon configurations */]
      },
      workbox: {
        runtimeCaching: [{
          urlPattern: /^\/api\/.*$/,
          handler: 'NetworkFirst'
        }]
      }
    })
  ]
});

// Figure Y. PWA configuration with service worker and offline caching.

// ============================================================================
// IndexedDB Schema
// ============================================================================

// File: frontend/src/services/offline/db.js

import Dexie from 'dexie';

export const db = new Dexie('e-immunization-db');

db.version(1).stores({
  patients: 'id, full_name, guardian_id',
  vaccine_records: 'id, patient_id, vaccine_id, date_administered',
  schedules: 'id, patient_id, vaccine_id, scheduled_date',
  medical_history: 'id, patient_id, visit_id'
  // ... other tables
});

// Figure Z. IndexedDB schema definition using Dexie.js for offline data caching.
// Note: The offline data-caching feature is still in development and testing phase.
