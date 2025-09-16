import api from './api'

const authService = {
  // Login user
  async login(credentials) {
    try {
      const response = await api.post('/auth/login', {
        username: credentials.username,
        password: credentials.password
      })
      
      // The backend returns { token, user } format
      if (response.data.token && response.data.user) {
        return {
          success: true,
          token: response.data.token,
          user: response.data.user,
          message: 'Login successful'
        }
      } else {
        return {
          success: false,
          message: response.data.message || 'Login failed'
        }
      }
    } catch (error) {
      console.error('Login service error:', error)
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed - Please check your credentials'
      }
    }
  },

  // Register new user
  async register(userData) {
    try {
      const response = await api.post('/auth/register', {
        username: userData.username,
        email: userData.email,
        password: userData.password,
        full_name: userData.full_name,
        role: userData.role,
        phone: userData.phone,
        facility_id: userData.facility_id,
        ...(userData.role === 'parent' && {
          address: userData.address,
          emergency_contact: userData.emergency_contact
        }),
        ...(userData.role === 'health_worker' && {
          license_number: userData.license_number,
          specialization: userData.specialization
        })
      })
      
      return response.data
    } catch (error) {
      console.error('Register service error:', error)
      throw new Error(error.response?.data?.message || 'Registration failed')
    }
  },

  // Logout user
  async logout() {
    try {
      const response = await api.post('/auth/logout')
      return response.data
    } catch (error) {
      console.error('Logout service error:', error)
      // Don't throw error for logout as it should always succeed locally
      return { success: true }
    }
  },

  // Refresh access token
  async refreshToken() {
    try {
      const response = await api.post('/auth/refresh-token')
      return response.data
    } catch (error) {
      console.error('Token refresh error:', error)
      throw new Error(error.response?.data?.message || 'Token refresh failed')
    }
  },

  // Get current user profile
  async getProfile() {
    try {
      const response = await api.get('/auth/profile')
      return response.data
    } catch (error) {
      console.error('Get profile error:', error)
      throw new Error(error.response?.data?.message || 'Failed to fetch profile')
    }
  },

  // Update user profile
  async updateProfile(profileData) {
    try {
      const response = await api.put('/auth/profile', profileData)
      return response.data
    } catch (error) {
      console.error('Update profile error:', error)
      throw new Error(error.response?.data?.message || 'Failed to update profile')
    }
  },

  // Change password
  async changePassword(passwordData) {
    try {
      const response = await api.put('/auth/change-password', {
        current_password: passwordData.currentPassword,
        new_password: passwordData.newPassword
      })
      return response.data
    } catch (error) {
      console.error('Change password error:', error)
      throw new Error(error.response?.data?.message || 'Failed to change password')
    }
  },

  // Verify token validity
  async verifyToken() {
    try {
      const response = await api.get('/auth/verify-token')
      return response.data
    } catch (error) {
      console.error('Token verification error:', error)
      throw new Error(error.response?.data?.message || 'Token verification failed')
    }
  },

  // Forgot password (if implemented in backend)
  async forgotPassword(email) {
    try {
      const response = await api.post('/auth/forgot-password', { email })
      return response.data
    } catch (error) {
      console.error('Forgot password error:', error)
      throw new Error(error.response?.data?.message || 'Failed to process forgot password request')
    }
  },

  // Reset password (if implemented in backend)
  async resetPassword(resetData) {
    try {
      const response = await api.post('/auth/reset-password', {
        token: resetData.token,
        new_password: resetData.password
      })
      return response.data
    } catch (error) {
      console.error('Reset password error:', error)
      throw new Error(error.response?.data?.message || 'Failed to reset password')
    }
  },

  // Get user roles/permissions
  async getUserRoles() {
    try {
      const response = await api.get('/auth/roles')
      return response.data
    } catch (error) {
      console.error('Get roles error:', error)
      throw new Error(error.response?.data?.message || 'Failed to fetch roles')
    }
  },

  // Get facilities for registration dropdown
  async getFacilities() {
    try {
      const response = await api.get('/auth/facilities')
      return response.data
    } catch (error) {
      console.error('Get facilities error:', error)
      throw new Error(error.response?.data?.message || 'Failed to fetch facilities')
    }
  }
}

export default authService