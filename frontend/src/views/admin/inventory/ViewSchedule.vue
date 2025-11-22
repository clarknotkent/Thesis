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
          <li class="breadcrumb-item">
            <router-link to="/admin/vaccines">
              Vaccine Inventory
            </router-link>
          </li>
          <li class="breadcrumb-item active">
            View Schedule
          </li>
        </ol>
      </nav>

      <!-- Page Header -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 class="h3 mb-0 text-gray-800">
            <i class="bi bi-calendar-check me-2" />View Vaccine Schedule
          </h1>
          <p class="text-muted mb-0">
            Schedule details and dosage configuration
          </p>
        </div>
        <div class="d-flex gap-2">
          <button
            class="btn btn-outline-secondary"
            @click="goBack"
          >
            <i class="bi bi-arrow-left me-2" />Back
          </button>
          <router-link
            to="/admin/vaccines"
            class="btn btn-outline-primary"
          >
            <i class="bi bi-house me-2" />Home
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
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>

      <!-- Schedule Details -->
      <div
        v-else-if="scheduleData"
        class="card shadow mb-4"
      >
        <div class="card-body p-4">
          <!-- Basic Info -->
          <div class="row g-3 mb-3">
            <div class="col-md-6">
              <label class="form-label text-muted small mb-1">Schedule Name</label>
              <input
                type="text"
                class="form-control form-control-sm"
                :value="scheduleData.name"
                readonly
              >
            </div>
            <div class="col-md-6">
              <label class="form-label text-muted small mb-1">Schedule Code</label>
              <input
                type="text"
                class="form-control form-control-sm"
                :value="scheduleData.code || '-'"
                readonly
              >
            </div>
            <div class="col-md-8">
              <label class="form-label text-muted small mb-1">Vaccine Type</label>
              <input
                type="text"
                class="form-control form-control-sm"
                :value="`${scheduleData.vaccine?.antigen_name || '-'} (${scheduleData.vaccine?.brand_name || '-'})`"
                readonly
              >
            </div>
            <div class="col-md-4">
              <label class="form-label text-muted small mb-1">Total Doses</label>
              <input
                type="text"
                class="form-control form-control-sm fw-bold text-primary"
                :value="scheduleData.total_doses"
                readonly
              >
            </div>
            <div class="col-md-4">
              <label class="form-label text-muted small mb-1">Concurrent Allowed</label>
              <input
                type="text"
                class="form-control form-control-sm"
                :value="scheduleData.concurrent_allowed ? 'Yes' : 'No'"
                readonly
              >
            </div>
            <div class="col-md-4">
              <label class="form-label text-muted small mb-1">Minimum Age (days)</label>
              <input
                type="text"
                class="form-control form-control-sm"
                :value="scheduleData.min_age_days"
                readonly
              >
            </div>
            <div class="col-md-4">
              <label class="form-label text-muted small mb-1">Maximum Age (days)</label>
              <input
                type="text"
                class="form-control form-control-sm"
                :value="scheduleData.max_age_days || 'Not set'"
                readonly
              >
            </div>
            <div class="col-md-6">
              <label class="form-label text-muted small mb-1">Catch-up Strategy</label>
              <input
                type="text"
                class="form-control form-control-sm"
                :value="scheduleData.catchup_strategy || '-'"
                readonly
              >
            </div>
            <div class="col-md-6">
              <label class="form-label text-muted small mb-1">Notes</label>
              <textarea
                class="form-control form-control-sm"
                :value="scheduleData.notes || '-'"
                rows="1"
                readonly
              />
            </div>
          </div>

          <!-- Doses -->
          <hr class="my-3">
          <h6 class="mb-3">
            <i class="bi bi-list-ol me-2" />Dose Configuration
          </h6>
          <div
            v-if="doses.length > 0"
            class="row g-2"
          >
            <div
              v-for="(dose, index) in doses"
              :key="index"
              class="col-12"
            >
              <div class="card">
                <div class="card-header bg-light py-2">
                  <strong class="small">Dose {{ dose.dose_number }}</strong>
                </div>
                <div class="card-body p-3">
                  <div class="row g-2">
                    <div class="col-md-3">
                      <label class="form-label text-muted small mb-1">Due After Days</label>
                      <input
                        type="text"
                        class="form-control form-control-sm"
                        :value="dose.due_after_days"
                        readonly
                      >
                    </div>
                    <div class="col-md-3">
                      <label class="form-label text-muted small mb-1">Min Interval (days)</label>
                      <input
                        type="text"
                        class="form-control form-control-sm"
                        :value="dose.min_interval_days || '-'"
                        readonly
                      >
                    </div>
                    <div class="col-md-3">
                      <label class="form-label text-muted small mb-1">Max Interval (days)</label>
                      <input
                        type="text"
                        class="form-control form-control-sm"
                        :value="dose.max_interval_days || '-'"
                        readonly
                      >
                    </div>
                    <div class="col-md-3">
                      <label class="form-label text-muted small mb-1">Min Interval Other Vax</label>
                      <input
                        type="text"
                        class="form-control form-control-sm"
                        :value="dose.min_interval_other_vax || '-'"
                        readonly
                      >
                    </div>
                    <div class="col-md-3">
                      <label class="form-label text-muted small mb-1">Requires Previous</label>
                      <input
                        type="text"
                        class="form-control form-control-sm"
                        :value="dose.requires_previous ? 'Yes' : 'No'"
                        readonly
                      >
                    </div>
                    <div class="col-md-3">
                      <label class="form-label text-muted small mb-1">Skippable</label>
                      <input
                        type="text"
                        class="form-control form-control-sm"
                        :value="dose.skippable ? 'Yes' : 'No'"
                        readonly
                      >
                    </div>
                    <div class="col-md-3">
                      <label class="form-label text-muted small mb-1">Grace Period (days)</label>
                      <input
                        type="text"
                        class="form-control form-control-sm"
                        :value="dose.grace_period_days || '-'"
                        readonly
                      >
                    </div>
                    <div class="col-md-3">
                      <label class="form-label text-muted small mb-1">Absolute Latest (days)</label>
                      <input
                        type="text"
                        class="form-control form-control-sm"
                        :value="dose.absolute_latest_days || '-'"
                        readonly
                      >
                    </div>
                    <div
                      v-if="dose.notes"
                      class="col-12"
                    >
                      <label class="form-label text-muted small mb-1">Notes</label>
                      <textarea
                        class="form-control form-control-sm"
                        :value="dose.notes"
                        rows="1"
                        readonly
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div
            v-else
            class="alert alert-info"
          >
            No dose configuration available
          </div>

          <!-- Action Buttons -->
          <div class="d-flex justify-content-end gap-2 mt-3 pt-3 border-top">
            <router-link 
              :to="`/admin/vaccines/schedules/edit/${scheduleId}`" 
              class="btn btn-primary btn-sm"
              :class="{ disabled: isOffline }"
              :aria-disabled="isOffline"
              @click.prevent="isOffline ? null : null"
            >
              <i class="bi bi-pencil me-2" />Edit Schedule
            </router-link>
          </div>
        </div>
      </div>

      <!-- Error State -->
      <div
        v-else
        class="alert alert-danger"
      >
        <i class="bi bi-exclamation-circle me-2" />
        Failed to load schedule data. <router-link to="/admin/vaccines">
          Go back to inventory
        </router-link>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import AdminLayout from '@/components/layout/desktop/AdminLayout.vue'
import { useToast } from '@/composables/useToast'
import { useOfflineAdmin } from '@/composables/useOfflineAdmin'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const { addToast } = useToast()
const { fetchScheduleById } = useOfflineAdmin()

const loading = ref(true)
const scheduleData = ref(null)
const scheduleId = computed(() => route.params.id)
const isOffline = ref(!navigator.onLine)

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
    const res = await fetchScheduleById(id)
    scheduleData.value = res.data || res
  } catch (error) {
    console.error('Error fetching schedule:', error)
    addToast({ message: 'Error loading schedule data', type: 'error' })
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

.form-control[readonly] {
  background-color: #f8f9fa;
  border-color: #e9ecef;
  cursor: default;
}

.form-control[readonly]:focus {
  background-color: #f8f9fa;
  border-color: #e9ecef;
  box-shadow: none;
}
</style>
