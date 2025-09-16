import api from './api'

const immunizationService = {
  // Get all immunization records with filtering and pagination
  async getAllImmunizations(filters = {}, page = 1, limit = 10) {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...filters
      })
      
      const response = await api.get(`/immunizations?${params}`)
      return response.data
    } catch (error) {
      console.error('Get immunizations error:', error)
      throw new Error(error.response?.data?.message || 'Failed to fetch immunizations')
    }
  },

  // Get immunization by ID
  async getImmunizationById(id) {
    try {
      const response = await api.get(`/immunizations/${id}`)
      return response.data
    } catch (error) {
      console.error('Get immunization error:', error)
      throw new Error(error.response?.data?.message || 'Failed to fetch immunization')
    }
  },

  // Create new immunization record
  async createImmunization(immunizationData) {
    try {
      const response = await api.post('/immunizations', {
        child_id: immunizationData.childId,
        vaccine_id: immunizationData.vaccineId,
        administered_by: immunizationData.administeredBy,
        administered_date: immunizationData.administeredDate,
        dose_number: immunizationData.doseNumber,
        batch_number: immunizationData.batchNumber,
        site_of_injection: immunizationData.siteOfInjection,
        reactions: immunizationData.reactions,
        notes: immunizationData.notes,
        next_due_date: immunizationData.nextDueDate
      })
      return response.data
    } catch (error) {
      console.error('Create immunization error:', error)
      throw new Error(error.response?.data?.message || 'Failed to create immunization record')
    }
  },

  // Update immunization record
  async updateImmunization(id, immunizationData) {
    try {
      const response = await api.put(`/immunizations/${id}`, {
        administered_date: immunizationData.administeredDate,
        dose_number: immunizationData.doseNumber,
        batch_number: immunizationData.batchNumber,
        site_of_injection: immunizationData.siteOfInjection,
        reactions: immunizationData.reactions,
        notes: immunizationData.notes,
        next_due_date: immunizationData.nextDueDate,
        status: immunizationData.status
      })
      return response.data
    } catch (error) {
      console.error('Update immunization error:', error)
      throw new Error(error.response?.data?.message || 'Failed to update immunization record')
    }
  },

  // Delete immunization record
  async deleteImmunization(id) {
    try {
      const response = await api.delete(`/immunizations/${id}`)
      return response.data
    } catch (error) {
      console.error('Delete immunization error:', error)
      throw new Error(error.response?.data?.message || 'Failed to delete immunization record')
    }
  },

  // Schedule immunization
  async scheduleImmunization(scheduleData) {
    try {
      const response = await api.post('/immunizations/schedule', {
        child_id: scheduleData.childId,
        vaccine_id: scheduleData.vaccineId,
        scheduled_date: scheduleData.scheduledDate,
        scheduled_by: scheduleData.scheduledBy,
        notes: scheduleData.notes
      })
      return response.data
    } catch (error) {
      console.error('Schedule immunization error:', error)
      throw new Error(error.response?.data?.message || 'Failed to schedule immunization')
    }
  },

  // Get immunization schedule for a child
  async getChildSchedule(childId) {
    try {
      const response = await api.get(`/immunizations/child/${childId}/schedule`)
      return response.data
    } catch (error) {
      console.error('Get child schedule error:', error)
      throw new Error(error.response?.data?.message || 'Failed to fetch immunization schedule')
    }
  },

  // Get due immunizations
  async getDueImmunizations(daysAhead = 30) {
    try {
      const response = await api.get(`/immunizations/due?days_ahead=${daysAhead}`)
      return response.data
    } catch (error) {
      console.error('Get due immunizations error:', error)
      throw new Error(error.response?.data?.message || 'Failed to fetch due immunizations')
    }
  },

  // Get overdue immunizations
  async getOverdueImmunizations() {
    try {
      const response = await api.get('/immunizations/overdue')
      return response.data
    } catch (error) {
      console.error('Get overdue immunizations error:', error)
      throw new Error(error.response?.data?.message || 'Failed to fetch overdue immunizations')
    }
  }
}

export default immunizationService