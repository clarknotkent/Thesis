/**
 * Staff Login Prefetch - Automatically cache essential data after admin/staff login
 * This ensures offline functionality works immediately without manual browsing
 */

import api from '../api'

// Cache tracking flags
const CACHE_FLAGS = {
  PATIENTS: 'staff_cache_patients_timestamp',
  GUARDIANS: 'staff_cache_guardians_timestamp',
  INVENTORY: 'staff_cache_inventory_timestamp'
}

const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours in milliseconds

/**
 * Check if data needs to be cached based on timestamp
 */
function needsCache(flagKey) {
  const timestamp = localStorage.getItem(flagKey)
  if (!timestamp) return true
  
  const age = Date.now() - parseInt(timestamp, 10)
  return age > CACHE_DURATION
}

/**
 * Mark data as cached with current timestamp
 */
function markAsCached(flagKey) {
  localStorage.setItem(flagKey, Date.now().toString())
}

/**
 * Prefetch and cache patients and inventory after staff login
 * Called automatically from useAuth.js after successful admin/staff login
 */
export async function prefetchStaffData(force = false) {
  console.log('📥 Checking staff data cache status...')
  
  // Check what needs caching
  const needsPatientsCache = force || needsCache(CACHE_FLAGS.PATIENTS)
  const needsGuardiansCache = force || needsCache(CACHE_FLAGS.GUARDIANS)
  const needsInventoryCache = force || needsCache(CACHE_FLAGS.INVENTORY)
  
  if (!needsPatientsCache && !needsGuardiansCache && !needsInventoryCache) {
    console.log('✅ All data is already cached and up to date')
    return { cached: false, reason: 'already-cached' }
  }
  
  console.log('📥 Prefetching staff data for offline access...', {
    patients: needsPatientsCache,
    guardians: needsGuardiansCache,
    inventory: needsInventoryCache
  })
  
  // Show initial caching toast only if we're actually caching
  let addToast
  try {
    const toastModule = await import('@/composables/useToast')
    addToast = toastModule.addToast
    addToast({
      title: 'Caching Data',
      message: 'Preparing data for offline use...',
      type: 'info',
      timeout: 3000
    })
  } catch (error) {
    console.warn('Could not load toast module:', error)
  }
  
  // Lazy load database to avoid initialization issues
  let db
  try {
    db = (await import('./db')).db
    
    // Ensure database is open before using it
    if (!db.isOpen()) {
      await db.open()
      console.log('✅ StaffOfflineDB opened for prefetch')
    }
  } catch (dbError) {
    console.error('❌ Failed to open StaffOfflineDB:', dbError)
    if (addToast) {
      addToast({
        title: 'Cache Error',
        message: 'Could not prepare offline data.',
        type: 'warning',
        timeout: 4000
      })
    }
    return
  }
  
  let dataCached = false
  
  try {
    // Only fetch and cache patients if needed
    if (needsPatientsCache) {
      console.log('📥 Fetching all patients...')
      const patientsResponse = await api.get('/patients', {
        params: { limit: 1000 } // Get all patients
      })
      
      console.log('📊 API Response structure:', {
        hasData: !!patientsResponse.data,
        dataKeys: patientsResponse.data ? Object.keys(patientsResponse.data) : [],
        dataType: Array.isArray(patientsResponse.data) ? 'array' : typeof patientsResponse.data
      })
      
      // Backend returns: { success: true, data: { patients: [...], totalCount, page, limit, totalPages } }
      const responseData = patientsResponse.data?.data || patientsResponse.data
      const rawPatients = responseData?.patients || responseData?.items || responseData || []
      console.log(`📊 Extracted ${Array.isArray(rawPatients) ? rawPatients.length : 0} patients from response`)
      
      if (Array.isArray(rawPatients) && rawPatients.length > 0) {
        // Map patients to match database schema (from SQL: patient_id, surname, firstname, middlename, sex, date_of_birth, address, etc.)
        const patients = rawPatients.map(patient => ({
          patient_id: patient.patient_id,
          surname: patient.surname,
          firstname: patient.firstname,
          middlename: patient.middlename,
          full_name: patient.full_name || `${patient.firstname || ''} ${patient.middlename || ''} ${patient.surname || ''}`.trim(),
          sex: patient.sex,
          date_of_birth: patient.date_of_birth,
          address: patient.address,
          barangay: patient.barangay,
          health_center: patient.health_center,
          // Parent details for offline Patient Details view
          mother_name: patient.mother_name,
          mother_contact_number: patient.mother_contact_number,
          mother_occupation: patient.mother_occupation,
          father_name: patient.father_name,
          father_contact_number: patient.father_contact_number,
          father_occupation: patient.father_occupation,
          guardian_id: patient.guardian_id,
          family_number: patient.family_number,
          guardian_contact_number: patient.guardian_contact_number,
          tags: patient.tags,
          status: patient.status,
          age: patient.age, // If present from view
          // Keep original data for reference
          _raw: patient
        }))
        
        console.log('📊 Sample patient item:', patients[0]) // Debug log
        
        await db.patients.bulkPut(patients)
        markAsCached(CACHE_FLAGS.PATIENTS)
        dataCached = true
        console.log(`✅ Cached ${patients.length} patients for offline access`)
      } else {
        console.warn('⚠️ No patients found to cache')
      }
    } else {
      console.log('⏭️ Skipping patients cache - already up to date')
    }
    
  } catch (error) {
    console.error('❌ Failed to prefetch patients:', error.message)
    console.error('Error details:', error)
  }
  
  try {
    // Only fetch and cache guardians if needed
    if (needsGuardiansCache) {
      console.log('📥 Fetching all guardians...')
      const guardiansResponse = await api.get('/guardians')
    
      console.log('📊 Guardians API Response FULL:', JSON.stringify(guardiansResponse.data, null, 2))
      console.log('📊 Guardians API Response structure:', {
        hasData: !!guardiansResponse.data,
        dataKeys: guardiansResponse.data ? Object.keys(guardiansResponse.data) : [],
        isArray: Array.isArray(guardiansResponse.data),
        hasSuccess: 'success' in (guardiansResponse.data || {}),
        hasDataKey: 'data' in (guardiansResponse.data || {})
      })
      
      // Backend returns: { success: true, data: [...] }
      const responseData = guardiansResponse.data?.data || guardiansResponse.data
      const rawGuardians = Array.isArray(responseData) ? responseData : (responseData?.items || [])
      console.log(`📊 Extracted ${rawGuardians.length} guardians from response`)
      console.log('📊 First guardian sample:', rawGuardians[0])
      
      if (Array.isArray(rawGuardians) && rawGuardians.length > 0) {
        // Map guardians to match database schema (from SQL: guardian_id, surname, firstname, middlename, contact_number, etc.)
        const guardians = rawGuardians.map(guardian => ({
          guardian_id: guardian.guardian_id,
          user_id: guardian.user_id,
          surname: guardian.surname,
          firstname: guardian.firstname,
          middlename: guardian.middlename,
          full_name: guardian.full_name || `${guardian.surname || ''}, ${guardian.firstname || ''} ${guardian.middlename || ''}`.trim(),
          sex: guardian.sex,
          contact_number: guardian.contact_number,
          email: guardian.email,
          address: guardian.address,
          family_number: guardian.family_number,
          occupation: guardian.occupation,
          // Keep original data for reference
          _raw: guardian
        }))
        
        console.log('📊 Sample guardian item:', guardians[0]) // Debug log
        
        await db.guardians.bulkPut(guardians)
        markAsCached(CACHE_FLAGS.GUARDIANS)
        dataCached = true
        console.log(`✅ Cached ${guardians.length} guardians for offline access`)
      } else {
        console.warn('⚠️ No guardians found to cache')
        console.warn('⚠️ This is a CRITICAL issue: patients require guardians!')
        console.warn('⚠️ Check backend /guardians endpoint - it may be returning empty array')
        
        // Double-check patients to see if they have guardian_id references
        try {
          const cachedPatients = await db.patients.toArray()
          const uniqueGuardianIds = [...new Set(cachedPatients.map(p => p.guardian_id).filter(Boolean))]
          console.warn(`⚠️ Found ${cachedPatients.length} patients referencing ${uniqueGuardianIds.length} unique guardian IDs`)
          console.warn(`⚠️ Guardian IDs needed:`, uniqueGuardianIds.slice(0, 10))
        } catch (checkError) {
          console.error('Failed to check cached patients:', checkError)
        }
      }
    } else {
      console.log('⏭️ Skipping guardians cache - already up to date')
    }
    
  } catch (error) {
    console.error('❌ Failed to prefetch guardians:', error.message)
    console.error('Error details:', error)
  }
  
  try {
    // Only fetch and cache vaccine inventory if needed
    if (needsInventoryCache) {
      // First, fetch vaccine types master list
      console.log('📥 Fetching vaccine types...')
      try {
        const vaccinesResponse = await api.get('/vaccines')
        const vaccines = Array.isArray(vaccinesResponse.data) ? vaccinesResponse.data : (vaccinesResponse.data?.data || [])
        
        if (Array.isArray(vaccines) && vaccines.length > 0) {
          await db.vaccines.bulkPut(vaccines)
          console.log(`✅ Cached ${vaccines.length} vaccine types`)
        }
      } catch (vaccineError) {
        console.error('❌ Failed to fetch vaccine types:', vaccineError.message)
      }
      
      // Then, fetch vaccine inventory
      console.log('📥 Fetching vaccine inventory...')
      const inventoryResponse = await api.get('/vaccines/inventory')
      
      console.log('📊 Inventory API Response structure:', {
        hasData: !!inventoryResponse.data,
        dataKeys: inventoryResponse.data ? Object.keys(inventoryResponse.data) : []
      })
      
      // Backend returns: { success: true, data: [...] }
      const responseData = inventoryResponse.data?.data || inventoryResponse.data
      const rawInventory = Array.isArray(responseData) ? responseData : (responseData?.items || [])
      console.log(`📊 Extracted ${rawInventory.length} inventory items from response`)
      
      if (Array.isArray(rawInventory) && rawInventory.length > 0) {
        // Map inventory to match database schema (from SQL: inventory_id, vaccine_id, lot_number, expiration_date, current_stock_level, etc.)
        const inventory = rawInventory.map(item => ({
          id: item.inventory_id, // Primary key from inventory table
          inventory_id: item.inventory_id,
          vaccine_id: item.vaccine_id,
          lot_number: item.lot_number,
          expiration_date: item.expiration_date,
          current_stock_level: item.current_stock_level,
          received_date: item.received_date,
          initial_quantity: item.initial_quantity,
          storage_location: item.storage_location,
          // Flatten vaccinemaster join for easier access
          antigen_name: item.vaccinemaster?.antigen_name,
          brand_name: item.vaccinemaster?.brand_name,
          manufacturer: item.vaccinemaster?.manufacturer,
          vaccine_type: item.vaccinemaster?.vaccine_type,
          category: item.vaccinemaster?.category,
          disease_prevented: item.vaccinemaster?.disease_prevented,
          is_nip: item.vaccinemaster?.is_nip,
          // Keep original data for reference
          _raw: item
        }))
        
        console.log('📊 Sample inventory item:', inventory[0]) // Debug log
        
        await db.inventory.bulkPut(inventory)
        markAsCached(CACHE_FLAGS.INVENTORY)
        dataCached = true
        console.log(`✅ Cached ${inventory.length} inventory items for offline access`)
      } else {
        console.warn('⚠️ No inventory items found to cache')
      }
    } else {
      console.log('⏭️ Skipping inventory cache - already up to date')
    }
    
  } catch (error) {
    console.error('❌ Failed to prefetch inventory:', error.message)
    console.error('Error details:', error)
  }
  
  console.log('✅ Staff data prefetch complete')
  
  // Only show toast if we actually cached new data
  if (dataCached && addToast) {
    addToast({
      title: 'Offline Ready',
      message: 'Data cached successfully',
      type: 'success',
      timeout: 3000
    })
  }
  
  return { cached: dataCached }
}

/**
 * Clear cache flags to force re-caching on next visit
 */
export function clearStaffCacheFlags() {
  localStorage.removeItem(CACHE_FLAGS.PATIENTS)
  localStorage.removeItem(CACHE_FLAGS.GUARDIANS)
  localStorage.removeItem(CACHE_FLAGS.INVENTORY)
  console.log('✅ Cache flags cleared - data will be re-cached on next visit')
}

/**
 * Get cache statistics for admin/staff
 */
export async function getStaffCacheStats() {
  try {
    // Lazy load database
    const { db } = await import('./db')
    
    // Ensure database is open
    if (!db.isOpen()) {
      await db.open()
    }
    
    const patientCount = await db.patients.count()
    const guardianCount = await db.guardians.count()
    const inventoryCount = await db.inventory.count()
    
    return {
      patients: patientCount,
      guardians: guardianCount,
      inventory: inventoryCount,
      total: patientCount + guardianCount + inventoryCount
    }
  } catch (error) {
    console.error('Error getting cache stats:', error)
    return { patients: 0, guardians: 0, inventory: 0, total: 0 }
  }
}
