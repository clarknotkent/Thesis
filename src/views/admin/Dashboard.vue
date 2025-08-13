<template>
  <AdminLayout>
    <div class="container-fluid p-4">
      <!-- Page Header (matches wireframe with icons on the right) -->
      <div class="d-flex justify-content-between align-items-center mb-4 page-header">
        <div>
          <h1 class="h3 mb-0 text-gray-800">Admin Dashboard</h1>
          <p class="text-muted mb-0">Welcome to the Immunization Management System</p>
        </div>
        <div class="d-flex align-items-center gap-2 header-actions">
          <!-- Removed Generate Report button -->
        </div>
      </div>

      <!-- Stats Cards Row -->
      <div class="row g-3 mb-4">
        <!-- Vaccinations Today Card -->
        <div class="col">
          <div class="card border-left-success shadow h-100 py-2">
            <div class="card-body">
              <div class="row no-gutters align-items-center">
                <div class="col mr-2">
                  <div class="text-xs font-weight-bold text-success text-uppercase mb-1">
                    Vaccinations Today
                  </div>
                  <div class="h5 mb-0 font-weight-bold text-gray-800">48</div>
                </div>
                <div class="col-auto">
                  <i class="bi bi-shield-check text-success" style="font-size: 2rem;"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Total Patients Card -->
        <div class="col">
          <div class="card border-left-primary shadow h-100 py-2">
            <div class="card-body">
              <div class="row no-gutters align-items-center">
                <div class="col mr-2">
                  <div class="text-xs font-weight-bold text-primary text-uppercase mb-1">
                    Total Patients
                  </div>
                  <div class="h5 mb-0 font-weight-bold text-gray-800">1,234</div>
                </div>
                <div class="col-auto">
                  <i class="bi bi-people text-primary" style="font-size: 2rem;"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Active Health Workers Card -->
        <div class="col">
          <div class="card border-left-info shadow h-100 py-2">
            <div class="card-body">
              <div class="row no-gutters align-items-center">
                <div class="col mr-2">
                  <div class="text-xs font-weight-bold text-info text-uppercase mb-1">
                    Active Health Workers
                  </div>
                  <div class="h5 mb-0 font-weight-bold text-gray-800">12</div>
                </div>
                <div class="col-auto">
                  <i class="bi bi-person-badge text-info" style="font-size: 2rem;"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Pending Appointments Card -->
        <div class="col">
          <div class="card border-left-warning shadow h-100 py-2">
            <div class="card-body">
              <div class="row no-gutters align-items-center">
                <div class="col mr-2">
                  <div class="text-xs font-weight-bold text-warning text-uppercase mb-1">
                    Pending Appointments
                  </div>
                  <div class="h5 mb-0 font-weight-bold text-gray-800">18</div>
                </div>
                <div class="col-auto">
                  <i class="bi bi-calendar-event text-warning" style="font-size: 2rem;"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Chart and Recent Vaccinations -->
      <div class="row">
        <!-- Vaccine Data Chart -->
        <div class="col-12">
          <div class="card shadow mb-4">
            <div class="card-header py-3 d-flex flex-row align-items-center justify-content-between">
              <h6 class="m-0 font-weight-bold text-primary">Vaccine Data</h6>
              <small class="text-muted">Last 7 days</small>
            </div>
            <div class="card-body">
              <div class="wire-chart" role="img" aria-label="Bar chart of vaccines administered">
                <ul class="y-axis-markers">
                  <li>100</li>
                  <li>75</li>
                  <li>50</li>
                  <li>25</li>
                  <li>0</li>
                </ul>
                <div class="chart-grid"></div>
                <div class="bars">
                  <div v-for="(d, idx) in chartData" :key="idx" class="bar-group">
                    <div class="bar-value-label">{{ d.value }}</div>
                    <div
                      class="bar"
                      :style="{ height: d.value + '%', backgroundColor: d.color }"
                      :aria-label="`${d.label} ${d.value}`"
                      :title="`${d.label}: ${d.value}`"
                    ></div>
                  </div>
                </div>
                <div class="labels">
                  <span v-for="(d, idx) in chartData" :key="'lbl-'+idx">{{ d.label }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Vaccinations Table -->
        <div class="col-12">
          <div class="card shadow mb-4">
            <div class="card-header py-3 d-flex flex-row align-items-center justify-content-between">
              <h6 class="m-0 font-weight-bold text-primary">Recent Vaccinations</h6>
              <div class="dropdown no-arrow">
                <a class="dropdown-toggle" href="#" role="button" id="dropdownMenuLink" data-bs-toggle="dropdown">
                  <i class="bi bi-three-dots-vertical"></i>
                </a>
                <div class="dropdown-menu dropdown-menu-right shadow">
                  <div class="dropdown-header">Actions:</div>
                  <a class="dropdown-item" href="#">View All</a>
                  <a class="dropdown-item" href="#">Export Data</a>
                </div>
              </div>
            </div>
            <div class="card-body">
              <div class="table-responsive">
                <table class="table table-hover">
                  <thead>
                    <tr>
                      <th>Patient</th>
                      <th>Parent</th>
                      <th>Vaccine</th>
                      <th>Health Worker</th>
                      <th>Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>John Doe Jr.</td>
                      <td>John Doe</td>
                      <td>COVID-19</td>
                      <td>Dr. Smith</td>
                      <td>Aug 8, 2025</td>
                      <td><span class="badge bg-success">Completed</span></td>
                    </tr>
                    <tr>
                      <td>Jane Smith</td>
                      <td>Mary Smith</td>
                      <td>Flu Vaccine</td>
                      <td>Nurse Johnson</td>
                      <td>Aug 8, 2025</td>
                      <td><span class="badge bg-success">Completed</span></td>
                    </tr>
                    <tr>
                      <td>Mike Brown</td>
                      <td>David Brown</td>
                      <td>Measles</td>
                      <td>Dr. Wilson</td>
                      <td>Aug 7, 2025</td>
                      <td><span class="badge bg-warning">Pending</span></td>
                    </tr>
                    <tr>
                      <td>Emily White</td>
                      <td>Sarah White</td>
                      <td>Hepatitis B</td>
                      <td>Dr. Smith</td>
                      <td>Aug 7, 2025</td>
                      <td><span class="badge bg-success">Completed</span></td>
                    </tr>
                    <tr>
                      <td>Chris Green</td>
                      <td>Laura Green</td>
                      <td>Polio</td>
                      <td>Nurse Johnson</td>
                      <td>Aug 6, 2025</td>
                      <td><span class="badge bg-success">Completed</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import AdminLayout from '@/components/layout/AdminLayout.vue'

// Simple data for the bar chart, styled like the example image
const chartData = [
  { label: 'HepB', value: 85, color: 'var(--primary-color)' },
  { label: 'BCG', value: 35, color: 'var(--success-color)' },
  { label: 'OPV', value: 55, color: 'var(--info-color)' },
  { label: 'MMR', value: 40, color: 'var(--warning-color)' }
]
</script>