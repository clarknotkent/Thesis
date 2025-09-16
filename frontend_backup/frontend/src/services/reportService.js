import api from './api'

const reportService = {
  // Generate vaccination coverage report
  async getVaccinationCoverageReport(filters = {}) {
    try {
      const params = new URLSearchParams(filters)
      const response = await api.get(`/reports/vaccination-coverage?${params}`)
      return response.data
    } catch (error) {
      console.error('Get vaccination coverage report error:', error)
      throw new Error(error.response?.data?.message || 'Failed to generate vaccination coverage report')
    }
  },

  // Generate immunization completion report
  async getImmunizationCompletionReport(filters = {}) {
    try {
      const params = new URLSearchParams(filters)
      const response = await api.get(`/reports/immunization-completion?${params}`)
      return response.data
    } catch (error) {
      console.error('Get immunization completion report error:', error)
      throw new Error(error.response?.data?.message || 'Failed to generate immunization completion report')
    }
  },

  // Generate defaulters report
  async getDefaultersReport(filters = {}) {
    try {
      const params = new URLSearchParams(filters)
      const response = await api.get(`/reports/defaulters?${params}`)
      return response.data
    } catch (error) {
      console.error('Get defaulters report error:', error)
      throw new Error(error.response?.data?.message || 'Failed to generate defaulters report')
    }
  },

  // Generate inventory report
  async getInventoryReport(filters = {}) {
    try {
      const params = new URLSearchParams(filters)
      const response = await api.get(`/reports/inventory?${params}`)
      return response.data
    } catch (error) {
      console.error('Get inventory report error:', error)
      throw new Error(error.response?.data?.message || 'Failed to generate inventory report')
    }
  },

  // Generate health worker performance report
  async getHealthWorkerPerformanceReport(filters = {}) {
    try {
      const params = new URLSearchParams(filters)
      const response = await api.get(`/reports/health-worker-performance?${params}`)
      return response.data
    } catch (error) {
      console.error('Get health worker performance report error:', error)
      throw new Error(error.response?.data?.message || 'Failed to generate health worker performance report')
    }
  },

  // Generate demographic report
  async getDemographicReport(filters = {}) {
    try {
      const params = new URLSearchParams(filters)
      const response = await api.get(`/reports/demographics?${params}`)
      return response.data
    } catch (error) {
      console.error('Get demographic report error:', error)
      throw new Error(error.response?.data?.message || 'Failed to generate demographic report')
    }
  },

  // Export report to PDF
  async exportReportToPDF(reportType, filters = {}) {
    try {
      const params = new URLSearchParams({
        ...filters,
        format: 'pdf'
      })
      
      const response = await api.get(`/reports/${reportType}/export?${params}`, {
        responseType: 'blob'
      })
      
      // Create blob URL for download
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      
      // Create download link
      const link = document.createElement('a')
      link.href = url
      link.download = `${reportType}-report-${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // Clean up
      window.URL.revokeObjectURL(url)
      
      return { success: true, message: 'Report downloaded successfully' }
    } catch (error) {
      console.error('Export report error:', error)
      throw new Error(error.response?.data?.message || 'Failed to export report')
    }
  },

  // Export report to Excel
  async exportReportToExcel(reportType, filters = {}) {
    try {
      const params = new URLSearchParams({
        ...filters,
        format: 'excel'
      })
      
      const response = await api.get(`/reports/${reportType}/export?${params}`, {
        responseType: 'blob'
      })
      
      // Create blob URL for download
      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      })
      const url = window.URL.createObjectURL(blob)
      
      // Create download link
      const link = document.createElement('a')
      link.href = url
      link.download = `${reportType}-report-${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // Clean up
      window.URL.revokeObjectURL(url)
      
      return { success: true, message: 'Report downloaded successfully' }
    } catch (error) {
      console.error('Export report error:', error)
      throw new Error(error.response?.data?.message || 'Failed to export report')
    }
  },

  // Get available report types
  async getReportTypes() {
    try {
      const response = await api.get('/reports/types')
      return response.data
    } catch (error) {
      console.error('Get report types error:', error)
      throw new Error(error.response?.data?.message || 'Failed to fetch report types')
    }
  }
}

export default reportService