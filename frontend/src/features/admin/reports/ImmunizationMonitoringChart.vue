<template>
  <div class="card shadow">
    <div class="card-header bg-primary text-white py-3">
      <h5 class="mb-0">
        <i class="bi bi-graph-up-arrow me-2"></i>
        Immunization Monitoring Chart - {{ year }} (Full Year)
      </h5>
    </div>
    <div class="card-body">
      <!-- Filters -->
      <div class="row g-3 align-items-end mb-3">
        <div class="col-md-2">
          <label class="form-label fw-semibold">Year</label>
          <select class="form-select" v-model.number="year">
            <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
          </select>
        </div>
        <div class="col-md-3">
          <label class="form-label fw-semibold">As of Month</label>
          <select class="form-select" v-model.number="asOfMonth">
            <option v-for="m in months" :key="m.value" :value="m.value">{{ m.label }}</option>
          </select>
        </div>
        <div class="col-md-2">
          <label class="form-label fw-semibold">Eligible Target</label>
          <input type="number" class="form-control" v-model.number="eligiblePopulation" />
        </div>
        <div class="col-md-2">
          <label class="form-label fw-semibold">Total Population</label>
          <input type="number" class="form-control" v-model.number="totalPopulation" />
        </div>
        <div class="col-md-3 text-md-end">
          <button class="btn btn-primary w-100 w-md-auto" @click="loadData" :disabled="loading">
            <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
            <i v-else class="bi bi-arrow-clockwise me-2"></i>
            Refresh Data
          </button>
        </div>
      </div>

      <div class="row g-4">
        <!-- Meta Panel -->
        <div class="col-lg-3">
          <div class="meta-card p-3 border rounded h-100">
            <div class="d-flex align-items-center mb-2">
              <div class="rounded-circle bg-success-subtle text-success p-2 me-2"><i class="bi bi-clipboard-data"></i></div>
              <h6 class="mb-0">Area Details</h6>
            </div>
            <div class="small text-muted">You can tailor these labels in Settings later.</div>
            <hr />
            <div class="mb-2"><strong>Year:</strong> {{ year }}</div>
            <div class="mb-2"><strong>Province:</strong> {{ province }}</div>
            <div class="mb-2"><strong>City/Municipality:</strong> {{ city }}</div>
            <div class="mb-2"><strong>RHU/BHS:</strong> {{ facility }}</div>
            <div class="mb-2"><strong>Total Population:</strong> {{ number(totalPopulation) }}</div>
            <div class="mb-2"><strong>Eligible Population:</strong> {{ number(eligiblePopulation) }}</div>
            <hr />
            <div class="mb-1"><span class="legend-box bg-target me-2"></span>Target (100%)</div>
            <div class="mb-1"><span class="legend-dot bg-penta1 me-2"></span>Penta 1</div>
            <div class="mb-1"><span class="legend-dot bg-penta3 me-2"></span>Penta 3</div>
            <div class="mb-1"><span class="legend-dot bg-mcv1 me-2"></span>MCV 1</div>
            <div class="mb-1"><span class="legend-dot bg-mcv2 me-2"></span>MCV 2</div>
          </div>
        </div>

        <!-- Chart -->
        <div class="col-lg-9">
          <div class="chart-wrap border rounded p-3">
            <div class="chart-inner">
              <!-- SVG Grid and Lines -->
              <svg :viewBox="`0 0 ${width} ${height}`" preserveAspectRatio="none" class="w-100" style="height:420px;">
                <!-- Grid -->
                <g>
                  <line v-for="i in 10" :key="'h-'+i" :x1="margin.left" :x2="width - margin.right" :y1="yPercent(i*10)" :y2="yPercent(i*10)" stroke="#e9ecef" stroke-width="1" />
                  <line v-for="(m, idx) in 12" :key="'v-'+idx" :x1="x(idx+1)" :x2="x(idx+1)" :y1="margin.top" :y2="height - margin.bottom" stroke="#f1f3f5" stroke-width="1" />
                </g>
                
                <!-- Target line -->
                <polyline :points="points(targetCumulative)" class="line-target" />

                <!-- Series lines -->
                <polyline :points="points(series.penta1)" class="line-penta1" />
                <polyline :points="points(series.penta3)" class="line-penta3" />
                <polyline :points="points(series.mcv1)" class="line-mcv1" />
                <polyline :points="points(series.mcv2)" class="line-mcv2" />

                <!-- Markers -->
                <g v-for="(val, i) in series.penta1" :key="'mk1-'+i">
                  <circle :cx="x(i+1)" :cy="yValue(val)" r="3" class="dot-penta1" />
                </g>
                <g v-for="(val, i) in series.penta3" :key="'mk3-'+i">
                  <circle :cx="x(i+1)" :cy="yValue(val)" r="3" class="dot-penta3" />
                </g>
                <g v-for="(val, i) in series.mcv1" :key="'mk4-'+i">
                  <circle :cx="x(i+1)" :cy="yValue(val)" r="3" class="dot-mcv1" />
                </g>
                <g v-for="(val, i) in series.mcv2" :key="'mk5-'+i">
                  <circle :cx="x(i+1)" :cy="yValue(val)" r="3" class="dot-mcv2" />
                </g>

                <!-- Axes labels -->
                <g>
                  <text v-for="(m, i) in months" :key="'lbl-'+i" :x="x(i+1)" :y="height - 6" text-anchor="middle" class="axis-label">{{ m.label.slice(0,3) }}</text>
                  <text v-for="i in 10" :key="'pct-'+i" :x="margin.left - 6" :y="yPercent(i*10) + 3" text-anchor="end" class="axis-label">{{ i*10 }}%</text>
                </g>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Monthly accomplishment table -->
      <div class="table-responsive mt-4">
        <table class="table table-sm table-bordered align-middle">
          <thead class="table-light">
            <tr>
              <th>Month</th>
              <th class="text-center">Penta 1</th>
              <th class="text-center">Cumulative</th>
              <th class="text-center">Penta 3</th>
              <th class="text-center">Cumulative</th>
              <th class="text-center">MCV 1</th>
              <th class="text-center">Cumulative</th>
              <th class="text-center">MCV 2</th>
              <th class="text-center">Cumulative</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(m, idx) in 12" :key="'row-'+idx">
              <td class="fw-semibold">{{ months[idx].label }}</td>
              <td class="text-center">{{ monthly.penta1[idx] || 0 }}</td>
              <td class="text-center text-primary fw-semibold">{{ series.penta1[idx] || 0 }}</td>
              <td class="text-center">{{ monthly.penta3[idx] || 0 }}</td>
              <td class="text-center text-primary fw-semibold">{{ series.penta3[idx] || 0 }}</td>
              <td class="text-center">{{ monthly.mcv1[idx] || 0 }}</td>
              <td class="text-center text-primary fw-semibold">{{ series.mcv1[idx] || 0 }}</td>
              <td class="text-center">{{ monthly.mcv2[idx] || 0 }}</td>
              <td class="text-center text-primary fw-semibold">{{ series.mcv2[idx] || 0 }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Debug: Antigen names encountered -->
      <div class="mt-3">
        <button class="btn btn-sm btn-outline-secondary" @click="showDebug = !showDebug">
          <i class="bi" :class="showDebug ? 'bi-bug-fill' : 'bi-bug'"></i>
          {{ showDebug ? 'Hide' : 'Show' }} raw antigen names (debug)
        </button>
        <div v-if="showDebug" class="alert alert-secondary mt-2 small">
          <div class="fw-semibold mb-1">Antigen names seen this year (as-is):</div>
          <div v-if="debugAntigenNamesArr.length === 0" class="text-muted">— none yet —</div>
          <ul v-else class="mb-2">
            <li v-for="n in debugAntigenNamesArr" :key="n">{{ n }}</li>
          </ul>
          <div class="fw-semibold mb-1">Upper-cased variants (for matching):</div>
          <div v-if="debugAntigenUpperArr.length === 0" class="text-muted">— none yet —</div>
          <ul v-else>
            <li v-for="n in debugAntigenUpperArr" :key="'u-'+n">{{ n }}</li>
          </ul>
          <hr />
          <div class="fw-semibold mb-2">Quantities detected (aggregated up to As of Month):</div>
          <div v-if="debugCountList.length === 0" class="text-muted">— none yet —</div>
          <div v-else class="table-responsive">
            <table class="table table-sm table-bordered">
              <thead class="table-light">
                <tr>
                  <th>Antigen (upper)</th>
                  <th class="text-end">Quantity</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in debugCountList" :key="row.name">
                  <td>{{ row.name }}</td>
                  <td class="text-end">{{ row.count }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-if="debugDoseRows.length" class="table-responsive mt-2">
            <div class="fw-semibold mb-2">Per-dose breakdown:</div>
            <table class="table table-sm table-bordered">
              <thead class="table-light">
                <tr>
                  <th>Antigen (upper)</th>
                  <th class="text-end">Dose</th>
                  <th class="text-end">Count</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="r in debugDoseRows" :key="r.name + '-' + r.dose">
                  <td>{{ r.name }}</td>
                  <td class="text-end">{{ r.dose }}</td>
                  <td class="text-end">{{ r.count }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/services/offlineAPI'
import { nowPH } from '@/utils/dateUtils'

// Filters and constants
const years = computed(() => {
  const currentYear = nowPH().year()
  const minYear = 2000
  const arr = []
  for (let y = currentYear; y >= minYear; y--) arr.push(y)
  return arr
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

const year = ref(nowPH().year())
// As-of month selector (default full year)
const asOfMonth = ref(12)
const eligiblePopulation = ref(1115) // default from sample poster
const totalPopulation = ref(52014)
const province = ref('Davao del Sur')
const city = ref('Bunawan / Davao City')
const facility = ref('Tibungco')

const loading = ref(false)

// Monthly and cumulative series
const monthly = ref({ penta1: Array(12).fill(0), penta3: Array(12).fill(0), mcv1: Array(12).fill(0), mcv2: Array(12).fill(0) })
const series = ref({ penta1: Array(12).fill(0), penta3: Array(12).fill(0), mcv1: Array(12).fill(0), mcv2: Array(12).fill(0) })
// Debug: unique antigen names seen across all months loaded
const debugAntigenNames = ref(new Set())
const debugAntigenUpper = ref(new Set())
// Aggregated counts across fetched months
const debugCounts = ref({}) // { UPPER_NAME: totalCount }
const debugDoseCounts = ref({}) // { UPPER_NAME: { dose: count } }
const showDebug = ref(false)
const debugAntigenNamesArr = computed(() => Array.from(debugAntigenNames.value).sort())
const debugAntigenUpperArr = computed(() => Array.from(debugAntigenUpper.value).sort())
const debugCountList = computed(() => {
  return Object.entries(debugCounts.value)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => a.name.localeCompare(b.name))
})
const debugDoseRows = computed(() => {
  const rows = []
  Object.entries(debugDoseCounts.value).forEach(([name, doses]) => {
    Object.entries(doses).forEach(([dose, count]) => {
      rows.push({ name, dose: Number(dose), count })
    })
  })
  return rows.sort((a, b) => a.name.localeCompare(b.name) || a.dose - b.dose)
})

// SVG chart geometry
const width = 1000
const height = 360
const margin = { top: 16, right: 20, bottom: 34, left: 40 }

function x(monthIndex) {
  const plotWidth = width - margin.left - margin.right
  const step = plotWidth / 11 // 12 points -> 11 gaps
  return margin.left + step * (monthIndex - 1)
}
function yValue(val) {
  const maxVal = Math.max(eligiblePopulation.value, 1)
  const pct = val / maxVal
  const plotHeight = height - margin.top - margin.bottom
  return margin.top + (1 - pct) * plotHeight
}
function yPercent(p) {
  const plotHeight = height - margin.top - margin.bottom
  return margin.top + (1 - p / 100) * plotHeight
}
function points(arr) {
  return arr.map((v, i) => `${x(i + 1)},${yValue(v)}`).join(' ')
}

const targetCumulative = computed(() => {
  const perMonth = eligiblePopulation.value / 12
  const cum = []
  let acc = 0
  for (let i = 0; i < 12; i++) { acc += perMonth; cum.push(Math.round(acc)) }
  return cum
})

function number(n) { return new Intl.NumberFormat().format(n || 0) }

async function loadData() {
  loading.value = true
  try {
  const monthsToFetch = Array.from({ length: asOfMonth.value }, (_, i) => i + 1)
    // Reset debug aggregations before loading
    debugAntigenNames.value = new Set()
    debugAntigenUpper.value = new Set()
    debugCounts.value = {}
    debugDoseCounts.value = {}
    const results = await Promise.all(
      monthsToFetch.map(m =>
        api
          .get('/reports/monthly-immunization', { params: { month: m, year: year.value } })
          .then(r => r.data?.data)
          .catch(() => null)
      )
    )

    const p1 = Array(12).fill(0), p3 = Array(12).fill(0), m1 = Array(12).fill(0), m2 = Array(12).fill(0)
    results.forEach((r, idx) => {
      if (!r) return
      const i = idx // month index 0-based for Jan..asOf
      // Collect debug antigen names if backend provided
      if (r.debug?.encounteredAntigenNames?.length) {
        r.debug.encounteredAntigenNames.forEach(n => debugAntigenNames.value.add(n))
      }
      if (r.debug?.encounteredAntigenNamesUpper?.length) {
        r.debug.encounteredAntigenNamesUpper.forEach(n => debugAntigenUpper.value.add(n))
      }
      if (r.debug) {
        // Also log for quick inspection in DevTools
        // eslint-disable-next-line no-console
        console.log(`Month ${i + 1} debug`, r.debug)
        // Aggregate counts
        if (r.debug.countByAntigenUpper) {
          Object.entries(r.debug.countByAntigenUpper).forEach(([k, v]) => {
            debugCounts.value[k] = (debugCounts.value[k] || 0) + (v || 0)
          })
        }
        if (r.debug.countByAntigenAndDoseUpper) {
          Object.entries(r.debug.countByAntigenAndDoseUpper).forEach(([k, doses]) => {
            if (!debugDoseCounts.value[k]) debugDoseCounts.value[k] = {}
            Object.entries(doses).forEach(([d, c]) => {
              debugDoseCounts.value[k][d] = (debugDoseCounts.value[k][d] || 0) + (c || 0)
            })
          })
        }
      }
      // Helper: robust matching for Penta and MMR (aka MCV) using both vaccines object and debug payload
      const countFromDebug = (matcherFn, doseNum) => {
        const map = r.debug?.countByAntigenAndDoseUpper || null
        if (!map) return 0
        let sum = 0
        Object.entries(map).forEach(([upperName, doses]) => {
          const NORMAL = upperName.replace(/[^A-Z0-9]/g, '')
          if (matcherFn(upperName, NORMAL)) {
            const c = doses?.[doseNum] || 0
            sum += Number(c) || 0
          }
        })
        return sum
      }

      const isPenta = (UP, NORMAL) => (
        UP.includes('PENTA') ||
        UP.includes('PENTAVALENT') ||
        UP.includes('PENTAVALENT VACCINE') ||
        UP.includes('DPT-HEPB-HIB') ||
        UP.includes('DPT-HIB-HEPB') ||
        UP.includes('DTP') || UP.includes('DTAP') || UP.includes('DTWP') || UP.includes('DTPW') ||
        NORMAL.includes('DPTHEPBHIB') || NORMAL.includes('DPTHIBHEPB') || NORMAL.includes('5IN1') ||
        ((/DPT|DTP|DTAP|DTWP|DTPW/).test(NORMAL) && NORMAL.includes('HEPB') && NORMAL.includes('HIB'))
      )

      const isMMR = (UP) => (
        UP.includes('MMR') || UP.includes('MEASLES') || UP.includes('MCV') || UP.includes(' MR') || UP.startsWith('MR')
      )

      // Read from vaccines object when available
      let pent1 = (Array.isArray(r.vaccines?.Pentavalent) ? r.vaccines.Pentavalent.find(d => d.dose === 1)?.total : 0) || 0
      let pent3 = (Array.isArray(r.vaccines?.Pentavalent) ? r.vaccines.Pentavalent.find(d => d.dose === 3)?.total : 0) || 0
      let mmr1 = (Array.isArray(r.vaccines?.MMR) ? r.vaccines.MMR.find(d => d.dose === 1)?.total : 0) || 0
      let mmr2 = (Array.isArray(r.vaccines?.MMR) ? r.vaccines.MMR.find(d => d.dose === 2)?.total : 0) || 0

      // Fallbacks from debug payload when vaccines object is missing or mis-keyed
      if (!pent1) pent1 = countFromDebug(isPenta, 1)
      if (!pent3) pent3 = countFromDebug(isPenta, 3)
      if (!mmr1) mmr1 = countFromDebug(isMMR, 1)
      if (!mmr2) mmr2 = countFromDebug(isMMR, 2)
      p1[i] = pent1
      p3[i] = pent3
      m1[i] = mmr1
      m2[i] = mmr2
    })
    monthly.value = { penta1: p1, penta3: p3, mcv1: m1, mcv2: m2 }

    // Build cumulative
    const c1 = [], c3 = [], c4 = [], c5 = []
    let a1 = 0, a3 = 0, b1 = 0, b2 = 0
    for (let i = 0; i < 12; i++) {
      a1 += p1[i] || 0; c1.push(a1)
      a3 += p3[i] || 0; c3.push(a3)
      b1 += m1[i] || 0; c4.push(b1)
      b2 += m2[i] || 0; c5.push(b2)
    }
    series.value = { penta1: c1, penta3: c3, mcv1: c4, mcv2: c5 }
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
</script>

<style scoped>
.chart-wrap { background: #fff; }
.chart-inner { position: relative; }
.axis-label { font-size: 11px; fill: #6c757d; }

.line-target { fill: none; stroke: #d4a017; stroke-width: 2; opacity: 0.9; }
.line-penta1 { fill: none; stroke: #b22222; stroke-width: 2; }
.line-penta3 { fill: none; stroke: #7b1e1e; stroke-width: 2; }
.line-mcv1 { fill: none; stroke: #1f6feb; stroke-width: 2; }
.line-mcv2 { fill: none; stroke: #093e9c; stroke-width: 2; }

.dot-penta1 { fill: #b22222; }
.dot-penta3 { fill: #7b1e1e; }
.dot-mcv1 { fill: #1f6feb; }
.dot-mcv2 { fill: #093e9c; }

.legend-dot { display: inline-block; width: 12px; height: 12px; border-radius: 50%; vertical-align: middle; }
.legend-box { display: inline-block; width: 18px; height: 10px; border-radius: 2px; vertical-align: middle; }
.bg-target { background-color: #d4a017; }
.bg-penta1 { background-color: #b22222; }
.bg-penta3 { background-color: #7b1e1e; }
.bg-mcv1 { background-color: #1f6feb; }
.bg-mcv2 { background-color: #093e9c; }

.meta-card { background: #f8fafc; }
</style>
