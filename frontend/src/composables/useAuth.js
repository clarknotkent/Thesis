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
    authToken.value = token
    userRole.value = role
    userInfo.value = info

    localStorage.setItem('authToken', token)
    localStorage.setItem('userRole', role)
    if (info) {
      localStorage.setItem('userInfo', JSON.stringify(info))
      localStorage.setItem('authUser', JSON.stringify(info)) // For compatibility
    }
  }

  const logout = () => {
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