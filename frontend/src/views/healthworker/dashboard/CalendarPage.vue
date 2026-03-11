<template>
  <HealthWorkerLayout>
    <div class="calendar-page">
      <div class="calendar-page-header">
        <button
          class="back-btn"
          @click="goBack"
        >
          <i class="bi bi-arrow-left" />
        </button>
        <h4 class="page-title">
          Vaccination Calendar
        </h4>
        <span
          v-if="isOffline"
          class="badge bg-warning text-dark"
          style="font-size: 0.7rem;"
        >
          <i class="bi bi-wifi-off me-1" />Offline
        </span>
      </div>

      <!-- Month Navigation -->
      <div class="month-nav">
        <button
          class="nav-btn"
          @click="previousMonth"
        >
          <i class="bi bi-chevron-left" />
        </button>
        <div class="month-label">
          {{ currentMonthYear }}
        </div>
        <button
          class="nav-btn"
          @click="goToToday"
        >
          <i class="bi bi-calendar-check" />
        </button>
        <button
          class="nav-btn"
          @click="nextMonth"
        >
          <i class="bi bi-chevron-right" />
        </button>
      </div>

      <!-- Stats Summary -->
      <div class="stats-row">
        <div class="stat-chip">
          <span class="stat-num">{{ monthStats.totalBooked }}</span>
          <span class="stat-text">Scheduled</span>
        </div>
        <div class="stat-chip">
          <span class="stat-num">{{ monthStats.totalCapacity }}</span>
          <span class="stat-text">Capacity</span>
        </div>
        <div class="stat-chip">
          <span class="stat-num">{{ monthStats.utilizationRate }}%</span>
          <span class="stat-text">Utilization</span>
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
        class="calendar-container"
      >
        <!-- Weekday Headers -->
        <div class="calendar-grid">
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
            :class="[
              'calendar-day',
              {
                'other-month': day.isOtherMonth,
                'today': day.isToday,
                'weekend': day.isWeekend,
                'past': day.isPast && !day.isToday
              },
              !day.isOtherMonth ? getHeatmapClass(day.totalBooked, day.dailyCapacity) : ''
            ]"
            @click="!day.isOtherMonth && !day.isWeekend && openDayDetails(day)"
          >
            <div class="day-number">
              {{ day.dayNumber }}
            </div>
            <div
              v-if="!day.isOtherMonth && day.totalBooked > 0"
              class="day-booking-indicator"
            >
              <span class="booking-count">{{ day.totalBooked }}</span>
            </div>
          </div>
        </div>

        <!-- Heatmap Legend -->
        <div class="heatmap-legend">
          <small class="text-muted me-2">
            <span class="legend-dot heatmap-empty" />
            Empty
          </small>
          <small class="text-muted me-2">
            <span class="legend-dot heatmap-low" />
            Low
          </small>
          <small class="text-muted me-2">
            <span class="legend-dot heatmap-moderate" />
            Moderate
          </small>
          <small class="text-muted me-2">
            <span class="legend-dot heatmap-high" />
            High
          </small>
          <small class="text-muted">
            <span class="legend-dot heatmap-full" />
            Full
          </small>
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
  </HealthWorkerLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import HealthWorkerLayout from '@/components/layout/mobile/HealthWorkerLayout.vue'
import DayDetailsModal from './components/DayDetailsModal.vue'
import { useCapacity } from '@/composables/useCapacity'
import { db as staffDB } from '@/services/offline/db'

const router = useRouter()
const { getCapacityRange } = useCapacity()

const currentDate = ref(new Date())
const capacityData = ref([])
const loading = ref(false)
const showDayModal = ref(false)
const selectedDay = ref(null)
const isOffline = ref(!navigator.onLine)

const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const currentMonthYear = computed(() => {
  return currentDate.value.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  })
})

const monthStats = computed(() => {
  const currentMonth = calendarDays.value.filter(d => !d.isOtherMonth)
  const totalCapacity = currentMonth.reduce((sum, d) => sum + d.dailyCapacity, 0)
  const totalBooked = currentMonth.reduce((sum, d) => sum + d.totalBooked, 0)
  const utilizationRate = totalCapacity > 0 ? Math.round((totalBooked / totalCapacity) * 100) : 0
  return { totalCapacity, totalBooked, utilizationRate }
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
    daily_capacity: 27,
    total_booked: 0,
    buffer_slots: 1,
    bookable_capacity: 26,
    notes: null,
    blocks: [],
    patients: []
  }

  const dailyCapacity = capacity.daily_capacity || 27
  const totalBooked = capacity.total_booked ?? (capacity.am_booked + capacity.pm_booked) ?? 0

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
    dailyCapacity,
    totalBooked,
    bufferSlots: capacity.buffer_slots ?? 1,
    bookableCapacity: capacity.bookable_capacity ?? (dailyCapacity - 1),
    blocks: capacity.blocks || [],
    notes: capacity.notes,
    patients: capacity.patients || [],
    totalCapacity: dailyCapacity
  }
}

function getHeatmapClass(totalBooked, capacity) {
  if (!capacity || capacity <= 0 || totalBooked <= 0) return 'heatmap-empty'
  const pct = (totalBooked / capacity) * 100
  if (pct >= 100) return 'heatmap-full'
  if (pct >= 80) return 'heatmap-high'
  if (pct >= 50) return 'heatmap-moderate'
  return 'heatmap-low'
}

function formatLocalDate(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

async function loadCapacityFromOffline(startDate, endDate) {
  try {
    const start = formatLocalDate(startDate)
    const end = formatLocalDate(endDate)
    const allSchedules = await staffDB.patientschedule.toArray()
    const schedules = allSchedules.filter(s => {
      if (s.is_deleted) return false
      if (!s.scheduled_date) return false
      const status = (s.status || '').toLowerCase()
      if (status === 'completed' || status === 'missed') return false
      return s.scheduled_date >= start && s.scheduled_date <= end
    })

    const capacityByDate = {}
    schedules.forEach(schedule => {
      const date = schedule.scheduled_date
      if (!capacityByDate[date]) {
        capacityByDate[date] = {
          date, daily_capacity: 27, total_booked: 0,
          buffer_slots: 1, bookable_capacity: 26,
          notes: null, blocks: [], patients: []
        }
      }
      capacityByDate[date].total_booked++
    })
    return Object.values(capacityByDate)
  } catch {
    return []
  }
}

async function loadCapacityData() {
  loading.value = true
  try {
    const year = currentDate.value.getFullYear()
    const month = currentDate.value.getMonth()
    const firstDay = new Date(year, month, 1)
    const firstDayOfWeek = firstDay.getDay()
    const startDate = new Date(year, month, 1 - firstDayOfWeek)
    const lastDay = new Date(year, month + 1, 0)
    const endDate = new Date(year, month + 1, 42 - firstDayOfWeek - lastDay.getDate())

    const start = formatLocalDate(startDate)
    const end = formatLocalDate(endDate)

    if (!navigator.onLine) {
      isOffline.value = true
      capacityData.value = await loadCapacityFromOffline(startDate, endDate)
    } else {
      try {
        capacityData.value = await getCapacityRange(start, end)
        isOffline.value = false
      } catch {
        isOffline.value = true
        capacityData.value = await loadCapacityFromOffline(startDate, endDate)
      }
    }
  } catch {
    capacityData.value = []
  } finally {
    loading.value = false
  }
}

function previousMonth() {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() - 1, 1)
  loadCapacityData()
}

function nextMonth() {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1, 1)
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

function goBack() {
  router.push({ name: 'HealthWorkerDashboard' })
}

onMounted(() => {
  isOffline.value = !navigator.onLine
  loadCapacityData()
  window.addEventListener('online', () => { isOffline.value = false; loadCapacityData() })
  window.addEventListener('offline', () => { isOffline.value = true })
})
</script>

<style scoped>
.calendar-page {
  padding: 1rem;
}

.calendar-page-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.back-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #f9fafb;
  color: #374151;
  font-size: 1.125rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.back-btn:hover {
  background: #e5e7eb;
}

.page-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
  flex: 1;
}

/* Month Navigation */
.month-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.month-label {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1f2937;
  min-width: 160px;
  text-align: center;
}

.nav-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #f9fafb;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s;
}

.nav-btn:hover {
  background: #e5e7eb;
}

/* Stats */
.stats-row {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.stat-chip {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.5rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.stat-num {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
}

.stat-text {
  font-size: 0.7rem;
  color: #6b7280;
}

/* Calendar Grid */
.calendar-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  overflow: hidden;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
  padding: 2px;
  background: #e5e7eb;
}

.weekday-header {
  background: #22c55e;
  color: white;
  padding: 0.5rem;
  text-align: center;
  font-weight: 700;
  font-size: 0.75rem;
}

.calendar-day {
  background: white;
  min-height: 56px;
  padding: 0.375rem;
  position: relative;
  cursor: pointer;
  transition: all 0.2s;
}

.calendar-day.other-month {
  opacity: 0.3;
  cursor: default;
}

.calendar-day.weekend:not(.other-month) {
  background: repeating-linear-gradient(
    -45deg,
    #f5f5f5,
    #f5f5f5 4px,
    #eeeeee 4px,
    #eeeeee 8px
  );
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.calendar-day.weekend .day-number {
  color: #bdbdbd;
}

.calendar-day.weekend .day-booking-indicator {
  display: none;
}

.calendar-day.past:not(.today) {
  opacity: 0.6;
}

.calendar-day.today {
  background: #dcfce7;
  border: 2px solid #22c55e;
}

/* Heatmap */
.calendar-day.heatmap-empty { }
.calendar-day.heatmap-low:not(.today) { background: #f1f8e9; border-left: 3px solid #4caf50; }
.calendar-day.heatmap-moderate:not(.today) { background: #fff8e1; border-left: 3px solid #ff9800; }
.calendar-day.heatmap-high:not(.today) { background: #fbe9e7; border-left: 3px solid #f44336; }
.calendar-day.heatmap-full:not(.today) { background: #ffebee; border-left: 3px solid #b71c1c; }

.day-number {
  font-size: 0.8rem;
  font-weight: 600;
  color: #333;
}

.day-booking-indicator {
  margin-top: 2px;
}

.booking-count {
  display: inline-block;
  font-size: 0.7rem;
  font-weight: 700;
  background: #1976d2;
  color: white;
  border-radius: 4px;
  padding: 1px 5px;
}

.heatmap-legend {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 0.25rem;
  padding: 0.5rem;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
}

.legend-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 2px;
  margin-right: 0.25rem;
}

.legend-dot.heatmap-empty { background: #e0e0e0; }
.legend-dot.heatmap-low { background: #4caf50; }
.legend-dot.heatmap-moderate { background: #ff9800; }
.legend-dot.heatmap-high { background: #f44336; }
.legend-dot.heatmap-full { background: #b71c1c; }
</style>
