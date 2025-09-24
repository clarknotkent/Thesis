const express = require('express');
const router = express.Router();
const {
	registerUser,
	loginUser,
	logoutUser,
	linkSupabaseUser,
	getUserMapping,
	refreshToken
} = require('../controllers/authController');
const { validateToken, optionalAuthenticate } = require('../middlewares/authMiddleware');

// POST /api/auth/register - User registration
router.post('/register', optionalAuthenticate, registerUser);

// POST /api/auth/login - User login
router.post('/login', loginUser);

// POST /api/auth/logout - User logout (validate token so we can log user info)
router.post('/logout', validateToken, logoutUser);


// POST /api/auth/link-supabase - Link Supabase user
router.post('/link-supabase', linkSupabaseUser);

// GET /api/auth/user-mapping - Get user mapping
router.get('/user-mapping', getUserMapping);

// POST /api/auth/refresh-token - Refresh token
router.post('/refresh-token', refreshToken);

module.exports = router;
