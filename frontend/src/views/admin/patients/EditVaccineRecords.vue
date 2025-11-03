<template>
  <AdminLayout>
    <div class="container-fluid py-3">
      <!-- Breadcrumb -->
      <nav aria-label="breadcrumb" class="mb-3">
        <ol class="breadcrumb">
          <li class="breadcrumb-item"><router-link to="/admin/dashboard">Dashboard</router-link></li>
          <li class="breadcrumb-item"><router-link to="/admin/patients">Patient Records</router-link></li>
          <li class="breadcrumb-item"><router-link :to="`/admin/patients/view/${patientId}`">Patient Details</router-link></li>
          <li class="breadcrumb-item active" aria-current="page">Edit Vaccination Records</li>
        </ol>
      </nav>

      <!-- Header -->
      <div class="d-flex align-items-center mb-4">
        <div>
          <h3 class="mb-1">
            <i class="bi bi-pencil-square me-2"></i>{{ vaccineName }} - Vaccination Records
          </h3>
          <p class="text-muted mb-0" v-if="patientData">
            Patient: <strong>{{ patientData.firstname }} {{ patientData.surname }}</strong>
          </p>
        </div>
        <button class="btn btn-outline-secondary ms-auto" @click="goBack">
          <i class="bi bi-arrow-left me-2"></i>Back
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="text-muted mt-3">Loading vaccination records...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="alert alert-danger">
        <i class="bi bi-exclamation-circle me-2"></i>
        {{ error }}
      </div>

      <!-- Edit Form -->
      <div v-else class="card shadow-sm">
        <div class="card-body p-4">
          <!-- Vaccine Info Card -->
          <div class="alert alert-info mb-4">
            <div class="row">
              <div class="col-md-6">
                <strong>Disease Prevented:</strong> {{ diseasePrevented }}
              </div>
              <div class="col-md-6">
                <strong>Total Doses Administered:</strong> {{ doseRecords.length }}
              </div>
            </div>
          </div>

          <!-- Dose Records -->
          <form @submit.prevent="handleSubmit">
            <div v-for="(dose, index) in doseRecords" :key="dose.id" class="dose-card mb-4">
              <div class="dose-header">
                <div class="d-flex justify-content-between align-items-center">
                  <span class="badge bg-primary">Dose {{ dose.doseNumber }}</span>
                  <span class="badge" :class="dose.isOutside ? 'bg-warning text-dark' : 'bg-success'">
                    <i class="bi" :class="dose.isOutside ? 'bi-geo-alt' : 'bi-building'"></i>
                    {{ dose.isOutside ? 'Outside' : 'In-facility' }}
                  </span>
                </div>
              </div>
              
              <div class="row g-3 mt-2">
                <!-- Vaccine Inventory Selection -->
                <div class="col-md-6" v-if="!dose.isOutside">
                  <label class="form-label">Vaccine Inventory: <span class="text-danger">*</span></label>
                  <SearchableSelect
                    v-model="dose.selectedInventoryId"
                    :options="dose.inventoryOptions || []"
                    placeholder="Select vaccine inventory"
                    label-key="displayLabel"
                    value-key="id"
                    :max-results="0"
                    :required="true"
                    @update:modelValue="onInventoryChange(index, $event)"
                  />
                  <small class="text-muted">Select vaccine inventory to update manufacturer and lot number</small>
                </div>

                <!-- Date Administered -->
                <div class="col-md-6">
                  <label class="form-label">Date Administered: <span class="text-danger">*</span></label>
                  <DateInput
                    v-model="dose.dateAdministered"
                    :required="true"
                    @update:modelValue="calculateAge(index)"
                  />
                </div>

                <!-- Age at Administration -->
                <div class="col-md-6">
                  <label class="form-label">Age at Administration:</label>
                  <input 
                    type="text" 
                    class="form-control" 
                    v-model="dose.ageAtAdministration"
                    readonly
                  >
                  <small class="text-muted">Automatically calculated</small>
                </div>

                <!-- Administered By -->
                <div class="col-md-6" v-if="!dose.isOutside">
                  <label class="form-label">Administered By: <span class="text-danger">*</span></label>
                  <SearchableSelect
                    v-model="dose.administeredBy"
                    :options="healthWorkers"
                    placeholder="Select health worker"
                    label-key="name"
                    value-key="user_id"
                    :required="true"
                    :disabled="true"
                  />
                  <small class="text-muted">Cannot be edited for existing records</small>
                </div>
                <div class="col-md-6" v-else>
                  <label class="form-label">Administered By:</label>
                  <input 
                    type="text" 
                    class="form-control" 
                    v-model="dose.administeredByDisplay"
                    placeholder="Name of vaccinator or provider"
                  >
                  <small class="text-muted">Editable for outside records; included in remarks on save</small>
                </div>

                <!-- Site of Administration -->
                <div class="col-md-6">
                  <label class="form-label">Site of Administration:</label>
                  <input 
                    type="text" 
                    class="form-control" 
                    v-model="dose.siteOfAdministration"
                    placeholder="e.g., Left deltoid, Right thigh"
                  >
                </div>

                <!-- Facility Name -->
                <div class="col-md-6">
                  <label class="form-label">Facility Name:</label>
                  <input 
                    type="text" 
                    class="form-control" 
                    v-model="dose.facilityName"
                  >
                </div>

                <!-- Manufacturer -->
                <div class="col-md-6">
                  <label class="form-label">Manufacturer:</label>
                  <input 
                    type="text" 
                    class="form-control" 
                    v-model="dose.manufacturer"
                    placeholder="Vaccine manufacturer"
                    :readonly="!dose.isOutside"
                  >
                  <small class="text-muted" v-if="!dose.isOutside">Auto-filled from selected inventory</small>
                  <small class="text-muted" v-else>Editable for outside records; included in remarks on save</small>
                </div>

                <!-- Lot Number -->
                <div class="col-md-6">
                  <label class="form-label">Lot Number:</label>
                  <input 
                    type="text" 
                    class="form-control" 
                    v-model="dose.lotNumber"
                    placeholder="Vaccine lot/batch number"
                    :readonly="!dose.isOutside"
                  >
                  <small class="text-muted" v-if="!dose.isOutside">Auto-filled from selected inventory</small>
                  <small class="text-muted" v-else>Editable for outside records; included in remarks on save</small>
                </div>

                <!-- Remarks -->
                <div class="col-12">
                  <label class="form-label">Remarks:</label>
                  <textarea 
                    class="form-control" 
                    v-model="dose.remarks"
                    rows="2"
                    placeholder="Additional notes or observations"
                  ></textarea>
                </div>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
              <button 
                type="button" 
                class="btn btn-outline-secondary"
                @click="goBack"
                :disabled="saving"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                class="btn btn-primary"
                :disabled="saving || !isFormValid"
              >
                <span v-if="saving">
                  <span class="spinner-border spinner-border-sm me-2" role="status"></span>
                  Saving...
                </span>
                <span v-else>
                  <i class="bi bi-check-circle me-2"></i>Save All Changes
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </AdminLayout>
  <!-- Approval modal for second approver (admin/staff, not current user, not guardian/BHS) -->
  <ApprovalModal v-if="showApproval" @approved="onApproverApproved" @cancel="onApproverCancel" />
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AdminLayout from '@/components/layout/desktop/AdminLayout.vue'
import DateInput from '@/components/ui/form/DateInput.vue'
import SearchableSelect from '@/components/ui/form/SearchableSelect.vue'
import api from '@/services/offlineAPI'
import { useToast } from '@/composables/useToast'
import ApprovalModal from '@/components/ApprovalModal.vue'

const router = useRouter()
const route = useRoute()
const { addToast } = useToast()

const patientId = computed(() => route.params.patientId)
const vaccineName = computed(() => route.query.vaccine || 'Vaccine')

const loading = ref(true)
const saving = ref(false)
const error = ref(null)
const patientData = ref(null)
const healthWorkers = ref([])
const doseRecords = ref([])
const diseasePrevented = ref('—')

const isFormValid = computed(() => {
  return doseRecords.value.every(dose => {
    const isOutside = isDoseOutside(dose)
    const hasRequiredFields = dose.dateAdministered
    const hasAdministeredBy = isOutside ? true : dose.administeredBy
    const hasInventorySelected = isOutside ? true : dose.selectedInventoryId // Outside records don't require inventory
    
    return hasRequiredFields && hasAdministeredBy && hasInventorySelected
  })
})

const goBack = () => {
  router.push({ 
    name: 'ViewPatient', 
    params: { id: patientId.value },
    hash: '#vaccinations'
  })
}

const calculateAge = (index) => {
  const dose = doseRecords.value[index]
  if (!dose.dateAdministered || !patientData.value?.date_of_birth) {
    return
  }

  const birthDate = new Date(patientData.value.date_of_birth)
  const adminDate = new Date(dose.dateAdministered)
  
  let years = adminDate.getFullYear() - birthDate.getFullYear()
  let months = adminDate.getMonth() - birthDate.getMonth()
  let days = adminDate.getDate() - birthDate.getDate()

  if (days < 0) {
    months--
    const prevMonth = new Date(adminDate.getFullYear(), adminDate.getMonth(), 0)
    days += prevMonth.getDate()
  }

  if (months < 0) {
    years--
    months += 12
  }

  const parts = []
  if (years > 0) parts.push(`${years} year${years !== 1 ? 's' : ''}`)
  if (months > 0) parts.push(`${months} month${months !== 1 ? 's' : ''}`)
  if (days > 0 && years === 0) parts.push(`${days} day${days !== 1 ? 's' : ''}`)

  dose.ageAtAdministration = parts.join(', ') || '0 days'
}

const formatDateForInput = (dateString) => {
  if (!dateString) return ''
  try {
    const date = new Date(dateString)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${month}/${day}/${year}`
  } catch (e) {
    return ''
  }
}

const formatDateForAPI = (dateString) => {
  if (!dateString) return ''
  try {
    // DateInput outputs MM/DD/YYYY, convert to YYYY-MM-DD for API
    const parts = dateString.split('/')
    if (parts.length === 3) {
      const [month, day, year] = parts
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
    }
    // If already in another format, try to parse it
    const date = new Date(dateString)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  } catch (e) {
    return dateString
  }
}

// Resolve a display name for Administered By
const getAdministeredByDisplay = (dose) => {
  if (!dose) return ''
  if (dose.isOutside) return dose.administeredByDisplay || ''
  const v = dose.administeredBy
  if (!v) return ''
  if (typeof v === 'string') return v
  const hw = Array.isArray(healthWorkers.value)
    ? healthWorkers.value.find(h => h?.user_id === v || h?.id === v)
    : null
  return hw?.name || ''
}

// Build structured remarks: main remarks + labeled fields
const buildStructuredRemarks = (dose) => {
  const main = (dose.remarks && dose.remarks.trim()) ? dose.remarks.trim() : ''
  const parts = []
  if (dose.siteOfAdministration) parts.push(`Site: ${dose.siteOfAdministration}`)
  if (dose.facilityName) parts.push(`Facility: ${dose.facilityName}`)
  const adminByName = getAdministeredByDisplay(dose)
  if (adminByName) parts.push(`Administered by: ${adminByName}`)
  if (dose.manufacturer) parts.push(`Manufacturer: ${dose.manufacturer}`)
  if (dose.lotNumber) parts.push(`Lot: ${dose.lotNumber}`)
  const finalRemarks = [main, ...parts].filter(Boolean).join(' | ')
  return finalRemarks
}

const onInventoryChange = (doseIndex, selectedInventoryId) => {
  const dose = doseRecords.value[doseIndex]
  if (!dose || !selectedInventoryId) return

  // Find the selected inventory option
  const selectedOption = dose.inventoryOptions?.find(opt => opt.id === selectedInventoryId)
  if (selectedOption) {
    // Update manufacturer and lot number from selected inventory
    dose.manufacturer = selectedOption.manufacturer || ''
    dose.lotNumber = selectedOption.lotNumber || ''
    // IMPORTANT: Do NOT overwrite dose.inventoryId here; keep original for change detection in save
    // We'll only persist the change during saveAllRecords when invChanged is true
    console.log(`Inventory changed for dose ${doseIndex}: selectedInventoryId=${selectedInventoryId}, originalInventoryId=${dose.inventoryId}`)
  }
}

const isDoseOutside = (dose) => {
  // Check if this dose was administered outside
  return !!(dose?.immunization_outside || dose?.is_outside || dose?.isOutside || dose?.outside_immunization || dose?.outside)
}

const parseRemarksForOutside = (remarks) => {
  const result = {
    site: '',
    facility: '',
    manufacturer: '',
    lot: '',
    administeredBy: '',
    otherRemarks: ''
  }

  if (!remarks) return result

  const normalize = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]+/g, '')
  const aliases = {
    site: ['site', 'injectionsite'],
    facility: ['facility', 'center', 'clinic', 'hospital', 'healthcenter', 'healthcentre'],
    manufacturer: ['manufacturer', 'mfr', 'brand'],
    lot: ['lot', 'lotnumber', 'batch'],
  administeredBy: ['administeredby', 'vaccinator', 'givenby', 'admin', 'adm', 'vaccinatedby']
  }

  const parts = remarks.split('|').map(p => p.trim()).filter(Boolean)
  const unmatched = []

  for (const part of parts) {
    // Prefer explicit label: value
    const idx = part.indexOf(':')
    if (idx > -1) {
      const labelRaw = part.slice(0, idx).trim()
      const valueRaw = part.slice(idx + 1).trim()
      const key = normalize(labelRaw)
      let handled = false

      if (aliases.site.includes(key)) {
        result.site = valueRaw
        handled = true
      } else if (aliases.facility.includes(key)) {
        result.facility = valueRaw
        handled = true
      } else if (aliases.manufacturer.includes(key)) {
        result.manufacturer = valueRaw
        handled = true
      } else if (aliases.lot.includes(key)) {
        result.lot = valueRaw
        handled = true
      } else if (aliases.administeredBy.includes(key)) {
        result.administeredBy = valueRaw
        handled = true
      }

      if (!handled) {
        // Try fuzzy: if label contains any alias
        const keyLoose = normalize(labelRaw)
        if (aliases.site.some(a => keyLoose.includes(a))) {
          result.site = valueRaw
          handled = true
        } else if (aliases.facility.some(a => keyLoose.includes(a))) {
          result.facility = valueRaw
          handled = true
        } else if (aliases.manufacturer.some(a => keyLoose.includes(a))) {
          result.manufacturer = valueRaw
          handled = true
        } else if (aliases.lot.some(a => keyLoose.includes(a))) {
          result.lot = valueRaw
          handled = true
        } else if (aliases.administeredBy.some(a => keyLoose.includes(a))) {
          result.administeredBy = valueRaw
          handled = true
        }
      }

      if (!handled) {
        unmatched.push(part)
      }
    } else {
      // No colon: keep as unmatched for now
      unmatched.push(part)
    }
  }

  // Fallback regex scan on unmatched blob for any missing fields
  const remaining = unmatched.join(' | ')
  const applyMatch = (regex, setter) => {
    const m = remaining.match(regex)
    if (m && m[1]) setter(m[1].trim())
  }
  if (!result.site) applyMatch(/(?:site|injection site)\s*[-]?\s*([^;|,\n]+)/i, (v) => (result.site = v))
  if (!result.facility) applyMatch(/(?:facility|center|clinic|hospital)\s*[-]?\s*([^;|,\n]+)/i, (v) => (result.facility = v))
  if (!result.manufacturer) applyMatch(/(?:manufacturer|mfr|brand)\s*[-]?\s*([^;|,\n]+)/i, (v) => (result.manufacturer = v))
  if (!result.lot) applyMatch(/(?:lot(?:\s*number)?|batch)\s*[-]?\s*([^;|,\n]+)/i, (v) => (result.lot = v))
  if (!result.administeredBy) applyMatch(/(?:administered\s*by|vaccinator|given\s*by)\s*[-]?\s*([^;|,\n]+)/i, (v) => (result.administeredBy = v))

  // Other remarks are what's left unmatched
  result.otherRemarks = remaining.replace(/^\s*[\(\[\{]\s*|\s*[\)\]\}]\s*$/g, '').trim()
  return result
}

const fetchPatientData = async () => {
  try {
    const response = await api.get(`/patients/${patientId.value}`)
    patientData.value = response.data.data || response.data
  } catch (err) {
    console.error('Error fetching patient data:', err)
  }
}

const fetchHealthWorkers = async () => {
  try {
    const response = await api.get('/users', { params: { role: 'health_worker' } })
    const data = response.data.data || response.data.users || response.data || []
    healthWorkers.value = Array.isArray(data) ? data : []
  } catch (err) {
    console.error('Error fetching health workers:', err)
    healthWorkers.value = []
  }
}

const fetchVaccineAndInventoryData = async () => {
  try {
    // Fetch all available vaccine inventory stocks
    try {
      const inventoryResponse = await api.get('/vaccines/inventory')
      const allInventory = inventoryResponse.data?.data || inventoryResponse.data || []
      
      // Group inventory by vaccine_id to get vaccine information
      const vaccineIds = [...new Set(allInventory.map(inv => inv.vaccine_id).filter(id => id))]
      
      // Fetch vaccine data for all vaccines that have inventory
      const vaccineData = {}
      if (vaccineIds.length > 0) {
        const vaccinePromises = vaccineIds.map(id => api.get(`/vaccines/${id}`))
        const vaccineResponses = await Promise.all(vaccinePromises)
        
        vaccineResponses.forEach((response, index) => {
          const vaccine = response.data.data || response.data
          vaccineData[vaccineIds[index]] = vaccine
        })
      }

      // Create inventory options for all doses (both in-facility and outside)
      doseRecords.value.forEach(dose => {
        // Filter inventory to only show stocks for the current vaccine antigen
        const filteredInventory = allInventory.filter(inv => {
          const vaccine = vaccineData[inv.vaccine_id] || {}
          const antigenName = inv.antigen_name || inv.antigenName || vaccine.antigen_name || vaccine.antigenName || ''
          return antigenName === vaccineName.value
        })

        // Create inventory options from filtered inventory
        dose.inventoryOptions = filteredInventory.map(inv => {
          const vaccine = vaccineData[inv.vaccine_id] || {}
          const antigenName = inv.antigen_name || inv.antigenName || vaccine.antigen_name || vaccine.antigenName || 'Unknown Antigen'
          const brandName = inv.brand_name || inv.brandName || vaccine.brand_name || vaccine.brandName || 'Unknown Brand'
          const lotNumber = inv.lot_number || inv.lotNumber || 'No Lot'
          const manufacturer = inv.vaccinemaster?.manufacturer || inv.brand_name || 'Unknown Manufacturer'
          
          return {
            id: inv.id || inv.inventory_id,
            displayLabel: `${antigenName}, ${brandName}, ${manufacturer}, ${lotNumber}`,
            lotNumber: lotNumber,
            manufacturer: manufacturer,
            expiryDate: inv.expiry_date || inv.expiryDate,
            quantity: inv.quantity || 0,
            antigenName: antigenName,
            brandName: brandName,
            vaccineId: inv.vaccine_id
          }
        })

        // For in-facility records, pre-select the current inventory if it exists
        if (!dose.isOutside && dose.inventoryId) {
          dose.selectedInventoryId = dose.inventoryId
        }

        console.log(`Dose ${dose.id} inventory options:`, dose.inventoryOptions)
      })
    } catch (invErr) {
      console.error('Error fetching all inventory:', invErr)
      // Set empty options for all doses
      doseRecords.value.forEach(dose => {
        dose.inventoryOptions = []
      })
    }

    // For existing records, ensure manufacturer and lot are populated from current inventory
    const inventoryIds = [...new Set(doseRecords.value.map(d => d.inventoryId).filter(id => id))]
    if (inventoryIds.length > 0) {
      try {
        const inventoryPromises = inventoryIds.map(id => api.get(`/vaccines/inventory/${id}`))
        const inventoryResponses = await Promise.all(inventoryPromises)
        
        const inventoryData = {}
        inventoryResponses.forEach((response, index) => {
          const inventory = response.data.data || response.data
          inventoryData[inventoryIds[index]] = inventory
           // Debug: see inventory data
        })

        // Update dose records with inventory lot number data (for records that don't have it yet)
        doseRecords.value.forEach(dose => {
          if (!dose.isOutside && dose.inventoryId && inventoryData[dose.inventoryId]) {
            const inventory = inventoryData[dose.inventoryId]
            const newLotNumber = inventory.lot_number || inventory.lotNumber || ''
            const newManufacturer = inventory.manufacturer || inventory.brand_name || ''
            if (!dose.lotNumber && newLotNumber) {
              dose.lotNumber = newLotNumber
            }
            if (!dose.manufacturer && newManufacturer) {
              dose.manufacturer = newManufacturer
            }
          }
        })
      } catch (err) {
        console.error('Error fetching inventory data:', err)
      }
    }
  } catch (err) {
    console.error('Error fetching vaccine and inventory data:', err)
  }
}

const fetchVaccinationRecords = async () => {
  try {
    loading.value = true
    error.value = null

    await fetchPatientData()
    await fetchHealthWorkers()

    // Fetch patient's vaccination history
    const response = await api.get(`/patients/${patientId.value}`)
    const patient = response.data.data || response.data
    
     // Debug: see patient data structure
    
    let vaccinations = patient.vaccinationHistory || patient.vaccination_history || patient.immunizations || []

    // If not in patient payload, fetch from immunizations endpoint
    if (!Array.isArray(vaccinations) || vaccinations.length === 0) {
      try {
        const vaccRes = await api.get('/immunizations', { params: { patient_id: patientId.value, limit: 200 } })
        vaccinations = vaccRes.data?.data || vaccRes.data?.items || vaccRes.data || []
         // Debug: see immunizations data
      } catch (e) {
        vaccinations = []
      }
    }

    // Filter vaccinations by vaccine name
    const filteredVaccinations = vaccinations.filter(v => {
      const vName = v.vaccine_antigen_name || v.vaccineName || v.antigen_name || v.antigenName || ''
      return vName === vaccineName.value
    })

    if (filteredVaccinations.length === 0) {
      error.value = 'No vaccination records found for this vaccine'
      return
    }

    // Set disease prevented from first record
    diseasePrevented.value = filteredVaccinations[0].disease_prevented || '—'

    // Sort by dose number
    filteredVaccinations.sort((a, b) => {
      const doseA = typeof a.dose_number === 'number' ? a.dose_number : parseInt(a.dose_number || a.doseNumber || a.dose) || 0
      const doseB = typeof b.dose_number === 'number' ? b.dose_number : parseInt(b.dose_number || b.doseNumber || b.dose) || 0
      return doseA - doseB
    })

    // Map to editable records
  doseRecords.value = filteredVaccinations.map(record => {
      const isOutside = isDoseOutside(record)
      const parsedRemarks = parseRemarksForOutside(record.remarks || record.notes || '')
      
       // Debug: see what backend sends
      
  const base = {
        id: record.immunization_id || record.id,
        doseNumber: record.dose_number || record.doseNumber || record.dose || '',
        dateAdministered: formatDateForInput(record.administered_date || record.date_administered || record.dateAdministered),
        ageAtAdministration: record.age_at_administration || record.ageAtAdministration || '',
        administeredBy: record.administered_by_name || record.administered_by_id || record.healthWorkerId || '',
        siteOfAdministration: parsedRemarks.site || record.site_of_administration || record.siteOfAdministration || '',
        facilityName: parsedRemarks.facility || (record.immunization_facility_name || record.facility_name || record.facilityName || record.health_center || record.healthCenter || ''),
        // Remarks: for outside, always use the cleaned main remarks (no labeled parts)
        // For in-facility, use cleaned if available, else fallback to original
        remarks: isOutside
          ? (parsedRemarks.otherRemarks ?? '')
          : (parsedRemarks.otherRemarks || (record.remarks || record.notes || '')),
        // Store original outside status
        isOutside: isOutside,
        // Store manufacturer and lot - default from record
        manufacturer: record.vaccine_manufacturer || record.manufacturer || '',
        lotNumber: record.inventory_lot_number || record.lot_number || record.lotNumber || '',
        // Store vaccine and inventory IDs for reference
        vaccineId: record.vaccine_id || record.vaccineId,
        inventoryId: record.inventory_id || record.inventoryId,
        // Inventory selection fields
        selectedInventoryId: record.inventory_id || record.inventoryId || null,
        inventoryOptions: []
      }

      // For outside records, prefill manufacturer/lot and administeredBy display from remarks
      if (isOutside) {
        if (parsedRemarks.manufacturer) base.manufacturer = parsedRemarks.manufacturer
        if (parsedRemarks.lot) base.lotNumber = parsedRemarks.lot
        base.administeredByDisplay = parsedRemarks.administeredBy || base.administeredBy || ''
      }

      return base
    })

    // Calculate ages if not set
    doseRecords.value.forEach((dose, index) => {
      if (!dose.ageAtAdministration) {
        calculateAge(index)
      }
    })

    // Fetch additional vaccine and inventory data for in-facility records
    await fetchVaccineAndInventoryData()

  } catch (err) {
    console.error('Error fetching vaccination records:', err)
    error.value = 'Failed to load vaccination records. Please try again.'
    addToast({
      title: 'Error',
      message: error.value,
      type: 'error'
    })
  } finally {
    loading.value = false
  }
}

// Approval-gated submit handler
const showApproval = ref(false)
const handleSubmit = async () => {
  if (!isFormValid.value) {
    addToast({ title: 'Warning', message: 'Please fill in all required fields', type: 'warning' })
    return
  }
  showApproval.value = true
}

// Perform save after approval
const actuallySaveAllRecords = async (approver) => {
  try {
    saving.value = true
     // Debug: save start

    // Update each dose record
    const updatePromises = doseRecords.value.map(async (dose) => {
      const isOutside = dose.isOutside
      console.log(`Processing dose ${dose.id}: isOutside=${isOutside}`) // Debug: individual dose processing
      
      // Build structured remarks for both in-facility and outside
      const remarks = buildStructuredRemarks(dose)

      console.log(`Reconstructed remarks for dose ${dose.id}:`, remarks) // Debug: reconstructed remarks

      // If inventory changed (in-facility only), adjust stock: RETURN to old, ISSUE from new
      const oldInventoryId = dose.inventoryId
      const newInventoryId = dose.selectedInventoryId || dose.inventoryId
      const invChanged = !!(newInventoryId && oldInventoryId && newInventoryId !== oldInventoryId)
      console.log(`Dose ${dose.id} inventory check: oldInventoryId=${oldInventoryId}, selectedInventoryId=${dose.selectedInventoryId}, newInventoryId=${newInventoryId}, invChanged=${invChanged}, isOutside=${isOutside}`)
      if (!isOutside && invChanged) {
        try {
          const returnRes = await api.post(`/vaccines/inventory/${oldInventoryId}/adjust`, {
            type: 'RECEIVE',
            quantity: 1,
            note: `Immunization ${dose.id}: inventory changed, return to old lot`
          })
          const issueRes = await api.post(`/vaccines/inventory/${newInventoryId}/adjust`, {
            type: 'ISSUE',
            quantity: 1,
            note: `Immunization ${dose.id}: inventory changed, issue from new lot`
          })
        } catch (adjErr) {
          console.error('Inventory adjustment failed for dose', dose.id, adjErr)
          throw adjErr
        }
      }

      const updateData = {
        administered_date: formatDateForAPI(dose.dateAdministered),
        remarks: remarks,
      }
      // Attach approver if provided (backend may ignore if not supported)
      if (approver?.user_id) {
        updateData.approved_by = approver.user_id
      }
      // Only include inventory_id when changed (to avoid unnecessary writes)
      // For outside records, do NOT update inventory_id even if selected locally
      if (!isOutside && invChanged) {
        updateData.inventory_id = newInventoryId
      }
      // Include facility_name for in-facility records
      if (!isOutside) {
        updateData.facility_name = dose.facilityName || null
      }

      // Note: administered_by, facility_name, and site_of_administration are readonly and should not be updated

      if (isOutside) {
      }
      const putRes = await api.put(`/immunizations/${dose.id}`, updateData)
      // After successful update, sync local state inventoryId if changed
      if (invChanged) {
        dose.inventoryId = newInventoryId
      }
      return putRes
    })

    await Promise.all(updatePromises)
     // Debug: all updates done

    addToast({
      title: 'Success',
      message: `All ${doseRecords.value.length} vaccination record(s) updated successfully`,
      type: 'success'
    })

    // Navigate back to patient details
    goBack()

  } catch (err) {
    console.error('Error saving vaccination records:', err)
     // Debug: error details
    addToast({
      title: 'Error',
      message: err.response?.data?.message || err.message || 'Failed to save vaccination records',
      type: 'error'
    })
  } finally {
    saving.value = false
  }
}

const onApproverApproved = async (approver) => {
  showApproval.value = false
  await actuallySaveAllRecords(approver)
}

const onApproverCancel = () => {
  showApproval.value = false
}

onMounted(() => {
  fetchVaccinationRecords()
})

</script>

<style scoped>
.card {
  border: none;
}

.form-label {
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.text-danger {
  color: #dc3545;
}

.dose-card {
  background-color: #f8f9fa;
  border: 2px solid #dee2e6;
  border-radius: 8px;
  padding: 1.5rem;
  transition: all 0.2s ease;
}

.dose-card:hover {
  border-color: #0d6efd;
  box-shadow: 0 2px 8px rgba(13, 110, 253, 0.15);
}

.dose-header {
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid #dee2e6;
}

.dose-header .badge {
  font-size: 0.9rem;
  padding: 0.5rem 1rem;
}
</style>

