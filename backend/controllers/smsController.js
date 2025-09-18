const smsModel = require('../models/smsModel');

// Send SMS notification
const sendSMSNotification = async (req, res) => {
  try {
    const { phoneNumber, message, type = 'general' } = req.body;
    
    if (!phoneNumber || !message) {
      return res.status(400).json({ 
        success: false,
        message: 'Phone number and message are required' 
      });
    }

    const result = await smsModel.sendSMS(phoneNumber, message, type);
    res.json({ 
      success: true,
      message: 'SMS sent successfully', 
      data: result 
    });
  } catch (error) {
    console.error('Error sending SMS:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to send SMS', 
      error: error.message 
    });
  }
};

// Send reminder notifications (placeholder)
const sendReminderNotifications = async (req, res) => {
  try {
    res.json({ success: true, message: 'Reminders not implemented in backend. Use scheduler + notifications table.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to send reminder notifications', error: error.message });
  }
};

// Get SMS history (from notifications table)
const getSMSHistory = async (req, res) => {
  try {
    const history = await smsModel.getAllNotifications();
    res.json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch SMS history', error: error.message });
  }
};

const configureSMSSettings = async (req, res) => {
  res.json({ success: true, message: 'SMS settings management not implemented' });
};

const getSMSDeliveryStatus = async (req, res) => {
  try {
    const { messageId } = req.params;
    const notif = await smsModel.getNotificationById(messageId);
    if (!notif) return res.status(404).json({ success: false, message: 'SMS message not found' });
    res.json({ success: true, data: { status: notif.status, notification: notif } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get SMS delivery status', error: error.message });
  }
};

// Send bulk SMS notifications
const sendBulkSMS = async (req, res) => {
  try {
    const { recipients, message } = req.body;
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ success: false, message: 'Recipients array required' });
    }
    if (!message) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }
    const results = await Promise.all(
      recipients.map(async (to) => {
        const sent = await smsModel.sendSMS(to, message);
        await smsModel.logSMS(to, message, 'SENT');
        return sent;
      })
    );
    res.json({ success: true, message: 'Bulk SMS processed', data: results });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to send bulk SMS', error: error.message });
  }
};

// Get SMS templates
const getSMSTemplates = async (req, res) => {
  res.json({ success: true, data: [] });
};

// Create SMS template
const createSMSTemplate = async (req, res) => {
  res.status(201).json({ success: true, message: 'SMS templates not implemented' });
};

module.exports = {
  sendSMSNotification,
  sendReminderNotifications,
  getSMSHistory,
  configureSMSSettings,
  getSMSDeliveryStatus,
  sendBulkSMS,
  getSMSTemplates,
  createSMSTemplate,
};