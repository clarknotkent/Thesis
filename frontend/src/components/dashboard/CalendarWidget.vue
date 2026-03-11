<template>
  <div class="calendar-widget">
    <div class="widget-header">
      <h5 class="mb-0">
        <i class="bi bi-calendar-week me-2" />
        Today's Schedule
      </h5>
      <span class="badge bg-primary">{{ formatDate(today) }}</span>
    </div>

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

    <div v-else>
      <!-- Today's Capacity Summary -->
      <div class="capacity-summary">
        <div class="slot-summary daily">
          <div class="slot-header">
            <i class="bi bi-calendar-range" />
            <span>Today's Schedule</span>
          </div>
          <div class="slot-stats">
            <span class="count">{{ todayCapacity.total_booked || 0 }}/{{ todayCapacity.daily_capacity || 27 }}</span>
            <div class="progress">
              <div
                class="progress-bar"
                :class="dailyProgressClass"
                :style="{ width: dailyUtilization + '%' }"
              />
            </div>
          </div>
          <div class="slot-details mt-2">
            <small class="text-muted">
              Buffer: {{ todayCapacity.buffer_slots ?? 1 }} slot reserved for reschedules
            </small>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="widget-actions">
        <button
          class="btn btn-sm btn-outline-primary w-100"
          @click="viewFullCalendar"
        >
          <i class="bi bi-calendar3 me-1" />
          View Full Calendar
        </button>
      </div>

      <!-- Upcoming Week Preview -->
      <div class="week-preview">
        <h6 class="preview-title">
          This Week
        </h6>
        <div class="week-days">
          <div
            v-for="day in weekDays"
            :key="day.date"
            class="week-day"
            :class="[
              { 'today': day.isToday },
              day.heatmapClass
            ]"
          >
            <div class="day-name">
              {{ day.dayName }}
            </div>
            <div class="day-number">
              {{ day.dayNumber }}
            </div>
            <div class="day-total">
              {{ day.totalBooked }}/{{ day.totalCapacity }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCapacity } from '@/composables/useCapacity'

const router = useRouter()
const { getCapacityForDate, getCapacityRange } = useCapacity()

const loading = ref(false)
const today = new Date().toISOString().split('T')[0]
const todayCapacity = ref({
  daily_capacity: 27,
  total_booked: 0,
  buffer_slots: 1,
  bookable_capacity: 26
})
const weekDays = ref([])

const dailyUtilization = computed(() => {
  const cap = todayCapacity.value.daily_capacity || 27
  return cap > 0 ? (todayCapacity.value.total_booked / cap) * 100 : 0
})

const dailyProgressClass = computed(() => {
  const pct = dailyUtilization.value
  if (pct >= 100) return 'bg-danger'
  if (pct >= 80) return 'bg-warning'
  if (pct >= 50) return 'bg-info'
  return 'bg-success'
})

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  })
}

function viewFullCalendar() {
  router.push('/admin/scheduling-calendar')
}

async function loadTodayCapacity() {
  loading.value = true
  try {
    const capacity = await getCapacityForDate(today)
    if (capacity) {
      todayCapacity.value = capacity
    }
  } catch (error) {
    console.error('Failed to load today capacity:', error)
  } finally {
    loading.value = false
  }
}

async function loadWeekPreview() {
  try {
    const todayDate = new Date()
    const endOfWeek = new Date(todayDate)
    endOfWeek.setDate(todayDate.getDate() + 6)
    
    const start = todayDate.toISOString().split('T')[0]
    const end = endOfWeek.toISOString().split('T')[0]
    
    const capacities = await getCapacityRange(start, end)
    
    weekDays.value = capacities.map((cap, _index) => {
      const date = new Date(cap.date)
      const totalCapacity = cap.daily_capacity || 27
      const totalBooked = cap.total_booked ?? (cap.am_booked + cap.pm_booked) ?? 0
      
      // Heatmap class logic
      let heatmapClass = 'heatmap-empty'
      if (totalCapacity > 0 && totalBooked > 0) {
        const pct = (totalBooked / totalCapacity) * 100
        if (pct >= 100) heatmapClass = 'heatmap-full'
        else if (pct >= 80) heatmapClass = 'heatmap-high'
        else if (pct >= 50) heatmapClass = 'heatmap-moderate'
        else heatmapClass = 'heatmap-low'
      }
      
      return {
        date: cap.date,
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNumber: date.getDate(),
        totalCapacity,
        totalBooked,
        isFull: totalBooked >= totalCapacity,
        isToday: cap.date === today,
        heatmapClass
      }
    })
  } catch (error) {
    console.error('Failed to load week preview:', error)
  }
}

onMounted(() => {
  loadTodayCapacity()
  loadWeekPreview()
})
</script>

<style scoped>
.calendar-widget {
  background: white;
  border-radius: 8px;
  padding: 1.25rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.widget-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid #e9ecef;
}

.capacity-summary {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
}

.slot-summary {
  padding: 0.75rem;
  border-radius: 6px;
  background: #f8f9fa;
}

.slot-summary.daily {
  border-left: 4px solid #1976d2;
  grid-column: span 2;
}

.slot-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #495057;
}

.slot-stats {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.slot-stats .count {
  font-weight: 600;
  font-size: 1.125rem;
  min-width: 60px;
}

.slot-stats .progress {
  flex: 1;
  height: 8px;
}

.widget-actions {
  margin: 1rem 0;
}

.week-preview {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #dee2e6;
}

.preview-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #6c757d;
  margin-bottom: 0.75rem;
}

.week-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.5rem;
}

.week-day {
  text-align: center;
  padding: 0.5rem 0.25rem;
  border-radius: 6px;
  background: #f8f9fa;
  font-size: 0.75rem;
  transition: all 0.2s;
}

.week-day.today {
  background: #cfe2ff;
  border: 2px solid #0d6efd;
  font-weight: 600;
}

.week-day.heatmap-empty {
  background: #f8f9fa;
}

.week-day.heatmap-low {
  background: #e8f5e9;
}

.week-day.heatmap-moderate {
  background: #fff8e1;
}

.week-day.heatmap-high {
  background: #fbe9e7;
}

.week-day.heatmap-full {
  background: #ffebee;
}

.week-day:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.day-name {
  font-weight: 600;
  color: #495057;
  margin-bottom: 0.25rem;
}

.day-number {
  font-size: 1rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
}

.day-total {
  font-size: 0.7rem;
  color: #6c757d;
}
</style>
