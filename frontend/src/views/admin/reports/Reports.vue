<template>
  <AdminLayout>
    <div class="container-fluid">
      <!-- Page Header -->
      <AppPageHeader 
        title="Monthly Immunization Report" 
        subtitle="Comprehensive monthly vaccination statistics and summary"
      >
        <template #actions>
          <button class="btn btn-outline-secondary" disabled>
            <i class="bi bi-arrow-counterclockwise me-2"></i>Reset
          </button>
          <button class="btn btn-outline-primary" disabled>
            <i class="bi bi-arrow-clockwise me-2"></i>Refresh
          </button>
          <button class="btn btn-primary" disabled>
            <i class="bi bi-file-earmark-excel me-2"></i>Export Excel
          </button>
        </template>
      </AppPageHeader>

      <!-- Info Alert -->
      <div class="alert alert-info d-flex align-items-center mb-4" role="alert">
        <i class="bi bi-info-circle-fill me-3 fs-4"></i>
        <div>
          <strong>Backend Integration Pending</strong>
          <p class="mb-0 mt-1">This report table is currently a placeholder. Backend logic errors are being addressed by the development team.</p>
        </div>
      </div>

      <!-- Filters Card -->
      <div class="card shadow mb-4">
        <div class="card-body">
          <div class="row g-3 align-items-end">
            <div class="col-md-3">
              <label class="form-label fw-semibold">Month</label>
              <select class="form-select" v-model="filters.month" disabled>
                <option v-for="month in months" :key="month.value" :value="month.value">
                  {{ month.label }}
                </option>
              </select>
            </div>
            <div class="col-md-3">
              <label class="form-label fw-semibold">Year</label>
              <input 
                type="text" 
                class="form-control" 
                v-model="filters.year"
                placeholder="YYYY"
                disabled
              >
            </div>
            <div class="col-md-3">
              <button class="btn btn-primary w-100" disabled>
                <i class="bi bi-search me-2"></i>
                Generate Report
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Placeholder Report Table -->
      <div class="card shadow">
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
                <p class="mb-1"><strong>Total Newborns/Infants Vaccinated:</strong> {{ summaryData.totalVaccinated }}</p>
                <p class="mb-1"><strong>Fully Immunized Children:</strong> {{ summaryData.fullyImmunized.total }}</p>
                <p class="mb-1"><strong>Completely Immunized (13-23 months):</strong> {{ summaryData.completelyImmunized.total }}</p>
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
                <!-- Sample Placeholder Rows -->
                <tr v-for="vaccine in placeholderVaccines" :key="vaccine.name">
                  <td class="fw-semibold">{{ vaccine.name }}</td>
                  <td class="text-center">{{ vaccine.male }}</td>
                  <td class="text-center">{{ vaccine.female }}</td>
                  <td class="text-center bg-info bg-opacity-10 fw-semibold">{{ vaccine.total }}</td>
                  <td class="text-center">
                    <span class="badge" :class="getCoverageBadge(vaccine.coverage)">
                      {{ vaccine.coverage }}%
                    </span>
                  </td>
                </tr>

                <!-- Totals Section -->
                <tr class="table-secondary fw-bold">
                  <td>Fully Immunized Child</td>
                  <td class="text-center">{{ summaryData.fullyImmunized.male }}</td>
                  <td class="text-center">{{ summaryData.fullyImmunized.female }}</td>
                  <td class="text-center bg-info bg-opacity-10">{{ summaryData.fullyImmunized.total }}</td>
                  <td class="text-center">
                    <span class="badge" :class="getCoverageBadge(summaryData.fullyImmunizedCoverage)">
                      {{ summaryData.fullyImmunizedCoverage }}%
                    </span>
                  </td>
                </tr>
                <tr class="table-secondary fw-bold">
                  <td>Completely Immunized Child (13-23 months)</td>
                  <td class="text-center">{{ summaryData.completelyImmunized.male }}</td>
                  <td class="text-center">{{ summaryData.completelyImmunized.female }}</td>
                  <td class="text-center bg-info bg-opacity-10">{{ summaryData.completelyImmunized.total }}</td>
                  <td class="text-center">
                    <span class="badge" :class="getCoverageBadge(summaryData.completelyImmunizedCoverage)">
                      {{ summaryData.completelyImmunizedCoverage }}%
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Footer Note -->
          <div class="alert alert-warning mt-3 mb-0" role="alert">
            <i class="bi bi-exclamation-triangle-fill me-2"></i>
            <strong>Note:</strong> This is sample placeholder data for demonstration purposes. Once backend issues are resolved, real data will be displayed here.
          </div>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, computed } from 'vue'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import AppPageHeader from '@/components/ui/base/AppPageHeader.vue'
import { formatPHDate } from '@/utils/dateUtils'

const filters = ref({
  month: new Date().getMonth() + 1,
  year: new Date().getFullYear().toString()
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

// Sample placeholder data with realistic numbers
const placeholderVaccines = [
  { name: 'BCG', male: 45, female: 42, total: 87, coverage: 92 },
  { name: 'Hepatitis B 1 (HepB1)', male: 43, female: 40, total: 83, coverage: 88 },
  { name: 'Newborn Screening Test', male: 41, female: 39, total: 80, coverage: 85 },
  { name: 'Newborn Hearing Screening Test', male: 38, female: 37, total: 75, coverage: 79 },
  { name: 'Child Protected at Birth', male: 40, female: 38, total: 78, coverage: 83 },
  { name: 'DPT-HiB-HepB 1', male: 42, female: 41, total: 83, coverage: 88 },
  { name: 'DPT-HiB-HepB 2', male: 40, female: 39, total: 79, coverage: 84 },
  { name: 'DPT-HiB-HepB 3', male: 38, female: 37, total: 75, coverage: 79 },
  { name: 'Oral Polio Vaccine 1 (OPV1)', male: 41, female: 40, total: 81, coverage: 86 },
  { name: 'Oral Polio Vaccine 2 (OPV2)', male: 39, female: 38, total: 77, coverage: 81 },
  { name: 'Oral Polio Vaccine 3 (OPV3)', male: 37, female: 36, total: 73, coverage: 77 },
  { name: 'Inactivated Polio Vaccine 1 (IPV1)', male: 38, female: 37, total: 75, coverage: 79 },
  { name: 'Inactivated Polio Vaccine 2 (IPV2)', male: 36, female: 35, total: 71, coverage: 75 },
  { name: 'Pneumococcal Conjugate Vaccine 1 (PCV1)', male: 40, female: 39, total: 79, coverage: 84 },
  { name: 'Pneumococcal Conjugate Vaccine 2 (PCV2)', male: 38, female: 37, total: 75, coverage: 79 },
  { name: 'Pneumococcal Conjugate Vaccine 3 (PCV3)', male: 36, female: 35, total: 71, coverage: 75 },
  { name: 'Measles, Mumps, Rubella 1 (MMR1)', male: 35, female: 34, total: 69, coverage: 73 },
  { name: 'Measles, Mumps, Rubella 2 (MMR2)', male: 33, female: 32, total: 65, coverage: 69 }
]

const summaryData = {
  totalVaccinated: 87,
  fullyImmunized: { male: 34, female: 31, total: 65 },
  completelyImmunized: { male: 30, female: 28, total: 58 },
  fullyImmunizedCoverage: 75,
  completelyImmunizedCoverage: 67
}

const selectedMonthName = computed(() => {
  const month = months.find(m => m.value === filters.value.month)
  return month ? month.label : ''
})

// Helper to get badge color based on coverage
const getCoverageBadge = (coverage) => {
  if (coverage >= 90) return 'bg-success'
  if (coverage >= 75) return 'bg-primary'
  if (coverage >= 60) return 'bg-warning'
  return 'bg-danger'
}

const formatDate = (date) => {
  return formatPHDate(date)
}
</script>

<style scoped>
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
