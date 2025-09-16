<template>
  <div class="register-container">
    <div class="container-fluid vh-100">
      <div class="row h-100">
        <!-- Register Form Section -->
        <div class="col-lg-8 d-flex align-items-center justify-content-center">
          <div class="register-form-container w-100" style="max-width: 700px;">
            <div class="text-center mb-4">
              <h1 class="display-6 fw-bold text-primary mb-3">
                <i class="bi bi-person-plus me-3"></i>Create Account
              </h1>
              <p class="lead text-muted">Join the ImmunizeMe platform</p>
            </div>

            <div class="card shadow-lg border-0">
              <div class="card-body p-5">
                <!-- Error Alert -->
                <div v-if="error" class="alert alert-danger alert-dismissible fade show mb-4" role="alert">
                  <i class="bi bi-exclamation-triangle me-2"></i>
                  {{ error }}
                  <button type="button" class="btn-close" @click="clearError"></button>
                </div>

                <!-- Progress Steps -->
                <div class="mb-4">
                  <div class="progress mb-3" style="height: 6px;">
                    <div 
                      class="progress-bar bg-primary" 
                      :style="{ width: progressPercentage + '%' }"
                    ></div>
                  </div>
                  <div class="row text-center">
                    <div class="col-4">
                      <span :class="currentStep >= 1 ? 'text-primary fw-bold' : 'text-muted'">
                        <i class="bi bi-person-circle"></i> Basic Info
                      </span>
                    </div>
                    <div class="col-4">
                      <span :class="currentStep >= 2 ? 'text-primary fw-bold' : 'text-muted'">
                        <i class="bi bi-shield-lock"></i> Account
                      </span>
                    </div>
                    <div class="col-4">
                      <span :class="currentStep >= 3 ? 'text-primary fw-bold' : 'text-muted'">
                        <i class="bi bi-check-circle"></i> Complete
                      </span>
                    </div>
                  </div>
                </div>

                <form @submit.prevent="handleRegister">
                  <!-- Step 1: Basic Information -->
                  <div v-show="currentStep === 1">
                    <h5 class="mb-4">Basic Information</h5>
                    
                    <div class="row">
                      <div class="col-md-6 mb-3">
                        <label for="firstName" class="form-label">First Name *</label>
                        <input
                          type="text"
                          class="form-control"
                          :class="{ 'is-invalid': formErrors.firstName }"
                          id="firstName"
                          v-model="form.firstName"
                          placeholder="Enter first name"
                          :disabled="isLoading"
                          required
                        />
                        <div v-if="formErrors.firstName" class="invalid-feedback">
                          {{ formErrors.firstName }}
                        </div>
                      </div>

                      <div class="col-md-6 mb-3">
                        <label for="lastName" class="form-label">Last Name *</label>
                        <input
                          type="text"
                          class="form-control"
                          :class="{ 'is-invalid': formErrors.lastName }"
                          id="lastName"
                          v-model="form.lastName"
                          placeholder="Enter last name"
                          :disabled="isLoading"
                          required
                        />
                        <div v-if="formErrors.lastName" class="invalid-feedback">
                          {{ formErrors.lastName }}
                        </div>
                      </div>
                    </div>

                    <div class="mb-3">
                      <label for="email" class="form-label">Email Address *</label>
                      <input
                        type="email"
                        class="form-control"
                        :class="{ 'is-invalid': formErrors.email }"
                        id="email"
                        v-model="form.email"
                        placeholder="Enter email address"
                        :disabled="isLoading"
                        required
                      />
                      <div v-if="formErrors.email" class="invalid-feedback">
                        {{ formErrors.email }}
                      </div>
                    </div>

                    <div class="mb-3">
                      <label for="phone" class="form-label">Phone Number *</label>
                      <input
                        type="tel"
                        class="form-control"
                        :class="{ 'is-invalid': formErrors.phone }"
                        id="phone"
                        v-model="form.phone"
                        placeholder="Enter phone number"
                        :disabled="isLoading"
                        required
                      />
                      <div v-if="formErrors.phone" class="invalid-feedback">
                        {{ formErrors.phone }}
                      </div>
                    </div>

                    <div class="mb-4">
                      <label for="role" class="form-label">Account Type *</label>
                      <select
                        class="form-select"
                        :class="{ 'is-invalid': formErrors.role }"
                        id="role"
                        v-model="form.role"
                        :disabled="isLoading"
                        required
                      >
                        <option value="">Select account type</option>
                        <option value="parent">Parent/Guardian</option>
                        <option value="health_worker">Health Worker</option>
                      </select>
                      <div class="form-text">
                        <i class="bi bi-info-circle me-1"></i>
                        <span v-if="form.role === 'parent'">
                          Manage your children's immunization records and appointments
                        </span>
                        <span v-else-if="form.role === 'health_worker'">
                          Administer vaccines and manage patient records (requires approval)
                        </span>
                        <span v-else>
                          Choose the account type that best describes your role
                        </span>
                      </div>
                      <div v-if="formErrors.role" class="invalid-feedback">
                        {{ formErrors.role }}
                      </div>
                    </div>
                  </div>

                  <!-- Step 2: Account Security -->
                  <div v-show="currentStep === 2">
                    <h5 class="mb-4">Account Security</h5>
                    
                    <div class="mb-3">
                      <label for="username" class="form-label">Username *</label>
                      <input
                        type="text"
                        class="form-control"
                        :class="{ 'is-invalid': formErrors.username }"
                        id="username"
                        v-model="form.username"
                        placeholder="Choose a username"
                        :disabled="isLoading"
                        required
                      />
                      <div class="form-text">
                        Username must be 3-20 characters long and contain only letters, numbers, and underscores
                      </div>
                      <div v-if="formErrors.username" class="invalid-feedback">
                        {{ formErrors.username }}
                      </div>
                    </div>

                    <div class="mb-3">
                      <label for="password" class="form-label">Password *</label>
                      <div class="input-group">
                        <input
                          :type="showPassword ? 'text' : 'password'"
                          class="form-control"
                          :class="{ 'is-invalid': formErrors.password }"
                          id="password"
                          v-model="form.password"
                          placeholder="Create a strong password"
                          :disabled="isLoading"
                          required
                        />
                        <button
                          type="button"
                          class="btn btn-outline-secondary"
                          @click="showPassword = !showPassword"
                          :disabled="isLoading"
                        >
                          <i :class="showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
                        </button>
                      </div>
                      <div class="form-text">
                        Password must be at least 8 characters with uppercase, lowercase, number and special character
                      </div>
                      <div v-if="formErrors.password" class="invalid-feedback">
                        {{ formErrors.password }}
                      </div>
                    </div>

                    <div class="mb-3">
                      <label for="confirmPassword" class="form-label">Confirm Password *</label>
                      <input
                        :type="showConfirmPassword ? 'text' : 'password'"
                        class="form-control"
                        :class="{ 'is-invalid': formErrors.confirmPassword }"
                        id="confirmPassword"
                        v-model="form.confirmPassword"
                        placeholder="Confirm your password"
                        :disabled="isLoading"
                        required
                      />
                      <div v-if="formErrors.confirmPassword" class="invalid-feedback">
                        {{ formErrors.confirmPassword }}
                      </div>
                    </div>

                    <!-- Additional fields for health workers -->
                    <div v-if="form.role === 'health_worker'" class="border rounded p-3 bg-light">
                      <h6 class="text-primary mb-3">
                        <i class="bi bi-hospital me-2"></i>Professional Information
                      </h6>
                      
                      <div class="mb-3">
                        <label for="licenseNumber" class="form-label">License Number *</label>
                        <input
                          type="text"
                          class="form-control"
                          :class="{ 'is-invalid': formErrors.licenseNumber }"
                          id="licenseNumber"
                          v-model="form.licenseNumber"
                          placeholder="Enter professional license number"
                          :disabled="isLoading"
                          :required="form.role === 'health_worker'"
                        />
                        <div v-if="formErrors.licenseNumber" class="invalid-feedback">
                          {{ formErrors.licenseNumber }}
                        </div>
                      </div>

                      <div class="mb-3">
                        <label for="healthFacility" class="form-label">Health Facility *</label>
                        <input
                          type="text"
                          class="form-control"
                          :class="{ 'is-invalid': formErrors.healthFacility }"
                          id="healthFacility"
                          v-model="form.healthFacility"
                          placeholder="Enter health facility/clinic name"
                          :disabled="isLoading"
                          :required="form.role === 'health_worker'"
                        />
                        <div v-if="formErrors.healthFacility" class="invalid-feedback">
                          {{ formErrors.healthFacility }}
                        </div>
                      </div>

                      <div class="alert alert-info">
                        <i class="bi bi-info-circle me-2"></i>
                        Health worker accounts require admin approval before activation.
                      </div>
                    </div>
                  </div>

                  <!-- Step 3: Terms and Conditions -->
                  <div v-show="currentStep === 3">
                    <h5 class="mb-4">Terms and Conditions</h5>
                    
                    <div class="mb-4">
                      <div class="form-check">
                        <input 
                          class="form-check-input" 
                          type="checkbox" 
                          id="agreeTerms"
                          v-model="form.agreeTerms"
                          :class="{ 'is-invalid': formErrors.agreeTerms }"
                          :disabled="isLoading"
                          required
                        >
                        <label class="form-check-label" for="agreeTerms">
                          I agree to the <a href="#" class="text-primary">Terms of Service</a> and 
                          <a href="#" class="text-primary">Privacy Policy</a> *
                        </label>
                        <div v-if="formErrors.agreeTerms" class="invalid-feedback">
                          {{ formErrors.agreeTerms }}
                        </div>
                      </div>
                    </div>

                    <div class="mb-4">
                      <div class="form-check">
                        <input 
                          class="form-check-input" 
                          type="checkbox" 
                          id="agreeDataProcessing"
                          v-model="form.agreeDataProcessing"
                          :disabled="isLoading"
                        >
                        <label class="form-check-label" for="agreeDataProcessing">
                          I consent to the processing of my health data for immunization management purposes
                        </label>
                      </div>
                    </div>

                    <div class="mb-4">
                      <div class="form-check">
                        <input 
                          class="form-check-input" 
                          type="checkbox" 
                          id="agreeNotifications"
                          v-model="form.agreeNotifications"
                          :disabled="isLoading"
                        >
                        <label class="form-check-label" for="agreeNotifications">
                          I want to receive appointment reminders and health notifications
                        </label>
                      </div>
                    </div>
                  </div>

                  <!-- Navigation Buttons -->
                  <div class="d-flex justify-content-between mt-4">
                    <button
                      type="button"
                      class="btn btn-outline-secondary"
                      v-if="currentStep > 1"
                      @click="previousStep"
                      :disabled="isLoading"
                    >
                      <i class="bi bi-arrow-left me-2"></i>Previous
                    </button>
                    
                    <div class="ms-auto">
                      <button
                        type="button"
                        class="btn btn-primary"
                        v-if="currentStep < 3"
                        @click="nextStep"
                        :disabled="isLoading"
                      >
                        Next<i class="bi bi-arrow-right ms-2"></i>
                      </button>
                      
                      <button
                        type="submit"
                        class="btn btn-success"
                        v-if="currentStep === 3"
                        :disabled="isLoading || !form.agreeTerms"
                      >
                        <span v-if="isLoading">
                          <span class="spinner-border spinner-border-sm me-2" role="status"></span>
                          Creating Account...
                        </span>
                        <span v-else>
                          <i class="bi bi-check-circle me-2"></i>
                          Create Account
                        </span>
                      </button>
                    </div>
                  </div>
                </form>

                <div class="text-center mt-4">
                  <p class="text-muted mb-0">
                    Already have an account? 
                    <router-link to="/auth/login" class="text-primary text-decoration-none">
                      Sign in here
                    </router-link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Side Information -->
        <div class="col-lg-4 bg-success d-none d-lg-flex align-items-center justify-content-center text-white">
          <div class="text-center p-4">
            <i class="bi bi-people display-1 mb-4"></i>
            <h3 class="mb-4">Join Our Community</h3>
            <p class="lead mb-4">
              Connect with healthcare providers and keep your family's immunization records up to date.
            </p>
            
            <div class="mt-5">
              <div class="mb-4">
                <i class="bi bi-shield-check display-6 mb-2"></i>
                <h6>Secure & Private</h6>
                <p class="small">Your data is protected with industry-standard security</p>
              </div>
              <div class="mb-4">
                <i class="bi bi-clock-history display-6 mb-2"></i>
                <h6>Never Miss a Shot</h6>
                <p class="small">Automated reminders keep you on schedule</p>
              </div>
              <div class="mb-4">
                <i class="bi bi-file-medical display-6 mb-2"></i>
                <h6>Digital Records</h6>
                <p class="small">Access immunization records anytime, anywhere</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { useRouter } from 'vue-router'

export default {
  name: 'Register',
  setup() {
    const { register, isLoading, error, clearError } = useAuth()
    const router = useRouter()

    // Form state
    const currentStep = ref(1)
    const showPassword = ref(false)
    const showConfirmPassword = ref(false)

    // Form data
    const form = ref({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      username: '',
      password: '',
      confirmPassword: '',
      role: '',
      licenseNumber: '',
      healthFacility: '',
      agreeTerms: false,
      agreeDataProcessing: false,
      agreeNotifications: false
    })

    // Form validation errors
    const formErrors = ref({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      username: '',
      password: '',
      confirmPassword: '',
      role: '',
      licenseNumber: '',
      healthFacility: '',
      agreeTerms: ''
    })

    // Computed
    const progressPercentage = computed(() => {
      return (currentStep.value / 3) * 100
    })

    // Validation functions
    const validateStep1 = () => {
      formErrors.value = {
        ...formErrors.value,
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        role: ''
      }

      let isValid = true

      if (!form.value.firstName.trim()) {
        formErrors.value.firstName = 'First name is required'
        isValid = false
      }

      if (!form.value.lastName.trim()) {
        formErrors.value.lastName = 'Last name is required'
        isValid = false
      }

      if (!form.value.email.trim()) {
        formErrors.value.email = 'Email is required'
        isValid = false
      } else if (!/\S+@\S+\.\S+/.test(form.value.email)) {
        formErrors.value.email = 'Please enter a valid email address'
        isValid = false
      }

      if (!form.value.phone.trim()) {
        formErrors.value.phone = 'Phone number is required'
        isValid = false
      } else if (!/^[\d\s\-\+\(\)]+$/.test(form.value.phone)) {
        formErrors.value.phone = 'Please enter a valid phone number'
        isValid = false
      }

      if (!form.value.role) {
        formErrors.value.role = 'Please select an account type'
        isValid = false
      }

      return isValid
    }

    const validateStep2 = () => {
      formErrors.value = {
        ...formErrors.value,
        username: '',
        password: '',
        confirmPassword: '',
        licenseNumber: '',
        healthFacility: ''
      }

      let isValid = true

      if (!form.value.username.trim()) {
        formErrors.value.username = 'Username is required'
        isValid = false
      } else if (form.value.username.length < 3 || form.value.username.length > 20) {
        formErrors.value.username = 'Username must be 3-20 characters long'
        isValid = false
      } else if (!/^[a-zA-Z0-9_]+$/.test(form.value.username)) {
        formErrors.value.username = 'Username can only contain letters, numbers, and underscores'
        isValid = false
      }

      if (!form.value.password) {
        formErrors.value.password = 'Password is required'
        isValid = false
      } else if (form.value.password.length < 8) {
        formErrors.value.password = 'Password must be at least 8 characters long'
        isValid = false
      } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(form.value.password)) {
        formErrors.value.password = 'Password must contain uppercase, lowercase, number and special character'
        isValid = false
      }

      if (!form.value.confirmPassword) {
        formErrors.value.confirmPassword = 'Please confirm your password'
        isValid = false
      } else if (form.value.password !== form.value.confirmPassword) {
        formErrors.value.confirmPassword = 'Passwords do not match'
        isValid = false
      }

      // Health worker specific validation
      if (form.value.role === 'health_worker') {
        if (!form.value.licenseNumber.trim()) {
          formErrors.value.licenseNumber = 'License number is required for health workers'
          isValid = false
        }

        if (!form.value.healthFacility.trim()) {
          formErrors.value.healthFacility = 'Health facility is required for health workers'
          isValid = false
        }
      }

      return isValid
    }

    const validateStep3 = () => {
      formErrors.value = {
        ...formErrors.value,
        agreeTerms: ''
      }

      if (!form.value.agreeTerms) {
        formErrors.value.agreeTerms = 'You must agree to the terms and conditions'
        return false
      }

      return true
    }

    // Navigation methods
    const nextStep = () => {
      let isValid = false

      switch (currentStep.value) {
        case 1:
          isValid = validateStep1()
          break
        case 2:
          isValid = validateStep2()
          break
      }

      if (isValid && currentStep.value < 3) {
        currentStep.value++
      }
    }

    const previousStep = () => {
      if (currentStep.value > 1) {
        currentStep.value--
      }
    }

    // Registration handler
    const handleRegister = async () => {
      if (!validateStep1() || !validateStep2() || !validateStep3()) {
        return
      }

      try {
        const registrationData = {
          firstName: form.value.firstName.trim(),
          lastName: form.value.lastName.trim(),
          email: form.value.email.trim().toLowerCase(),
          phone: form.value.phone.trim(),
          username: form.value.username.trim(),
          password: form.value.password,
          role: form.value.role,
          agreeDataProcessing: form.value.agreeDataProcessing,
          agreeNotifications: form.value.agreeNotifications
        }

        // Add health worker specific data
        if (form.value.role === 'health_worker') {
          registrationData.licenseNumber = form.value.licenseNumber.trim()
          registrationData.healthFacility = form.value.healthFacility.trim()
        }

        const result = await register(registrationData)

        if (result.success) {
          // Redirect to login with success message
          router.push({
            name: 'Login',
            query: { registered: 'true' }
          })
        }
      } catch (err) {
        console.error('Registration error:', err)
        // Error is handled by the auth store
      }
    }

    return {
      // Form state
      currentStep,
      form,
      formErrors,
      showPassword,
      showConfirmPassword,
      
      // Auth state
      isLoading,
      error,
      
      // Computed
      progressPercentage,
      
      // Methods
      nextStep,
      previousStep,
      handleRegister,
      clearError
    }
  }
}
</script>

<style scoped>
.register-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
}

.register-form-container {
  padding: 2rem;
}

.card {
  border-radius: 1rem;
  box-shadow: 0 20px 40px rgba(0,0,0,0.1);
}

.progress {
  border-radius: 10px;
}

.btn-primary {
  background: linear-gradient(45deg, #007bff, #0056b3);
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-success {
  background: linear-gradient(45deg, #28a745, #20c997);
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-primary:hover,
.btn-success:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0,0,0,0.2);
}

.bg-success {
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%) !important;
}

@media (max-width: 768px) {
  .register-form-container {
    padding: 1rem;
  }
  
  .card-body {
    padding: 2rem !important;
  }
}
</style>