/**
 * Staff Login Prefetch - Automatically cache essential data after admin/staff login
 * This ensures offline functionality works immediately without manual browsing
 */

import api from '../api'
import { db } from './db' // StaffOfflineDB

/**
 * Prefetch and cache patients and inventory after staff login
 * Called automatically from useAuth.js after successful admin/staff login
 */
export async function prefetchStaffData() {
  console.log('📥 Prefetching staff data for offline access...')
  
  try {
    // Fetch and cache all patients (without pagination for complete offline access)
    console.log('📥 Fetching all patients...')
    const patientsResponse = await api.get('/patients', {
      params: { limit: 1000 } // Get all patients
    })
    
    const patients = patientsResponse.data?.data || patientsResponse.data?.items || patientsResponse.data || []
    
    if (Array.isArray(patients) && patients.length > 0) {
      await db.patients.bulkPut(patients)
      console.log(`✅ Cached ${patients.length} patients for offline access`)
    } else {
      console.warn('⚠️ No patients found to cache')
    }
    
  } catch (error) {
    console.error('❌ Failed to prefetch patients:', error.message)
  }
  
  try {
    // Fetch and cache vaccine inventory
    console.log('📥 Fetching vaccine inventory...')
    const inventoryResponse = await api.get('/vaccines/inventory')
    
    const inventory = inventoryResponse.data?.data || inventoryResponse.data?.items || inventoryResponse.data || []
    
    if (Array.isArray(inventory) && inventory.length > 0) {
      await db.inventory.bulkPut(inventory)
      console.log(`✅ Cached ${inventory.length} inventory items for offline access`)
    } else {
      console.warn('⚠️ No inventory items found to cache')
    }
    
  } catch (error) {
    console.error('❌ Failed to prefetch inventory:', error.message)
  }
  
  console.log('✅ Staff data prefetch complete')
}

/**
 * Get cache statistics for admin/staff
 */
export async function getStaffCacheStats() {
  try {
    const patientCount = await db.patients.count()
    const inventoryCount = await db.inventory.count()
    
    return {
      patients: patientCount,
      inventory: inventoryCount,
      total: patientCount + inventoryCount
    }
  } catch (error) {
    console.error('Error getting cache stats:', error)
    return { patients: 0, inventory: 0, total: 0 }
  }
}
