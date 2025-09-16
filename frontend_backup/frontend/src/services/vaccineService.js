import api from './api'

const vaccineService = {
  // Get all vaccines with filtering and pagination
  async getAllVaccines(filters = {}, page = 1, limit = 10) {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...filters
      })
      
      const response = await api.get(`/vaccines?${params}`)
      return response.data
    } catch (error) {
      console.error('Get vaccines error:', error)
      throw new Error(error.response?.data?.message || 'Failed to fetch vaccines')
    }
  },

  // Get vaccine by ID
  async getVaccineById(id) {
    try {
      const response = await api.get(`/vaccines/${id}`)
      return response.data
    } catch (error) {
      console.error('Get vaccine error:', error)
      throw new Error(error.response?.data?.message || 'Failed to fetch vaccine')
    }
  },

  // Create new vaccine
  async createVaccine(vaccineData) {
    try {
      const response = await api.post('/vaccines', {
        vaccine_name: vaccineData.vaccineName,
        vaccine_type: vaccineData.vaccineType,
        manufacturer: vaccineData.manufacturer,
        dosage: vaccineData.dosage,
        storage_temperature: vaccineData.storageTemperature,
        age_group: vaccineData.ageGroup,
        recommended_schedule: vaccineData.recommendedSchedule,
        side_effects: vaccineData.sideEffects,
        contraindications: vaccineData.contraindications
      })
      return response.data
    } catch (error) {
      console.error('Create vaccine error:', error)
      throw new Error(error.response?.data?.message || 'Failed to create vaccine')
    }
  },

  // Update vaccine
  async updateVaccine(id, vaccineData) {
    try {
      const response = await api.put(`/vaccines/${id}`, {
        vaccine_name: vaccineData.vaccineName,
        vaccine_type: vaccineData.vaccineType,
        manufacturer: vaccineData.manufacturer,
        dosage: vaccineData.dosage,
        storage_temperature: vaccineData.storageTemperature,
        age_group: vaccineData.ageGroup,
        recommended_schedule: vaccineData.recommendedSchedule,
        side_effects: vaccineData.sideEffects,
        contraindications: vaccineData.contraindications
      })
      return response.data
    } catch (error) {
      console.error('Update vaccine error:', error)
      throw new Error(error.response?.data?.message || 'Failed to update vaccine')
    }
  },

  // Delete vaccine (soft delete)
  async deleteVaccine(id) {
    try {
      const response = await api.delete(`/vaccines/${id}`)
      return response.data
    } catch (error) {
      console.error('Delete vaccine error:', error)
      throw new Error(error.response?.data?.message || 'Failed to delete vaccine')
    }
  },

  // Get vaccine schedule by age group
  async getVaccineSchedule(ageGroup = null) {
    try {
      const params = ageGroup ? `?age_group=${ageGroup}` : ''
      const response = await api.get(`/vaccines/schedule${params}`)
      return response.data
    } catch (error) {
      console.error('Get vaccine schedule error:', error)
      throw new Error(error.response?.data?.message || 'Failed to fetch vaccine schedule')
    }
  }
}

export default vaccineService