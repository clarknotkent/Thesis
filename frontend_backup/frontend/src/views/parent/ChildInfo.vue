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
            <p class="text-muted mb-3">Patient ID: {{ childInfo.id }}</p>
            <span class="badge bg-info fs-6 px-3 py-2">{{ childInfo.age }} years old</span>
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
              <div class="parent-info-label">Gender</div>
              <div class="parent-info-value">{{ childInfo.gender }}</div>
            </div>
            <div class="parent-info-item">
              <div class="parent-info-label">Blood Type</div>
              <div class="parent-info-value">{{ childInfo.bloodType }}</div>
            </div>
            <div class="parent-info-item">
              <div class="parent-info-label">Weight</div>
              <div class="parent-info-value">{{ childInfo.weight }} kg</div>
            </div>
            <div class="parent-info-item">
              <div class="parent-info-label">Height</div>
              <div class="parent-info-value">{{ childInfo.height }} cm</div>
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
                    class="badge bg-danger me-1"
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
                    class="badge bg-warning text-dark me-1"
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

      <!-- Vaccination Summary -->
      <div class="vaccination-summary mb-4">
        <AppCard class="parent-card">
          <template #header>
            <div class="bg-info text-white">
              <i class="bi bi-shield-check me-2"></i>
              Vaccination Summary
            </div>
          </template>
          <div class="row g-3 mb-3">
            <div class="col-4">
              <div class="text-center">
                <div class="fs-2 fw-bold text-success">{{ vaccinationSummary.completed }}</div>
                <small class="text-muted">Completed</small>
              </div>
            </div>
            <div class="col-4">
              <div class="text-center">
                <div class="fs-2 fw-bold text-warning">{{ vaccinationSummary.pending }}</div>
                <small class="text-muted">Pending</small>
              </div>
            </div>
            <div class="col-4">
              <div class="text-center">
                <div class="fs-2 fw-bold text-primary">{{ vaccinationSummary.total }}</div>
                <small class="text-muted">Total</small>
              </div>
            </div>
          </div>
          <div class="progress" style="height: 8px;">
            <div 
              class="progress-bar bg-success" 
              role="progressbar" 
              :style="`width: ${(vaccinationSummary.completed / vaccinationSummary.total) * 100}%`"
            ></div>
          </div>
          <div class="text-center mt-2">
            <small class="text-muted">
              {{ Math.round((vaccinationSummary.completed / vaccinationSummary.total) * 100) }}% Complete
            </small>
          </div>
        </AppCard>
      </div>

      <!-- Quick Actions -->
      <div class="quick-actions">
        <div class="row g-2">
          <div class="col-6">
            <AppButton
              variant="primary"
              class="w-100 parent-btn-primary"
              :to="'/parent/vaccination-schedule'"
              icon="bi bi-calendar-check"
            >
              View Schedule
            </AppButton>
          </div>
          <div class="col-6">
            <AppButton
              variant="success"
              class="w-100"
              @click="downloadRecord"
              icon="bi bi-download"
            >
              Download Record
            </AppButton>
          </div>
        </div>
      </div>
    </div>
  </ParentLayout>
</template>

<script setup>
import { ref } from 'vue'
import ParentLayout from '@/components/layout/ParentLayout.vue'
import AppCard from '@/components/common/AppCard.vue'
import AppButton from '@/components/common/AppButton.vue'

const childInfo = ref({
  id: 'P-001',
  name: 'Ethan Cruz',
  dateOfBirth: 'March 15, 2020',
  age: 5,
  gender: 'Male',
  bloodType: 'O+',
  weight: 18.5,
  height: 108,
  allergies: ['Peanuts'],
  conditions: [],
  medications: []
})

const parentInfo = ref({
  name: 'Maria Cruz',
  relationship: 'Mother',
  phone: '+63 912 345 6789',
  email: 'maria.cruz@email.com',
  address: '123 Barangay Street, Manila, Philippines',
  emergencyContact: '+63 917 987 6543'
})

const vaccinationSummary = ref({
  completed: 8,
  pending: 2,
  total: 10
})

const downloadRecord = () => {
  alert('Downloading vaccination record... (Feature to be implemented)')
}
</script>

<!-- Styles moved to src/assets/styles/parent.css for consistency -->
}

.progress {
  border-radius: 10px;
}

.progress-bar {
<!-- Styles moved to src/assets/styles/parent.css for consistency -->
