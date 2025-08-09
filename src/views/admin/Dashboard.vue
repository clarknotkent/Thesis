<template>
  <AdminLayout>
    <div class="container-fluid p-4">
      <!-- Page Header -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 class="h3 mb-0 text-gray-800">Admin Dashboard</h1>
          <p class="text-muted mb-0">Welcome to the Immunization Management System</p>
        </div>
        <div class="d-none d-sm-inline-block btn btn-sm btn-primary shadow-sm">
          <i class="bi bi-download me-2"></i>Generate Report
        </div>
      </div>

      <!-- Stats Cards Row -->
      <div class="row g-3 mb-4">
        <!-- Total Patients Card -->
        <div class="col-xl-3 col-md-6">
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

        <!-- Vaccinations Today Card -->
        <div class="col-xl-3 col-md-6">
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

        <!-- Active Health Workers Card -->
        <div class="col-xl-3 col-md-6">
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
        <div class="col-xl-3 col-md-6">
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

      <!-- Content Row -->
      <div class="row">
        <!-- Recent Activity -->
        <div class="col-lg-8">
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
                      <th>Vaccine</th>
                      <th>Health Worker</th>
                      <th>Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>John Doe Jr.</td>
                      <td>COVID-19</td>
                      <td>Dr. Smith</td>
                      <td>Aug 8, 2025</td>
                      <td><span class="badge bg-success">Completed</span></td>
                    </tr>
                    <tr>
                      <td>Jane Smith</td>
                      <td>Flu Vaccine</td>
                      <td>Nurse Johnson</td>
                      <td>Aug 8, 2025</td>
                      <td><span class="badge bg-success">Completed</span></td>
                    </tr>
                    <tr>
                      <td>Mike Brown</td>
                      <td>Measles</td>
                      <td>Dr. Wilson</td>
                      <td>Aug 7, 2025</td>
                      <td><span class="badge bg-warning">Pending</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="col-lg-4">
          <div class="card shadow mb-4">
            <div class="card-header py-3">
              <h6 class="m-0 font-weight-bold text-primary">Quick Actions</h6>
            </div>
            <div class="card-body">
              <div class="d-grid gap-2">
                <button class="btn btn-primary">
                  <i class="bi bi-person-plus me-2"></i>Add New Patient
                </button>
                <button class="btn btn-success">
                  <i class="bi bi-plus-circle me-2"></i>Register Health Worker
                </button>
                <button class="btn btn-info">
                  <i class="bi bi-box-seam me-2"></i>Manage Inventory
                </button>
                <button class="btn btn-warning">
                  <i class="bi bi-calendar-plus me-2"></i>Schedule Appointment
                </button>
              </div>
            </div>
          </div>

          <!-- System Alerts -->
          <div class="card shadow mb-4">
            <div class="card-header py-3">
              <h6 class="m-0 font-weight-bold text-primary">System Alerts</h6>
            </div>
            <div class="card-body">
              <div class="alert alert-warning" role="alert">
                <i class="bi bi-exclamation-triangle me-2"></i>
                <strong>Low Stock:</strong> COVID-19 vaccines running low (50 doses remaining)
              </div>
              <div class="alert alert-info" role="alert">
                <i class="bi bi-info-circle me-2"></i>
                <strong>Reminder:</strong> Monthly report due in 3 days
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
</script>


