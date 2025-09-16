
const jwt = require('jsonwebtoken');
const { verifyToken, getUserMappingByUUID } = require('../models/authModel');

// Authenticate request and attach user info
const authenticateRequest = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization header missing' });
    }
    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Token missing' });
    }
    const user = await verifyToken(token);
    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Authorize user by role
const authorizeRole = (roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
};

// Check user mapping exists
const checkUserMapping = async (req, res, next) => {
  try {
    const uuid = req.user && req.user.uuid;
    if (!uuid) return res.status(401).json({ error: 'No UUID found' });
    const mapping = await getUserMappingByUUID(uuid);
    if (!mapping) return res.status(401).json({ error: 'User mapping not found' });
    req.user.user_id = mapping.user_id;
    next();
  } catch (error) {
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
const validateToken = async (req, res, next) => {
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
const validateInput = (schema) => (req, res, next) => {
  // This is a placeholder for input validation
  // In a full implementation, you'd use Joi or similar
  if (!req.body) {
    return res.status(400).json({ error: 'Request body is required' });
  }
  next();
};

// Error handling middleware
const handleErrors = (error, req, res, next) => {
  console.error('Error:', error);
  
  // Database errors
  if (error.code) {
    switch (error.code) {
      case '23505': // Unique violation
        return res.status(409).json({ error: 'Duplicate entry' });
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

module.exports = {
  authenticateRequest,
  authorizeRole,
  checkUserMapping,
  enforceRLS,
  validateToken,
  validateInput,
  handleErrors,
  logRequest,
};
