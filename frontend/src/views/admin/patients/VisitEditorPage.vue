<template>
  <AdminLayout>
    <div class="container-fluid py-3">
      <div class="d-flex align-items-center mb-3">
        <h3 class="mb-0">
          Edit Visit Record
        </h3>
        <button
          class="btn btn-outline-secondary ms-auto"
          @click="$router.back()"
        >
          Back
        </button>
      </div>
      <div class="card shadow-sm">
        <div class="card-body">
          <VisitEditor
            :embedded="true"
            :existing-visit-id="$route.params.visitId"
            :initial-patient-id="$route.params.patientId"
            :view-mode="false"
            :edit-mode="true"
            @close="$router.back()"
            @saved="$router.back()"
          />
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import AdminLayout from '@/components/layout/desktop/AdminLayout.vue'
import VisitEditor from '@/features/admin/patients/VisitEditor.vue'
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

onMounted(() => {
  // Page initialization
})
</script>
