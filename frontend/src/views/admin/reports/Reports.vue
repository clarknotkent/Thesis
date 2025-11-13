<template>
  <AdminLayout>
    <div class="container-fluid">
      <!-- Offline Indicator Banner -->
      <div
        v-if="isOffline"
        class="alert alert-warning d-flex align-items-center mb-3"
        role="alert"
      >
        <i class="bi bi-wifi-off me-2 fs-5" />
        <div>
          <strong>Offline Mode</strong> - You're viewing cached report data. Export functionality is disabled until you reconnect.
        </div>
      </div>

      <!-- Caching Progress Banner -->
      <div
        v-if="isCaching"
        class="alert alert-info d-flex align-items-center mb-3"
        role="alert"
      >
        <div
          class="spinner-border spinner-border-sm me-2"
          role="status"
        >
          <span class="visually-hidden">Caching...</span>
        </div>
        <div>
          <strong>Caching report data...</strong> Saving immunization records for offline access.
        </div>
      </div>
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
          <li
            class="breadcrumb-item active"
            aria-current="page"
          >
            Reports
          </li>
        </ol>
      </nav>

      <!-- Page Header -->
      <AppPageHeader 
        title="Monthly Immunization Report"
        subtitle="Comprehensive monthly vaccination statistics and summary"
      >
        <template #icon>
          <i class="bi bi-file-text me-2" />
        </template>
        <template #actions>
          <div class="d-flex gap-2">
            <button
              class="btn btn-outline-secondary"
              @click="resetFilters"
            >
              <i class="bi bi-arrow-counterclockwise me-2" />Reset
            </button>
            <button
              class="btn btn-outline-primary"
              :disabled="loading"
              @click="generateReport"
            >
              <i class="bi bi-arrow-clockwise me-2" />Refresh
            </button>
            <button
              class="btn btn-primary"
              :disabled="loading || !reportData || isOffline"
              @click="exportReport"
            >
              <i class="bi bi-file-earmark-excel me-2" />Export CSV
            </button>
          </div>
        </template>
      </AppPageHeader>

      <!-- Tabs -->
      <ul class="nav nav-tabs mb-3">
        <li class="nav-item">
          <button class="nav-link active">
            <i class="bi bi-table me-2" />Monthly Report
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
      <div class="card shadow mb-4">
        <div class="card-body">
          <div class="row g-3 align-items-end">
            <div class="col-md-3">
              <label class="form-label fw-semibold">Month</label>
              <select
                v-model="filters.month"
                class="form-select"
              >
                <option
                  v-for="month in months"
                  :key="month.value"
                  :value="month.value"
                >
                  {{ month.label }}
                </option>
              </select>
            </div>
            <div class="col-md-3">
              <label class="form-label fw-semibold">Year</label>
              <select
                v-model="filters.year"
                class="form-select"
              >
                <option
                  v-for="y in years"
                  :key="y"
                  :value="y"
                >
                  {{ y }}
                </option>
              </select>
            </div>
            <div class="col-md-3">
              <button
                class="btn btn-primary w-100"
                :disabled="loading"
                @click="generateReport"
              >
                <span
                  v-if="loading"
                  class="spinner-border spinner-border-sm me-2"
                />
                <i
                  v-else
                  class="bi bi-search me-2"
                />
                Generate Report
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Monthly Report Table -->
      <div class="card shadow">
        <div class="card-header bg-primary text-white py-3">
          <h5 class="mb-0">
            <i class="bi bi-file-earmark-text me-2" />
            Monthly Immunization Report - {{ selectedMonthName }} {{ filters.year }}
          </h5>
        </div>
        <div class="card-body">
          <!-- Report Header Info -->
          <div class="row mb-4">
            <div class="col-md-6">
              <p class="mb-1">
                <strong>Report Period:</strong> {{ selectedMonthName }} {{ filters.year }}
              </p>
              <p class="mb-1">
                <strong>Generated On:</strong> {{ formatDate(new Date()) }}
              </p>
            </div>
            <div class="col-md-6 text-end">
              <div class="d-inline-block text-start">
                <p class="mb-1">
                  <strong>Total Newborns/Infants Vaccinated:</strong> {{ totals.totalVaccinated }}
                </p>
                <p class="mb-1">
                  <strong>Fully Immunized Children:</strong> {{ reportData?.fullyImmunizedCount || 0 }}
                </p>
                <p class="mb-1">
                  <strong>Completely Immunized (13-23 months):</strong> {{ reportData?.completelyImmunizedCount || 0 }}
                </p>
              </div>
            </div>
          </div>

          <!-- Placeholder Table -->
          <div class="table-responsive">
            <table class="table table-bordered table-hover">
              <thead class="table-light">
                <tr>
                  <th
                    class="text-center align-middle"
                    style="width: 35%;"
                  >
                    Vaccine / Service
                  </th>
                  <th
                    class="text-center align-middle"
                    style="width: 15%;"
                  >
                    Male
                  </th>
                  <th
                    class="text-center align-middle"
                    style="width: 15%;"
                  >
                    Female
                  </th>
                  <th
                    class="text-center align-middle bg-info bg-opacity-10"
                    style="width: 15%;"
                  >
                    Total
                  </th>
                  <th
                    class="text-center align-middle"
                    style="width: 20%;"
                  >
                    Coverage
                  </th>
                </tr>
              </thead>
              <tbody>
                <!-- Section Heading -->
                <tr class="table-secondary">
                  <td
                    class="fw-bold"
                    colspan="5"
                  >
                    Immunization and Nutrition Services · Newborns/Infants vaccinated with
                  </td>
                </tr>

                <!-- Render rows from backend response -->
                <tr
                  v-for="row in vaccinesToRender"
                  :key="row.label"
                >
                  <td class="fw-semibold">
                    {{ row.label }}
                  </td>
                  <td class="text-center">
                    {{ row.data().male }}
                  </td>
                  <td class="text-center">
                    {{ row.data().female }}
                  </td>
                  <td class="text-center bg-info bg-opacity-10 fw-semibold">
                    {{ row.data().total }}
                  </td>
                  <td class="text-center">
                    <span
                      class="badge"
                      :class="getCoverageBadge(row.data().coverage)"
                    >
                      {{ row.data().coverage }}%
                    </span>
                  </td>
                </tr>

                <!-- Totals Section -->
                <tr class="table-secondary fw-bold">
                  <td>Fully Immunized Child</td>
                  <td class="text-center">
                    {{ reportData?.fullyImmunizedMale || 0 }}
                  </td>
                  <td class="text-center">
                    {{ reportData?.fullyImmunizedFemale || 0 }}
                  </td>
                  <td class="text-center bg-info bg-opacity-10">
                    {{ reportData?.fullyImmunizedCount || 0 }}
                  </td>
                  <td class="text-center">
                    <span
                      class="badge"
                      :class="getCoverageBadge(reportData?.fullyImmunizedCoverage || 0)"
                    >
                      {{ reportData?.fullyImmunizedCoverage || 0 }}%
                    </span>
                  </td>
                </tr>
                <tr class="table-secondary fw-bold">
                  <td>Completely Immunized Child (13-23 months)</td>
                  <td class="text-center">
                    {{ reportData?.completelyImmunizedMale || 0 }}
                  </td>
                  <td class="text-center">
                    {{ reportData?.completelyImmunizedFemale || 0 }}
                  </td>
                  <td class="text-center bg-info bg-opacity-10">
                    {{ reportData?.completelyImmunizedCount || 0 }}
                  </td>
                  <td class="text-center">
                    <span
                      class="badge"
                      :class="getCoverageBadge(reportData?.completelyImmunizedCoverage || 0)"
                    >
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
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import AdminLayout from '@/components/layout/desktop/AdminLayout.vue'
import AppPageHeader from '@/components/ui/base/AppPageHeader.vue'
import api from '@/services/api'
import { useOfflineAdmin } from '@/composables/useOfflineAdmin'
import { adminDB } from '@/services/offline/adminOfflineDB'
import { useToast } from '@/composables/useToast'
import { nowPH, formatPHDate } from '@/utils/dateUtils'

const { addToast } = useToast()
const { isOffline, isCaching, generateMonthlyReport, fetchPatients } = useOfflineAdmin()

// Reactive state
const loading = ref(false)
const reportData = ref(null)

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
    
    // Try online first
    if (!isOffline.value) {
      try {
        const response = await api.get('/reports/monthly-immunization', {
          params: { month: filters.value.month, year: filters.value.year }
        })
        reportData.value = response.data.data

        // Augment FIC/CIC from patient tags restricted to selected month/year (based on last immunization date)
        await augmentFicCicFromPatientTags(filters.value.month, filters.value.year)
        addToast({ title: 'Success', message: 'Report generated from live data', type: 'success' })
        return
      } catch (onlineError) {
        console.warn('Online report generation failed, trying offline:', onlineError.message)
      }
    }

    // Fallback to offline generation
    console.log('📊 Generating report from cached data')
    const offlineResult = await generateMonthlyReport(filters.value.month, filters.value.year)
    
    if (offlineResult.success) {
      // Transform offline data to match expected format
      const report = offlineResult.data.report || []
      const transformedData = {
        vaccines: {},
        totalVaccinated: offlineResult.data.totalVaccinated || 0
      }

      // Transform vaccine data
      report.forEach(item => {
        transformedData.vaccines[item.vaccine] = {
          male: item.male || 0,
          female: item.female || 0,
          total: item.total || 0,
          coverage: 0 // Coverage calculation would need population data
        }
      })

      reportData.value = transformedData

      // Try to augment FIC/CIC if we have patient data
      try {
        await augmentFicCicFromPatientTags(filters.value.month, filters.value.year)
      } catch (ficError) {
        console.warn('FIC/CIC augmentation failed in offline mode:', ficError.message)
      }

      addToast({ title: 'Success', message: 'Report generated from cached data', type: 'success' })
    } else {
      throw new Error(offlineResult.message || 'Failed to generate offline report')
    }
  } catch (error) {
    console.error('Error generating report:', error)
    addToast({ title: 'Error', message: error.response?.data?.error || error.message || 'Failed to generate report', type: 'error' })
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

// --- FIC/CIC augmentation using patient tags ---
// We compute Fully Immunized Child (FIC) and Completely Immunized Child (CIC 13-23 months)
// by scanning patient tags, independent of backend aggregation.
const normalizeTags = (tags) => {
  if (!tags) return []
  if (Array.isArray(tags)) return tags.map(t => String(t).trim().toUpperCase())
  // If tags is a comma/semicolon separated string
  return String(tags)
    .split(/[;,]/)
    .map(t => t.trim().toUpperCase())
    .filter(Boolean)
}

const isMale = (sex) => {
  const s = String(sex || '').trim().toLowerCase()
  return s === 'm' || s === 'male'
}
const isFemale = (sex) => {
  const s = String(sex || '').trim().toLowerCase()
  return s === 'f' || s === 'female'
}

const hasFIC = (tags) => {
  const t = normalizeTags(tags)
  if (t.includes('FIC')) return true
  return t.some(x => x.includes('FULLY') && x.includes('IMMUN'))
}
const hasCIC = (tags) => {
  const t = normalizeTags(tags)
  if (t.includes('CIC')) return true
  return t.some(x => x.includes('COMPLETE') && x.includes('IMMUN'))
}

async function fetchAllPatientsForTags() {
  try {
    // Use offline-capable fetchPatients function
    const result = await fetchPatients({ limit: 10000, page: 1 })
    
    if (result.fromCache) {
      // Data is from cache, extract patients array
      console.log('📊 Fetching patients from cache for FIC/CIC calculation')
      const patients = result.data?.data?.patients || []
      console.log(`📊 Found ${patients.length} patients in cache for FIC/CIC calculation`)
      return Array.isArray(patients) ? patients : []
    } else {
      // Data is from API, extract patients array
      console.log('📊 Fetching patients from API for FIC/CIC calculation')
      const payload = result.data?.data || result.data || {}
      const patients = payload.patients || payload.items || payload || []
      console.log(`📊 Found ${patients.length} patients from API for FIC/CIC calculation`)
      return Array.isArray(patients) ? patients : []
    }
  } catch (error) {
    console.warn('Failed to fetch patients for tags (likely offline):', error.message)
    // Return empty array if both online and cache fail
    return []
  }
}

function parseAdminDate(val) {
  if (!val) return null
  try {
    const d = new Date(val)
    return isNaN(d.getTime()) ? null : d
  } catch { return null }
}

async function fetchLastImmunization(patientId) {
  try {
    // Try online first if not offline
    if (!isOffline.value) {
      const res = await api.get('/immunizations', {
        params: { patient_id: patientId, sort: 'administered_date:desc', limit: 1 }
      })
      const arr = Array.isArray(res.data) ? res.data : (res.data?.data || [])
      const last = arr && arr.length ? arr[0] : null
      if (!last) return null
      const raw = last.administered_date || last.date_administered || last.dateAdministered
      return parseAdminDate(raw)
    }
  } catch (error) {
    console.warn('Online immunization fetch failed, trying cache:', error.message)
  }

  // Fallback to cache
  try {
    const allImmunizations = await adminDB.immunizations.toArray()
    const patientImmunizations = allImmunizations
      .filter(i => i.patient_id === patientId && i.is_deleted !== true)
      .sort((a, b) => new Date(b.administered_date) - new Date(a.administered_date))

    if (patientImmunizations.length === 0) return null

    const last = patientImmunizations[0]
    const raw = last.administered_date || last.date_administered || last.dateAdministered
    return parseAdminDate(raw)
  } catch (cacheError) {
    console.error('Cache query failed for immunizations:', cacheError)
    return null
  }
}

async function augmentFicCicFromPatientTags(selMonth, selYear) {
  try {
    console.log('📊 Starting FIC/CIC tag augmentation for', selMonth, '/', selYear)
    const patients = await fetchAllPatientsForTags()
    console.log('📊 Retrieved patients for FIC/CIC:', patients.length)
    
    // Pre-filter candidates with FIC/CIC tags
    const candidates = patients.map(p => ({
      p,
      tags: p.tags || p.patient_tags || p.status_tags || null,
      sex: p.sex || p.childInfo?.sex
    })).filter(x => x.tags && (hasFIC(x.tags) || hasCIC(x.tags)))
    
    console.log('📊 Found FIC/CIC candidates:', candidates.length)
    console.log('📊 Candidates details:', candidates.map(c => ({
      id: c.p.patient_id || c.p.id,
      tags: c.tags,
      sex: c.sex,
      hasFIC: hasFIC(c.tags),
      hasCIC: hasCIC(c.tags)
    })))
    
    // Count only if last immunization falls within selected month/year
    let ficMale = 0, ficFemale = 0, cicMale = 0, cicFemale = 0
    const queue = candidates.slice()
    const workers = Array.from({ length: Math.min(8, queue.length || 0) }, async () => {
      while (queue.length) {
        const item = queue.shift()
        const patientId = item.p.patient_id || item.p.id
        console.log(`📊 Checking patient ${patientId} with tags:`, item.tags)
        
        const lastDate = await fetchLastImmunization(patientId)
        console.log(`📊 Patient ${patientId} last immunization date:`, lastDate)
        
        if (!lastDate) {
          console.log(`📊 Patient ${patientId} has no immunization date, skipping`)
          continue
        }
        
        const mm = lastDate.getMonth() + 1
        const yy = lastDate.getFullYear()
        console.log(`📊 Patient ${patientId} date check: ${mm}/${yy} vs selected ${selMonth}/${selYear}`)
        
        if (mm !== Number(selMonth) || yy !== Number(selYear)) {
          console.log(`📊 Patient ${patientId} date doesn't match, skipping`)
          continue
        }

        console.log(`📊 Patient ${patientId} matches date criteria!`)
        
        if (hasFIC(item.tags)) {
          if (isMale(item.sex)) ficMale++
          else if (isFemale(item.sex)) ficFemale++
          else ficMale++
          console.log(`📊 Patient ${patientId} counted as FIC ${isMale(item.sex) ? 'Male' : isFemale(item.sex) ? 'Female' : 'Unknown'}`)
        }
        if (hasCIC(item.tags)) {
          if (isMale(item.sex)) cicMale++
          else if (isFemale(item.sex)) cicFemale++
          else cicMale++
          console.log(`📊 Patient ${patientId} counted as CIC ${isMale(item.sex) ? 'Male' : isFemale(item.sex) ? 'Female' : 'Unknown'}`)
        }
      }
    })
    await Promise.all(workers)

    const ficTotal = ficMale + ficFemale
    const cicTotal = cicMale + cicFemale

    console.log('📊 FIC/CIC results:', { ficMale, ficFemale, ficTotal, cicMale, cicFemale, cicTotal })

    // Merge into reportData, keeping backend fields when present
    const base = reportData.value || {}
    const eligible = Number(base.eligiblePopulation || 0) || 0
    reportData.value = {
      ...base,
      fullyImmunizedMale: ficMale,
      fullyImmunizedFemale: ficFemale,
      fullyImmunizedCount: ficTotal,
      fullyImmunizedCoverage: eligible > 0 ? Math.round((ficTotal / eligible) * 100) : (base.fullyImmunizedCoverage || 0),
      completelyImmunizedMale: cicMale,
      completelyImmunizedFemale: cicFemale,
      completelyImmunizedCount: cicTotal,
      completelyImmunizedCoverage: eligible > 0 ? Math.round((cicTotal / eligible) * 100) : (base.completelyImmunizedCoverage || 0)
    }
    
    console.log('📊 FIC/CIC augmentation completed successfully')
  } catch (e) {
    // Non-blocking: if patient fetch fails, leave as-is
    console.warn('FIC/CIC tag augmentation skipped:', e?.response?.data || e.message)
  }
}

// Initialize on mount
onMounted(() => {
})
</script>

<style scoped>
/* Breadcrumb Styling */
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
