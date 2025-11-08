/**
 * Cache Warmer Utility
 * 
 * Pre-fetches route components to ensure they're cached by the service worker
 * for offline functionality. This is especially important in dev mode where
 * Vue Router lazy-loads route components.
 * 
 * STRATEGY:
 * 1. Try to fetch components directly (works if service worker caches them)
 * 2. If that fails, we rely on user navigation to cache on-demand
 * 3. In production, Vite pre-bundles everything so this is less critical
 */

/**
 * Pre-load a route component by importing it
 * This triggers Vite to fetch and cache the module
 */
async function preloadComponent(importPath) {
  try {
    // Dynamic import triggers Vite to fetch the module
    // Service worker will intercept and cache it
    await import(/* @vite-ignore */ importPath)
    return { path: importPath, success: true }
  } catch (error) {
    // Expected to fail if module doesn't exist or isn't accessible
    // Will work after user navigates to the route once
    return { path: importPath, success: false, error: error.message }
  }
}

/**
 * Pre-warm route caches for parent portal
 * Attempts to pre-load all parent route components
 */
export async function warmParentPortalCache() {
  console.log('🔥 Warming cache for parent portal routes...')
  
  const parentComponents = [
    // Main views
    '@/views/parent/ParentHome.vue',
    '@/views/parent/ParentRecords.vue',
    '@/views/parent/ParentSchedule.vue',
    '@/views/parent/ParentMessages.vue',
    '@/views/parent/ParentNotifications.vue',
    '@/views/parent/ParentProfile.vue',
    
    // Child record features
    '@/features/parent/records/patient-info/DependentDetails.vue',
    '@/features/parent/records/vaccine-details/VaccineRecordDetails.vue',
    '@/features/parent/records/patient-info/PatientInfoTab.vue',
    '@/features/parent/records/vaccination-history/VaccinationHistoryTab.vue',
    '@/features/parent/records/medical-history/MedicalHistoryTab.vue',
    
    // Shared components
    '@/components/parent/DependentCard.vue',
    '@/components/layout/mobile/ParentLayout.vue',
    '@/components/ui/feedback/MobileOfflineIndicatorDropdown.vue'
  ]
  
  console.log(`📦 Pre-loading ${parentComponents.length} components...`)
  
  const results = await Promise.allSettled(
    parentComponents.map(path => preloadComponent(path))
  )
  
  const successful = results.filter(r => 
    r.status === 'fulfilled' && r.value.success
  ).length
  
  const failed = results.filter(r => 
    r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success)
  )
  
  console.log(`✅ Successfully pre-loaded: ${successful}/${parentComponents.length}`)
  
  if (failed.length > 0 && failed.length < parentComponents.length) {
    console.log(`⚠️ Some components couldn't be pre-loaded (${failed.length})`)
    console.log('💡 These will be cached when you first navigate to them')
  } else if (failed.length === parentComponents.length) {
    console.log('ℹ️ Direct pre-loading not available - components will cache on first navigation')
  }
  
  return {
    total: parentComponents.length,
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
