<template>
  <div class="card shadow mb-4">
    <div class="card-header py-3 d-flex justify-content-between align-items-center">
      <h6 class="m-0 fw-bold text-primary">Vaccine Schedules</h6>
      <div>
        <router-link to="/admin/vaccines/schedules/add" class="btn btn-sm btn-primary">
          <i class="bi bi-plus-circle me-2"></i>New Schedule
        </router-link>
      </div>
    </div>
    <div class="card-body">
      <div class="table-responsive">
        <table class="table table-hover">
          <thead class="table-light">
            <tr>
              <th>Schedule Name</th>
              <th>Vaccine</th>
              <th>Total Doses</th>
              <th>Created</th>
              <th>Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="s in schedules" :key="s.id || s.schedule_master_id">
              <td>{{ s.name }}</td>
              <td>{{ s.vaccine?.antigen_name || s.vaccine?.brand_name || (s.vaccine_id) }}</td>
              <td>{{ s.total_doses }}</td>
              <td>{{ formatDate(s.created_at) }}</td>
              <td>{{ formatDate(s.updated_at) }}</td>
              <td>
                <router-link 
                  :to="`/admin/vaccines/schedules/view/${s.id || s.schedule_master_id}`"
                  class="btn btn-sm btn-outline-primary"
                >
                  <i class="bi bi-eye me-2"></i>View
                </router-link>
              </td>
            </tr>
            <tr v-if="schedules.length === 0">
              <td colspan="6" class="text-center text-muted py-4">No schedules defined</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/services/api'

// State
const schedules = ref([])

// Lifecycle
onMounted(async () => {
  await fetchSchedules()
})

// API Calls
const fetchSchedules = async () => {
  try {
    const res = await api.get('/vaccines/schedules')
    const data = res.data?.data || res.data || []
    schedules.value = Array.isArray(data) ? data : []
  } catch (e) {
    console.error('Error fetching schedules', e)
    schedules.value = []
  }
}

// Date Formatting
const formatDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('en-PH', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}
</script>

<style scoped>
</style>
