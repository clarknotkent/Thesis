<template>
  <div class="weekly-calendar-widget">
    <!-- Week Header -->
    <div class="week-header">
      <button
        class="week-nav-btn"
        title="Previous Week"
        @click="previousWeek"
      >
        <i class="bi bi-chevron-left" />
      </button>

      <button
        class="calendar-btn"
        title="View Full Calendar"
        @click="openFullCalendar"
      >
        <i class="bi bi-calendar3" />
      </button>

      <span class="week-label">{{ weekLabel }}</span>

      <button
        class="week-nav-btn"
        title="Next Week"
        @click="nextWeek"
      >
        <i class="bi bi-chevron-right" />
      </button>
    </div>

    <!-- Loading State -->
    <div
      v-if="loading"
      class="text-center py-3"
    >
      <div
        class="spinner-border spinner-border-sm text-primary"
        role="status"
      >
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>

    <!-- Weekday Grid (Mon-Fri) -->
    <div
      v-else
      class="week-grid"
    >
      <div
        v-for="day in weekDays"
        :key="day.dateKey"
        class="week-day"
        :class="{
          'today': day.isToday,
          'has-bookings': day.totalBooked > 0
        }"
        @click="$emit('day-click', day)"
      >
        <div class="day-label">
          {{ day.dayName }}
        </div>
        <div class="day-number">
          {{ day.dayNumber }}
        </div>
        <div
          v-if="day.totalBooked > 0"
          class="day-dot"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCapacity } from '@/composables/useCapacity'
import { db as staffDB } from '@/services/offline/db'

const router = useRouter()
const { getCapacityRange } = useCapacity()

const emit = defineEmits(['day-click'])

const currentWeekStart = ref(getMonday(new Date()))
const capacityData = ref([])
const loading = ref(false)

function getMonday(date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Adjust for Sunday
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function formatDate(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const weekLabel = computed(() => {
  const start = currentWeekStart.value
  return start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
})

const weekDays = computed(() => {
  const days = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const dayNames = ['M', 'T', 'W', 'Th', 'F']

  for (let i = 0; i < 5; i++) {
    const date = new Date(currentWeekStart.value)
    date.setDate(date.getDate() + i)
    const dateStr = formatDate(date)

    const capacity = capacityData.value.find(c => c.date === dateStr) || {
      am_booked: 0,
      pm_booked: 0
    }

    days.push({
      date: dateStr,
      dateKey: dateStr,
      dayName: dayNames[i],
      dayNumber: date.getDate(),
      isToday: date.getTime() === today.getTime(),
      totalBooked: capacity.am_booked + capacity.pm_booked
    })
  }
  return days
})

async function loadCapacityFromOffline(start, end) {
  try {
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
        capacityByDate[date] = { date, am_booked: 0, pm_booked: 0 }
      }
      if (schedule.time_slot === 'AM') {
        capacityByDate[date].am_booked++
      } else if (schedule.time_slot === 'PM') {
        capacityByDate[date].pm_booked++
      }
    })
    return Object.values(capacityByDate)
  } catch {
    return []
  }
}

async function loadWeekData() {
  loading.value = true
  try {
    const friday = new Date(currentWeekStart.value)
    friday.setDate(friday.getDate() + 4)
    const start = formatDate(currentWeekStart.value)
    const end = formatDate(friday)

    if (navigator.onLine) {
      try {
        capacityData.value = await getCapacityRange(start, end)
      } catch {
        capacityData.value = await loadCapacityFromOffline(start, end)
      }
    } else {
      capacityData.value = await loadCapacityFromOffline(start, end)
    }
  } catch {
    capacityData.value = []
  } finally {
    loading.value = false
  }
}

function previousWeek() {
  const d = new Date(currentWeekStart.value)
  d.setDate(d.getDate() - 7)
  currentWeekStart.value = d
  loadWeekData()
}

function nextWeek() {
  const d = new Date(currentWeekStart.value)
  d.setDate(d.getDate() + 7)
  currentWeekStart.value = d
  loadWeekData()
}

function openFullCalendar() {
  router.push({ name: 'HealthWorkerCalendar' })
}

onMounted(() => {
  loadWeekData()
})
</script>

<style scoped>
.weekly-calendar-widget {
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  border: 1px solid #e5e7eb;
}

.week-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #f3f4f6;
}

.week-label {
  font-size: 1rem;
  font-weight: 700;
  color: #1f2937;
  min-width: 120px;
  text-align: center;
}

.week-nav-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #f9fafb;
  color: #374151;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.week-nav-btn:hover {
  background: #e5e7eb;
  border-color: #d1d5db;
}

.week-nav-btn:active {
  transform: scale(0.95);
}

.calendar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid #007bff;
  border-radius: 8px;
  background: #007bff;
  color: #ffffff;
  font-size: 1.125rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.calendar-btn:hover {
  background: #0056b3;
  border-color: #0056b3;
}

.calendar-btn:active {
  transform: scale(0.95);
}

.week-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0;
  padding: 0.75rem;
}

.week-day {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.375rem;
  padding: 0.75rem 0.5rem;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.week-day:hover {
  background: #f3f4f6;
}

.week-day.today {
  background: #007bff;
  color: #ffffff;
}

.week-day.today .day-label,
.week-day.today .day-number {
  color: #ffffff;
}

.day-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.day-number {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
}

.day-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #22c55e;
}

.week-day.today .day-dot {
  background: #ffffff;
}

@media (max-width: 576px) {
  .week-header {
    gap: 0.5rem;
    padding: 0.875rem 1rem;
  }

  .week-label {
    font-size: 0.875rem;
  }

  .day-number {
    font-size: 1.125rem;
  }
}
</style>
