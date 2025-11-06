<template>
  <AdminLayout>
    <div class="container-fluid">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 class="h3 mb-0 text-gray-800">
            System Settings
          </h1>
          <p class="text-muted mb-0">
            Configure system preferences and application settings
          </p>
        </div>
        <div class="d-flex gap-2">
          <button
            class="btn btn-outline-primary"
            @click="exportSettings"
          >
            <i class="bi bi-download me-2" />Export Settings
          </button>
          <button
            class="btn btn-outline-warning"
            @click="resetToDefaults"
          >
            <i class="bi bi-arrow-clockwise me-2" />Reset to Defaults
          </button>
          <button
            class="btn btn-primary"
            :disabled="saving"
            @click="saveAllSettings"
          >
            <span
              v-if="saving"
              class="spinner-border spinner-border-sm me-2"
            />
            <i
              v-else
              class="bi bi-check-circle me-2"
            />
            {{ saving ? 'Saving...' : 'Save Settings' }}
          </button>
        </div>
      </div>

      <!-- Settings Overview -->
      <div class="row g-3 mb-4">
        <div class="col-md-3">
          <div class="card border-start border-primary border-4 shadow h-100 py-2">
            <div class="card-body">
              <div class="row no-gutters align-items-center">
                <div class="col me-2">
                  <div class="text-xs fw-bold text-primary text-uppercase mb-1">
                    System Status
                  </div>
                  <div class="h5 mb-0 fw-bold text-gray-800">
                    {{ systemStatus }}
                  </div>
                </div>
                <div class="col-auto">
                  <i
                    class="bi bi-gear text-primary"
                    style="font-size: 2rem;"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="col-md-3">
          <div class="card border-start border-success border-4 shadow h-100 py-2">
            <div class="card-body">
              <div class="row no-gutters align-items-center">
                <div class="col me-2">
                  <div class="text-xs fw-bold text-success text-uppercase mb-1">
                    Last Backup
                  </div>
                  <div class="h5 mb-0 fw-bold text-gray-800">
                    {{ formatBackupDate(settings.system.lastBackup) }}
                  </div>
                </div>
                <div class="col-auto">
                  <i
                    class="bi bi-cloud-check text-success"
                    style="font-size: 2rem;"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="col-md-3">
          <div class="card border-start border-info border-4 shadow h-100 py-2">
            <div class="card-body">
              <div class="row no-gutters align-items-center">
                <div class="col me-2">
                  <div class="text-xs fw-bold text-info text-uppercase mb-1">
                    Storage Used
                  </div>
                  <div class="h5 mb-0 fw-bold text-gray-800">
                    {{ settings.system.storageUsed || '0 GB' }}
                  </div>
                </div>
                <div class="col-auto">
                  <i
                    class="bi bi-hdd text-info"
                    style="font-size: 2rem;"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="col-md-3">
          <div class="card border-start border-warning border-4 shadow h-100 py-2">
            <div class="card-body">
              <div class="row no-gutters align-items-center">
                <div class="col me-2">
                  <div class="text-xs fw-bold text-warning text-uppercase mb-1">
                    App Version
                  </div>
                  <div class="h5 mb-0 fw-bold text-gray-800">
                    {{ settings.system.version || 'v1.0.0' }}
                  </div>
                </div>
                <div class="col-auto">
                  <i
                    class="bi bi-app text-warning"
                    style="font-size: 2rem;"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- General Settings -->
      <div class="card shadow mb-4">
        <div class="card-header py-3">
          <h6 class="m-0 fw-bold text-primary">
            <i class="bi bi-sliders me-2" />
            General Settings
          </h6>
        </div>
        <div class="card-body">
          <div class="row g-4">
            <div class="col-xl-6 col-lg-6 col-md-6">
              <label class="form-label fw-semibold">Application Name:</label>
              <input 
                v-model="settings.general.appName" 
                type="text" 
                class="form-control"
                placeholder="Vaccination Management System"
              >
            </div>
            <div class="col-xl-6 col-lg-6 col-md-6">
              <label class="form-label fw-semibold">Organization Name:</label>
              <input 
                v-model="settings.general.organizationName" 
                type="text" 
                class="form-control"
                placeholder="Health Department"
              >
            </div>
            <div class="col-xl-6 col-lg-6 col-md-6">
              <label class="form-label fw-semibold">Default Language:</label>
              <select
                v-model="settings.general.defaultLanguage"
                class="form-select"
              >
                <option value="en">
                  English
                </option>
                <option value="tl">
                  Tagalog
                </option>
                <option value="ceb">
                  Cebuano
                </option>
                <option value="ilo">
                  Ilocano
                </option>
              </select>
            </div>
            <div class="col-xl-6 col-lg-6 col-md-6">
              <label class="form-label fw-semibold">Timezone:</label>
              <select
                v-model="settings.general.timezone"
                class="form-select"
              >
                <option value="Asia/Manila">
                  Asia/Manila (GMT+8)
                </option>
                <option value="UTC">
                  UTC (GMT+0)
                </option>
                <option value="Asia/Singapore">
                  Asia/Singapore (GMT+8)
                </option>
              </select>
            </div>
            <div class="col-xl-6 col-lg-6 col-md-6">
              <label class="form-label fw-semibold">Date Format:</label>
              <select
                v-model="settings.general.dateFormat"
                class="form-select"
              >
                <option value="MM/DD/YYYY">
                  MM/DD/YYYY
                </option>
                <option value="DD/MM/YYYY">
                  DD/MM/YYYY
                </option>
                <option value="YYYY-MM-DD">
                  YYYY-MM-DD
                </option>
              </select>
            </div>
            <div class="col-xl-6 col-lg-6 col-md-6">
              <label class="form-label fw-semibold">Records Per Page:</label>
              <select
                v-model="settings.general.recordsPerPage"
                class="form-select"
              >
                <option value="10">
                  10
                </option>
                <option value="20">
                  20
                </option>
                <option value="50">
                  50
                </option>
                <option value="100">
                  100
                </option>
              </select>
            </div>
          </div>
          
          <hr class="my-4">
          
          <div class="row g-3">
            <div class="col-12">
              <div class="form-check form-switch">
                <input 
                  id="maintenanceMode" 
                  v-model="settings.general.maintenanceMode" 
                  class="form-check-input" 
                  type="checkbox"
                >
                <label
                  class="form-check-label fw-semibold"
                  for="maintenanceMode"
                >
                  Maintenance Mode
                </label>
                <div class="form-text">
                  When enabled, only administrators can access the system
                </div>
              </div>
            </div>
            <div class="col-12">
              <div class="form-check form-switch">
                <input 
                  id="allowRegistration" 
                  v-model="settings.general.allowRegistration" 
                  class="form-check-input" 
                  type="checkbox"
                >
                <label
                  class="form-check-label fw-semibold"
                  for="allowRegistration"
                >
                  Allow User Registration
                </label>
                <div class="form-text">
                  Allow new users to register accounts
                </div>
              </div>
            </div>
            <div class="col-12">
              <div class="form-check form-switch">
                <input 
                  id="requireEmailVerification" 
                  v-model="settings.general.requireEmailVerification" 
                  class="form-check-input" 
                  type="checkbox"
                >
                <label
                  class="form-check-label fw-semibold"
                  for="requireEmailVerification"
                >
                  Require Email Verification
                </label>
                <div class="form-text">
                  New users must verify their email address before accessing the system
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Security Settings -->
      <div class="card shadow mb-4">
        <div class="card-header py-3">
          <h6 class="m-0 fw-bold text-primary">
            <i class="bi bi-shield-lock me-2" />
            Security Settings
          </h6>
        </div>
        <div class="card-body">
          <div class="row g-4">
            <div class="col-xl-6 col-lg-6 col-md-6">
              <label class="form-label fw-semibold">Session Timeout (minutes):</label>
              <input 
                v-model.number="settings.security.sessionTimeout" 
                type="number" 
                class="form-control"
                min="5"
                max="1440"
              >
            </div>
            <div class="col-xl-6 col-lg-6 col-md-6">
              <label class="form-label fw-semibold">Password Minimum Length:</label>
              <input 
                v-model.number="settings.security.passwordMinLength" 
                type="number" 
                class="form-control"
                min="6"
                max="20"
              >
            </div>
            <div class="col-xl-6 col-lg-6 col-md-6">
              <label class="form-label fw-semibold">Max Login Attempts:</label>
              <input 
                v-model.number="settings.security.maxLoginAttempts" 
                type="number" 
                class="form-control"
                min="3"
                max="10"
              >
            </div>
            <div class="col-xl-6 col-lg-6 col-md-6">
              <label class="form-label fw-semibold">Account Lockout Duration (minutes):</label>
              <input 
                v-model.number="settings.security.lockoutDuration" 
                type="number" 
                class="form-control"
                min="5"
                max="60"
              >
            </div>
          </div>
          
          <hr class="my-4">
          
          <div class="row g-3">
            <div class="col-12">
              <div class="form-check form-switch">
                <input 
                  id="requireStrongPasswords" 
                  v-model="settings.security.requireStrongPasswords" 
                  class="form-check-input" 
                  type="checkbox"
                >
                <label
                  class="form-check-label fw-semibold"
                  for="requireStrongPasswords"
                >
                  Require Strong Passwords
                </label>
                <div class="form-text">
                  Passwords must contain uppercase, lowercase, numbers, and special characters
                </div>
              </div>
            </div>
            <div class="col-12">
              <div class="form-check form-switch">
                <input 
                  id="enableTwoFactor" 
                  v-model="settings.security.enableTwoFactor" 
                  class="form-check-input" 
                  type="checkbox"
                >
                <label
                  class="form-check-label fw-semibold"
                  for="enableTwoFactor"
                >
                  Enable Two-Factor Authentication
                </label>
                <div class="form-text">
                  Allow users to enable 2FA for enhanced security
                </div>
              </div>
            </div>
            <div class="col-12">
              <div class="form-check form-switch">
                <input 
                  id="logSecurityEvents" 
                  v-model="settings.security.logSecurityEvents" 
                  class="form-check-input" 
                  type="checkbox"
                >
                <label
                  class="form-check-label fw-semibold"
                  for="logSecurityEvents"
                >
                  Log Security Events
                </label>
                <div class="form-text">
                  Log failed login attempts and other security-related events
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Vaccination Settings -->
      <div class="card shadow mb-4">
        <div class="card-header py-3">
          <h6 class="m-0 fw-bold text-primary">
            <i class="bi bi-shield-plus me-2" />
            Vaccination Settings
          </h6>
        </div>
        <div class="card-body">
          <div class="row g-4">
            <div class="col-xl-6 col-lg-6 col-md-6">
              <label class="form-label fw-semibold">Default Vaccine Schedule:</label>
              <select
                v-model="settings.vaccination.defaultSchedule"
                class="form-select"
              >
                <option value="doh-epi">
                  DOH Expanded Program on Immunization
                </option>
                <option value="who-standard">
                  WHO Standard Schedule
                </option>
                <option value="custom">
                  Custom Schedule
                </option>
              </select>
            </div>
            <div class="col-xl-6 col-lg-6 col-md-6">
              <label class="form-label fw-semibold">Reminder Days Before Due:</label>
              <input 
                v-model.number="settings.vaccination.reminderDays" 
                type="number" 
                class="form-control"
                min="1"
                max="30"
              >
            </div>
            <div class="col-xl-6 col-lg-6 col-md-6">
              <label class="form-label fw-semibold">Low Stock Alert Threshold:</label>
              <input 
                v-model.number="settings.vaccination.lowStockThreshold" 
                type="number" 
                class="form-control"
                min="1"
                max="100"
              >
            </div>
            <div class="col-xl-6 col-lg-6 col-md-6">
              <label class="form-label fw-semibold">Expiry Alert Days:</label>
              <input 
                v-model.number="settings.vaccination.expiryAlertDays" 
                type="number" 
                class="form-control"
                min="1"
                max="90"
              >
            </div>
          </div>
          
          <hr class="my-4">
          
          <div class="row g-3">
            <div class="col-12">
              <div class="form-check form-switch">
                <input 
                  id="autoGenerateSchedule" 
                  v-model="settings.vaccination.autoGenerateSchedule" 
                  class="form-check-input" 
                  type="checkbox"
                >
                <label
                  class="form-check-label fw-semibold"
                  for="autoGenerateSchedule"
                >
                  Auto-Generate Vaccination Schedule
                </label>
                <div class="form-text">
                  Automatically create vaccination schedules for new patients
                </div>
              </div>
            </div>
            <div class="col-12">
              <div class="form-check form-switch">
                <input 
                  id="sendReminders" 
                  v-model="settings.vaccination.sendReminders" 
                  class="form-check-input" 
                  type="checkbox"
                >
                <label
                  class="form-check-label fw-semibold"
                  for="sendReminders"
                >
                  Send Vaccination Reminders
                </label>
                <div class="form-text">
                  Send SMS/Email reminders to parents before vaccination due dates
                </div>
              </div>
            </div>
            <div class="col-12">
              <div class="form-check form-switch">
                <input 
                  id="requireBatchNumber" 
                  v-model="settings.vaccination.requireBatchNumber" 
                  class="form-check-input" 
                  type="checkbox"
                >
                <label
                  class="form-check-label fw-semibold"
                  for="requireBatchNumber"
                >
                  Require Batch Numbers
                </label>
                <div class="form-text">
                  Make batch number mandatory for all vaccine administrations
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Backup Settings -->
      <div class="card shadow mb-4">
        <div class="card-header py-3 d-flex justify-content-between align-items-center">
          <h6 class="m-0 fw-bold text-primary">
            <i class="bi bi-cloud-arrow-up me-2" />
            Backup & Data Settings
          </h6>
          <button
            class="btn btn-outline-primary btn-sm"
            :disabled="backing"
            @click="triggerBackup"
          >
            <span
              v-if="backing"
              class="spinner-border spinner-border-sm me-2"
            />
            <i
              v-else
              class="bi bi-cloud-upload me-2"
            />
            {{ backing ? 'Creating...' : 'Create Backup Now' }}
          </button>
        </div>
        <div class="card-body">
          <div class="row g-4">
            <div class="col-xl-6 col-lg-6 col-md-6">
              <label class="form-label fw-semibold">Backup Frequency:</label>
              <select
                v-model="settings.backup.frequency"
                class="form-select"
              >
                <option value="daily">
                  Daily
                </option>
                <option value="weekly">
                  Weekly
                </option>
                <option value="monthly">
                  Monthly
                </option>
                <option value="manual">
                  Manual Only
                </option>
              </select>
            </div>
            <div class="col-xl-6 col-lg-6 col-md-6">
              <label class="form-label fw-semibold">Backup Time:</label>
              <TimeInput 
                v-model="settings.backup.backupTime"
              />
            </div>
            <div class="col-xl-6 col-lg-6 col-md-6">
              <label class="form-label fw-semibold">Retain Backups (days):</label>
              <input 
                v-model.number="settings.backup.retentionDays" 
                type="number" 
                class="form-control"
                min="7"
                max="365"
              >
            </div>
            <div class="col-xl-6 col-lg-6 col-md-6">
              <label class="form-label fw-semibold">Data Retention (years):</label>
              <input 
                v-model.number="settings.backup.dataRetentionYears" 
                type="number" 
                class="form-control"
                min="1"
                max="20"
              >
            </div>
          </div>
          
          <hr class="my-4">
          
          <div class="row g-3">
            <div class="col-12">
              <div class="form-check form-switch">
                <input 
                  id="autoBackup" 
                  v-model="settings.backup.autoBackup" 
                  class="form-check-input" 
                  type="checkbox"
                >
                <label
                  class="form-check-label fw-semibold"
                  for="autoBackup"
                >
                  Enable Automatic Backups
                </label>
                <div class="form-text">
                  Automatically backup data according to the schedule
                </div>
              </div>
            </div>
            <div class="col-12">
              <div class="form-check form-switch">
                <input 
                  id="compressBackups" 
                  v-model="settings.backup.compressBackups" 
                  class="form-check-input" 
                  type="checkbox"
                >
                <label
                  class="form-check-label fw-semibold"
                  for="compressBackups"
                >
                  Compress Backup Files
                </label>
                <div class="form-text">
                  Reduce backup file size by compressing data
                </div>
              </div>
            </div>
            <div class="col-12">
              <div class="form-check form-switch">
                <input 
                  id="encryptBackups" 
                  v-model="settings.backup.encryptBackups" 
                  class="form-check-input" 
                  type="checkbox"
                >
                <label
                  class="form-check-label fw-semibold"
                  for="encryptBackups"
                >
                  Encrypt Backup Files
                </label>
                <div class="form-text">
                  Encrypt backup files for enhanced security
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Notification Settings -->
      <div class="card shadow mb-4">
        <div class="card-header py-3">
          <h6 class="m-0 fw-bold text-primary">
            <i class="bi bi-bell me-2" />
            Notification Settings
          </h6>
        </div>
        <div class="card-body">
          <div class="row g-4">
            <div class="col-xl-6 col-lg-6 col-md-6">
              <label class="form-label fw-semibold">SMTP Server:</label>
              <input 
                v-model="settings.notifications.smtpServer" 
                type="text" 
                class="form-control"
                placeholder="smtp.gmail.com"
              >
            </div>
            <div class="col-xl-6 col-lg-6 col-md-6">
              <label class="form-label fw-semibold">SMTP Port:</label>
              <input 
                v-model.number="settings.notifications.smtpPort" 
                type="number" 
                class="form-control"
                placeholder="587"
              >
            </div>
            <div class="col-xl-6 col-lg-6 col-md-6">
              <label class="form-label fw-semibold">From Email:</label>
              <input 
                v-model="settings.notifications.fromEmail" 
                type="email" 
                class="form-control"
                placeholder="noreply@healthcenter.gov.ph"
              >
            </div>
            <div class="col-xl-6 col-lg-6 col-md-6">
              <label class="form-label fw-semibold">SMS API Key:</label>
              <input 
                v-model="settings.notifications.smsApiKey" 
                type="text" 
                class="form-control"
                placeholder="Enter SMS API key"
              >
            </div>
          </div>
          
          <hr class="my-4">
          
          <div class="row g-3">
            <div class="col-12">
              <div class="form-check form-switch">
                <input 
                  id="enableEmailNotifications" 
                  v-model="settings.notifications.enableEmail" 
                  class="form-check-input" 
                  type="checkbox"
                >
                <label
                  class="form-check-label fw-semibold"
                  for="enableEmailNotifications"
                >
                  Enable Email Notifications
                </label>
                <div class="form-text">
                  Send email notifications for reminders and alerts
                </div>
              </div>
            </div>
            <div class="col-12">
              <div class="form-check form-switch">
                <input 
                  id="enableSmsNotifications" 
                  v-model="settings.notifications.enableSms" 
                  class="form-check-input" 
                  type="checkbox"
                >
                <label
                  class="form-check-label fw-semibold"
                  for="enableSmsNotifications"
                >
                  Enable SMS Notifications
                </label>
                <div class="form-text">
                  Send SMS notifications for urgent reminders
                </div>
              </div>
            </div>
            <div class="col-12">
              <div class="form-check form-switch">
                <input 
                  id="notifyStockAlerts" 
                  v-model="settings.notifications.notifyStockAlerts" 
                  class="form-check-input" 
                  type="checkbox"
                >
                <label
                  class="form-check-label fw-semibold"
                  for="notifyStockAlerts"
                >
                  Notify on Stock Alerts
                </label>
                <div class="form-text">
                  Send notifications when vaccine stock is low or expiring
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import AdminLayout from '@/components/layout/desktop/AdminLayout.vue'
import TimeInput from '@/components/ui/form/TimeInput.vue'
import api from '@/services/api'

// Reactive data
const loading = ref(true)
const saving = ref(false)
const backing = ref(false)

// Settings data
const settings = ref({
  general: {
    appName: 'Vaccination Management System',
    organizationName: '',
    defaultLanguage: 'en',
    timezone: 'Asia/Manila',
    dateFormat: 'MM/DD/YYYY',
    recordsPerPage: 20,
    maintenanceMode: false,
    allowRegistration: false,
    requireEmailVerification: true
  },
  security: {
    sessionTimeout: 60,
    passwordMinLength: 8,
    maxLoginAttempts: 5,
    lockoutDuration: 15,
    requireStrongPasswords: true,
    enableTwoFactor: true,
    logSecurityEvents: true
  },
  vaccination: {
    defaultSchedule: 'doh-epi',
    reminderDays: 7,
    lowStockThreshold: 10,
    expiryAlertDays: 30,
    autoGenerateSchedule: true,
    sendReminders: true,
    requireBatchNumber: true
  },
  backup: {
    frequency: 'daily',
    backupTime: '02:00',
    retentionDays: 30,
    dataRetentionYears: 7,
    autoBackup: true,
    compressBackups: true,
    encryptBackups: true
  },
  notifications: {
    smtpServer: '',
    smtpPort: 587,
    fromEmail: '',
    smsApiKey: '',
    enableEmail: true,
    enableSms: false,
    notifyStockAlerts: true
  },
  system: {
    version: 'v1.0.0',
    lastBackup: '',
    storageUsed: '',
    status: 'operational'
  }
})

// Computed properties
const systemStatus = computed(() => {
  if (settings.value.general.maintenanceMode) return 'Maintenance'
  return 'Operational'
})

// Methods
const fetchSettings = async () => {
  try {
    loading.value = true
    const response = await api.get('/settings')
    const data = response.data?.data || response.data
    
    if (data) {
      // Merge with default settings to ensure all properties exist
      settings.value = {
        general: { ...settings.value.general, ...data.general },
        security: { ...settings.value.security, ...data.security },
        vaccination: { ...settings.value.vaccination, ...data.vaccination },
        backup: { ...settings.value.backup, ...data.backup },
        notifications: { ...settings.value.notifications, ...data.notifications },
        system: { ...settings.value.system, ...data.system }
      }
    }
  } catch (error) {
    console.error('Error fetching settings:', error)
    // Use default settings if fetch fails
  } finally {
    loading.value = false
  }
}

const saveAllSettings = async () => {
  try {
    saving.value = true
    
    await api.put('/settings', settings.value)
    alert('Settings saved successfully!')
    
  } catch (error) {
    console.error('Error saving settings:', error)
    alert('Error saving settings. Please try again.')
  } finally {
    saving.value = false
  }
}

const triggerBackup = async () => {
  try {
    backing.value = true
    
    const _response = await api.post('/system/backup')
    settings.value.system.lastBackup = new Date().toISOString()
    alert('Backup created successfully!')
    
  } catch (error) {
    console.error('Error creating backup:', error)
    alert('Error creating backup. Please try again.')
  } finally {
    backing.value = false
  }
}

const exportSettings = async () => {
  try {
    const dataStr = JSON.stringify(settings.value, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `system-settings-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Error exporting settings:', error)
    alert('Error exporting settings. Please try again.')
  }
}

const resetToDefaults = () => {
  if (confirm('Are you sure you want to reset all settings to default values? This action cannot be undone.')) {
    settings.value = {
      general: {
        appName: 'Vaccination Management System',
        organizationName: '',
        defaultLanguage: 'en',
        timezone: 'Asia/Manila',
        dateFormat: 'MM/DD/YYYY',
        recordsPerPage: 20,
        maintenanceMode: false,
        allowRegistration: false,
        requireEmailVerification: true
      },
      security: {
        sessionTimeout: 60,
        passwordMinLength: 8,
        maxLoginAttempts: 5,
        lockoutDuration: 15,
        requireStrongPasswords: true,
        enableTwoFactor: true,
        logSecurityEvents: true
      },
      vaccination: {
        defaultSchedule: 'doh-epi',
        reminderDays: 7,
        lowStockThreshold: 10,
        expiryAlertDays: 30,
        autoGenerateSchedule: true,
        sendReminders: true,
        requireBatchNumber: true
      },
      backup: {
        frequency: 'daily',
        backupTime: '02:00',
        retentionDays: 30,
        dataRetentionYears: 7,
        autoBackup: true,
        compressBackups: true,
        encryptBackups: true
      },
      notifications: {
        smtpServer: '',
        smtpPort: 587,
        fromEmail: '',
        smsApiKey: '',
        enableEmail: true,
        enableSms: false,
        notifyStockAlerts: true
      },
      system: {
        ...settings.value.system // Keep system info
      }
    }
    alert('Settings have been reset to default values.')
  }
}

const formatBackupDate = (dateString) => {
  if (!dateString) return 'Never'
  const now = new Date()
  const date = new Date(dateString)
  const diffTime = Math.abs(now - date)
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  return date.toLocaleDateString('en-PH', { timeZone: 'Asia/Manila', month: 'short', day: 'numeric' })
}

// Lifecycle
onMounted(() => {
  fetchSettings()
})
</script>

<style scoped>
.modal.show {
  background-color: rgba(0, 0, 0, 0.5);
}

.border-start {
  border-left: 0.25rem solid !important;
}

.text-gray-800 {
  color: #5a5c69 !important;
}
</style>

