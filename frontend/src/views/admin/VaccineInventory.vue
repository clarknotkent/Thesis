<template>
  <AdminLayout>
    <div class="container-fluid p-4">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 class="h3 mb-0 text-gray-800">Vaccine Inventory</h1>
          <p class="text-muted mb-0">Manage vaccine types and track vaccine stock levels</p>
        </div>
        <div class="btn-group">
          <button class="btn btn-primary" @click="showAddStockModal = true">
            <i class="bi bi-plus-circle me-2"></i>Add New Stock
          </button>
          <button class="btn btn-success" @click="showAddVaccineModal = true">
            <i class="bi bi-plus-square me-2"></i>Add New Vaccine
          </button>
        </div>
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
      <div class="modal fade" :class="{ show: showAddModal || showAddStockModal }" :style="{ display: (showAddModal || showAddStockModal) ? 'block' : 'none' }" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">{{ isEditing ? 'Edit' : 'Add New' }} Vaccine Stock</h5>
              <button type="button" class="btn-close" @click="closeModal"></button>
            </div>
            <div class="modal-body">
              <form @submit.prevent="saveVaccine">
                <div class="mb-3">
                  <label for="vaccineSelect" class="form-label">Select Vaccine *</label>
                  <select 
                    class="form-control" 
                    id="vaccineSelect"
                    v-model="form.vaccine_id" 
                    @change="onVaccineSelect"
                    required
                  >
                    <option value="">-- Select a Vaccine --</option>
                    <option v-for="vaccine in existingVaccines" :key="vaccine.id" :value="vaccine.id">
                      {{ vaccine.antigen_name }} - {{ vaccine.brand_name }}
                    </option>
                  </select>
                </div>
                <div class="mb-3">
                  <label for="brandName" class="form-label">Brand Name</label>
                  <input 
                    type="text" 
                    class="form-control bg-light" 
                    id="brandName"
                    v-model="form.brandName" 
                    readonly
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
                    placeholder="e.g., Pfizer Inc., Moderna Inc."
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
                <div class="mb-3">
                  <label for="lotNumber" class="form-label">Lot Number *</label>
                  <input 
                    type="text" 
                    class="form-control" 
                    id="lotNumber"
                    v-model="form.lotNumber" 
                    required
                    placeholder="e.g., LOT123456"
                  >
                </div>
                <div class="mb-3">
                  <label for="expirationDate" class="form-label">Expiration Date *</label>
                  <input 
                    type="date" 
                    class="form-control" 
                    id="expirationDate"
                    v-model="form.expirationDate" 
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

      <!-- Add New Vaccine Modal -->
      <div class="modal fade" :class="{ show: showAddVaccineModal }" :style="{ display: showAddVaccineModal ? 'block' : 'none' }" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Add New Vaccine Type</h5>
              <button type="button" class="btn-close" @click="closeVaccineModal"></button>
            </div>
            <div class="alert alert-info mx-3 mt-3 mb-0">
              <small><strong>Note:</strong> This creates a new vaccine type. Each combination of Antigen Name + Brand Name must be unique.</small>
            </div>
            <div class="modal-body">
              <form @submit.prevent="saveNewVaccine">
                <div class="mb-3">
                  <label for="newAntigenName" class="form-label">Antigen Name *</label>
                  <input 
                    type="text" 
                    class="form-control" 
                    id="newAntigenName"
                    v-model="vaccineForm.antigen_name" 
                    required
                    placeholder="Enter new antigen name (e.g., COVID-19, Rotavirus)"
                  >
                </div>
                <div class="mb-3">
                  <label for="newBrandName" class="form-label">Brand Name *</label>
                  <input 
                    type="text" 
                    class="form-control" 
                    id="newBrandName"
                    v-model="vaccineForm.brand_name" 
                    required
                    placeholder="e.g., Pfizer, Moderna, Sinovac"
                  >
                </div>
                <div class="mb-3">
                  <label for="newManufacturer" class="form-label">Manufacturer *</label>
                  <input 
                    type="text" 
                    class="form-control" 
                    id="newManufacturer"
                    v-model="vaccineForm.manufacturer" 
                    required
                    placeholder="e.g., Pfizer Inc., Moderna Inc."
                  >
                </div>
                <div class="mb-3">
                  <label for="newVaccineType" class="form-label">Vaccine Type *</label>
                  <select 
                    class="form-control" 
                    id="newVaccineType"
                    v-model="vaccineForm.vaccine_type" 
                    required
                  >
                    <option value="">-- Select Type --</option>
                    <option value="live">Live</option>
                    <option value="inactivated">Inactivated</option>
                  </select>
                </div>
                <div class="mb-3">
                  <label for="newLotNumber" class="form-label">Lot Number *</label>
                  <input 
                    type="text" 
                    class="form-control" 
                    id="newLotNumber"
                    v-model="vaccineForm.lot_number" 
                    required
                    placeholder="e.g., LOT123456"
                  >
                </div>
                <div class="mb-3">
                  <label for="newExpirationDate" class="form-label">Expiration Date *</label>
                  <input 
                    type="date" 
                    class="form-control" 
                    id="newExpirationDate"
                    v-model="vaccineForm.expiration_date" 
                    required
                  >
                </div>
                <div class="mb-3">
                  <label for="newStockLevel" class="form-label">Stock Level *</label>
                  <input 
                    type="number" 
                    class="form-control" 
                    id="newStockLevel"
                    v-model="vaccineForm.stock_level" 
                    min="0"
                    required
                  >
                </div>
                <div class="modal-footer">
                  <button type="button" class="btn btn-secondary" @click="closeVaccineModal">Cancel</button>
                  <button type="submit" class="btn btn-success" :disabled="saving">
                    <span v-if="saving" class="spinner-border spinner-border-sm me-2"></span>
                    Add Vaccine
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal Backdrop -->
      <div v-if="showAddModal || showAddStockModal || showAddVaccineModal" class="modal-backdrop fade show"></div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import api from '@/services/api'
import { usePagination } from '@/composables/usePagination'

// Reactive data
const loading = ref(true)
const saving = ref(false)
const vaccines = ref([])
const existingVaccines = ref([])
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
const showAddStockModal = ref(false)
const showAddVaccineModal = ref(false)
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

// Form data for inventory stock
const form = ref({
  id: null,
  vaccine_id: '',
  antigenName: '',
  brandName: '',
  manufacturer: '',
  quantity: 0,
  lotNumber: '',
  expirationDate: ''
})

// Form data for new vaccine
const vaccineForm = ref({
  id: null,
  antigen_name: '',
  brand_name: '',
  manufacturer: '',
  vaccine_type: '',
  lot_number: '',
  expiration_date: '',
  stock_level: 0
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
    const response = await api.get('/vaccines/inventory')
    const items = response.data?.data || response.data || []
    vaccines.value = items.map(v => ({
      id: v.inventory_id || v.id,
      vaccineName: v.vaccinemaster?.antigen_name || v.vaccine?.antigen_name || v.antigen_name || '',
      manufacturer: v.vaccinemaster?.manufacturer || v.vaccine?.manufacturer || v.manufacturer || '',
      batchNo: v.lot_number || v.batch_number || '',
      expiryDate: v.expiration_date || v.expiry_date || '',
      quantity: v.current_stock_level || v.quantity || 0,
      status: v.status || (v.current_stock_level > 0 ? (v.current_stock_level < 10 ? 'Low Stock' : 'Available') : 'Out of Stock')
    }))
  } catch (error) {
    console.error('Error fetching vaccines:', error)
    alert('Error loading vaccine data')
  } finally {
    loading.value = false
  }
}

const fetchStats = async () => {
  try {
    // Compute stats client-side from vaccines data
    const totalTypes = new Set(vaccines.value.map(v => v.vaccineName)).size
    const totalDoses = vaccines.value.reduce((sum, v) => sum + (v.quantity || 0), 0)
    const lowStock = vaccines.value.filter(v => (v.quantity || 0) > 0 && (v.quantity || 0) < 10).length
    const expiringSoon = vaccines.value.filter(v => {
      if (!v.expiryDate) return false
      const d = new Date(v.expiryDate)
      const now = new Date()
      const in30 = new Date(now.getTime() + 30*24*60*60*1000)
      return d >= now && d <= in30
    }).length
    stats.value = { totalTypes, totalDoses, lowStock, expiringSoon }
  } catch (error) {
    console.error('Error calculating stats:', error)
  }
}

const fetchExistingVaccines = async () => {
  try {
    const response = await api.get('/vaccines')
    existingVaccines.value = response.data?.data || response.data || []
  } catch (error) {
    console.error('Error fetching existing vaccines:', error)
    // Fallback to empty array if API fails
    existingVaccines.value = []
  }
}

const saveVaccine = async () => {
  try {
    saving.value = true
    
    const payload = {
      brand_name: form.value.brandName,
      manufacturer: form.value.manufacturer,
      current_stock_level: form.value.quantity,
      lot_number: form.value.lotNumber,
      expiration_date: form.value.expirationDate
    }
    
    if (isEditing.value) {
      await api.put(`/vaccines/inventory/${form.value.id}`, payload)
    } else {
      await api.post('/vaccines/inventory', payload)
    }
    
    closeModal()
    await fetchVaccines()
    await fetchStats()
    await fetchExistingVaccines()
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
  showAddStockModal.value = true
}

const deleteVaccine = async (vaccine) => {
  if (confirm(`Are you sure you want to delete ${vaccine.vaccineName}?`)) {
    try {
      await api.delete(`/vaccines/inventory/${vaccine.id}`)
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
  showAddStockModal.value = false
  isEditing.value = false
  form.value = {
    id: null,
    vaccine_id: '',
    antigenName: '',
    brandName: '',
    manufacturer: '',
    quantity: 0,
    lotNumber: '',
    expirationDate: ''
  }
}

const onVaccineSelect = () => {
  if (form.value.vaccine_id) {
    const selectedVaccine = existingVaccines.value.find(v => v.id === form.value.vaccine_id)
    if (selectedVaccine) {
      form.value.antigenName = selectedVaccine.antigen_name
      form.value.brandName = selectedVaccine.brand_name
      form.value.manufacturer = selectedVaccine.manufacturer
    }
  }
}

const closeVaccineModal = () => {
  showAddVaccineModal.value = false
  vaccineForm.value = {
    id: null,
    antigen_name: '',
    brand_name: '',
    manufacturer: '',
    vaccine_type: '',
    lot_number: '',
    expiration_date: '',
    stock_level: 0
  }
}

const saveNewVaccine = async () => {
  try {
    saving.value = true
    
    // First create the vaccine type
    const vaccinePayload = {
      antigen_name: vaccineForm.value.antigen_name,
      brand_name: vaccineForm.value.brand_name,
      manufacturer: vaccineForm.value.manufacturer,
      vaccine_type: vaccineForm.value.vaccine_type
    }
    
    const vaccineResponse = await api.post('/vaccines', vaccinePayload)
    const vaccineId = vaccineResponse.data?.data?.vaccine_id
    
    // Then create the initial inventory
    if (vaccineId && vaccineForm.value.stock_level > 0) {
      const inventoryPayload = {
        vaccine_id: vaccineId,
        lot_number: vaccineForm.value.lot_number,
        expiration_date: vaccineForm.value.expiration_date,
        current_stock_level: vaccineForm.value.stock_level
      }
      await api.post('/vaccines/inventory', inventoryPayload)
    }
    
    closeVaccineModal()
    await fetchVaccines()
    await fetchStats()
    await fetchExistingVaccines()
    alert('Vaccine type added successfully!')
  } catch (error) {
    console.error('Error saving vaccine:', error)
    
    // Handle specific error types
    if (error.response?.status === 400 && error.response?.data?.error?.code === '23505') {
      alert('This vaccine already exists! A vaccine with this Antigen Name and Brand Name combination is already in the system.')
    } else if (error.response?.status === 400 && error.response?.data?.error?.code === '23514') {
      alert('Invalid vaccine type selected. Please choose either "Live" or "Inactivated".')
    } else {
      alert('Error saving vaccine type. Please check your input and try again.')
    }
  } finally {
    saving.value = false
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
  fetchExistingVaccines()
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
