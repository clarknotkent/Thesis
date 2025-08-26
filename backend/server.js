const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const patientRoutes = require('./routes/patientRoutes');
const userRoutes = require('./routes/userRoutes');
const vaccineRoutes = require('./routes/vaccineRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

app.use('/api/patients', patientRoutes);
app.use('/api/users', userRoutes);
app.use('/api/vaccines', vaccineRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ message: 'Server is running successfully!' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});