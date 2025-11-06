<template>
  <AdminLayout>
    <div class="container-fluid">
      <ToastContainer />
      <!-- Breadcrumb -->
      <nav
        aria-label="breadcrumb"
        class="mb-3"
      >
        <ol class="breadcrumb">
          <li class="breadcrumb-item">
            <router-link to="/admin/dashboard">
              Admin
            </router-link>
          </li>
          <li
            class="breadcrumb-item active"
            aria-current="page"
          >
            Patient Records
          </li>
        </ol>
      </nav>

      <!-- Header -->
      <div class="mb-4">
        <h2 class="mb-1">
          <i class="bi bi-people me-2" />Patient Records Management
        </h2>
        <p class="text-muted mb-0">
          Manage patient information and vaccination history
        </p>
      </div>

      <!-- Loading State -->
      <div
        v-if="loading"
        class="text-center py-5"
      >
        <div
          class="spinner-border text-primary"
          role="status"
        >
          <span class="visually-hidden">Loading patients...</span>
        </div>
        <p class="text-muted mt-2">
          Loading patient information...
        </p>
      </div>

      <!-- Patient Management with Tabs -->
      <div
        v-if="!loading"
        class="row"
      >
        <!-- Main Content -->
        <div class="col-lg-12 mb-4">
          <div class="card shadow">
            <div class="card-header py-3 bg-white">
              <!-- Tabs Navigation -->
              <ul class="nav nav-tabs card-header-tabs">
                <li class="nav-item">
                  <button 
                    class="nav-link active"
                  >
                    <i class="bi bi-people me-2" />Patient List
                  </button>
                </li>
              </ul>
            </div>
            <div class="card-body p-4">
              <!-- Patient List Section -->
              <div>
                <!-- Header Section -->
                <div class="mb-3">
                  <h5 class="mb-0">
                    <i class="bi bi-list-ul me-2" />All Patients
                  </h5>
                </div>

                <!-- Search and Filter Section -->
                <div class="d-flex justify-content-between align-items-center mb-3 gap-3">
                  <div class="d-flex gap-2 align-items-center flex-grow-1">
                    <!-- Search Bar -->
                    <div
                      class="input-group"
                      style="max-width: 300px;"
                    >
                      <input 
                        v-model="searchQuery" 
                        type="text" 
                        class="form-control form-control-sm" 
                        placeholder="Search patients..."
                        @input="debouncedSearch"
                      >
                      <button
                        class="btn btn-sm btn-outline-primary"
                        type="button"
                      >
                        <i class="bi bi-search" />
                      </button>
                    </div>
                    
                    <!-- Status Filter -->
                    <select
                      v-model="selectedStatus"
                      class="form-select form-select-sm"
                      style="max-width: 150px;"
                      :disabled="showDeleted"
                      @change="applyFilters"
                    >
                      <option value="">
                        All Status
                      </option>
                      <option value="active">
                        Active
                      </option>
                      <option value="inactive">
                        Inactive
                      </option>
                      <option value="due">
                        Vaccination Due
                      </option>
                      <option value="completed">
                        Up to Date
                      </option>
                      <option value="fic">
                        FIC
                      </option>
                      <option value="cic">
                        CIC
                      </option>
                      <option value="defaulter">
                        Defaulter
                      </option>
                    </select>
                    
                    <!-- Gender Filter -->
                    <select
                      v-model="selectedGender"
                      class="form-select form-select-sm"
                      style="max-width: 120px;"
                      @change="applyFilters"
                    >
                      <option value="">
                        All Gender
                      </option>
                      <option value="male">
                        Male
                      </option>
                      <option value="female">
                        Female
                      </option>
                    </select>
                  </div>

                  <!-- Action Buttons -->
                  <div class="d-flex gap-2 align-items-center">
                    <div class="form-check form-switch me-2">
                      <input
                        id="toggleDeleted"
                        v-model="showDeleted"
                        class="form-check-input"
                        type="checkbox"
                        @change="applyFilters"
                      >
                      <label
                        class="form-check-label"
                        for="toggleDeleted"
                      >Show Deleted</label>
                    </div>
                    <button
                      class="btn btn-sm btn-outline-primary"
                      @click="resetFilters"
                    >
                      <i class="bi bi-arrow-clockwise me-1" />Reset
                    </button>
                    <router-link
                      to="/admin/patients/add-record"
                      class="btn btn-sm btn-outline-success"
                    >
                      <i class="bi bi-file-medical me-1" />Add Vaccination Record
                    </router-link>
                    <router-link
                      to="/admin/patients/add"
                      class="btn btn-sm btn-primary"
                    >
                      <i class="bi bi-plus-circle me-1" />Add Patient
                    </router-link>
                  </div>
                </div>

                <!-- Patient Table -->
                <div class="table-responsive">
                  <table class="table table-hover table-bordered">
                    <thead class="table-light">
                      <tr>
                        <th class="text-center">
                          Patient ID
                        </th>
                        <th class="text-center">
                          Child Name
                        </th>
                        <th class="text-center">
                          Sex
                        </th>
                        <th class="text-center">
                          Birth Date
                        </th>
                        <th class="text-center">
                          Age
                        </th>
                        <th class="text-center">
                          Guardian
                        </th>
                        <th class="text-center">
                          Contact
                        </th>
                        <th class="text-center">
                          Last Vaccination
                        </th>
                        <th class="text-center">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="patient in sortedPatients"
                        :key="patient.id"
                        :class="{ 'table-secondary': patient.status === 'inactive' }"
                      >
                        <td class="text-center align-middle fw-semibold text-primary">
                          {{ patient.id }}
                        </td>
                        <td class="text-center align-middle fw-semibold">
                          {{ patient.childInfo.name }}
                          <span
                            v-if="patient.status === 'inactive'"
                            class="badge rounded-pill text-bg-secondary ms-2"
                          >Inactive</span>
                          <span
                            v-else-if="patient.status === 'archived'"
                            class="badge rounded-pill text-bg-danger ms-2"
                          >Archived</span>
                        </td>
                        <td class="text-center align-middle">
                          {{ patient.childInfo.sex }}
                        </td>
                        <td class="text-center align-middle">
                          {{ formatDate(patient.childInfo.birthDate) }}
                        </td>
                        <td class="text-center align-middle">
                          {{ calculateAge(patient.childInfo.birthDate) }}
                        </td>
                        <td class="text-center align-middle">
                          {{ patient.motherInfo.name }}
                        </td>
                        <td class="text-center align-middle">
                          <span v-if="patient.guardian_contact_number || patient.childInfo.phoneNumber">
                            <i class="bi bi-telephone me-1" />{{ patient.guardian_contact_number || patient.childInfo.phoneNumber }}
                          </span>
                          <span
                            v-else
                            class="text-muted"
                          >—</span>
                        </td>
                        <td class="text-center align-middle">
                          <span
                            v-if="patient.lastVaccination"
                            class="text-muted"
                          >
                            {{ formatDate(patient.lastVaccination) }}
                          </span>
                          <span
                            v-else
                            class="text-warning"
                          >No records</span>
                        </td>
                        <td class="text-center align-middle">
                          <div class="d-flex gap-2 justify-content-center">
                            <router-link 
                              :to="`/admin/patients/view/${patient.id}`"
                              class="btn btn-sm btn-outline-primary"
                              title="View Details"
                            >
                              <i class="bi bi-eye me-1" />View
                            </router-link>
                            <button
                              v-if="patient.status === 'archived'"
                              class="btn btn-sm btn-outline-success"
                              title="Restore Patient"
                              @click="restorePatient(patient)"
                            >
                              <i class="bi bi-arrow-counterclockwise me-1" />Restore
                            </button>
                            <template v-else>
                              <button 
                                v-if="patient.status !== 'inactive'" 
                                class="btn btn-sm btn-outline-warning"
                                title="Deactivate"
                                @click="setPatientStatus(patient, 'inactive')"
                              >
                                <i class="bi bi-slash-circle me-1" />Deactivate
                              </button>
                              <button 
                                v-else 
                                class="btn btn-sm btn-outline-success"
                                title="Activate"
                                @click="setPatientStatus(patient, 'active')"
                              >
                                <i class="bi bi-check-circle me-1" />Activate
                              </button>
                              <button 
                                class="btn btn-sm btn-outline-danger" 
                                title="Delete Patient"
                                @click="deletePatient(patient)"
                              >
                                <i class="bi bi-trash me-1" />Delete
                              </button>
                            </template>
                          </div>
                        </td>
                      </tr>
                      <tr v-if="sortedPatients.length === 0">
                        <td
                          colspan="9"
                          class="text-center text-muted py-4"
                        >
                          <i
                            class="bi bi-inbox"
                            style="font-size: 2rem;"
                          />
                          <p class="mb-0 mt-2">
                            No patients found
                          </p>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <!-- Pagination Footer -->
                <div
                  v-if="sortedPatients.length > 0"
                  class="pagination-footer border-top mt-3 pt-3"
                >
                  <AppPagination
                    :current-page="currentPage"
                    :total-pages="totalPages"
                    :total-items="totalItems"
                    :items-per-page="itemsPerPage"
                    @page-changed="changePage"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Navigation: View patient and Add record actions now open pages -->

      <!-- Page-only flow: no modals -->
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import AdminLayout from '@/components/layout/desktop/AdminLayout.vue'
import AppPagination from '@/components/ui/base/AppPagination.vue'
import api from '@/services/api'
import ToastContainer from '@/components/ui/feedback/ToastContainer.vue'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'

const { addToast } = useToast()
const { confirm } = useConfirm()

// Reactive data
const loading = ref(true)
const patients = ref([])
const searchQuery = ref('')
const selectedStatus = ref('')
const selectedGender = ref('')
const showDeleted = ref(false)
const currentPage = ref(1)
const itemsPerPage = ref(5) // Set to 5 items per page as requested
const totalItems = ref(0)
const totalPages = ref(0)

// Methods
const fetchPatients = async () => {
  try {
    loading.value = true
    const params = {
      page: currentPage.value,
      limit: itemsPerPage.value
    }
    
    if (searchQuery.value) params.search = searchQuery.value
    // Apply status filters
    if (showDeleted.value) {
      params.status = 'archived'
    } else if (selectedStatus.value) {
      params.status = selectedStatus.value
    } else {
      params.status = 'not_archived'
    }
    if (selectedGender.value) {
      // Send both gender and sex to handle API variants
      params.gender = selectedGender.value
      params.sex = selectedGender.value
    }

    const response = await api.get('/patients', { params })
    const payload = response.data?.data || {}
    const list = payload.patients || payload.items || payload || []

    patients.value = list.map(p => ({
      id: p.patient_id || p.id,
      childInfo: {
        name: [p.firstname, p.middlename, p.surname].filter(Boolean).join(' ').trim(),
        sex: p.sex || p.gender || '',
        birthDate: p.date_of_birth || p.birth_date || '',
        phoneNumber: p.contact_number || '',
        address: {
          street: p.address || '',
          barangay: p.barangay || '',
          municipality: p.municipality || '',
          province: p.province || '',
          zipCode: p.zip_code || ''
        }
      },
      motherInfo: {
        name: p.mother_name || '',
      },
      guardian_contact_number: p.guardian_contact_number || p.guardian?.contact_number || '',
      family_number: p.guardian_family_number || p.family_number || '',
      lastVaccination: p.last_vaccination_date || null,
      status: (p.status || (p.is_deleted ? 'archived' : 'active')).toLowerCase()
    }))

  // Prefer server-provided totalCount/totalPages. Only fallback to local count as last resort.
  const totalCount = (payload && (payload.totalCount ?? response.data?.total)) ?? patients.value.length
  totalItems.value = Number(totalCount)
  totalPages.value = Math.ceil((Number(totalCount) || 0) / Number(itemsPerPage.value))

  } catch (error) {
    console.error('Error fetching patients:', error)
    patients.value = []
    totalItems.value = 0
    totalPages.value = 0
  } finally {
    loading.value = false
  }
}

const calculateAge = (birthDate) => {
  if (!birthDate) return '—'
  const birth = new Date(birthDate)
  if (isNaN(birth.getTime())) return '—'
  const today = new Date()
  let months = (today.getFullYear() - birth.getFullYear()) * 12 + (today.getMonth() - birth.getMonth())
  let days = today.getDate() - birth.getDate()
  if (days < 0) {
    months -= 1
    const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0)
    days += prevMonth.getDate()
  }
  if (months < 0) months = 0
  if (days < 0) days = 0
  // Show years if 36 months or more
  if (months >= 36) {
    const years = Math.floor(months / 12)
    const remMonths = months % 12
    return remMonths > 0 ? `${years}y ${remMonths}m` : `${years}y`
  }
  return `${months}m ${days}d`
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  try {
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: 'Asia/Manila'
    })
  } catch {
    return new Date(dateString).toLocaleDateString()
  }
}

const changePage = (page) => {
  if (page >= 1 && page <= totalPages.value && page !== currentPage.value) {
    currentPage.value = page
    fetchPatients()
  }
}

const applyFilters = () => {
  currentPage.value = 1
  fetchPatients()
}

const resetFilters = () => {
  searchQuery.value = ''
  selectedStatus.value = ''
  selectedGender.value = ''
  currentPage.value = 1
  fetchPatients()
}

// Debounced search
let searchTimeout
const debouncedSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    currentPage.value = 1
    fetchPatients()
  }, 500)
}

const deletePatient = async (patient) => {
  const patientName = patient.childInfo?.name || 'this patient'
  
  try {
    await confirm({
      title: 'Delete Patient Record',
      message: `Are you sure you want to delete the patient record for "${patientName}"?\n\nThis action cannot be undone and will permanently remove all vaccination history and related data.`,
      variant: 'danger',
      confirmText: 'Delete Patient',
      cancelText: 'Cancel'
    })
    
    try {
      const response = await api.delete(`/patients/${patient.id}`)
      
      if (response.data.success) {
        // Show success toast
        addToast({ title: 'Deleted', message: `Patient record for "${patientName}" has been successfully deleted.`, type: 'success' })

        // Refresh the patient list
        await fetchPatients()
        
        // If we're on the last page and it's now empty, go to previous page
        if (patients.value.length === 0 && currentPage.value > 1) {
          currentPage.value = currentPage.value - 1
          await fetchPatients()
        }
      } else {
        throw new Error(response.data.message || 'Failed to delete patient')
      }
    } catch (error) {
      console.error('Error deleting patient:', error)
      const errorMessage = error.response?.data?.message || error.message || 'An error occurred while deleting the patient'
      addToast({ title: 'Error', message: `Failed to delete patient: ${errorMessage}`, type: 'error' })
    }
  } catch {
    // User cancelled
  }
}

const restorePatient = async (patient) => {
  const name = patient.childInfo?.name || 'this patient'
  try {
    await confirm({
      title: 'Restore Patient Record',
      message: `Are you sure you want to restore the patient record for "${name}"?\n\nThis will also restore related schedules and re-enable reminders.`,
      variant: 'primary',
      confirmText: 'Restore',
      cancelText: 'Cancel'
    })

    await api.post(`/patients/${patient.id}/restore`)
    addToast({ title: 'Restored', message: `Patient "${name}" has been restored.`, type: 'success' })
    await fetchPatients()
  } catch (error) {
    console.error('Error restoring patient:', error)
    const errorMessage = error.response?.data?.message || error.message || 'Failed to restore patient'
    addToast({ title: 'Error', message: errorMessage, type: 'error' })
  }
}

const setPatientStatus = async (patient, newStatus) => {
  // Confirm first; if cancelled, exit silently
  try {
    if (newStatus === 'inactive') {
      await confirm({
        title: 'Deactivate Patient',
        message: `This will pause reminders and soft-delete pending schedules for "${patient.childInfo?.name || patient.id}". Continue?`,
        variant: 'warning',
        confirmText: 'Deactivate',
        cancelText: 'Cancel'
      })
    } else {
      await confirm({
        title: 'Set Patient Active',
        message: `This will restore schedules and resume reminders for "${patient.childInfo?.name || patient.id}". Continue?`,
        variant: 'primary',
        confirmText: 'Set Active',
        cancelText: 'Cancel'
      })
    }
  } catch {
    return
  }

  try {
    await api.put(`/patients/${patient.id}`, { status: newStatus })
    const verb = newStatus === 'inactive' ? 'set to Inactive (cascade applied)' : 'set to Active (restored)'
    addToast({ title: 'Updated', message: `Patient "${patient.childInfo?.name || patient.id}" ${verb}.`, type: 'success' })
    await fetchPatients()
  } catch (error) {
    console.error('Error updating patient status:', error)
    const errorMessage = error.response?.data?.message || error.message || 'Failed to update status'
    addToast({ title: 'Error', message: errorMessage, type: 'error' })
  }
}

// Lifecycle
onMounted(() => {
  fetchPatients()
})

// Active first, then inactive; archived handled via Show Deleted toggle
const sortedPatients = computed(() => {
  const arr = [...patients.value]
  return arr.sort((a, b) => {
    const ra = a.status === 'inactive' ? 1 : 0
    const rb = b.status === 'inactive' ? 1 : 0
    if (ra !== rb) return ra - rb
    const ida = Number(a.id) || 0
    const idb = Number(b.id) || 0
    return ida - idb
  })
})
</script>

<style scoped>
/* Breadcrumb Styling */
.breadcrumb {
  background-color: transparent;
  padding: 0;
  margin: 0;
}

.breadcrumb-item + .breadcrumb-item::before {
  content: "›";
  color: #6c757d;
}

.breadcrumb-item a {
  color: #4e73df;
  text-decoration: none;
}

.breadcrumb-item a:hover {
  text-decoration: underline;
}

.breadcrumb-item.active {
  color: #6c757d;
}

/* Tabs Styling */
.nav-tabs {
  border-bottom: none;
}

.nav-tabs .nav-link {
  color: #6c757d;
  border: none;
  border-bottom: 3px solid transparent;
  padding: 0.75rem 1rem;
  transition: all 0.3s ease;
  background-color: transparent;
}

.nav-tabs .nav-link:hover {
  color: #0d6efd;
  border-bottom-color: #dee2e6;
  background-color: transparent;
}

.nav-tabs .nav-link.active {
  color: #0d6efd;
  background-color: transparent;
  border-bottom: 3px solid #0d6efd;
  font-weight: 600;
}

.card-header-tabs {
  margin-bottom: -0.75rem;
}

.card-header {
  background-color: white !important;
  border-bottom: 1px solid #dee2e6;
}

/* Table Styling */
.table {
  margin-bottom: 0;
}

.table th {
  font-weight: 600;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Pagination Footer */
.pagination-footer {
  padding: 1rem 0;
  background-color: transparent;
  border-top: 1px solid #dee2e6;
  display: flex;
  justify-content: center;
}

/* Shadow */
.shadow {
  box-shadow: 0 0.15rem 1.75rem 0 rgba(58, 59, 69, 0.15) !important;
}

.text-gray-800 {
  color: #5a5c69 !important;
}
</style>
