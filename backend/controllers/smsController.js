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

// Send reminder notifications
const sendReminderNotifications = async (req, res) => {
  try {
    const { type = 'all', daysAhead = 7 } = req.query;
    const reminders = await smsModel.sendScheduledReminders(type, daysAhead);
    res.json({ 
      success: true,
      message: 'Reminder notifications sent', 
      data: { count: reminders.length, reminders } 
    });
  } catch (error) {
    console.error('Error sending reminder notifications:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to send reminder notifications', 
      error: error.message 
    });
  }
};

// Get SMS history
const getSMSHistory = async (req, res) => {
  try {
    const { 
      limit = 50, 
      offset = 0, 
      phoneNumber, 
      type, 
      status,
      startDate,
      endDate 
    } = req.query;
    
    const filters = { phoneNumber, type, status, startDate, endDate };
    const history = await smsModel.getSMSHistory(parseInt(limit), parseInt(offset), filters);
    res.json({ 
      success: true, 
      data: history 
    });
  } catch (error) {
    console.error('Error fetching SMS history:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch SMS history', 
      error: error.message 
    });
  }
};

// Configure SMS settings
const configureSMSSettings = async (req, res) => {
  try {
    const settings = req.body;
    const result = await smsModel.updateSMSSettings(settings);
    res.json({ 
      success: true,
      message: 'SMS settings updated successfully', 
      data: result 
    });
  } catch (error) {
    console.error('Error configuring SMS settings:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to configure SMS settings', 
      error: error.message 
    });
  }
};

// Get SMS delivery status
const getSMSDeliveryStatus = async (req, res) => {
  try {
    const { messageId } = req.params;
    const status = await smsModel.getSMSDeliveryStatus(messageId);
    
    if (!status) {
      return res.status(404).json({ 
        success: false,
        message: 'SMS message not found' 
      });
    }
    
    res.json({ 
      success: true, 
      data: status 
    });
  } catch (error) {
    console.error('Error getting SMS delivery status:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to get SMS delivery status', 
      error: error.message 
    });
  }
};

// Send bulk SMS notifications
const sendBulkSMS = async (req, res) => {
  try {
    const { recipients, message, type = 'bulk' } = req.body;
    
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Recipients array is required and must not be empty' 
      });
    }
    
    if (!message) {
      return res.status(400).json({ 
        success: false,
        message: 'Message is required' 
      });
    }

    const results = await smsModel.sendBulkSMS(recipients, message, type);
    res.json({ 
      success: true,
      message: 'Bulk SMS sent', 
      data: results 
    });
  } catch (error) {
    console.error('Error sending bulk SMS:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to send bulk SMS', 
      error: error.message 
    });
  }
};

// Get SMS templates
const getSMSTemplates = async (req, res) => {
  try {
    const { type } = req.query;
    const templates = await smsModel.getSMSTemplates(type);
    res.json({ 
      success: true, 
      data: templates 
    });
  } catch (error) {
    console.error('Error fetching SMS templates:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch SMS templates', 
      error: error.message 
    });
  }
};

// Create SMS template
const createSMSTemplate = async (req, res) => {
  try {
    const templateData = {
      name: req.body.name,
      type: req.body.type,
      message: req.body.message,
      variables: req.body.variables || [],
      is_active: req.body.is_active !== undefined ? req.body.is_active : true
    };

    const template = await smsModel.createSMSTemplate(templateData);
    res.status(201).json({ 
      success: true,
      message: 'SMS template created successfully', 
      data: template 
    });
  } catch (error) {
    console.error('Error creating SMS template:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to create SMS template', 
      error: error.message 
    });
  }
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