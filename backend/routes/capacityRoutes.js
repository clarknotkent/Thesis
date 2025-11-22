import express from 'express';
import { authenticateRequest, checkUserMapping } from '../middlewares/authMiddleware.js';
import { authorizeRole } from '../middlewares/authMiddleware.js';
import * as capacityController from '../controllers/capacityController.js';

const router = express.Router();

// Get capacity for a specific date
router.get(
  '/date/:date',
  authenticateRequest,
  checkUserMapping,
  authorizeRole(['admin', 'health_worker', 'health_staff']),
  capacityController.getCapacityForDate
);

// Get capacity for a date range (calendar view)
router.get(
  '/range',
  authenticateRequest,
  checkUserMapping,
  authorizeRole(['admin', 'health_worker', 'health_staff']),
  capacityController.getCapacityRange
);

// Update capacity limits for a date
router.put(
  '/limits',
  authenticateRequest,
  checkUserMapping,
  authorizeRole(['admin', 'health_worker']),
  capacityController.updateCapacityLimits
);

// Update notes for a date
router.put(
  '/notes',
  authenticateRequest,
  checkUserMapping,
  authorizeRole(['admin', 'health_worker', 'health_staff']),
  capacityController.updateCapacityNotes
);

// Get available slot for a date
router.get(
  '/available-slot/:date',
  authenticateRequest,
  checkUserMapping,
  authorizeRole(['admin', 'health_worker', 'health_staff']),
  capacityController.getAvailableSlot
);

// Find next available date/slot
router.get(
  '/next-available',
  authenticateRequest,
  checkUserMapping,
  authorizeRole(['admin', 'health_worker', 'health_staff']),
  capacityController.findNextAvailable
);

// Get list of patients scheduled for a date
router.get(
  '/patients/:date/:slot?',
  authenticateRequest,
  checkUserMapping,
  authorizeRole(['admin', 'health_worker', 'health_staff']),
  capacityController.getScheduledPatients
);

// Recalculate capacity from schedules
router.post(
  '/recalculate/:date',
  authenticateRequest,
  checkUserMapping,
  authorizeRole(['admin']),
  capacityController.recalculateCapacity
);

// Get capacity statistics
router.get(
  '/stats',
  authenticateRequest,
  checkUserMapping,
  authorizeRole(['admin', 'health_worker']),
  capacityController.getCapacityStats
);

export default router;
