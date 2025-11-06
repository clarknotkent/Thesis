<template>
  <AdminLayout>
    <div class="container-fluid">
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
          <li class="breadcrumb-item">
            <router-link to="/admin/vaccines">
              Vaccine Inventory
            </router-link>
          </li>
          <li class="breadcrumb-item active">
            Edit Vaccine Type
          </li>
        </ol>
      </nav>

      <!-- Page Header -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 class="h3 mb-0 text-gray-800">
            <i class="bi bi-pencil-square me-2" />Edit Vaccine Type
          </h1>
          <p class="text-muted mb-0">
            Select a vaccine type to edit and update its information
          </p>
        </div>
        <router-link
          to="/admin/vaccines"
          class="btn btn-outline-secondary"
        >
          <i class="bi bi-arrow-left me-2" />Back to Inventory
        </router-link>
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
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>

      <!-- Main Content -->
      <div
        v-else
        class="card shadow"
      >
        <div class="card-body p-4">
          <!-- Vaccine Type Selection -->
          <div class="row mb-4">
            <div class="col-12">
              <h6 class="text-primary fw-bold mb-3">
                <i class="bi bi-list-check me-2" />Select Vaccine Type to Edit
              </h6>
              <div class="row g-3">
                <div class="col-xl-6 col-lg-6 col-md-8">
                  <label
                    for="vaccineSelect"
                    class="form-label"
                  >Vaccine Type: <span class="text-danger">*</span></label>
                  <div
                    v-click-outside="() => dropdownOpen = false"
                    class="vaccine-dropdown-wrapper"
                  >
                    <input
                      :ref="el => inputRef = el"
                      v-model="vaccineSearch"
                      type="text"
                      class="form-control"
                      placeholder="Type or select a vaccine type..."
                      autocomplete="off"
                      @input="onVaccineInput"
                      @focus="openDropdown"
                    >
                    <div
                      v-if="dropdownOpen"
                      class="vaccine-dropdown-menu"
                      :style="dropdownPosition"
                    >
                      <div
                        class="vaccine-dropdown-item"
                        @click="selectVaccine(null)"
                      >
                        -- Select a Vaccine Type to Edit --
                      </div>
                      <div
                        v-for="vaccine in getFilteredVaccines().slice(0, 4)"
                        :key="vaccine.id"
                        class="vaccine-dropdown-item"
                        @click="selectVaccine(vaccine)"
                      >
                        {{ vaccine.antigen_name }} - {{ vaccine.brand_name }}
                      </div>
                    </div>
                  </div>
                  <small class="text-muted">Choose the vaccine type you want to modify</small>
                </div>
              </div>
            </div>
          </div>

          <!-- Edit Form -->
          <div
            v-if="selectedVaccineId && vaccineData"
            class="row"
          >
            <div class="col-12">
              <hr class="my-4">
              <h6 class="text-primary fw-bold mb-3">
                <i class="bi bi-pencil-square me-2" />Edit Vaccine Type Details
              </h6>
              <VaccineForm
                :initial-data="vaccineData"
                :is-editing="true"
                submit-label="Save Changes"
                :submitting="submitting"
                @submit="handleSubmit"
                @cancel="handleCancel"
              />
            </div>
          </div>

          <!-- No Selection State -->
          <div
            v-else-if="!selectedVaccineId"
            class="text-center py-5 text-muted"
          >
            <i class="bi bi-arrow-up-circle fs-1 mb-3" />
            <p class="mb-0">
              Please select a vaccine type from the dropdown above to begin editing.
            </p>
          </div>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import AdminLayout from '@/components/layout/desktop/AdminLayout.vue'
import VaccineForm from '@/features/admin/inventory/components/VaccineForm.vue'
import api from '@/services/api'
import { useToast } from '@/composables/useToast'

// Click outside directive
const vClickOutside = {
  mounted(el, binding) {
    el.clickOutsideEvent = function(event) {
      if (!(el === event.target || el.contains(event.target))) {
        binding.value(event)
      }
    }
    document.body.addEventListener('click', el.clickOutsideEvent)
  },
  unmounted(el) {
    document.body.removeEventListener('click', el.clickOutsideEvent)
  }
}

const router = useRouter()
const { addToast } = useToast()

const existingVaccines = ref([])
const selectedVaccineId = ref('')
const vaccineData = ref(null)
const loading = ref(true)
const submitting = ref(false)

// Dropdown state
const vaccineSearch = ref('')
const dropdownOpen = ref(false)
const inputRef = ref(null)
const dropdownPosition = ref({})

onMounted(async () => {
  await fetchExistingVaccines()
  loading.value = false
})

const fetchExistingVaccines = async () => {
  try {
    const response = await api.get('/vaccines')
    let raw = response.data?.data || response.data || []
    if (raw && typeof raw === 'object' && Array.isArray(raw.vaccines)) {
      raw = raw.vaccines
    }
    if (Array.isArray(raw)) {
      existingVaccines.value = raw.map(v => ({
        ...v,
        id: v.vaccine_id || v.id
      }))
    } else if (raw && typeof raw === 'object') {
      existingVaccines.value = [{
        ...raw,
        id: raw.vaccine_id || raw.id
      }]
    } else {
      existingVaccines.value = []
    }
  } catch (error) {
    console.error('Error fetching existing vaccines:', error)
    existingVaccines.value = []
  }
}

function openDropdown(event) {
  dropdownOpen.value = true
  if (inputRef.value) {
    const rect = inputRef.value.getBoundingClientRect()
    dropdownPosition.value = {
      position: 'fixed',
      top: `${rect.bottom + window.scrollY}px`,
      left: `${rect.left + window.scrollX}px`,
      minWidth: `${rect.width}px`
    }
  }
}

function onVaccineInput() {
  dropdownOpen.value = true
  selectedVaccineId.value = ''
}

function getFilteredVaccines() {
  if (!vaccineSearch.value || vaccineSearch.value.trim() === '') {
    return existingVaccines.value
  }
  const search = vaccineSearch.value.toLowerCase()
  return existingVaccines.value.filter(v =>
    v.antigen_name.toLowerCase().includes(search) ||
    v.brand_name.toLowerCase().includes(search)
  )
}

function selectVaccine(vaccine) {
  if (!vaccine) {
    selectedVaccineId.value = ''
    vaccineSearch.value = ''
    vaccineData.value = null
  } else {
    selectedVaccineId.value = vaccine.id
    vaccineSearch.value = `${vaccine.antigen_name} - ${vaccine.brand_name}`
    onVaccineSelect()
  }
  dropdownOpen.value = false
}

const onVaccineSelect = async () => {
  if (!selectedVaccineId.value) {
    vaccineData.value = null
    return
  }

  try {
    const response = await api.get(`/vaccines/${selectedVaccineId.value}`)
    const data = response.data.data || response.data

    vaccineData.value = {
      antigen_name: data.antigen_name,
      brand_name: data.brand_name,
      manufacturer: data.manufacturer,
      disease_prevented: data.disease_prevented,
      category: data.category || 'VACCINE',
      vaccine_type: data.vaccine_type || '',
      is_nip: data.is_nip || false
    }
  } catch (error) {
    console.error('Error fetching vaccine data:', error)
    addToast({ title: 'Error', message: 'Failed to load vaccine data', type: 'error' })
    vaccineData.value = null
  }
}

const handleSubmit = async (formData) => {
  submitting.value = true
  try {
    const vaccineUpdateData = {
      antigen_name: formData.antigen_name,
      brand_name: formData.brand_name,
      manufacturer: formData.manufacturer,
      disease_prevented: formData.disease_prevented,
      category: formData.category,
      vaccine_type: (formData.category === 'DEWORMING' || formData.category === 'VITAMIN_A')
        ? null
        : formData.vaccine_type,
      is_nip: formData.is_nip === true
    }

    await api.put(`/vaccines/${selectedVaccineId.value}`, vaccineUpdateData)
    addToast({ title: 'Success', message: 'Vaccine type updated successfully!', type: 'success' })
    router.push('/admin/vaccines')
  } catch (error) {
    console.error('Error updating vaccine type:', error)
    const errorMessage = error.response?.data?.message || 'Error updating vaccine type. Please try again.'
    addToast({ title: 'Error', message: errorMessage, type: 'error' })
  } finally {
    submitting.value = false
  }
}

const handleCancel = () => {
  router.back()
}
</script>

<style scoped>
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

.text-gray-800 {
  color: #5a5c69 !important;
}

.vaccine-dropdown-wrapper {
  position: relative;
}

.vaccine-dropdown-menu {
  position: fixed;
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 0.25rem;
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
  z-index: 9999;
  max-height: none;
  overflow: visible;
  min-width: 300px;
}

.vaccine-dropdown-item {
  padding: 0.75rem 1rem;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
  font-size: 0.95rem;
  white-space: nowrap;
}

.vaccine-dropdown-item:last-child {
  border-bottom: none;
}

.vaccine-dropdown-item:hover {
  background-color: #0d6efd;
  color: white;
}

.vaccine-dropdown-item:first-child {
  font-style: italic;
  color: #6c757d;
}

.vaccine-dropdown-item:first-child:hover {
  background-color: #e9ecef;
  color: #6c757d;
}
</style>