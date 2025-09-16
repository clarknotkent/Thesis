import api from './api'

const smsService = {
  // Send SMS notification
  async sendSMSNotification(smsData) {
    try {
      const response = await api.post('/sms/send', {
        recipient_id: smsData.recipientId,
        phone_number: smsData.phoneNumber,
        message: smsData.message,
        message_type: smsData.messageType
      })
      return response.data
    } catch (error) {
      console.error('Send SMS error:', error)
      throw new Error(error.response?.data?.message || 'Failed to send SMS')
    }
  },

  // Send reminder notifications
  async sendReminderNotifications(reminderData) {
    try {
      const response = await api.post('/sms/reminders', {
        days_ahead: reminderData.daysAhead,
        message_template: reminderData.messageTemplate
      })
      return response.data
    } catch (error) {
      console.error('Send reminders error:', error)
      throw new Error(error.response?.data?.message || 'Failed to send reminders')
    }
  },

  // Get SMS history with pagination
  async getSMSHistory(filters = {}, page = 1, limit = 10) {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...filters
      })
      
      const response = await api.get(`/sms/history?${params}`)
      return response.data
    } catch (error) {
      console.error('Get SMS history error:', error)
      throw new Error(error.response?.data?.message || 'Failed to fetch SMS history')
    }
  },

  // Get SMS delivery status
  async getSMSDeliveryStatus(smsId) {
    try {
      const response = await api.get(`/sms/status/${smsId}`)
      return response.data
    } catch (error) {
      console.error('Get SMS status error:', error)
      throw new Error(error.response?.data?.message || 'Failed to fetch SMS status')
    }
  },

  // Configure SMS settings
  async configureSMSSettings(settingsData) {
    try {
      const response = await api.put('/sms/settings', settingsData)
      return response.data
    } catch (error) {
      console.error('Configure SMS settings error:', error)
      throw new Error(error.response?.data?.message || 'Failed to configure SMS settings')
    }
  },

  // Get SMS settings
  async getSMSSettings() {
    try {
      const response = await api.get('/sms/settings')
      return response.data
    } catch (error) {
      console.error('Get SMS settings error:', error)
      throw new Error(error.response?.data?.message || 'Failed to fetch SMS settings')
    }
  },

  // Send bulk SMS
  async sendBulkSMS(bulkData) {
    try {
      const response = await api.post('/sms/bulk', {
        recipients: bulkData.recipients,
        message: bulkData.message,
        message_type: bulkData.messageType,
        schedule_time: bulkData.scheduleTime
      })
      return response.data
    } catch (error) {
      console.error('Send bulk SMS error:', error)
      throw new Error(error.response?.data?.message || 'Failed to send bulk SMS')
    }
  },

  // Get SMS templates
  async getSMSTemplates(templateType = null) {
    try {
      const params = templateType ? `?type=${templateType}` : ''
      const response = await api.get(`/sms/templates${params}`)
      return response.data
    } catch (error) {
      console.error('Get SMS templates error:', error)
      throw new Error(error.response?.data?.message || 'Failed to fetch SMS templates')
    }
  },

  // Create SMS template
  async createSMSTemplate(templateData) {
    try {
      const response = await api.post('/sms/templates', {
        name: templateData.name,
        type: templateData.type,
        message: templateData.message,
        variables: templateData.variables,
        is_active: templateData.isActive
      })
      return response.data
    } catch (error) {
      console.error('Create SMS template error:', error)
      throw new Error(error.response?.data?.message || 'Failed to create SMS template')
    }
  },

  // Update SMS template
  async updateSMSTemplate(id, templateData) {
    try {
      const response = await api.put(`/sms/templates/${id}`, {
        name: templateData.name,
        message: templateData.message,
        variables: templateData.variables,
        is_active: templateData.isActive
      })
      return response.data
    } catch (error) {
      console.error('Update SMS template error:', error)
      throw new Error(error.response?.data?.message || 'Failed to update SMS template')
    }
  },

  // Delete SMS template
  async deleteSMSTemplate(id) {
    try {
      const response = await api.delete(`/sms/templates/${id}`)
      return response.data
    } catch (error) {
      console.error('Delete SMS template error:', error)
      throw new Error(error.response?.data?.message || 'Failed to delete SMS template')
    }
  }
}

export default smsService