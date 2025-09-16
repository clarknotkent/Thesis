import { computed } from 'vue'
import { useAuthStore } from '../stores/authStore'
import { useRouter } from 'vue-router'

export function useAuth() {
  const authStore = useAuthStore()
  const router = useRouter()

  // Computed properties for easy access
  const user = computed(() => authStore.user)
  const isAuthenticated = computed(() => authStore.isAuthenticated)
  const isLoading = computed(() => authStore.isLoading)
  const error = computed(() => authStore.error)
  const userRole = computed(() => authStore.userRole)
  const isAdmin = computed(() => authStore.isAdmin)
  const isHealthWorker = computed(() => authStore.isHealthWorker)
  const isParent = computed(() => authStore.isParent)

  // Authentication methods
  const login = async (credentials) => {
    const result = await authStore.login(credentials)
    
    if (result.success) {
      // Redirect based on user role
      const redirectPath = getRedirectPath(result.user.role)
      router.push(redirectPath)
    }
    
    return result
  }

  const register = async (userData) => {
    const result = await authStore.register(userData)
    
    if (result.success) {
      // Redirect to login or dashboard based on implementation
      router.push('/login')
    }
    
    return result
  }

  const logout = async () => {
    await authStore.logout()
    router.push('/login')
  }

  const updateProfile = async (profileData) => {
    return await authStore.updateProfile(profileData)
  }

  const changePassword = async (passwordData) => {
    return await authStore.changePassword(passwordData)
  }

  // Helper function to get redirect path based on role
  const getRedirectPath = (role) => {
    switch (role) {
      case 'admin':
        return '/admin/dashboard'
      case 'health_worker':
        return '/health-worker/dashboard'
      case 'parent':
        return '/parent/dashboard'
      default:
        return '/dashboard'
    }
  }

  // Check if user has specific permission
  const hasPermission = (permission) => {
    if (!user.value) return false
    
    const rolePermissions = {
      admin: [
        'manage_users',
        'manage_facilities',
        'view_all_records',
        'manage_inventory',
        'generate_reports',
        'send_notifications',
        'system_settings'
      ],
      health_worker: [
        'manage_patients',
        'record_immunizations',
        'view_schedules',
        'update_inventory',
        'generate_facility_reports'
      ],
      parent: [
        'view_child_records',
        'schedule_appointments',
        'receive_notifications',
        'update_child_info'
      ]
    }
    
    return rolePermissions[user.value.role]?.includes(permission) || false
  }

  // Check if user can access specific route
  const canAccessRoute = (routeName) => {
    if (!isAuthenticated.value) return false
    
    const routePermissions = {
      // Admin routes
      'admin-dashboard': ['admin'],
      'admin-users': ['admin'],
      'admin-facilities': ['admin'],
      'admin-reports': ['admin'],
      'admin-inventory': ['admin'],
      'admin-sms': ['admin'],
      
      // Health worker routes
      'health-worker-dashboard': ['health_worker', 'admin'],
      'health-worker-patients': ['health_worker', 'admin'],
      'health-worker-immunizations': ['health_worker', 'admin'],
      'health-worker-schedules': ['health_worker', 'admin'],
      
      // Parent routes
      'parent-dashboard': ['parent', 'admin'],
      'parent-children': ['parent', 'admin'],
      'parent-appointments': ['parent', 'admin'],
      'parent-notifications': ['parent', 'admin']
    }
    
    const allowedRoles = routePermissions[routeName]
    return allowedRoles ? allowedRoles.includes(user.value.role) : true
  }

  // Require authentication for route
  const requireAuth = () => {
    if (!isAuthenticated.value) {
      router.push('/login')
      return false
    }
    return true
  }

  // Require specific role for route
  const requireRole = (allowedRoles) => {
    if (!requireAuth()) return false
    
    if (!Array.isArray(allowedRoles)) {
      allowedRoles = [allowedRoles]
    }
    
    if (!allowedRoles.includes(user.value.role)) {
      router.push('/unauthorized')
      return false
    }
    
    return true
  }

  // Get user display name
  const getUserDisplayName = () => {
    if (!user.value) return 'Guest'
    return user.value.full_name || user.value.username || 'User'
  }

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user.value) return 'G'
    
    const name = user.value.full_name || user.value.username
    if (!name) return 'U'
    
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2)
  }

  // Clear error state
  const clearError = () => {
    authStore.clearError()
  }

  return {
    // State
    user,
    isAuthenticated,
    isLoading,
    error,
    userRole,
    isAdmin,
    isHealthWorker,
    isParent,
    
    // Methods
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    
    // Utilities
    hasPermission,
    canAccessRoute,
    requireAuth,
    requireRole,
    getUserDisplayName,
    getUserInitials,
    getRedirectPath,
    clearError
  }
}