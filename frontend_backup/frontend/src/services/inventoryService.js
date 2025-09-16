import api from './api'

const inventoryService = {
  // Get all inventory with filtering and pagination
  async getAllInventory(filters = {}, page = 1, limit = 10) {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...filters
      })
      
      const response = await api.get(`/vaccines/inventory?${params}`)
      return response.data
    } catch (error) {
      console.error('Get inventory error:', error)
      throw new Error(error.response?.data?.message || 'Failed to fetch inventory')
    }
  },

  // Add new inventory
  async addInventory(inventoryData) {
    try {
      const response = await api.post('/vaccines/inventory', {
        vaccine_id: inventoryData.vaccineId,
        batch_number: inventoryData.batchNumber,
        expiry_date: inventoryData.expiryDate,
        quantity: inventoryData.quantity,
        location: inventoryData.location,
        supplier: inventoryData.supplier,
        received_date: inventoryData.receivedDate
      })
      return response.data
    } catch (error) {
      console.error('Add inventory error:', error)
      throw new Error(error.response?.data?.message || 'Failed to add inventory')
    }
  },

  // Update inventory
  async updateInventory(id, inventoryData) {
    try {
      const response = await api.put(`/vaccines/inventory/${id}`, {
        batch_number: inventoryData.batchNumber,
        expiry_date: inventoryData.expiryDate,
        quantity: inventoryData.quantity,
        location: inventoryData.location,
        supplier: inventoryData.supplier,
        status: inventoryData.status
      })
      return response.data
    } catch (error) {
      console.error('Update inventory error:', error)
      throw new Error(error.response?.data?.message || 'Failed to update inventory')
    }
  },

  // Delete inventory
  async deleteInventory(id) {
    try {
      const response = await api.delete(`/vaccines/inventory/${id}`)
      return response.data
    } catch (error) {
      console.error('Delete inventory error:', error)
      throw new Error(error.response?.data?.message || 'Failed to delete inventory')
    }
  },

  // Get inventory requests
  async getInventoryRequests(filters = {}, page = 1, limit = 10) {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...filters
      })
      
      const response = await api.get(`/vaccines/inventory-requests?${params}`)
      return response.data
    } catch (error) {
      console.error('Get inventory requests error:', error)
      throw new Error(error.response?.data?.message || 'Failed to fetch inventory requests')
    }
  },

  // Create inventory request
  async createInventoryRequest(requestData) {
    try {
      const response = await api.post('/vaccines/inventory-requests', {
        vaccine_id: requestData.vaccineId,
        requested_quantity: requestData.requestedQuantity,
        priority: requestData.priority,
        reason: requestData.reason,
        facility_id: requestData.facilityId,
        urgency_date: requestData.urgencyDate,
        notes: requestData.notes
      })
      return response.data
    } catch (error) {
      console.error('Create inventory request error:', error)
      throw new Error(error.response?.data?.message || 'Failed to create inventory request')
    }
  },

  // Update inventory request status
  async updateInventoryRequestStatus(id, status, approvedQuantity = null, approverNotes = null) {
    try {
      const response = await api.patch(`/vaccines/inventory-requests/${id}`, {
        status,
        approved_quantity: approvedQuantity,
        approver_notes: approverNotes
      })
      return response.data
    } catch (error) {
      console.error('Update inventory request error:', error)
      throw new Error(error.response?.data?.message || 'Failed to update inventory request')
    }
  },

  // Get inventory transactions
  async getInventoryTransactions(inventoryId = null, page = 1, limit = 10) {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      })
      
      if (inventoryId) {
        params.append('inventory_id', inventoryId)
      }
      
      const response = await api.get(`/vaccines/inventory-transactions?${params}`)
      return response.data
    } catch (error) {
      console.error('Get inventory transactions error:', error)
      throw new Error(error.response?.data?.message || 'Failed to fetch inventory transactions')
    }
  },

  // Create inventory transaction
  async createInventoryTransaction(transactionData) {
    try {
      const response = await api.post('/vaccines/inventory-transactions', {
        inventory_id: transactionData.inventoryId,
        transaction_type: transactionData.transactionType,
        quantity: transactionData.quantity,
        reference_id: transactionData.referenceId,
        notes: transactionData.notes
      })
      return response.data
    } catch (error) {
      console.error('Create inventory transaction error:', error)
      throw new Error(error.response?.data?.message || 'Failed to create inventory transaction')
    }
  }
}

export default inventoryService