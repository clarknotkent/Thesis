<template>
  <HealthWorkerLayout>
    <!-- 2x2 Gallery Grid -->
    <div class="dashboard-gallery">
      <div class="row g-3">
        <!-- Total Patients -->
        <div class="col-6">
          <AppCard class="hw-gallery-card bg-primary text-white h-100">
            <div class="text-center">
              <i class="bi bi-people-fill hw-gallery-icon"></i>
              <h6 class="mb-1">Total Patients</h6>
              <h3 class="fw-bold mb-0">156</h3>
            </div>
          </AppCard>
        </div>

        <!-- Today's Appointments -->
        <div class="col-6">
          <AppCard class="hw-gallery-card bg-info text-white h-100">
            <div class="text-center">
              <i class="bi bi-calendar-check-fill hw-gallery-icon"></i>
              <h6 class="mb-1">Today's Appointments</h6>
              <h3 class="fw-bold mb-0">8</h3>
            </div>
          </AppCard>
        </div>

        <!-- Notifications -->
        <div class="col-6">
          <AppCard class="hw-gallery-card bg-warning text-white h-100">
            <div class="text-center">
              <i class="bi bi-bell-fill hw-gallery-icon"></i>
              <h6 class="mb-1">Notifications</h6>
              <h3 class="fw-bold mb-0">3</h3>
            </div>
          </AppCard>
        </div>

        <!-- New Messages -->
        <div class="col-6">
          <AppCard class="hw-gallery-card bg-success text-white h-100">
            <div class="text-center">
              <i class="bi bi-chat-dots-fill hw-gallery-icon"></i>
              <h6 class="mb-1">New Messages</h6>
              <h3 class="fw-bold mb-0">5</h3>
            </div>
          </AppCard>
        </div>
      </div>
    </div>
  </HealthWorkerLayout>
</template>

<script setup>
import HealthWorkerLayout from '@/components/layout/HealthWorkerLayout.vue'
import AppCard from '@/components/ui/base/AppCard.vue'
</script>
