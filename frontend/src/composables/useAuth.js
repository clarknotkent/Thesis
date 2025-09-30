import { ref, computed } from 'vue'

const authToken = ref(localStorage.getItem('authToken'))
const userRole = ref(localStorage.getItem('userRole'))
const userInfo = ref(JSON.parse(localStorage.getItem('userInfo') || 'null'))

// Authentication utilities
export const useAuth = () => {
  const isAuthenticated = () => {
    return !!authToken.value
  }

  const getRole = () => {
    return userRole.value
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
    }
  }

  const logout = () => {
    authToken.value = null
    userRole.value = null
    userInfo.value = null

    localStorage.removeItem('authToken')
    localStorage.removeItem('userRole')
    localStorage.removeItem('userInfo')
  }

  const updateUserInfo = (info) => {
    userInfo.value = info
    localStorage.setItem('userInfo', JSON.stringify(info))
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
  return localStorage.getItem('userRole')
}