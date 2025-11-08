/**
 * Idle Time Prefetcher
 * 
 * Runs in the background during browser idle time to preload components
 * and assets, ensuring better offline readiness without requiring manual
 * user navigation through all pages.
 * 
 * Uses requestIdleCallback API when available, falls back to setTimeout.
 */

/**
 * Queue of modules to prefetch
 */
let prefetchQueue = []
let isPrefetching = false

/**
 * Initialize the idle prefetcher with a list of modules to preload
 * @param {string[]} modules - Array of module paths to prefetch
 */
export function initIdlePrefetcher(modules = []) {
  if (modules.length === 0) return
  
  prefetchQueue = [...modules]
  console.log(`🔥 Idle prefetcher initialized with ${prefetchQueue.length} modules`)
  
  // Start prefetching after a delay to avoid interfering with initial page load
  setTimeout(() => {
    scheduleNextPrefetch()
  }, 2000)
}

/**
 * Schedule the next prefetch task during idle time
 */
function scheduleNextPrefetch() {
  if (isPrefetching || prefetchQueue.length === 0) return
  
  // Use requestIdleCallback if available (better for performance)
  if ('requestIdleCallback' in window) {
    requestIdleCallback(processPrefetchTask, { timeout: 2000 })
  } else {
    // Fallback to setTimeout with a delay
    setTimeout(processPrefetchTask, 1000)
  }
}

/**
 * Process a single prefetch task
 */
async function processPrefetchTask() {
  if (prefetchQueue.length === 0) {
    console.log('✅ Idle prefetch complete - all modules loaded')
    return
  }
  
  isPrefetching = true
  const modulePath = prefetchQueue.shift()
  
  try {
    console.log(`⏳ Idle prefetch: ${modulePath}`)
    
    // Attempt to import the module (triggers Vite fetch + service worker cache)
    await import(/* @vite-ignore */ modulePath)
    
    console.log(`✅ Prefetched: ${modulePath}`)
  } catch (error) {
    console.warn(`⚠️ Failed to prefetch ${modulePath}:`, error.message)
  } finally {
    isPrefetching = false
    
    // Schedule next task
    if (prefetchQueue.length > 0) {
      scheduleNextPrefetch()
    }
  }
}

/**
 * Stop the prefetcher and clear the queue
 */
export function stopIdlePrefetcher() {
  prefetchQueue = []
  isPrefetching = false
  console.log('🛑 Idle prefetcher stopped')
}

/**
 * Get parent portal module paths for prefetching
 */
export function getParentPortalModules() {
  return [
    '@/views/parent/ParentHome.vue',
    '@/views/parent/ParentRecords.vue',
    '@/views/parent/ParentSchedule.vue',
    '@/views/parent/ParentMessages.vue',
    '@/views/parent/ParentNotifications.vue',
    '@/views/parent/ParentProfile.vue',
    '@/features/parent/records/patient-info/DependentDetails.vue',
    '@/features/parent/records/vaccine-details/VaccineRecordDetails.vue',
    '@/features/parent/records/patient-info/PatientInfoTab.vue',
    '@/features/parent/records/vaccination-history/VaccinationHistoryTab.vue',
    '@/features/parent/records/medical-history/MedicalHistoryTab.vue',
    '@/features/parent/home/components/SummaryCards.vue',
    '@/features/parent/home/components/ChildrenList.vue',
    '@/components/parent/DependentCard.vue',
    '@/components/layout/mobile/ParentLayout.vue'
  ]
}

/**
 * Get health worker module paths for prefetching
 */
export function getHealthWorkerModules() {
  return [
    '@/views/healthworker/Dashboard.vue',
    '@/views/healthworker/Patients.vue',
    '@/views/healthworker/PatientDetails.vue',
    '@/views/healthworker/patients/AddPatient.vue',
    '@/views/healthworker/patients/AddPatientImmunizationRecord.vue'
  ]
}
