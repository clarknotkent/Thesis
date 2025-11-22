<template>
  <div class="login-container">
    <div class="container-fluid vh-100">
      <div class="row h-100">
        <!-- Login Form Section -->
        <div class="col-lg-6 d-flex align-items-center justify-content-center">
          <div class="login-form-container">
            <div class="text-center mb-5">
              <h1 class="display-5 fw-bold text-primary mb-3">
                <i class="bi bi-shield-check me-3" />ImmunizeMe
              </h1>
              <p class="lead text-muted">
                Immunization Management System
              </p>
            </div>

            <div class="card shadow-lg border-0">
              <div class="card-body p-5">
                <form @submit.prevent="handleLogin">
                  <div class="mb-3">
                    <label
                      for="identifier"
                      class="form-label"
                    >Email / Username / Phone</label>
                    <input
                      id="identifier"
                      v-model="form.identifier"
                      type="text"
                      class="form-control form-control-lg"
                      placeholder="Enter email, username, or phone"
                      required
                    >
                  </div>

                  <div class="mb-3">
                    <label
                      for="password"
                      class="form-label"
                    >Password</label>
                    <div class="position-relative">
                      <input
                        id="password"
                        v-model="form.password"
                        :type="showPassword ? 'text' : 'password'"
                        class="form-control form-control-lg pe-5"
                        placeholder="Enter your password"
                        required
                      >
                      <button
                        type="button"
                        class="btn btn-link position-absolute end-0 top-50 translate-middle-y text-muted"
                        style="border: none; background: transparent; padding-right: 10px;"
                        @click="showPassword = !showPassword"
                      >
                        <i :class="showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'" />
                      </button>
                    </div>
                  </div>

                  <div class="text-end mb-4">
                    <router-link
                      to="/forgot-password"
                      class="text-primary text-decoration-none small"
                    >
                      <i class="bi bi-key me-1" />Forgot Password?
                    </router-link>
                  </div>

                  <button
                    type="submit"
                    class="btn btn-primary btn-lg w-100"
                    :disabled="loading"
                  >
                    <span v-if="loading">
                      <span
                        class="spinner-border spinner-border-sm me-2"
                        role="status"
                      />
                      Signing in...
                    </span>
                    <span v-else>
                      <i class="bi bi-box-arrow-in-right me-2" />
                      Sign In
                    </span>
                  </button>
                </form>

                <!-- Redirect Info Alert -->
                <div
                  v-if="redirectPath && !error"
                  class="alert alert-info mt-3"
                  role="alert"
                >
                  <i class="bi bi-info-circle me-2" />
                  You will be redirected to the requested page after login.
                </div>

                <!-- Error Alert -->
                <div
                  v-if="error"
                  class="alert alert-danger mt-3"
                  role="alert"
                >
                  <i class="bi bi-exclamation-triangle me-2" />
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
              <i class="bi bi-heart-pulse display-1 mb-4" />
            </div>
            <h2 class="display-6 mb-4">
              Keep Your Community Healthy
            </h2>
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
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { login as loginApi } from '@/services/auth'

const router = useRouter()
const route = useRoute()

// Form data
const form = reactive({
  identifier: '',
  password: ''
})

// Component state
const loading = ref(false)
const error = ref('')
const showPassword = ref(false)
const redirectPath = ref('')

// Check for redirect parameter or sessionStorage on mount
onMounted(() => {
  // Priority: URL query param > sessionStorage
  const queryRedirect = route.query.redirect
  const storedRedirect = sessionStorage.getItem('postLoginRedirect')
  
  console.log('🔍 [Login] Checking for redirect on mount:', {
    queryRedirect,
    storedRedirect,
    currentRoute: route.fullPath
  })
  
  if (queryRedirect) {
    redirectPath.value = queryRedirect
    // Store in sessionStorage for persistence during login
    sessionStorage.setItem('postLoginRedirect', queryRedirect)
    console.log('📍 [Login] Using query redirect, stored in sessionStorage:', queryRedirect)
  } else if (storedRedirect) {
    redirectPath.value = storedRedirect
    console.log('📍 [Login] Using sessionStorage redirect:', storedRedirect)
  }
  
  if (redirectPath.value) {
    console.log('✅ [Login] Will redirect to after login:', redirectPath.value)
  } else {
    console.log('ℹ️ [Login] No redirect path found, will use default role-based routing')
  }
})

// Handle form submission
const handleLogin = async () => {
  loading.value = true
  error.value = ''

  try {
    if (!form.identifier || !form.password) {
      throw new Error('Please fill in all fields')
    }

    // Call backend login; identifier can be phone/email/username
    const { user, token } = await loginApi({ identifier: form.identifier, password: form.password })

    // Use auth composable to store auth data
    const { login } = useAuth()
    login(token, user.role, user)

    // Check if there's a redirect path (from QR scan or other source)
    const targetPath = redirectPath.value || sessionStorage.getItem('postLoginRedirect')
    
    console.log('🎯 [Login] Login successful, checking redirect:', {
      redirectPathValue: redirectPath.value,
      sessionStorageValue: sessionStorage.getItem('postLoginRedirect'),
      targetPath,
      userRole: user.role
    })
    
    if (targetPath) {
      console.log('✅ [Login] Redirecting to intended destination:', targetPath)
      // Clear the stored redirect
      sessionStorage.removeItem('postLoginRedirect')
      router.push(targetPath)
      return
    }

    console.log('ℹ️ [Login] No redirect found, using role-based routing for:', user.role)
    // Navigate based on user role from backend (default behavior)
    const role = (user.role || '').toLowerCase()
    if (role === 'admin' || role === 'superadmin' || role === 'super_admin') {
      router.push('/admin/dashboard')
    } else if (role === 'healthworker' || role === 'health-worker' || role === 'healthstaff') {
      router.push('/healthworker/dashboard')
    } else if (role === 'guardian' || role === 'parent') {
      router.push('/parent/home')
    } else {
      throw new Error('Unknown user role. Please contact support.')
    }
  } catch (err) {
    error.value = err?.response?.data?.message || err.message || 'Login failed. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>


