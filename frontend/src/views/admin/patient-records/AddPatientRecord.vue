<template>
  <AdminLayout>
    <div class="container-fluid py-3">
      <AdminAddRecordModal 
        :embeddedPage="true" 
        :initial-patient-id="$route.query.patientId || ''"
        :default-record-mode="String($route.query.outside).toLowerCase() === 'true'"
        :initial-visit-id="$route.query.visitId || ''"
      />
    </div>
  </AdminLayout>
</template>

<script setup>
import AdminLayout from '@/components/layout/AdminLayout.vue'
import AdminAddRecordModal from '@/components/common/AdminAddRecordModal.vue'
</script>
