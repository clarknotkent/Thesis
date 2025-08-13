<template>
  <AdminLayout>
    <div class="container-fluid p-4">
      <AppPageHeader 
        title="Patient Records" 
        subtitle="Manage patient information and vaccination history"
      >
        <template #actions>
          <AppButton variant="primary" icon="bi-plus-circle" @click="showAddModal = true">
            Add New Patient
          </AppButton>
        </template>
      </AppPageHeader>

      <!-- Search & Filter -->
      <AppCard>
        <AppSearchFilter 
          v-model:search-query="searchQuery"
          search-placeholder="Search patients..."
          :filters="filterOptions"
          @filter-change="handleFilterChange"
          @apply-filters="applyFilters"
        />
      </AppCard>

      <!-- Patient List -->
      <AppTable 
        title="Patient List"
        :columns="tableColumns"
        :data="paginatedPatients"
        :actions="tableActions"
        :header-actions="headerActions"
        :pagination="paginationData"
        @row-action="handleRowAction"
        @header-action="handleHeaderAction"
        @page-change="changePage"
      />

      <!-- Add Modal -->
      <AppFormModal 
        :show="showAddModal"
        title="Add New Patient"
        :fields="patientFields"
        submit-text="Add Patient"
        @close="showAddModal = false"
        @submit="addPatient"
      />

      <!-- Edit Modal -->
      <AppFormModal 
        :show="showEditModal"
        title="Edit Patient"
        :fields="patientFields"
        :initial-data="selectedPatient"
        submit-text="Update Patient"
        @close="showEditModal = false"
        @submit="updatePatient"
      />

      <!-- View Modal -->
      <AppModal :show="showViewModal" title="Patient Details" @close="showViewModal = false">
        <div class="row">
          <div class="col-md-6">
            <p><strong>ID:</strong> {{ selectedPatient?.id }}</p>
            <p><strong>Name:</strong> {{ selectedPatient?.name }}</p>
            <p><strong>Parent:</strong> {{ selectedPatient?.parent }}</p>
            <p><strong>Contact:</strong> {{ selectedPatient?.contact }}</p>
          </div>
          <div class="col-md-6">
            <p><strong>Last Visit:</strong> {{ selectedPatient?.lastVisit }}</p>
            <p><strong>Next Vaccination:</strong> {{ selectedPatient?.nextVaccination }}</p>
            <p><strong>Age:</strong> {{ selectedPatient?.age }}</p>
            <p><strong>Gender:</strong> {{ selectedPatient?.gender }}</p>
          </div>
        </div>
      </AppModal>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, computed } from 'vue'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import AppPageHeader from '@/components/common/AppPageHeader.vue'
import AppCard from '@/components/common/AppCard.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppSearchFilter from '@/components/common/AppSearchFilter.vue'
import AppTable from '@/components/common/AppTable.vue'
import AppFormModal from '@/components/common/AppFormModal.vue'
import AppModal from '@/components/common/AppModal.vue'

const patients = ref([
  { id: 'P-0001', name: 'John Doe Jr.', parent: 'John Doe Sr.', age: '2 years', gender: 'Male', contact: '+63 912 345 6789', lastVisit: '2025-08-08', nextVaccination: '2025-10-11' },
  { id: 'P-0002', name: 'Jane Smith', parent: 'Mary Smith', age: '5 years', gender: 'Female', contact: '+63 923 456 7891', lastVisit: '2025-08-05', nextVaccination: '2025-09-15' },
  { id: 'P-0003', name: 'Carlos Reyes', parent: 'Ana Reyes', age: '3 years', gender: 'Male', contact: '+63 911 222 3333', lastVisit: '2025-07-20', nextVaccination: '2025-09-20' },
  { id: 'P-0004', name: 'Maria Santos', parent: 'Jose Santos', age: '4 years', gender: 'Female', contact: '+63 922 444 5555', lastVisit: '2025-08-01', nextVaccination: '2025-09-30' },
  { id: 'P-0005', name: 'Liza Tan', parent: 'Linda Tan', age: '1 year', gender: 'Female', contact: '+63 933 666 7777', lastVisit: '2025-08-10', nextVaccination: '2025-10-10' },
  { id: 'P-0006', name: 'Miguel Cruz', parent: 'Marco Cruz', age: '6 years', gender: 'Male', contact: '+63 944 888 9999', lastVisit: '2025-07-15', nextVaccination: '2025-09-15' }
])

const currentPage = ref(1)
const pageSize = 5
const searchQuery = ref('')

const totalPages = computed(() => Math.ceil(patients.value.length / pageSize))
const paginatedPatients = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return patients.value.slice(start, start + pageSize)
})

const paginationData = computed(() => ({
  currentPage: currentPage.value,
  totalPages: totalPages.value
}))

function changePage(page) {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
}

const showAddModal = ref(false)
const showEditModal = ref(false)
const showViewModal = ref(false)
const selectedPatient = ref({})

// Table configuration
const tableColumns = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Name' },
  { key: 'parent', label: 'Parent' },
  { key: 'contact', label: 'Contact Number' },
  { key: 'lastVisit', label: 'Last Visit' },
  { key: 'nextVaccination', label: 'Next Vaccination' }
]

const tableActions = [
  { key: 'view', label: '', icon: 'bi-eye', variant: 'outline-primary' },
  { key: 'edit', label: '', icon: 'bi-pencil', variant: 'outline-primary' },
  { key: 'delete', label: '', icon: 'bi-trash', variant: 'outline-danger' }
]

const headerActions = [
  { key: 'download', icon: 'bi-download', variant: 'outline-primary' },
  { key: 'print', icon: 'bi-printer', variant: 'outline-primary' },
  { key: 'settings', icon: 'bi-sliders', variant: 'outline-primary' }
]

// Form fields configuration
const patientFields = [
  { key: 'name', label: 'Name', type: 'text', required: true },
  { key: 'parent', label: 'Parent', type: 'text', required: true },
  { key: 'age', label: 'Age', type: 'text', required: true },
  { 
    key: 'gender', 
    label: 'Gender', 
    type: 'select', 
    required: true,
    options: [
      { value: 'Male', label: 'Male' },
      { value: 'Female', label: 'Female' }
    ]
  },
  { key: 'contact', label: 'Contact Number', type: 'tel', required: true },
  { key: 'lastVisit', label: 'Last Visit', type: 'date', required: true },
  { key: 'nextVaccination', label: 'Next Vaccination', type: 'date', required: true }
]

// Filter configuration
const filterOptions = [
  {
    key: 'status',
    value: 'all',
    options: [
      { value: 'all', label: 'All Patients' },
      { value: 'recent', label: 'Recently Added' },
      { value: 'due', label: 'Vaccination Due' },
      { value: 'incomplete', label: 'Incomplete Records' }
    ]
  },
  {
    key: 'location',
    value: 'all',
    options: [
      { value: 'all', label: 'All Locations' },
      { value: 'urban', label: 'Urban' },
      { value: 'rural', label: 'Rural' },
      { value: 'suburban', label: 'Suburban' }
    ]
  }
]

// Event handlers
function handleRowAction(action, patient) {
  switch (action) {
    case 'view':
      selectedPatient.value = patient
      showViewModal.value = true
      break
    case 'edit':
      selectedPatient.value = patient
      showEditModal.value = true
      break
    case 'delete':
      deletePatient(patient.id)
      break
  }
}

function handleHeaderAction(action) {
  console.log('Header action:', action)
  // Implement header actions (download, print, settings)
}

function handleFilterChange(key, value) {
  console.log('Filter change:', key, value)
  // Implement filter logic
}

function applyFilters() {
  console.log('Apply filters')
  // Implement filter application
}

function addPatient(formData) {
  const newId = `P-${(patients.value.length + 1).toString().padStart(4, '0')}`
  patients.value.push({ id: newId, ...formData })
  showAddModal.value = false
  currentPage.value = totalPages.value
}

function updatePatient(formData) {
  const idx = patients.value.findIndex(p => p.id === formData.id)
  if (idx !== -1) patients.value[idx] = { ...formData }
  showEditModal.value = false
}

function deletePatient(id) {
  if (confirm('Are you sure you want to delete this patient?')) {
    patients.value = patients.value.filter(p => p.id !== id)
    if ((currentPage.value - 1) * pageSize >= patients.value.length) {
      currentPage.value = Math.max(1, currentPage.value - 1)
    }
  }
}
</script>
