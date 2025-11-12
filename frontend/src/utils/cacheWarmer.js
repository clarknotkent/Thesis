/**
 * Cache Warmer Utility
 * 
 * Pre-fetches route components to ensure they're cached by the service worker
 * for offline functionality. This is especially important in dev mode where
 * Vue Router lazy-loads route components.
 * 
 * STRATEGY:
 * 1. Import route components using the same lazy-loading functions as the router
 * 2. Service worker will intercept and cache the modules
 * 3. Components are now available offline after initial load
 */

/**
 * Pre-warm route caches for parent portal
 * Attempts to pre-load all parent route components
 */
export async function warmParentPortalCache() {
  console.log('🔥 Warming cache for parent portal routes...')
  
  // Import the actual lazy-loading functions used by the router
  const routeImports = [
    // Main views - these match the router's lazy imports
    () => import('@/views/parent/ParentHome.vue'),
    () => import('@/views/parent/ParentRecords.vue'),
    () => import('@/views/parent/ParentSchedule.vue'),
    () => import('@/views/parent/ParentMessages.vue'),
    () => import('@/views/parent/ParentNotifications.vue'),
    () => import('@/views/parent/ParentProfile.vue'),
    () => import('@/views/parent/ParentFAQs.vue'),
    
    // Child record features
    () => import('@/features/parent/records/patient-info/DependentDetails.vue'),
    () => import('@/features/parent/records/vaccine-details/VaccineRecordDetails.vue'),
    () => import('@/features/parent/records/visit-summary/VisitSummary.vue'),
    
    // Schedule features
    () => import('@/features/parent/schedule/ScheduleDetails.vue'),
    
    // Messaging features
    () => import('@/features/parent/messaging/Chat.vue')
  ]
  
  console.log(`📦 Pre-loading ${routeImports.length} route components...`)
  
  const results = await Promise.allSettled(
    routeImports.map(async (importFn, index) => {
      try {
        await importFn()
        return { index, success: true }
      } catch (error) {
        return { index, success: false, error: error.message }
      }
    })
  )
  
  const successful = results.filter(r => 
    r.status === 'fulfilled' && r.value.success
  ).length
  
  const failed = results.filter(r => 
    r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success)
  )
  
  console.log(`✅ Successfully pre-loaded: ${successful}/${routeImports.length} route components`)
  
  if (failed.length > 0) {
    console.log(`⚠️ ${failed.length} components couldn't be pre-loaded - will cache on first navigation`)
  }
  
  return {
    total: routeImports.length,
    successful,
    failed: failed.length
  }
}

/**
 * Pre-warm route caches for health worker portal
 */
export async function warmHealthWorkerCache() {
  console.log('🔥 Warming cache for health worker routes...')
  
  const hwRoutes = [
    '/src/views/healthworker/Dashboard.vue',
    '/src/views/healthworker/Patients.vue',
    '/src/views/healthworker/PatientDetails.vue',
    '/src/views/healthworker/patients/AddPatient.vue'
  ]
  
  const fetchPromises = hwRoutes.map(async (route) => {
    try {
      const response = await fetch(route)
      if (response.ok) {
        console.log(`✅ Cached: ${route}`)
        return { route, success: true }
      }
      return { route, success: false }
    } catch (error) {
      return { route, success: false, error }
    }
  })
  
  const results = await Promise.allSettled(fetchPromises)
  const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length
  
  console.log(`🔥 Cache warming complete: ${successful}/${hwRoutes.length} routes cached`)
  
  return {
    total: hwRoutes.length,
    successful,
    failed: hwRoutes.length - successful
  }
}
