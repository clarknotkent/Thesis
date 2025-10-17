<template>
  <AdminLayout>
    <div class="container-fluid">
      <!-- Breadcrumb -->
      <nav aria-label="breadcrumb" class="mb-3">
        <ol class="breadcrumb">
          <li class="breadcrumb-item">
            <router-link to="/admin/dashboard">Admin</router-link>
          </li>
          <li class="breadcrumb-item">
            <router-link to="/admin/vaccines">Vaccine Inventory</router-link>
          </li>
          <li class="breadcrumb-item active">View Schedule</li>
        </ol>
      </nav>

      <!-- Page Header -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 class="h3 mb-0 text-gray-800">
            <i class="bi bi-calendar-check me-2"></i>View Vaccine Schedule
          </h1>
          <p class="text-muted mb-0">Schedule details and dosage configuration</p>
        </div>
        <div class="d-flex gap-2">
          <button @click="goBack" class="btn btn-outline-secondary">
            <i class="bi bi-arrow-left me-2"></i>Back
          </button>
          <router-link to="/admin/vaccines" class="btn btn-outline-primary">
            <i class="bi bi-house me-2"></i>Home
          </router-link>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>

      <!-- Schedule Details -->
      <div v-else-if="scheduleData" class="card shadow mb-4">
        <div class="card-body p-4">
          <!-- Basic Info -->
          <div class="row g-4 mb-4">
            <div class="col-md-6">
              <div class="form-text">Schedule Name</div>
              <div class="fw-semibold fs-5">{{ scheduleData.name }}</div>
            </div>
            <div class="col-md-6">
              <div class="form-text">Schedule Code</div>
              <div class="fw-semibold">{{ scheduleData.code || '-' }}</div>
            </div>
            <div class="col-md-6">
              <div class="form-text">Vaccine Type</div>
              <div class="fw-semibold">{{ scheduleData.vaccine?.antigen_name || '-' }} ({{ scheduleData.vaccine?.brand_name || '-' }})</div>
            </div>
            <div class="col-md-6">
              <div class="form-text">Total Doses</div>
              <div class="fw-semibold fs-4 text-primary">{{ scheduleData.total_doses }}</div>
            </div>
            <div class="col-md-4">
              <div class="form-text">Concurrent Allowed</div>
              <div class="fw-semibold">{{ scheduleData.concurrent_allowed ? 'Yes' : 'No' }}</div>
            </div>
            <div class="col-md-4">
              <div class="form-text">Minimum Age (days)</div>
              <div class="fw-semibold">{{ scheduleData.min_age_days }}</div>
            </div>
            <div class="col-md-4">
              <div class="form-text">Maximum Age (days)</div>
              <div class="fw-semibold">{{ scheduleData.max_age_days || 'Not set' }}</div>
            </div>
            <div class="col-12">
              <div class="form-text">Catch-up Strategy</div>
              <div class="fw-semibold">{{ scheduleData.catchup_strategy || '-' }}</div>
            </div>
            <div class="col-12">
              <div class="form-text">Notes</div>
              <div class="fw-semibold">{{ scheduleData.notes || '-' }}</div>
            </div>
          </div>

          <!-- Doses -->
          <hr>
          <h5 class="mb-3">
            <i class="bi bi-list-ol me-2"></i>Dose Configuration
          </h5>
          <div v-if="doses.length > 0" class="row g-3">
            <div v-for="(dose, index) in doses" :key="index" class="col-12">
              <div class="card">
                <div class="card-header bg-light">
                  <strong>Dose {{ dose.dose_number }}</strong>
                </div>
                <div class="card-body">
                  <div class="row g-3">
                    <div class="col-md-3">
                      <small class="text-muted">Due After Days</small>
                      <div class="fw-semibold">{{ dose.due_after_days }}</div>
                    </div>
                    <div class="col-md-3">
                      <small class="text-muted">Min Interval (days)</small>
                      <div class="fw-semibold">{{ dose.min_interval_days || '-' }}</div>
                    </div>
                    <div class="col-md-3">
                      <small class="text-muted">Max Interval (days)</small>
                      <div class="fw-semibold">{{ dose.max_interval_days || '-' }}</div>
                    </div>
                    <div class="col-md-3">
                      <small class="text-muted">Min Interval Other Vax</small>
                      <div class="fw-semibold">{{ dose.min_interval_other_vax || '-' }}</div>
                    </div>
                    <div class="col-md-3">
                      <small class="text-muted">Requires Previous</small>
                      <div class="fw-semibold">{{ dose.requires_previous ? 'Yes' : 'No' }}</div>
                    </div>
                    <div class="col-md-3">
                      <small class="text-muted">Skippable</small>
                      <div class="fw-semibold">{{ dose.skippable ? 'Yes' : 'No' }}</div>
                    </div>
                    <div class="col-md-3">
                      <small class="text-muted">Grace Period (days)</small>
                      <div class="fw-semibold">{{ dose.grace_period_days || '-' }}</div>
                    </div>
                    <div class="col-md-3">
                      <small class="text-muted">Absolute Latest (days)</small>
                      <div class="fw-semibold">{{ dose.absolute_latest_days || '-' }}</div>
                    </div>
                    <div class="col-12" v-if="dose.notes">
                      <small class="text-muted">Notes</small>
                      <div class="fw-semibold">{{ dose.notes }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="alert alert-info">
            No dose configuration available
          </div>

          <!-- Action Buttons -->
          <div class="d-flex justify-content-end gap-2 mt-4 pt-4 border-top">
            <router-link 
              :to="`/admin/vaccines/schedules/edit/${scheduleId}`" 
              class="btn btn-primary"
            >
              <i class="bi bi-pencil me-2"></i>Edit Schedule
            </router-link>
          </div>
        </div>
      </div>

      <!-- Error State -->
      <div v-else class="alert alert-danger">
        <i class="bi bi-exclamation-circle me-2"></i>
        Failed to load schedule data. <router-link to="/admin/vaccines">Go back to inventory</router-link>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import api from '@/services/api'
import { useToast } from '@/composables/useToast'

const route = useRoute()
const router = useRouter()
const { addToast } = useToast()

const loading = ref(true)
const scheduleData = ref(null)
const scheduleId = computed(() => route.params.id)

const goBack = () => {
  router.back()
}

const doses = computed(() => {
  if (!scheduleData.value) return []
  const rawDoses = scheduleData.value.schedule_doses || scheduleData.value.doses || []
  return rawDoses.sort((a, b) => (a.dose_number || 0) - (b.dose_number || 0))
})

onMounted(async () => {
  await fetchSchedule()
})

const fetchSchedule = async () => {
  try {
    const id = scheduleId.value
    const res = await api.get(`/vaccines/schedules/${id}`)
    scheduleData.value = res.data?.data || res.data
    console.log('Schedule data:', scheduleData.value)
  } catch (error) {
    console.error('Error fetching schedule:', error)
    addToast('Error loading schedule data', 'error')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.breadcrumb {
  background-color: transparent;
  padding: 0;
  margin: 0;
}

.breadcrumb-item + .breadcrumb-item::before {
  content: "›";
  color: #6c757d;
}

.breadcrumb-item a {
  color: #4e73df;
  text-decoration: none;
}

.breadcrumb-item a:hover {
  text-decoration: underline;
}

.breadcrumb-item.active {
  color: #6c757d;
}

.text-gray-800 {
  color: #5a5c69 !important;
}
</style>
