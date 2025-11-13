<template>
  <div class="vaccine-schedule-section">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h5 class="mb-0">
        <i class="bi bi-calendar-check me-2" />Vaccine Schedules
      </h5>
    </div>

    <!-- Sorting Dropdown -->
    <div class="d-flex justify-content-between align-items-center mb-3">
      <div class="d-flex align-items-center gap-2">
        <label class="form-label mb-0 fw-bold">Sort by:</label>
        <select
          v-model="sortOption"
          class="form-select form-select-sm"
          style="width: auto; min-width: 150px;"
          @change="applySorting"
        >
          <option value="alphabetical-asc">
            A-Z (Name)
          </option>
          <option value="alphabetical-desc">
            Z-A (Name)
          </option>
          <option value="sequential">
            Sequential (First Dose)
          </option>
        </select>
      </div>
      <div class="d-flex gap-2">
        <button
          class="btn btn-sm btn-outline-primary"
          @click="refreshData"
        >
          <i class="bi bi-arrow-clockwise me-1" />Refresh
        </button>
        <router-link
          to="/admin/vaccines/schedules/add"
          class="btn btn-sm btn-primary"
          :class="{ disabled: isOffline }"
          :aria-disabled="isOffline"
          @click.prevent="handleNewScheduleClick"
        >
          <i class="bi bi-plus-circle me-1" />New Schedule
        </router-link>
      </div>
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
        <span class="visually-hidden">Loading vaccine schedules...</span>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="schedules.length === 0"
      class="text-center py-5"
    >
      <i
        class="bi bi-calendar-x text-muted"
        style="font-size: 3rem;"
      />
      <p class="text-muted mt-3">
        No vaccine schedules found
      </p>
      <router-link
        to="/admin/vaccines/schedules/add"
        class="btn btn-primary"
      >
        <i class="bi bi-plus-circle me-2" />Create First Schedule
      </router-link>
    </div>

    <!-- Schedules Table -->
    <div
      v-else
      class="table-responsive"
    >
      <table class="table table-hover table-bordered">
        <thead class="table-light">
          <tr>
            <th 
              class="text-center sortable-header"
              @click="sortByColumn('name')"
            >
              Schedule Name
              <i 
                v-if="sortBy === 'name'"
                :class="sortOrder === 'asc' ? 'bi bi-chevron-up' : 'bi bi-chevron-down'"
              />
            </th>
            <th 
              class="text-center sortable-header"
              @click="sortByColumn('vaccine')"
            >
              Vaccine
              <i 
                v-if="sortBy === 'vaccine'"
                :class="sortOrder === 'asc' ? 'bi bi-chevron-up' : 'bi bi-chevron-down'"
              />
            </th>
            <th 
              class="text-center sortable-header"
              @click="sortByColumn('total_doses')"
            >
              Total Doses
              <i 
                v-if="sortBy === 'total_doses'"
                :class="sortOrder === 'asc' ? 'bi bi-chevron-up' : 'bi bi-chevron-down'"
              />
            </th>
            <th 
              class="text-center sortable-header"
              @click="sortByColumn('created_at')"
            >
              Created
              <i 
                v-if="sortBy === 'created_at'"
                :class="sortOrder === 'asc' ? 'bi bi-chevron-up' : 'bi bi-chevron-down'"
              />
            </th>
            <th 
              class="text-center sortable-header"
              @click="sortByColumn('updated_at')"
            >
              Updated
              <i 
                v-if="sortBy === 'updated_at'"
                :class="sortOrder === 'asc' ? 'bi bi-chevron-up' : 'bi bi-chevron-down'"
              />
            </th>
            <th class="text-center">
              Actions
            </th>
          </tr>
        </thead>
        <tbody v-if="sortedSchedules.length > 0">
          <tr
            v-for="s in sortedSchedules"
            :key="s.id || s.schedule_master_id"
          >
            <td class="text-center align-middle">
              <strong>{{ s?.name || 'Unnamed Schedule' }}</strong>
            </td>
            <td class="text-center align-middle">
              {{ s?.vaccine?.antigen_name || s?.vaccine?.brand_name || s?.vaccine_id || '—' }}
            </td>
            <td class="text-center align-middle">
              <span class="badge bg-primary">{{ s?.total_doses || 0 }}</span>
            </td>
            <td class="text-center align-middle">
              <small>{{ formatDate(s?.created_at) }}</small>
            </td>
            <td class="text-center align-middle">
              <small>{{ formatDate(s?.updated_at) }}</small>
            </td>
            <td class="text-center align-middle">
              <div class="btn-group btn-group-sm">
                <button 
                  class="btn btn-outline-primary"
                  title="View Details"
                  @click="handleViewClick(s)"
                >
                  <i class="bi bi-eye me-1" />View
                </button>
                <button 
                  class="btn btn-outline-warning"
                  :class="{ disabled: isOffline }"
                  :aria-disabled="isOffline"
                  title="Edit"
                  @click="handleEditClick(s)"
                >
                  <i class="bi bi-pencil me-1" />Edit
                </button>
              </div>
            </td>
          </tr>
        </tbody>
        <tbody v-else>
          <tr>
            <td 
              colspan="6" 
              class="text-center py-4"
            >
              <em class="text-muted">No schedules available</em>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from '@/composables/useToast'
import { useOfflineAdmin } from '@/composables/useOfflineAdmin'

const router = useRouter()
const { addToast } = useToast()
const { fetchSchedules: fetchSchedulesOffline } = useOfflineAdmin()

const emit = defineEmits(['refresh'])

// State
const schedules = ref([])
const loading = ref(true)
const sortBy = ref('name')
const sortOrder = ref('asc')
const sortOption = ref('alphabetical-asc')
const isOffline = ref(!navigator.onLine)

// Computed
const sortedSchedules = computed(() => {
  // Ensure schedules.value is always an array
  const scheduleArray = Array.isArray(schedules.value) ? schedules.value : []
  
  // Filter out any undefined or invalid schedule items that don't have required properties
  const validSchedules = scheduleArray.filter(s => {
    return s && typeof s === 'object' && typeof s.name === 'string' && s.name.trim() !== ''
  })
  
  const sorted = [...validSchedules]

  if (sortOption.value === 'alphabetical-asc') {
    // Sort by name ascending
    sorted.sort((a, b) => {
      const aName = (a.name || '').toString()
      const bName = (b.name || '').toString()
      return aName.localeCompare(bName)
    })
  } else if (sortOption.value === 'alphabetical-desc') {
    // Sort by name descending
    sorted.sort((a, b) => {
      const aName = (a.name || '').toString()
      const bName = (b.name || '').toString()
      return bName.localeCompare(aName)
    })
  } else if (sortOption.value === 'sequential') {
    // Sort by first dose due_after_days, then alphabetically by name
    sorted.sort((a, b) => {
      const aFirstDose = a.schedule_doses?.[0]?.due_after_days || 0
      const bFirstDose = b.schedule_doses?.[0]?.due_after_days || 0
      const doseDiff = aFirstDose - bFirstDose
      if (doseDiff !== 0) return doseDiff
      // If doses are equal, sort alphabetically by name
      const aName = (a.name || '').toString()
      const bName = (b.name || '').toString()
      return aName.localeCompare(bName)
    })
  }

  return sorted
})

// Sorting
const sortByColumn = (column) => {
  if (sortBy.value === column) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortBy.value = column
    sortOrder.value = 'asc'
  }
}

const applySorting = () => {
  // Sorting is handled by the computed property based on sortOption
}

// Lifecycle
onMounted(async () => {
  await fetchSchedules()
  
  // Add online/offline event listeners
  window.addEventListener('online', updateOnlineStatus)
  window.addEventListener('offline', updateOnlineStatus)
})

// Cleanup event listeners on unmount
onUnmounted(() => {
  window.removeEventListener('online', updateOnlineStatus)
  window.removeEventListener('offline', updateOnlineStatus)
})

// Online/Offline event listeners
const updateOnlineStatus = () => {
  isOffline.value = !navigator.onLine
}

// Handle new schedule button click
const handleNewScheduleClick = () => {
  if (isOffline.value) {
    addToast({
      title: 'Feature Unavailable Offline',
      message: 'Creating new vaccine schedules requires an internet connection',
      type: 'warning',
      timeout: 4000
    })
  }
}

// Handle edit button click
const handleEditClick = (schedule) => {
  if (isOffline.value) {
    addToast({
      title: 'Feature Unavailable Offline',
      message: 'Editing vaccine schedules requires an internet connection',
      type: 'warning',
      timeout: 4000
    })
  } else {
    router.push(`/admin/vaccines/schedules/edit/${schedule.id || schedule.schedule_master_id}`)
  }
}

// Handle view button click
const handleViewClick = (schedule) => {
  if (isOffline.value) {
    addToast({
      title: 'Feature Unavailable Offline',
      message: 'Viewing detailed schedule information requires an internet connection',
      type: 'warning',
      timeout: 4000
    })
  } else {
    router.push(`/admin/vaccines/schedules/view/${schedule.id || schedule.schedule_master_id}`)
  }
}

// API Calls
const fetchSchedules = async () => {
  try {
    loading.value = true
    const res = await fetchSchedulesOffline()
    const data = res.data?.data || res.data || []
    
    // Ensure we have a valid array and filter out any invalid items
    const validData = Array.isArray(data) 
      ? data.filter(item => {
          return item && 
                 typeof item === 'object' && 
                 typeof item.name === 'string' && 
                 item.name.trim() !== ''
        })
      : []
    
    // Safely assign the data
    schedules.value = validData
  } catch (e) {
    console.error('Error fetching schedules', e)
    schedules.value = []
    addToast({ message: 'Failed to load vaccine schedules', type: 'error' })
  } finally {
    loading.value = false
  }
}

const refreshData = () => {
  fetchSchedules()
  emit('refresh')
}

// Date Formatting
const formatDate = (dateString) => {
  if (!dateString) return '—'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}
</script>

<style scoped>
.table {
  margin-bottom: 0;
}

.btn-group-sm .btn {
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
}

.sortable-header {
  cursor: pointer;
  user-select: none;
  transition: background-color 0.2s;
}

.sortable-header:hover {
  background-color: rgba(0, 123, 255, 0.1);
}

.sortable-header i {
  font-size: 0.75rem;
  margin-left: 0.25rem;
}
</style>
