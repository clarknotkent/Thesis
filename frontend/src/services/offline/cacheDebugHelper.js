/**
 * Cache Debug Helper - Diagnostic tools for offline caching
 * Use in browser console to debug cache issues
 */

import { db } from './db'
import api from '../api'

/**
 * Check what's in the cache
 * Usage: window.checkCache()
 */
export async function checkCache() {
  try {
    console.log('🔍 Checking StaffOfflineDB...')
    
    if (!db.isOpen()) {
      await db.open()
    }
    
    const stats = {
      name: db.name,
      version: db.verno,
      isOpen: db.isOpen()
    }
    
    // Get counts for each table
    for (const table of db.tables) {
      const count = await table.count()
      stats[table.name] = count
      
      if (count > 0) {
        // Get first item as sample
        const sample = await table.limit(1).toArray()
        console.log(`✅ ${table.name}: ${count} items`)
        console.log(`   Sample:`, sample[0])
      } else {
        console.warn(`⚠️ ${table.name}: EMPTY`)
      }
    }
    
    console.log('📊 Cache Summary:', stats)
    return stats
  } catch (error) {
    console.error('❌ Error checking cache:', error)
    return null
  }
}

/**
 * Manually fetch and cache guardians
 * Usage: window.cacheGuardians()
 */
export async function cacheGuardians() {
  try {
    console.log('📥 Manually fetching guardians...')
    
    if (!db.isOpen()) {
      await db.open()
    }
    
    const response = await api.get('/guardians')
    console.log('📊 API Response:', response.data)
    
    const responseData = response.data?.data || response.data
    const rawGuardians = Array.isArray(responseData) ? responseData : (responseData?.items || [])
    
    console.log(`📊 Found ${rawGuardians.length} guardians`)
    
    if (rawGuardians.length > 0) {
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
        _raw: guardian
      }))
      
      await db.guardians.bulkPut(guardians)
      console.log(`✅ Cached ${guardians.length} guardians`)
      console.log('📊 Sample:', guardians[0])
      
      return guardians
    } else {
      console.warn('⚠️ No guardians found in API response')
      return []
    }
  } catch (error) {
    console.error('❌ Error caching guardians:', error)
    return null
  }
}

/**
 * Clear all cache
 * Usage: window.clearCache()
 */
export async function clearCache() {
  try {
    console.log('🗑️ Clearing all cache...')
    
    if (!db.isOpen()) {
      await db.open()
    }
    
    for (const table of db.tables) {
      await table.clear()
      console.log(`✅ Cleared ${table.name}`)
    }
    
    console.log('✅ Cache cleared')
  } catch (error) {
    console.error('❌ Error clearing cache:', error)
  }
}

/**
 * Test offline fallback
 * Usage: window.testOffline()
 */
export async function testOffline() {
  try {
    console.log('🧪 Testing offline fallback...')
    
    if (!db.isOpen()) {
      await db.open()
    }
    
    // Get counts
    const patientCount = await db.patients.count()
    const guardianCount = await db.guardians.count()
    const inventoryCount = await db.inventory.count()
    const userCount = await db.users.count()
    
    console.log('📊 Cache Contents:')
    console.log(`  - Patients: ${patientCount}`)
    console.log(`  - Guardians: ${guardianCount}`)
    console.log(`  - Inventory: ${inventoryCount}`)
    console.log(`  - Users: ${userCount}`)
    
    // Check relationship integrity
    if (patientCount > 0) {
      const patients = await db.patients.toArray()
      const guardianIds = [...new Set(patients.map(p => p.guardian_id).filter(Boolean))]
      
      console.log(`\n� Relationship Check:`)
      console.log(`  - ${patients.length} patients reference ${guardianIds.length} unique guardians`)
      
      // Check if all guardian_ids exist in cache
      let missingCount = 0
      for (const gid of guardianIds) {
        const exists = await db.guardians.get(gid)
        if (!exists) missingCount++
      }
      
      if (missingCount > 0) {
        console.warn(`  ⚠️ ${missingCount} guardian IDs are missing from cache!`)
        console.warn(`  ⚠️ This will cause ViewPatient to fail offline`)
      } else if (guardianCount > 0) {
        console.log(`  ✅ All patient guardians are cached`)
      }
    }
    
    // Readiness verdict
    console.log('\n🎯 Offline Readiness:')
    
    if (patientCount === 0) {
      console.error('  ❌ No patients cached - offline will NOT work')
      console.log('  � Solution: Login while ONLINE to trigger prefetch')
      return false
    }
    
    if (guardianCount === 0 && patientCount > 0) {
      console.error('  ❌ No guardians cached but patients exist - offline will FAIL')
      console.log('  💡 Solution: Run window.cacheGuardians() while online')
      return false
    }
    
    console.log('  ✅ Cache looks good - offline should work!')
    console.log('  💡 Go offline and try viewing a patient')
    return true
    
    return guardians
  } catch (error) {
    console.error('❌ Error testing offline:', error)
    return null
  }
}

/**
 * Check backend guardians endpoint while ONLINE
 * Diagnoses API vs cache mismatches
 * Usage: await window.checkBackendGuardians()
 */
export async function checkBackendGuardians() {
  console.log('🔍 Checking backend /guardians endpoint...')
  
  try {
    const api = (await import('../api')).default
    const response = await api.get('/guardians')
    
    console.log('📡 Backend Response:', {
      status: response.status,
      hasData: !!response.data,
      dataKeys: response.data ? Object.keys(response.data) : [],
      isArray: Array.isArray(response.data),
      dataType: typeof response.data
    })
    
    // Extract guardians
    const data = response.data?.data || response.data
    const guardians = Array.isArray(data) ? data : (data?.items || [])
    
    console.log(`📊 Backend has ${guardians.length} guardians`)
    
    if (guardians.length === 0) {
      console.error('❌ Backend returned NO guardians!')
      console.error('💡 This is a DATABASE ISSUE - check Supabase/PostgreSQL')
      console.error('💡 Every patient MUST have a guardian (foreign key constraint)')
      return false
    }
    
    // Show sample
    if (guardians.length > 0) {
      console.log('📋 Sample guardian:', guardians[0])
    }
    
    // Compare with cache
    if (!db.isOpen()) await db.open()
    const cachedCount = await db.guardians.count()
    
    console.log(`\n🔄 Cache vs Backend:`)
    console.log(`  - Backend: ${guardians.length} guardians`)
    console.log(`  - Cache: ${cachedCount} guardians`)
    
    if (cachedCount === 0 && guardians.length > 0) {
      console.warn('  ⚠️ Cache is empty but backend has data')
      console.log('  💡 Run window.cacheGuardians() to fix this')
    } else if (cachedCount < guardians.length) {
      console.warn(`  ⚠️ Cache is outdated (${cachedCount} < ${guardians.length})`)
      console.log('  💡 Run window.cacheGuardians() to update')
    } else {
      console.log('  ✅ Cache is up to date')
    }
    
    return true
    
  } catch (error) {
    console.error('❌ Backend check failed:', error.message)
    if (error.code === 'ERR_NETWORK') {
      console.error('💡 You are OFFLINE - cannot check backend')
    } else {
      console.error('💡 Check authentication or server status')
    }
    return false
  }
}

/**
 * Test nested data for a specific patient
 * Usage: await window.testPatientDetails(123)
 */
export async function testPatientDetails(patientId) {
  try {
    console.log(`🔍 Testing patient ${patientId} nested data...`)
    
    if (!db.isOpen()) {
      await db.open()
    }

    // Fetch patient
    const patient = await db.patients.get(patientId)
    if (!patient) {
      console.error(`❌ Patient ${patientId} not found in cache`)
      
      // Show available patient IDs
      const allPatients = await db.patients.limit(10).toArray()
      if (allPatients.length > 0) {
        console.log('� Available patient IDs (first 10):')
        allPatients.forEach(p => {
          console.log(`   - ${p.patient_id}: ${p.full_name}`)
        })
        console.log(`�💡 Try: await window.testPatientDetails(${allPatients[0].patient_id})`)
      }
      
      console.log('💡 Or view this patient online first to cache their data')
      return false
    }

    console.log('✅ Patient found:', patient)
    console.log('\n📋 Checking nested data...')

    // Check parent info
    const hasMotherInfo = !!(patient.mother_name || patient.mother_occupation || patient.mother_contact_number)
    const hasFatherInfo = !!(patient.father_name || patient.father_occupation || patient.father_contact_number)
    
    console.log(`${hasMotherInfo ? '✅' : '❌'} Mother info:`, {
      name: patient.mother_name || 'N/A',
      occupation: patient.mother_occupation || 'N/A',
      contact: patient.mother_contact_number || 'N/A'
    })
    
    console.log(`${hasFatherInfo ? '✅' : '❌'} Father info:`, {
      name: patient.father_name || 'N/A',
      occupation: patient.father_occupation || 'N/A',
      contact: patient.father_contact_number || 'N/A'
    })

    // Check birth history
    const birthHistory = await db.birthhistory.where('patient_id').equals(patientId).first()
    if (birthHistory) {
      console.log('✅ Birth history found:', birthHistory)
    } else {
      console.warn('⚠️ No birth history in cache')
      console.log('💡 This patient may not have birth history, or it wasn\'t cached')
    }

    // Check guardian
    if (patient.guardian_id) {
      const guardian = await db.guardians.get(patient.guardian_id)
      if (guardian) {
        console.log('✅ Guardian found:', guardian)
      } else {
        console.warn(`⚠️ Guardian ${patient.guardian_id} not in cache`)
      }
    } else {
      console.log('ℹ️ No guardian assigned')
    }

    // Check immunizations
    const immunizations = await db.immunizations.where('patient_id').equals(patientId).toArray()
    if (immunizations.length > 0) {
      console.log(`✅ Immunizations: ${immunizations.length} records`)
      console.log('   Sample:', immunizations[0])
    } else {
      console.warn('⚠️ No immunization records in cache')
    }

    // Check scheduled vaccinations
    const schedules = await db.patientschedule.where('patient_id').equals(patientId).toArray()
    if (schedules.length > 0) {
      console.log(`✅ Scheduled vaccinations: ${schedules.length} records`)
      console.log('   Sample:', schedules[0])
    } else {
      console.warn('⚠️ No scheduled vaccinations in cache')
    }

    console.log('\n✅ Test complete!')
    return true

  } catch (error) {
    console.error('❌ Test failed:', error)
    return false
  }
}

// Expose to window for console access
if (typeof window !== 'undefined') {
  window.checkCache = checkCache
  window.cacheGuardians = cacheGuardians
  window.clearCache = clearCache
  window.testOffline = testOffline
  window.checkBackendGuardians = checkBackendGuardians
  window.testPatientDetails = testPatientDetails
  console.log('🛠️ Cache debug helpers available:')
  console.log('   window.checkCache() - Check what\'s cached')
  console.log('   window.cacheGuardians() - Manually cache guardians')
  console.log('   window.clearCache() - Clear all cache')
  console.log('   window.testOffline() - Test offline readiness')
  console.log('   await window.checkBackendGuardians() - Check backend vs cache')
  console.log('   await window.testPatientDetails(123) - Test patient nested data')
}

export default {
  checkCache,
  cacheGuardians,
  clearCache,
  testOffline,
  checkBackendGuardians,
  testPatientDetails
}
