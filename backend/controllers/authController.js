const authModel = require('../models/authModel');
const userModel = require('../models/userModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const supabase = require('../db');

// Register a new user
const registerUser = async (req, res) => {
  try {
    const { username, password, email, name } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await authModel.registerUser({ username, password_hash: hashedPassword, email, name });
    res.status(201).json(newUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Registration failed' });
  }
};

// Login user (accepts username, email, or phone as identifier) using Supabase Auth
const loginUser = async (req, res) => {
  try {
    const { username, identifier: rawIdentifier, password } = req.body;
    const identifier = (rawIdentifier || username || '').trim();

    if (!identifier || !password) {
      return res.status(400).json({ message: 'Identifier and password are required' });
    }

    // Resolve application user first to map username -> email/phone
    const appUser = await authModel.findUserByIdentifier(identifier);
    if (!appUser) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Decide whether to sign in via email or phone
    const isEmail = /@/.test(identifier);
    const isPhoneLike = /^\+?\d[\d\s-]{5,}$/.test(identifier);

    let signInResult;
    if (isEmail) {
      signInResult = await supabase.auth.signInWithPassword({ email: identifier, password });
    } else if (isPhoneLike) {
      signInResult = await supabase.auth.signInWithPassword({ phone: identifier, password });
    } else if (appUser.email) {
      signInResult = await supabase.auth.signInWithPassword({ email: appUser.email, password });
    } else if (appUser.contact_number) {
      signInResult = await supabase.auth.signInWithPassword({ phone: appUser.contact_number, password });
    } else {
      return res.status(400).json({ message: 'User record missing email/phone for authentication' });
    }

    const { data: sessionData, error: signInError } = signInResult || {};
    if (signInError || !sessionData?.user) {
      console.warn('Login failed:', { identifier, reason: signInError?.message || 'invalid' });
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const supabaseUUID = sessionData.user.id;

    // Ensure user mapping exists
    try {
      const existingMap = await authModel.getUserMappingByUUID(supabaseUUID);
      if (!existingMap) {
        await authModel.createUserMapping({ uuid: supabaseUUID, user_id: appUser.user_id });
      }
    } catch (e) {
      // Non-fatal: log and proceed
      console.error('User mapping check/create failed:', e?.message || e);
    }

    // Update last login timestamp
    try {
      await userModel.updateLastLogin(appUser.user_id);
      appUser.last_login = new Date().toISOString();
    } catch (e) {
      console.error('Failed to update last_login:', e);
    }

    // Issue application JWT for frontend
    const token = jwt.sign({ id: appUser.user_id, role: appUser.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    console.log(`Login success: user_id=${appUser.user_id} role=${appUser.role} identifier=${identifier}`);
    res.json({ token, user: appUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Login failed' });
  }
};

// Logout user (token-based, just client-side)
const logoutUser = async (req, res) => {
  try {
    // If auth middleware attaches user, log it. Otherwise just note anonymous logout request.
    if (req.user?.id) {
      console.log(`Logout: user_id=${req.user.id} role=${req.user.role}`);
    } else if (req.tokenPayload?.id) {
      console.log(`Logout: user_id=${req.tokenPayload.id} role=${req.tokenPayload.role}`);
    } else {
      console.log('Logout requested (no user context)');
    }
    res.json({ message: 'Logged out successfully' });
  } catch (e) {
    console.error('Logout logging failed:', e);
    res.json({ message: 'Logged out successfully' });
  }
};

// Reset password
const resetPassword = async (req, res) => {
  try {
    const { userId, newPassword } = req.body;
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await authModel.changePassword(userId, hashedPassword);
    res.json({ message: 'Password reset successful' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Password reset failed' });
  }
};

// Link Supabase Auth user to local user
const linkSupabaseUser = async (req, res) => {
  try {
    const { uuid, userId } = req.body;
    await authModel.createUserMapping({ uuid, user_id: userId });
    res.json({ message: 'User mapping created' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'User mapping failed' });
  }
};

// Get user mapping
const getUserMapping = async (req, res) => {
  try {
    const { uuid } = req.query;
    const mapping = await authModel.getUserMappingByUUID(uuid);
    res.json(mapping);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Get user mapping failed' });
  }
};

// Refresh token
const refreshToken = async (req, res) => {
  try {
    const { token } = req.body;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const newToken = jwt.sign({ id: decoded.id, role: decoded.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token: newToken });
  } catch (error) {
    console.error(error);
    res.status(401).json({ message: 'Token refresh failed' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  resetPassword,
  linkSupabaseUser,
  getUserMapping,
  refreshToken,
};