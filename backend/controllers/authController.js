const authModel = require('../models/authModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// User login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await authModel.getUserByEmail(email);

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Login failed' });
  }
};

// User registration
const register = async (req, res) => {
  try {
    const { email, password, name } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await authModel.createUser({ email, password: hashedPassword, name });
    res.status(201).json(newUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Registration failed' });
  }
};

module.exports = {
  login,
  register,
};