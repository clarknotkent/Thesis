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

  const login = async (token, role, info) => {
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

    // Parent/guardian users: Prefetch all data for offline mode
    const normalizedRole = (role || '').toLowerCase()
    console.log('🎯 User role:', normalizedRole)
    
    if (normalizedRole === 'guardian' || normalizedRole === 'parent') {
      console.log('👨‍👩‍👧‍👦 Parent login - prefetching data for offline mode')
      try {
        const { useOfflineGuardian } = await import('@/composables/useOfflineGuardian')
        const { fetchAndCacheData } = useOfflineGuardian()
        const guardianId = info.id || info.guardian_id || info.userId || info.user_id
        if (guardianId) {
          await fetchAndCacheData(guardianId)
        } else {
          console.error('❌ Guardian ID not found in user info:', info)
        }
      } catch (error) {
        console.error('❌ Failed to prefetch guardian data:', error)
      }
    } else {
      console.log('ℹ️ Admin/Staff offline uses StaffOfflineDB (on-demand caching)')
      
      // For admin users, prefetch admin data immediately on login
      if (normalizedRole === 'admin') {
        console.log('👑 Admin login - prefetching admin data for offline mode')
        try {
          const { prefetchAdminData } = await import('@/services/offline/adminOfflinePrefetch')
          await prefetchAdminData()
          console.log('✅ Admin data prefetched successfully')
        } catch (error) {
          console.error('❌ Failed to prefetch admin data:', error)
        }
      }
      
      // For healthstaff users, prefetch staff data immediately on login
      if (normalizedRole === 'healthstaff') {
        console.log('🏥 Health Staff login - prefetching staff data for offline mode')
        try {
          const { prefetchStaffData } = await import('@/services/offline/staffLoginPrefetch')
          await prefetchStaffData()
          console.log('✅ Staff data prefetched successfully')
        } catch (error) {
          console.error('❌ Failed to prefetch staff data:', error)
        }
      }
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
    
    if (currentRole === 'guardian' || currentRole === 'parent') {
      // Clear guardian offline data
      try {
        const { db } = await import('@/utils/db')
        await db.delete()
        console.log('✅ Guardian offline data cleared on logout')
      } catch (error) {
        console.error('❌ Failed to clear guardian offline data:', error)
      }
    } else if (currentRole === 'admin' || currentRole === 'healthstaff') {
      // Clear staff offline data - completely delete the database like GuardianOfflineDB
      try {
        const { db } = await import('@/services/offline/db')
        await db.delete()
        console.log('✅ StaffOfflineDB deleted on logout')
        
        // Clear cache flags so database will be recreated on next login
        const { clearStaffCacheFlags } = await import('@/services/offline/staffLoginPrefetch')
        clearStaffCacheFlags()
        
        // Clear BHS prefetch session flag so it will prefetch again on next login
        localStorage.removeItem('bhs_prefetch_completed')
        console.log('✅ BHS prefetch session cleared on logout')
      } catch (error) {
        console.error('❌ Failed to delete StaffOfflineDB:', error)
      }
      
      // Clear admin offline data for admin users
      if (currentRole === 'admin') {
        try {
          const { clearAdminOfflineData } = await import('@/services/offline/adminOfflineDB')
          await clearAdminOfflineData()
          console.log('✅ Admin offline data cleared on logout')
        } catch (error) {
          console.error('❌ Failed to clear admin offline data:', error)
        }
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