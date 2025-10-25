<template>
  <AdminLayout>
    <div class="container-fluid py-3">

      <VaccinationRecordEditor
        :embedded-page="true"
        :patient-id="$route.params.id"
        :patient-data="null"
        :default-outside="defaultOutside"
        :visit-context="visitContext"
        :edit-record-id="editRecordId"
      />
    </div>
  </AdminLayout>
  </template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import VaccinationRecordEditor from '@/features/patient-management/VaccinationRecordEditor.vue'

const route = useRoute()
// Honor query ?outside=true only as an initial hint; no page-level toggle
const defaultOutside = ref(String(route.query.outside).toLowerCase() === 'true')
const visitContext = computed(() => String(route.query.visitContext).toLowerCase() === 'true')
const editRecordId = computed(() => route.query.edit || null)
</script>