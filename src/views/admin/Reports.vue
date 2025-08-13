<template>
  <AdminLayout>
    <div class="container-fluid p-4">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 class="h3 mb-0 text-gray-800">Reports</h1>
          <p class="text-muted mb-0">Generate and view system reports</p>
        </div>
        <button class="btn btn-primary">
          <i class="bi bi-plus-circle me-2"></i>Generate Report
        </button>
      </div>

      <div class="row g-4">
        <!-- Available Reports -->
        <div class="col-lg-8">
          <div class="card shadow mb-4">
            <div class="card-header py-3">
              <h6 class="m-0 font-weight-bold text-primary">Available Reports</h6>
            </div>
            <div class="card-body">
              <div class="table-responsive">
                <table class="table table-hover">
                  <thead>
                    <tr>
                      <th>Report Name</th>
                      <th>Type</th>
                      <th>Last Generated</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Monthly Vaccination Summary</td>
                      <td>Monthly</td>
                      <td>Aug 1, 2025</td>
                      <td>
                        <button class="btn btn-sm btn-outline-primary me-2">
                          <i class="bi bi-download"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-secondary">
                          <i class="bi bi-arrow-clockwise"></i>
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <!-- Report Templates -->
        <div class="col-lg-4">
          <div class="card shadow mb-4">
            <div class="card-header py-3">
              <h6 class="m-0 font-weight-bold text-primary">Report Templates</h6>
            </div>
            <div class="card-body">
              <div class="d-grid gap-2">
                <button class="btn btn-outline-primary text-start">
                  <i class="bi bi-file-text me-2"></i>Vaccination Summary
                </button>
                <button class="btn btn-outline-primary text-start">
                  <i class="bi bi-file-text me-2"></i>Inventory Status
                </button>
                <button class="btn btn-outline-primary text-start">
                  <i class="bi bi-file-text me-2"></i>Patient Statistics
                </button>
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
