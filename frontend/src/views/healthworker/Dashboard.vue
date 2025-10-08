<template>
  <HealthWorkerLayout>
    <AppPageHeader
      title="Dashboard"
      subtitle="Welcome back, Dr. Sarah Wilson"
      :breadcrumbs="breadcrumbs"
    />

    <!-- Quick Stats - Mobile First Grid -->
    <div class="row g-3 mb-4">
      <div class="col-12 col-sm-6 col-lg-4">
        <AppCard class="hw-stat-card bg-info text-white h-100">
          <div class="text-center">
            <i class="bi bi-people-fill hw-stat-icon"></i>
            <h5>Today's Patients</h5>
            <h2 class="fw-bold">24</h2>
          </div>
        </AppCard>
      </div>
      <div class="col-12 col-sm-6 col-lg-4">
        <AppCard class="hw-stat-card bg-success text-white h-100">
          <div class="text-center">
            <i class="bi bi-syringe hw-stat-icon"></i>
            <h5>Administered</h5>
            <h2 class="fw-bold">18</h2>
          </div>
        </AppCard>
      </div>
      <div class="col-12 col-lg-4">
        <AppCard class="hw-stat-card bg-warning text-white h-100">
          <div class="text-center">
            <i class="bi bi-calendar-check hw-stat-icon"></i>
            <h5>Next Appointments</h5>
            <h2 class="fw-bold">6</h2>
          </div>
        </AppCard>
      </div>
    </div>

    <!-- Main Actions - Mobile First Grid -->
    <div class="row g-3 mb-4">
      <div class="col-12 col-md-6">
        <AppCard class="hw-action-card h-100">
          <template #header>
            <div class="bg-primary text-white">
              <h5 class="mb-0">
                <i class="bi bi-person-plus me-2"></i>
                Patient Management
              </h5>
            </div>
          </template>
          <div class="d-grid gap-3">
            <AppButton
              variant="success"
              size="lg"
              :to="'/healthworker/patients/new'"
              icon="bi bi-plus-circle"
              class="btn-hw-primary"
            >
              Register New Patient
            </AppButton>
            <AppButton
              variant="outline-primary"
              size="lg"
              :to="'/healthworker/patients'"
              icon="bi bi-search"
            >
              Find Patient Records
            </AppButton>
          </div>
        </AppCard>
      </div>
      <div class="col-12 col-md-6">
        <AppCard class="hw-action-card h-100">
          <template #header>
            <div class="bg-success text-white">
              <h5 class="mb-0">
                <i class="bi bi-syringe me-2"></i>
                Vaccine Administration
              </h5>
            </div>
          </template>
          <div class="d-grid gap-3">
            <AppButton
              variant="success"
              size="lg"
              :to="'/healthworker/patients'"
              icon="bi bi-syringe"
              class="btn-hw-primary"
            >
              Manage Patients & Vaccines
            </AppButton>
            <AppButton
              variant="outline-success"
              size="lg"
              :to="'/healthworker/inventory'"
              icon="bi bi-box-seam"
            >
              Check Vaccine Stock
            </AppButton>
          </div>
        </AppCard>
      </div>
    </div>

    <!-- Recent Activities -->
    <AppCard>
      <template #header>
        <h5 class="mb-0">
          <i class="bi bi-clock-history me-2"></i>
          Recent Activities
        </h5>
      </template>
      <div class="list-group list-group-flush">
        <div class="hw-activity-item d-flex justify-content-between align-items-center">
          <div>
            <h6 class="mb-1 fw-semibold">COVID-19 vaccine administered</h6>
            <p class="mb-1 text-muted">Patient: John Doe (ID: P-001)</p>
            <small class="text-muted">10 minutes ago</small>
          </div>
          <span class="hw-status-available">Completed</span>
        </div>
        <div class="hw-activity-item d-flex justify-content-between align-items-center">
          <div>
            <h6 class="mb-1 fw-semibold">Follow-up appointment scheduled</h6>
            <p class="mb-1 text-muted">Patient: Jane Smith (ID: P-002)</p>
            <small class="text-muted">1 hour ago</small>
          </div>
          <span class="badge bg-info rounded-pill">Scheduled</span>
        </div>
        <div class="hw-activity-item d-flex justify-content-between align-items-center">
          <div>
            <h6 class="mb-1 fw-semibold">New patient registered</h6>
            <p class="mb-1 text-muted">Patient: Mike Johnson (ID: P-003)</p>
            <small class="text-muted">2 hours ago</small>
          </div>
          <span class="badge bg-primary rounded-pill">Registered</span>
        </div>
      </div>
    </AppCard>
  </HealthWorkerLayout>
</template>

<script setup>
import HealthWorkerLayout from '@/components/layout/HealthWorkerLayout.vue'
import AppPageHeader from '@/components/common/AppPageHeader.vue'
import AppCard from '@/components/common/AppCard.vue'
import AppButton from '@/components/common/AppButton.vue'

const breadcrumbs = [
  { text: 'Health Worker', href: '#' },
  { text: 'Dashboard', active: true }
]
</script>
