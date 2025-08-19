<template>
  <HealthWorkerLayout>
    <AppPageHeader
      title="Vaccine Inventory"
      subtitle="Check available vaccine stock (Read Only)"
      :breadcrumbs="breadcrumbs"
    >
      <template #actions>
        <div class="text-end">
          <small class="d-block text-muted">Last Updated</small>
          <strong>Aug 19, 2025 2:30 PM</strong>
        </div>
      </template>
    </AppPageHeader>

    <!-- Quick Stock Status -->
    <div class="row g-3 mb-4">
      <div class="col-md-4">
        <AppCard class="hw-stat-card bg-success text-white h-100">
          <div class="text-center">
            <i class="bi bi-check-circle-fill hw-stat-icon"></i>
            <h5>Available</h5>
            <h2 class="fw-bold">8 Types</h2>
          </div>
        </AppCard>
      </div>
      <div class="col-md-4">
        <AppCard class="hw-stat-card bg-warning text-white h-100">
          <div class="text-center">
            <i class="bi bi-exclamation-triangle-fill hw-stat-icon"></i>
            <h5>Low Stock</h5>
            <h2 class="fw-bold">2 Types</h2>
          </div>
        </AppCard>
      </div>
      <div class="col-md-4">
        <AppCard class="hw-stat-card bg-danger text-white h-100">
          <div class="text-center">
            <i class="bi bi-x-circle-fill hw-stat-icon"></i>
            <h5>Out of Stock</h5>
            <h2 class="fw-bold">1 Type</h2>
          </div>
        </AppCard>
      </div>
    </div>

    <!-- Search and Filter -->
    <AppCard class="hw-search-section mb-4">
      <AppSearchFilter
        v-model="searchQuery"
        :filters="filters"
        placeholder="Search vaccines..."
        @search="handleSearch"
      />
    </AppCard>

    <!-- Vaccine Cards -->
    <div class="row g-3">
      <div class="col-lg-6 col-xl-4" v-for="vaccine in filteredVaccines" :key="vaccine.id">
        <AppCard class="hw-vaccine-card h-100">
          <template #header>
            <div class="d-flex justify-content-between align-items-center">
              <h6 class="mb-0 fw-bold">{{ vaccine.name }}</h6>
              <span :class="getStatusBadgeClass(vaccine.status)">
                {{ getStatusText(vaccine.status) }}
              </span>
            </div>
          </template>
          <div class="hw-vaccine-info mb-3">
            <div class="row g-2">
              <div class="col-12">
                <small class="text-muted">Manufacturer:</small>
                <div class="fw-semibold">{{ vaccine.manufacturer }}</div>
              </div>
              <div class="col-6">
                <small class="text-muted">Batch No:</small>
                <div>{{ vaccine.batchNumber }}</div>
              </div>
              <div class="col-6">
                <small class="text-muted">Expiry:</small>
                <div>{{ vaccine.expiryDate }}</div>
              </div>
            </div>
          </div>

          <!-- Stock Level Visual -->
          <div class="mb-3">
            <div class="d-flex justify-content-between mb-1">
              <small class="text-muted">Stock Level</small>
              <small class="fw-semibold">{{ vaccine.quantity }} doses</small>
            </div>
            <div class="hw-progress">
              <div 
                class="hw-progress-bar"
                :class="getProgressBarClass(vaccine.status)"
                :style="{ width: getProgressWidth(vaccine.quantity, vaccine.maxQuantity) + '%' }"
              ></div>
            </div>
          </div>

          <!-- Availability for Today -->
          <div class="hw-availability-check">
            <div class="d-flex justify-content-between align-items-center">
              <span class="text-muted">Available for administration:</span>
              <span class="fw-bold" :class="vaccine.quantity > 0 ? 'text-success' : 'text-danger'">
                <i :class="vaccine.quantity > 0 ? 'bi bi-check-circle-fill' : 'bi bi-x-circle-fill'"></i>
                {{ vaccine.quantity > 0 ? 'YES' : 'NO' }}
              </span>
            </div>
          </div>
        </AppCard>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="filteredVaccines.length === 0" class="text-center py-5">
      <i class="bi bi-box text-muted mb-3" style="font-size: 4rem;"></i>
      <h4 class="text-muted">No vaccines found</h4>
      <p class="text-muted">Try adjusting your search criteria.</p>
    </div>

    <!-- Info Notice -->
    <div class="alert alert-info mt-4">
      <i class="bi bi-info-circle me-2"></i>
      <strong>Note:</strong> This is a read-only view. For stock updates or procurement, please contact the administrator.
    </div>
  </HealthWorkerLayout>
</template>

<script setup>
import { ref, computed } from 'vue'
import HealthWorkerLayout from '@/components/layout/HealthWorkerLayout.vue'
import AppPageHeader from '@/components/common/AppPageHeader.vue'
import AppCard from '@/components/common/AppCard.vue'
import AppSearchFilter from '@/components/common/AppSearchFilter.vue'

const searchQuery = ref('')
const statusFilter = ref('')

const breadcrumbs = [
  { text: 'Health Worker', href: '/healthworker/dashboard' },
  { text: 'Vaccine Inventory', active: true }
]

const filters = [
  { key: 'status', label: 'Status', type: 'select', options: [
    { value: '', text: 'All Status' },
    { value: 'available', text: 'Available' },
    { value: 'low', text: 'Low Stock' },
    { value: 'out', text: 'Out of Stock' }
  ]}
]

// Sample vaccine data
const vaccines = ref([
  {
    id: 'V-001',
    name: 'COVID-19',
    manufacturer: 'Pfizer',
    batchNumber: 'PF20250123',
    expiryDate: 'Dec 31, 2025',
    quantity: 50,
    maxQuantity: 200,
    status: 'low'
  },
  {
    id: 'V-002',
    name: 'Influenza',
    manufacturer: 'Sanofi',
    batchNumber: 'SF20250987',
    expiryDate: 'Sep 15, 2025',
    quantity: 320,
    maxQuantity: 400,
    status: 'available'
  },
  {
    id: 'V-003',
    name: 'Measles-Mumps-Rubella',
    manufacturer: 'Merck',
    batchNumber: 'MK20250456',
    expiryDate: 'Aug 30, 2025',
    quantity: 0,
    maxQuantity: 150,
    status: 'out'
  },
  {
    id: 'V-004',
    name: 'Hepatitis B',
    manufacturer: 'GSK',
    batchNumber: 'GSK20250789',
    expiryDate: 'Nov 20, 2025',
    quantity: 180,
    maxQuantity: 200,
    status: 'available'
  },
  {
    id: 'V-005',
    name: 'Tetanus',
    manufacturer: 'Sanofi',
    batchNumber: 'SF20250456',
    expiryDate: 'Oct 10, 2025',
    quantity: 25,
    maxQuantity: 100,
    status: 'low'
  }
])

const filteredVaccines = computed(() => {
  let filtered = vaccines.value

  // Filter by search query
  if (searchQuery.value) {
    filtered = filtered.filter(vaccine => 
      vaccine.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      vaccine.manufacturer.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  }

  // Filter by status
  if (statusFilter.value) {
    filtered = filtered.filter(vaccine => vaccine.status === statusFilter.value)
  }

  return filtered
})

const getStatusBadgeClass = (status) => {
  const classes = {
    available: 'hw-status-available',
    low: 'hw-status-low',
    out: 'hw-status-out'
  }
  return classes[status] || 'badge bg-secondary'
}

const getStatusText = (status) => {
  const texts = {
    available: 'Available',
    low: 'Low Stock',
    out: 'Out of Stock'
  }
  return texts[status] || 'Unknown'
}

const getProgressBarClass = (status) => {
  const classes = {
    available: 'hw-progress-available',
    low: 'hw-progress-low',
    out: 'hw-progress-out'
  }
  return classes[status] || 'bg-secondary'
}

const getProgressWidth = (quantity, maxQuantity) => {
  if (maxQuantity === 0) return 0
  return Math.min((quantity / maxQuantity) * 100, 100)
}

const handleSearch = (query, filters) => {
  searchQuery.value = query
  statusFilter.value = filters.status || ''
}
</script>
