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

/**
 * Pre-warm route caches for admin portal
 * Attempts to pre-load all admin route components for offline functionality
 */
export async function warmAdminCache() {
  console.log('🔥 Warming cache for admin portal routes...')

  // Import the actual lazy-loading functions used by the router
  const routeImports = [
    // Main admin views - these match the router's lazy imports
    () => import('@/views/admin/dashboard/Dashboard.vue'),
    () => import('@/views/admin/patients/PatientRecords.vue'),
    () => import('@/views/admin/inventory/InventoryOverview.vue'),
    () => import('@/views/admin/inventory/ReceivingReportPage.vue'),
    () => import('@/views/admin/sms/SMSManagement.vue'),
    () => import('@/views/admin/reports/Reports.vue'),
    () => import('@/views/admin/users/UserAccounts.vue'),
    () => import('@/views/admin/users/ViewUser.vue'),
    () => import('@/views/admin/activity/ActivityLogs.vue'),
    () => import('@/views/admin/profile/Profile.vue'),
    () => import('@/views/admin/settings/Settings.vue'),
    () => import('@/views/admin/notifications/NotificationsInbox.vue'),
    () => import('@/views/admin/notifications/AddNotifications.vue'),
    () => import('@/views/admin/faq/FAQManager.vue'),
    () => import('@/views/admin/chat/AdminChat.vue'),

    // Patient management views
    () => import('@/views/admin/patients/AddPatient.vue'),
    () => import('@/views/admin/patients/AddPatientRecord.vue'),
    () => import('@/views/admin/patients/EditPatient.vue'),
    () => import('@/views/admin/patients/ViewPatient.vue'), // Critical for offline access
    () => import('@/views/admin/patients/MedicalHistoryPage.vue'),
    () => import('@/views/admin/patients/VisitSummaryPage.vue'),
    () => import('@/views/admin/patients/VisitEditorPage.vue'),
    () => import('@/views/admin/patients/VaccinationEditorPage.vue'),
    () => import('@/views/admin/patients/EditVaccinationRecord.vue'),
    () => import('@/views/admin/patients/EditVaccineRecords.vue'),
    () => import('@/views/admin/patients/VaccineDetails.vue'),

    // Inventory management views
    () => import('@/views/admin/inventory/AddStock.vue'),
    () => import('@/views/admin/inventory/EditInventory.vue'),
    () => import('@/views/admin/inventory/AddVaccine.vue'),
    () => import('@/views/admin/inventory/EditVaccineType.vue'),
    () => import('@/views/admin/inventory/ViewInventory.vue'),
    () => import('@/views/admin/inventory/AdjustStock.vue'),
    () => import('@/views/admin/inventory/InventoryHistory.vue'),
    () => import('@/views/admin/inventory/ViewSchedule.vue'),
    () => import('@/views/admin/inventory/AddSchedule.vue'),
    () => import('@/views/admin/inventory/EditSchedule.vue'),

    // User management views
    () => import('@/views/admin/users/AddUser.vue'),
    () => import('@/views/admin/users/EditUser.vue'),

    // Activity logs views
    () => import('@/views/admin/activity/ActivityLogDetails.vue')
  ]

  console.log(`📦 Pre-loading ${routeImports.length} admin route components...`)

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

  console.log(`✅ Successfully pre-loaded: ${successful}/${routeImports.length} admin route components`)

  if (failed.length > 0) {
    console.log(`⚠️ ${failed.length} admin components couldn't be pre-loaded - will cache on first navigation`)
  }

  return {
    total: routeImports.length,
    successful,
    failed: failed.length
  }
}
