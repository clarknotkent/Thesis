<template>
  <div class="offline-demo-container">
    <div class="container-fluid py-4">
      <div class="row">
        <div class="col-12">
          <h2 class="mb-4">
            <i class="bi bi-database-gear me-2"></i>
            Offline Data Demo
          </h2>
          
          <!-- Offline Sync Status Component -->
          <OfflineSyncStatus />
          
          <!-- Demo Patient Form -->
          <div class="card mt-4">
            <div class="card-header">
              <h5 class="mb-0">
                <i class="bi bi-person-plus me-2"></i>
                Add Patient (Works Offline!)
              </h5>
            </div>
            <div class="card-body">
              <form @submit.prevent="addPatient">
                <div class="row">
                  <div class="col-md-6 mb-3">
                    <label for="name" class="form-label">Name *</label>
                    <input 
                      type="text" 
                      class="form-control" 
                      id="name"
                      v-model="newPatient.name"
                      required
                    >
                  </div>
                  <div class="col-md-6 mb-3">
                    <label for="email" class="form-label">Email</label>
                    <input 
                      type="email" 
                      class="form-control" 
                      id="email"
                      v-model="newPatient.email"
                    >
                  </div>
                </div>
                <div class="row">
                  <div class="col-md-6 mb-3">
                    <label for="phone" class="form-label">Phone</label>
                    <input 
                      type="tel" 
                      class="form-control" 
                      id="phone"
                      v-model="newPatient.phone"
                    >
                  </div>
                  <div class="col-md-6 mb-3">
                    <label for="dob" class="form-label">Date of Birth</label>
                    <input 
                      type="date" 
                      class="form-control" 
                      id="dob"
                      v-model="newPatient.date_of_birth"
                    >
                  </div>
                </div>
                <div class="row">
                  <div class="col-md-6 mb-3">
                    <label for="gender" class="form-label">Gender</label>
                    <select class="form-select" id="gender" v-model="newPatient.gender">
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div class="col-md-6 mb-3">
                    <label for="address" class="form-label">Address</label>
                    <input 
                      type="text" 
                      class="form-control" 
                      id="address"
                      v-model="newPatient.address"
                    >
                  </div>
                </div>
                <button 
                  type="submit" 
                  class="btn btn-primary"
                  :disabled="isSubmitting"
                >
                  <i class="bi bi-plus-circle me-2"></i>
                  {{ isSubmitting ? 'Adding Patient...' : 'Add Patient' }}
                </button>
              </form>
            </div>
          </div>

          <!-- Patients List -->
          <div class="card mt-4">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h5 class="mb-0">
                <i class="bi bi-people me-2"></i>
                Patients List
                <span class="badge bg-primary ms-2">{{ patients.length }}</span>
              </h5>
              <div>
                <button @click="loadPatients" class="btn btn-sm btn-outline-primary me-2">
                  <i class="bi bi-arrow-clockwise"></i>
                  Refresh
                </button>
                <button @click="clearAllPatients" class="btn btn-sm btn-outline-danger">
                  <i class="bi bi-trash"></i>
                  Clear All
                </button>
              </div>
            </div>
            <div class="card-body">
              <div v-if="patients.length === 0" class="text-center text-muted py-4">
                <i class="bi bi-inbox display-4"></i>
                <p class="mt-2">No patients found. Add one above to get started!</p>
              </div>
              
              <div v-else class="table-responsive">
                <table class="table table-striped">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Gender</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="patient in patients" :key="patient.id">
                      <td>
                        <strong>{{ patient.name }}</strong>
                        <small v-if="patient.offline_created" class="text-muted d-block">
                          <i class="bi bi-wifi-off me-1"></i>
                          Created offline
                        </small>
                      </td>
                      <td>{{ patient.email || 'N/A' }}</td>
                      <td>{{ patient.phone || 'N/A' }}</td>
                      <td>
                        <span v-if="patient.gender" class="badge bg-light text-dark">
                          {{ patient.gender }}
                        </span>
                      </td>
                      <td>
                        <span 
                          :class="getSyncStatusClass(patient)"
                          class="badge"
                        >
                          {{ getSyncStatusText(patient) }}
                        </span>
                      </td>
                      <td>
                        <button 
                          @click="editPatient(patient)" 
                          class="btn btn-sm btn-outline-primary me-1"
                        >
                          <i class="bi bi-pencil"></i>
                        </button>
                        <button 
                          @click="deletePatient(patient.id)" 
                          class="btn btn-sm btn-outline-danger"
                        >
                          <i class="bi bi-trash"></i>
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Demo Instructions -->
          <div class="alert alert-info mt-4">
            <h5 class="alert-heading">
              <i class="bi bi-info-circle me-2"></i>
              How to Test Offline Functionality:
            </h5>
            <ol class="mb-0">
              <li><strong>Add some patients</strong> while online (they'll sync automatically)</li>
              <li><strong>Go offline</strong>: DevTools → Network → Check "Offline"</li>
              <li><strong>Add more patients</strong> - they'll be saved locally!</li>
              <li><strong>Go back online</strong> and watch them sync automatically</li>
              <li><strong>Check the sync status</strong> in the top bar</li>
            </ol>
            <hr>
            <p class="mb-0">
              <strong>💡 Tip:</strong> All data is stored in your browser's IndexedDB and will persist 
              even if you close the browser. When you come back online, everything syncs automatically!
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import { offlineStorage } from '../services/offlineStorage.js'
import OfflineSyncStatus from './OfflineSyncStatus.vue'

export default {
  name: 'OfflineDemo',
  components: {
    OfflineSyncStatus
  },
  setup() {
    const patients = ref([])
    const isSubmitting = ref(false)
    const newPatient = reactive({
      name: '',
      email: '',
      phone: '',
      date_of_birth: '',
      gender: '',
      address: ''
    })

    // Load patients from offline storage
    const loadPatients = async () => {
      try {
        const patientData = await offlineStorage.read('patients')
        // Filter out deleted patients
        patients.value = patientData.filter(p => !p.deleted)
      } catch (error) {
        console.error('Failed to load patients:', error)
      }
    }

    // Add new patient
    const addPatient = async () => {
      if (!newPatient.name.trim()) return

      isSubmitting.value = true
      try {
        const patientData = {
          name: newPatient.name.trim(),
          email: newPatient.email.trim() || null,
          phone: newPatient.phone.trim() || null,
          date_of_birth: newPatient.date_of_birth || null,
          gender: newPatient.gender || null,
          address: newPatient.address.trim() || null
        }

        await offlineStorage.create('patients', patientData)
        
        // Reset form
        Object.keys(newPatient).forEach(key => {
          newPatient[key] = ''
        })
        
        // Reload patients list
        await loadPatients()
        
        // Show success message
        alert('✅ Patient added successfully!' + 
              (navigator.onLine ? ' (Will sync with server)' : ' (Saved offline - will sync when online)'))
        
      } catch (error) {
        console.error('Failed to add patient:', error)
        alert('❌ Failed to add patient. Please try again.')
      } finally {
        isSubmitting.value = false
      }
    }

    // Delete patient
    const deletePatient = async (id) => {
      if (!confirm('Are you sure you want to delete this patient?')) return

      try {
        await offlineStorage.delete('patients', id)
        await loadPatients()
        alert('✅ Patient deleted successfully!')
      } catch (error) {
        console.error('Failed to delete patient:', error)
        alert('❌ Failed to delete patient. Please try again.')
      }
    }

    // Edit patient (simplified for demo)
    const editPatient = (patient) => {
      const newName = prompt('Enter new name:', patient.name)
      if (newName && newName.trim() !== patient.name) {
        updatePatient(patient.id, { name: newName.trim() })
      }
    }

    // Update patient
    const updatePatient = async (id, updates) => {
      try {
        await offlineStorage.update('patients', id, updates)
        await loadPatients()
        alert('✅ Patient updated successfully!')
      } catch (error) {
        console.error('Failed to update patient:', error)
        alert('❌ Failed to update patient. Please try again.')
      }
    }

    // Clear all patients
    const clearAllPatients = async () => {
      if (!confirm('Are you sure you want to delete ALL patients? This cannot be undone.')) return

      try {
        for (const patient of patients.value) {
          await offlineStorage.delete('patients', patient.id)
        }
        await loadPatients()
        alert('✅ All patients cleared!')
      } catch (error) {
        console.error('Failed to clear patients:', error)
        alert('❌ Failed to clear patients. Please try again.')
      }
    }

    // Get sync status styling
    const getSyncStatusClass = (patient) => {
      if (patient.synced) return 'bg-success'
      if (patient.offline_created) return 'bg-warning'
      return 'bg-info'
    }

    const getSyncStatusText = (patient) => {
      if (patient.synced) return 'Synced'
      if (patient.offline_created) return 'Pending Sync'
      return 'Local'
    }

    onMounted(() => {
      loadPatients()
    })

    return {
      patients,
      isSubmitting,
      newPatient,
      loadPatients,
      addPatient,
      deletePatient,
      editPatient,
      clearAllPatients,
      getSyncStatusClass,
      getSyncStatusText
    }
  }
}
</script>

<style scoped>
.offline-demo-container {
  min-height: 100vh;
  background-color: #f8f9fa;
}

.card {
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  border: none;
}

.card-header {
  background-color: #fff;
  border-bottom: 1px solid #dee2e6;
}

.badge {
  font-size: 0.75rem;
}

.table th {
  border-top: none;
  font-weight: 600;
  color: #495057;
}

.alert-info {
  border-left: 4px solid #17a2b8;
}

@media (max-width: 768px) {
  .table-responsive {
    font-size: 0.875rem;
  }
  
  .btn-sm {
    padding: 0.25rem 0.5rem;
  }
}
</style>