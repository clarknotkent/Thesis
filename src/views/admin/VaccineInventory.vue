<template>
  <AdminLayout>
    <div class="container-fluid p-4">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 class="h3 mb-0 text-gray-800">Vaccine Inventory</h1>
          <p class="text-muted mb-0">Manage and track vaccine stock levels</p>
        </div>
        <button class="btn btn-primary">
          <i class="bi bi-plus-circle me-2"></i>Add New Stock
        </button>
      </div>

      <!-- Inventory Summary -->
      <div class="row g-3 mb-4">
        <div class="col-md-3">
          <div class="card border-left-primary shadow h-100 py-2">
            <div class="card-body">
              <div class="row no-gutters align-items-center">
                <div class="col mr-2">
                  <div class="text-xs font-weight-bold text-primary text-uppercase mb-1">
                    Total Vaccine Types
                  </div>
                  <div class="h5 mb-0 font-weight-bold text-gray-800">12</div>
                </div>
                <div class="col-auto">
                  <i class="bi bi-list-check text-primary" style="font-size: 2rem;"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="col-md-3">
          <div class="card border-left-success shadow h-100 py-2">
            <div class="card-body">
              <div class="row no-gutters align-items-center">
                <div class="col mr-2">
                  <div class="text-xs font-weight-bold text-success text-uppercase mb-1">
                    Available Doses
                  </div>
                  <div class="h5 mb-0 font-weight-bold text-gray-800">3,245</div>
                </div>
                <div class="col-auto">
                  <i class="bi bi-shield-check text-success" style="font-size: 2rem;"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="col-md-3">
          <div class="card border-left-warning shadow h-100 py-2">
            <div class="card-body">
              <div class="row no-gutters align-items-center">
                <div class="col mr-2">
                  <div class="text-xs font-weight-bold text-warning text-uppercase mb-1">
                    Low Stock Items
                  </div>
                  <div class="h5 mb-0 font-weight-bold text-gray-800">2</div>
                </div>
                <div class="col-auto">
                  <i class="bi bi-exclamation-triangle text-warning" style="font-size: 2rem;"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="col-md-3">
          <div class="card border-left-danger shadow h-100 py-2">
            <div class="card-body">
              <div class="row no-gutters align-items-center">
                <div class="col mr-2">
                  <div class="text-xs font-weight-bold text-danger text-uppercase mb-1">
                    Expiring Soon
                  </div>
                  <div class="h5 mb-0 font-weight-bold text-gray-800">1</div>
                </div>
                <div class="col-auto">
                  <i class="bi bi-calendar-x text-danger" style="font-size: 2rem;"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Inventory Table -->
      <div class="card shadow mb-4">
        <div class="card-header py-3 d-flex justify-content-between align-items-center">
          <h6 class="m-0 font-weight-bold text-primary">Vaccine Stock</h6>
          <div class="input-group w-25">
            <input type="text" class="form-control" placeholder="Search..." aria-label="Search">
            <button class="btn btn-primary" type="button">
              <i class="bi bi-search"></i>
            </button>
          </div>
        </div>
        <div class="card-body">
          <div class="table-responsive">
            <table class="table table-hover">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Vaccine Name</th>
                  <th>Manufacturer</th>
                  <th>Batch No.</th>
                  <th>Expiry Date</th>
                  <th>Quantity</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>V-001</td>
                  <td>COVID-19</td>
                  <td>Pfizer</td>
                  <td>PF20250123</td>
                  <td>Dec 31, 2025</td>
                  <td>50</td>
                  <td><span class="badge bg-warning">Low Stock</span></td>
                  <td>
                    <div class="btn-group btn-group-sm">
                      <button class="btn btn-outline-primary">
                        <i class="bi bi-eye"></i>
                      </button>
                      <button class="btn btn-outline-success">
                        <i class="bi bi-plus-circle"></i>
                      </button>
                      <button class="btn btn-outline-danger">
                        <i class="bi bi-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td>V-002</td>
                  <td>Influenza</td>
                  <td>Sanofi</td>
                  <td>SF20250987</td>
                  <td>Sep 15, 2025</td>
                  <td>320</td>
                  <td><span class="badge bg-success">Available</span></td>
                  <td>
                    <div class="btn-group btn-group-sm">
                      <button class="btn btn-outline-primary">
                        <i class="bi bi-eye"></i>
                      </button>
                      <button class="btn btn-outline-success">
                        <i class="bi bi-plus-circle"></i>
                      </button>
                      <button class="btn btn-outline-danger">
                        <i class="bi bi-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td>V-003</td>
                  <td>Measles-Mumps-Rubella</td>
                  <td>Merck</td>
                  <td>MK20250456</td>
                  <td>Aug 30, 2025</td>
                  <td>175</td>
                  <td><span class="badge bg-danger">Expiring Soon</span></td>
                  <td>
                    <div class="btn-group btn-group-sm">
                      <button class="btn btn-outline-primary">
                        <i class="bi bi-eye"></i>
                      </button>
                      <button class="btn btn-outline-success">
                        <i class="bi bi-plus-circle"></i>
                      </button>
                      <button class="btn btn-outline-danger">
                        <i class="bi bi-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

    <!-- ...existing code... -->
    </div>
  </AdminLayout>
</template>

<script setup>
import AdminLayout from '@/components/layout/AdminLayout.vue'
</script>
