<template>
  <AdminLayout>
    <div class="container-fluid p-4">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 class="h3 mb-0 text-gray-800">Patient Records</h1>
          <p class="text-muted mb-0">Manage patient information and vaccination history</p>
        </div>
        <button class="btn btn-primary">
          <i class="bi bi-plus-circle me-2"></i>Add New Patient
        </button>
      </div>

      <!-- Search & Filter -->
      <div class="card shadow mb-4">
        <div class="card-body">
          <div class="row g-3">
            <div class="col-md-4">
              <div class="input-group">
                <span class="input-group-text bg-light border-end-0">
                  <i class="bi bi-search"></i>
                </span>
                <input 
                  type="text" 
                  class="form-control border-start-0" 
                  placeholder="Search patients..."
                />
              </div>
            </div>
            <div class="col-md-3">
              <select class="form-select">
                <option selected>All Patients</option>
                <option>Recently Added</option>
                <option>Vaccination Due</option>
                <option>Incomplete Records</option>
              </select>
            </div>
            <div class="col-md-3">
              <select class="form-select">
                <option selected>All Locations</option>
                <option>Urban</option>
                <option>Rural</option>
                <option>Suburban</option>
              </select>
            </div>
            <div class="col-md-2">
              <button class="btn btn-primary w-100">Filter</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Patient List -->
      <div class="card shadow mb-4">
        <div class="card-header py-3 d-flex justify-content-between align-items-center">
          <h6 class="m-0 font-weight-bold text-primary">Patient List</h6>
          <div class="btn-group btn-group-sm">
            <button class="btn btn-outline-primary">
              <i class="bi bi-download"></i>
            </button>
            <button class="btn btn-outline-primary">
              <i class="bi bi-printer"></i>
            </button>
            <button class="btn btn-outline-primary">
              <i class="bi bi-sliders"></i>
            </button>
          </div>
        </div>
        <div class="card-body">
          <div class="table-responsive">
            <table class="table table-hover">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Age</th>
                  <th>Gender</th>
                  <th>Contact Number</th>
                  <th>Last Visit</th>
                  <th>Next Vaccination</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>P-0001</td>
                  <td>John Doe Jr.</td>
                  <td>2 years</td>
                  <td>Male</td>
                  <td>+63 912 345 6789</td>
                  <td>Aug 8, 2025</td>
                  <td>Oct 11, 2025</td>
                  <td>
                    <div class="btn-group btn-group-sm">
                      <button class="btn btn-outline-primary">
                        <i class="bi bi-eye"></i>
                      </button>
                      <button class="btn btn-outline-primary">
                        <i class="bi bi-pencil"></i>
                      </button>
                      <button class="btn btn-outline-danger">
                        <i class="bi bi-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td>P-0002</td>
                  <td>Jane Smith</td>
                  <td>5 years</td>
                  <td>Female</td>
                  <td>+63 923 456 7891</td>
                  <td>Aug 5, 2025</td>
                  <td>Sep 15, 2025</td>
                  <td>
                    <div class="btn-group btn-group-sm">
                      <button class="btn btn-outline-primary">
                        <i class="bi bi-eye"></i>
                      </button>
                      <button class="btn btn-outline-primary">
                        <i class="bi bi-pencil"></i>
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
        <div class="card-footer">
          <nav>
            <ul class="pagination justify-content-center mb-0">
              <li class="page-item disabled">
                <a class="page-link" href="#">Previous</a>
              </li>
              <li class="page-item active">
                <a class="page-link" href="#">1</a>
              </li>
              <li class="page-item">
                <a class="page-link" href="#">2</a>
              </li>
              <li class="page-item">
                <a class="page-link" href="#">3</a>
              </li>
              <li class="page-item">
                <a class="page-link" href="#">Next</a>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import AdminLayout from '@/components/layout/AdminLayout.vue'
</script>
