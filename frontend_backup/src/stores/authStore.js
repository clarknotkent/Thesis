import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import authService from '../services/authService'

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref(null)
  const token = ref(localStorage.getItem('auth_token'))
  const isLoading = ref(false)
  const error = ref(null)

  // Getters
  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const userRole = computed(() => user.value?.role || null)
  const isAdmin = computed(() => userRole.value === 'admin')
  const isHealthWorker = computed(() => userRole.value === 'health_worker')
  const isParent = computed(() => userRole.value === 'parent')

  // Actions
  const login = async (credentials) => {
    try {
      isLoading.value = true
      error.value = null
      
      const response = await authService.login(credentials)
      
      if (response.success) {
        token.value = response.token
        user.value = response.user
        
        // Store token in localStorage
        localStorage.setItem('auth_token', response.token)
        localStorage.setItem('user_data', JSON.stringify(response.user))
        
        return { success: true, user: response.user }
      } else {
        error.value = response.message || 'Login failed'
        return { success: false, message: error.value }
      }
    } catch (err) {
      error.value = err.message || 'Network error occurred'
      return { success: false, message: error.value }
    } finally {
      isLoading.value = false
    }
  }

  const register = async (userData) => {
    try {
      isLoading.value = true
      error.value = null
      
      const response = await authService.register(userData)
      
      if (response.success) {
        // Optionally auto-login after registration
        if (response.token) {
          token.value = response.token
          user.value = response.user
          localStorage.setItem('auth_token', response.token)
          localStorage.setItem('user_data', JSON.stringify(response.user))
        }
        
        return { success: true, user: response.user }
      } else {
        error.value = response.message || 'Registration failed'
        return { success: false, message: error.value }
      }
    } catch (err) {
      error.value = err.message || 'Network error occurred'
      return { success: false, message: error.value }
    } finally {
      isLoading.value = false
    }
  }

  const logout = async () => {
    try {
      // Call backend logout if needed
      await authService.logout()
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      // Clear local state regardless of backend response
      user.value = null
      token.value = null
      error.value = null
      
      // Clear localStorage
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user_data')
    }
  }

  const refreshToken = async () => {
    try {
      const response = await authService.refreshToken()
      
      if (response.success) {
        token.value = response.token
        localStorage.setItem('auth_token', response.token)
        return true
      } else {
        await logout()
        return false
      }
    } catch (err) {
      console.error('Token refresh failed:', err)
      await logout()
      return false
    }
  }

  const fetchUserProfile = async () => {
    try {
      const response = await authService.getProfile()
      
      if (response.success) {
        user.value = response.user
        localStorage.setItem('user_data', JSON.stringify(response.user))
        return response.user
      }
    } catch (err) {
      console.error('Failed to fetch user profile:', err)
    }
  }

  const updateProfile = async (profileData) => {
    try {
      isLoading.value = true
      error.value = null
      
      const response = await authService.updateProfile(profileData)
      
      if (response.success) {
        user.value = { ...user.value, ...response.user }
        localStorage.setItem('user_data', JSON.stringify(user.value))
        return { success: true, user: response.user }
      } else {
        error.value = response.message || 'Profile update failed'
        return { success: false, message: error.value }
      }
    } catch (err) {
      error.value = err.message || 'Network error occurred'
      return { success: false, message: error.value }
    } finally {
      isLoading.value = false
    }
  }

  const changePassword = async (passwordData) => {
    try {
      isLoading.value = true
      error.value = null
      
      const response = await authService.changePassword(passwordData)
      
      if (response.success) {
        return { success: true, message: 'Password changed successfully' }
      } else {
        error.value = response.message || 'Password change failed'
        return { success: false, message: error.value }
      }
    } catch (err) {
      error.value = err.message || 'Network error occurred'
      return { success: false, message: error.value }
    } finally {
      isLoading.value = false
    }
  }

  const initializeAuth = () => {
    const storedToken = localStorage.getItem('auth_token')
    const storedUser = localStorage.getItem('user_data')
    
    if (storedToken && storedUser) {
      try {
        token.value = storedToken
        user.value = JSON.parse(storedUser)
        
        // Optionally verify token with backend
        fetchUserProfile().catch(() => {
          // If profile fetch fails, token might be invalid
          logout()
        })
      } catch (err) {
        console.error('Error initializing auth:', err)
        logout()
      }
    }
  }

  const clearError = () => {
    error.value = null
  }

  // Initialize auth when store is created
  initializeAuth()

  return {
    // State
    user,
    token,
    isLoading,
    error,
    
    // Getters
    isAuthenticated,
    userRole,
    isAdmin,
    isHealthWorker,
    isParent,
    
    // Actions
    login,
    register,
    logout,
    refreshToken,
    fetchUserProfile,
    updateProfile,
    changePassword,
    initializeAuth,
    clearError
  }
})