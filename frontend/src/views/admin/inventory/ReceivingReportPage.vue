<template>
  <AdminLayout>
    <div class="container-fluid">
      <!-- Breadcrumb -->
      <nav aria-label="breadcrumb" class="mb-3">
        <ol class="breadcrumb">
          <li class="breadcrumb-item">
            <router-link to="/admin/dashboard">Admin</router-link>
          </li>
          <li class="breadcrumb-item">
            <router-link to="/admin/vaccines">Vaccine Inventory</router-link>
          </li>
          <li class="breadcrumb-item active">{{ isNew ? 'New Receiving Report' : 'View Receiving Report' }}</li>
        </ol>
      </nav>

      <!-- Page Header -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 class="h3 mb-0 text-gray-800">
            <i class="bi bi-file-earmark-text me-2"></i>{{ isNew ? 'New Receiving Report' : `Receiving Report ${form.report_number || ''}` }}
          </h1>
          <p class="text-muted mb-0">Record deliveries and convert to inventory</p>
        </div>
        <div class="d-flex gap-2">
          <button class="btn btn-outline-secondary" @click="goBack">
            <i class="bi bi-arrow-left me-2"></i>Back
          </button>
          <router-link to="/admin/vaccines" class="btn btn-outline-primary">
            <i class="bi bi-house me-2"></i>Home
          </router-link>
        </div>
      </div>

      <div class="card shadow mb-4">
        <div class="card-body">
          <form @submit.prevent>
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label">Delivery Date *</label>
                <DateInput v-model="form.delivery_date" :disabled="isCompleted" />
              </div>
              <div class="col-md-6">
                <label class="form-label">Delivered By *</label>
                <input class="form-control" v-model="form.delivered_by" :disabled="isCompleted" required />
              </div>
              <div class="col-12">
                <label class="form-label">Supplier Notes</label>
                <textarea class="form-control" rows="2" v-model="form.supplier_notes" :disabled="isCompleted"></textarea>
              </div>
            </div>
          </form>

          <hr />
          <div>
            <div class="d-flex justify-content-between align-items-center mb-2">
              <h6 class="m-0">
                Items
                <small class="text-muted ms-2">
                  ({{ Number(form.total_items || visibleItems.length) }} items · {{ Number(form.total_quantity || visibleItems.reduce((s,i)=> s + (Number(i.quantity_received)||0), 0)) }} total)
                </small>
              </h6>
              <button v-if="!isCompleted" class="btn btn-sm btn-outline-primary" @click="addItemRow">
                <i class="bi bi-plus"></i> Add Item
              </button>
            </div>
            <div class="table-responsive">
              <table class="table table-sm align-middle table-striped table-expanded">
                <thead>
                  <tr>
                    <th style="width: 20%;">Vaccine (existing)</th>
                    <th style="width: 12%;">Antigen</th>
                    <th style="width: 12%;">Brand</th>
                    <th style="width: 12%;">Manufacturer</th>
                    <th style="width: 10%;">Lot #</th>
                    <th style="width: 10%;">Expiry</th>
                    <th style="width: 12%;">Qty</th>
                    <th style="width: 10%;">Storage</th>
                    <th style="width: 2%;"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(it, idx) in visibleItems" :key="it.item_id || idx">
                    <td>
                      <div class="vaccine-dropdown-wrapper" :class="{ 'is-open': it.dropdownOpen }" v-click-outside="() => it.dropdownOpen = false">
                        <input 
                          type="text"
                          class="form-control form-control-sm" 
                          v-model="it.vaccine_search" 
                          @input="onVaccineInput(it)"
                          @focus="openDropdown(it, $event)"
                          :disabled="isCompleted"
                          placeholder="Type or select..."
                          autocomplete="off"
                          :ref="el => it.inputRef = el"
                        />
                        <div 
                          v-if="it.dropdownOpen && !isCompleted" 
                          class="vaccine-dropdown-menu"
                          :style="getDropdownPosition(it)"
                        >
                          <div 
                            class="vaccine-dropdown-item"
                            @click="selectVaccine(it, null)"
                          >
                            New / Not in list…
                          </div>
                          <div 
                            v-for="v in getFilteredVaccines(it.vaccine_search).slice(0, 4)" 
                            :key="v.id"
                            class="vaccine-dropdown-item"
                            @click="selectVaccine(it, v)"
                          >
                            {{ v.antigen_name }} ({{ v.brand_name }})
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <input class="form-control form-control-sm" v-model="it.antigen_name" :disabled="isCompleted || !!it.vaccine_id" placeholder="e.g., DTP" />
                    </td>
                    <td>
                      <input class="form-control form-control-sm" v-model="it.brand_name" :disabled="isCompleted || !!it.vaccine_id" placeholder="Brand" />
                    </td>
                    <td><input class="form-control form-control-sm" v-model="it.manufacturer" :disabled="isCompleted" list="mfgList" /></td>
                    <td><input class="form-control form-control-sm" v-model="it.lot_number" :disabled="isCompleted" /></td>
                    <td><DateInput v-model="it.expiration_date" small :disabled="isCompleted" /></td>
                    <td>
                      <div class="input-group qty-group">
                        <button class="btn btn-outline-secondary" type="button" title="Decrease" @click="it.quantity_received = Math.max(1, (Number(it.quantity_received)||1) - 1)" :disabled="isCompleted">-</button>
                        <input type="number" min="1" step="1" inputmode="numeric" aria-label="Quantity" class="form-control text-center qty-input" v-model.number="it.quantity_received" :disabled="isCompleted" />
                        <button class="btn btn-outline-secondary" type="button" title="Increase" @click="it.quantity_received = (Number(it.quantity_received)||0) + 1" :disabled="isCompleted">+</button>
                      </div>
                    </td>
                    <td><input class="form-control form-control-sm" v-model="it.storage_location" :disabled="isCompleted" list="storageList" /></td>
                    <td>
                      <button v-if="!isCompleted" class="btn btn-sm btn-outline-danger" @click="it.is_deleted = true"><i class="bi bi-trash"></i></button>
                    </td>
                  </tr>
                  <tr v-if="visibleItems.length===0"><td colspan="9" class="text-center text-muted">No items yet</td></tr>
                </tbody>
              </table>
              <datalist id="mfgList">
                <option v-for="m in manufacturerOptions" :key="m" :value="m" />
              </datalist>
              <datalist id="storageList">
                <option v-for="s in storageOptions" :key="s" :value="s" />
              </datalist>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="d-flex justify-content-end gap-2 mt-3">
            <button v-if="form.status === 'DRAFT' && !isNew" class="btn btn-outline-secondary" @click="openCancelConfirm">
              Cancel
            </button>
            <button v-if="form.status === 'DRAFT' && !isNew" class="btn btn-primary" @click="openCompleteConfirm">
              Complete
            </button>
            <button v-if="!isCompleted" class="btn btn-success" @click="save" :disabled="saving">
              <span v-if="saving" class="spinner-border spinner-border-sm me-2"></span>
              {{ isNew ? 'Create Report' : 'Save Report' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Complete Confirm Modal -->
      <div class="modal fade" :class="{ show: showCompleteModal }" :style="{ display: showCompleteModal ? 'block' : 'none' }" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Complete Receiving Report</h5>
              <button class="btn-close" @click="showCompleteModal = false"></button>
            </div>
            <div class="modal-body">
              <p>You're about to complete this report and create inventory records.</p>
              <ul class="mb-0">
                <li><strong>Items:</strong> {{ completeSummary.items }}</li>
                <li><strong>Total Qty:</strong> {{ completeSummary.quantity }}</li>
              </ul>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" @click="showCompleteModal = false">Cancel</button>
              <button class="btn btn-primary" @click="confirmComplete" :disabled="completing">Complete Now</button>
            </div>
          </div>
        </div>
      </div>
      <div v-if="showCompleteModal" class="modal-backdrop fade show" />

      <!-- Cancel Confirm Modal -->
      <div class="modal fade" :class="{ show: showCancelModal }" :style="{ display: showCancelModal ? 'block' : 'none' }" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Cancel Receiving Report</h5>
              <button class="btn-close" @click="showCancelModal = false"></button>
            </div>
            <div class="modal-body">
              <label class="form-label">Reason (optional)</label>
              <textarea class="form-control" rows="3" v-model="cancelReason" placeholder="Enter reason for cancellation (optional)"></textarea>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" @click="showCancelModal = false">Close</button>
              <button class="btn btn-danger" @click="confirmCancel" :disabled="cancelling">Cancel Report</button>
            </div>
          </div>
        </div>
      </div>
      <div v-if="showCancelModal" class="modal-backdrop fade show" />

      <!-- Post-completion: Complete Vaccine Details Modal -->
      <div class="modal fade" :class="{ show: showDetailsModal }" :style="{ display: showDetailsModal ? 'block' : 'none' }" tabindex="-1">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Complete Vaccine Details</h5>
              <button class="btn-close" @click="showDetailsModal = false"></button>
            </div>
            <div class="modal-body">
              <p class="text-muted">Some vaccines created from this receiving report are missing details. Please review and complete them.</p>
              <div v-for="f in detailsForms" :key="f.vaccine_id" class="border rounded p-3 mb-3">
                <div class="row g-3">
                  <div class="col-md-4">
                    <label class="form-label">Antigen</label>
                    <input class="form-control" v-model="f.antigen_name" readonly />
                  </div>
                  <div class="col-md-4">
                    <label class="form-label">Brand</label>
                    <input class="form-control" v-model="f.brand_name" readonly />
                  </div>
                  <div class="col-md-4">
                    <label class="form-label">Manufacturer</label>
                    <input class="form-control" v-model="f.manufacturer" />
                  </div>
                  <div class="col-md-4">
                    <label class="form-label">Disease Prevented</label>
                    <input class="form-control" v-model="f.disease_prevented" placeholder="e.g., Measles, Polio" />
                  </div>
                  <div class="col-md-4">
                    <label class="form-label">Vaccine Type</label>
                    <select class="form-select" v-model="f.vaccine_type">
                      <option v-for="o in vaccineTypeOptions" :key="o" :value="o">{{ o }}</option>
                    </select>
                  </div>
                  <div class="col-md-4">
                    <label class="form-label">Category</label>
                    <select class="form-select" v-model="f.category">
                      <option v-for="c in categoryOptions" :key="c" :value="c">{{ c }}</option>
                    </select>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Default Storage Location (optional)</label>
                    <input class="form-control" v-model="f.default_storage_location" list="storageList" placeholder="Set for all inventory created by this RR" />
                  </div>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" @click="showDetailsModal = false">Close</button>
              <button class="btn btn-primary" @click="saveCompletedDetails">Save Details</button>
            </div>
          </div>
        </div>
      </div>
      <div v-if="showDetailsModal" class="modal-backdrop fade show" />
    </div>
  </AdminLayout>
  
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AdminLayout from '@/components/layout/desktop/AdminLayout.vue'
import DateInput from '@/components/ui/form/DateInput.vue'
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

const route = useRoute()
const router = useRouter()
const { addToast } = useToast()

const id = computed(() => route.params.id)
const isNew = computed(() => !id.value)

const saving = ref(false)
const form = ref({ report_id: null, report_number: '', status: 'DRAFT', delivery_date: '', delivered_by: '', supplier_notes: '' })
const items = ref([])

const vaccineTypes = ref([])
const manufacturerOptions = ref([])
const storageOptions = ref(['Cold Room A', 'Cold Room B', 'Refrigerator 1', 'Refrigerator 2', 'Freezer -20C', 'Freezer -80C'])

const isCompleted = computed(() => form.value.status === 'COMPLETED')
const visibleItems = computed(() => items.value.filter(it => !it.is_deleted))

// Complete/Cancel modals
const showCompleteModal = ref(false)
const completing = ref(false)
const completeSummary = ref({ items: 0, quantity: 0 })

const showCancelModal = ref(false)
const cancelling = ref(false)
const cancelReason = ref('')

// Post-completion details
const showDetailsModal = ref(false)
const detailsForms = ref([])
const reportItemsCache = ref([])
const vaccineTypeOptions = ['inactivated','live-attenuated','toxoid','mrna','viral-vector','conjugate','subunit','other']
const categoryOptions = ['VACCINE','DEWORMING','VITAMIN_A']

const goBack = () => router.back()

const toISO = (dateStr) => {
  if (!dateStr) return null
  if (String(dateStr).includes('-')) return dateStr
  const [m, d, y] = String(dateStr).split('/')
  if (!m || !d || !y) return null
  return `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`
}

async function loadVaccineTypes() {
  try {
    const res = await api.get('/vaccines')
    const arr = res.data?.data || res.data || []
    vaccineTypes.value = (Array.isArray(arr) ? arr : arr.vaccines || []).map(v => ({ id: v.vaccine_id || v.id, antigen_name: v.antigen_name, brand_name: v.brand_name, manufacturer: v.manufacturer }))
    manufacturerOptions.value = [...new Set(vaccineTypes.value.map(v => v.manufacturer).filter(Boolean))]
  } catch (e) {
    vaccineTypes.value = []
    manufacturerOptions.value = []
  }
}

function addItemRow() {
  items.value.push({ 
    item_id: null, 
    vaccine_id: '', 
    vaccine_search: '',
    dropdownOpen: false,
    inputRef: null,
    dropdownPosition: {},
    antigen_name: '', 
    brand_name: '', 
    manufacturer: '', 
    lot_number: '', 
    expiration_date: new Date().toISOString().split('T')[0], 
    quantity_received: 1, 
    storage_location: '', 
    is_deleted: false 
  })
}

function openDropdown(it, event) {
  it.dropdownOpen = true
  const input = event.target
  const rect = input.getBoundingClientRect()
  it.dropdownPosition = {
    top: rect.bottom + window.scrollY,
    left: rect.left + window.scrollX,
    width: rect.width
  }
}

function getDropdownPosition(it) {
  if (!it.dropdownPosition) return {}
  return {
    top: `${it.dropdownPosition.top}px`,
    left: `${it.dropdownPosition.left}px`,
    minWidth: `${it.dropdownPosition.width}px`
  }
}

function getFilteredVaccines(searchTerm) {
  if (!searchTerm || searchTerm.trim() === '') {
    return vaccineTypes.value
  }
  const search = searchTerm.toLowerCase()
  return vaccineTypes.value.filter(v => 
    v.antigen_name.toLowerCase().includes(search) || 
    v.brand_name.toLowerCase().includes(search)
  )
}

function onVaccineInput(it) {
  it.vaccine_id = ''
  it.dropdownOpen = true
}

function selectVaccine(it, vaccine) {
  if (!vaccine) {
    it.vaccine_id = ''
    it.vaccine_search = ''
    it.antigen_name = ''
    it.brand_name = ''
    it.manufacturer = ''
  } else {
    it.vaccine_id = vaccine.id
    it.vaccine_search = `${vaccine.antigen_name} (${vaccine.brand_name})`
    it.antigen_name = vaccine.antigen_name || ''
    it.brand_name = vaccine.brand_name || ''
    if (!it.manufacturer) it.manufacturer = vaccine.manufacturer || ''
  }
  it.dropdownOpen = false
}

function onSelectVaccine(it) {
  if (!it.vaccine_id) return
  const v = vaccineTypes.value.find(x => String(x.id) === String(it.vaccine_id))
  if (v) {
    it.antigen_name = v.antigen_name || ''
    it.brand_name = v.brand_name || ''
    if (!it.manufacturer) it.manufacturer = v.manufacturer || ''
  }
}

async function fetchReport() {
  if (!id.value) return
  try {
    const { data } = await api.get(`/receiving-reports/${id.value}`)
    form.value = data.data.header
    const arr = data.data.items || []
    reportItemsCache.value = arr
    items.value = arr.map(x => ({
      item_id: x.item_id,
      vaccine_id: x.vaccine_id,
      vaccine_search: x.vaccine_id ? `${x.antigen_name || x.vaccinemaster?.antigen_name || ''} (${x.brand_name || x.vaccinemaster?.brand_name || ''})` : '',
      dropdownOpen: false,
      inputRef: null,
      dropdownPosition: {},
      antigen_name: x.antigen_name || x.vaccinemaster?.antigen_name || '',
      brand_name: x.brand_name || x.vaccinemaster?.brand_name || '',
      manufacturer: x.manufacturer || x.vaccinemaster?.manufacturer || '',
      lot_number: x.lot_number,
      expiration_date: x.expiration_date,
      quantity_received: Number(x.quantity_received) || 0,
      storage_location: x.storage_location,
      is_deleted: false
    }))
  } catch (e) {
    console.error('Failed to load report', e)
    addToast({ title: 'Error', message: 'Failed to load report', type: 'error' })
  }
}

async function save() {
  try {
    saving.value = true
    const payload = {
      delivery_date: toISO(form.value.delivery_date),
      delivered_by: form.value.delivered_by,
      supplier_notes: form.value.supplier_notes,
      items: visibleItems.value.map(it => ({ 
        ...it, 
        expiration_date: toISO(it.expiration_date),
        quantity_received: Number(it.quantity_received) || 0
      }))
    }
    
    if (isNew.value) {
      const { data } = await api.post('/receiving-reports', payload)
      form.value = data.data.header || data.data
      const arr = data.data.items || []
      items.value = arr.map(x => ({
        item_id: x.item_id,
        vaccine_id: x.vaccine_id,
        antigen_name: x.antigen_name || x.vaccinemaster?.antigen_name || '',
        brand_name: x.brand_name || x.vaccinemaster?.brand_name || '',
        manufacturer: x.manufacturer || x.vaccinemaster?.manufacturer || '',
        lot_number: x.lot_number,
        expiration_date: x.expiration_date,
        quantity_received: Number(x.quantity_received) || 0,
        storage_location: x.storage_location,
        is_deleted: false
      }))
      addToast({ title: 'Created', message: `Report ${(data.data.header || data.data).report_number} created with ${items.value.length} items.`, type: 'success' })
      // Navigate to edit URL
      router.replace({ name: 'ReceivingReportView', params: { id: form.value.report_id } })
    } else {
      const { data } = await api.put(`/receiving-reports/${form.value.report_id}`, payload)
      form.value = data.data.header || data.data
      const arr = data.data.items || []
      items.value = arr.map(x => ({
        item_id: x.item_id,
        vaccine_id: x.vaccine_id,
        antigen_name: x.antigen_name || x.vaccinemaster?.antigen_name || '',
        brand_name: x.brand_name || x.vaccinemaster?.brand_name || '',
        manufacturer: x.manufacturer || x.vaccinemaster?.manufacturer || '',
        lot_number: x.lot_number,
        expiration_date: x.expiration_date,
        quantity_received: Number(x.quantity_received) || 0,
        storage_location: x.storage_location,
        is_deleted: false
      }))
      addToast({ title: 'Saved', message: 'Report and items updated.', type: 'success' })
    }
  } catch (e) {
    console.error('Failed to save report', e)
    addToast({ title: 'Error', message: 'Failed to save report', type: 'error' })
  } finally {
    saving.value = false
  }
}

function openCompleteConfirm() {
  const itemsCount = Number(form.value.total_items || visibleItems.value.length || 0)
  const totalQty = Number(form.value.total_quantity || visibleItems.value.reduce((s, x) => s + (Number(x.quantity_received) || 0), 0) || 0)
  completeSummary.value = { items: itemsCount, quantity: totalQty }
  showCompleteModal.value = true
}

async function confirmComplete() {
  try {
    completing.value = true
    await api.post(`/receiving-reports/${form.value.report_id}/complete`)
    addToast({ title: 'Completed', message: 'Report completed and inventory created.', type: 'success' })
    // Reload and check for incomplete vaccine details
    const { data } = await api.get(`/receiving-reports/${form.value.report_id}`)
    const arr = data.data.items || []
    reportItemsCache.value = arr
    const byVaccine = new Map()
    for (const it of arr) {
      const vm = it.vaccinemaster || {}
      const incomplete = !vm.disease_prevented || !vm.vaccine_type || !vm.category || (vm.vaccine_type === 'inactivated' && !vm.disease_prevented)
      if (incomplete && it.vaccine_id) {
        const key = String(it.vaccine_id)
        if (!byVaccine.has(key)) {
          byVaccine.set(key, {
            vaccine_id: it.vaccine_id,
            antigen_name: vm.antigen_name || it.antigen_name || '',
            brand_name: vm.brand_name || it.brand_name || '',
            manufacturer: vm.manufacturer || it.manufacturer || '',
            disease_prevented: vm.disease_prevented || '',
            vaccine_type: vm.vaccine_type || 'inactivated',
            category: vm.category || 'VACCINE',
            default_storage_location: ''
          })
        }
      }
    }
    detailsForms.value = Array.from(byVaccine.values())
    showCompleteModal.value = false
    form.value.status = 'COMPLETED'
    if (detailsForms.value.length > 0) {
      showDetailsModal.value = true
    }
  } catch (e) {
    console.error('Failed to complete report', e)
    addToast({ title: 'Error', message: 'Failed to complete report', type: 'error' })
  } finally {
    completing.value = false
  }
}

function openCancelConfirm() {
  cancelReason.value = ''
  showCancelModal.value = true
}

async function confirmCancel() {
  try {
    cancelling.value = true
    await api.post(`/receiving-reports/${form.value.report_id}/cancel`, { reason: cancelReason.value || null })
    addToast({ title: 'Cancelled', message: 'Report cancelled.', type: 'success' })
    form.value.status = 'CANCELLED'
    showCancelModal.value = false
  } catch (e) {
    console.error('Failed to cancel report', e)
    addToast({ title: 'Error', message: 'Failed to cancel report', type: 'error' })
  } finally {
    cancelling.value = false
  }
}

async function saveCompletedDetails() {
  try {
    for (const f of detailsForms.value) {
      const payload = {
        antigen_name: f.antigen_name,
        brand_name: f.brand_name,
        manufacturer: f.manufacturer,
        disease_prevented: f.disease_prevented,
        vaccine_type: f.vaccine_type,
        category: f.category
      }
      await api.put(`/vaccines/${f.vaccine_id}`, payload)

      if (f.default_storage_location) {
        const related = (reportItemsCache.value || []).filter(x => String(x.vaccine_id) === String(f.vaccine_id) && x.inventory_id)
        for (const it of related) {
          await api.put(`/vaccines/inventory/${it.inventory_id}`, { storage_location: f.default_storage_location })
        }
      }
    }
    addToast({ title: 'Updated', message: 'Vaccine details saved.', type: 'success' })
    showDetailsModal.value = false
  } catch (e) {
    console.error('Failed updating vaccine details', e)
    addToast({ title: 'Error', message: 'Failed to save vaccine details', type: 'error' })
  }
}

onMounted(async () => {
  await loadVaccineTypes()
  if (isNew.value) {
    // default date to today (MM/DD/YYYY for DateInput that outputs normalized string)
    const today = new Date()
    form.value.delivery_date = today.toLocaleDateString('en-US')
  } else {
    await fetchReport()
  }
})
</script>

<style scoped>
.modal.show { background: rgba(0,0,0,.5); }
.qty-group { max-width: 220px; }
.qty-group .btn { padding: .4rem .6rem; font-size: 1rem; }
.qty-input { max-width: 120px; font-size: 1.05rem; height: 42px; }
.qty-group .btn, .qty-group .form-control { height: 42px; }

.table-expanded {
  width: 100%;
  table-layout: fixed;
}

.table-expanded td,
.table-expanded th {
  white-space: normal;
  word-wrap: break-word;
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
</style>
