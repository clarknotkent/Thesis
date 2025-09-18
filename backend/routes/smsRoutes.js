const express = require('express');
const router = express.Router();
const { authenticateRequest, authorizeRole, checkUserMapping } = require('../middlewares/authMiddleware');
const {
	sendSMSNotification,
	sendReminderNotifications,
	getSMSHistory,
	configureSMSSettings,
	getSMSDeliveryStatus,
	sendBulkSMS,
	getSMSTemplates,
	createSMSTemplate
} = require('../controllers/smsController');

// POST /api/sms - Send an SMS notification
router.post('/', authenticateRequest, checkUserMapping, authorizeRole(['admin','health_worker']), sendSMSNotification);

// POST /api/sms/reminders - Send scheduled reminder notifications
router.post('/reminders', authenticateRequest, checkUserMapping, authorizeRole(['admin','health_worker']), sendReminderNotifications);

// GET /api/sms/history - Get SMS history
router.get('/history', authenticateRequest, checkUserMapping, authorizeRole(['admin','health_worker']), getSMSHistory);

// PUT /api/sms/settings - Configure SMS settings
router.put('/settings', authenticateRequest, checkUserMapping, authorizeRole(['admin']), configureSMSSettings);

// GET /api/sms/status/:messageId - Get SMS delivery status
router.get('/status/:messageId', authenticateRequest, checkUserMapping, authorizeRole(['admin','health_worker']), getSMSDeliveryStatus);

// POST /api/sms/bulk - Send bulk SMS notifications
router.post('/bulk', authenticateRequest, checkUserMapping, authorizeRole(['admin']), sendBulkSMS);

// GET /api/sms/templates - Get SMS templates
router.get('/templates', authenticateRequest, checkUserMapping, authorizeRole(['admin','health_worker']), getSMSTemplates);

// POST /api/sms/templates - Create SMS template
router.post('/templates', authenticateRequest, checkUserMapping, authorizeRole(['admin']), createSMSTemplate);

module.exports = router;
