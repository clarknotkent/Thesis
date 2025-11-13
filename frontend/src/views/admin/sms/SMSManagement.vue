<template>
  <AdminLayout>
    <div class="container-fluid">
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
            SMS Management
          </li>
        </ol>
      </nav>

      <div class="mb-3">
        <h2 class="mb-1">
          <i class="bi bi-chat-dots me-2" />SMS Management
        </h2>
        <p class="text-muted mb-0">
          Manage vaccination reminder messages and auto-send settings
          <span v-if="isOffline" class="badge bg-warning text-dark ms-2">
            <i class="bi bi-wifi-off me-1" />Offline Mode
          </span>
        </p>
      </div>

      <!-- SMS Summary Cards -->
      <div class="row g-3 mb-3">
        <!-- Total Sent -->
        <div class="col-md-3">
          <div class="card border border-primary border-3 shadow-sm h-100">
            <div class="card-body py-3">
              <div class="d-flex align-items-center justify-content-between">
                <div>
                  <div class="text-xs fw-bold text-primary text-uppercase mb-1">
                    Total Sent
                  </div>
                  <div class="h4 mb-0 fw-bold text-gray-800">
                    1,247
                  </div>
                </div>
                <div class="col-auto">
                  <i
                    class="bi bi-send-check text-primary"
                    style="font-size: 2.5rem;"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Pending -->
        <div class="col-md-3">
          <div class="card border border-warning border-3 shadow-sm h-100">
            <div class="card-body py-3">
              <div class="d-flex align-items-center justify-content-between">
                <div>
                  <div class="text-xs fw-bold text-warning text-uppercase mb-1">
                    Pending
                  </div>
                  <div class="h4 mb-0 fw-bold text-gray-800">
                    23
                  </div>
                </div>
                <div class="col-auto">
                  <i
                    class="bi bi-clock-history text-warning"
                    style="font-size: 2.5rem;"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Failed -->
        <div class="col-md-3">
          <div class="card border border-danger border-3 shadow-sm h-100">
            <div class="card-body py-3">
              <div class="d-flex align-items-center justify-content-between">
                <div>
                  <div class="text-xs fw-bold text-danger text-uppercase mb-1">
                    Failed
                  </div>
                  <div class="h4 mb-0 fw-bold text-gray-800">
                    5
                  </div>
                </div>
                <div class="col-auto">
                  <i
                    class="bi bi-x-circle text-danger"
                    style="font-size: 2.5rem;"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Auto-Send Status -->
        <div class="col-md-3">
          <div class="card border border-success border-3 shadow-sm h-100">
            <div class="card-body py-3">
              <div class="d-flex align-items-center justify-content-between">
                <div>
                  <div class="text-xs fw-bold text-success text-uppercase mb-1">
                    Auto-Send
                  </div>
                  <div
                    class="h4 mb-0 fw-bold"
                    :class="autoSendEnabled ? 'text-success' : 'text-danger'"
                  >
                    {{ autoSendEnabled ? 'ON' : 'OFF' }}
                  </div>
                </div>
                <div class="col-auto">
                  <i
                    class="bi bi-lightning-charge text-success"
                    style="font-size: 2.5rem;"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- SMS Management with Tabs -->
      <div class="row">
        <!-- Main Content with Tabs -->
        <div class="col-lg-12">
          <div class="card shadow-sm">
            <div class="card-header py-3 bg-white border-bottom">
              <!-- Tabs Navigation -->
              <ul class="nav nav-tabs card-header-tabs border-0">
                <li class="nav-item">
                  <button 
                    class="nav-link" 
                    :class="{ active: activeTab === 'logs', disabled: isOffline }"
                    :disabled="isOffline"
                    @click="isOffline ? showOfflineToast() : activeTab = 'logs'"
                  >
                    <i class="bi bi-list-ul me-2" />Message Logs
                  </button>
                </li>
                <li class="nav-item">
                  <button 
                    class="nav-link" 
                    :class="{ active: activeTab === 'templates', disabled: isOffline }"
                    :disabled="isOffline"
                    @click="isOffline ? showOfflineToast() : activeTab = 'templates'"
                  >
                    <i class="bi bi-file-text me-2" />Message Templates
                  </button>
                </li>
                <li class="nav-item">
                  <button 
                    class="nav-link" 
                    :class="{ active: activeTab === 'settings', disabled: isOffline }"
                    :disabled="isOffline"
                    @click="isOffline ? showOfflineToast() : activeTab = 'settings'"
                  >
                    <i class="bi bi-gear me-2" />Auto-Send Settings
                  </button>
                </li>
              </ul>
            </div>
            <div class="card-body p-0">
              <!-- Message Logs Tab -->
              <div
                v-if="activeTab === 'logs'"
                class="p-4"
              >
                <MessageLogs />
              </div>

              <!-- Message Templates Tab -->
              <div
                v-if="activeTab === 'templates'"
                class="p-4"
              >
                <MessageTemplates />
              </div>

              <!-- Auto-Send Settings Tab -->
              <div
                v-if="activeTab === 'settings'"
                class="p-4"
              >
                <AutoSendSettings />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref } from 'vue'
import AdminLayout from '@/components/layout/desktop/AdminLayout.vue'
import MessageLogs from '@/features/admin/sms/components/MessageLogs.vue'
import MessageTemplates from '@/features/admin/sms/components/MessageTemplates.vue'
import AutoSendSettings from '@/features/admin/sms/components/AutoSendSettings.vue'
import { useOfflineAdmin } from '@/composables/useOfflineAdmin'
import { useToast } from '@/composables/useToast'

// State
const activeTab = ref('logs')
const autoSendEnabled = ref(false)
const { isOffline } = useOfflineAdmin()
const { addToast } = useToast()

// NOTE: SMS management data is managed through child components
// - SMSLogs component handles log fetching and display
// - AutoSendSettings component handles guardian auto-send preferences
// This parent component serves as a tab container and state coordinator

const showOfflineToast = () => {
  addToast({
    title: 'Offline Mode',
    message: 'SMS management is not available while offline',
    type: 'warning'
  })
}
</script>

<style scoped>
.text-xs {
  font-size: 0.7rem;
  letter-spacing: 0.05em;
}

.text-gray-800 {
  color: #5a5c69;
}

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

.card {
  border-radius: 0.35rem;
}

.shadow-sm {
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075) !important;
}

.card-header {
  border-bottom: 1px solid #e3e6f0;
}

.nav-tabs {
  border-bottom: none;
  margin-bottom: -1px;
}

.nav-tabs .nav-link {
  color: #858796;
  border: none;
  border-bottom: 3px solid transparent;
  background: none;
  padding: 0.75rem 1.25rem;
  font-size: 0.9rem;
}

.nav-tabs .nav-link:hover {
  border-bottom-color: #dddfeb;
  color: #4e73df;
  background: none;
}

.nav-tabs .nav-link.active {
  color: #4e73df;
  border-bottom-color: #4e73df;
  font-weight: 600;
  background: none;
}

h2 {
  font-size: 1.75rem;
  font-weight: 400;
  color: #5a5c69;
}

h2 i {
  color: #5a5c69;
}
</style>
