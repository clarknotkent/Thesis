/**
 * Scheduling Calendar Logic
 * File: frontend/src/views/admin/SchedulingCalendar.vue
 * 
 * Core calendar grid generation logic for capacity scheduling
 * Generates a 6x7 grid (42 days) with padding for previous and next month
 */

import { ref, computed } from 'vue'

// ==================== STATE ====================
const currentDate = ref(new Date())
const capacityData = ref([])

// ==================== COMPUTED: CALENDAR DAYS ====================
const calendarDays = computed(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()
  
  // First day of the month
  const firstDay = new Date(year, month, 1)
  const firstDayOfWeek = firstDay.getDay() // 0 = Sunday, 6 = Saturday
  
  // Last day of the month
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()
  
  // Build the calendar grid
  const days = []
  
  // Previous month padding
  const prevMonthLastDay = new Date(year, month, 0).getDate()
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const dayNum = prevMonthLastDay - i
    const date = new Date(year, month - 1, dayNum)
    days.push(createDayObject(date, true)) // isOtherMonth = true
  }
  
  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day)
    days.push(createDayObject(date, false)) // isOtherMonth = false
  }
  
  // Next month padding to complete the grid (6 rows × 7 days = 42 total)
  const remainingDays = 42 - days.length
  for (let day = 1; day <= remainingDays; day++) {
    const date = new Date(year, month + 1, day)
    days.push(createDayObject(date, true)) // isOtherMonth = true
  }
  
  return days
})

// ==================== HELPER: CREATE DAY OBJECT ====================
function createDayObject(date, isOtherMonth) {
  // Format date as YYYY-MM-DD in local timezone (avoid UTC conversion)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const dateStr = `${year}-${month}-${day}`
  
  // Find capacity data for this date
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
  const utilizationPercent = totalCapacity > 0 ? (totalBooked / totalCapacity) * 100 : 0
  
  // Determine if today
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const checkDate = new Date(date)
  checkDate.setHours(0, 0, 0, 0)
  
  const dayOfWeek = date.getDay()
  
  return {
    date: dateStr,                                        // "2026-02-03"
    dateKey: `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`, // Unique key
    dayNumber: date.getDate(),                            // 1-31
    isOtherMonth,                                         // Boolean
    isToday: checkDate.getTime() === today.getTime(),     // Boolean
    isPast: checkDate < today,                            // Boolean
    isWeekend: dayOfWeek === 0 || dayOfWeek === 6,        // Boolean
    amCapacity: capacity.am_capacity,                     // AM slot capacity
    pmCapacity: capacity.pm_capacity,                     // PM slot capacity
    amBooked: capacity.am_booked,                         // AM slots booked
    pmBooked: capacity.pm_booked,                         // PM slots booked
    notes: capacity.notes,                                // Optional notes
    patients: capacity.patients || [],                    // Scheduled patients
    utilizationPercent,                                   // 0-100
    totalCapacity,                                        // Total slots
    totalBooked                                           // Total booked
  }
}

// ==================== HELPER: SLOT PERCENTAGE ====================
function getSlotPercentage(booked, capacity) {
  return capacity > 0 ? Math.min((booked / capacity) * 100, 100) : 0
}

// ==================== HELPER: PROGRESS CLASS ====================
function getProgressClass(booked, capacity) {
  const percent = getSlotPercentage(booked, capacity)
  if (percent >= 100) return 'full'       // Red
  if (percent >= 80) return 'limited'     // Orange/Yellow
  return 'available'                      // Green/Blue
}

// ==================== MONTH NAVIGATION ====================
function previousMonth() {
  currentDate.value = new Date(
    currentDate.value.getFullYear(),
    currentDate.value.getMonth() - 1,
    1
  )
}

function nextMonth() {
  currentDate.value = new Date(
    currentDate.value.getFullYear(),
    currentDate.value.getMonth() + 1,
    1
  )
}

function goToToday() {
  currentDate.value = new Date()
}

// ==================== MONTH STATS ====================
const monthStats = computed(() => {
  const currentMonth = calendarDays.value.filter(d => !d.isOtherMonth)
  const totalCapacity = currentMonth.reduce((sum, d) => sum + d.totalCapacity, 0)
  const totalBooked = currentMonth.reduce((sum, d) => sum + d.totalBooked, 0)
  const utilizationRate = totalCapacity > 0 ? Math.round((totalBooked / totalCapacity) * 100) : 0
  
  return {
    totalCapacity,
    totalBooked,
    available: totalCapacity - totalBooked,
    utilizationRate
  }
})

// ==================== USAGE EXAMPLE ====================
/*
<template>
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
          'limited': day.utilizationPercent >= 80 && day.utilizationPercent < 100,
          'full': day.utilizationPercent >= 100,
          'past': day.isPast && !day.isToday
        }
      ]"
    >
      <div class="day-number">{{ day.dayNumber }}</div>
      <div class="capacity-info">
        <span>AM: {{ day.amBooked }}/{{ day.amCapacity }}</span>
        <span>PM: {{ day.pmBooked }}/{{ day.pmCapacity }}</span>
      </div>
    </div>
  </div>
</template>
*/

export {
  currentDate,
  capacityData,
  calendarDays,
  monthStats,
  createDayObject,
  getSlotPercentage,
  getProgressClass,
  previousMonth,
  nextMonth,
  goToToday
}
