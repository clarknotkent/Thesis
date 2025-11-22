<template>
  <div class="scheduling-calendar-widget">
    <!-- Calendar Header -->
    <div class="calendar-header">
      <div class="header-content">
        <div class="title-section">
          <i class="bi bi-calendar-heart-fill calendar-icon" />
          <div>
            <h5 class="month-title mb-0">
              {{ monthYear }}
            </h5>
            <p class="subtitle mb-0">
              Vaccination Schedule
            </p>
          </div>
        </div>
        
        <div class="nav-section">
          <button
            title="Previous Month"
            class="nav-btn prev-btn"
            @click="previousMonth"
          >
            <i class="bi bi-chevron-left" />
            <span class="nav-text">Prev</span>
          </button>
          
          <button
            title="Go to Today"
            class="nav-btn today-btn"
            @click="goToToday"
          >
            <i class="bi bi-calendar-check" />
            <span class="nav-text">Today</span>
          </button>
          
          <button
            title="Next Month"
            class="nav-btn next-btn"
            @click="nextMonth"
          >
            <span class="nav-text">Next</span>
            <i class="bi bi-chevron-right" />
          </button>
        </div>
      </div>
      
      <div
        v-if="isOffline"
        class="offline-badge"
      >
        <i class="bi bi-wifi-off" />
        <span>Offline Mode</span>
      </div>
    </div>

    <!-- Loading State -->
    <div
      v-if="loading"
      class="text-center py-4"
    >
      <div
        class="spinner-border spinner-border-sm text-primary"
        role="status"
      >
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>

    <!-- Calendar Grid -->
    <div
      v-else
      class="calendar-grid"
    >
      <!-- Weekday Headers -->
      <div
        v-for="day in weekDays"
        :key="day"
        class="weekday-header"
      >
        {{ day }}
      </div>

      <!-- Calendar Days -->
      <div
        v-for="day in calendarDays"
        :key="day.dateKey"
        class="calendar-day"
        :class="{
          'other-month': day.isOtherMonth,
          'today': day.isToday,
          'has-bookings': day.totalBooked > 0,
          'clickable': !day.isOtherMonth
        }"
        @click="openDayDetails(day)"
      >
        <div class="day-number">
          {{ day.dayNumber }}
        </div>
        <div
          v-if="!day.isOtherMonth && day.totalBooked > 0"
          class="day-bookings"
        >
          <div class="booking-slots">
            <span
              v-if="day.amBooked > 0"
              class="slot-badge am"
            >
              <i class="bi bi-sunrise" />
              {{ day.amBooked }}
            </span>
            <span
              v-if="day.pmBooked > 0"
              class="slot-badge pm"
            >
              <i class="bi bi-sunset" />
              {{ day.pmBooked }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Day Details Modal -->
    <DayDetailsModal
      v-if="selectedDay"
      :day="selectedDay"
      :show="showDayModal"
      @close="closeDayModal"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useCapacity } from '@/composables/useCapacity'
import DayDetailsModal from './DayDetailsModal.vue'
import { db as staffDB } from '@/services/offline/db'

const { getCapacityRange } = useCapacity()

const currentDate = ref(new Date())
const capacityData = ref([])
const loading = ref(false)
const showDayModal = ref(false)
const selectedDay = ref(null)
const isOffline = ref(!navigator.onLine)

const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const monthYear = computed(() => {
  return currentDate.value.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  })
})

const startDate = computed(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()
  const firstDay = new Date(year, month, 1)
  const firstDayOfWeek = firstDay.getDay()
  const startDate = new Date(firstDay)
  startDate.setDate(startDate.getDate() - firstDayOfWeek)
  return startDate
})

const endDate = computed(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()
  const lastDay = new Date(year, month + 1, 0)
  const lastDayOfWeek = lastDay.getDay()
  const endDate = new Date(lastDay)
  endDate.setDate(endDate.getDate() + (6 - lastDayOfWeek))
  return endDate
})

const calendarDays = computed(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()
  
  const firstDay = new Date(year, month, 1)
  const firstDayOfWeek = firstDay.getDay()
  
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()
  
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
  
  // Next month padding
  const remainingDays = 42 - days.length
  for (let day = 1; day <= remainingDays; day++) {
    const date = new Date(year, month + 1, day)
    days.push(createDayObject(date, true))
  }
  
  return days
})

function createDayObject(date, isOtherMonth) {
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
    patients: []
  }
  
  const totalCapacity = capacity.am_capacity + capacity.pm_capacity
  const totalBooked = capacity.am_booked + capacity.pm_booked
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const checkDate = new Date(date)
  checkDate.setHours(0, 0, 0, 0)
  
  return {
    date: dateStr,
    dateKey: `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`,
    dayNumber: date.getDate(),
    isOtherMonth,
    isToday: checkDate.getTime() === today.getTime(),
    amCapacity: capacity.am_capacity,
    pmCapacity: capacity.pm_capacity,
    amBooked: capacity.am_booked,
    pmBooked: capacity.pm_booked,
    notes: capacity.notes,
    patients: capacity.patients || [],
    totalCapacity,
    totalBooked
  }
}

async function loadCapacityFromOffline(startDate, endDate) {
  try {
    const formatLocalDate = (d) => {
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${y}-${m}-${day}`
    }
    
    const start = formatLocalDate(startDate)
    const end = formatLocalDate(endDate)
    
    console.log(`📅 [BHS] Loading offline capacity from ${start} to ${end}`)
    
    // Get schedules and patients from staff offline DB
    const allSchedules = await staffDB.patientschedule.toArray()
    const allPatients = await staffDB.patients.toArray()
    
    console.log(`📦 [BHS] Total schedules: ${allSchedules.length}, patients: ${allPatients.length}`)
    
    // Create patient lookup map
    const patientMap = {}
    allPatients.forEach(p => {
      patientMap[p.patient_id] = p
    })
    
    // Filter for non-completed schedules in date range
    const schedules = allSchedules.filter(s => {
      if (s.is_deleted === true) return false
      if (!s.scheduled_date) return false
      
      const status = (s.status || '').toLowerCase()
      if (status === 'completed' || status === 'missed') return false
      
      return s.scheduled_date >= start && s.scheduled_date <= end
    })
    
    console.log(`📊 [BHS] Found ${schedules.length} non-completed appointments`)
    
    // Group by date
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
          patients: []
        }
      }
      
      if (schedule.time_slot === 'AM') {
        capacityByDate[date].am_booked++
      } else if (schedule.time_slot === 'PM') {
        capacityByDate[date].pm_booked++
      }
      
      const patient = patientMap[schedule.patient_id] || {}
      
      // Calculate age
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
      
      // Store patient info (match API structure)
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
    
    return Object.values(capacityByDate)
  } catch (error) {
    console.error('❌ [BHS] Failed to load offline capacity:', error)
    return []
  }
}

async function loadCapacityData() {
  loading.value = true
  try {
    const formatLocalDate = (d) => {
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${y}-${m}-${day}`
    }
    
    const start = formatLocalDate(startDate.value)
    const end = formatLocalDate(endDate.value)
    
    // Check network status first
    if (!navigator.onLine) {
      console.log('📴 [BHS Calendar] Offline detected, using local data')
      isOffline.value = true
      capacityData.value = await loadCapacityFromOffline(startDate.value, endDate.value)
    } else {
      // Try API first, fallback to offline
      try {
        capacityData.value = await getCapacityRange(start, end)
        isOffline.value = false
      } catch (apiError) {
        console.log('⚠️ [BHS Calendar] API failed, falling back to offline data')
        isOffline.value = true
        capacityData.value = await loadCapacityFromOffline(startDate.value, endDate.value)
      }
    }
  } catch (error) {
    console.error('❌ [BHS Calendar] Failed to load capacity data:', error)
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

onMounted(() => {
  // Set initial offline state
  isOffline.value = !navigator.onLine
  
  loadCapacityData()
  
  // Listen for online/offline events
  window.addEventListener('online', () => {
    console.log('🌐 [BHS Calendar] Back online')
    isOffline.value = false
    loadCapacityData()
  })
  
  window.addEventListener('offline', () => {
    console.log('📴 [BHS Calendar] Gone offline')
    isOffline.value = true
  })
})
</script>

<style scoped>
.scheduling-calendar-widget {
  background: linear-gradient(135deg, #f5f7fa 0%, #ffffff 100%);
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  overflow: hidden;
  border: 1px solid rgba(34, 197, 94, 0.1);
}

.calendar-header {
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  padding: 1.25rem;
  color: white;
  position: relative;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.title-section {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.calendar-icon {
  font-size: 2rem;
  opacity: 0.95;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.month-title {
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: -0.5px;
}

.subtitle {
  font-size: 0.75rem;
  opacity: 0.9;
  font-weight: 400;
}

.nav-section {
  display: flex;
  gap: 0.5rem;
}

.nav-btn {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.875rem;
  font-weight: 600;
  transition: all 0.3s;
  cursor: pointer;
  backdrop-filter: blur(10px);
}

.nav-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.nav-btn:active {
  transform: translateY(0);
}

.nav-btn i {
  font-size: 1rem;
}

.today-btn {
  background: rgba(255, 255, 255, 0.25);
  border-color: rgba(255, 255, 255, 0.4);
}

.nav-text {
  display: none;
}

@media (min-width: 480px) {
  .nav-text {
    display: inline;
  }
}

.offline-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 193, 7, 0.2);
  border: 1px solid rgba(255, 193, 7, 0.4);
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.875rem;
  margin-top: 0.75rem;
  backdrop-filter: blur(10px);
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  background: linear-gradient(135deg, #f0f2f5 0%, #e9ecef 100%);
  padding: 4px;
}

.weekday-header {
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  color: white;
  padding: 0.75rem 0.5rem;
  text-align: center;
  font-weight: 700;
  font-size: 0.75rem;
  border-radius: 6px;
  letter-spacing: 0.5px;
}

.calendar-day {
  background: white;
  min-height: 70px;
  padding: 0.625rem;
  position: relative;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 8px;
  border: 2px solid transparent;
}

.calendar-day.clickable:hover {
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
  cursor: pointer;
  transform: translateY(-4px) scale(1.02);
  box-shadow: 0 8px 16px rgba(34, 197, 94, 0.2);
  border-color: #22c55e;
  z-index: 10;
}

.calendar-day.other-month {
  opacity: 0.25;
  background: #fafbfc;
}

.calendar-day.today {
  background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
  border: 2px solid #22c55e;
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
  animation: todayGlow 2s ease-in-out infinite;
}

@keyframes todayGlow {
  0%, 100% { box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3); }
  50% { box-shadow: 0 4px 20px rgba(34, 197, 94, 0.5); }
}

.calendar-day.has-bookings {
  background: linear-gradient(135deg, #fff9e6 0%, #ffffff 100%);
}

.day-number {
  font-size: 0.9rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
  color: #333;
}

.calendar-day.today .day-number {
  color: #16a34a;
  font-size: 1rem;
}

.day-bookings {
  margin-top: 0.375rem;
}

.booking-slots {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.slot-badge {
  font-size: 0.7rem;
  padding: 3px 6px;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-weight: 600;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.2s;
}

.slot-badge:hover {
  transform: translateX(2px);
}

.slot-badge.am {
  background: linear-gradient(135deg, #fff3cd 0%, #ffeb99 100%);
  color: #856404;
  border: 1px solid #ffc107;
}

.slot-badge.pm {
  background: linear-gradient(135deg, #cfe2ff 0%, #9ec5fe 100%);
  color: #084298;
  border: 1px solid #0dcaf0;
}

.slot-badge i {
  font-size: 0.65rem;
}
</style>
