<template>
  <AdminLayout>
    <div class="container-fluid">
      <!-- Header -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 class="h3 mb-0 text-gray-800">Vaccine Inventory</h1>
          <p class="text-muted mb-0">Manage vaccine types and track vaccine stock levels</p>
        </div>
        <div class="d-flex gap-2">
          <router-link class="btn btn-outline-warning" to="/admin/vaccines/edit-vaccine-type">
            <i class="bi bi-pencil-square me-2"></i>Edit Vaccine Type
          </router-link>
          <button class="btn btn-primary" @click="goToCreateReceiving">
            <i class="bi bi-plus-circle me-2"></i>New Receiving Report
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>

      <template v-if="!loading">
        <!-- Statistics Cards -->
        <InventoryStatsCards :stats="stats" />

        <!-- Inventory Table -->
        <InventoryTable
          :paginatedVaccines="paginatedVaccines"
          :searchTerm="searchTerm"
          :currentFilter="currentFilter"
          :currentPage="currentPage"
          :totalPages="totalPages"
          :totalItems="filteredVaccines.length"
          :itemsPerPage="itemsPerPage"
          :formatDate="formatDate"
          :getQuantityClass="getQuantityClass"
          :getStatusBadgeClass="getStatusBadgeClass"
          @update:searchTerm="searchTerm = $event; watchSearchTerm()"
          @filter-change="setFilter"
          @delete="deleteVaccine"
          @page-changed="goToPage"
        />

        <!-- Vaccine Schedules Section -->
        <VaccineScheduleSection :existing-vaccines="existingVaccines" />

        <!-- Receiving Reports Section -->
        <ReceivingReportsTable
          :receivingList="receivingList"
          :loading="receivingLoading"
          :searchTerm="receivingSearch"
          :status="receivingStatus"
          :formatDate="formatDate"
          :getReceivingBadgeClass="getReceivingBadgeClass"
          @update:searchTerm="receivingSearch = $event; fetchReceivingList()"
          @update:status="receivingStatus = $event; fetchReceivingList()"
          @refresh="fetchReceivingList"
          @view="goToViewReceiving"
          @complete="goToCompleteReceiving"
          @cancel="goToCancelReceiving"
        />
      </template>
    </div>
  </AdminLayout>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import { useVaccineInventory } from '@/composables/useVaccineInventory'
import {
  InventoryStatsCards,
  InventoryTable,
  ReceivingReportsTable,
  VaccineScheduleSection
} from '@/features/inventory'

const router = useRouter()

const {
  // State
  loading,
  vaccines,
  existingVaccines,
  schedules,
  stats,
  searchTerm,
  currentFilter,
  
  // Receiving
  receivingLoading,
  receivingList,
  receivingStatus,
  receivingSearch,
  
  // Pagination
  itemsPerPage,
  currentPage,
  totalPages,
  filteredVaccines,
  paginatedVaccines,
  goToPage,
  
  // Methods
  fetchVaccines,
  fetchStats,
  fetchExistingVaccines,
  fetchSchedules,
  fetchReceivingList,
  fetchDiseaseOptions,
  deleteVaccine,
  formatDate,
  setFilter,
  watchSearchTerm,
  goToViewReceiving,
  goToCompleteReceiving,
  goToCancelReceiving,
  getReceivingBadgeClass,
  getQuantityClass,
  getStatusBadgeClass
} = useVaccineInventory()

// Local handlers
const goToCreateReceiving = () => {
  router.push('/admin/inventory/receiving-report/new')
}

// Initialize on mount
onMounted(async () => {
  await fetchVaccines()
  await fetchExistingVaccines()
  await fetchStats()
  await fetchSchedules()
  await fetchDiseaseOptions()
  await fetchReceivingList()
})
</script>
