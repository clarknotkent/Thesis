<template>
  <div class="login-container">
    <div class="container-fluid vh-100">
      <div class="row h-100">
        <!-- Login Form Section -->
        <div class="col-lg-6 d-flex align-items-center justify-content-center">
          <div class="login-form-container">
            <div class="text-center mb-5">
              <h1 class="display-5 fw-bold text-primary mb-3">
                <i class="bi bi-shield-check me-3"></i>ImmunizeMe
              </h1>
              <p class="lead text-muted">Immunization Management System</p>
            </div>

            <div class="card shadow-lg border-0">
              <div class="card-body p-5">
                <form @submit.prevent="handleLogin">
                  <div class="mb-3">
                    <label for="email" class="form-label">Email Address</label>
                    <input
                      type="email"
                      class="form-control form-control-lg"
                      id="email"
                      v-model="form.email"
                      placeholder="Enter your email"
                      required
                    />
                  </div>

                  <div class="mb-3">
                    <label for="password" class="form-label">Password</label>
                    <input
                      type="password"
                      class="form-control form-control-lg"
                      id="password"
                      v-model="form.password"
                      placeholder="Enter your password"
                      required
                    />
                  </div>

                  <div class="mb-4">
                    <label for="userRole" class="form-label">Login as</label>
                    <select
                      class="form-select form-select-lg"
                      id="userRole"
                      v-model="form.role"
                      required
                    >
                      <option value="">Select your role</option>
                      <option value="admin">City Health Staff (Admin)</option>
                      <option value="health-worker">Health Worker</option>
                      <option value="parent">Parent/Guardian</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    class="btn btn-primary btn-lg w-100"
                    :disabled="loading"
                  >
                    <span v-if="loading">
                      <span class="spinner-border spinner-border-sm me-2" role="status"></span>
                      Signing in...
                    </span>
                    <span v-else>
                      <i class="bi bi-box-arrow-in-right me-2"></i>
                      Sign In
                    </span>
                  </button>
                </form>

                <!-- Error Alert -->
                <div v-if="error" class="alert alert-danger mt-3" role="alert">
                  <i class="bi bi-exclamation-triangle me-2"></i>
                  {{ error }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Branding/Info Section -->
        <div class="col-lg-6 d-none d-lg-flex align-items-center justify-content-center bg-primary">
          <div class="text-center text-white">
            <div class="mb-4">
              <i class="bi bi-heart-pulse display-1 mb-4"></i>
            </div>
            <h2 class="display-6 mb-4">Keep Your Community Healthy</h2>
            <p class="lead mb-0">
              Streamline immunization tracking, manage patient records, 
              and ensure comprehensive vaccination coverage for your community.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// Form data
const form = reactive({
  email: '',
  password: '',
  role: ''
})

// Component state
const loading = ref(false)
const error = ref('')

// Handle form submission
const handleLogin = async () => {
  loading.value = true
  error.value = ''

  try {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500))

    // Basic validation
    if (!form.email || !form.password || !form.role) {
      throw new Error('Please fill in all fields')
    }

    // For demo purposes, allow any email/password combination
    // In production, this would be replaced with actual authentication
    console.log('Login attempt:', form)

    // Route based on user role
    switch (form.role) {
      case 'admin':
        router.push('/admin/dashboard')
        break
      case 'health-worker':
        router.push('/healthworker/dashboard')
        break
      case 'parent':
        router.push('/parent/dashboard')
        break
      default:
        throw new Error('Invalid role selected')
    }

  } catch (err) {
    error.value = err.message || 'Login failed. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>


