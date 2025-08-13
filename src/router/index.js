import { createRouter, createWebHistory } from 'vue-router'

// Auth Views
import Login from '@/views/auth/Login.vue'

// Admin Views
import AdminDashboard from '@/views/admin/Dashboard.vue'
import PatientRecords from '@/views/admin/PatientRecords.vue'
import VaccineInventory from '@/views/admin/VaccineInventory.vue'
import SMSLogs from '@/views/admin/SMSLogs.vue'
import Reports from '@/views/admin/Reports.vue'
import UserAccounts from '@/views/admin/UserAccounts.vue'

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
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
  // Catch-all route for 404
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    redirect: '/login'
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
