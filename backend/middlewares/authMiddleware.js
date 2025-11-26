
import jwt from 'jsonwebtoken';
import { verifyToken, getUserMappingByUUID } from '../models/authModel.js';
import { getSupabaseForRequest } from '../utils/supabaseClient.js';

// Authenticate request and attach user info
const authenticateRequest = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      console.warn('[auth] Missing Authorization header');
      return res.status(401).json({ error: 'Authorization header missing' });
    }
    const token = authHeader.split(' ')[1];
    if (!token) {
      console.warn('[auth] Missing Bearer token');
      return res.status(401).json({ error: 'Token missing' });
    }
    const user = await verifyToken(token);
    if (!user) {
      console.warn('[auth] Invalid token or user not found');
      return res.status(401).json({ error: 'Invalid token' });
    }
    req.user = user;
    // If verifyToken returned a uuid field, try to attach local mapping user_id
    try {
      if (user.uuid) {
        const mapping = await getUserMappingByUUID(user.uuid).catch(() => null);
        if (mapping && mapping.user_id) req.user.user_id = mapping.user_id;
      }
    } catch (_) {}
    console.log('[auth] authenticated', { id: user.id, role: user.role, user_id: req.user.user_id || null });
    next();
  } catch (error) {
    console.error('[auth] authenticateRequest error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Normalize role strings for flexible comparisons
const normalizeRole = (r) => {
  if (!r) return '';
  // lowercase, remove non-alphanumeric characters (spaces, dashes, underscores)
  return String(r).toLowerCase().replace(/[^a-z0-9]/g, '');
};

// Authorize user by role
// Note: super_admin has all admin privileges
const authorizeRole = (roles) => (req, res, next) => {
  const allowed = (roles || []).map(r => normalizeRole(r));
  const current = normalizeRole((req.user && req.user.role) || '');

  // Super admins have all admin permissions
  const isSuperAdmin = current === 'superadmin';
  const hasAdminPrivilege = allowed.includes('admin') && isSuperAdmin;

  const ok = allowed.includes(current) || hasAdminPrivilege;
  if (!ok) {
    console.warn('[auth] forbidden role', { required: allowed, got: current, userId: req.user && (req.user.user_id || req.user.id) });
    return res.status(403).json({ error: 'Forbidden: insufficient role' });
  }
  next();
};

// Check user mapping exists
const checkUserMapping = async (req, res, next) => {
  try {
    const uuid = req.user && req.user.uuid;
    if (!uuid) return res.status(401).json({ error: 'No UUID found' });
    const mapping = await getUserMappingByUUID(uuid);
    console.log('[auth] mapping lookup', { uuid, found: !!mapping });
    if (!mapping) return res.status(401).json({ error: 'User mapping not found' });
    req.user.user_id = mapping.user_id;
    next();
  } catch (error) {
    console.error('[auth] checkUserMapping error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Enforce row-level security (placeholder - RLS is handled at database level)
const enforceRLS = (req, res, next) => {
  // RLS is enforced at the database level via policies
  // This middleware can be used for additional application-level checks
  next();
};

// Validate token format and expiration
const validateToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization header missing' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Token missing' });
    }

    // Verify token without database lookup (for quick validation)
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.tokenPayload = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    res.status(500).json({ error: 'Token validation error' });
  }
};

// Input validation middleware (basic implementation)
const validateInput = (_schema) => (req, res, next) => {
  // This is a placeholder for input validation
  // In a full implementation, you'd use Joi or similar
  if (!req.body) {
    return res.status(400).json({ error: 'Request body is required' });
  }
  next();
};

// Error handling middleware
const handleErrors = (error, req, res, _next) => {
  console.error('Error:', error);

  // Database errors
  if (error.code) {
    switch (error.code) {
      case '23505': { // Unique violation
        const detail = (error.detail || '').toLowerCase();
        let field = 'value';
        if (detail.includes('username')) field = 'username';
        else if (detail.includes('email')) field = 'email';
        else if (detail.includes('contact')) field = 'contact_number';
        return res.status(409).json({ error: `Duplicate ${field}` });
      }
      case '23514': { // Check constraint violation
        const msg = error.message || 'Constraint violation';
        return res.status(400).json({ error: msg });
      }
      case '42703': { // Undefined column (often NEW.id vs NEW.user_id in triggers)
        return res.status(500).json({
          error: 'Database trigger/function references a non-existent column (e.g., NEW.id). Update triggers to use NEW.user_id/OLD.user_id.'
        });
      }
      case '23503': // Foreign key violation
        return res.status(400).json({ error: 'Referenced resource not found' });
      case '23502': // Not null violation
        return res.status(400).json({ error: 'Required field missing' });
      default:
        return res.status(500).json({ error: 'Database error' });
    }
  }

  // Default error
  res.status(error.status || 500).json({
    error: error.message || 'Internal server error'
  });
};

// Request logging middleware
const logRequest = (req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.originalUrl;
  const ip = req.ip || req.connection.remoteAddress;

  console.log(`[${timestamp}] ${method} ${url} - IP: ${ip}`);
  next();
};

// Attempts to authenticate but never blocks. If token invalid/missing, continues without req.user.
const optionalAuthenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return next();
    const token = authHeader.split(' ')[1];
    if (!token) return next();
    const user = await verifyToken(token);
    if (user) {
      req.user = user;
      // Also attempt mapping (non-fatal if missing)
      try {
        if (user.uuid) {
          const mapping = await getUserMappingByUUID(user.uuid);
          if (mapping) req.user.user_id = mapping.user_id;
        }
      } catch (_) {}
      console.log('[auth optional] attached user context', { id: req.user.user_id || req.user.id, role: req.user.role });
    }
    return next();
  } catch (_) {
    return next();
  }
};

// Ensure the current user can read a specific patient's data.
// Admin/health roles bypass; guardians/parents must own the patient.
const authorizePatientReadAccess = async (req, res, next) => {
  try {
    const role = normalizeRole(req.user && req.user.role);
    // System/staff roles: allow (includes super_admin)
    const staffRoles = ['admin', 'superadmin', 'super_admin', 'healthworker', 'healthstaff', 'health_worker', 'health_staff'].map(normalizeRole);
    if (staffRoles.includes(role)) return next();

    // Only guardians/parents can proceed with ownership checks
    const isGuardian = role === 'guardian' || role === 'parent' || role === 'guardianparent';
    if (!isGuardian) {
      console.warn('[auth] Forbidden: role not allowed to read patient', { role, userId: req.user && (req.user.user_id || req.user.id) });
      return res.status(403).json({ error: 'Forbidden: role cannot access patient data' });
    }

    // Ensure we have a mapped user_id
    if (!req.user.user_id && req.user.uuid) {
      try {
        const mapping = await getUserMappingByUUID(req.user.uuid);
        if (mapping && mapping.user_id) req.user.user_id = mapping.user_id;
      } catch (_) {}
    }
    const userId = req.user && req.user.user_id;
    if (!userId) {
      console.warn('[auth] Missing user_id for ownership check');
      return res.status(401).json({ error: 'Unauthorized: user mapping not found' });
    }

    const patientId = req.params && req.params.id;
    if (!patientId) return res.status(400).json({ error: 'Bad request: patient id missing' });

    const supabase = getSupabaseForRequest(req);
    // Use patients_view to resolve guardian_user_id quickly
    const { data: row, error } = await supabase
      .from('patients_view')
      .select('patient_id, guardian_user_id')
      .eq('patient_id', patientId)
      .maybeSingle();
    if (error) {
      console.error('[auth] patients_view lookup error', error);
      return res.status(500).json({ error: 'Internal error validating patient access' });
    }
    if (!row) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    if (row.guardian_user_id !== userId) {
      console.warn('[auth] Forbidden: guardian tried to access non-owned patient', { patientId, userId });
      return res.status(403).json({ error: "Forbidden: you can only view your child's record" });
    }
    return next();
  } catch (e) {
    console.error('[auth] authorizePatientReadAccess error', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export {
  authenticateRequest,
  optionalAuthenticate,
  authorizeRole,
  checkUserMapping,
  authorizePatientReadAccess,
  enforceRLS,
  validateToken,
  validateInput,
  handleErrors,
  logRequest
};
