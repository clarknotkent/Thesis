const { verifyToken } = require('../models/authModel');

module.exports = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization header missing' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Token missing' });
    }

    const isValid = await verifyToken(token);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Optionally, attach user info to the request object
    req.user = { token }; // Replace with actual user info if available

    next();
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
