<template>
  <HealthWorkerLayout>
    <AppPageHeader
      title="Patient Records"
      subtitle="Search and manage patient information"
      :breadcrumbs="breadcrumbs"
    >
      <template #actions>
        <AppButton
          variant="primary"
          :to="'/healthworker/patients/new'"
          icon="bi bi-plus-circle"
        >
          New Patient
        </AppButton>
      </template>
    </AppPageHeader>

    <!-- Search Section -->
    <AppCard class="hw-search-section mb-4">
      <AppSearchFilter
        v-model="searchQuery"
        :filters="filters"
        @search="handleSearch"
      >
        <template #actions>
          <AppButton
            variant="info"
            icon="bi bi-qr-code-scan"
            @click="openQrScanner"
          >
            Scan QR
          </AppButton>
        </template>
      </AppSearchFilter>
    </AppCard>

    <!-- Patient List -->
    <div class="row g-3">
      <div class="col-lg-6" v-for="patient in paginatedPatients" :key="patient.id">
        <AppCard class="hw-patient-card h-100">
          <div class="d-flex justify-content-between align-items-start mb-3">
            <div>
              <h5 class="card-title mb-1 fw-bold">
                {{ patient.name }}
                <span class="badge bg-info ms-2" v-if="patient.isChild">Child</span>
              </h5>
              <p class="text-muted mb-0">ID: {{ patient.id }}</p>
            </div>
            <span :class="getStatusBadgeClass(patient.status)">
              {{ patient.status }}
            </span>
          </div>
          
          <div class="row g-2 mb-3">
            <div class="col-6">
              <small class="text-muted">Age:</small>
              <div class="fw-semibold">{{ patient.age }} years</div>
            </div>
            <div class="col-6">
              <small class="text-muted">Parent:</small>
              <div class="fw-semibold">{{ patient.parent.name }}</div>
            </div>
          </div>

          <div class="row g-2 mb-3">
            <div class="col-6">
              <small class="text-muted">Parent Contact:</small>
              <div class="fw-semibold">{{ patient.parent.phone }}</div>
            </div>
            <div class="col-6">
              <small class="text-muted">Relation:</small>
              <div class="fw-semibold">{{ patient.parent.relation }}</div>
            </div>
          </div>

          <div class="mb-3">
            <small class="text-muted">Last Vaccine:</small>
            <div class="fw-semibold">{{ patient.lastVaccine || 'None' }}</div>
          </div>

          <div class="d-grid gap-2 d-md-flex">
            <AppButton
              variant="primary"
              :to="`/healthworker/patients/${patient.id}`"
              icon="bi bi-eye"
              class="flex-fill"
            >
              View Details
            </AppButton>
            <AppButton
              variant="success"
              :to="`/healthworker/administer?patient=${patient.id}`"
              icon="bi bi-file-medical"
              class="flex-fill btn-hw-primary"
            >
              Administer
            </AppButton>
          </div>
        </AppCard>
      </div>
    </div>

    <!-- Pagination -->
    <div class="mt-4 d-flex justify-content-center">
      <AppPagination
        :current-page="currentPage"
        :total-pages="totalPages"
        @page-change="changePage"
      />
    </div>

    <!-- Empty State -->
    <div v-if="filteredPatients.length === 0" class="text-center py-5">
      <i class="bi bi-person-x text-muted mb-3" style="font-size: 4rem;"></i>
      <h4 class="text-muted">No patients found</h4>
      <p class="text-muted">Try adjusting your search criteria or add a new patient.</p>
      <AppButton
        variant="primary"
        size="lg"
        :to="'/healthworker/patients/new'"
        icon="bi bi-plus-circle"
        class="btn-hw-primary"
      >
        Add New Patient
      </AppButton>
    </div>
  </HealthWorkerLayout>
</template>

<script setup>
import { ref, computed } from 'vue'
import HealthWorkerLayout from '@/components/layout/HealthWorkerLayout.vue'
import AppPageHeader from '@/components/common/AppPageHeader.vue'
import AppCard from '@/components/common/AppCard.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppSearchFilter from '@/components/common/AppSearchFilter.vue'
import AppPagination from '@/components/common/AppPagination.vue'
import usePagination from '@/composables/usePagination'

const searchQuery = ref('')
const filterStatus = ref('')

const openQrScanner = () => {
  // Placeholder for QR scanner logic
  alert('QR Code Scanner opened! (Implement modal or scanner component here)')
}

const breadcrumbs = [
  { text: 'Health Worker', href: '/healthworker/dashboard' },
  { text: 'Patient Records', active: true }
]

const filters = [
  { key: 'status', label: 'Status', type: 'select', options: [
    { value: '', text: 'All Patients' },
    { value: 'active', text: 'Active' },
    { value: 'completed', text: 'Completed' },
    { value: 'pending', text: 'Pending' }
  ]}
]

// Sample patient data
const patients = ref([
  {
    id: 'P-001',
    name: 'Ethan Cruz',
    age: 5,
    status: 'active',
    lastVaccine: 'COVID-19 (Aug 10, 2025)',
    isChild: true,
    parent: {
      name: 'Maria Cruz',
      phone: '+63 912 345 6789',
      relation: 'Mother'
    }
  },
  {
    id: 'P-002',
    name: 'Sofia Reyes',
    age: 3,
    status: 'pending',
    lastVaccine: 'Influenza (Jul 15, 2025)',
    isChild: true,
    parent: {
      name: 'Juan Reyes',
      phone: '+63 917 654 3210',
      relation: 'Father'
    }
  },
  {
    id: 'P-003',
    name: 'Carlos Santos',
    age: 7,
    status: 'completed',
    lastVaccine: 'COVID-19 Booster (Aug 5, 2025)',
    isChild: true,
    parent: {
      name: 'Elena Santos',
      phone: '+63 905 123 4567',
      relation: 'Mother'
    }
  },
  {
    id: 'P-004',
    name: 'Isabella Garcia',
    age: 2,
    status: 'active',
    lastVaccine: 'MMR (Aug 1, 2025)',
    isChild: true,
    parent: {
      name: 'Miguel Garcia',
      phone: '+63 927 890 1234',
      relation: 'Father'
    }
  }
])

const filteredPatients = computed(() => {
  let filtered = patients.value

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(patient => 
      patient.name.toLowerCase().includes(query) ||
      patient.id.toLowerCase().includes(query) ||
      (patient.parent && patient.parent.name.toLowerCase().includes(query)) ||
      (patient.parent && patient.parent.phone.includes(query))
    )
  }

  if (filterStatus.value) {
    filtered = filtered.filter(patient => patient.status === filterStatus.value)
  }

  return filtered
})

// Pagination using composable (pageSize = 6)
const { currentPage, pageSize, totalPages, paginatedItems, setPage } = usePagination(filteredPatients, 6)

const paginatedPatients = paginatedItems

function changePage(page) {
  setPage(page)
}

const getStatusBadgeClass = (status) => {
  const classes = {
    active: 'hw-status-available',
    pending: 'hw-status-low',
    completed: 'badge bg-secondary'
  }
  return classes[status] || 'badge bg-secondary'
}

const handleSearch = (query, filters) => {
  searchQuery.value = query
  filterStatus.value = filters.status || ''
  // Reset to first page when search or filters change
  setPage(1)
}
</script>
