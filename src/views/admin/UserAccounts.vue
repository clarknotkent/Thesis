<template>
  <AdminLayout>
    <div class="container-fluid p-4">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 class="h3 mb-0 text-gray-800">User Accounts</h1>
          <p class="text-muted mb-0">Manage system users and permissions</p>
        </div>
        <button class="btn btn-primary">
          <i class="bi bi-plus-circle me-2"></i>Add New User
        </button>
      </div>

      <!-- User Stats -->
      <div class="row g-3 mb-4">
        <div class="col-md-3">
          <div class="card border-left-primary shadow h-100 py-2">
            <div class="card-body">
              <div class="row no-gutters align-items-center">
                <div class="col mr-2">
                  <div class="text-xs font-weight-bold text-primary text-uppercase mb-1">
                    Total Users
                  </div>
                  <div class="h5 mb-0 font-weight-bold text-gray-800">42</div>
                </div>
                <div class="col-auto">
                  <i class="bi bi-people text-primary" style="font-size: 2rem;"></i>
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
                    Health Workers
                  </div>
                  <div class="h5 mb-0 font-weight-bold text-gray-800">12</div>
                </div>
                <div class="col-auto">
                  <i class="bi bi-person-badge text-success" style="font-size: 2rem;"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="col-md-3">
          <div class="card border-left-info shadow h-100 py-2">
            <div class="card-body">
              <div class="row no-gutters align-items-center">
                <div class="col mr-2">
                  <div class="text-xs font-weight-bold text-info text-uppercase mb-1">
                    Parents
                  </div>
                  <div class="h5 mb-0 font-weight-bold text-gray-800">28</div>
                </div>
                <div class="col-auto">
                  <i class="bi bi-person-vcard text-info" style="font-size: 2rem;"></i>
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
                    Admins
                  </div>
                  <div class="h5 mb-0 font-weight-bold text-gray-800">2</div>
                </div>
                <div class="col-auto">
                  <i class="bi bi-person-lock text-warning" style="font-size: 2rem;"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- User Management -->
      <div class="card shadow mb-4">
        <div class="card-header py-3 d-flex justify-content-between align-items-center">
          <div class="d-flex align-items-center">
            <h6 class="m-0 font-weight-bold text-primary me-4">User List</h6>
            <div class="btn-group btn-group-sm">
              <button class="btn btn-outline-primary active">All</button>
              <button class="btn btn-outline-primary">Admins</button>
              <button class="btn btn-outline-primary">Health Workers</button>
              <button class="btn btn-outline-primary">Parents</button>
            </div>
          </div>
          <div class="input-group w-25">
            <input type="text" class="form-control" placeholder="Search users...">
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
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Last Login</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>U-001</td>
                  <td>Admin User</td>
                  <td>admin@immunizeme.com</td>
                  <td><span class="badge bg-warning text-dark">Admin</span></td>
                  <td><span class="badge bg-success">Active</span></td>
                  <td>Aug 11, 2025 09:45 AM</td>
                  <td>
                    <div class="btn-group btn-group-sm">
                      <button class="btn btn-outline-primary">
                        <i class="bi bi-pencil"></i>
                      </button>
                      <button class="btn btn-outline-secondary">
                        <i class="bi bi-key"></i>
                      </button>
                      <button class="btn btn-outline-danger">
                        <i class="bi bi-person-x"></i>
                      </button>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td>U-002</td>
                  <td>Dr. Smith</td>
                  <td>smith@immunizeme.com</td>
                  <td><span class="badge bg-primary">Health Worker</span></td>
                  <td><span class="badge bg-success">Active</span></td>
                  <td>Aug 11, 2025 08:30 AM</td>
                  <td>
                    <div class="btn-group btn-group-sm">
                      <button class="btn btn-outline-primary">
                        <i class="bi bi-pencil"></i>
                      </button>
                      <button class="btn btn-outline-secondary">
                        <i class="bi bi-key"></i>
                      </button>
                      <button class="btn btn-outline-danger">
                        <i class="bi bi-person-x"></i>
                      </button>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td>U-003</td>
                  <td>John Doe</td>
                  <td>john.doe@example.com</td>
                  <td><span class="badge bg-info text-dark">Parent</span></td>
                  <td><span class="badge bg-secondary">Inactive</span></td>
                  <td>Aug 5, 2025 03:15 PM</td>
                  <td>
                    <div class="btn-group btn-group-sm">
                      <button class="btn btn-outline-primary">
                        <i class="bi bi-pencil"></i>
                      </button>
                      <button class="btn btn-outline-secondary">
                        <i class="bi bi-key"></i>
                      </button>
                      <button class="btn btn-outline-danger">
                        <i class="bi bi-person-x"></i>
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

      <!-- User Activity Log -->
      <div class="card shadow">
        <div class="card-header py-3">
          <h6 class="m-0 font-weight-bold text-primary">Recent Activity</h6>
        </div>
        <div class="card-body">
          <div class="table-responsive">
            <table class="table table-hover">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>IP Address</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Aug 11, 2025 09:45 AM</td>
                  <td>Admin User</td>
                  <td>Logged in</td>
                  <td>192.168.1.1</td>
                </tr>
                <tr>
                  <td>Aug 11, 2025 09:30 AM</td>
                  <td>Dr. Smith</td>
                  <td>Updated patient record</td>
                  <td>192.168.1.5</td>
                </tr>
                <tr>
                  <td>Aug 11, 2025 09:15 AM</td>
                  <td>Dr. Wilson</td>
                  <td>Registered new vaccination</td>
                  <td>192.168.1.10</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import AdminLayout from '@/components/layout/AdminLayout.vue'
</script>
