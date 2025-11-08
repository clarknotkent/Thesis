import { ref, computed } from 'vue'

const authToken = ref(localStorage.getItem('authToken'))
const userRole = ref(localStorage.getItem('userRole'))
// Check both 'userInfo' and 'authUser' keys for compatibility
const storedUserInfo = localStorage.getItem('userInfo') || localStorage.getItem('authUser')
const userInfo = ref(JSON.parse(storedUserInfo || 'null'))

// Authentication utilities
export const useAuth = () => {
  const isAuthenticated = () => {
    return !!authToken.value
  }

  const getRole = () => {
    return userRole.value || userInfo.value?.role || localStorage.getItem('userRole')
  }

  const getUserInfo = () => {
    return userInfo.value
  }

  const login = (token, role, info) => {
    console.log('🔐 LOGIN CALLED - Role:', role, 'Info:', info)
    
    authToken.value = token
    userRole.value = role
    userInfo.value = info

    localStorage.setItem('authToken', token)
    localStorage.setItem('userRole', role)
    if (info) {
      localStorage.setItem('userInfo', JSON.stringify(info))
      localStorage.setItem('authUser', JSON.stringify(info)) // For compatibility
    }

    // Parent/guardian users: No offline caching - online only
    const normalizedRole = (role || '').toLowerCase()
    console.log('🎯 User role:', normalizedRole)
    
    if (normalizedRole === 'guardian' || normalizedRole === 'parent') {
      console.log('👨‍👩‍👧‍👦 Parent login - online mode only')
    } else {
      console.log('ℹ️ Admin/Staff offline uses StaffOfflineDB (on-demand caching)')
      // Data will be cached when users visit Patient Records or Vaccine Inventory pages
    }
  }

  const logout = async () => {
    // Block logout while offline to preserve offline data
    if (typeof navigator !== 'undefined' && navigator && navigator.onLine === false) {
      try {
        const { addToast } = await import('@/composables/useToast')
        addToast({ title: 'Offline', message: 'Logout is disabled offline to preserve your data. Reconnect to log out.', type: 'warning' })
      } catch (_) {
        alert('Offline: Logout is disabled offline to preserve your data. Reconnect to log out.')
      }
      return
    }
    
    // Clear offline data based on role BEFORE clearing auth data
    const currentRole = (userRole.value || '').toLowerCase()
    
    // Only clear staff offline data (parent has no offline anymore)
    if (currentRole === 'admin' || currentRole === 'healthstaff') {
      // Clear staff offline data
      try {
        const { clearStaffOfflineData } = await import('@/services/offline/db')
        await clearStaffOfflineData()
        console.log('✅ Staff offline data cleared on logout')
      } catch (error) {
        console.error('❌ Failed to clear staff offline data:', error)
      }
    }
    
    // Clear auth data
    authToken.value = null
    userRole.value = null
    userInfo.value = null

    localStorage.removeItem('authToken')
    localStorage.removeItem('userRole')
    localStorage.removeItem('userInfo')
    localStorage.removeItem('authUser') // Remove both keys
  }

  const updateUserInfo = (info) => {
    userInfo.value = info
    localStorage.setItem('userInfo', JSON.stringify(info))
    localStorage.setItem('authUser', JSON.stringify(info)) // For compatibility
  }

  return {
    isAuthenticated,
    getRole,
    getUserInfo,
    login,
    logout,
    updateUserInfo,
    authToken: computed(() => authToken.value),
    userRole: computed(() => userRole.value),
    userInfo: computed(() => userInfo.value)
  }
}

// Export individual functions for router use
export const isAuthenticated = () => {
  return !!localStorage.getItem('authToken')
}

export const getRole = () => {
  const role = localStorage.getItem('userRole')
  if (role) return role
  
  // Fallback to user info
  const storedUserInfo = localStorage.getItem('userInfo') || localStorage.getItem('authUser')
  if (storedUserInfo) {
    try {
      const userInfo = JSON.parse(storedUserInfo)
      return userInfo?.role
    } catch {
      return null
    }
  }
  return null
}