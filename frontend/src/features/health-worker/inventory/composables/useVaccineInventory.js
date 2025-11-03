/**
 * useVaccineInventory Composable
 * 
 * Manages vaccine inventory loading, filtering by type/status, 
 * sorting, search, and pagination.
 * 
 * @returns {Object} Inventory state and methods
 */

import { ref, computed } from 'vue'
import api from '@/services/offlineAPI'

export function useVaccineInventory() {
  // State
  const loading = ref(true)
  const inventory = ref([])
  const searchTerm = ref('')
  const currentTypeFilter = ref('All')
  const currentStatusFilter = ref('All')
  const currentSort = ref('Name A-Z')
  const showFilterSheet = ref(false)

  // Pagination
  const currentPage = ref(1)
  const itemsPerPage = ref(7)

  // Computed
  const hasActiveFilters = computed(() => {
    return currentTypeFilter.value !== 'All' || currentStatusFilter.value !== 'All'
  })

  // Helper method - get stock status
  const getStatus = (item) => {
    const quantity = item.current_stock_level || 0
    const expiry = new Date(item.expiration_date)
    const today = new Date()
    const daysUntilExpiry = Math.floor((expiry - today) / (1000 * 60 * 60 * 24))

    if (daysUntilExpiry < 0) return 'Expired'
    if (quantity === 0) return 'Out of Stock'
    if (quantity < 10) return 'Low Stock'
    return 'In Stock'
  }

  const filteredInventory = computed(() => {
    let filtered = [...inventory.value]

    // Search filter
    if (searchTerm.value) {
      const query = searchTerm.value.toLowerCase()
      filtered = filtered.filter(item => {
        const vaccineName = item.vaccinemaster?.antigen_name || item.vaccine_name || ''
        const brandName = item.vaccinemaster?.brand_name || item.brand_name || ''
        const manufacturer = item.vaccinemaster?.manufacturer || item.manufacturer || ''
        return vaccineName.toLowerCase().includes(query) ||
               brandName.toLowerCase().includes(query) ||
               manufacturer.toLowerCase().includes(query)
      })
    }

    // Type filter
    if (currentTypeFilter.value !== 'All') {
      if (currentTypeFilter.value === 'NIP') {
        filtered = filtered.filter(item => item.is_nip || item.vaccinemaster?.is_nip)
      } else if (currentTypeFilter.value === 'Others') {
        filtered = filtered.filter(item => !(item.is_nip || item.vaccinemaster?.is_nip))
      }
    }

    // Status filter
    if (currentStatusFilter.value !== 'All') {
      filtered = filtered.filter(item => {
        const status = getStatus(item)
        return status === currentStatusFilter.value
      })
    }

    // Sort
    filtered.sort((a, b) => {
      switch (currentSort.value) {
        case 'Name A-Z':
          return (a.vaccinemaster?.antigen_name || '').localeCompare(b.vaccinemaster?.antigen_name || '')
        case 'Name Z-A':
          return (b.vaccinemaster?.antigen_name || '').localeCompare(a.vaccinemaster?.antigen_name || '')
        case 'Quantity Low-High':
          return (a.current_stock_level || 0) - (b.current_stock_level || 0)
        case 'Quantity High-Low':
          return (b.current_stock_level || 0) - (a.current_stock_level || 0)
        case 'Expiry Date':
          return new Date(a.expiration_date || '9999-12-31') - new Date(b.expiration_date || '9999-12-31')
        default:
          return 0
      }
    })

    return filtered
  })

  const totalPages = computed(() => Math.ceil(filteredInventory.value.length / itemsPerPage.value))

  const paginatedInventory = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage.value
    const end = start + itemsPerPage.value
    return filteredInventory.value.slice(start, end)
  })

  // Methods
  const selectTypeFilter = (type) => {
    currentTypeFilter.value = type
    currentPage.value = 1
  }

  const selectStatusFilter = (status) => {
    currentStatusFilter.value = status
    currentPage.value = 1
  }

  const selectSort = (sort) => {
    currentSort.value = sort
    currentPage.value = 1
  }

  const clearAllFilters = () => {
    currentTypeFilter.value = 'All'
    currentStatusFilter.value = 'All'
    currentPage.value = 1
  }

  const changePage = (page) => {
    currentPage.value = page
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const fetchInventory = async () => {
    try {
      loading.value = true
      const response = await api.get('/vaccines/inventory')
      const data = response.data?.data || response.data || []
      inventory.value = Array.isArray(data) ? data : []
      console.log('📦 [VaccineStock] Loaded inventory:', inventory.value.length, 'items')
    } catch (error) {
      console.error('❌ [VaccineStock] Error fetching inventory:', error)
      inventory.value = []
    } finally {
      loading.value = false
    }
  }

  return {
    // State
    loading,
    inventory,
    searchTerm,
    currentTypeFilter,
    currentStatusFilter,
    currentSort,
    showFilterSheet,
    currentPage,
    itemsPerPage,
    
    // Computed
    hasActiveFilters,
    filteredInventory,
    totalPages,
    paginatedInventory,
    
    // Methods
    getStatus,
    selectTypeFilter,
    selectStatusFilter,
    selectSort,
    clearAllFilters,
    changePage,
    fetchInventory
  }
}
