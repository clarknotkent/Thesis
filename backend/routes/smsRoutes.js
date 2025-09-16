const express = require('express');
const router = express.Router();
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
router.post('/', sendSMSNotification);

// POST /api/sms/reminders - Send scheduled reminder notifications
router.post('/reminders', sendReminderNotifications);

// GET /api/sms/history - Get SMS history
router.get('/history', getSMSHistory);

// PUT /api/sms/settings - Configure SMS settings
router.put('/settings', configureSMSSettings);

// GET /api/sms/status/:messageId - Get SMS delivery status
router.get('/status/:messageId', getSMSDeliveryStatus);

// POST /api/sms/bulk - Send bulk SMS notifications
router.post('/bulk', sendBulkSMS);

// GET /api/sms/templates - Get SMS templates
router.get('/templates', getSMSTemplates);

// POST /api/sms/templates - Create SMS template
router.post('/templates', createSMSTemplate);

module.exports = router;
