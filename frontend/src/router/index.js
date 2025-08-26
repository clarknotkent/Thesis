import { createRouter, createWebHistory } from 'vue-router'

// Auth Views
import Login from '@/views/auth/Login.vue'
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
    meta: {
      title: 'Login - ImmunizeMe',
      requiresAuth: false
    }
  },
  {
    path: '/admin/dashboard',
    name: 'AdminDashboard',
    component: AdminDashboard,
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

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation guard for authentication (basic setup)
router.beforeEach((to, from, next) => {
  // Set page title
  document.title = to.meta.title || 'ImmunizeMe'
  
  // For now, just allow all routes - we'll add proper auth later
  next()
})

export default router
