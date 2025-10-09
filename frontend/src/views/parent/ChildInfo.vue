<template>
  <ParentLayout>
    <div class="child-info">
      <!-- Child Profile Header -->
      <div class="child-profile-header mb-4">
        <AppCard class="parent-card">
          <div class="text-center">
            <div class="child-avatar-large mb-3">
              <i class="bi bi-person-circle text-primary" style="font-size: 5rem;"></i>
            </div>
            <h3 class="fw-bold mb-1">{{ childInfo.name }}</h3>
            <p class="text-muted mb-2">Patient ID: {{ childInfo.id }}</p>
            <div class="d-flex justify-content-center gap-2 mb-3">
              <span class="badge bg-info fs-6 px-3 py-2">{{ childInfo.ageDisplay }}</span>
              <span class="badge bg-secondary fs-6 px-3 py-2">{{ childInfo.gender }}</span>
            </div>
            <div class="vaccination-status-card">
              <div class="d-flex align-items-center justify-content-center">
                <i class="bi bi-shield-check text-success me-2 fs-4"></i>
                <div>
                  <div class="fw-bold">{{ vaccinationSummary.completed }}/{{ vaccinationSummary.total }} Vaccines</div>
                  <small class="text-muted">{{ vaccinationSummary.percentage }}% Complete</small>
                </div>
              </div>
            </div>
          </div>
        </AppCard>
      </div>

      <!-- Quick Actions Bar -->
      <div class="quick-actions-bar mb-4">
        <div class="row g-2">
          <div class="col-6 col-md-3">
            <button class="action-btn" @click="viewVaccinationSchedule">
              <i class="bi bi-calendar-check"></i>
              <span>Schedule</span>
            </button>
          </div>
          <div class="col-6 col-md-3">
            <button class="action-btn" @click="downloadRecords">
              <i class="bi bi-download"></i>
              <span>Records</span>
            </button>
          </div>
          <div class="col-6 col-md-3">
            <button class="action-btn" @click="scheduleAppointment">
              <i class="bi bi-calendar-plus"></i>
              <span>Book Visit</span>
            </button>
          </div>
          <div class="col-6 col-md-3">
            <button class="action-btn" @click="contactDoctor">
              <i class="bi bi-chat-dots"></i>
              <span>Message</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Health Overview -->
      <div class="health-overview mb-4">
        <AppCard class="parent-card">
          <template #header>
            <div class="bg-success text-white">
              <i class="bi bi-heart-pulse me-2"></i>
              Health Overview
            </div>
          </template>

          <div class="row g-3">
            <div class="col-md-6">
              <div class="health-indicator">
                <div class="indicator-icon bg-success">
                  <i class="bi bi-check-circle-fill"></i>
                </div>
                <div class="indicator-content">
                  <h6 class="mb-1">Vaccination Status</h6>
                  <p class="mb-0 small">{{ vaccinationSummary.completed }} of {{ vaccinationSummary.total }} vaccines completed</p>
                  <div class="progress mt-2" style="height: 6px;">
                    <div
                      class="progress-bar bg-success"
                      :style="{ width: vaccinationSummary.percentage + '%' }"
                    ></div>
                  </div>
                </div>
              </div>
            </div>
            <div class="col-md-6">
              <div class="health-indicator">
                <div class="indicator-icon bg-info">
                  <i class="bi bi-calendar-event"></i>
                </div>
                <div class="indicator-content">
                  <h6 class="mb-1">Next Check-up</h6>
                  <p class="mb-0 small">Regular health monitoring</p>
                  <small class="text-muted">Schedule your next visit</small>
                </div>
              </div>
            </div>
          </div>
        </AppCard>
      </div>

      <!-- Basic Information -->
      <div class="basic-info mb-4">
        <AppCard class="parent-card">
          <template #header>
            <div class="bg-primary text-white">
              <i class="bi bi-info-circle me-2"></i>
              Basic Information
            </div>
          </template>
          <div class="parent-info-grid">
            <div class="parent-info-item">
              <div class="parent-info-label">Full Name</div>
              <div class="parent-info-value">{{ childInfo.name }}</div>
            </div>
            <div class="parent-info-item">
              <div class="parent-info-label">Date of Birth</div>
              <div class="parent-info-value">{{ childInfo.dateOfBirth }}</div>
            </div>
            <div class="parent-info-item">
              <div class="parent-info-label">Age</div>
              <div class="parent-info-value">{{ childInfo.ageDisplay }}</div>
            </div>
            <div class="parent-info-item">
              <div class="parent-info-label">Gender</div>
              <div class="parent-info-value">{{ childInfo.gender }}</div>
            </div>
            <div class="parent-info-item">
              <div class="parent-info-label">Blood Type</div>
              <div class="parent-info-value">{{ childInfo.bloodType }}</div>
            </div>
            <div class="parent-info-item">
              <div class="parent-info-label">Barangay</div>
              <div class="parent-info-value">{{ childInfo.barangay }}</div>
            </div>
          </div>
        </AppCard>
      </div>

      <!-- Birth Information -->
      <div class="birth-info mb-4">
        <AppCard class="parent-card">
          <template #header>
            <div class="bg-info text-white">
              <i class="bi bi-baby me-2"></i>
              Birth Information
            </div>
          </template>
          <div class="parent-info-grid">
            <div class="parent-info-item">
              <div class="parent-info-label">Birth Weight</div>
              <div class="parent-info-value">{{ childInfo.weight }}</div>
            </div>
            <div class="parent-info-item">
              <div class="parent-info-label">Birth Length</div>
              <div class="parent-info-value">{{ childInfo.height }}</div>
            </div>
            <div class="parent-info-item">
              <div class="parent-info-label">Place of Birth</div>
              <div class="parent-info-value">{{ childInfo.placeOfBirth || 'Not recorded' }}</div>
            </div>
            <div class="parent-info-item">
              <div class="parent-info-label">Birth Attendant</div>
              <div class="parent-info-value">{{ childInfo.birthAttendant || 'Not recorded' }}</div>
            </div>
            <div class="parent-info-item">
              <div class="parent-info-label">Type of Delivery</div>
              <div class="parent-info-value">{{ childInfo.deliveryType || 'Not recorded' }}</div>
            </div>
            <div class="parent-info-item">
              <div class="parent-info-label">Newborn Screening</div>
              <div class="parent-info-value">{{ childInfo.newbornScreening || 'Not recorded' }}</div>
            </div>
          </div>
        </AppCard>
      </div>

      <!-- Parent/Guardian Information -->
      <div class="parent-info mb-4">
        <AppCard class="parent-card">
          <template #header>
            <div class="bg-success text-white">
              <i class="bi bi-person-hearts me-2"></i>
              Parent/Guardian Information
            </div>
          </template>
          <div class="parent-info-grid">
            <div class="parent-info-item">
              <div class="parent-info-label">Guardian Name</div>
              <div class="parent-info-value">{{ parentInfo.name }}</div>
            </div>
            <div class="parent-info-item">
              <div class="parent-info-label">Relationship</div>
              <div class="parent-info-value">{{ parentInfo.relationship }}</div>
            </div>
            <div class="parent-info-item">
              <div class="parent-info-label">Phone Number</div>
              <div class="parent-info-value">{{ parentInfo.phone }}</div>
            </div>
            <div class="parent-info-item">
              <div class="parent-info-label">Email Address</div>
              <div class="parent-info-value">{{ parentInfo.email }}</div>
            </div>
            <div class="parent-info-item">
              <div class="parent-info-label">Address</div>
              <div class="parent-info-value">{{ parentInfo.address }}</div>
            </div>
            <div class="parent-info-item">
              <div class="parent-info-label">Emergency Contact</div>
              <div class="parent-info-value">{{ parentInfo.emergencyContact }}</div>
            </div>
          </div>
        </AppCard>
      </div>

      <!-- Medical Information -->
      <div class="medical-info mb-4">
        <AppCard class="parent-card">
          <template #header>
            <div class="bg-warning text-dark">
              <i class="bi bi-heart-pulse me-2"></i>
              Medical Information
            </div>
          </template>
          <div class="parent-info-grid">
            <div class="parent-info-item">
              <div class="parent-info-label">Allergies</div>
              <div class="parent-info-value">
                <span v-if="childInfo.allergies.length === 0" class="text-muted">None reported</span>
                <div v-else>
                  <span
                    v-for="(allergy, index) in childInfo.allergies"
                    :key="index"
                    class="badge bg-danger me-1 mb-1"
                  >
                    {{ allergy }}
                  </span>
                </div>
              </div>
            </div>
            <div class="parent-info-item">
              <div class="parent-info-label">Medical Conditions</div>
              <div class="parent-info-value">
                <span v-if="childInfo.conditions.length === 0" class="text-muted">None reported</span>
                <div v-else>
                  <span
                    v-for="(condition, index) in childInfo.conditions"
                    :key="index"
                    class="badge bg-warning text-dark me-1 mb-1"
                  >
                    {{ condition }}
                  </span>
                </div>
              </div>
            </div>
            <div class="parent-info-item">
              <div class="parent-info-label">Medications</div>
              <div class="parent-info-value">
                <span v-if="childInfo.medications.length === 0" class="text-muted">None</span>
                <div v-else>
                  <div v-for="(medication, index) in childInfo.medications" :key="index" class="mb-1">
                    <strong>{{ medication.name }}</strong> - {{ medication.dosage }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </AppCard>
      </div>

      <!-- Recent Vaccinations -->
      <div class="recent-vaccinations mb-4">
        <AppCard class="parent-card">
          <template #header>
            <div class="bg-success text-white">
              <i class="bi bi-check-circle me-2"></i>
              Recent Vaccinations
            </div>
          </template>

          <div v-if="childInfo.recentVaccinations && childInfo.recentVaccinations.length === 0" class="text-center py-3 text-muted">
            <i class="bi bi-calendar-x fs-2 mb-2"></i>
            <p class="mb-0">No recent vaccinations</p>
          </div>

          <div v-else-if="childInfo.recentVaccinations">
            <div
              v-for="vaccination in childInfo.recentVaccinations.slice(0, 5)"
              :key="vaccination.id"
              class="vaccination-item"
            >
              <div class="d-flex align-items-center">
                <div class="vaccination-icon me-3">
                  <i class="bi bi-check-circle-fill text-success"></i>
                </div>
                <div class="flex-grow-1">
                  <h6 class="mb-1">{{ vaccination.name }}</h6>
                  <p class="mb-0 small text-muted">{{ vaccination.date }}</p>
                </div>
                <span class="badge bg-success">Completed</span>
              </div>
            </div>
          </div>
        </AppCard>
      </div>

      <!-- Growth Milestones -->
      <div class="growth-milestones mb-4">
        <AppCard class="parent-card">
          <template #header>
            <div class="bg-info text-white">
              <i class="bi bi-graph-up me-2"></i>
              Growth & Development
            </div>
          </template>

          <div class="text-center py-3">
            <i class="bi bi-graph-up fs-1 text-info mb-2"></i>
            <h6>Growth Tracking</h6>
            <p class="text-muted small">Monitor your child's physical and developmental milestones</p>
            <AppButton variant="outline-info" @click="viewGrowthChart">
              <i class="bi bi-bar-chart me-1"></i>
              View Growth Chart
            </AppButton>
          </div>
        </AppCard>
      </div>
    </div>
  </ParentLayout>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from '@/composables/useToast'
import ParentLayout from '@/components/layout/ParentLayout.vue'
import AppCard from '@/components/common/AppCard.vue'
import AppButton from '@/components/common/AppButton.vue'
import api from '@/services/api'
import { formatPHDate } from '@/utils/dateUtils'

// Reactive data
const loading = ref(true)
const childInfo = ref({
  id: '',
  name: '',
  dateOfBirth: '',
  ageDisplay: '',
  gender: '',
  bloodType: '',
  weight: '',
  height: '',
  barangay: '',
  placeOfBirth: '',
  birthAttendant: '',
  deliveryType: '',
  newbornScreening: '',
  allergies: [],
  conditions: [],
  medications: [],
  recentVaccinations: []
})
const parentInfo = ref({
  name: '',
  relationship: '',
  phone: '',
  email: '',
  address: '',
  emergencyContact: ''
})

// Route
const route = useRoute()
const router = useRouter()
const childId = route.params.childId

// Computed properties
const vaccinationSummary = computed(() => {
  const completed = childInfo.value.recentVaccinations?.length || 0
  const total = 15 // Standard vaccination schedule
  const pending = Math.max(0, total - completed)
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0

  return {
    completed,
    pending,
    total,
    percentage
  }
})

// Check if childId is available
if (!childId) {
  // Redirect asynchronously to avoid issues
  setTimeout(() => {
    router.push('/parent/dashboard')
  }, 0)
}

// Methods
const fetchChildData = async () => {
  try {
    loading.value = true

    // Fetch child details
    const childResponse = await api.get(`/parent/children/${childId}`)
    const childData = childResponse.data.data

    childInfo.value = {
      id: childData.id,
      name: childData.name || 'Not available',
      dateOfBirth: childData.dateOfBirth ? formatPHDate(childData.dateOfBirth, 'MMMM DD, YYYY') : 'Not available',
      ageDisplay: childData.ageDisplay || childData.age ? `${childData.age} years old` : 'Age not available',
      gender: childData.gender || childData.sex || 'Not specified',
      bloodType: childData.bloodType || childData.blood_type || 'Not specified',
      weight: childData.weight && childData.weight !== 'Not recorded' ? `${childData.weight} kg` : 'Not recorded',
      height: childData.height && childData.height !== 'Not recorded' ? `${childData.height} cm` : 'Not recorded',
      barangay: childData.barangay || 'Not specified',
      placeOfBirth: childData.placeOfBirth || 'Not recorded',
      birthAttendant: childData.birthAttendant || 'Not recorded',
      deliveryType: childData.deliveryType || 'Not recorded',
      newbornScreening: childData.newbornScreening || 'Not recorded',
      allergies: Array.isArray(childData.allergies) ? childData.allergies : [],
      conditions: Array.isArray(childData.conditions) ? childData.conditions : [],
      medications: Array.isArray(childData.medications) ? childData.medications : [],
      recentVaccinations: Array.isArray(childData.recentVaccinations) ? childData.recentVaccinations : []
    }

    // Fetch parent profile for parent info
    const parentResponse = await api.get('/parent/profile')
    const parentData = parentResponse.data.data

    parentInfo.value = {
      name: `${parentData.firstname || parentData.first_name || ''} ${parentData.surname || parentData.last_name || ''}`.trim() || 'Guardian',
      relationship: 'Parent/Guardian',
      phone: parentData.contact_number || parentData.contactnumber || parentData.phone || parentData.phone_number || 'Not provided',
      email: parentData.email || 'Not provided',
      address: `${parentData.address || ''}, ${parentData.barangay || ''}`.trim() || 'Not provided',
      emergencyContact: parentData.emergency_contact || parentData.emergencycontact || parentData.emergency_phone || 'Not provided'
    }

  } catch (error) {
    console.error('Error fetching child data:', error)
    const { addToast } = useToast()
    addToast({ title: 'Error', message: 'Failed to load child information', type: 'error' })

    // Fallback data
    childInfo.value = {
      id: childId,
      name: 'Child',
      dateOfBirth: 'Not available',
      ageDisplay: 'Age not available',
      gender: 'Not specified',
      bloodType: 'Not specified',
      weight: 'Not recorded',
      height: 'Not recorded',
      barangay: 'Not specified',
      placeOfBirth: 'Not recorded',
      birthAttendant: 'Not recorded',
      deliveryType: 'Not recorded',
      newbornScreening: 'Not recorded',
      allergies: [],
      conditions: [],
      medications: [],
      recentVaccinations: []
    }

    parentInfo.value = {
      name: 'Parent',
      relationship: 'Parent/Guardian',
      phone: 'Not provided',
      email: 'Not provided',
      address: 'Not provided',
      emergencyContact: 'Not provided'
    }
  } finally {
    loading.value = false
  }
}

// Action methods
const viewVaccinationSchedule = () => {
  router.push(`/parent/vaccination-schedule/${childId}`)
}

const downloadRecords = () => {
  const { addToast } = useToast()
  addToast({ title: 'Info', message: 'Vaccination records download feature coming soon', type: 'info' })
}

const scheduleAppointment = () => {
  const { addToast } = useToast()
  addToast({ title: 'Info', message: 'Appointment scheduling feature coming soon', type: 'info' })
}

const contactDoctor = () => {
  const { addToast } = useToast()
  addToast({ title: 'Info', message: 'Direct messaging with healthcare workers coming soon', type: 'info' })
}

const viewGrowthChart = () => {
  const { addToast } = useToast()
  addToast({ title: 'Info', message: 'Growth chart feature coming soon', type: 'info' })
}

// Lifecycle
onMounted(() => {
  if (childId) {
    fetchChildData()
  } else {
    // If no childId in route, redirect to dashboard or show error
    const { addToast } = useToast()
    addToast({ title: 'Error', message: 'No child selected', type: 'error' })
  }
})
</script>

<!-- Styles moved to src/assets/styles/parent.css for consistency -->
