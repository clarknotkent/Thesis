<template>
  <AdminLayout>
    <AdminAddRecordModal 
      :embeddedPage="true" 
      :initial-patient-id="$route.query.patientId || ''"
      :lock-patient-when-prefilled="!!$route.query.patientId"
      :default-record-mode="String($route.query.outside).toLowerCase() === 'true'"
      :initial-visit-id="$route.query.visitId || ''"
    />
  </AdminLayout>
</template>

<script setup>
import AdminLayout from '@/components/layout/AdminLayout.vue'
import AdminAddRecordModal from './AdminAddRecordModal.vue'
</script>
