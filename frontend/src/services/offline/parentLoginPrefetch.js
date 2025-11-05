/**
 * Parent Login Prefetch - One-Time Bulk Cache on Login
 * 
 * Strategy:
 * 1. On successful parent login, fetch and cache ALL their data once
 * 2. Only re-cache when Supabase detects a write operation
 * 3. This ensures immediate offline functionality without over-fetching
 */

import api from '@/services/api'
import db from './db-parent-portal'

// Track if we've already cached for this session
let hasCachedThisSession = false
let isCurrentlyCaching = false

/**
 * Prefetch all parent route components for offline use
 * Uses dynamic imports to trigger module loading and caching
 */
async function prefetchParentRouteComponents() {
  console.log('📦 Prefetching parent route components...')
  
  try {
    // Use dynamic imports to load components (this triggers Vite's bundler and service worker caching)
    const components = await Promise.allSettled([
      import('@/views/parent/ParentHome.vue'),
      import('@/views/parent/ParentSchedule.vue'),
      import('@/views/parent/ParentRecords.vue'),
      import('@/views/parent/ParentNotifications.vue'),
      import('@/views/parent/ParentProfile.vue'),
      import('@/features/parent/records/DependentDetails.vue'),
      import('@/features/parent/records/VisitSummary.vue'),
      import('@/features/parent/records/VaccineRecordDetails.vue'),
      import('@/features/parent/schedule/ScheduleDetails.vue'),
      // Also prefetch shared components used by parent views
      import('@/components/parent/DependentCard.vue')
    ])
    
    const successful = components.filter(c => c.status === 'fulfilled').length
    const failed = components.filter(c => c.status === 'rejected').length
    
    console.log(`✅ Route components cached (${successful} success, ${failed} failed)`)
    return true
  } catch (err) {
    console.error('❌ Failed to prefetch routes:', err)
    return false
  }
}

/**
 * Main function: Bulk cache all parent data on login
 * Call this immediately after successful parent login
 */
export async function prefetchParentDataOnLogin(guardianId, userId) {
  // Prevent duplicate caching in same session
  if (hasCachedThisSession || isCurrentlyCaching) {
    console.log('⏭️ Skipping prefetch - already cached this session')
    return { success: true, cached: false, reason: 'already-cached' }
  }

  isCurrentlyCaching = true
  console.log('🚀 Starting one-time bulk cache on login...')
  console.log('📝 Guardian ID:', guardianId, 'User ID:', userId)
  
  const startTime = Date.now()
  const stats = {
    patients: 0,
    immunizations: 0,
    visits: 0,
    vitals: 0,
    schedules: 0,
    notifications: 0,
    vaccines: 0,
    faqs: 0,
    conversations: 0,
    messages: 0
  }

  try {
    // Step 0: Prefetch route components first (critical for offline navigation)
    console.log('📦 Step 0: Caching route components...')
    await prefetchParentRouteComponents()
    
    // Step 1: If guardianId not provided, fetch it from profile
    if (!guardianId) {
      console.log('📋 Guardian ID not provided, fetching from profile...')
      try {
        const profileResponse = await api.get('/parent/profile')
        const profile = profileResponse.data?.data || profileResponse.data
        guardianId = profile.guardian_id
        console.log('✅ Found guardian_id:', guardianId)
      } catch (err) {
        console.error('❌ Failed to fetch guardian profile:', err.message)
        isCurrentlyCaching = false
        return { success: false, cached: false, error: 'Failed to fetch guardian profile' }
      }
    }
    
    // Step 2: Fetch all children for this guardian
    console.log('📋 Fetching children list...')
    const patientsResponse = await api.get(`/parent/children`)
    const patients = Array.isArray(patientsResponse.data) 
      ? patientsResponse.data 
      : patientsResponse.data.data || []
    
    if (patients.length === 0) {
      console.log('⚠️ No children found for guardian')
      isCurrentlyCaching = false
      return { success: true, cached: false, reason: 'no-children' }
    }

    // Cache patients (clean data - remove nested objects)
    const cleanPatients = patients.map(p => {
      // Remove nested objects and arrays that aren't part of the patients table schema
      const { patientschedule, immunizations, visits, guardian, birthhistory, ...patientData } = p
      
      // Map frontend field names to database field names
      return {
        patient_id: patientData.id || patientData.patient_id,
        full_name: patientData.name || patientData.full_name,
        date_of_birth: patientData.dateOfBirth || patientData.date_of_birth,
        sex: patientData.gender || patientData.sex,
        barangay: patientData.barangay,
        // Keep other fields that might exist
        ...patientData
      }
    })
    
    console.log('📝 Clean patients to cache:', cleanPatients)
    console.log('🔑 First patient keys:', Object.keys(cleanPatients[0] || {}))
    console.log('🔑 First patient has patient_id?', cleanPatients[0]?.patient_id)
    
    try {
      await db.patients.bulkPut(cleanPatients)
      stats.patients = cleanPatients.length
      console.log(`✅ Cached ${cleanPatients.length} children`)
    } catch (err) {
      console.error('❌ Failed to cache patients:', err)
      throw new Error(`Failed to cache patients: ${err.message}`)
    }

    // Step 2: For each child, fetch detailed data SEQUENTIALLY (transactional writes per child)
    for (const patient of patients) {
      const patientId = patient.id || patient.patient_id
      let localCounts = { immunizations: 0, visits: 0, vitals: 0, schedules: 0 }

      // 2.1 Details (also lets interceptor cache nested immunizations/schedule)
      try {
        const detailsResponse = await api.get(`/patients/${patientId}`)
        const details = detailsResponse.data?.data || detailsResponse.data
        if (details?.vaccinationHistory && Array.isArray(details.vaccinationHistory)) {
          localCounts.immunizations += details.vaccinationHistory.length
        }
      } catch (err) {
        console.warn(`⚠️ Failed to fetch details for patient ${patientId}:`, err.message)
      }

      // 2.2 Visits and vitals (sequential; accumulate writes then one transaction)
      let visitRows = []
      let vitalRows = []
      try {
        const visitsResponse = await api.get(`/parent/children/${patientId}/visits`)
        let visits = []
        if (Array.isArray(visitsResponse.data)) {
          visits = visitsResponse.data
        } else if (Array.isArray(visitsResponse.data?.data)) {
          visits = visitsResponse.data.data
        } else if (Array.isArray(visitsResponse.data?.items)) {
          visits = visitsResponse.data.items
        } else if (Array.isArray(visitsResponse.data?.data?.items)) {
          visits = visitsResponse.data.data.items
        }
        if (visits.length > 0) {
          visitRows = visits.map(v => ({
            visit_id: v.visit_id || v.id,
            patient_id: v.patient_id || patientId,
            visit_date: v.visit_date,
            findings: v.findings,
            service_rendered: v.service_rendered,
            recorded_by: v.recorded_by,
            created_at: v.created_at,
            updated_at: v.updated_at,
            patient_name: v.patient_name || v.full_name,
            health_worker_name: v.health_worker_name
          }))
          localCounts.visits += visits.length

          // Fetch vitals sequentially per visit (only while online)
          if (navigator.onLine) {
            for (const vr of visitRows) {
              try {
                let vitals
                try {
                  const vitalsRes1 = await api.get(`/vitalsigns/${vr.visit_id}`)
                  vitals = vitalsRes1.data?.data ?? vitalsRes1.data
                } catch (_) {
                  const vitalsRes2 = await api.get(`/vitals/${vr.visit_id}`)
                  vitals = vitalsRes2.data?.data ?? vitalsRes2.data
                }
                if (Array.isArray(vitals)) {
                  vitals.forEach(v => {
                    vitalRows.push({
                      vital_id: v.vital_id || `vital-${vr.visit_id}`,
                      visit_id: v.visit_id || vr.visit_id,
                      temperature: v.temperature,
                      respiration_rate: v.respiration_rate,
                      weight: v.weight,
                      height_length: v.height_length,
                      muac: v.muac,
                      created_at: v.created_at,
                      updated_at: v.updated_at
                    })
                  })
                } else if (vitals && (vitals.vital_id || vr.visit_id)) {
                  vitalRows.push({
                    vital_id: vitals.vital_id || `vital-${vr.visit_id}`,
                    visit_id: vitals.visit_id || vr.visit_id,
                    temperature: vitals.temperature,
                    respiration_rate: vitals.respiration_rate,
                    weight: vitals.weight,
                    height_length: vitals.height_length,
                    muac: vitals.muac,
                    created_at: vitals.created_at,
                    updated_at: vitals.updated_at
                  })
                }
              } catch (_) { /* ignore missing vitals */ }
            }
            localCounts.vitals += vitalRows.length
          }
        }
      } catch (err) {
        console.warn(`⚠️ Failed to fetch visits for patient ${patientId}:`, err.message)
      }

      // 2.3 Schedule for child (sequential)
      let scheduleRows = []
      try {
        const scheduleResponse = await api.get(`/parent/children/${patientId}/schedule`)
        let raw = []
        if (Array.isArray(scheduleResponse.data)) {
          raw = scheduleResponse.data
        } else if (Array.isArray(scheduleResponse.data?.data)) {
          raw = scheduleResponse.data.data
        } else if (Array.isArray(scheduleResponse.data?.data?.schedule)) {
          raw = scheduleResponse.data.data.schedule
        } else if (Array.isArray(scheduleResponse.data?.schedule)) {
          raw = scheduleResponse.data.schedule
        }
        if (raw.length > 0) {
          scheduleRows = raw.map(s => ({
            patient_schedule_id: s.patient_schedule_id || s.id,
            patient_id: s.patient_id || patientId,
            vaccine_id: s.vaccine_id,
            vaccine_name: s.name || s.vaccine_name || s.antigen_name,
            name: s.name,
            dose_number: s.dose_number || s.dose || 1,
            scheduled_date: s.scheduled_date || s.scheduledDate,
            eligible_date: s.eligible_date,
            actual_date: s.actual_date,
            status: s.status,
            created_at: s.created_at,
            updated_at: s.updated_at,
            patient_name: s.patient_name || s.full_name
          }))
          localCounts.schedules += scheduleRows.length
        }
      } catch (err) {
        console.warn(`⚠️ Failed to fetch schedule for patient ${patientId}:`, err.message)
      }

      // 2.4 Transactional write per child
      try {
        await db.transaction('rw', db.visits, db.vitalsigns, db.patientschedule, async () => {
          if (visitRows.length) await db.visits.bulkPut(visitRows)
          if (vitalRows.length) await db.vitalsigns.bulkPut(vitalRows)
          if (scheduleRows.length) await db.patientschedule.bulkPut(scheduleRows)
        })
      } catch (err) {
        console.warn(`⚠️ Transaction failed for patient ${patientId}:`, err.message)
      }

      // Aggregate to global stats
      stats.immunizations += localCounts.immunizations || 0
      stats.visits += localCounts.visits || 0
      stats.vitals += localCounts.vitals || 0
      stats.schedules += localCounts.schedules || 0
    }

    // Step 3 & 4: Fetch notifications, vaccine master, FAQs, and conversations SEQUENTIALLY
    // 3.1 Notifications
    try {
      console.log('📬 Fetching notifications...')
      const notificationsResponse = await api.get(`/notifications`, { params: { user_id: userId } })
      const notifications = Array.isArray(notificationsResponse.data)
        ? notificationsResponse.data
        : notificationsResponse.data.data || []
      if (notifications.length > 0) {
        await db.transaction('rw', db.notifications, async () => {
          await db.notifications.bulkPut(notifications)
        })
        stats.notifications = notifications.length
      }
    } catch (err) {
      console.warn('⚠️ Failed to fetch notifications:', err.message)
    }

    // 3.2 Vaccine catalog
    try {
      console.log('💉 Fetching vaccine catalog...')
      const vaccinesResponse = await api.get(`/vaccines`)
      const vaccines = Array.isArray(vaccinesResponse.data)
        ? vaccinesResponse.data
        : vaccinesResponse.data.data || []
      if (vaccines.length > 0) {
        await db.transaction('rw', db.vaccinemaster, async () => {
          await db.vaccinemaster.bulkPut(vaccines)
        })
        stats.vaccines = vaccines.length
      }
    } catch (err) {
      console.warn('⚠️ Failed to fetch vaccines:', err.message)
    }

    // 3.3 FAQs
    try {
      console.log('❓ Fetching FAQs...')
      const faqsResponse = await api.get(`/faqs`)
      const faqs = Array.isArray(faqsResponse.data?.items)
        ? faqsResponse.data.items
        : (Array.isArray(faqsResponse.data) ? faqsResponse.data : (faqsResponse.data?.data || []))
      if (faqs.length > 0 && db.faqs) {
        const rows = faqs.map(f => ({
          faq_id: f.faq_id || f.id,
          question: f.question || f.q,
          answer: f.answer || f.a,
          updated_at: f.updated_at || f.updatedAt || new Date().toISOString(),
        }))
        await db.transaction('rw', db.faqs, async () => {
          await db.faqs.bulkPut(rows)
        })
        stats.faqs = rows.length
      }
    } catch (err) {
      console.warn('⚠️ Failed to fetch FAQs:', err.message)
    }

    // 3.4 Conversations & messages (sequential per conversation)
    try {
      console.log('💬 Fetching conversations...')
      const convRes = await api.get(`/conversations`, { params: { user_id: userId, limit: 100 } })
      const convs = Array.isArray(convRes.data?.items) ? convRes.data.items : (Array.isArray(convRes.data) ? convRes.data : [])
      if (convs.length > 0) {
        const rows = convs.map(c => ({
          conversation_id: c.conversation_id || c.id,
          subject: c.subject || c.title || 'Conversation',
          updated_at: c.updated_at || c.last_message_at || c.created_at,
          unread_count: c.unread_count || 0,
          participants: c.participants || [],
        }))
        await db.transaction('rw', db.conversations, async () => {
          await db.conversations.bulkPut(rows)
        })
        stats.conversations = rows.length

        let totalMsgs = 0
        for (const r of rows) {
          try {
            const mRes = await api.get(`/messages/${r.conversation_id}`, { params: { limit: 200 } })
            const list = Array.isArray(mRes.data?.items) ? mRes.data.items : (Array.isArray(mRes.data) ? mRes.data : [])
            if (list.length) {
              const msgs = list.map(m => ({
                message_id: m.message_id || m.id,
                conversation_id: m.conversation_id || r.conversation_id,
                sender_id: m.sender_id || m.user_id,
                content: m.message_content || m.content || m.text,
                created_at: m.created_at || m.timestamp,
                pending: false,
              }))
              await db.transaction('rw', db.messages, async () => {
                await db.messages.bulkPut(msgs)
              })
              totalMsgs += msgs.length
            }
          } catch (_) { /* ignore per-conv errors */ }
        }
        stats.messages = totalMsgs
      }
    } catch (err) {
      console.warn('⚠️ Failed to fetch conversations/messages:', err.message)
    }

    // Step 3 & 4: Fetch notifications, vaccine master, FAQs, and conversations in parallel
    const results = await Promise.allSettled([
      (async () => {
        try {
          console.log('📬 Fetching notifications...')
          const notificationsResponse = await api.get(`/notifications`, { params: { user_id: userId } })
          const notifications = Array.isArray(notificationsResponse.data)
            ? notificationsResponse.data
            : notificationsResponse.data.data || []
          if (notifications.length > 0) {
            await db.notifications.bulkPut(notifications)
            stats.notifications = notifications.length
          }
        } catch (err) {
          console.warn('⚠️ Failed to fetch notifications:', err.message)
        }
      })(),
      (async () => {
        try {
          console.log('💉 Fetching vaccine catalog...')
          const vaccinesResponse = await api.get(`/vaccines`)
          const vaccines = Array.isArray(vaccinesResponse.data)
            ? vaccinesResponse.data
            : vaccinesResponse.data.data || []
          if (vaccines.length > 0) {
            await db.vaccinemaster.bulkPut(vaccines)
            stats.vaccines = vaccines.length
          }
        } catch (err) {
          console.warn('⚠️ Failed to fetch vaccines:', err.message)
        }
      })(),
      (async () => {
        try {
          console.log('❓ Fetching FAQs...')
          const faqsResponse = await api.get(`/faqs`)
          const faqs = Array.isArray(faqsResponse.data?.items)
            ? faqsResponse.data.items
            : (Array.isArray(faqsResponse.data) ? faqsResponse.data : (faqsResponse.data?.data || []))
          if (faqs.length > 0 && db.faqs) {
            // Normalize
            const rows = faqs.map(f => ({
              faq_id: f.faq_id || f.id,
              question: f.question || f.q,
              answer: f.answer || f.a,
              updated_at: f.updated_at || f.updatedAt || new Date().toISOString(),
            }))
            await db.faqs.bulkPut(rows)
            stats.faqs = rows.length
          }
        } catch (err) {
          console.warn('⚠️ Failed to fetch FAQs:', err.message)
        }
      })(),
      (async () => {
        try {
          console.log('💬 Fetching conversations...')
          const convRes = await api.get(`/conversations`, { params: { user_id: userId, limit: 100 } })
          const convs = Array.isArray(convRes.data?.items) ? convRes.data.items : (Array.isArray(convRes.data) ? convRes.data : [])
          if (convs.length > 0) {
            // Save conversations
            const rows = convs.map(c => ({
              conversation_id: c.conversation_id || c.id,
              subject: c.subject || c.title || 'Conversation',
              updated_at: c.updated_at || c.last_message_at || c.created_at,
              unread_count: c.unread_count || 0,
              participants: c.participants || [],
            }))
            await db.conversations.bulkPut(rows)
            stats.conversations = rows.length

            // Fetch messages for each conversation (best-effort, limit per conv)
            const perConv = await Promise.allSettled(rows.map(async (r) => {
              try {
                const mRes = await api.get(`/messages/${r.conversation_id}`, { params: { limit: 200 } })
                const list = Array.isArray(mRes.data?.items) ? mRes.data.items : (Array.isArray(mRes.data) ? mRes.data : [])
                if (list.length) {
                  const msgs = list.map(m => ({
                    message_id: m.message_id || m.id,
                    conversation_id: m.conversation_id || r.conversation_id,
                    sender_id: m.sender_id || m.user_id,
                    content: m.message_content || m.content || m.text,
                    created_at: m.created_at || m.timestamp,
                    pending: false,
                  }))
                  await db.messages.bulkPut(msgs)
                  return msgs.length
                }
                return 0
              } catch (_) {
                return 0
              }
            }))
            perConv.forEach(x => { if (x.status === 'fulfilled') stats.messages += (x.value || 0) })
          }
        } catch (err) {
          console.warn('⚠️ Failed to fetch conversations/messages:', err.message)
        }
      })()
    ])

    // Mark as cached for this session
    hasCachedThisSession = true
    isCurrentlyCaching = false

    const duration = ((Date.now() - startTime) / 1000).toFixed(2)
    
    console.log('🎉 Bulk cache complete!')
    console.log('📊 Cache Statistics:')
    console.log(`   • ${stats.patients} children`)
    console.log(`   • ${stats.immunizations} immunization records`)
    console.log(`   • ${stats.visits} visits`)
    console.log(`   • ${stats.vitals} vital signs`)
    console.log(`   • ${stats.schedules} scheduled appointments`)
    console.log(`   • ${stats.notifications} notifications`)
    console.log(`   • ${stats.vaccines} vaccines in catalog`)
    console.log(`   ⏱️ Completed in ${duration}s`)
    console.log('✅ You can now use the app offline!')

    return { 
      success: true, 
      cached: true, 
      duration,
      stats 
    }

  } catch (error) {
    console.error('❌ Bulk cache failed:', error)
    isCurrentlyCaching = false
    return { 
      success: false, 
      cached: false, 
      error: error.message 
    }
  }
}

/**
 * Reset cache flag (for logout)
 */
export function resetCacheFlag() {
  hasCachedThisSession = false
  isCurrentlyCaching = false
}

/**
 * Smart recache - only update when data changes
 * Call this when you detect a write operation (POST/PUT/DELETE)
 */
export async function recacheAfterWrite(resourceType, resourceId, guardianId, userId) {
  console.log(`🔄 Recaching ${resourceType} after write operation...`)
  
  try {
    switch (resourceType) {
      case 'patient':
        // Refetch single patient details
        const patientResponse = await api.get(`/parent/children/${resourceId}`)
        const patientData = patientResponse.data?.data || patientResponse.data
        await db.patients.put(patientData)
        if (patientData.birthhistory) {
          await db.birthhistory.put(patientData.birthhistory)
        }
        console.log(`✅ Recached patient ${resourceId}`)
        break

      case 'immunization':
        // Refetch immunizations for patient
        const immunizationsResponse = await api.get(`/parent/children/${resourceId}/immunizations`)
        const immunizations = Array.isArray(immunizationsResponse.data)
          ? immunizationsResponse.data
          : immunizationsResponse.data.data || []
        await db.immunizations.bulkPut(immunizations)
        console.log(`✅ Recached immunizations for patient ${resourceId}`)
        break

      case 'visit':
        // Refetch visits for patient
        const visitsResponse = await api.get(`/parent/children/${resourceId}/visits`)
        const visits = Array.isArray(visitsResponse.data)
          ? visitsResponse.data
          : visitsResponse.data.data || []
        await db.visits.bulkPut(visits)
        console.log(`✅ Recached visits for patient ${resourceId}`)
        break

      case 'schedule':
        // Refetch schedule for patient
        const scheduleResponse = await api.get(`/parent/children/${resourceId}/schedule`)
        // Unwrap and normalize
        let raw = []
        if (Array.isArray(scheduleResponse.data)) {
          raw = scheduleResponse.data
        } else if (Array.isArray(scheduleResponse.data?.data)) {
          raw = scheduleResponse.data.data
        } else if (Array.isArray(scheduleResponse.data?.data?.schedule)) {
          raw = scheduleResponse.data.data.schedule
        } else if (Array.isArray(scheduleResponse.data?.schedule)) {
          raw = scheduleResponse.data.schedule
        }
        if (raw.length > 0) {
          const rows = raw.map(s => ({
            patient_schedule_id: s.patient_schedule_id || s.id,
            patient_id: s.patient_id || resourceId,
            vaccine_id: s.vaccine_id,
            vaccine_name: s.vaccine_name || s.antigen_name,
            dose_number: s.dose_number || s.dose || 1,
            scheduled_date: s.scheduled_date || s.scheduledDate,
            eligible_date: s.eligible_date,
            actual_date: s.actual_date,
            status: s.status,
            created_at: s.created_at,
            updated_at: s.updated_at,
            patient_name: s.patient_name || s.full_name
          }))
          await db.patientschedule.bulkPut(rows)
        }
        console.log(`✅ Recached schedule for patient ${resourceId}`)
        break

      case 'notification':
        // Refetch all notifications for user
        const notificationsResponse = await api.get(`/notifications`, {
          params: { user_id: userId }
        })
        const notifications = Array.isArray(notificationsResponse.data)
          ? notificationsResponse.data
          : notificationsResponse.data.data || []
        await db.notifications.bulkPut(notifications)
        console.log(`✅ Recached notifications`)
        break

      default:
        console.warn(`⚠️ Unknown resource type: ${resourceType}`)
    }

    return { success: true }
  } catch (error) {
    console.error(`❌ Recache failed for ${resourceType}:`, error)
    return { success: false, error: error.message }
  }
}

/**
 * Check if cache exists and is not empty
 */
export async function hasCachedData() {
  try {
    const patientCount = await db.patients.count()
    return patientCount > 0
  } catch (error) {
    return false
  }
}
