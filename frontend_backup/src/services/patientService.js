import api from './api'

const patientService = {
  // Get all patients with filtering and pagination
  async getAllPatients(filters = {}, page = 1, limit = 10) {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...filters
      })
      
      const response = await api.get(`/patients?${params}`)
      return response.data
    } catch (error) {
      console.error('Get patients error:', error)
      throw new Error(error.response?.data?.message || 'Failed to fetch patients')
    }
  },

  // Get patient by ID
  async getPatientById(id) {
    try {
      const response = await api.get(`/patients/${id}`)
      return response.data
    } catch (error) {
      console.error('Get patient error:', error)
      throw new Error(error.response?.data?.message || 'Failed to fetch patient')
    }
  },

  // Create new patient
  async createPatient(patientData) {
    try {
      const response = await api.post('/patients', {
        first_name: patientData.firstName,
        last_name: patientData.lastName,
        birthdate: patientData.birthdate,
        gender: patientData.gender,
        birth_weight: patientData.birthWeight,
        birth_height: patientData.birthHeight,
        place_of_birth: patientData.placeOfBirth,
        parent_id: patientData.parentId
      })
      return response.data
    } catch (error) {
      console.error('Create patient error:', error)
      throw new Error(error.response?.data?.message || 'Failed to create patient')
    }
  },

  // Update patient
  async updatePatient(id, patientData) {
    try {
      const response = await api.put(`/patients/${id}`, {
        first_name: patientData.firstName,
        last_name: patientData.lastName,
        birthdate: patientData.birthdate,
        gender: patientData.gender,
        birth_weight: patientData.birthWeight,
        birth_height: patientData.birthHeight,
        place_of_birth: patientData.placeOfBirth,
        parent_id: patientData.parentId
      })
      return response.data
    } catch (error) {
      console.error('Update patient error:', error)
      throw new Error(error.response?.data?.message || 'Failed to update patient')
    }
  },

  // Delete patient (soft delete)
  async deletePatient(id) {
    try {
      const response = await api.delete(`/patients/${id}`)
      return response.data
    } catch (error) {
      console.error('Delete patient error:', error)
      throw new Error(error.response?.data?.message || 'Failed to delete patient')
    }
  },

  // Get patient's immunization history
  async getPatientImmunizations(id) {
    try {
      const response = await api.get(`/patients/${id}/immunizations`)
      return response.data
    } catch (error) {
      console.error('Get patient immunizations error:', error)
      throw new Error(error.response?.data?.message || 'Failed to fetch immunization history')
    }
  },

  // Get patient's upcoming vaccines
  async getPatientUpcomingVaccines(id) {
    try {
      const response = await api.get(`/patients/${id}/upcoming-vaccines`)
      return response.data
    } catch (error) {
      console.error('Get upcoming vaccines error:', error)
      throw new Error(error.response?.data?.message || 'Failed to fetch upcoming vaccines')
    }
  }
}

export default patientService