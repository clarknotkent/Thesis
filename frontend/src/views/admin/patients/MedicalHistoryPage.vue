<template>
  <AdminLayout>
    <div class="container-fluid py-3">
      <div class="d-flex align-items-center mb-3">
        <h3 class="mb-0">Medical History</h3>
        <button class="btn btn-outline-secondary ms-auto" @click="$router.back()">Back</button>
      </div>
      <div class="card shadow-sm">
        <div class="card-body">
          <MedicalHistory :patient-id="$route.params.id" :embedded-page="true" />
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import AdminLayout from '@/components/layout/AdminLayout.vue'
import MedicalHistory from '@/features/admin/patients/MedicalHistoryModal.vue'
</script>
