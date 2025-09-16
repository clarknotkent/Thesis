import api from './api'

const dashboardService = {
  // Get dashboard overview data
  async getDashboardOverview() {
    try {
      const response = await api.get('/dashboard/overview')
      return response.data
    } catch (error) {
      console.error('Get dashboard overview error:', error)
      throw new Error(error.response?.data?.message || 'Failed to fetch dashboard data')
    }
  },

  // Get vaccine statistics
  async getVaccineStats(timeframe = '30d') {
    try {
      const response = await api.get(`/dashboard/vaccine-stats?timeframe=${timeframe}`)
      return response.data
    } catch (error) {
      console.error('Get vaccine stats error:', error)
      throw new Error(error.response?.data?.message || 'Failed to fetch vaccine statistics')
    }
  },

  // Get patient demographics
  async getPatientDemographics() {
    try {
      const response = await api.get('/dashboard/patient-demographics')
      return response.data
    } catch (error) {
      console.error('Get patient demographics error:', error)
      throw new Error(error.response?.data?.message || 'Failed to fetch patient demographics')
    }
  },

  // Get immunization coverage
  async getImmunizationCoverage(vaccineId = null, barangay = null) {
    try {
      const params = new URLSearchParams()
      if (vaccineId) params.append('vaccine_id', vaccineId)
      if (barangay) params.append('barangay', barangay)
      
      const response = await api.get(`/dashboard/immunization-coverage?${params}`)
      return response.data
    } catch (error) {
      console.error('Get immunization coverage error:', error)
      throw new Error(error.response?.data?.message || 'Failed to fetch immunization coverage')
    }
  },

  // Get recent activities
  async getRecentActivities(limit = 10) {
    try {
      const response = await api.get(`/dashboard/recent-activities?limit=${limit}`)
      return response.data
    } catch (error) {
      console.error('Get recent activities error:', error)
      throw new Error(error.response?.data?.message || 'Failed to fetch recent activities')
    }
  },

  // Get defaulters (children with missed vaccines)
  async getDefaulters() {
    try {
      const response = await api.get('/dashboard/defaulters')
      return response.data
    } catch (error) {
      console.error('Get defaulters error:', error)
      throw new Error(error.response?.data?.message || 'Failed to fetch defaulters')
    }
  },

  // Get children due for vaccination soon
  async getDueSoon(daysAhead = 7) {
    try {
      const response = await api.get(`/dashboard/due-soon?days=${daysAhead}`)
      return response.data
    } catch (error) {
      console.error('Get due soon error:', error)
      throw new Error(error.response?.data?.message || 'Failed to fetch children due soon')
    }
  },

  // Get low stock inventory
  async getInventoryLowStock(threshold = 10) {
    try {
      const response = await api.get(`/dashboard/inventory-low-stock?threshold=${threshold}`)
      return response.data
    } catch (error) {
      console.error('Get low stock inventory error:', error)
      throw new Error(error.response?.data?.message || 'Failed to fetch low stock inventory')
    }
  },

  // Get expiring vaccines
  async getExpiringVaccines(daysAhead = 30) {
    try {
      const response = await api.get(`/dashboard/expiring-vaccines?days=${daysAhead}`)
      return response.data
    } catch (error) {
      console.error('Get expiring vaccines error:', error)
      throw new Error(error.response?.data?.message || 'Failed to fetch expiring vaccines')
    }
  }
}

export default dashboardService