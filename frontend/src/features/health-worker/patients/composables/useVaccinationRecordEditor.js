/**
 * Composable for editing vaccination records
 * Handles record loading, form state, dose navigation, age calculation, and validation
 */
import { ref, computed } from 'vue'
import api from '@/services/api'

export function useVaccinationRecordEditor(patientId, recordId) {
  // State
  const loading = ref(true)
  const saving = ref(false)
  const error = ref(null)
  const vaccinationRecord = ref(null)
  const patientData = ref(null)
  const nurses = ref([])

  // Form data
  const form = ref({
    vaccineName: '',
    doseNumber: '',
    dateAdministered: '',
    ageAtAdministration: '',
    administeredBy: '',
    administeredByDisplay: '', // For outside immunizations (free-text)
    isOutside: false,
    siteOfAdministration: '',
    manufacturer: '',
    lotNumber: '',
    facilityName: '',
    remarks: ''
  })

  /**
   * Today's date for max date validation
   */
  const todayDate = computed(() => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  })

  /**
   * Form validation
   */
  const isFormValid = computed(() => {
    const base = form.value.vaccineName && form.value.doseNumber && form.value.dateAdministered
    // For outside immunizations, administeredBy can be free-text
    if (form.value.isOutside) {
      return base
    }
    return base && !!form.value.administeredBy
  })

  /**
   * Get other doses for the same vaccine (for dose navigator)
   */
  const otherDoses = computed(() => {
    if (!patientData.value || !Array.isArray(patientData.value.vaccinationHistory)) return []
    const vaccineName = form.value.vaccineName || vaccinationRecord.value?.vaccine_antigen_name
    if (!vaccineName) return []
    
    // Match by antigen/vaccine name
    const all = patientData.value.vaccinationHistory.filter(v => {
      const name = v.vaccine_antigen_name || v.vaccineName || v.antigen_name || v.antigenName || ''
      return String(name).toLowerCase().trim() === String(vaccineName).toLowerCase().trim()
    })
    
    // Sort by dose number
    all.sort((a, b) => {
      const da = parseInt(a.dose_number || a.dose || a.doseNumber || 0) || 0
      const db = parseInt(b.dose_number || b.dose || b.doseNumber || 0) || 0
      return da - db
    })
    
    return all
  })

  /**
   * Calculate age at administration based on birth date and admin date
   */
  const calculateAge = () => {
    if (!form.value.dateAdministered || !patientData.value?.date_of_birth) {
      return
    }

    const birthDate = new Date(patientData.value.date_of_birth)
    const adminDate = new Date(form.value.dateAdministered)
    
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

    form.value.ageAtAdministration = parts.join(', ') || '0 days'
  }

  /**
   * Format date for input field (YYYY-MM-DD)
   */
  const formatDateForInput = (dateString) => {
    if (!dateString) return ''
    try {
      const date = new Date(dateString)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    } catch (e) {
      return ''
    }
  }

  /**
   * Format date for display
   */
  const formatDisplayDate = (dose) => {
    const date = dose?.administered_date || dose?.date_administered || dose?.dateAdministered
    if (!date) return '—'
    try {
      return new Date(date).toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch {
      return date
    }
  }

  /**
   * Derive site from record (extract from remarks if needed)
   */
  const deriveSite = (record) => {
    const remarks = record?.remarks || record?.notes || ''
    if (remarks) {
      const match = remarks.match(/(?:site|injection site)\s*[:\-]\s*([^;,.\n]+)/i)
      if (match && match[1]) return match[1].trim()
    }
    return record?.site || record?.site_of_administration || record?.siteOfAdministration || ''
  }

  /**
   * Extract manufacturer from record
   */
  const deriveManufacturer = (record) => {
    return (
      record?.manufacturer ||
      record?.manufacturer_name ||
      record?.mfr ||
      record?.brand ||
      record?.vaccine_manufacturer ||
      record?.inventory_manufacturer ||
      ''
    )
  }

  /**
   * Extract lot number from record
   */
  const deriveLotNumber = (record) => {
    return (
      record?.lotNumber ||
      record?.lot ||
      record?.lot_number ||
      record?.batch ||
      record?.batch_number ||
      record?.inventory_lot ||
      ''
    )
  }

  /**
   * Derive facility name
   */
  const deriveFacility = (record) => {
    const isOutside = !!(record?.immunization_outside || record?.is_outside || record?.isOutside || record?.outside_immunization || record?.outside)
    if (isOutside) return 'Outside'
    return (
      record?.immunization_facility_name ||
      record?.facility_name ||
      record?.facilityName ||
      record?.health_center ||
      record?.healthCenter ||
      ''
    )
  }

  /**
   * Parse structured remarks for outside immunizations
   */
  const parseRemarksForOutside = (remarksText) => {
    const result = {
      manufacturer: '',
      lot: '',
      site: '',
      facility: '',
      administeredBy: '',
      otherRemarks: remarksText || ''
    }

    if (!remarksText) return result

    // Extract labeled fields
    const patterns = [
      { key: 'manufacturer', regex: /Manufacturer:\s*([^\n;]+)/i },
      { key: 'lot', regex: /Lot:\s*([^\n;]+)/i },
      { key: 'site', regex: /Site:\s*([^\n;]+)/i },
      { key: 'facility', regex: /Facility:\s*([^\n;]+)/i },
      { key: 'administeredBy', regex: /Administered by:\s*([^\n;]+)/i }
    ]

    let cleanedRemarks = remarksText
    patterns.forEach(({ key, regex }) => {
      const match = remarksText.match(regex)
      if (match && match[1]) {
        result[key] = match[1].trim()
        // Remove this labeled part from remarks
        cleanedRemarks = cleanedRemarks.replace(regex, '').trim()
      }
    })

    result.otherRemarks = cleanedRemarks.replace(/;\s*;/g, ';').replace(/^\s*;\s*/, '').replace(/\s*;\s*$/, '').trim()
    return result
  }

  /**
   * Build structured remarks for submission
   */
  const buildStructuredRemarks = (formData) => {
    const parts = []
    
    if (formData.isOutside) {
      if (formData.administeredByDisplay) {
        parts.push(`Administered by: ${formData.administeredByDisplay}`)
      }
    }
    
    if (formData.manufacturer) {
      parts.push(`Manufacturer: ${formData.manufacturer}`)
    }
    
    if (formData.lotNumber) {
      parts.push(`Lot: ${formData.lotNumber}`)
    }
    
    if (formData.siteOfAdministration) {
      parts.push(`Site: ${formData.siteOfAdministration}`)
    }
    
    if (formData.facilityName && formData.isOutside) {
      parts.push(`Facility: ${formData.facilityName}`)
    }
    
    // Add user's free-text remarks
    if (formData.remarks && formData.remarks.trim()) {
      parts.push(formData.remarks.trim())
    }
    
    return parts.join('; ')
  }

  /**
   * Fetch patient data
   */
  const normalizeId = (val) => {
    if (val == null) return val
    if (typeof val === 'object') {
      if ('value' in val) return normalizeId(val.value)
      if ('id' in val) return val.id
    }
    return val
  }

  const fetchPatientData = async (id = patientId) => {
    try {
      const pid = normalizeId(id)
      const response = await api.get(`/patients/${pid}`)
      patientData.value = response.data.data || response.data
    } catch (err) {
      console.error('Error fetching patient data:', err)
      throw err
    }
  }

  /**
   * Fetch health workers (nurses and nutritionists)
   */
  const fetchHealthWorkers = async () => {
    try {
      const res = await api.get('/health-staff')
      // Normalize multiple possible shapes
      let list = []
      if (res.data?.data?.healthWorkers && Array.isArray(res.data.data.healthWorkers)) {
        list = res.data.data.healthWorkers
      } else if (res.data?.data?.healthStaff && Array.isArray(res.data.data.healthStaff)) {
        list = res.data.data.healthStaff
      } else if (Array.isArray(res.data)) {
        list = res.data
      } else if (res.data?.data && Array.isArray(res.data.data)) {
        list = res.data.data
      } else if (res.data?.users && Array.isArray(res.data.users)) {
        list = res.data.users
      } else if (res.data?.healthWorkers && Array.isArray(res.data.healthWorkers)) {
        list = res.data.healthWorkers
      } else if (res.data?.healthStaff && Array.isArray(res.data.healthStaff)) {
        list = res.data.healthStaff
      } else {
        console.warn('Unexpected health-staff response structure:', res.data)
        list = []
      }

      const rawRole = (hw) => String(hw.hs_type || hw.hw_type || hw.role || hw.type || '').toLowerCase()
      const isNurseOrNutritionistRole = (r) => {
        const s = r.toLowerCase()
        return s.includes('nurse') || s.includes('rn') || s.includes('nutritionist') || s.includes('dietitian') || s.includes('nd')
      }
      const displayRole = (r) => {
        if (isNurseOrNutritionistRole(r)) {
          return r.includes('nutrition') || r.includes('diet') ? 'Nutritionist' : 'Nurse'
        }
        return r || 'Health Staff'
      }

      nurses.value = list
        .filter(hw => isNurseOrNutritionistRole(rawRole(hw)))
        .map(hw => ({
          user_id: hw.user_id || hw.id || hw.health_worker_id,
          fullname: [hw.firstname, hw.middlename, hw.surname].filter(Boolean).join(' ').trim() || hw.name || hw.fullname,
          hs_type: displayRole(rawRole(hw))
        }))
    } catch (err) {
      console.error('Error fetching health workers:', err)
      nurses.value = []
    }
  }

  /**
   * Fetch vaccination record and populate form
   */
  const fetchVaccinationRecord = async (id = recordId) => {
    try {
      loading.value = true
      error.value = null

      // Fetch patient data and health workers first
      await Promise.all([
        fetchPatientData(patientId),
        fetchHealthWorkers()
      ])

      // Fetch the specific vaccination record
      const rid = normalizeId(id)
      const response = await api.get(`/immunizations/${rid}`)
      const record = response.data.data || response.data
      vaccinationRecord.value = record

      // Populate form with existing data
      form.value = {
        vaccineName: record.vaccine_antigen_name || record.vaccineName || record.antigen_name || '',
        doseNumber: String(record.dose_number || record.doseNumber || record.dose || ''),
        dateAdministered: formatDateForInput(record.administered_date || record.date_administered || record.dateAdministered),
        ageAtAdministration: record.age_at_administration || record.ageAtAdministration || '',
        administeredBy: record.administered_by || record.administered_by_id || record.healthWorkerId || '',
        siteOfAdministration: deriveSite(record),
        manufacturer: deriveManufacturer(record),
        lotNumber: deriveLotNumber(record),
        facilityName: deriveFacility(record),
        remarks: record.remarks || record.notes || ''
      }

      // Detect outside immunization and parse remarks
      const isOutside = !!(record?.immunization_outside || record?.is_outside || record?.isOutside || record?.outside_immunization || record?.outside)
      form.value.isOutside = isOutside
      
      const parsed = parseRemarksForOutside(record.remarks || record.notes || '')
      if (parsed.manufacturer) form.value.manufacturer = parsed.manufacturer
      if (parsed.lot) form.value.lotNumber = parsed.lot
      if (parsed.site) form.value.siteOfAdministration = parsed.site
      if (parsed.facility) form.value.facilityName = parsed.facility
      if (parsed.administeredBy) form.value.administeredByDisplay = parsed.administeredBy
      form.value.remarks = (parsed.otherRemarks && parsed.otherRemarks.trim()) ? parsed.otherRemarks.trim() : ''

      // Calculate age if not already set
      if (!form.value.ageAtAdministration) {
        calculateAge()
      }

    } catch (err) {
      console.error('Error fetching vaccination record:', err)
      error.value = 'Failed to load vaccination record. Please try again.'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Prepare update data for submission
   */
  const prepareUpdateData = () => {
    const fullRemarks = buildStructuredRemarks(form.value)

    const updateData = {
      administered_date: form.value.dateAdministered,
      dose_number: parseInt(form.value.doseNumber),
      facility_name: form.value.facilityName || null,
      remarks: fullRemarks
    }

    if (!form.value.isOutside) {
      updateData.administered_by = form.value.administeredBy
      updateData.outside = false
    } else {
      updateData.administered_by = null
      updateData.outside = true
    }

    return updateData
  }

  /**
   * Update vaccination record
   */
  const updateVaccinationRecord = async (updateData, id = recordId) => {
    try {
      saving.value = true
      await api.put(`/immunizations/${id}`, updateData)
    } catch (err) {
      console.error('Error updating vaccination record:', err)
      throw err
    } finally {
      saving.value = false
    }
  }

  /**
   * Reset form to initial state
   */
  const resetForm = () => {
    form.value = {
      vaccineName: '',
      doseNumber: '',
      dateAdministered: '',
      ageAtAdministration: '',
      administeredBy: '',
      administeredByDisplay: '',
      isOutside: false,
      siteOfAdministration: '',
      manufacturer: '',
      lotNumber: '',
      facilityName: '',
      remarks: ''
    }
  }

  return {
    // State
    loading,
    saving,
    error,
    vaccinationRecord,
    patientData,
    nurses,
    form,
    
    // Computed
    todayDate,
    isFormValid,
    otherDoses,
    
    // Methods
    calculateAge,
    formatDateForInput,
    formatDisplayDate,
    fetchVaccinationRecord,
    prepareUpdateData,
    updateVaccinationRecord,
    resetForm,
    buildStructuredRemarks,
    parseRemarksForOutside
  }
}
