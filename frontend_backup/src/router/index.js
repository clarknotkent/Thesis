import { createRouter, createWebHistory } from 'vue-router'
import { setRouter } from '@/services/api'
import { 
  authGuard, 
  guestGuard, 
  adminGuard, 
  healthWorkerGuard, 
  parentGuard 
} from './guards'

// Auth Views
import Login from '@/views/auth/Login.vue'
import Register from '@/views/auth/Register.vue'
import LandingPage from '@/views/LandingPage.vue'

// Admin Views
import AdminDashboard from '@/views/admin/Dashboard.vue'
import PatientRecords from '@/views/admin/PatientRecords.vue'
import VaccineInventory from '@/views/admin/VaccineInventory.vue'
import SMSLogs from '@/views/admin/SMSLogs.vue'
import Reports from '@/views/admin/Reports.vue'
import UserAccounts from '@/views/admin/UserAccounts.vue'

// Health Worker Views
import HealthWorkerDashboard from '@/views/healthworker/Dashboard.vue'
import HealthWorkerPatients from '@/views/healthworker/PatientRecords.vue'
import VaccineInventoryReadOnly from '@/views/healthworker/VaccineInventoryReadOnly.vue'

// Parent Views
import ParentDashboard from '@/views/parent/ParentDashboard.vue'
import ChildInfo from '@/views/parent/ChildInfo.vue'
import VaccinationSchedule from '@/views/parent/VaccinationSchedule.vue'

const routes = [
  {
    path: '/',
    name: 'LandingPage',
    component: LandingPage,
    meta: {
      title: 'Vaccine App - Landing',
      requiresAuth: false
    }
  },
  {
    path: '/auth/login',
    name: 'Login',
    component: Login,
    beforeEnter: guestGuard,
    meta: {
      title: 'Login - ImmunizeMe',
      requiresAuth: false
    }
  },
  // Registration disabled - users created by admin only
  // {
  //   path: '/auth/register',
  //   name: 'Register',
  //   component: Register,
  //   beforeEnter: guestGuard,
  //   meta: {
  //     title: 'Register - ImmunizeMe',
  //     requiresAuth: false
  //   }
  // },
  {
    path: '/admin/dashboard',
    name: 'AdminDashboard',
    component: AdminDashboard,
    beforeEnter: adminGuard,
    meta: { 
      title: 'Admin Dashboard - ImmunizeMe',
      requiresAuth: true,
      role: 'admin'
    }
  },
  {
    path: '/admin/patients',
    name: 'PatientRecords',
    component: PatientRecords,
    beforeEnter: adminGuard,
    meta: {
      title: 'Patient Records - ImmunizeMe',
      requiresAuth: true,
      role: 'admin'
    }
  },
  {
    path: '/admin/vaccines',
    name: 'VaccineInventory',
    component: VaccineInventory,
    beforeEnter: adminGuard,
    meta: {
      title: 'Vaccine Inventory - ImmunizeMe',
      requiresAuth: true,
      role: 'admin'
    }
  },
  {
    path: '/admin/sms',
    name: 'SMSLogs',
    component: SMSLogs,
    meta: {
      title: 'SMS Logs - ImmunizeMe',
      requiresAuth: true,
      role: 'admin'
    }
  },
  {
    path: '/admin/reports',
    name: 'Reports',
    component: Reports,
    meta: {
      title: 'Reports - ImmunizeMe',
      requiresAuth: true,
      role: 'admin'
    }
  },
  {
    path: '/admin/users',
    name: 'UserAccounts',
    component: UserAccounts,
    meta: {
      title: 'User Accounts - ImmunizeMe',
      requiresAuth: true,
      role: 'admin'
    }
  },
  // Health Worker Routes
  {
    path: '/healthworker/dashboard',
    name: 'HealthWorkerDashboard',
    component: HealthWorkerDashboard,
    meta: {
      title: 'Health Worker Dashboard - ImmunizeMe',
      requiresAuth: true,
      role: 'healthworker'
    }
  },
  {
    path: '/healthworker/patients',
    name: 'HealthWorkerPatients',
    component: HealthWorkerPatients,
    meta: {
      title: 'Patient Records - ImmunizeMe',
      requiresAuth: true,
      role: 'healthworker'
    }
  },
  {
    // VaccineAdministration route removed (view deleted)
  },
  {
    path: '/healthworker/inventory',
    name: 'VaccineInventoryReadOnly',
    component: VaccineInventoryReadOnly,
    meta: {
      title: 'Vaccine Inventory - ImmunizeMe',
      requiresAuth: true,
      role: 'healthworker'
    }
  },
  // Parent Routes
  {
    path: '/parent/dashboard',
    name: 'ParentDashboard',
    component: ParentDashboard,
    meta: {
      title: 'Parent Dashboard - ImmunizeMe',
      requiresAuth: true,
      role: 'parent'
    }
  },
  {
    path: '/parent/child-info',
    name: 'ChildInfo',
    component: ChildInfo,
    meta: {
      title: 'My Child Info - ImmunizeMe',
      requiresAuth: true,
      role: 'parent'
    }
  },
  {
    path: '/parent/vaccination-schedule',
    name: 'VaccinationSchedule',
    component: VaccinationSchedule,
    meta: {
      title: 'Vaccination Schedule - ImmunizeMe',
      requiresAuth: true,
      role: 'parent'
    }
  },
  // Catch-all route for 404
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    redirect: '/auth/login'
  }
]

// Create router instance
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// Set router instance for API interceptors
setRouter(router)

// Global navigation guard for authentication
router.beforeEach((to, from, next) => {
  // Set page title
  document.title = to.meta.title || 'ImmunizeMe'
  
  // Check if route requires authentication
  if (to.meta.requiresAuth !== false) {
    // Route requires auth, use authGuard
    authGuard(to, from, next)
  } else {
    // Route doesn't require auth
    if (to.name === 'Login' || to.name === 'Register') {
      // Use guest guard for auth pages
      guestGuard(to, from, next)
    } else {
      next()
    }
  }
})

// Global after navigation hook
router.afterEach((to, from) => {
  // Track navigation for analytics if needed
  console.log(`Navigated from ${from.name} to ${to.name}`)
})

export default router
