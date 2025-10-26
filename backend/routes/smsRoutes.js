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
	createSMSTemplate,
	updateSMSTemplate,
	deleteSMSTemplate,
	getGuardianAutoSendSettings,
	toggleGuardianAutoSend,
	bulkToggleAutoSend,
	getSMSStatistics,
	previewTemplate
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

// PUT /api/sms/templates/:id - Update SMS template
router.put('/templates/:id', authenticateRequest, checkUserMapping, authorizeRole(['admin']), updateSMSTemplate);

// DELETE /api/sms/templates/:id - Delete SMS template
router.delete('/templates/:id', authenticateRequest, checkUserMapping, authorizeRole(['admin']), deleteSMSTemplate);

// GET /api/sms/guardians - Get guardian auto-send settings
router.get('/guardians', authenticateRequest, checkUserMapping, authorizeRole(['admin']), getGuardianAutoSendSettings);

// PUT /api/sms/guardians/:guardianId - Toggle guardian auto-send
router.put('/guardians/:guardianId', authenticateRequest, checkUserMapping, authorizeRole(['admin']), toggleGuardianAutoSend);

// POST /api/sms/guardians/bulk-toggle - Bulk toggle auto-send
router.post('/guardians/bulk-toggle', authenticateRequest, checkUserMapping, authorizeRole(['admin']), bulkToggleAutoSend);

// GET /api/sms/statistics - Get SMS statistics
router.get('/statistics', authenticateRequest, checkUserMapping, authorizeRole(['admin']), getSMSStatistics);

// POST /api/sms/templates/preview - Preview template with variables
router.post('/templates/preview', authenticateRequest, checkUserMapping, authorizeRole(['admin', 'health_worker']), previewTemplate);

module.exports = router;
