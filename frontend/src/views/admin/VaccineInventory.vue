<template>
  <AdminLayout>
    <div class="container-fluid p-4">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 class="h3 mb-0 text-gray-800">Vaccine Inventory</h1>
          <p class="text-muted mb-0">Manage and track vaccine stock levels</p>
        </div>
        <button class="btn btn-primary" @click="showAddModal = true">
          <i class="bi bi-plus-circle me-2"></i>Add New Stock
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>

      <!-- Inventory Summary -->
      <div v-if="!loading" class="row g-3 mb-4">
        <div class="col-md-3">
          <div class="card border-start border-primary border-4 shadow h-100 py-2">
            <div class="card-body">
              <div class="row no-gutters align-items-center">
                <div class="col me-2">
                  <div class="text-xs fw-bold text-primary text-uppercase mb-1">
                    Total Vaccine Types
                  </div>
                  <div class="h5 mb-0 fw-bold text-gray-800">{{ stats.totalTypes }}</div>
                </div>
                <div class="col-auto">
                  <i class="bi bi-list-check text-primary" style="font-size: 2rem;"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="col-md-3">
          <div class="card border-start border-success border-4 shadow h-100 py-2">
            <div class="card-body">
              <div class="row no-gutters align-items-center">
                <div class="col me-2">
                  <div class="text-xs fw-bold text-success text-uppercase mb-1">
                    Available Doses
                  </div>
                  <div class="h5 mb-0 fw-bold text-gray-800">{{ stats.totalDoses }}</div>
                </div>
                <div class="col-auto">
                  <i class="bi bi-shield-check text-success" style="font-size: 2rem;"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="col-md-3">
          <div class="card border-start border-warning border-4 shadow h-100 py-2">
            <div class="card-body">
              <div class="row no-gutters align-items-center">
                <div class="col me-2">
                  <div class="text-xs fw-bold text-warning text-uppercase mb-1">
                    Low Stock Items
                  </div>
                  <div class="h5 mb-0 fw-bold text-gray-800">{{ stats.lowStock }}</div>
                </div>
                <div class="col-auto">
                  <i class="bi bi-exclamation-triangle text-warning" style="font-size: 2rem;"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="col-md-3">
          <div class="card border-start border-danger border-4 shadow h-100 py-2">
            <div class="card-body">
              <div class="row no-gutters align-items-center">
                <div class="col me-2">
                  <div class="text-xs fw-bold text-danger text-uppercase mb-1">
                    Expiring Soon
                  </div>
                  <div class="h5 mb-0 fw-bold text-gray-800">{{ stats.expiringSoon }}</div>
                </div>
                <div class="col-auto">
                  <i class="bi bi-calendar-x text-danger" style="font-size: 2rem;"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Inventory Table -->
      <div v-if="!loading" class="card shadow mb-4">
        <div class="card-header py-3 d-flex justify-content-between align-items-center">
          <h6 class="m-0 fw-bold text-primary">Vaccine Stock</h6>
          <div class="input-group w-25">
            <input 
              type="text" 
              class="form-control" 
              placeholder="Search vaccines..." 
              v-model="searchTerm"
              aria-label="Search"
              @input="watchSearchTerm"
            >
            <button class="btn btn-outline-primary" type="button">
              <i class="bi bi-search"></i>
            </button>
          </div>
        </div>
        <div class="card-body">
          <div class="table-responsive">
            <table class="table table-hover">
              <thead class="table-light">
                <tr>
                  <th>Vaccine Name</th>
                  <th>Manufacturer</th>
                  <th>Batch No.</th>
                  <th>Expiry Date</th>
                  <th>Quantity</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="vaccine in paginatedVaccines" :key="vaccine.id">
                  <td class="fw-semibold">{{ vaccine.vaccineName }}</td>
                  <td>{{ vaccine.manufacturer }}</td>
                  <td><code>{{ vaccine.batchNo }}</code></td>
                  <td>{{ formatDate(vaccine.expiryDate) }}</td>
                  <td>
                    <span class="fw-bold" :class="getQuantityClass(vaccine.quantity)">
                      {{ vaccine.quantity }}
                    </span>
                  </td>
                  <td>
                    <span class="badge" :class="getStatusBadgeClass(vaccine.status)">
                      {{ vaccine.status }}
                    </span>
                  </td>
                  <td>
                    <div class="btn-group btn-group-sm">
                      <button 
                        class="btn btn-outline-primary" 
                        @click="editVaccine(vaccine)"
                        title="Edit"
                      >
                        <i class="bi bi-pencil"></i>
                      </button>
                      <button 
                        class="btn btn-outline-danger" 
                        @click="deleteVaccine(vaccine)"
                        title="Delete"
                      >
                        <i class="bi bi-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
                <tr v-if="paginatedVaccines.length === 0">
                  <td colspan="7" class="text-center text-muted py-4">
                    No vaccines found
                  </td>
                </tr>
              </tbody>
            </table>
            
            <!-- Pagination Controls -->
            <div class="d-flex justify-content-between align-items-center mt-4">
              <div class="text-muted">
                Showing {{ paginatedVaccines.length > 0 ? ((currentPage - 1) * 5 + 1) : 0 }}
                to {{ Math.min(currentPage * 5, filteredVaccines.length) }}
                of {{ filteredVaccines.length }} entries
              </div>
              <nav aria-label="Vaccine inventory pagination">
                <ul class="pagination">
                  <li class="page-item" :class="{ disabled: currentPage === 1 }">
                    <button class="page-link" @click="prevPage()" aria-label="Previous">
                      <span aria-hidden="true">&laquo;</span>
                    </button>
                  </li>
                  
                  <li v-for="(page, index) in pageNumbers" :key="index" 
                      class="page-item" 
                      :class="{ active: page === currentPage, disabled: page === '...' }">
                    <button class="page-link" @click="page !== '...' && goToPage(page)">
                      {{ page }}
                    </button>
                  </li>
                  
                  <li class="page-item" :class="{ disabled: currentPage === totalPages }">
                    <button class="page-link" @click="nextPage()" aria-label="Next">
                      <span aria-hidden="true">&raquo;</span>
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        </div>
      </div>

      <!-- Add/Edit Modal -->
      <div class="modal fade" :class="{ show: showAddModal }" :style="{ display: showAddModal ? 'block' : 'none' }" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">{{ isEditing ? 'Edit' : 'Add New' }} Vaccine Stock</h5>
              <button type="button" class="btn-close" @click="closeModal"></button>
            </div>
            <div class="modal-body">
              <form @submit.prevent="saveVaccine">
                <div class="mb-3">
                  <label for="vaccineName" class="form-label">Vaccine Name *</label>
                  <input 
                    type="text" 
                    class="form-control" 
                    id="vaccineName"
                    v-model="form.vaccineName" 
                    required
                  >
                </div>
                <div class="mb-3">
                  <label for="manufacturer" class="form-label">Manufacturer *</label>
                  <input 
                    type="text" 
                    class="form-control" 
                    id="manufacturer"
                    v-model="form.manufacturer" 
                    required
                  >
                </div>
                <div class="mb-3">
                  <label for="batchNo" class="form-label">Batch Number *</label>
                  <input 
                    type="text" 
                    class="form-control" 
                    id="batchNo"
                    v-model="form.batchNo" 
                    required
                  >
                </div>
                <div class="mb-3">
                  <label for="expiryDate" class="form-label">Expiry Date *</label>
                  <input 
                    type="date" 
                    class="form-control" 
                    id="expiryDate"
                    v-model="form.expiryDate" 
                    required
                  >
                </div>
                <div class="mb-3">
                  <label for="quantity" class="form-label">Quantity *</label>
                  <input 
                    type="number" 
                    class="form-control" 
                    id="quantity"
                    v-model="form.quantity" 
                    min="0"
                    required
                  >
                </div>
                <div class="modal-footer">
                  <button type="button" class="btn btn-secondary" @click="closeModal">Cancel</button>
                  <button type="submit" class="btn btn-primary" :disabled="saving">
                    <span v-if="saving" class="spinner-border spinner-border-sm me-2"></span>
                    {{ isEditing ? 'Update' : 'Add' }} Stock
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal Backdrop -->
      <div v-if="showAddModal" class="modal-backdrop fade show"></div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import api from '@/services/api'
import usePagination from '@/composables/usePagination'

// Reactive data
const loading = ref(true)
const saving = ref(false)
const vaccines = ref([])
const stats = ref({
  totalTypes: 0,
  totalDoses: 0,
  available: 0,
  lowStock: 0,
  outOfStock: 0,
  expiringSoon: 0
})
const searchTerm = ref('')
const showAddModal = ref(false)
const isEditing = ref(false)

// Reset pagination when search term changes
const resetPagination = () => {
  goToPage(1)
}

// Watch for search term changes
const watchSearchTerm = () => {
  if (searchTerm.value !== undefined) {
    resetPagination()
  }
}

// Form data
const form = ref({
  id: null,
  vaccineName: '',
  manufacturer: '',
  batchNo: '',
  expiryDate: '',
  quantity: 0
})

// Computed properties
const filteredVaccines = computed(() => {
  if (!searchTerm.value) return vaccines.value
  return vaccines.value.filter(vaccine => 
    vaccine.vaccineName.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
    vaccine.manufacturer.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
    vaccine.batchNo.toLowerCase().includes(searchTerm.value.toLowerCase())
  )
})

// Pagination
const {
  currentPage,
  totalPages,
  paginatedItems: paginatedVaccines,
  nextPage,
  prevPage,
  goToPage,
  pageNumbers
} = usePagination(filteredVaccines, 5)

// Methods
const fetchVaccines = async () => {
  try {
    loading.value = true
    const response = await api.get('/vaccines/stock')
    vaccines.value = response.data.data
  } catch (error) {
    console.error('Error fetching vaccines:', error)
    alert('Error loading vaccine data')
  } finally {
    loading.value = false
  }
}

const fetchStats = async () => {
  try {
    const response = await api.get('/vaccines/stock/stats')
    stats.value = response.data.data
  } catch (error) {
    console.error('Error fetching stats:', error)
  }
}

const saveVaccine = async () => {
  try {
    saving.value = true
    
    if (isEditing.value) {
      await api.put(`/vaccines/stock/${form.value.id}`, form.value)
    } else {
      await api.post('/vaccines/stock', form.value)
    }
    
    closeModal()
    await fetchVaccines()
    await fetchStats()
  } catch (error) {
    console.error('Error saving vaccine:', error)
    alert('Error saving vaccine data')
  } finally {
    saving.value = false
  }
}

const editVaccine = (vaccine) => {
  form.value = { ...vaccine }
  isEditing.value = true
  showAddModal.value = true
}

const deleteVaccine = async (vaccine) => {
  if (confirm(`Are you sure you want to delete ${vaccine.vaccineName}?`)) {
    try {
      await api.delete(`/vaccines/stock/${vaccine.id}`)
      await fetchVaccines()
      await fetchStats()
    } catch (error) {
      console.error('Error deleting vaccine:', error)
      alert('Error deleting vaccine')
    }
  }
}

const closeModal = () => {
  showAddModal.value = false
  isEditing.value = false
  form.value = {
    id: null,
    vaccineName: '',
    manufacturer: '',
    batchNo: '',
    expiryDate: '',
    quantity: 0
  }
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const getStatusBadgeClass = (status) => {
  switch (status) {
    case 'Available': return 'bg-success'
    case 'Low Stock': return 'bg-warning text-dark'
    case 'Out of Stock': return 'bg-danger'
    case 'Expiring Soon': return 'bg-danger'
    default: return 'bg-secondary'
  }
}

const getQuantityClass = (quantity) => {
  if (quantity === 0) return 'text-danger'
  if (quantity <= 50) return 'text-warning'
  return 'text-success'
}

// Lifecycle
onMounted(() => {
  fetchVaccines()
  fetchStats()
})
</script>

<style scoped>
.border-start {
  border-left: 0.25rem solid !important;
}

.text-gray-800 {
  color: #5a5c69 !important;
}

.modal.show {
  background-color: rgba(0, 0, 0, 0.5);
}
</style>
