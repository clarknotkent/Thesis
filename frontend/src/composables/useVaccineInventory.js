import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/api'
import { useToast } from '@/composables/useToast'
import { usePagination } from '@/composables/usePagination'

export function useVaccineInventory() {
  const { addToast } = useToast()
  const router = useRouter()

  // State
  const loading = ref(true)
  const saving = ref(false)
  const vaccines = ref([])
  const existingVaccines = ref([])
  const schedules = ref([])
  const stats = ref({
    totalTypes: 0,
    totalDoses: 0,
    lowStock: 0,
    expiringSoon: 0
  })

  // Search and Filter
  const searchTerm = ref('')
  const currentFilter = ref('All')
  const currentSort = ref('Name A-Z')

  // Modals
  const showAddModal = ref(false)
  const showAddStockModal = ref(false)
  const showAdjustModal = ref(false)
  const submittingAdjust = ref(false)
  const showAddVaccineModal = ref(false)
  const showScheduleModal = ref(false)
  const showHistoryModal = ref(false)
  const showDetailsModal = ref(false)
  const showExpiresTodayModal = ref(false)
  const showPreviewModal = ref(false)
  const showEditVaccineWizard = ref(false)

  // Modal State
  const scheduleReadOnly = ref(false)
  const isEditing = ref(false)
  const isEditingVaccineType = ref(false)
  const selectedVaccine = ref('')
  const selectedInventory = ref(null)
  const inventoryHistory = ref([])
  const savedLot = ref(null)
  const previewPayload = ref(null)

  // Storage and Options
  const storageLocationOptions = ref([
    'Refrigerator A', 'Refrigerator B', 'Freezer A', 'Freezer B', 'Room Temperature Storage'
  ])
  
  // Receiving Reports
  const receivingLoading = ref(false)
  const receivingList = ref({ items: [], totalCount: 0, totalPages: 0 })
  const receivingStatus = ref('')
  const receivingSearch = ref('')

  // Scheduling Fields
  const schedulingFields = ref({
    vaccine_id: '',
    vaccine_name: '',
    total_doses: 1,
    doses: [
      { dose_number: 1, min_age_months: 0, max_age_months: 1, interval_days: 0, required: true }
    ]
  })
  const currentDoseIndex = ref(0)

  // Disease/Vaccine Options
  const diseaseOptions = ref([])
  const selectedDisease = ref('')
  const antigenOptions = ref([])
  const selectedAntigen = ref('')
  const brandOptions = ref([])
  const selectedBrand = ref('')
  const manufacturerOptions = ref([])
  const selectedManufacturer = ref('')

  // Edit Wizard
  const editWizard = ref({ selectedVaccineId: '' })

  // Validation State
  const isSubmitting = ref(false)
  const submitMessage = ref('')
  const errors = ref({ general: '', doses: [] })

  // Forms
  const form = ref({
    id: null,
    vaccine_id: '',
    antigenName: '',
    brandName: '',
    manufacturer: '',
    category: '',
    quantity: 0,
    lotNumber: '',
    expirationDate: '',
    storageLocation: ''
  })

  const vaccineForm = ref({
    id: null,
    antigen_name: '',
    brand_name: '',
    manufacturer: '',
    disease_prevented: '',
    vaccine_type: 'inactivated',
    category: 'VACCINE',
    lot_number: '',
    expiration_date: '',
    stock_level: 0,
    storage_location: ''
  })

  const adjustForm = ref({ 
    id: null, 
    type: 'ADJUST', 
    quantity: 0, 
    note: '' 
  })

  const adjustTypes = ['ADJUST', 'RETURN', 'EXPIRED']

  // Pagination
  const itemsPerPage = ref(5)
  
  const filteredVaccines = computed(() => {
    let list = [...vaccines.value]

    // Frontend category filter (in case backend ignores is_nip)
    if (currentFilter.value === 'NIP') {
      list = list.filter(v => v.is_nip === true)
    } else if (currentFilter.value === 'Others') {
      list = list.filter(v => v.is_nip === false)
    }

    // Search
    if (searchTerm.value) {
      const q = searchTerm.value.toLowerCase()
      list = list.filter(vaccine =>
        (vaccine.vaccineName || '').toLowerCase().includes(q) ||
        (vaccine.brandName || '').toLowerCase().includes(q) ||
        (vaccine.manufacturer || '').toLowerCase().includes(q) ||
        (vaccine.batchNo || '').toLowerCase().includes(q)
      )
    }

    // Sorting
    switch (currentSort.value) {
      case 'Name A-Z':
        list.sort((a, b) => (a.vaccineName || '').localeCompare(b.vaccineName || ''))
        break
      case 'Name Z-A':
        list.sort((a, b) => (b.vaccineName || '').localeCompare(a.vaccineName || ''))
        break
      case 'Quantity Low-High':
        list.sort((a, b) => (a.quantity || 0) - (b.quantity || 0))
        break
      case 'Quantity High-Low':
        list.sort((a, b) => (b.quantity || 0) - (a.quantity || 0))
        break
      case 'Expiry Date':
        list.sort((a, b) => {
          const da = a.expiryDate ? new Date(a.expiryDate).getTime() : Infinity
          const db = b.expiryDate ? new Date(b.expiryDate).getTime() : Infinity
          return da - db
        })
        break
    }

    return list
  })

  const {
    currentPage,
    totalPages,
    paginatedItems: paginatedVaccines,
    nextPage,
    prevPage,
    goToPage,
    pageNumbers
  } = usePagination(filteredVaccines, itemsPerPage.value)

  // API Methods
  const fetchVaccines = async () => {
    try {
      loading.value = true
      const params = {}
      
      if (currentFilter.value === 'NIP') {
        params.is_nip = true
      } else if (currentFilter.value === 'Others') {
        params.is_nip = false
      }
      
      const response = await api.get('/vaccines/inventory', { params })
      const items = response.data?.data || response.data || []
      const filteredItems = Array.isArray(items) ? items.filter(v => v && v.is_deleted !== true) : []
      
      vaccines.value = filteredItems.map(v => {
        const qty = (v.current_stock_level ?? v.quantity ?? 0)
        const exp = v.expiration_date || v.expiry_date || null
        const now = new Date()
        let status = v.status || null
        
        if (exp) {
          const d = new Date(exp)
          if (!isNaN(d)) {
            const in30 = new Date(now.getTime() + 30*24*60*60*1000)
            if (d < now) status = 'Expired'
            else if (d >= now && d <= in30) status = 'Expiring Soon'
          }
        }
        
        if (!status) status = (qty > 0 ? (qty < 10 ? 'Low Stock' : 'Available') : 'Out of Stock')
        
        return {
          id: v.inventory_id || v.id,
          vaccine_id: v.vaccinemaster?.vaccine_id || v.vaccine_id || v.vaccine?.vaccine_id,
          vaccineName: v.vaccinemaster?.antigen_name || v.vaccine?.antigen_name || v.antigen_name || '',
          brandName: v.vaccinemaster?.brand_name || v.vaccine?.brand_name || v.brand_name || '',
          manufacturer: v.vaccinemaster?.manufacturer || v.vaccine?.manufacturer || v.manufacturer || '',
          category: v.vaccinemaster?.category || v.category || '',
          is_nip: v.is_nip === true || v.is_nip === 'true' || v.vaccinemaster?.is_nip === true || v.vaccinemaster?.is_nip === 'true' || v.vaccine?.is_nip === true || v.vaccine?.is_nip === 'true' || false,
          batchNo: v.lot_number || v.batch_number || '',
          expiryDate: v.expiration_date || v.expiry_date || '',
          storageLocation: v.storage_location || v.storageLocation || '',
          quantity: qty,
          status
        }
      })
    } catch (error) {
      console.error('Error fetching vaccines:', error)
      addToast({ title: 'Error', message: 'Error loading vaccine data', type: 'error' })
    } finally {
      loading.value = false
    }
  }

  const fetchStats = async () => {
    try {
      const activeVaccines = vaccines.value.filter(v => !v.is_deleted)
      const totalTypes = new Set(existingVaccines.value.map(v => v.antigen_name + '|' + v.brand_name)).size
      const totalDoses = activeVaccines.reduce((sum, v) => sum + (v.quantity || 0), 0)
      const lowStock = activeVaccines.filter(v => (v.quantity || 0) > 0 && (v.quantity || 0) < 10).length
      const expiringSoon = activeVaccines.filter(v => {
        if (!v.expiryDate) return false
        const d = new Date(v.expiryDate)
        const now = new Date()
        const in30 = new Date(now.getTime() + 30*24*60*60*1000)
        return d >= now && d <= in30
      }).length
      
      stats.value = { totalTypes, totalDoses, lowStock, expiringSoon }
    } catch (error) {
      console.error('Error calculating stats:', error)
      stats.value = { totalTypes: 0, totalDoses: 0, lowStock: 0, expiringSoon: 0 }
    }
  }

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

  const fetchSchedules = async () => {
    try {
      const response = await api.get('/vaccines/schedules')
      schedules.value = response.data?.data || response.data || []
    } catch (error) {
      console.error('Error fetching schedules:', error)
      schedules.value = []
    }
  }

  const fetchReceivingList = async () => {
    try {
      receivingLoading.value = true
      const params = {
        search: receivingSearch.value || undefined,
        status: receivingStatus.value || undefined
      }
      const response = await api.get('/receiving-reports', { params })
      receivingList.value = response.data?.data || response.data || { items: [], totalCount: 0, totalPages: 0 }
    } catch (error) {
      console.error('Error fetching receiving reports:', error)
      receivingList.value = { items: [], totalCount: 0, totalPages: 0 }
    } finally {
      receivingLoading.value = false
    }
  }

  const fetchDiseaseOptions = async () => {
    try {
      const response = await api.get('/vaccines')
      
      let vaccines = []
      if (response.data?.data && Array.isArray(response.data.data)) {
        vaccines = response.data.data
      } else if (Array.isArray(response.data)) {
        vaccines = response.data
      } else if (response.data?.vaccines && Array.isArray(response.data.vaccines)) {
        vaccines = response.data.vaccines
      }
      
      diseaseOptions.value = [...new Set(vaccines.map(v => v.disease_prevented).filter(d => d && d.trim()))].sort()
      antigenOptions.value = [...new Set(vaccines.map(v => v.antigen_name).filter(d => d && d.trim()))].sort()
      brandOptions.value = [...new Set(vaccines.map(v => v.brand_name).filter(d => d && d.trim()))].sort()
      manufacturerOptions.value = [...new Set(vaccines.map(v => v.manufacturer).filter(d => d && d.trim()))].sort()
    } catch (error) {
      console.error('Error fetching options:', error)
      diseaseOptions.value = []
      antigenOptions.value = []
      brandOptions.value = []
      manufacturerOptions.value = []
    }
  }

  // CRUD Operations
  const saveVaccine = async () => {
    try {
      saving.value = true
      
      const payload = {
        vaccine_id: form.value.vaccine_id,
        lot_number: form.value.lotNumber,
        expiration_date: convertToISODate(form.value.expirationDate) || form.value.expirationDate,
        storage_location: form.value.storageLocation || null
      }

      if (isEditing.value) {
        if (!form.value.lotNumber && form.value.batchNo) form.value.lotNumber = form.value.batchNo
        if (!form.value.storageLocation && form.value.storageLocation == null && typeof form.value.storage_location !== 'undefined') {
          form.value.storageLocation = form.value.storage_location
        }
      } else {
        payload.current_stock_level = form.value.quantity
      }

      // Validate expiry rules
      const expDate = new Date(payload.expiration_date || form.value.expirationDate)
      const today = new Date()
      today.setHours(0,0,0,0)
      const in30 = new Date(today.getTime() + 30*24*60*60*1000)
      
      if (!isNaN(expDate)) {
        if (expDate < today) {
          addToast({ title: 'Invalid Expiration', message: 'The selected expiration date is in the past. Expired stock cannot be added.', type: 'error' })
          return
        }
        if (expDate >= today && expDate <= in30) {
          addToast({ title: 'Near Expiry', message: 'This lot is expiring within 30 days. It will be added but flagged as Expiring Soon.', type: 'warning' })
        }
      }
      
      if (!payload.vaccine_id) {
        addToast({ title: 'Validation', message: 'Please select a vaccine type first.', type: 'warning' })
        return
      }
      
      let resp
      if (isEditing.value) {
        resp = await api.put(`/vaccines/inventory/${form.value.id}`, payload)
        if (adjustForm.value.quantity > 0) {
          await api.post(`/vaccines/inventory/${form.value.id}/adjust`, {
            type: adjustForm.value.type,
            quantity: adjustForm.value.quantity,
            note: adjustForm.value.note
          })
        }
      } else {
        resp = await api.post('/vaccines/inventory', payload)
        savedLot.value = resp.data?.data?.lot_number || form.value.lotNumber
      }
      
      addToast({ 
        title: 'Success', 
        message: isEditing.value ? 'Inventory updated successfully' : 'Stock added successfully', 
        type: 'success' 
      })
      
      closeModal()
      await fetchVaccines()
      await fetchStats()
    } catch (error) {
      console.error('Error saving vaccine:', error)
      addToast({ title: 'Error', message: 'Error saving vaccine data', type: 'error' })
    } finally {
      saving.value = false
    }
  }

  const deleteVaccine = async (vaccine) => {
    if (confirm(`Are you sure you want to delete ${vaccine.vaccineName}?`)) {
      try {
        await api.delete(`/vaccines/inventory/${vaccine.id}`)
        addToast({ title: 'Success', message: 'Vaccine deleted successfully', type: 'success' })
        await fetchVaccines()
        await fetchStats()
      } catch (error) {
        console.error('Error deleting vaccine:', error)
        addToast({ title: 'Error', message: 'Error deleting vaccine', type: 'error' })
      }
    }
  }

  const submitAdjust = async () => {
    try {
      submittingAdjust.value = true
      const { id, type, quantity, note } = adjustForm.value
      if (!id) return
      
      await api.post(`/vaccines/inventory/${id}/adjust`, { type, quantity, note })
      showAdjustModal.value = false
      await fetchVaccines()
      await fetchStats()
      addToast({ title: 'Success', message: 'Stock adjustment applied', type: 'success' })
    } catch (e) {
      console.error('[submitAdjust] error', e)
      addToast({ title: 'Error', message: 'Failed to apply stock adjustment', type: 'error' })
    } finally {
      submittingAdjust.value = false
    }
  }

  // Modal Handlers
  const openAddModal = () => {
    isEditing.value = false
    showAddStockModal.value = true
  }

  const openEditModal = (vaccine) => {
    isEditing.value = true
    form.value = {
      id: vaccine.id,
      vaccine_id: vaccine.vaccine_id,
      antigenName: vaccine.vaccineName,
      brandName: vaccine.brandName,
      manufacturer: vaccine.manufacturer,
      category: vaccine.category,
      quantity: vaccine.quantity,
      lotNumber: vaccine.batchNo,
      expirationDate: vaccine.expiryDate,
      storageLocation: vaccine.storageLocation
    }
    adjustForm.value = { id: vaccine.id, type: 'ADJUST', quantity: 0, note: '' }
    showAddStockModal.value = true
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
      category: '',
      quantity: 0,
      lotNumber: '',
      expirationDate: '',
      storageLocation: ''
    }
    adjustForm.value = { id: null, type: 'ADJUST', quantity: 0, note: '' }
  }

  const openAdjustModal = (vaccine) => {
    adjustForm.value = { id: vaccine.id, type: 'ADJUST', quantity: 0, note: '' }
    showAdjustModal.value = true
  }

  const closeAdjustModal = () => { 
    showAdjustModal.value = false 
  }

  const openInventoryDetails = (vaccine) => {
    selectedInventory.value = vaccine
    showDetailsModal.value = true
  }

  const closeDetailsModal = () => {
    showDetailsModal.value = false
    selectedInventory.value = null
  }

  const viewInventoryHistory = async (vaccine) => {
    try {
      const response = await api.get(`/vaccines/transactions?inventory_id=${vaccine.id}`)
      inventoryHistory.value = response.data?.transactions || response.data?.data?.transactions || []
      showHistoryModal.value = true
    } catch (error) {
      console.error('Error fetching inventory history:', error)
      addToast({ title: 'Error', message: 'Failed to load inventory history', type: 'error' })
    }
  }

  const closeHistoryModal = () => { 
    showHistoryModal.value = false 
  }

  // Helper Methods
  const formatDate = (date) => {
    if (!date) return 'N/A'
    const d = new Date(date)
    if (isNaN(d)) return 'Invalid Date'
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return `${mm}/${dd}/${yyyy}`
  }

  const convertToISODate = (mmddyyyy) => {
    if (!mmddyyyy) return null
    const [month, day, year] = mmddyyyy.split('/')
    if (!month || !day || !year) return null
    const mm = String(month).padStart(2, '0')
    const dd = String(day).padStart(2, '0')
    return `${year}-${mm}-${dd}`
  }

  const setFilter = (filter) => {
    currentFilter.value = filter
    goToPage(1)
    fetchVaccines()
  }

  const setSort = (sort) => {
    currentSort.value = sort
    goToPage(1)
  }

  const resetPagination = () => {
    goToPage(1)
  }

  const watchSearchTerm = () => {
    resetPagination()
  }

  const onVaccineSelect = () => {
    const selected = existingVaccines.value.find(v => v.id == form.value.vaccine_id)
    if (selected) {
      form.value.antigenName = selected.antigen_name
      form.value.brandName = selected.brand_name
      form.value.manufacturer = selected.manufacturer
      form.value.category = selected.category
    }
  }

  // Receiving Reports Handlers
  const goToViewReceiving = (report) => {
    router.push(`/admin/inventory/receiving-report/${report.report_id}`)
  }

  const goToCompleteReceiving = (report) => {
    router.push(`/admin/inventory/receiving-report/${report.report_id}?action=complete`)
  }

  const goToCancelReceiving = (report) => {
    if (confirm(`Are you sure you want to cancel receiving report ${report.report_number}?`)) {
      router.push(`/admin/inventory/receiving-report/${report.report_id}?action=cancel`)
    }
  }

  const getReceivingBadgeClass = (status) => {
    switch (status) {
      case 'COMPLETED': return 'bg-success'
      case 'DRAFT': return 'bg-warning text-dark'
      case 'CANCELLED': return 'bg-danger'
      default: return 'bg-secondary'
    }
  }

  // Utility Classes
  const getQuantityClass = (quantity) => {
    if (quantity === 0) return 'text-danger'
    if (quantity <= 50) return 'text-warning'
    return 'text-success'
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

  const getTransactionTypeClass = (type) => {
    switch (type) {
      case 'RECEIVE': return 'bg-success'
      case 'ADJUST': return 'bg-primary'
      case 'RETURN': return 'bg-warning text-dark'
      case 'EXPIRED': return 'bg-danger'
      default: return 'bg-secondary'
    }
  }

  const getQuantityChangeClass = (delta) => {
    if (delta > 0) return 'text-success fw-bold'
    if (delta < 0) return 'text-danger fw-bold'
    return 'text-muted'
  }

  return {
    // State
    loading,
    saving,
    vaccines,
    existingVaccines,
    schedules,
    stats,
    searchTerm,
  currentFilter,
  currentSort,
    
    // Modals
    showAddModal,
    showAddStockModal,
    showAdjustModal,
    submittingAdjust,
    showAddVaccineModal,
    showScheduleModal,
    showHistoryModal,
    showDetailsModal,
    showExpiresTodayModal,
    showPreviewModal,
    showEditVaccineWizard,
    
    // Modal State
    scheduleReadOnly,
    isEditing,
    isEditingVaccineType,
    selectedVaccine,
    selectedInventory,
    inventoryHistory,
    savedLot,
    previewPayload,
    
    // Options
    storageLocationOptions,
    diseaseOptions,
    selectedDisease,
    antigenOptions,
    selectedAntigen,
    brandOptions,
    selectedBrand,
    manufacturerOptions,
    selectedManufacturer,
    
    // Receiving
    receivingLoading,
    receivingList,
    receivingStatus,
    receivingSearch,
    
    // Forms
    form,
    vaccineForm,
    adjustForm,
    adjustTypes,
    
    // Pagination
    itemsPerPage,
    currentPage,
    totalPages,
    filteredVaccines,
    paginatedVaccines,
    nextPage,
    prevPage,
    goToPage,
    pageNumbers,
    
    // Methods
    fetchVaccines,
    fetchStats,
    fetchExistingVaccines,
    fetchSchedules,
    fetchReceivingList,
    fetchDiseaseOptions,
    saveVaccine,
    deleteVaccine,
    submitAdjust,
    openAddModal,
    openEditModal,
    closeModal,
    openAdjustModal,
    closeAdjustModal,
    openInventoryDetails,
    closeDetailsModal,
    viewInventoryHistory,
    closeHistoryModal,
    formatDate,
    convertToISODate,
  setFilter,
  setSort,
    resetPagination,
    watchSearchTerm,
    onVaccineSelect,
    goToViewReceiving,
    goToCompleteReceiving,
    goToCancelReceiving,
    getReceivingBadgeClass,
    getQuantityClass,
    getStatusBadgeClass,
    getTransactionTypeClass,
    getQuantityChangeClass
  }
}
