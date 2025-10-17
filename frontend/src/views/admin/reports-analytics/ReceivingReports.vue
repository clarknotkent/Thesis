<template>
  <AdminLayout>
    <div class="container-fluid">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 class="h3 mb-0 text-gray-800">Receiving Reports</h1>
          <p class="text-muted mb-0">Record deliveries and convert to inventory</p>
        </div>
        <div>
          <button class="btn btn-primary" @click="openCreate">New Receiving Report</button>
        </div>
      </div>

      <div class="card shadow mb-4">
        <div class="card-header py-3 d-flex justify-content-between align-items-center">
          <h6 class="m-0 fw-bold text-primary">Reports</h6>
          <div class="d-flex align-items-center gap-2">
            <input class="form-control" placeholder="Search RR-..." v-model="search" @input="fetchList" style="max-width: 240px;" />
            <select class="form-select" v-model="status" @change="fetchList" style="max-width: 180px;">
              <option value="">All Status</option>
              <option value="DRAFT">Draft</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            <button class="btn btn-outline-secondary" @click="fetchList" title="Refresh"><i class="bi bi-arrow-clockwise"></i></button>
          </div>
        </div>
        <div class="card-body">
          <div v-if="loading" class="text-center py-4">
            <div class="spinner-border text-primary" role="status" />
          </div>
          <div v-else class="table-responsive">
            <table class="table table-hover table-striped">
              <thead class="table-light">
                <tr>
                  <th>Report #</th>
                  <th>Delivery Date</th>
                  <th>Delivered By</th>
                  <th>Received By</th>
                  <th>Total Items</th>
                  <th>Total Qty</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="r in list.items" :key="r.report_id" @click="viewReport(r)" style="cursor:pointer;">
                  <td class="fw-semibold">{{ r.report_number }}</td>
                  <td>{{ formatDate(r.delivery_date) }}</td>
                  <td>{{ r.delivered_by }}</td>
                  <td>{{ r.received_by_name || '-' }}</td>
                  <td>{{ r.total_items || 0 }}</td>
                  <td>{{ r.total_quantity || 0 }}</td>
                  <td>
                    <span class="badge" :class="badgeClass(r.status)">{{ r.status }}</span>
                  </td>
                  <td>
                    <div class="btn-group btn-group-sm">
                      <button class="btn btn-outline-primary" @click.stop="viewReport(r)"><i class="bi bi-eye"></i></button>
                      <button class="btn btn-outline-success" :disabled="r.status!=='DRAFT'" @click.stop="openComplete(r)"><i class="bi bi-check2-circle"></i></button>
                      <button class="btn btn-outline-danger" :disabled="r.status!=='DRAFT'" @click.stop="openCancel(r)"><i class="bi bi-x-circle"></i></button>
                    </div>
                  </td>
                </tr>
                <tr v-if="(list.items||[]).length===0">
                  <td colspan="8" class="text-center text-muted py-4">No receiving reports found</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Create/Edit Modal -->
      <div class="modal fade" :class="{ show: showModal }" :style="{ display: showModal ? 'block':'none' }" tabindex="-1">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">{{ form.report_id ? 'Edit' : 'New' }} Receiving Report</h5>
              <button class="btn-close" @click="closeModal"></button>
            </div>
            <div class="modal-body">
              <form id="rr-form" @submit.prevent>
                <div class="row g-3">
                  <div class="col-md-6">
                    <label class="form-label">Delivery Date *</label>
                    <DateInput v-model="form.delivery_date" :disabled="form.status === 'COMPLETED'" />
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Delivered By *</label>
                    <input class="form-control" v-model="form.delivered_by" :disabled="form.status === 'COMPLETED'" required />
                  </div>
                  <div class="col-12">
                    <label class="form-label">Supplier Notes</label>
                    <textarea class="form-control" rows="2" v-model="form.supplier_notes" :disabled="form.status === 'COMPLETED'"></textarea>
                  </div>
                </div>
              </form>
              <hr />
              <div>
                    <div class="d-flex justify-content-between align-items-center mb-2">
                      <h6 class="m-0">
                        Items
                        <small class="text-muted ms-2">
                          ({{ Number(form.total_items || items.filter(it => !it.is_deleted).length) }} items · {{ Number(form.total_quantity || items.filter(it => !it.is_deleted).reduce((s,i)=> s + (Number(i.quantity_received)||0), 0)) }} total)
                        </small>
                      </h6>
                  <button v-if="form.status !== 'COMPLETED'" class="btn btn-sm btn-outline-primary" @click="addItemRow"><i class="bi bi-plus"></i> Add Item</button>
                </div>
                <div class="table-responsive">
                  <table class="table table-sm align-middle table-striped">
                    <thead>
                      <tr>
                        <th style="width: 18%; min-width: 150px;">Vaccine (existing)</th>
                        <th style="width: 14%; min-width: 120px;">Antigen</th>
                        <th style="width: 14%; min-width: 120px;">Brand</th>
                        <th style="width: 14%; min-width: 120px;">Manufacturer</th>
                        <th style="width: 12%; min-width: 100px;">Lot #</th>
                        <th style="width: 12%; min-width: 100px;">Expiry</th>
                        <th style="width: 14%; min-width: 120px;">Storage</th>
                        <th style="width: 10%; min-width: 80px;"></th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(it, idx) in items.filter(it => !it.is_deleted)" :key="it.item_id || idx">
                        <td>
                          <select class="form-select form-select-sm" v-model="it.vaccine_id" @change="onSelectVaccine(it)" :disabled="form.status === 'COMPLETED'">
                            <option value="">New / Not in list…</option>
                            <option v-for="v in vaccineTypes" :key="v.id" :value="v.id">{{ v.antigen_name }} ({{ v.brand_name }})</option>
                          </select>
                        </td>
                        <td>
                          <input class="form-control form-control-sm" v-model="it.antigen_name" list="antigenList" :disabled="form.status === 'COMPLETED' || !!it.vaccine_id" placeholder="e.g., DTP" />
                        </td>
                        <td>
                          <input class="form-control form-control-sm" v-model="it.brand_name" list="brandList" :disabled="form.status === 'COMPLETED' || !!it.vaccine_id" placeholder="Brand" />
                        </td>
                        <td><input class="form-control form-control-sm" v-model="it.manufacturer" list="mfgList" :disabled="form.status === 'COMPLETED'" /></td>
                        <td><input class="form-control form-control-sm" v-model="it.lot_number" :disabled="form.status === 'COMPLETED'" /></td>
                        <td><DateInput v-model="it.expiration_date" small :disabled="form.status === 'COMPLETED'" /></td>
                        <td>
                          <div class="input-group qty-group">
                            <button class="btn btn-outline-secondary" type="button" title="Decrease" @click="it.quantity_received = Math.max(1, (Number(it.quantity_received)||1) - 1)" :disabled="form.status === 'COMPLETED'">-</button>
                            <input type="number" min="1" step="1" inputmode="numeric" aria-label="Quantity" class="form-control text-center qty-input" v-model.number="it.quantity_received" :disabled="form.status === 'COMPLETED'" />
                            <button class="btn btn-outline-secondary" type="button" title="Increase" @click="it.quantity_received = (Number(it.quantity_received)||0) + 1" :disabled="form.status === 'COMPLETED'">+</button>
                          </div>
                        </td>
                        <td><input class="form-control form-control-sm" v-model="it.storage_location" list="storageList" :disabled="form.status === 'COMPLETED'" /></td>
                        <td>
                          <button v-if="form.status !== 'COMPLETED'" class="btn btn-sm btn-outline-danger" @click="it.is_deleted = true"><i class="bi bi-trash"></i></button>
                        </td>
                      </tr>
                      <tr v-if="items.length===0"><td colspan="8" class="text-center text-muted">No items yet</td></tr>
                    </tbody>
                  </table>
                  <datalist id="antigenList">
                    <option v-for="a in antigenOptions" :key="a" :value="a" />
                  </datalist>
                  <datalist id="brandList">
                    <option v-for="b in brandOptions" :key="b" :value="b" />
                  </datalist>
                  <datalist id="mfgList">
                    <option v-for="m in manufacturerOptions" :key="m" :value="m" />
                  </datalist>
                  <datalist id="storageList">
                    <option v-for="s in storageOptions" :key="s" :value="s" />
                  </datalist>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" @click="closeModal">Close</button>
              <button v-if="form.status !== 'COMPLETED'" class="btn btn-success" @click="saveReport" :disabled="saving">{{ form.report_id ? 'Save' : 'Create' }} Report</button>
              <button v-if="form.status === 'DRAFT'" class="btn btn-primary" @click="openComplete(form)" :disabled="!form.report_id || saving">Complete</button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="showModal" class="modal-backdrop fade show" />

      <!-- Complete Vaccine Details Modal -->
      <div class="modal fade" :class="{ show: showDetailsModal }" :style="{ display: showDetailsModal ? 'block' : 'none' }" tabindex="-1">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Complete Vaccine Details</h5>
              <button class="btn-close" @click="showDetailsModal = false"></button>
            </div>
            <div class="modal-body">
              <p class="text-muted">Some vaccines created from this receiving report are missing details. Please review and complete them.</p>
              <div v-for="(f, idx) in detailsForms" :key="f.vaccine_id" class="border rounded p-3 mb-3">
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

      <!-- Confirm Complete Modal -->
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
                <li><strong>Items:</strong> {{ (completeSummary.items || 0) }}</li>
                <li><strong>Total Qty:</strong> {{ (completeSummary.quantity || 0) }}</li>
              </ul>
              <small class="text-muted">You can still update vaccine master details afterward if prompted.</small>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" @click="showCompleteModal = false">Cancel</button>
              <button class="btn btn-primary" @click="confirmComplete" :disabled="completing">Complete Now</button>
            </div>
          </div>
        </div>
      </div>
      <div v-if="showCompleteModal" class="modal-backdrop fade show" />

      <!-- Cancel Report Modal -->
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
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import DateInput from '@/components/common/DateInput.vue'
import api from '@/services/api'
import { useToast } from '@/composables/useToast'

const { addToast } = useToast()

const loading = ref(false)
const list = ref({ items: [], totalCount: 0, totalPages: 0 })
const status = ref('')
const search = ref('')

const showModal = ref(false)
const saving = ref(false)
const form = ref({ report_id: null, delivery_date: '', delivered_by: '', supplier_notes: '' })
const items = ref([])
const vaccineTypes = ref([])
const manufacturerOptions = ref([])
const antigenOptions = ref([])
const brandOptions = ref([])
const storageOptions = ref(['Cold Room A', 'Cold Room B', 'Refrigerator 1', 'Refrigerator 2', 'Freezer -20C', 'Freezer -80C'])
// Post-completion: complete vaccine details
const showDetailsModal = ref(false)
const detailsForms = ref([]) // [{ vaccine_id, antigen_name, brand_name, manufacturer, disease_prevented, vaccine_type, category, default_storage_location }]
const reportItemsCache = ref([]) // keep items from last loaded report
const vaccineTypeOptions = ['inactivated','live-attenuated','toxoid','mrna','viral-vector','conjugate','subunit','other']
const categoryOptions = ['VACCINE','DEWORMING','VITAMIN_A']

// New: confirmation/cancel modals state
const showCompleteModal = ref(false)
const completing = ref(false)
const completeTargetId = ref(null)
const completeSummary = ref({ items: 0, quantity: 0 })

const showCancelModal = ref(false)
const cancelling = ref(false)
const cancelTargetId = ref(null)
const cancelReason = ref('')

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-PH', { timeZone: 'Asia/Manila' }) : ''
const badgeClass = (s) => ({ DRAFT: 'bg-secondary', COMPLETED: 'bg-success', CANCELLED: 'bg-danger' }[s] || 'bg-secondary')

async function fetchList() {
  loading.value = true
  try {
    const { data } = await api.get('/receiving-reports', { params: { status: status.value, search: search.value, page: 1, limit: 20 } })
    list.value = data.data || data
  } catch (e) {
    console.error('Failed to load receiving reports', e)
    list.value = { items: [], totalCount: 0, totalPages: 0 }
  } finally {
    loading.value = false
  }
}

async function loadVaccineTypes() {
  try {
    const res = await api.get('/vaccines')
    const arr = res.data?.data || res.data || []
    vaccineTypes.value = (Array.isArray(arr) ? arr : arr.vaccines || []).map(v => ({ id: v.vaccine_id || v.id, antigen_name: v.antigen_name, brand_name: v.brand_name, manufacturer: v.manufacturer }))
    manufacturerOptions.value = [...new Set(vaccineTypes.value.map(v => v.manufacturer).filter(Boolean))]
    antigenOptions.value = [...new Set(vaccineTypes.value.map(v => v.antigen_name).filter(Boolean))]
    brandOptions.value = [...new Set(vaccineTypes.value.map(v => v.brand_name).filter(Boolean))]
  } catch (e) {
    vaccineTypes.value = []
    manufacturerOptions.value = []
    antigenOptions.value = []
    brandOptions.value = []
  }
}

function openCreate() {
  const today = new Date()
  form.value = { 
    report_id: null, 
    delivery_date: today.toLocaleDateString('en-US'), // MM/DD/YYYY
    delivered_by: '', 
    supplier_notes: '',
    received_by: null // will be set to userId on create
  }
  items.value = []
  showModal.value = true
}

function closeModal() {
  showModal.value = false
}

async function saveReport() {
  try {
    saving.value = true
    if (!form.value.report_id) {
      const payload = { 
        delivery_date: toISO(form.value.delivery_date), 
        delivered_by: form.value.delivered_by, 
        supplier_notes: form.value.supplier_notes,
        items: items.value.filter(it => !it.is_deleted).map(it => ({ ...it, expiration_date: toISO(it.expiration_date) }))
      }
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
        quantity_received: x.quantity_received,
        storage_location: x.storage_location,
        is_deleted: false
      }))
      addToast({ title: 'Created', message: `Report ${(data.data.header || data.data).report_number} created with ${items.value.length} items.`, type: 'success' })
    } else {
      const payload = { delivery_date: toISO(form.value.delivery_date), delivered_by: form.value.delivered_by, supplier_notes: form.value.supplier_notes, items: items.value.filter(it => !it.is_deleted).map(it => ({ ...it, expiration_date: toISO(it.expiration_date) })) }
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
        quantity_received: x.quantity_received,
        storage_location: x.storage_location,
        is_deleted: false
      }))
      addToast({ title: 'Saved', message: 'Report and items updated.', type: 'success' })
    }
    await fetchList()
  } catch (e) {
    console.error('Failed to save report', e)
    // If update fails because report doesn't exist, reset to allow creating new
    if (form.value.report_id && (e.response?.status === 404 || (e.response?.data?.message && e.response.data.message.includes('result contains 0 rows')))) {
      form.value.report_id = null
      addToast({ title: 'Report not found', message: 'The report may have been deleted. Please create a new one.', type: 'warning' })
    } else {
      addToast({ title: 'Error', message: 'Failed to save report', type: 'error' })
    }
  } finally {
    saving.value = false
  }
}

function addItemRow() {
  items.value.push({ item_id: null, vaccine_id: '', antigen_name: '', brand_name: '', manufacturer: '', lot_number: '', expiration_date: new Date().toISOString().split('T')[0], quantity_received: 1, storage_location: '', is_deleted: false })
}

function toISO(dateStr) {
  if (!dateStr) return null
  if (dateStr.includes('-')) {
    // Already yyyy-mm-dd
    return dateStr
  }
  // Assume mm/dd/yyyy
  const [m, d, y] = String(dateStr).split('/')
  if (!m || !d || !y) return null
  return `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`
}

async function saveItem(it) {
  if (!form.value.report_id) return
  try {
    savingItem.value = true
    const payload = { ...it, expiration_date: toISO(it.expiration_date) }
    // Basic guard: either select an existing vaccine or provide antigen+brand
    if (!payload.vaccine_id && !(payload.antigen_name && payload.brand_name)) {
      addToast({ title: 'Missing vaccine', message: 'Select a vaccine or provide Antigen and Brand.', type: 'warning' })
      return
    }
    if (it.item_id) {
      // Update existing item
      await api.put(`/receiving-reports/${form.value.report_id}/items/${it.item_id}`, payload)
      addToast({ title: 'Saved', message: 'Item updated', type: 'success' })
    } else {
      // Add new item
      await api.post(`/receiving-reports/${form.value.report_id}/items`, payload)
      addToast({ title: 'Saved', message: 'Item added to report', type: 'success' })
    }
    // refresh header + items from backend to reflect canonical state
    const { data } = await api.get(`/receiving-reports/${form.value.report_id}`)
    form.value = data.data.header
    const arr = data.data.items || []
    reportItemsCache.value = arr
    items.value = arr.map(x => ({
      item_id: x.item_id,
      vaccine_id: x.vaccine_id,
      antigen_name: x.antigen_name || x.vaccinemaster?.antigen_name || '',
      brand_name: x.brand_name || x.vaccinemaster?.brand_name || '',
      manufacturer: x.manufacturer || x.vaccinemaster?.manufacturer || '',
      lot_number: x.lot_number,
      expiration_date: x.expiration_date,
      quantity_received: x.quantity_received,
      storage_location: x.storage_location
    }))
  } catch (e) {
    console.error('Failed to save item', e)
    addToast({ title: 'Error', message: 'Failed to save item', type: 'error' })
  } finally {
    savingItem.value = false
  }
}
async function viewReport(r) {
  try {
    const { data } = await api.get(`/receiving-reports/${r.report_id}`)
    form.value = data.data.header
    const arr = data.data.items || []
    reportItemsCache.value = arr
    items.value = arr.map(x => ({
      item_id: x.item_id,
      vaccine_id: x.vaccine_id,
      antigen_name: x.antigen_name || x.vaccinemaster?.antigen_name || '',
      brand_name: x.brand_name || x.vaccinemaster?.brand_name || '',
      manufacturer: x.manufacturer || x.vaccinemaster?.manufacturer || '',
      lot_number: x.lot_number,
      expiration_date: x.expiration_date,
      quantity_received: x.quantity_received,
      storage_location: x.storage_location,
      is_deleted: false
    }))
    showModal.value = true
  } catch (e) {
    console.error('Failed to load report', e)
  }
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

async function doComplete(id) {
  try {
    await api.post(`/receiving-reports/${id}/complete`)
    addToast({ title: 'Completed', message: 'Report completed and inventory created.', type: 'success' })
    // Load the report details and check if any vaccines need details
    const { data } = await api.get(`/receiving-reports/${id}`)
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
    showModal.value = false
    await fetchList()
    if (detailsForms.value.length > 0) {
      showDetailsModal.value = true
    }
  } catch (e) {
    console.error('Failed to complete report', e)
    addToast({ title: 'Error', message: 'Failed to complete report', type: 'error' })
  }
}

function openComplete(r) {
  const id = r.report_id || form.value.report_id
  completeTargetId.value = id
  // Best-effort summary from header if present, else fallback to last cache or zeros
  const itemsCount = Number(r.total_items || form.value.total_items || (reportItemsCache.value || []).length || 0)
  const totalQty = Number(r.total_quantity || form.value.total_quantity || (reportItemsCache.value || []).reduce((s, x) => s + (Number(x.quantity_received) || 0), 0) || 0)
  completeSummary.value = { items: itemsCount, quantity: totalQty }
  showCompleteModal.value = true
}

async function confirmComplete() {
  if (!completeTargetId.value) return
  try {
    completing.value = true
    await doComplete(completeTargetId.value)
    showCompleteModal.value = false
  } finally {
    completing.value = false
  }
}

function openCancel(r) {
  cancelTargetId.value = r.report_id || form.value.report_id
  cancelReason.value = ''
  showCancelModal.value = true
}

async function confirmCancel() {
  if (!cancelTargetId.value) return
  try {
    cancelling.value = true
    await api.post(`/receiving-reports/${cancelTargetId.value}/cancel`, { reason: cancelReason.value || null })
    addToast({ title: 'Cancelled', message: 'Report cancelled.', type: 'success' })
    showCancelModal.value = false
    showModal.value = false
    await fetchList()
  } catch (e) {
    console.error('Failed to cancel report', e)
    addToast({ title: 'Error', message: 'Failed to cancel report', type: 'error' })
  } finally {
    cancelling.value = false
  }
}

onMounted(async () => {
  await loadVaccineTypes()
  await fetchList()
})

async function saveCompletedDetails() {
  try {
    for (const f of detailsForms.value) {
      // Update vaccine master
      const payload = {
        antigen_name: f.antigen_name,
        brand_name: f.brand_name,
        manufacturer: f.manufacturer,
        disease_prevented: f.disease_prevented,
        vaccine_type: f.vaccine_type,
        category: f.category
      }
      await api.put(`/vaccines/${f.vaccine_id}`, payload)

      // Optionally update storage location for inventory entries created by this report for this vaccine
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

// Helpers
</script>

<style scoped>
.modal.show { background: rgba(0,0,0,.5); }
/* Quantity input group styles */
.qty-group { max-width: 220px; }
.qty-group .btn { padding: .4rem .6rem; font-size: 1rem; }
.qty-input { max-width: 120px; font-size: 1.05rem; height: 42px; }
/* Ensure button heights match the input */
.qty-group .btn, .qty-group .form-control { height: 42px; }
@media (max-width: 768px) {
  .qty-group { max-width: 100%; }
}
/* Tweak small table cell spacing */
table.table-sm td, table.table-sm th { vertical-align: middle; }
 </style>
