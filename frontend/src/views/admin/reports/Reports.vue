<template>
  <AdminLayout>
    <div class="container-fluid">
      <!-- Page Header -->
      <AppPageHeader 
        :title="activeTab === 'monthly' ? 'Monthly Immunization Report' : 'Immunization Monitoring Chart'" 
        :subtitle="activeTab === 'monthly' ? 'Comprehensive monthly vaccination statistics and summary' : 'Cumulative performance vs target across the year'"
      >
        <template #actions>
          <div class="d-flex gap-2" v-if="activeTab === 'monthly'">
            <button class="btn btn-outline-secondary" @click="resetFilters">
              <i class="bi bi-arrow-counterclockwise me-2"></i>Reset
            </button>
            <button class="btn btn-outline-primary" @click="generateReport" :disabled="loading">
              <i class="bi bi-arrow-clockwise me-2"></i>Refresh
            </button>
            <button class="btn btn-primary" @click="exportReport" :disabled="loading || !reportData">
              <i class="bi bi-file-earmark-excel me-2"></i>Export CSV
            </button>
          </div>
        </template>
      </AppPageHeader>

      <!-- Tabs -->
      <ul class="nav nav-tabs mb-3">
        <li class="nav-item">
          <button class="nav-link" :class="{ active: activeTab === 'monthly' }" @click="activeTab = 'monthly'">
            <i class="bi bi-table me-2"></i>Monthly Report
          </button>
        </li>
        <li class="nav-item">
          <button class="nav-link" :class="{ active: activeTab === 'monitoring' }" @click="activeTab = 'monitoring'">
            <i class="bi bi-graph-up-arrow me-2"></i>Monitoring Chart
          </button>
        </li>
      </ul>

      <!-- Info Alert 
      <div class="alert alert-info d-flex align-items-center mb-4" role="alert">
        <i class="bi bi-info-circle-fill me-3 fs-4"></i>
        <div>
          <strong>Backend Integration Pending</strong>
          <p class="mb-0 mt-1">This report table is currently a placeholder. Backend logic errors are being addressed by the development team.</p>
        </div>
      </div>-->

      <!-- Filters Card (Monthly tab) -->
      <div v-if="activeTab === 'monthly'" class="card shadow mb-4">
        <div class="card-body">
          <div class="row g-3 align-items-end">
            <div class="col-md-3">
              <label class="form-label fw-semibold">Month</label>
              <select class="form-select" v-model="filters.month">
                <option v-for="month in months" :key="month.value" :value="month.value">
                  {{ month.label }}
                </option>
              </select>
            </div>
            <div class="col-md-3">
              <label class="form-label fw-semibold">Year</label>
              <select class="form-select" v-model="filters.year">
                <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
              </select>
            </div>
            <div class="col-md-3">
              <button class="btn btn-primary w-100" @click="generateReport" :disabled="loading">
                <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                <i v-else class="bi bi-search me-2"></i>
                Generate Report
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Monthly Report Table -->
      <div v-if="activeTab === 'monthly'" class="card shadow">
        <div class="card-header bg-primary text-white py-3">
          <h5 class="mb-0">
            <i class="bi bi-file-earmark-text me-2"></i>
            Monthly Immunization Report - {{ selectedMonthName }} {{ filters.year }}
          </h5>
        </div>
        <div class="card-body">
          <!-- Report Header Info -->
          <div class="row mb-4">
            <div class="col-md-6">
              <p class="mb-1"><strong>Report Period:</strong> {{ selectedMonthName }} {{ filters.year }}</p>
              <p class="mb-1"><strong>Generated On:</strong> {{ formatDate(new Date()) }}</p>
            </div>
            <div class="col-md-6 text-end">
              <div class="d-inline-block text-start">
                <p class="mb-1"><strong>Total Newborns/Infants Vaccinated:</strong> {{ totals.totalVaccinated }}</p>
                <p class="mb-1"><strong>Fully Immunized Children:</strong> {{ reportData?.fullyImmunizedCount || 0 }}</p>
                <p class="mb-1"><strong>Completely Immunized (13-23 months):</strong> {{ reportData?.completelyImmunizedCount || 0 }}</p>
              </div>
            </div>
          </div>

          <!-- Placeholder Table -->
          <div class="table-responsive">
            <table class="table table-bordered table-hover">
              <thead class="table-light">
                <tr>
                  <th class="text-center align-middle" style="width: 35%;">Vaccine / Service</th>
                  <th class="text-center align-middle" style="width: 15%;">Male</th>
                  <th class="text-center align-middle" style="width: 15%;">Female</th>
                  <th class="text-center align-middle bg-info bg-opacity-10" style="width: 15%;">Total</th>
                  <th class="text-center align-middle" style="width: 20%;">Coverage</th>
                </tr>
              </thead>
              <tbody>
                <!-- Section Heading -->
                <tr class="table-secondary">
                  <td class="fw-bold" colspan="5">Part I A - Immunization and Nutrition Services · Newborns/Infants vaccinated with</td>
                </tr>

                <!-- Render rows from backend response -->
                <tr v-for="row in vaccinesToRender" :key="row.label">
                  <td class="fw-semibold">{{ row.label }}</td>
                  <td class="text-center">{{ row.data().male }}</td>
                  <td class="text-center">{{ row.data().female }}</td>
                  <td class="text-center bg-info bg-opacity-10 fw-semibold">{{ row.data().total }}</td>
                  <td class="text-center">
                    <span class="badge" :class="getCoverageBadge(row.data().coverage)">
                      {{ row.data().coverage }}%
                    </span>
                  </td>
                </tr>

                <!-- Totals Section -->
                <tr class="table-secondary fw-bold">
                  <td>Fully Immunized Child</td>
                  <td class="text-center">{{ reportData?.fullyImmunizedMale || 0 }}</td>
                  <td class="text-center">{{ reportData?.fullyImmunizedFemale || 0 }}</td>
                  <td class="text-center bg-info bg-opacity-10">{{ reportData?.fullyImmunizedCount || 0 }}</td>
                  <td class="text-center">
                    <span class="badge" :class="getCoverageBadge(reportData?.fullyImmunizedCoverage || 0)">
                      {{ reportData?.fullyImmunizedCoverage || 0 }}%
                    </span>
                  </td>
                </tr>
                <tr class="table-secondary fw-bold">
                  <td>Completely Immunized Child (13-23 months)</td>
                  <td class="text-center">{{ reportData?.completelyImmunizedMale || 0 }}</td>
                  <td class="text-center">{{ reportData?.completelyImmunizedFemale || 0 }}</td>
                  <td class="text-center bg-info bg-opacity-10">{{ reportData?.completelyImmunizedCount || 0 }}</td>
                  <td class="text-center">
                    <span class="badge" :class="getCoverageBadge(reportData?.completelyImmunizedCoverage || 0)">
                      {{ reportData?.completelyImmunizedCoverage || 0 }}%
                    </span>
                  </td>
                </tr>

                <!-- School-Based Immunization (placeholders) -->
              </tbody>
            </table>
          </div>

          <!-- Footer Note 
          <div class="alert alert-warning mt-3 mb-0" role="alert">
            <i class="bi bi-exclamation-triangle-fill me-2"></i>
            <strong>Note:</strong> This is sample placeholder data for demonstration purposes. Once backend issues are resolved, real data will be displayed here.
          </div>-->
        </div>
      </div>

      <!-- Monitoring Chart Tab -->
      <div v-else>
        <ImmunizationMonitoringChart />
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import AdminLayout from '@/components/layout/desktop/AdminLayout.vue'
import AppPageHeader from '@/components/ui/base/AppPageHeader.vue'
import api from '@/services/api'
import { useToast } from '@/composables/useToast'
import { nowPH, formatPHDate } from '@/utils/dateUtils'
import ImmunizationMonitoringChart from './ImmunizationMonitoringChart.vue'

const { addToast } = useToast()

// Reactive state
const loading = ref(false)
const reportData = ref(null)
const activeTab = ref('monthly')

// Filters
const filters = ref({
  month: nowPH().month() + 1,
  year: nowPH().year()
})

const months = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' }
]

const years = computed(() => {
  const currentYear = nowPH().year()
  return Array.from({ length: 6 }, (_, i) => currentYear - i)
})

const selectedMonthName = computed(() => {
  const month = months.find(m => m.value === filters.value.month)
  return month ? month.label : ''
})

const generateReport = async () => {
  try {
    loading.value = true
    const response = await api.get('/reports/monthly-immunization', {
      params: { month: filters.value.month, year: filters.value.year }
    })
    reportData.value = response.data.data
    addToast({ title: 'Success', message: 'Report generated', type: 'success' })
  } catch (error) {
    console.error('Error generating report:', error)
    addToast({ title: 'Error', message: error.response?.data?.error || 'Failed to generate report', type: 'error' })
    reportData.value = null
  } finally {
    loading.value = false
  }
}

const resetFilters = () => {
  filters.value.month = nowPH().month() + 1
  filters.value.year = nowPH().year()
  reportData.value = null
}

const exportReport = () => {
  if (!reportData.value) return

  const rows = []
  rows.push(["Vaccine / Service", "Male", "Female", "Total", "Coverage (%)"].join(','))
  vaccinesToRender.value.forEach(r => {
    const d = r.data() || { male: 0, female: 0, total: 0, coverage: 0 }
    rows.push([`"${r.label}"`, d.male || 0, d.female || 0, d.total || 0, d.coverage || 0].join(','))
  })

  // Totals
  rows.push([])
  rows.push(["Fully Immunized Child", reportData.value.fullyImmunizedMale || 0, reportData.value.fullyImmunizedFemale || 0, reportData.value.fullyImmunizedCount || 0, reportData.value.fullyImmunizedCoverage || 0].join(','))
  rows.push(["Completely Immunized Child (13-23 months)", reportData.value.completelyImmunizedMale || 0, reportData.value.completelyImmunizedFemale || 0, reportData.value.completelyImmunizedCount || 0, reportData.value.completelyImmunizedCoverage || 0].join(','))

  const csv = rows.join('\r\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `monthly-immunization-${filters.value.month}-${filters.value.year}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const getVaccineData = (vaccineName, dose = null) => {
  if (!reportData.value || !reportData.value.vaccines) return { male: 0, female: 0, total: 0, coverage: 0 }
  const vaccineData = reportData.value.vaccines[vaccineName]
  if (!vaccineData) return { male: 0, female: 0, total: 0, coverage: 0 }
  if (dose !== null && Array.isArray(vaccineData)) {
    const doseData = vaccineData.find(d => d.dose === dose)
    return doseData || { male: 0, female: 0, total: 0, coverage: 0 }
  }
  if (!Array.isArray(vaccineData)) return vaccineData
  return { male: 0, female: 0, total: 0, coverage: 0 }
}

const getCustomData = (key) => {
  const base = reportData.value || {}
  const data = base[key] || base?.vaccines?.[key]
  return data || { male: 0, female: 0, total: 0, coverage: 0 }
}

const getCoverageBadge = (coverage) => {
  if (coverage >= 95) return 'bg-success'
  if (coverage >= 80) return 'bg-primary'
  if (coverage >= 60) return 'bg-warning text-dark'
  return 'bg-danger'
}

const formatDate = (date) => formatPHDate(date)

// Build ordered list of vaccine rows to render
const vaccinesToRender = computed(() => {
  if (!reportData.value) return []
  return [
    { label: 'BCG', data: () => getVaccineData('BCG') },
    { label: 'Hepatitis B 1 (HepB1)', data: () => getVaccineData('HepB', 1) },
    { label: 'Newborn Screening Test', data: () => reportData.value.newbornScreening || getCustomData('newbornScreening') },
    { label: 'Newborn Hearing Screening Test', data: () => reportData.value.hearingScreening || getCustomData('hearingScreening') },
    { label: 'Child Protected at Birth', data: () => reportData.value.protectedAtBirth || getCustomData('protectedAtBirth') },
    { label: 'DPT-HiB-HepB 1', data: () => getVaccineData('Pentavalent', 1) },
    { label: 'DPT-HiB-HepB 2', data: () => getVaccineData('Pentavalent', 2) },
    { label: 'DPT-HiB-HepB 3', data: () => getVaccineData('Pentavalent', 3) },
    { label: 'OPV 1', data: () => getVaccineData('OPV', 1) },
    { label: 'OPV 2', data: () => getVaccineData('OPV', 2) },
    { label: 'OPV 3', data: () => getVaccineData('OPV', 3) },
    { label: 'IPV 1', data: () => getVaccineData('IPV', 1) },
    { label: 'IPV 2', data: () => getVaccineData('IPV', 2) },
    { label: 'IPV 3', data: () => getVaccineData('IPV', 3) },
    { label: 'PCV 1', data: () => getVaccineData('PCV', 1) },
    { label: 'PCV 2', data: () => getVaccineData('PCV', 2) },
    { label: 'PCV 3', data: () => getVaccineData('PCV', 3) },
    { label: 'MCV 1', data: () => getVaccineData('MMR', 1) },
    { label: 'MCV 2', data: () => getVaccineData('MMR', 2) }
  ]
})

onMounted(() => generateReport())

const totals = computed(() => {
  if (!reportData.value || !reportData.value.vaccines) return { totalVaccinated: 0, maleCount: 0, femaleCount: 0 }

  let totalVaccinated = 0
  let maleCount = 0
  let femaleCount = 0

  Object.values(reportData.value.vaccines).forEach(vaccine => {
    if (Array.isArray(vaccine)) {
      vaccine.forEach(dose => {
        totalVaccinated += dose.total || 0
        maleCount += dose.male || 0
        femaleCount += dose.female || 0
      })
    } else {
      totalVaccinated += vaccine.total || 0
      maleCount += vaccine.male || 0
      femaleCount += vaccine.female || 0
    }
  })

  return { totalVaccinated, maleCount, femaleCount }
})
</script>

<style scoped>
.nav-tabs .nav-link {
  cursor: pointer;
}
.table th {
  font-weight: 600;
  font-size: 0.9rem;
}

.table td {
  vertical-align: middle;
}

.table-hover tbody tr:hover {
  background-color: rgba(0, 0, 0, 0.02);
}

.badge {
  font-size: 0.85rem;
  padding: 0.35rem 0.65rem;
}

.card {
  border-radius: 0.5rem;
}

.card-header {
  border-top-left-radius: 0.5rem;
  border-top-right-radius: 0.5rem;
}

.alert {
  border-radius: 0.5rem;
}
</style>
