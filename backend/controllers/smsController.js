const smsModel = require('../models/smsModel');
const smsService = require('../services/smsService');
const db = require('../db');

// Send SMS notification
const sendSMSNotification = async (req, res) => {
  try {
    const { 
      phoneNumber, 
      message, 
      templateId, 
      variables, 
      type = 'manual', 
      guardianId, 
      patientId 
    } = req.body;
    
    let finalMessage = message;
    
    // If templateId is provided, use template and replace variables
    if (templateId) {
      const templateResult = await db.query(
        'SELECT template FROM sms_templates WHERE id = $1',
        [templateId]
      );
      
      if (templateResult.rows.length === 0) {
        return res.status(404).json({ 
          success: false,
          message: 'Template not found' 
        });
      }
      
      // Replace variables in template
      finalMessage = smsService.replaceTemplateVariables(
        templateResult.rows[0].template,
        variables || {}
      );
    }
    
    if (!phoneNumber || !finalMessage) {
      return res.status(400).json({ 
        success: false,
        message: 'Phone number and message/template are required' 
      });
    }

    // Send SMS via PhilSMS
    const result = await smsService.sendSMS(phoneNumber, finalMessage);
    
    if (result.success) {
      // Log to database
      await db.query(
        `INSERT INTO sms_logs 
         (guardian_id, patient_id, phone_number, message, type, status, template_id, sent_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
        [guardianId || null, patientId || null, result.recipient, finalMessage, type, 'sent', templateId || null]
      );
    } else {
      // Log failed attempt
      await db.query(
        `INSERT INTO sms_logs 
         (guardian_id, patient_id, phone_number, message, type, status, error_message, template_id, sent_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
        [guardianId || null, patientId || null, result.recipient, finalMessage, type, 'failed', result.error, templateId || null]
      );
    }
    
    res.json({ 
      success: result.success,
      message: result.success ? 'SMS sent successfully' : 'SMS sending failed', 
      data: result,
      sentMessage: finalMessage
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
    res.json({ success: true, message: 'Reminders not implemented in back. Use scheduler + notifications table.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to send reminder notifications', error: error.message });
  }
};

// Get SMS history (from sms_logs table)
const getSMSHistory = async (req, res) => {
  try {
    const { status, type, startDate, endDate, search, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT 
        sl.id,
        sl.guardian_id,
        sl.patient_id,
        sl.phone_number,
        sl.message,
        sl.type,
        sl.status,
        sl.error_message,
        sl.sent_at,
        g.first_name || ' ' || g.last_name AS guardian_name,
        p.first_name || ' ' || p.last_name AS patient_name
      FROM sms_logs sl
      LEFT JOIN guardians g ON sl.guardian_id = g.id
      LEFT JOIN patients p ON sl.patient_id = p.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 1;
    
    if (status) {
      query += ` AND sl.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }
    
    if (type) {
      query += ` AND sl.type = $${paramCount}`;
      params.push(type);
      paramCount++;
    }
    
    if (startDate) {
      query += ` AND sl.sent_at >= $${paramCount}`;
      params.push(startDate);
      paramCount++;
    }
    
    if (endDate) {
      query += ` AND sl.sent_at <= $${paramCount}`;
      params.push(endDate);
      paramCount++;
    }
    
    if (search) {
      query += ` AND (sl.phone_number ILIKE $${paramCount} OR sl.message ILIKE $${paramCount} OR g.first_name ILIKE $${paramCount} OR g.last_name ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }
    
    query += ` ORDER BY sl.sent_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);
    
    const result = await db.query(query, params);
    
    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM sms_logs sl LEFT JOIN guardians g ON sl.guardian_id = g.id WHERE 1=1';
    const countParams = [];
    let countParamCount = 1;
    
    if (status) {
      countQuery += ` AND sl.status = $${countParamCount}`;
      countParams.push(status);
      countParamCount++;
    }
    
    if (type) {
      countQuery += ` AND sl.type = $${countParamCount}`;
      countParams.push(type);
      countParamCount++;
    }
    
    if (startDate) {
      countQuery += ` AND sl.sent_at >= $${countParamCount}`;
      countParams.push(startDate);
      countParamCount++;
    }
    
    if (endDate) {
      countQuery += ` AND sl.sent_at <= $${countParamCount}`;
      countParams.push(endDate);
      countParamCount++;
    }
    
    if (search) {
      countQuery += ` AND (sl.phone_number ILIKE $${countParamCount} OR sl.message ILIKE $${countParamCount} OR g.first_name ILIKE $${countParamCount} OR g.last_name ILIKE $${countParamCount})`;
      countParams.push(`%${search}%`);
    }
    
    const countResult = await db.query(countQuery, countParams);
    
    res.json({ 
      success: true, 
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].count)
      }
    });
  } catch (error) {
    console.error('Error fetching SMS history:', error);
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
  try {
    const result = await db.query(`
      SELECT * FROM sms_templates 
      ORDER BY created_at DESC
    `);
    
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching SMS templates:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch SMS templates', error: error.message });
  }
};

// Create SMS template
const createSMSTemplate = async (req, res) => {
  try {
    const { name, template, trigger_type, time_range, is_active = true } = req.body;
    
    if (!name || !template || !trigger_type) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name, template, and trigger_type are required' 
      });
    }
    
    const result = await db.query(
      `INSERT INTO sms_templates (name, template, trigger_type, time_range, is_active, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) 
       RETURNING *`,
      [name, template, trigger_type, time_range, is_active]
    );
    
    res.status(201).json({ success: true, message: 'Template created successfully', data: result.rows[0] });
  } catch (error) {
    console.error('Error creating SMS template:', error);
    res.status(500).json({ success: false, message: 'Failed to create SMS template', error: error.message });
  }
};

// Update SMS template
const updateSMSTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, template, trigger_type, time_range, is_active } = req.body;
    
    const result = await db.query(
      `UPDATE sms_templates 
       SET name = $1, template = $2, trigger_type = $3, time_range = $4, is_active = $5, updated_at = NOW()
       WHERE id = $6
       RETURNING *`,
      [name, template, trigger_type, time_range, is_active, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }
    
    res.json({ success: true, message: 'Template updated successfully', data: result.rows[0] });
  } catch (error) {
    console.error('Error updating SMS template:', error);
    res.status(500).json({ success: false, message: 'Failed to update SMS template', error: error.message });
  }
};

// Delete SMS template
const deleteSMSTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query('DELETE FROM sms_templates WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }
    
    res.json({ success: true, message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Error deleting SMS template:', error);
    res.status(500).json({ success: false, message: 'Failed to delete SMS template', error: error.message });
  }
};

// Get guardian auto-send settings
const getGuardianAutoSendSettings = async (req, res) => {
  try {
    const { search, status } = req.query;
    
    let query = `
      SELECT 
        g.id,
        g.first_name || ' ' || g.last_name AS name,
        g.relationship,
        g.phone_number AS phone,
        COALESCE(gas.auto_send_enabled, false) AS auto_send_enabled,
        COUNT(DISTINCT p.id) AS children_count,
        COUNT(DISTINCT CASE WHEN vs.status = 'pending' THEN vs.id END) AS pending_vaccines
      FROM guardians g
      LEFT JOIN guardian_auto_send_settings gas ON g.id = gas.guardian_id
      LEFT JOIN patients p ON g.id = p.guardian_id
      LEFT JOIN vaccination_schedules vs ON p.id = vs.patient_id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 1;
    
    if (search) {
      query += ` AND (g.first_name ILIKE $${paramCount} OR g.last_name ILIKE $${paramCount} OR g.phone_number ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }
    
    query += ` GROUP BY g.id, g.first_name, g.last_name, g.relationship, g.phone_number, gas.auto_send_enabled`;
    
    if (status === 'enabled') {
      query += ` HAVING COALESCE(gas.auto_send_enabled, false) = true`;
    } else if (status === 'disabled') {
      query += ` HAVING COALESCE(gas.auto_send_enabled, false) = false`;
    }
    
    query += ` ORDER BY g.last_name, g.first_name`;
    
    const result = await db.query(query, params);
    
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching guardian auto-send settings:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch guardian settings', error: error.message });
  }
};

// Toggle guardian auto-send
const toggleGuardianAutoSend = async (req, res) => {
  try {
    const { guardianId } = req.params;
    const { auto_send_enabled } = req.body;
    
    const result = await db.query(
      `INSERT INTO guardian_auto_send_settings (guardian_id, auto_send_enabled, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (guardian_id) 
       DO UPDATE SET auto_send_enabled = $2, updated_at = NOW()
       RETURNING *`,
      [guardianId, auto_send_enabled]
    );
    
    res.json({ 
      success: true, 
      message: `Auto-send ${auto_send_enabled ? 'enabled' : 'disabled'} successfully`, 
      data: result.rows[0] 
    });
  } catch (error) {
    console.error('Error toggling guardian auto-send:', error);
    res.status(500).json({ success: false, message: 'Failed to update guardian settings', error: error.message });
  }
};

// Bulk toggle auto-send
const bulkToggleAutoSend = async (req, res) => {
  try {
    const { guardianIds, auto_send_enabled } = req.body;
    
    if (!Array.isArray(guardianIds) || guardianIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Guardian IDs array is required' });
    }
    
    const values = guardianIds.map((id, index) => 
      `($${index * 2 + 1}, $${index * 2 + 2}, NOW())`
    ).join(', ');
    
    const params = guardianIds.flatMap(id => [id, auto_send_enabled]);
    
    await db.query(
      `INSERT INTO guardian_auto_send_settings (guardian_id, auto_send_enabled, updated_at)
       VALUES ${values}
       ON CONFLICT (guardian_id) 
       DO UPDATE SET auto_send_enabled = EXCLUDED.auto_send_enabled, updated_at = NOW()`,
      params
    );
    
    res.json({ 
      success: true, 
      message: `Auto-send ${auto_send_enabled ? 'enabled' : 'disabled'} for ${guardianIds.length} guardians` 
    });
  } catch (error) {
    console.error('Error bulk toggling auto-send:', error);
    res.status(500).json({ success: false, message: 'Failed to bulk update settings', error: error.message });
  }
};

// Get SMS statistics
const getSMSStatistics = async (req, res) => {
  try {
    const stats = await db.query(`
      SELECT 
        COUNT(CASE WHEN status = 'sent' THEN 1 END) AS sent_count,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) AS failed_count,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) AS pending_count,
        COUNT(*) AS total_count,
        COUNT(CASE WHEN type = 'auto' AND sent_at > NOW() - INTERVAL '30 days' THEN 1 END) AS auto_sent_30days
      FROM sms_logs
    `);
    
    const guardianStats = await db.query(`
      SELECT 
        COUNT(*) AS total_guardians,
        COUNT(CASE WHEN gas.auto_send_enabled = true THEN 1 END) AS enabled_count,
        COUNT(CASE WHEN gas.auto_send_enabled = false OR gas.auto_send_enabled IS NULL THEN 1 END) AS disabled_count
      FROM guardians g
      LEFT JOIN guardian_auto_send_settings gas ON g.id = gas.guardian_id
    `);
    
    res.json({ 
      success: true, 
      data: {
        sms: stats.rows[0],
        guardians: guardianStats.rows[0]
      }
    });
  } catch (error) {
    console.error('Error fetching SMS statistics:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch statistics', error: error.message });
  }
};

// Preview template with variables
const previewTemplate = async (req, res) => {
  try {
    const { templateId, variables } = req.body;
    
    if (!templateId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Template ID is required' 
      });
    }
    
    const templateResult = await db.query(
      'SELECT * FROM sms_templates WHERE id = $1',
      [templateId]
    );
    
    if (templateResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Template not found' 
      });
    }
    
    const template = templateResult.rows[0];
    const previewMessage = smsService.replaceTemplateVariables(
      template.template,
      variables || {}
    );
    
    res.json({ 
      success: true, 
      data: {
        template: template.template,
        preview: previewMessage,
        variables: variables || {}
      }
    });
  } catch (error) {
    console.error('Error previewing template:', error);
    res.status(500).json({ success: false, message: 'Failed to preview template', error: error.message });
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
  updateSMSTemplate,
  deleteSMSTemplate,
  getGuardianAutoSendSettings,
  toggleGuardianAutoSend,
  bulkToggleAutoSend,
  getSMSStatistics,
  previewTemplate
};