import { createRouter, createWebHistory } from 'vue-router'
import { isAuthenticated, getRole } from '@/services/auth'

// Auth Views
import Login from '@/views/auth/Login.vue'
import LandingPage from '@/views/LandingPage.vue'

// Admin Views
import AdminDashboard from '@/views/admin/dashboard/Dashboard.vue'
import PatientRecords from '@/views/admin/patients/PatientRecords.vue'
import VaccineInventory from '@/views/admin/inventory/VaccineInventory.vue'
import InventoryOverview from '@/views/admin/inventory/InventoryOverview.vue'
import ReceivingReportPage from '@/views/admin/inventory/ReceivingReportPage.vue'
import SMSLogs from '@/views/admin/sms/SMSLogs.vue'
import SMSManagement from '@/views/admin/sms/SMSManagement.vue'
import Reports from '@/views/admin/reports/Reports.vue'
import UserAccounts from '@/views/admin/users/UserAccounts.vue'
import ActivityLogs from '@/views/admin/activity/ActivityLogs.vue'
import Profile from '@/views/admin/profile/Profile.vue'
import Settings from '@/views/admin/settings/Settings.vue'
import NotificationsInbox from '@/views/admin/notifications/NotificationsInbox.vue'
import AddNotifications from '@/views/admin/notifications/AddNotifications.vue'
import FAQManager from '@/views/admin/faq/FAQManager.vue'
import AdminChat from '@/views/admin/chat/AdminChat.vue'

// Health Worker Views
import HealthWorkerDashboard from '@/views/healthworker/Dashboard.vue'
import HealthWorkerPatients from '@/views/healthworker/PatientRecords.vue'
import AddPatient from '@/views/healthworker/AddPatient.vue'
import PatientDetail from '@/views/healthworker/PatientDetails.vue'
import VisitSummary from '@/views/healthworker/VisitSummary.vue'
import VaccineRecordDetails from '@/views/healthworker/VaccineRecordDetails.vue'
import AddPatientImmunizationRecord from '@/views/healthworker/AddPatientImmunizationRecord.vue'
import EditVaccinationRecord from '@/views/healthworker/EditVaccinationRecord.vue'
import VaccineStock from '@/views/healthworker/VaccineStock.vue'
import InventoryDetails from '@/views/healthworker/InventoryDetails.vue'

import VaccineDetail from '@/views/healthworker/VaccineDetail.vue'
import HealthWorkerMessages from '@/views/healthworker/Messages.vue'
import HealthWorkerNotifications from '@/views/healthworker/Notifications.vue'
import HealthWorkerMenu from '@/views/healthworker/Menu.vue'

// Parent Views
import ParentDashboard from '@/views/parent/ParentDashboard.vue'
import ChildInfo from '@/views/parent/ChildInfo.vue'
import VaccinationSchedule from '@/views/parent/VaccinationSchedule.vue'
// Neutral QR route that redirects to role-specific patient details
const PatientRoute = () => import('@/views/PatientRoute.vue')

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
  // Neutral patient route used by QR redirects
  {
    path: '/patient/:id',
    name: 'PatientRoute',
    component: PatientRoute,
    meta: {
      title: 'Patient - ImmunizeMe',
      requiresAuth: true
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
    path: '/admin/patients/add',
    name: 'AdminAddPatient',
    component: () => import('@/views/admin/patients/AddPatient.vue'),
    meta: {
      title: 'Add Patient - ImmunizeMe',
      requiresAuth: true,
      role: 'admin'
    }
  },
  {
    path: '/admin/patients/add-record',
    name: 'AddPatientRecord',
    component: () => import('@/views/admin/patients/AddPatientRecord.vue'),
    meta: {
      title: 'Add Patient Record - ImmunizeMe',
      requiresAuth: true,
      role: 'admin'
    }
  },
  {
    path: '/admin/patients/edit/:id',
    name: 'EditPatient',
    component: () => import('@/views/admin/patients/EditPatient.vue'),
    meta: {
      title: 'Edit Patient - ImmunizeMe',
      requiresAuth: true,
      role: 'admin'
    }
  },
  {
    path: '/admin/patients/view/:id',
    name: 'ViewPatient',
    component: () => import('@/views/admin/patients/ViewPatient.vue'),
    meta: {
      title: 'View Patient - ImmunizeMe',
      requiresAuth: true,
      role: 'admin'
    }
  },
  {
    path: '/admin/patients/:id/visits',
    name: 'PatientMedicalHistory',
    component: () => import('@/views/admin/patients/MedicalHistoryPage.vue'),
    meta: {
      title: 'Medical History - ImmunizeMe',
      requiresAuth: true,
      role: 'admin'
    }
  },
  // Backwards compatibility route (deprecated)
  {
    path: '/admin/patients/:id/visit-history',
    redirect: to => ({ name: 'PatientMedicalHistory', params: to.params })
  },
  {
    path: '/admin/patients/:patientId/visits/:visitId',
    name: 'VisitSummary',
    component: () => import('@/views/admin/patients/VisitSummaryPage.vue'),
    meta: {
      title: 'Visit Summary - ImmunizeMe',
      requiresAuth: true,
      role: 'admin'
    }
  },
  {
    path: '/admin/patients/:patientId/visits/:visitId/edit',
    name: 'EditVisitRecord',
    component: () => import('@/views/admin/patients/VisitEditorPage.vue'),
    meta: {
      title: 'Edit Visit Record - ImmunizeMe',
      requiresAuth: true,
      role: 'admin'
    }
  },
  {
    path: '/admin/patients/:id/vaccinations',
    name: 'PatientVaccinations',
    component: () => import('@/views/admin/patients/VaccinationEditorPage.vue'),
    meta: {
      title: 'Vaccinations - ImmunizeMe',
      requiresAuth: true,
      role: 'admin'
    }
  },
  {
    path: '/admin/patients/:patientId/vaccinations/:recordId/edit',
    name: 'EditVaccinationRecord',
    component: () => import('@/views/admin/patients/EditVaccinationRecord.vue'),
    meta: {
      title: 'Edit Vaccination Record - ImmunizeMe',
      requiresAuth: true,
      role: 'admin'
    }
  },
  {
    path: '/admin/patients/:patientId/vaccine/:vaccine/edit',
    name: 'EditVaccineRecords',
    component: () => import('@/views/admin/patients/EditVaccineRecords.vue'),
    meta: {
      title: 'Edit Vaccine Records - ImmunizeMe',
      requiresAuth: true,
      role: 'admin'
    }
  },
  {
    path: '/admin/patients/:patientId/vaccine-details',
    name: 'VaccineDetails',
    component: () => import('@/views/admin/patients/VaccineDetails.vue'),
    meta: {
      title: 'Vaccine Details - ImmunizeMe',
      requiresAuth: true,
      role: 'admin'
    }
  },
  {
    path: '/admin/vaccines',
    name: 'VaccineInventory',
    component: InventoryOverview,
    meta: {
      title: 'Vaccine Inventory - ImmunizeMe',
      requiresAuth: true,
      role: 'admin'
    }
  },
  {
    path: '/admin/inventory',
    name: 'InventoryOverview',
    component: InventoryOverview,
    meta: {
      title: 'Inventory Overview - ImmunizeMe',
      requiresAuth: true,
      role: 'admin'
    }
  },
  {
    path: '/admin/vaccines/add-stock',
    name: 'AddStock',
    component: () => import('@/views/admin/inventory/AddStock.vue'),
    meta: {
      title: 'Add Stock - ImmunizeMe',
      requiresAuth: true,
      role: 'admin'
    }
  },
  {
    path: '/admin/vaccines/edit-stock/:id',
    name: 'EditStock',
    component: () => import('@/views/admin/inventory/EditInventory.vue'),
    meta: {
      title: 'Edit Inventory - ImmunizeMe',
      requiresAuth: true,
      role: 'admin'
    }
  },
  {
    path: '/admin/vaccines/add-vaccine',
    name: 'AddVaccine',
    component: () => import('@/views/admin/inventory/AddVaccine.vue'),
    meta: {
      title: 'Add Vaccine Type - ImmunizeMe',
      requiresAuth: true,
      role: 'admin'
    }
  },
  {
    path: '/admin/vaccines/edit-vaccine-type',
    name: 'EditVaccineType',
    component: () => import('@/views/admin/inventory/EditVaccineType.vue'),
    meta: {
      title: 'Edit Vaccine Type - ImmunizeMe',
      requiresAuth: true,
      role: 'admin'
    }
  },
  {
    path: '/admin/vaccines/view/:id',
    name: 'ViewInventory',
    component: () => import('@/views/admin/inventory/ViewInventory.vue'),
    meta: {
      title: 'View Inventory - ImmunizeMe',
      requiresAuth: true,
      role: 'admin'
    }
  },
  {
    path: '/admin/vaccines/adjust/:id',
    name: 'AdjustStock',
    component: () => import('@/views/admin/inventory/AdjustStock.vue'),
    meta: {
      title: 'Adjust Stock - ImmunizeMe',
      requiresAuth: true,
      role: 'admin'
    }
  },
  {
    path: '/admin/vaccines/history/:id',
    name: 'InventoryHistory',
    component: () => import('@/views/admin/inventory/InventoryHistory.vue'),
    meta: {
      title: 'Transaction History - ImmunizeMe',
      requiresAuth: true,
      role: 'admin'
    }
  },
  {
    path: '/admin/vaccines/schedules/view/:id',
    name: 'ViewSchedule',
    component: () => import('@/views/admin/inventory/ViewSchedule.vue'),
    meta: {
      title: 'View Schedule - ImmunizeMe',
      requiresAuth: true,
      role: 'admin'
    }
  },
  {
    path: '/admin/vaccines/schedules/add',
    name: 'AddSchedule',
    component: () => import('@/views/admin/inventory/AddSchedule.vue'),
    meta: {
      title: 'Add Schedule - ImmunizeMe',
      requiresAuth: true,
      role: 'admin'
    }
  },
  {
    path: '/admin/vaccines/schedules/edit/:id',
    name: 'EditSchedule',
    component: () => import('@/views/admin/inventory/EditSchedule.vue'),
    meta: {
      title: 'Edit Schedule - ImmunizeMe',
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
    path: '/admin/sms-management',
    name: 'SMSManagement',
    component: SMSManagement,
    meta: {
      title: 'SMS Management - ImmunizeMe',
      requiresAuth: true,
      role: 'admin'
    }
  },
  {
    path: '/admin/reports',
    name: 'Reports',
    component: Reports,
    meta: {
      title: 'Monthly Immunization Report - ImmunizeMe',
      requiresAuth: true,
      role: 'admin'
    }
  },
  {
    path: '/admin/reports/receiving/new',
    name: 'ReceivingReportNew',
    component: ReceivingReportPage,
    meta: {
      title: 'New Receiving Report - ImmunizeMe',
      requiresAuth: true,
      role: 'admin'
    }
  },
  {
    path: '/admin/reports/receiving/:id',
    name: 'ReceivingReportView',
    component: ReceivingReportPage,
    meta: {
      title: 'Receiving Report - ImmunizeMe',
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
  {
    path: '/admin/users/add',
    name: 'AddUser',
    component: () => import('@/views/admin/users/AddUser.vue'),
    meta: {
      title: 'Add User - ImmunizeMe',
      requiresAuth: true,
      role: 'admin'
    }
  },
  {
    path: '/admin/users/edit/:id',
    name: 'EditUser',
    component: () => import('@/views/admin/users/EditUser.vue'),
    meta: {
      title: 'Edit User - ImmunizeMe',
      requiresAuth: true,
      role: 'admin'
    }
  },
  {
    path: '/admin/users/view/:id',
    name: 'ViewUser',
    component: () => import('@/views/admin/users/ViewUser.vue'),
    meta: {
      title: 'View User - ImmunizeMe',
      requiresAuth: true,
      role: 'admin'
    }
  },
  {
    path: '/admin/activity',
    name: 'ActivityLogs',
    component: ActivityLogs,
    meta: {
      title: 'Activity Logs - ImmunizeMe',
      requiresAuth: true,
      role: 'admin'
    }
  },
  // Backward-compatible route (legacy sidebar link)
  {
    path: '/admin/activity-logs',
    name: 'ActivityLogsLegacy',
    component: ActivityLogs,
    meta: {
      title: 'Activity Logs - ImmunizeMe',
      requiresAuth: true,
      role: 'admin'
    }
  },
  {
    path: '/admin/activity/:id',
    name: 'ActivityLogDetails',
    component: () => import('@/views/admin/activity/ActivityLogDetails.vue'),
    meta: {
      title: 'Activity Log Details - ImmunizeMe',
      requiresAuth: true,
      role: 'admin'
    }
  },
  // Backward-compatible details route
  {
    path: '/admin/activity-logs/:id',
    name: 'ActivityLogDetailsLegacy',
    component: () => import('@/views/admin/activity/ActivityLogDetails.vue'),
    meta: {
      title: 'Activity Log Details - ImmunizeMe',
      requiresAuth: true,
      role: 'admin'
    }
  },
  {
    path: '/admin/profile',
    name: 'Profile',
    component: Profile,
    meta: {
      title: 'Profile - ImmunizeMe',
      requiresAuth: true,
      role: 'admin'
    }
  },
  {
    path: '/admin/settings',
    name: 'Settings',
    component: Settings,
    meta: {
      title: 'Settings - ImmunizeMe',
      requiresAuth: true,
      role: 'admin'
    }
  },
  {
    path: '/admin/notifications-inbox',
    name: 'NotificationsInbox',
    component: NotificationsInbox,
    meta: {
      title: 'Notifications Inbox - ImmunizeMe',
      requiresAuth: true,
      role: 'admin'
    }
  },
  {
    path: '/admin/faqs',
    name: 'FAQManager',
    component: FAQManager,
    meta: {
      title: 'FAQ Manager - ImmunizeMe',
      requiresAuth: true,
      role: 'admin'
    }
  },
  {
    path: '/admin/chat',
    name: 'AdminChat',
    component: AdminChat,
    meta: {
      title: 'Admin Chat - ImmunizeMe',
      requiresAuth: true,
      role: 'admin'
    }
  },
  {
    path: '/admin/add-notifications',
    name: 'AddNotifications',
    component: AddNotifications,
    meta: {
      title: 'Create Notification - ImmunizeMe',
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
      title: 'Health Staff Dashboard - ImmunizeMe',
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
    path: '/healthworker/patients/add',
    name: 'HealthWorkerAddPatient',
    component: AddPatient,
    meta: {
      title: 'Add Patient - ImmunizeMe',
      requiresAuth: true,
      role: 'healthworker'
    }
  },
  {
    path: '/healthworker/patients/:id',
    name: 'PatientDetail',
    component: PatientDetail,
    meta: {
      title: 'Patient Details - ImmunizeMe',
      requiresAuth: true,
      role: 'healthworker'
    }
  },
  {
    path: '/healthworker/patients/:patientId/visit/:visitId',
    name: 'VisitSummary',
    component: VisitSummary,
    meta: {
      title: 'Visit Summary - ImmunizeMe',
      requiresAuth: true,
      role: 'healthworker'
    }
  },
  {
    path: '/healthworker/patients/:patientId/vaccine/:immunizationId',
    name: 'VaccineRecordDetails',
    component: VaccineRecordDetails,
    meta: {
      title: 'Vaccine Details - ImmunizeMe',
      requiresAuth: true,
      role: 'healthworker'
    }
  },
  {
    path: '/healthworker/patients/:patientId/add-immunization',
    name: 'AddPatientImmunizationRecord',
    component: AddPatientImmunizationRecord,
    meta: {
      title: 'Add Immunization Record - ImmunizeMe',
      requiresAuth: true,
      role: 'healthworker'
    }
  },
  {
    path: '/healthworker/patients/:patientId/immunizations/:recordId/edit',
    name: 'EditVaccinationRecord',
    component: EditVaccinationRecord,
    meta: {
      title: 'Edit Vaccination Record - ImmunizeMe',
      requiresAuth: true,
      role: 'healthworker'
    }
  },
  {
    path: '/healthworker/stock',
    name: 'HealthWorkerStock',
    component: VaccineStock,
    meta: {
      title: 'Vaccine Stock - ImmunizeMe',
      requiresAuth: true,
      role: 'healthworker'
    }
  },
  {
    path: '/healthworker/stock/:id',
    name: 'HealthWorkerStockDetails',
    component: InventoryDetails,
    meta: {
      title: 'Inventory Details - ImmunizeMe',
      requiresAuth: true,
      role: 'healthworker'
    }
  },
  {
    path: '/healthworker/inventory/:id',
    name: 'VaccineDetail',
    component: VaccineDetail,
    meta: {
      title: 'Vaccine Details - ImmunizeMe',
      requiresAuth: true,
      role: 'healthworker'
    }
  },
  {
    path: '/healthworker/messages',
    name: 'HealthWorkerMessages',
    component: HealthWorkerMessages,
    meta: {
      title: 'Messages - ImmunizeMe',
      requiresAuth: true,
      role: 'healthworker'
    }
  },
  {
    path: '/healthworker/notifications',
    name: 'HealthWorkerNotifications',
    component: HealthWorkerNotifications,
    meta: {
      title: 'Notifications - ImmunizeMe',
      requiresAuth: true,
      role: 'healthworker'
    }
  },
  {
    path: '/healthworker/menu',
    name: 'HealthWorkerMenu',
    component: HealthWorkerMenu,
    meta: {
      title: 'Menu - ImmunizeMe',
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
      path: '/faqs',
      name: 'PublicFAQs',
      component: () => import('@/views/PublicFAQs.vue'),
      meta: {
        title: 'FAQs - ImmunizeMe',
        requiresAuth: false
      }
    },
  {
    path: '/parent/child-info/:childId',
    name: 'ChildInfo',
    component: ChildInfo,
    meta: {
      title: 'My Child Info - ImmunizeMe',
      requiresAuth: true,
      role: 'parent'
    }
  },
  {
    path: '/parent/vaccination-schedule/:childId',
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

// Navigation guard for authentication and role
router.beforeEach((to, from, next) => {
  document.title = to.meta.title || 'ImmunizeMe'

  const requiresAuth = to.meta?.requiresAuth
  if (!requiresAuth) return next()

  if (!isAuthenticated()) {
    return next({ path: '/auth/login', query: { redirect: to.fullPath } })
  }

  const role = (getRole() || '').toLowerCase()
  const requiredRole = (to.meta?.role || '').toLowerCase()
  // Accept both legacy 'healthworker' and new 'health_staff' role keys
  const normalizedRole = role === 'health_staff' ? 'healthworker' : role
  const normalizedRequired = requiredRole === 'health_staff' ? 'healthworker' : requiredRole
  if (normalizedRequired && normalizedRole && normalizedRole !== normalizedRequired) {
    // Redirect to role-appropriate dashboard
    if (role === 'admin') return next('/admin/dashboard')
    if (role === 'healthworker' || role === 'health-worker' || role === 'health_staff') return next('/healthworker/dashboard')
    if (role === 'parent') return next('/parent/dashboard')
  }
  next()
})

export default router
