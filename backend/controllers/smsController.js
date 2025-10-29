const smsModel = require('../models/smsModel');
const smsService = require('../services/smsService');
const smsScheduler = require('../services/smsScheduler');
// Use Supabase client for DB access (no direct PG connection required)
const supabase = require('../db');

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
    const actorId = req.user && (req.user.user_id || req.user.id) || null;
    
    let finalMessage = message;
    
    // If templateId is provided, use template and replace variables
    if (templateId) {
      const { data: templateRow, error: templateErr } = await supabase
        .from('sms_templates')
        .select('template')
        .eq('id', templateId)
        .single();

      if (templateErr || !templateRow) {
        return res.status(404).json({ 
          success: false,
          message: 'Template not found' 
        });
      }
      
      // Replace variables in template
      finalMessage = smsService.replaceTemplateVariables(
        templateRow.template,
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
    
    // Log to database (sent or failed)
    const insertPayload = {
      guardian_id: guardianId || null,
      patient_id: patientId || null,
      phone_number: result.recipient,
      message: finalMessage,
      // Constrain type to 'manual' | 'scheduled' (manual endpoint => 'manual' only)
      type: 'manual',
      // Constrain status to 'pending' | 'sent'. If send failed, keep as 'pending' and include error_message.
      status: result.success ? 'sent' : 'pending',
      template_id: templateId || null,
      error_message: result.success ? null : result.error,
      created_by: actorId,
      updated_by: actorId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      // sent_at defaults to NOW() in DB, but we can pass explicitly if needed
    };
    await supabase.from('sms_logs').insert(insertPayload);
    
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
    const { status, type, startDate, endDate, search, patientId, guardianId, page = 1, limit = 100 } = req.query;
    const offset = (page - 1) * limit;
    
    // Build supabase query with joins to get names
    // Join guardians and patients separately to avoid nested guardian conflict
    let query = supabase
      .from('sms_logs')
      .select(`
        id, 
        guardian_id, 
        patient_id, 
        phone_number, 
        message, 
        type, 
        status, 
        error_message, 
        sent_at,
        scheduled_at,
        created_at,
        patients:patient_id (
          patient_id,
          firstname,
          surname,
          middlename
        ),
        guardians:guardian_id (
          guardian_id,
          firstname,
          surname,
          middlename
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + Number(limit) - 1);

    if (status) query = query.eq('status', status);
    if (type) query = query.eq('type', type);
    if (patientId) query = query.eq('patient_id', patientId);
    if (guardianId) query = query.eq('guardian_id', guardianId);
    if (startDate) query = query.gte('sent_at', startDate);
    if (endDate) query = query.lte('sent_at', endDate);
    if (search) {
      query = query.or(`phone_number.ilike.%${search}%,message.ilike.%${search}%`);
    }

    const { data: rows, error } = await query;
    if (error) throw error;

    // Format the response with proper names
    const formattedRows = (rows || []).map(row => {
      const patient = row.patients;
      const guardian = row.guardians;
      
      return {
        id: row.id,
        guardian_id: row.guardian_id,
        patient_id: row.patient_id,
        phone_number: row.phone_number,
        message: row.message,
        type: row.type,
        status: row.status,
        error_message: row.error_message,
        sent_at: row.sent_at || row.scheduled_at || row.created_at,
        scheduled_at: row.scheduled_at,
        patient_name: patient ? `${patient.firstname} ${patient.surname}`.trim() : '—',
        guardian_name: guardian ? `${guardian.firstname} ${guardian.surname}`.trim() : '—',
      };
    });

    // Total count
    let countQ = supabase.from('sms_logs').select('id', { count: 'exact', head: true });
    if (status) countQ = countQ.eq('status', status);
    if (type) countQ = countQ.eq('type', type);
    if (patientId) countQ = countQ.eq('patient_id', patientId);
    if (guardianId) countQ = countQ.eq('guardian_id', guardianId);
    if (startDate) countQ = countQ.gte('sent_at', startDate);
    if (endDate) countQ = countQ.lte('sent_at', endDate);
    if (search) countQ = countQ.or(`phone_number.ilike.%${search}%,message.ilike.%${search}%`);
    const { count: totalCount, error: countErr } = await countQ;
    if (countErr) throw countErr;

    res.json({ 
      success: true, 
      data: formattedRows, 
      pagination: { 
        page: Number(page), 
        limit: Number(limit), 
        total: totalCount || 0 
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
    const { data, error } = await supabase
      .from('sms_templates')
      .select('*')
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ success: true, data: data || [] });
  } catch (error) {
    console.error('Error fetching SMS templates:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch SMS templates', error: error.message });
  }
};

// Create SMS template
const createSMSTemplate = async (req, res) => {
  try {
    const { name, template, trigger_type, time_range, is_active = true } = req.body;
    const actorId = req.user && (req.user.user_id || req.user.id) || null;
    
    const allowedTriggers = new Set(['1-week','3-days','1-day','0-day','manual']);
    if (!name || !template || !trigger_type) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name, template, and trigger_type are required' 
      });
    }
    if (!allowedTriggers.has(String(trigger_type))) {
      return res.status(400).json({ success: false, message: 'Invalid trigger_type. Allowed: 1-week, 3-days, 1-day, 0-day, manual' });
    }
    
    const { data, error } = await supabase
      .from('sms_templates')
      .insert({ 
        name, 
        template, 
        trigger_type, 
        time_range, 
        is_active,
        created_by: actorId,
        updated_by: actorId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    if (error) throw error;
    res.status(201).json({ success: true, message: 'Template created successfully', data });
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
    const actorId = req.user && (req.user.user_id || req.user.id) || null;
    if (trigger_type) {
      const allowedTriggers = new Set(['1-week','3-days','1-day','0-day','manual']);
      if (!allowedTriggers.has(String(trigger_type))) {
        return res.status(400).json({ success: false, message: 'Invalid trigger_type. Allowed: 1-week, 3-days, 1-day, 0-day, manual' });
      }
    }
    
    const { data, error } = await supabase
      .from('sms_templates')
      .update({ 
        name, 
        template, 
        trigger_type, 
        time_range, 
        is_active,
        updated_by: actorId,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    if (!data) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }
    res.json({ success: true, message: 'Template updated successfully', data });
  } catch (error) {
    console.error('Error updating SMS template:', error);
    res.status(500).json({ success: false, message: 'Failed to update SMS template', error: error.message });
  }
};

// Delete SMS template
const deleteSMSTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const actorId = req.user && (req.user.user_id || req.user.id) || null;

    // Soft delete to preserve history and allow auditing
    const { data, error } = await supabase
      .from('sms_templates')
      .update({ 
        is_deleted: true,
        deleted_by: actorId,
        deleted_at: new Date().toISOString(),
        updated_by: actorId,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    if (!data) {
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
    
    // Fetch guardians
    let gq = supabase
      .from('guardians')
      .select('guardian_id, firstname, surname, contact_number, is_deleted')
      .eq('is_deleted', false);
    if (search) {
      gq = gq.or(
        `firstname.ilike.%${search}%,surname.ilike.%${search}%,contact_number.ilike.%${search}%`
      );
    }
    const { data: guardians, error: gErr } = await gq;
    if (gErr) throw gErr;

    // Compute children count per guardian from patients (only active patients)
    const guardianIds = (guardians || []).map(g => g.guardian_id);
    let childCountMap = new Map();
    if (guardianIds.length > 0) {
      const { data: childRows, error: cErr } = await supabase
        .from('patients')
        .select('guardian_id')
        .in('guardian_id', guardianIds)
        .eq('is_deleted', false);
      if (cErr) throw cErr;
      for (const row of (childRows || [])) {
        const gid = row.guardian_id;
        childCountMap.set(gid, (childCountMap.get(gid) || 0) + 1);
      }
    }

    // Fetch auto-send settings
    const { data: settings, error: sErr } = await supabase
      .from('guardian_auto_send_settings')
      .select('guardian_id, auto_send_enabled');
    if (sErr) throw sErr;
    const settingsMap = new Map((settings || []).map(s => [s.guardian_id, s.auto_send_enabled]));

    // Optionally filter by status
    let rows = (guardians || []).map(g => ({
      id: g.guardian_id,
      name: `${g.firstname || ''} ${g.surname || ''}`.trim(),
      phone: g.contact_number || '',
      auto_send_enabled: settingsMap.get(g.guardian_id) || false,
      children_count: childCountMap.get(g.guardian_id) || 0,
      pending_vaccines: 0,
    }));
    if (status === 'enabled') rows = rows.filter(r => r.auto_send_enabled);
    if (status === 'disabled') rows = rows.filter(r => !r.auto_send_enabled);

    res.json({ success: true, data: rows });
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
    // Only allow toggle for active (not deleted) guardians
    const { data: gRow, error: gErr } = await supabase
      .from('guardians')
      .select('guardian_id')
      .eq('guardian_id', Number(guardianId))
      .eq('is_deleted', false)
      .maybeSingle();
    if (gErr) throw gErr;
    if (!gRow) {
      return res.status(404).json({ success: false, message: 'Guardian not found or deleted' });
    }
    
    const { data, error } = await supabase
      .from('guardian_auto_send_settings')
      .upsert({ guardian_id: Number(guardianId), auto_send_enabled })
      .select()
      .single();
    if (error) throw error;
    res.json({ 
      success: true, 
      message: `Auto-send ${auto_send_enabled ? 'enabled' : 'disabled'} successfully`, 
      data 
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
    // Only include guardians that are not deleted
    const { data: activeGuardians, error: gErr } = await supabase
      .from('guardians')
      .select('guardian_id')
      .in('guardian_id', guardianIds.map(Number))
      .eq('is_deleted', false);
    if (gErr) throw gErr;
    const validIds = (activeGuardians || []).map(g => g.guardian_id);
    if (validIds.length === 0) {
      return res.status(400).json({ success: false, message: 'No active guardians found for provided IDs' });
    }

    const payload = validIds.map(id => ({ guardian_id: Number(id), auto_send_enabled }));
    const { error } = await supabase
      .from('guardian_auto_send_settings')
      .upsert(payload);
    if (error) throw error;
    
    res.json({ 
      success: true, 
      message: `Auto-send ${auto_send_enabled ? 'enabled' : 'disabled'} for ${validIds.length} guardian(s)` 
    });
  } catch (error) {
    console.error('Error bulk toggling auto-send:', error);
    res.status(500).json({ success: false, message: 'Failed to bulk update settings', error: error.message });
  }
};

// Get SMS statistics
const getSMSStatistics = async (req, res) => {
  try {
    // Compute SMS counts
    const countBy = async (filter) => {
      let q = supabase.from('sms_logs').select('id', { count: 'exact', head: true });
      if (filter.status) q = q.eq('status', filter.status);
      if (filter.type) q = q.eq('type', filter.type);
      if (filter.recentDays) {
        const since = new Date(Date.now() - filter.recentDays * 24 * 60 * 60 * 1000).toISOString();
        q = q.gte('sent_at', since);
      }
      const { count } = await q;
      return count || 0;
    };

    const [sent_count, failed_count, pending_count, total_count, auto_sent_30days] = await Promise.all([
      countBy({ status: 'sent' }),
      countBy({ status: 'failed' }),
      countBy({ status: 'pending' }),
      countBy({}),
      countBy({ type: 'auto', recentDays: 30 }),
    ]);

    // Guardians stats
    // Active guardians only
    const { data: activeGs, count: total_guardians } = await supabase
      .from('guardians')
      .select('guardian_id', { count: 'exact' })
      .eq('is_deleted', false);
    const activeSet = new Set((activeGs || []).map(g => g.guardian_id));
    const { data: sRows } = await supabase
      .from('guardian_auto_send_settings')
      .select('guardian_id, auto_send_enabled');
    const enabled_count = (sRows || []).filter(r => r.auto_send_enabled === true && activeSet.has(r.guardian_id)).length;
    const disabled_count = (total_guardians || 0) - enabled_count;

    res.json({
      success: true,
      data: {
        sms: { sent_count, failed_count, pending_count, total_count, auto_sent_30days },
        guardians: { total_guardians, enabled_count, disabled_count },
      },
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
    
    const { data: template, error } = await supabase
      .from('sms_templates')
      .select('*')
      .eq('id', templateId)
      .single();
    if (error || !template) {
      return res.status(404).json({ 
        success: false, 
        message: 'Template not found' 
      });
    }
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

// Manually trigger scheduled SMS processing (admin only)
const runScheduledNow = async (req, res) => {
  try {
    const limit = Number(req.query.limit || process.env.SMS_CRON_BATCH_LIMIT || 200);
    const summary = await smsScheduler.processDueScheduledSMS({ limit });
    res.json({ success: true, message: 'Scheduled SMS processed', data: summary });
  } catch (error) {
    console.error('Error running scheduled SMS now:', error);
    res.status(500).json({ success: false, message: 'Failed to process scheduled SMS', error: error.message });
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
  previewTemplate,
  runScheduledNow
};