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
