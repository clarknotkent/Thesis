const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { logRequest, handleErrors } = require('./middlewares/authMiddleware');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(logRequest);

// Routes
const patientRoutes = require('./routes/patientRoutes');
const userRoutes = require('./routes/userRoutes');
const vaccineRoutes = require('./routes/vaccineRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const authRoutes = require('./routes/authRoutes');

app.use('/api/patients', patientRoutes);
app.use('/api/users', userRoutes);
app.use('/api/vaccines', vaccineRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/auth', authRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ message: 'Server is running successfully!' });
});

// Error handling middleware (centralized)
app.use(handleErrors);

// 404 handler (with logging)
app.use('*', (req, res) => {
  console.error(`404 Not Found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ message: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Capture uncaught errors at process level
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception thrown:', err);
});