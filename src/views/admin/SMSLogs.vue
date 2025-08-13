<template>
  <AdminLayout>
    <div class="container-fluid p-4">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 class="h3 mb-0 text-gray-800">SMS Logs</h1>
          <p class="text-muted mb-0">View and manage SMS communications</p>
        </div>
      </div>

      <div class="card shadow mb-4">
        <div class="card-header py-3 d-flex justify-content-between align-items-center">
          <h6 class="m-0 font-weight-bold text-primary">Message History</h6>
          <div class="d-flex gap-2">
            <button class="btn btn-sm btn-outline-primary">
              <i class="bi bi-filter me-1"></i>Filter
            </button>
            <button class="btn btn-sm btn-outline-primary">
              <i class="bi bi-download me-1"></i>Export
            </button>
          </div>
        </div>
        <div class="card-body">
          <div class="table-responsive">
            <table class="table table-hover">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Recipient</th>
                  <th>Message Type</th>
                  <th>Content</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Aug 11, 2025</td>
                  <td>John Doe</td>
                  <td>Appointment Reminder</td>
                  <td>Your vaccination appointment is scheduled for tomorrow at 2 PM...</td>
                  <td><span class="badge bg-success">Delivered</span></td>
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
