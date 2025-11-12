import { ref, computed } from 'vue';
import api from '@/services/api';
import { db } from '@/utils/db';
import { useNetworkStore } from '@/stores/network';
import { useToast } from '@/composables/useToast';

export function useOfflineGuardian() {
  const networkStore = useNetworkStore();
  const isOfflineReady = ref(false);
  const { addToast } = useToast();

  const fetchAndCacheData = async (guardianId) => {
    console.log('Starting data prefetch for offline mode...');

    try {
      // Fetch guardian profile
      console.log('📥 Fetching guardian profile...');
      const profileRes = await api.get('/parent/profile');
      await db.guardians.put({ id: guardianId, profile: profileRes.data });
      console.log('✅ Guardian profile cached:', profileRes.data);

      // Fetch notifications
      console.log('📥 Fetching notifications...');
      const notificationsRes = await api.get('/notifications');
      const notifications = Array.isArray(notificationsRes.data) ? notificationsRes.data : (notificationsRes.data?.data || notificationsRes.data?.items || []);
      await db.guardians.update(guardianId, { notifications });
      console.log(`✅ Notifications cached: ${notifications.length} items`);

      // Fetch conversations
      console.log('📥 Fetching conversations...');
      const conversationsRes = await api.get('/conversations');
      const conversations = Array.isArray(conversationsRes.data) ? conversationsRes.data : (conversationsRes.data?.data || conversationsRes.data?.items || []);
      await db.guardians.update(guardianId, { conversations });
      console.log(`✅ Conversations cached: ${conversations.length} items`);

      // Fetch FAQs
      console.log('📥 Fetching FAQs...');
      const faqsRes = await api.get('/faqs');
      const faqs = faqsRes.data?.items || faqsRes.data || [];
      if (Array.isArray(faqs)) {
        await db.faqs.bulkPut(faqs);
        console.log(`✅ FAQs cached: ${faqs.length} items`);
      } else {
        console.log('❌ FAQs data is not an array, skipping cache');
      }

      // Fetch patients connected to guardian
      console.log('📥 Fetching patients...');
      const patientsRes = await api.get('/parent/children');
      const patients = Array.isArray(patientsRes.data) ? patientsRes.data : (patientsRes.data?.data || patientsRes.data?.children || []);
      await db.patients.bulkPut(patients.map(p => ({
        id: p.id || p.patient_id,
        guardianId,
        details: p, // Store basic info initially
        visits: [],
        vitals: [],
        schedules: [],
        birthHistory: [],
        immunizations: []
      })));
      console.log(`✅ Patients cached: ${patients.length} children`);

      // For each patient, fetch full details
      for (const patient of patients) {
        console.log(`👶 Fetching details for patient ${patient.id} (${patient.first_name || patient.name || 'Unknown'})...`);

        try {
          // Fetch full patient details from /patients/{id}
          const patientDetailsRes = await api.get(`/patients/${patient.id}`);
          const fullPatientData = patientDetailsRes.data?.data || patientDetailsRes.data;
          
          // Update the patient record with full details
          await db.patients.update(patient.id, { 
            details: fullPatientData // Replace basic info with full details
          });
          console.log(`  ✅ Full patient details cached for ${patient.id}`);
        } catch (error) {
          console.warn(`  ⚠️ Failed to fetch full details for patient ${patient.id}, keeping basic info:`, error.message);
          // Keep the basic info that was already stored
        }

        // Visits
        try {
          const visitsRes = await api.get(`/parent/children/${patient.id}/visits`);
          const visits = Array.isArray(visitsRes.data) ? visitsRes.data : (visitsRes.data?.data || []);
          await db.patients.update(patient.id, { visits });
          console.log(`  ✅ Visits: ${visits?.length || 0} records`);
        } catch (error) {
          console.warn(`  ⚠️ Failed to fetch visits for patient ${patient.id}:`, error.message);
        }

        // Vitals - fetch for each visit
        let vitalsCount = 0;
        try {
          for (const visit of (await db.patients.get(patient.id)).visits || []) {
            try {
              const vitalsRes = await api.get(`/vitals/${visit.visit_id}`);
              const vitalsData = Array.isArray(vitalsRes.data) ? vitalsRes.data : (vitalsRes.data?.data || []);
              if (vitalsData && vitalsData.length > 0) {
                // Store vitals with visit ID for reference
                await db.patients.update(patient.id, { [`vitals_${visit.visit_id}`]: vitalsData });
                vitalsCount += vitalsData.length;
              }
            } catch (error) {
              // Vitals might not be available for this visit, continue
            }
          }
        } catch (error) {
          console.warn(`  ⚠️ Failed to fetch vitals for patient ${patient.id}:`, error.message);
        }
        console.log(`  ✅ Vitals: ${vitalsCount} records across visits`);

        // Schedules
        try {
          const schedulesRes = await api.get(`/parent/children/${patient.id}/schedule`);
          const schedules = Array.isArray(schedulesRes.data) ? schedulesRes.data : (schedulesRes.data?.data || []);
          await db.patients.update(patient.id, { schedules });
          console.log(`  ✅ Vaccination schedule: ${schedules?.length || 0} items`);
        } catch (error) {
          console.warn(`  ⚠️ Failed to fetch schedules for patient ${patient.id}:`, error.message);
        }

        // Birth History - might not be available, skip if 404
        try {
          const birthHistoryRes = await api.get(`/patients/${patient.id}/birth-history`);
          // Birth history is a single object, not an array
          const birthHistory = birthHistoryRes.data?.data || birthHistoryRes.data || null;
          await db.patients.update(patient.id, { birthHistory });
          console.log(`  ✅ Birth history: ${birthHistory ? '1 record' : 'No data'}`);
        } catch (error) {
          if (error.response?.status !== 404) {
            console.warn(`  ⚠️ Failed to fetch birth history for patient ${patient.id}:`, error.message);
          } else {
            console.log(`  ℹ️ Birth history: Not available`);
          }
        }

        // Immunizations - try general endpoint
        try {
          const immunizationsRes = await api.get(`/immunizations?patient_id=${patient.id}`);
          const immunizations = Array.isArray(immunizationsRes.data) ? immunizationsRes.data : (immunizationsRes.data?.data || []);
          await db.patients.update(patient.id, { immunizations });
          console.log(`  ✅ Immunizations: ${immunizations?.length || 0} records`);
        } catch (error) {
          console.warn(`  ⚠️ Failed to fetch immunizations for patient ${patient.id}:`, error.message);
        }

        console.log(`✅ Patient ${patient.id} details cached.`);
      }

      isOfflineReady.value = true;
      console.log('🎉 Offline mode is fully ready! All data cached and available offline.');
      addToast({
        title: 'Offline Mode Ready',
        message: 'All your data has been cached for offline access.',
        type: 'success',
        timeout: 5000
      });
    } catch (error) {
      console.error('Error during data prefetch:', error);
      // Don't set isOfflineReady to true if there was an error
      // This allows retrying when network comes back
    }
  };

  const getCachedData = async (guardianId) => {
    try {
      console.log('Loading data from cache...');
      const data = await db.guardians.get(guardianId);
      const patients = await db.patients.where('guardianId').equals(guardianId).toArray();
      
      // For each patient, collect vitals from all visits
      for (const patient of patients) {
        const vitals = {};
        for (const visit of patient.visits || []) {
          const visitVitals = patient[`vitals_${visit.visit_id}`];
          if (visitVitals) {
            vitals[visit.visit_id] = visitVitals;
          }
        }
        patient.vitals = vitals;
      }
      
      const faqs = await db.faqs.toArray();
      return { ...data, patients, faqs };
    } catch (error) {
      console.error('Error loading cached data:', error);
      return null;
    }
  };

  const queueMessage = async (message) => {
    if (!networkStore.isOnline) {
      await db.messageQueue.add({ message, timestamp: Date.now() });
      console.log('Message queued for sending when online.');
      // Register background sync
      if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register('send-messages');
      }
    }
  };

  const queueProfileEdit = async (changes) => {
    if (!networkStore.isOnline) {
      await db.profileEdits.add({ changes, timestamp: Date.now() });
      console.log('Profile edit queued for syncing when online.');
      // Register background sync
      if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register('sync-profile-edits');
      }
    }
  };

  return {
    isOfflineReady: computed(() => isOfflineReady.value),
    fetchAndCacheData,
    getCachedData,
    queueMessage,
    queueProfileEdit
  };
}