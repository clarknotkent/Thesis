<template>
  <ParentLayout>
    <div class="parent-dashboard">
      <!-- Welcome Section with Family Overview -->
      <div class="welcome-section mb-4">
        <AppCard class="parent-card bg-gradient-primary text-white">
          <div class="d-flex align-items-center justify-content-between">
            <div class="flex-grow-1">
              <h4 class="mb-1">👋 Welcome back, {{ parentName }}!</h4>
              <p class="mb-2 opacity-85">Keeping your     // Get recent vaccinations
    recentVaccinations.value = childData.recentVaccinations?.slice(0, 5).map(vacc => ({
      id: vacc.id,
      name: vacc.name,
      date: formatPHDate(vacc.date),en.length }} little one{{ children.length > 1 ? 's' : '' }} healthy and protected</p>
              <div class="d-flex align-items-center">
                <small class="opacity-75 me-3">
                  <i class="bi bi-shield-check me-1"></i>
                  {{ totalVaccinationsCompleted }} vaccines completed
                </small>
                <small class="opacity-75">
                  <i class="bi bi-calendar-event me-1"></i>
                  {{ upcomingVaccinationsCount }} upcoming
                </small>
              </div>
            </div>
            <div class="text-end">
              <div class="fs-2 mb-1">🏥</div>
              <small class="opacity-75">Health Guardian</small>
            </div>
          </div>
        </AppCard>
      </div>

      <!-- Children Overview -->
      <div class="children-overview mb-4">
        <AppCard class="parent-card">
          <template #header>
            <div class="bg-info text-white d-flex align-items-center justify-content-between">
              <div>
                <i class="bi bi-people me-2"></i>
                My Children
              </div>
              <span class="badge bg-light text-info">{{ children.length }}</span>
            </div>
          </template>

          <div v-if="children.length === 0" class="text-center py-4">
            <i class="bi bi-person-plus fs-1 text-muted mb-3"></i>
            <h6 class="text-muted">No children registered yet</h6>
            <p class="text-muted small">Contact your health center to register your child</p>
          </div>

          <div v-else class="row g-3">
            <div
              v-for="child in children"
              :key="child.id"
              class="col-md-6 col-lg-4"
            >
              <div
                class="child-card"
                :class="{ 'active': selectedChild?.id === child.id }"
                @click="selectChild(child)"
              >
                <div class="child-avatar">
                  <i class="bi bi-person-circle fs-2 text-primary"></i>
                </div>
                <div class="child-details">
                  <h6 class="mb-1 fw-bold">{{ child.name }}</h6>
                  <p class="mb-2 small text-muted">{{ child.age }} years old • {{ child.barangay }}</p>
                  <div class="vaccination-progress">
                    <div class="progress mb-1" style="height: 6px;">
                      <div
                        class="progress-bar bg-success"
                        :style="{ width: child.vaccinationSummary.percentage + '%' }"
                      ></div>
                    </div>
                    <small class="text-muted">
                      {{ child.vaccinationSummary.completed }}/{{ child.vaccinationSummary.total }} vaccines
                    </small>
                  </div>
                </div>
                <div class="child-status">
                  <span
                    class="status-badge"
                    :class="getChildStatusClass(child)"
                  >
                    {{ getChildStatusText(child) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </AppCard>
      </div>

      <!-- Selected Child Dashboard -->
      <div v-if="selectedChild" class="selected-child-dashboard">
        <!-- Child Health Summary -->
        <div class="row g-3 mb-4">
          <div class="col-lg-8">
            <AppCard class="parent-card">
              <template #header>
                <div class="bg-success text-white">
                  <i class="bi bi-activity me-2"></i>
                  {{ selectedChild.name }}'s Health Summary
                </div>
              </template>

              <div class="row g-3">
                <div class="col-md-4">
                  <div class="health-metric">
                    <div class="metric-icon bg-success">
                      <i class="bi bi-check-circle-fill"></i>
                    </div>
                    <div class="metric-content">
                      <h4 class="mb-0">{{ selectedChild.vaccinationSummary.completed }}</h4>
                      <small class="text-muted">Vaccines Done</small>
                    </div>
                  </div>
                </div>
                <div class="col-md-4">
                  <div class="health-metric">
                    <div class="metric-icon bg-warning">
                      <i class="bi bi-clock"></i>
                    </div>
                    <div class="metric-content">
                      <h4 class="mb-0">{{ selectedChild.vaccinationSummary.total - selectedChild.vaccinationSummary.completed }}</h4>
                      <small class="text-muted">Upcoming</small>
                    </div>
                  </div>
                </div>
                <div class="col-md-4">
                  <div class="health-metric">
                    <div class="metric-icon bg-info">
                      <i class="bi bi-trophy"></i>
                    </div>
                    <div class="metric-content">
                      <h4 class="mb-0">{{ selectedChild.vaccinationSummary.percentage }}%</h4>
                      <small class="text-muted">Complete</small>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Next Important Vaccine -->
              <div v-if="selectedChild.nextVaccine" class="mt-3 p-3 bg-light rounded">
                <div class="d-flex align-items-center">
                  <i class="bi bi-calendar-event text-warning me-2 fs-5"></i>
                  <div>
                    <strong>Next: {{ selectedChild.nextVaccine }}</strong>
                    <br>
                    <small class="text-muted">Don't forget to schedule this important vaccine!</small>
                  </div>
                </div>
              </div>
            </AppCard>
          </div>

          <div class="col-lg-4">
            <!-- Quick Actions -->
            <AppCard class="parent-card">
              <template #header>
                <div class="bg-primary text-white">
                  <i class="bi bi-lightning-charge me-2"></i>
                  Quick Actions
                </div>
              </template>

              <div class="d-grid gap-2">
                <AppButton
                  variant="outline-primary"
                  @click="viewChildProfile"
                  icon="bi bi-person-lines-fill"
                  class="text-start"
                >
                  <div>
                    <strong>View Full Profile</strong>
                    <br>
                    <small>Complete health information</small>
                  </div>
                </AppButton>

                <AppButton
                  variant="outline-success"
                  @click="viewVaccinationSchedule"
                  icon="bi bi-calendar-check"
                  class="text-start"
                >
                  <div>
                    <strong>Vaccination Schedule</strong>
                    <br>
                    <small>Track all vaccines</small>
                  </div>
                </AppButton>

                <AppButton
                  variant="outline-info"
                  @click="downloadRecords"
                  icon="bi bi-download"
                  class="text-start"
                >
                  <div>
                    <strong>Download Records</strong>
                    <br>
                    <small>Health records PDF</small>
                  </div>
                </AppButton>

                <AppButton
                  variant="outline-warning"
                  @click="scheduleAppointment"
                  icon="bi bi-calendar-plus"
                  class="text-start"
                >
                  <div>
                    <strong>Book Appointment</strong>
                    <br>
                    <small>Schedule a visit</small>
                  </div>
                </AppButton>
              </div>
            </AppCard>

            <!-- Health Tips -->
            <AppCard class="parent-card mt-3">
              <template #header>
                <div class="bg-light text-dark">
                  <i class="bi bi-lightbulb me-2"></i>
                  Health Tip of the Day
                </div>
              </template>

              <div class="text-center">
                <i class="bi bi-heart-pulse text-danger fs-1 mb-2"></i>
                <p class="mb-0 small">{{ currentHealthTip }}</p>
              </div>
            </AppCard>
          </div>
        </div>

        <!-- Recent Activity & Alerts -->
        <div class="row g-3 mb-4">
          <div class="col-md-6">
            <AppCard class="parent-card">
              <template #header>
                <div class="bg-success text-white">
                  <i class="bi bi-check-circle me-2"></i>
                  Recent Vaccinations
                </div>
              </template>

              <div v-if="recentVaccinations.length === 0" class="text-center py-3 text-muted">
                <i class="bi bi-calendar-x fs-2 mb-2"></i>
                <p class="mb-0">No recent vaccinations</p>
              </div>

              <div v-else>
                <div
                  v-for="vaccine in recentVaccinations.slice(0, 3)"
                  :key="vaccine.id"
                  class="d-flex align-items-center py-2 border-bottom"
                >
                  <div class="me-3">
                    <i class="bi bi-check-circle-fill text-success fs-5"></i>
                  </div>
                  <div class="flex-grow-1">
                    <div class="fw-bold small">{{ vaccine.name }}</div>
                    <small class="text-muted">{{ vaccine.date }}</small>
                  </div>
                </div>
              </div>
            </AppCard>
          </div>

          <div class="col-md-6">
            <AppCard class="parent-card">
              <template #header>
                <div class="bg-warning text-dark">
                  <i class="bi bi-exclamation-triangle me-2"></i>
                  Important Alerts
                </div>
              </template>

              <div v-if="importantAlerts.length === 0" class="text-center py-3 text-muted">
                <i class="bi bi-bell-slash fs-2 mb-2"></i>
                <p class="mb-0">No urgent alerts</p>
              </div>

              <div v-else>
                <div
                  v-for="alert in importantAlerts"
                  :key="alert.id"
                  class="alert-item"
                  :class="alert.priority"
                >
                  <div class="d-flex align-items-start">
                    <i :class="alert.icon" class="me-2 mt-1"></i>
                    <div class="flex-grow-1">
                      <strong class="small">{{ alert.title }}</strong>
                      <p class="mb-1 small">{{ alert.message }}</p>
                      <small class="text-muted">{{ alert.date }}</small>
                    </div>
                  </div>
                </div>
              </div>
            </AppCard>
          </div>
        </div>
      </div>

      <!-- Family Health Resources -->
      <div class="health-resources mb-4">
        <AppCard class="parent-card">
          <template #header>
            <div class="bg-info text-white">
              <i class="bi bi-book me-2"></i>
              Health Resources & Tips
            </div>
          </template>

          <div class="row g-3">
            <div class="col-md-4">
              <div class="resource-card" @click="openResource('vaccination-guide')">
                <div class="resource-icon">
                  <i class="bi bi-shield-check"></i>
                </div>
                <h6>Vaccination Guide</h6>
                <p class="small text-muted">Learn about vaccines and schedules</p>
              </div>
            </div>
            <div class="col-md-4">
              <div class="resource-card" @click="openResource('growth-milestones')">
                <div class="resource-icon">
                  <i class="bi bi-graph-up"></i>
                </div>
                <h6>Growth Milestones</h6>
                <p class="small text-muted">Track your child's development</p>
              </div>
            </div>
            <div class="col-md-4">
              <div class="resource-card" @click="openResource('emergency-care')">
                <div class="resource-icon">
                  <i class="bi bi-exclamation-triangle"></i>
                </div>
                <h6>Emergency Care</h6>
                <p class="small text-muted">When to seek medical help</p>
              </div>
            </div>
          </div>
        </AppCard>
      </div>

      <!-- Emergency Contact -->
      <div class="emergency-contact">
        <AppCard class="parent-emergency-card">
          <div class="text-center">
            <i class="bi bi-telephone-fill fs-2 mb-2 text-danger"></i>
            <h6 class="mb-1">Need Help?</h6>
            <p class="mb-3 text-muted">Contact our health center anytime</p>
            <div class="d-flex gap-2 justify-content-center">
              <a href="tel:+639171234567" class="btn btn-danger btn-sm">
                <i class="bi bi-telephone me-1"></i>
                Call Now
              </a>
              <AppButton
                variant="outline-primary"
                size="sm"
                @click="sendMessage"
                icon="bi bi-chat-dots"
              >
                Send Message
              </AppButton>
            </div>
          </div>
        </AppCard>
      </div>
    </div>
  </ParentLayout>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from '@/composables/useToast'
import ParentLayout from '@/components/layout/ParentLayout.vue'
import AppCard from '@/components/common/AppCard.vue'
import AppButton from '@/components/common/AppButton.vue'
import api from '@/services/api'
import { formatPHDate } from '@/utils/dateUtils'

// Reactive data
const loading = ref(true)
const parentName = ref('')
const children = ref([])
const selectedChild = ref(null)
const recentVaccinations = ref([])
const importantAlerts = ref([])
const currentHealthTip = ref('')

// Router
const router = useRouter()

// Computed properties
const totalVaccinationsCompleted = computed(() => {
  return children.value.reduce((sum, child) => sum + child.vaccinationSummary.completed, 0)
})

const upcomingVaccinationsCount = computed(() => {
  return children.value.reduce((sum, child) =>
    sum + (child.vaccinationSummary.total - child.vaccinationSummary.completed), 0)
})

// Health tips rotation
const healthTips = [
  "Regular check-ups help catch health issues early!",
  "A balanced diet and exercise keep your child strong and healthy.",
  "Vaccines are the best protection against serious diseases.",
  "Good hygiene habits prevent many illnesses.",
  "Adequate sleep is crucial for growing children.",
  "Stay hydrated - water is essential for good health!",
  "Reading to your child boosts brain development.",
  "Outdoor play strengthens both body and mind."
]

// Methods
const fetchDashboardData = async () => {
  try {
    loading.value = true

    // Fetch parent profile
    const profileResponse = await api.get('/parent/profile')
    const profile = profileResponse.data.data
    parentName.value = `${profile.firstname || profile.first_name || ''} ${profile.surname || profile.last_name || ''}`.trim() || 'Parent'

    // Fetch children
    const childrenResponse = await api.get('/parent/children')
    children.value = childrenResponse.data.data || []

    // Select first child by default if available
    if (children.value.length > 0) {
      selectChild(children.value[0])
    }

    // Generate alerts and health tips
    generateAlerts()
    rotateHealthTip()

  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    const { addToast } = useToast()
    addToast({ title: 'Error', message: 'Failed to load dashboard data', type: 'error' })

    // Fallback data
    parentName.value = 'Parent'
    children.value = []
    selectedChild.value = null
  } finally {
    loading.value = false
  }
}

const selectChild = async (child) => {
  console.log('Selecting child:', child)
  selectedChild.value = child
  console.log('Selected child set to:', selectedChild.value)

  // Fetch recent vaccinations for selected child
  await fetchChildVaccinations(child.id)
}

const fetchChildVaccinations = async (childId) => {
  try {
    const response = await api.get(`/parent/children/${childId}`)
    const childData = response.data.data

    // Get recent vaccinations
    recentVaccinations.value = childData.recentVaccinations?.slice(0, 5).map(vacc => ({
      id: vacc.id,
      name: vacc.name,
      date: new Date(vacc.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    })) || []
  } catch (error) {
    console.error('Error fetching child vaccinations:', error)
    recentVaccinations.value = []
  }
}

const generateAlerts = () => {
  const alerts = []

  children.value.forEach(child => {
    const upcomingCount = child.vaccinationSummary.total - child.vaccinationSummary.completed

    // Overdue vaccines alert
    if (upcomingCount > 0 && child.vaccinationSummary.percentage < 50) {
      alerts.push({
        id: `overdue-${child.id}`,
        title: `${child.name} has overdue vaccines`,
        message: `${upcomingCount} vaccines need immediate attention`,
        date: 'Today',
        priority: 'urgent',
        icon: 'bi bi-exclamation-triangle-fill text-danger'
      })
    }

    // Upcoming vaccines reminder
    if (upcomingCount > 0 && child.nextVaccine) {
      alerts.push({
        id: `upcoming-${child.id}`,
        title: `Upcoming vaccine for ${child.name}`,
        message: child.nextVaccine,
        date: 'This week',
        priority: 'normal',
        icon: 'bi bi-calendar-event text-warning'
      })
    }

    // Milestone celebration
    if (child.vaccinationSummary.percentage >= 80) {
      alerts.push({
        id: `milestone-${child.id}`,
        title: `🎉 Great progress for ${child.name}!`,
        message: `${child.vaccinationSummary.percentage}% vaccination complete`,
        date: 'Today',
        priority: 'positive',
        icon: 'bi bi-trophy-fill text-success'
      })
    }
  })

  importantAlerts.value = alerts.slice(0, 3) // Show top 3 alerts
}

const rotateHealthTip = () => {
  const randomIndex = Math.floor(Math.random() * healthTips.length)
  currentHealthTip.value = healthTips[randomIndex]
}

const getChildStatusClass = (child) => {
  const percentage = child.vaccinationSummary.percentage
  if (percentage >= 80) return 'status-excellent'
  if (percentage >= 60) return 'status-good'
  if (percentage >= 40) return 'status-warning'
  return 'status-danger'
}

const getChildStatusText = (child) => {
  const percentage = child.vaccinationSummary.percentage
  if (percentage >= 80) return 'Excellent'
  if (percentage >= 60) return 'Good'
  if (percentage >= 40) return 'Needs Attention'
  return 'Urgent Care'
}

// Action methods
const viewChildProfile = () => {
  console.log('View Child Profile clicked')
  console.log('Selected child:', selectedChild.value)
  if (selectedChild.value && selectedChild.value.id) {
    console.log('Navigating to:', `/parent/child-info/${selectedChild.value.id}`)
    router.push(`/parent/child-info/${selectedChild.value.id}`)
  } else {
    console.log('No selected child or missing ID')
  }
}

const viewVaccinationSchedule = () => {
  console.log('View Vaccination Schedule clicked')
  console.log('Selected child:', selectedChild.value)
  if (selectedChild.value && selectedChild.value.id) {
    console.log('Navigating to:', `/parent/vaccination-schedule/${selectedChild.value.id}`)
    router.push(`/parent/vaccination-schedule/${selectedChild.value.id}`)
  } else {
    console.log('No selected child or missing ID')
  }
}

const downloadRecords = () => {
  const { addToast } = useToast()
  addToast({
    title: 'Download Started',
    message: 'Health records download will be available soon',
    type: 'info'
  })
}

const scheduleAppointment = () => {
  const { addToast } = useToast()
  addToast({
    title: 'Appointment Booking',
    message: 'Redirecting to appointment scheduling...',
    type: 'info'
  })
}

const sendMessage = () => {
  const { addToast } = useToast()
  addToast({
    title: 'Message Center',
    message: 'Opening health center chat...',
    type: 'info'
  })
}

const openResource = (resourceType) => {
  const { addToast } = useToast()
  const resourceNames = {
    'vaccination-guide': 'Vaccination Guide',
    'growth-milestones': 'Growth Milestones',
    'emergency-care': 'Emergency Care Guide'
  }

  addToast({
    title: 'Opening Resource',
    message: `Loading ${resourceNames[resourceType]}...`,
    type: 'info'
  })
}

// Lifecycle
onMounted(() => {
  fetchDashboardData()
})
</script>

<style scoped>
/* Children Overview Cards */
.child-card {
  display: flex;
  align-items: center;
  padding: 1rem;
  border: 2px solid #e9ecef;
  border-radius: 12px;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 0.5rem;
}

.child-card:hover {
  border-color: #007bff;
  box-shadow: 0 4px 12px rgba(0,123,255,0.15);
  transform: translateY(-2px);
}

.child-card.active {
  border-color: #007bff;
  background: #f8f9ff;
  box-shadow: 0 4px 12px rgba(0,123,255,0.2);
}

.child-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: #e3f2fd;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;
  color: #1976d2;
}

.child-details {
  flex: 1;
}

.child-details h6 {
  margin: 0 0 0.25rem 0;
  font-weight: 600;
}

.child-details p {
  margin: 0;
  font-size: 0.875rem;
  color: #6c757d;
}

.vaccination-progress {
  margin-top: 0.5rem;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-excellent {
  background: #d4edda;
  color: #155724;
}

.status-good {
  background: #d1ecf1;
  color: #0c5460;
}

.status-warning {
  background: #fff3cd;
  color: #856404;
}

.status-danger {
  background: #f8d7da;
  color: #721c24;
}

/* Health Metrics */
.health-metric {
  display: flex;
  align-items: center;
  padding: 1rem;
  background: white;
  border-radius: 12px;
  border: 1px solid #e9ecef;
}

.metric-icon {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;
  font-size: 1.25rem;
  color: white;
}

.metric-content h4 {
  margin: 0;
  font-size: 1.75rem;
  font-weight: 700;
}

.metric-content small {
  color: #6c757d;
  font-weight: 500;
}

/* Alert Items */
.alert-item {
  padding: 0.75rem;
  border-radius: 8px;
  margin-bottom: 0.5rem;
}

.alert-item.urgent {
  background: #f8d7da;
  border-left: 4px solid #dc3545;
}

.alert-item.normal {
  background: #fff3cd;
  border-left: 4px solid #ffc107;
}

.alert-item.positive {
  background: #d4edda;
  border-left: 4px solid #28a745;
}

/* Resource Cards */
.resource-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1.5rem;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
}

.resource-card:hover {
  border-color: #007bff;
  box-shadow: 0 4px 12px rgba(0,123,255,0.15);
  transform: translateY(-2px);
}

.resource-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
  color: white;
  font-size: 1.5rem;
}

.resource-card h6 {
  margin: 0 0 0.5rem 0;
  font-weight: 600;
  color: #495057;
}

/* Emergency Contact */
.parent-emergency-card {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
  color: white;
  border: none;
}

.parent-emergency-card .btn {
  border-color: rgba(255, 255, 255, 0.3);
  color: white;
}

.parent-emergency-card .btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.5);
}

/* Responsive Design */
@media (max-width: 768px) {
  .child-card {
    flex-direction: column;
    text-align: center;
    padding: 1rem 0.75rem;
  }

  .child-avatar {
    margin-right: 0;
    margin-bottom: 0.75rem;
  }

  .health-metric {
    flex-direction: column;
    text-align: center;
  }

  .metric-icon {
    margin-right: 0;
    margin-bottom: 0.75rem;
  }
}
</style>

<!-- Styles moved to src/assets/styles/parent.css for consistency -->
