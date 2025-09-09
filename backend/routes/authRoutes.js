const express = require('express');
const router = express.Router();
const { login, register, verifyToken } = require('../controllers/authController');

// POST /api/auth/login - User login
router.post('/login', login);

// POST /api/auth/register - User registration
router.post('/register', register);

// GET /api/auth/verify - Verify authentication token
router.get('/verify', verifyToken);

module.exports = router;
