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

    // For parent/guardian users: Bulk cache everything on login
    const normalizedRole = (role || '').toLowerCase()
    console.log('🎯 Checking role for bulk cache - normalized:', normalizedRole)
    
    if (normalizedRole === 'guardian' || normalizedRole === 'parent') {
      console.log('👨‍👩‍👧‍👦 Parent login detected - initiating one-time bulk cache...')
      console.log('👤 User info:', info)
      
      // Extract guardian_id and user_id from info (may be null, prefetch will fetch from profile)
      const guardianId = info?.guardian_id || null
      const userId = info?.user_id || info?.id || null
      
      console.log('🔑 Extracted IDs - guardianId:', guardianId, 'userId:', userId)
      
      // Always attempt prefetch - it will fetch guardian_id if needed
      Promise.all([
        import('@/services/offline/parentLoginPrefetch'),
        import('@/composables/useToast')
      ]).then(([{ prefetchParentDataOnLogin }, { addToast }]) => {
        // Show initial toast
        addToast({
          title: '🔄 Caching Data',
          message: 'Downloading your data for offline access...',
          type: 'info',
          timeout: 3000
        })
        
        return prefetchParentDataOnLogin(guardianId, userId).then(result => {
          if (result.success && result.cached) {
            console.log('✅ All data cached! App is ready for offline use.')
            console.log('📊 Stats:', result.stats)
            
            // Success toast with stats
            const stats = result.stats || {}
            const totalRecords = Object.values(stats).reduce((sum, val) => sum + (val || 0), 0)
            
            addToast({
              title: '✅ Offline Ready!',
              message: `All data cached (${totalRecords} records). You can now use the app offline.`,
              type: 'success',
              timeout: 6000
            })
          } else if (result.reason === 'already-cached') {
            console.log('✅ Data already cached from previous login.')
            
            addToast({
              title: '✅ Already Cached',
              message: 'Your data is already available offline.',
              type: 'success',
              timeout: 3000
            })
          } else if (!result.success) {
            console.error('❌ Bulk cache failed:', result.error)
            
            addToast({
              title: '⚠️ Cache Failed',
              message: 'Could not cache data. Some features may require internet.',
              type: 'warning',
              timeout: 5000
            })
          }
        })
      }).catch(err => {
        console.error('❌ Bulk cache failed (non-blocking):', err)
        console.log('💡 Data will cache automatically as you navigate')
        
        // Import toast again for error case
        import('@/composables/useToast').then(({ addToast }) => {
          addToast({
            title: '⚠️ Cache Error',
            message: 'Data will cache as you browse. Internet required for now.',
            type: 'warning',
            timeout: 5000
          })
        })
      })
    } else {
      console.log('⏭️ Not a parent role, skipping bulk cache. Role was:', normalizedRole)
    }

    // Initialize offline support for other roles
    import('@/services/offline').then(({ initializeOffline, syncAfterLogin }) => {
      return initializeOffline().then(() => {
        console.log('� Offline support initialized after login')
        return syncAfterLogin(role)
      })
    }).catch(err => {
      console.error('Failed to initialize offline or sync data after login:', err)
    })
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
    authToken.value = null
    userRole.value = null
    userInfo.value = null

    localStorage.removeItem('authToken')
    localStorage.removeItem('userRole')
    localStorage.removeItem('userInfo')
    localStorage.removeItem('authUser') // Remove both keys

    // Clear offline data and reset cache flag on logout
    const { clearOfflineDataOnLogout } = await import('@/services/offline')
    await clearOfflineDataOnLogout()
    
    const { resetCacheFlag } = await import('@/services/offline/parentLoginPrefetch')
    resetCacheFlag()
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