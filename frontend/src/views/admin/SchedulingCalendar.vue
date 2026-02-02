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
          <li
            class="breadcrumb-item active"
            aria-current="page"
          >
            Scheduling Calendar
          </li>
        </ol>
      </nav>

      <!-- Page Header -->
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h1 class="h4 mb-0">
          <i class="bi bi-calendar3 me-2 text-primary" />
          Scheduling Calendar - {{ currentMonthYear }}
          <span
            v-if="isOffline"
            class="badge bg-warning text-dark ms-2"
            style="font-size: 0.75rem; vertical-align: middle;"
          >
            <i class="bi bi-wifi-off me-1" />
            Offline Mode
          </span>
        </h1>
        <div class="d-flex gap-2 align-items-center">
          <button
            class="btn btn-sm btn-outline-secondary"
            @click="goToToday"
          >
            <i class="bi bi-calendar-check me-1" />
            Today
          </button>
          <div class="btn-group">
            <button
              class="btn btn-sm btn-outline-primary"
              title="Previous month"
              @click="previousMonth"
            >
              <i class="bi bi-chevron-left" />
            </button>
            <button
              class="btn btn-sm btn-outline-primary"
              title="Next month"
              @click="nextMonth"
            >
              <i class="bi bi-chevron-right" />
            </button>
          </div>
        </div>
      </div>

      <!-- Stats Summary -->
      <div class="row g-2 mb-3">
        <div class="col-md-3">
          <div class="stat-card">
            <i class="bi bi-calendar-range text-primary" />
            <div>
              <div class="stat-value">
                {{ monthStats.totalCapacity }}
              </div>
              <div class="stat-label">
                Total Capacity
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="stat-card">
            <i class="bi bi-people-fill text-info" />
            <div>
              <div class="stat-value">
                {{ monthStats.totalBooked }}
              </div>
              <div class="stat-label">
                Scheduled
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="stat-card">
            <i class="bi bi-calendar-check text-success" />
            <div>
              <div class="stat-value">
                {{ monthStats.totalCapacity - monthStats.totalBooked }}
              </div>
              <div class="stat-label">
                Available
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="stat-card">
            <i class="bi bi-graph-up-arrow text-warning" />
            <div>
              <div class="stat-value">
                {{ monthStats.utilizationRate }}%
              </div>
              <div class="stat-label">
                Utilization
              </div>
            </div>
          </div>
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
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>

      <!-- Calendar Card -->
      <div
        v-else
        class="card shadow-sm"
      >
        <div class="card-body p-2">
          <!-- Day headers -->
          <div class="calendar-header-row">
            <div
              v-for="day in dayNames"
              :key="day"
              class="calendar-day-header"
            >
              {{ day.substring(0, 3) }}
            </div>
          </div>

          <!-- Calendar days grid -->
          <div class="calendar-grid">
            <div
              v-for="day in calendarDays"
              :key="day.dateKey"
              :class="[
                'calendar-day',
                {
                  'other-month': day.isOtherMonth,
                  'today': day.isToday,
                  'weekend': day.isWeekend,
                  'available': day.utilizationPercent < 80 && !day.isOtherMonth,
                  'limited': day.utilizationPercent >= 80 && day.utilizationPercent < 100 && !day.isOtherMonth,
                  'full': day.utilizationPercent >= 100 && !day.isOtherMonth,
                  'past': day.isPast && !day.isToday
                }
              ]"
              @click="!day.isOtherMonth && openDayDetails(day)"
            >
              <div class="day-number">
                {{ day.dayNumber }}
                <i
                  v-if="day.notes && !day.isOtherMonth"
                  class="bi bi-sticky-fill text-warning ms-1"
                  style="font-size: 0.7rem;"
                  :title="day.notes"
                />
              </div>
              
              <div
                v-if="!day.isOtherMonth"
                class="day-content"
              >
                <div class="capacity-row">
                  <div class="capacity-item">
                    <i class="bi bi-sunrise-fill text-warning" />
                    <span>{{ day.amBooked }}/{{ day.amCapacity }}</span>
                  </div>
                  <div
                    class="capacity-bar"
                    :class="getProgressClass(day.amBooked, day.amCapacity)"
                    :style="{ width: getSlotPercentage(day.amBooked, day.amCapacity) + '%' }"
                  />
                </div>
                
                <div class="capacity-row">
                  <div class="capacity-item">
                    <i class="bi bi-sunset-fill text-info" />
                    <span>{{ day.pmBooked }}/{{ day.pmCapacity }}</span>
                  </div>
                  <div
                    class="capacity-bar"
                    :class="getProgressClass(day.pmBooked, day.pmCapacity)"
                    :style="{ width: getSlotPercentage(day.pmBooked, day.pmCapacity) + '%' }"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <!-- Legend -->
          <div class="calendar-legend mt-2">
            <small class="text-muted me-3">
              <span class="legend-dot available" />
              Available
            </small>
            <small class="text-muted me-3">
              <span class="legend-dot limited" />
              Limited
            </small>
            <small class="text-muted me-3">
              <span class="legend-dot full" />
              Full
            </small>
            <small class="text-muted">
              <span class="legend-dot today" />
              Today
            </small>
          </div>
        </div>
      </div>

      <!-- Day Details Modal -->
      <DayDetailsModal
        v-if="selectedDay"
        :day="selectedDay"
        :show="showDayModal"
        @close="closeDayModal"
        @capacity-updated="refreshCalendar"
      />
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import AdminLayout from '@/components/layout/desktop/AdminLayout.vue'
import { useCapacity } from '@/composables/useCapacity'
import DayDetailsModal from './components/DayDetailsModal.vue'
import adminDB from '@/services/offline/adminOfflineDB'

const { getCapacityRange } = useCapacity()

const currentDate = ref(new Date())
const capacityData = ref([])
const loading = ref(false)
const showDayModal = ref(false)
const selectedDay = ref(null)
const isOffline = ref(!navigator.onLine)

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const currentMonthYear = computed(() => {
  return currentDate.value.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  })
})

const monthStats = computed(() => {
  const currentMonth = calendarDays.value.filter(d => !d.isOtherMonth)
  const totalCapacity = currentMonth.reduce((sum, d) => sum + d.totalCapacity, 0)
  const totalBooked = currentMonth.reduce((sum, d) => sum + d.totalBooked, 0)
  const utilizationRate = totalCapacity > 0 ? Math.round((totalBooked / totalCapacity) * 100) : 0
  
  return {
    totalCapacity,
    totalBooked,
    utilizationRate
  }
})

const calendarDays = computed(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()
  
  // First day of the month
  const firstDay = new Date(year, month, 1)
  const firstDayOfWeek = firstDay.getDay()
  
  // Last day of the month
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()
  
  // Build the calendar grid
  const days = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  // Previous month padding
  const prevMonthLastDay = new Date(year, month, 0).getDate()
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const dayNum = prevMonthLastDay - i
    const date = new Date(year, month - 1, dayNum)
    days.push(createDayObject(date, true))
  }
  
  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day)
    days.push(createDayObject(date, false))
  }
  
  // Next month padding to complete the grid
  const remainingDays = 42 - days.length // 6 rows * 7 days
  for (let day = 1; day <= remainingDays; day++) {
    const date = new Date(year, month + 1, day)
    days.push(createDayObject(date, true))
  }
  
  return days
})

function createDayObject(date, isOtherMonth) {
  // Format date as YYYY-MM-DD in local timezone (avoid UTC conversion)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const dateStr = `${year}-${month}-${day}`
  
  const capacity = capacityData.value.find(c => c.date === dateStr) || {
    am_capacity: 25,
    pm_capacity: 25,
    am_booked: 0,
    pm_booked: 0,
    notes: null,
    patients: [] // Include empty patients array if no capacity data
  }
  
  const totalCapacity = capacity.am_capacity + capacity.pm_capacity
  const totalBooked = capacity.am_booked + capacity.pm_booked
  const utilizationPercent = totalCapacity > 0 ? (totalBooked / totalCapacity) * 100 : 0
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const checkDate = new Date(date)
  checkDate.setHours(0, 0, 0, 0)
  
  const dayOfWeek = date.getDay()
  
  return {
    date: dateStr,
    dateKey: `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`,
    dayNumber: date.getDate(),
    isOtherMonth,
    isToday: checkDate.getTime() === today.getTime(),
    isPast: checkDate < today,
    isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
    amCapacity: capacity.am_capacity,
    pmCapacity: capacity.pm_capacity,
    amBooked: capacity.am_booked,
    pmBooked: capacity.pm_booked,
    notes: capacity.notes,
    patients: capacity.patients || [], // Include patients array for modal
    utilizationPercent,
    totalCapacity,
    totalBooked
  }
}

function getSlotPercentage(booked, capacity) {
  return capacity > 0 ? Math.min((booked / capacity) * 100, 100) : 0
}

function getProgressClass(booked, capacity) {
  const percent = getSlotPercentage(booked, capacity)
  if (percent >= 100) return 'full'
  if (percent >= 80) return 'limited'
  return 'available'
}

async function loadCapacityFromOffline(startDate, endDate) {
  try {
    // Format dates in local timezone
    const formatLocalDate = (d) => {
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${y}-${m}-${day}`
    }
    
    const start = formatLocalDate(startDate)
    const end = formatLocalDate(endDate)
    
    console.log(`📅 Loading offline capacity from ${start} to ${end}`)
    
    // Get ALL schedules and patients for joining
    const allSchedules = await adminDB.patientschedule.toArray()
    const allPatients = await adminDB.patients.toArray()
    console.log(`📦 Total schedules in offline DB: ${allSchedules.length}`)
    console.log(`📦 Total patients in offline DB: ${allPatients.length}`)
    
    // Create patient lookup map (patient_id -> patient object)
    const patientMap = {}
    allPatients.forEach(p => {
      patientMap[p.patient_id] = p
    })
    
    // Filter for NOT completed schedules within date range
    const schedules = allSchedules.filter(s => {
      if (s.is_deleted === true) return false
      if (!s.scheduled_date) return false
      
      // Include ANY status that is NOT completed or missed
      const status = (s.status || '').toLowerCase()
      if (status === 'completed' || status === 'missed') return false
      
      // Check if date is in range
      return s.scheduled_date >= start && s.scheduled_date <= end
    })
    
    console.log(`📊 Found ${schedules.length} non-completed appointments in date range`)
    
    // Group by date and time_slot
    const capacityByDate = {}
    
    schedules.forEach(schedule => {
      const date = schedule.scheduled_date
      if (!capacityByDate[date]) {
        capacityByDate[date] = {
          date,
          am_capacity: 25,
          pm_capacity: 25,
          am_booked: 0,
          pm_booked: 0,
          notes: null,
          patients: [] // Store patient details for day modal
        }
      }
      
      // Count by time slot
      if (schedule.time_slot === 'AM') {
        capacityByDate[date].am_booked++
      } else if (schedule.time_slot === 'PM') {
        capacityByDate[date].pm_booked++
      }
      
      // Get patient details from map
      const patient = patientMap[schedule.patient_id] || {}
      
      // Calculate age from date of birth
      let ageDisplay = 'N/A'
      if (patient.date_of_birth) {
        const birthDate = new Date(patient.date_of_birth)
        const today = new Date()
        let years = today.getFullYear() - birthDate.getFullYear()
        let months = today.getMonth() - birthDate.getMonth()
        if (months < 0) {
          years--
          months += 12
        }
        if (years > 0) {
          ageDisplay = `${years}y ${months}m`
        } else {
          ageDisplay = `${months}m`
        }
      }
      
      // Store patient info for day details modal (match API structure)
      capacityByDate[date].patients.push({
        patient_schedule_id: schedule.patient_schedule_id,
        patient_id: schedule.patient_id,
        status: schedule.status,
        doseNumber: schedule.dose_number || 1,
        timeSlot: schedule.time_slot || 'Not Set',
        patient: {
          name: patient.full_name || patient.firstname + ' ' + patient.surname || 'Unknown',
          dateOfBirth: patient.date_of_birth,
          age: ageDisplay
        },
        vaccine: {
          name: schedule.antigen_name || 'N/A',
          id: schedule.vaccine_id
        }
      })
    })
    
    const result = Object.values(capacityByDate)
    console.log(`✅ Calculated capacity for ${result.length} dates`)
    
    return result
  } catch (error) {
    console.error('❌ Failed to load offline capacity data:', error)
    return []
  }
}

async function loadCapacityData() {
  loading.value = true
  try {
    const year = currentDate.value.getFullYear()
    const month = currentDate.value.getMonth()
    
    // Get first and last day of the displayed calendar
    const firstDay = new Date(year, month, 1)
    const firstDayOfWeek = firstDay.getDay()
    const startDate = new Date(year, month, 1 - firstDayOfWeek)
    
    const lastDay = new Date(year, month + 1, 0)
    const endDate = new Date(year, month + 1, 42 - firstDayOfWeek - lastDay.getDate())
    
    // Format dates in local timezone to avoid UTC conversion issues
    const formatLocalDate = (d) => {
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${y}-${m}-${day}`
    }
    
    const start = formatLocalDate(startDate)
    const end = formatLocalDate(endDate)
    
    // Try API first, fallback to offline
    try {
      isOffline.value = false
      capacityData.value = await getCapacityRange(start, end)
    } catch (apiError) {
      // Silent fallback to offline - errors already logged by API interceptor
      isOffline.value = true
      capacityData.value = await loadCapacityFromOffline(startDate, endDate)
    }
  } catch (error) {
    console.error('Failed to load capacity data:', error)
    capacityData.value = []
  } finally {
    loading.value = false
  }
}

function previousMonth() {
  currentDate.value = new Date(
    currentDate.value.getFullYear(),
    currentDate.value.getMonth() - 1,
    1
  )
  loadCapacityData()
}

function nextMonth() {
  currentDate.value = new Date(
    currentDate.value.getFullYear(),
    currentDate.value.getMonth() + 1,
    1
  )
  loadCapacityData()
}

function goToToday() {
  currentDate.value = new Date()
  loadCapacityData()
}

function openDayDetails(day) {
  if (day.isOtherMonth) return
  selectedDay.value = day
  showDayModal.value = true
}

function closeDayModal() {
  showDayModal.value = false
  selectedDay.value = null
}

function refreshCalendar() {
  loadCapacityData()
}

onMounted(() => {
  loadCapacityData()
  
  // Listen for online/offline events
  window.addEventListener('online', () => {
    isOffline.value = false
    loadCapacityData()
  })
  
  window.addEventListener('offline', () => {
    isOffline.value = true
  })
})
</script>

<style scoped>
/* Stats Cards */
.stat-card {
  background: white;
  border-radius: 8px;
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.stat-card i {
  font-size: 1.5rem;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #2d3748;
  line-height: 1;
}

.stat-label {
  font-size: 0.75rem;
  color: #718096;
  margin-top: 0.25rem;
}

/* Calendar Header Row */
.calendar-header-row {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
  margin-bottom: 2px;
}

.calendar-day-header {
  text-align: center;
  padding: 0.5rem;
  font-weight: 600;
  font-size: 0.875rem;
  background: #1976d2;
  color: white;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

/* Calendar Grid */
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
  background: #e5e7eb;
}

.calendar-day {
  background: white;
  min-height: 80px;
  padding: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  border: 1px solid transparent;
}

.calendar-day:not(.other-month):hover {
  background: #f9fafb;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border-color: #1976d2;
}

.calendar-day.other-month {
  background: #f7fafc;
  opacity: 0.5;
  cursor: default;
}

.calendar-day.other-month:hover {
  transform: none;
  box-shadow: none;
  border-color: transparent;
}

.calendar-day.weekend:not(.other-month) {
  background: #fffaf0;
}

.calendar-day.past:not(.today) {
  opacity: 0.7;
}

.calendar-day.today {
  background: #e3f2fd;
  border: 3px solid #1976d2;
  font-weight: 600;
}

.calendar-day.available:not(.today) {
  border-left: 3px solid #1976d2;
}

.calendar-day.limited:not(.today) {
  border-left: 3px solid #f59e0b;
}

.calendar-day.full:not(.today) {
  border-left: 3px solid #ef4444;
  background: #fef2f2;
}

/* Day Number */
.day-number {
  font-weight: 600;
  font-size: 1rem;
  margin-bottom: 0.25rem;
  color: #2d3748;
}

/* Day Content */
.day-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.capacity-row {
  position: relative;
  padding: 3px;
  background: #f9fafb;
  border-radius: 3px;
}

.capacity-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  padding: 2px 4px;
  position: relative;
  z-index: 1;
}

.capacity-item i {
  font-size: 0.8rem;
}

.capacity-bar {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  border-radius: 3px;
  transition: all 0.3s;
  opacity: 0.3;
}

.capacity-bar.available {
  background: #1976d2;
}

.capacity-bar.limited {
  background: #f59e0b;
}

.capacity-bar.full {
  background: #ef4444;
}

/* Legend */
.calendar-legend {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
}

.legend-dot {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 2px;
  margin-right: 0.25rem;
}

.legend-dot.available {
  background: #1976d2;
}

.legend-dot.limited {
  background: #f59e0b;
}

.legend-dot.full {
  background: #ef4444;
}

.legend-dot.today {
  background: #1976d2;
}

@media (max-width: 768px) {
  .calendar-day {
    min-height: 60px;
    padding: 0.25rem;
  }
  
  .day-number {
    font-size: 0.875rem;
  }
  
  .capacity-item {
    font-size: 0.7rem;
  }
}
</style>
