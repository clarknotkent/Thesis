import api from './api'

const userService = {
  // Get all users with filtering and pagination
  async getAllUsers(filters = {}, page = 1, limit = 10) {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...filters
      })
      
      const response = await api.get(`/users?${params}`)
      return response.data
    } catch (error) {
      console.error('Get users error:', error)
      throw new Error(error.response?.data?.message || 'Failed to fetch users')
    }
  },

  // Get user by ID
  async getUserById(id) {
    try {
      const response = await api.get(`/users/${id}`)
      return response.data
    } catch (error) {
      console.error('Get user error:', error)
      throw new Error(error.response?.data?.message || 'Failed to fetch user')
    }
  },

  // Create new user (admin only)
  async createUser(userData) {
    try {
      const response = await api.post('/users', {
        username: userData.username,
        email: userData.email,
        password: userData.password,
        first_name: userData.firstName,
        last_name: userData.lastName,
        phone_number: userData.phoneNumber,
        role: userData.role,
        barangay: userData.barangay,
        address: userData.address,
        ...(userData.role === 'health_worker' && {
          license_number: userData.licenseNumber,
          health_facility: userData.healthFacility
        })
      })
      return response.data
    } catch (error) {
      console.error('Create user error:', error)
      throw new Error(error.response?.data?.message || 'Failed to create user')
    }
  },

  // Update user
  async updateUser(id, userData) {
    try {
      const response = await api.put(`/users/${id}`, {
        first_name: userData.firstName,
        last_name: userData.lastName,
        phone_number: userData.phoneNumber,
        barangay: userData.barangay,
        address: userData.address,
        status: userData.status,
        ...(userData.role === 'health_worker' && {
          license_number: userData.licenseNumber,
          health_facility: userData.healthFacility
        })
      })
      return response.data
    } catch (error) {
      console.error('Update user error:', error)
      throw new Error(error.response?.data?.message || 'Failed to update user')
    }
  },

  // Delete user (soft delete)
  async deleteUser(id) {
    try {
      const response = await api.delete(`/users/${id}`)
      return response.data
    } catch (error) {
      console.error('Delete user error:', error)
      throw new Error(error.response?.data?.message || 'Failed to delete user')
    }
  },

  // Activate/deactivate user
  async toggleUserStatus(id, status) {
    try {
      const response = await api.patch(`/users/${id}/status`, { status })
      return response.data
    } catch (error) {
      console.error('Toggle user status error:', error)
      throw new Error(error.response?.data?.message || 'Failed to update user status')
    }
  }
}

export default userService