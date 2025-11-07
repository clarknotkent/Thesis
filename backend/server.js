import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { logRequest, handleErrors } from './middlewares/authMiddleware.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
// Allow Express to respect X-Forwarded-* headers when behind a proxy (Railway, Render, Nginx)
app.set('trust proxy', 1);

// Middleware
app.use(cors());
app.use(express.json());
app.use(logRequest);

// Routes
import patientRoutes from './routes/patientRoutes.js';
import userRoutes from './routes/userRoutes.js';
import vaccineRoutes from './routes/vaccineRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import authRoutes from './routes/authRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import smsRoutes from './routes/smsRoutes.js';
import healthWorkerRoutes from './routes/healthWorkerRoutes.js';
import activityRoutes from './routes/activityRoutes.js';
import visitRoutes from './routes/visitRoutes.js';
import conversationRoutes from './routes/conversationRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import guardianRoutes from './routes/guardianRoutes.js';
import parentRoutes from './routes/parentRoutes.js';
import immunizationRoutes from './routes/immunizationRoutes.js';
import dewormingRoutes from './routes/dewormingRoutes.js';
import vitaminaRoutes from './routes/vitaminaRoutes.js';
import vitalsRoutes from './routes/vitalsRoutes.js';
import receivingReportRoutes from './routes/receivingReportRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import faqRoutes from './routes/faqRoutes.js';
import qrRoutes from './routes/qrRoutes.js';
// Start background workers
import * as smsScheduler from './services/smsScheduler.js';

app.use('/api/patients', patientRoutes);
app.use('/api/users', userRoutes);
app.use('/api/vaccines', vaccineRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/sms', smsRoutes);
app.use('/api/health-staff', healthWorkerRoutes);
app.use('/api/activity-logs', activityRoutes);
app.use('/api/visits', visitRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/guardians', guardianRoutes);
app.use('/api/parent', parentRoutes);
app.use('/api/immunizations', immunizationRoutes);
app.use('/api/deworming', dewormingRoutes);
app.use('/api/vitamina', vitaminaRoutes);
app.use('/api/vitalsigns', vitalsRoutes);
app.use('/api/vitals', vitalsRoutes);
app.use('/api/receiving-reports', receivingReportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/faqs', faqRoutes);
app.use('/qr', qrRoutes); // public + protected QR endpoints
// Alias route for vaccination-records (used by frontend)
app.use('/api/vaccination-records', immunizationRoutes);

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
  // Initialize background scheduler after server starts
  try {
    smsScheduler.start();
  } catch (e) {
    console.error('Failed to start SMS scheduler:', e);
  }
});

// Capture uncaught errors at process level
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception thrown:', err);
});
