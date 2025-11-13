import { createRouter, createWebHistory } from 'vue-router'
import { isAuthenticated, getRole } from '@/services/auth'
import api from '@/services/api'
import NotFound from '@/views/NotFound.vue'

// Auth Views
import Login from '@/views/auth/Login.vue'
import LandingPage from '@/views/LandingPage.vue'

// Admin Views
import AdminDashboard from '@/views/admin/dashboard/Dashboard.vue'
import PatientRecords from '@/views/admin/patients/PatientRecords.vue'
import InventoryOverview from '@/views/admin/inventory/InventoryOverview.vue'
import ReceivingReportPage from '@/views/admin/inventory/ReceivingReportPage.vue'
import SMSManagement from '@/views/admin/sms/SMSManagement.vue'
import Reports from '@/views/admin/reports/Reports.vue'
import UserAccounts from '@/views/admin/users/UserAccounts.vue'
import ViewUser from '@/views/admin/users/ViewUser.vue'
import ActivityLogs from '@/views/admin/activity/ActivityLogs.vue'
import Profile from '@/views/admin/profile/Profile.vue'
import Settings from '@/views/admin/settings/Settings.vue'
import NotificationsInbox from '@/views/admin/notifications/NotificationsInbox.vue'
import AddNotifications from '@/views/admin/notifications/AddNotifications.vue'
import FAQManager from '@/views/admin/faq/FAQManager.vue'
import AdminChat from '@/views/admin/chat/AdminChat.vue'

// Health Worker Views
import HealthWorkerDashboard from '@/views/healthworker/dashboard/Dashboard.vue'
import HealthWorkerPatients from '@/views/healthworker/patients/PatientRecords.vue'
import AddPatient from '@/views/healthworker/patients/AddPatient.vue'
import PatientDetail from '@/views/healthworker/PatientDetails.vue'
import VisitSummary from '@/views/healthworker/patients/VisitSummary.vue'
import EditVisit from '@/views/healthworker/patients/EditVisit.vue'
import VaccineRecordDetails from '@/views/healthworker/patients/VaccineRecordDetails.vue'
import AddPatientImmunizationRecord from '@/views/healthworker/patients/AddPatientImmunizationRecord.vue'
import EditVaccinationRecord from '@/views/healthworker/patients/EditVaccinationRecord.vue'
import VaccineStock from '@/views/healthworker/inventory/VaccineStock.vue'
import InventoryDetails from '@/views/healthworker/inventory/InventoryDetails.vue'

import VaccineDetail from '@/views/healthworker/inventory/VaccineDetail.vue'
import HealthWorkerMessages from '@/views/healthworker/messages/Messages.vue'
import HealthWorkerNotifications from '@/views/healthworker/notifications/Notifications.vue'
import HealthWorkerMenu from '@/views/healthworker/menu/Menu.vue'
import HealthWorkerProfile from '@/views/healthworker/profile/Profile.vue'
import HealthWorkerSettings from '@/views/healthworker/settings/Settings.vue'

// Parent Views (Pages)
import ParentHome from '@/views/parent/ParentHome.vue'
// Parent Features
import ChildInfo from '@/features/parent/schedule/ChildInfo.vue'
import VaccinationSchedule from '@/features/parent/schedule/VaccinationSchedule.vue'
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
  // Not Found route
  {
    path: '/not-found',
    name: 'NotFound',
    component: NotFound,
    meta: {
      title: 'Page Not Found',
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
    name: 'AdminVisitSummary',
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
    component: ViewUser,
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
  role: 'healthstaff'
    }
  },
  {
    path: '/healthworker/patients',
    name: 'HealthWorkerPatients',
    component: HealthWorkerPatients,
    meta: {
      title: 'Patient Records - ImmunizeMe',
      requiresAuth: true,
  role: 'healthstaff'
    }
  },
  {
    path: '/healthworker/patients/add',
    name: 'HealthWorkerAddPatient',
    component: AddPatient,
    meta: {
      title: 'Add Patient - ImmunizeMe',
      requiresAuth: true,
  role: 'healthstaff'
    }
  },
  {
    path: '/healthworker/patients/:id',
    name: 'PatientDetail',
    component: PatientDetail,
    meta: {
      title: 'Patient Details - ImmunizeMe',
      requiresAuth: true,
  role: 'healthstaff'
    }
  },
  {
    path: '/healthworker/patients/:patientId/visit/:visitId',
    name: 'VisitSummary',
    component: VisitSummary,
    meta: {
      title: 'Visit Summary - ImmunizeMe',
      requiresAuth: true,
  role: 'healthstaff'
    }
  },
  {
    path: '/healthworker/patients/:patientId/visits/:visitId/edit',
    name: 'HealthWorkerEditVisit',
    component: EditVisit,
    meta: {
      title: 'Edit Visit - ImmunizeMe',
      requiresAuth: true,
      role: 'healthstaff'
    }
  },
  {
    path: '/healthworker/patients/:patientId/vaccine-details',
    name: 'VaccineRecordDetails',
    component: VaccineRecordDetails,
    meta: {
      title: 'Vaccine Details - ImmunizeMe',
      requiresAuth: true,
  role: 'healthstaff'
    }
  },
  {
    path: '/healthworker/patients/:patientId/add-immunization',
    name: 'AddPatientImmunizationRecord',
    component: AddPatientImmunizationRecord,
    meta: {
      title: 'Add Immunization Record - ImmunizeMe',
      requiresAuth: true,
  role: 'healthstaff'
    }
  },
  {
    path: '/healthworker/patients/:patientId/immunizations/:recordId/edit',
    name: 'EditVaccinationRecord',
    component: EditVaccinationRecord,
    meta: {
      title: 'Edit Vaccination Record - ImmunizeMe',
      requiresAuth: true,
  role: 'healthstaff'
    }
  },
  {
    path: '/healthworker/stock',
    name: 'HealthWorkerStock',
    component: VaccineStock,
    meta: {
      title: 'Vaccine Stock - ImmunizeMe',
      requiresAuth: true,
  role: 'healthstaff'
    }
  },
  {
    path: '/healthworker/stock/:id',
    name: 'HealthWorkerStockDetails',
    component: InventoryDetails,
    meta: {
      title: 'Inventory Details - ImmunizeMe',
      requiresAuth: true,
  role: 'healthstaff'
    }
  },
  {
    path: '/healthworker/inventory/:id',
    name: 'VaccineDetail',
    component: VaccineDetail,
    meta: {
      title: 'Vaccine Details - ImmunizeMe',
      requiresAuth: true,
  role: 'healthstaff'
    }
  },
  {
    path: '/healthworker/messages',
    name: 'HealthWorkerMessages',
    component: HealthWorkerMessages,
    meta: {
      title: 'Messages - ImmunizeMe',
      requiresAuth: true,
  role: 'healthstaff'
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
  {
    path: '/healthworker/profile',
    name: 'HealthWorkerProfile',
    component: HealthWorkerProfile,
    meta: {
      title: 'Profile - ImmunizeMe',
      requiresAuth: true,
      role: 'healthstaff'
    }
  },
  {
    path: '/healthworker/settings',
    name: 'HealthWorkerSettings',
    component: HealthWorkerSettings,
    meta: {
      title: 'Settings - ImmunizeMe',
      requiresAuth: true,
      role: 'healthstaff'
    }
  },
  {
    path: '/healthworker/qr',
    name: 'HealthWorkerQRScanner',
    component: () => import('@/views/healthworker/tools/QRScanner.vue'),
    meta: {
      title: 'Scan QR - ImmunizeMe',
      requiresAuth: true,
      role: 'healthworker'
    }
  },
  // Parent Routes
  {
    path: '/parent/home',
    name: 'ParentHome',
    component: ParentHome,
    meta: {
      title: 'My Portal - ImmunizeMe',
      requiresAuth: true,
      role: 'parent'
    }
  },
  {
    path: '/parent/dashboard',
    name: 'ParentDashboard',
    redirect: '/parent/home', // Redirect old dashboard to new home
    meta: {
      title: 'Parent Dashboard - ImmunizeMe',
      requiresAuth: true,
      role: 'parent'
    }
  },
  {
    path: '/parent/records',
    name: 'ParentRecords',
    component: () => import('@/views/parent/ParentRecords.vue'),
    meta: {
      title: 'Records - ImmunizeMe',
      requiresAuth: true,
      role: 'parent'
    }
  },
  {
    path: '/parent/records/:id',
    name: 'ParentDependentDetails',
    component: () => import('@/features/parent/records/patient-info/DependentDetails.vue'),
    meta: {
      title: 'Dependent Details - ImmunizeMe',
      requiresAuth: true,
      role: 'parent'
    }
  },
  {
    path: '/parent/records/:patientId/vaccine-details',
    name: 'ParentVaccineRecordDetails',
    component: () => import('@/features/parent/records/vaccine-details/VaccineRecordDetails.vue'),
    meta: {
      title: 'Vaccine Details - ImmunizeMe',
      requiresAuth: true,
      role: 'parent'
    }
  },
  {
    path: '/parent/records/:patientId/visit/:visitId',
    name: 'ParentVisitSummary',
    component: () => import('@/features/parent/records/visit-summary/VisitSummary.vue'),
    meta: {
      title: 'Visit Summary - ImmunizeMe',
      requiresAuth: true,
      role: 'parent'
    }
  },
  {
    path: '/parent/schedule',
    name: 'ParentSchedule',
    component: () => import('@/views/parent/ParentSchedule.vue'),
    meta: {
      title: 'Schedule - ImmunizeMe',
      requiresAuth: true,
      role: 'parent'
    }
  },
  {
    path: '/parent/schedule/:id',
    name: 'DependentScheduleDetails',
    component: () => import('@/features/parent/schedule/ScheduleDetails.vue'),
    meta: {
      title: 'Schedule - ImmunizeMe',
      requiresAuth: true,
      role: 'parent'
    }
  },
  {
    path: '/parent/dependent/:id',
    name: 'DependentDetails',
    component: ChildInfo, // Reuse existing ChildInfo component for now
    meta: {
      title: 'Dependent Details - ImmunizeMe',
      requiresAuth: true,
      role: 'parent'
    }
  },
  {
    path: '/parent/profile',
    name: 'ParentProfile',
    component: () => import('@/views/parent/ParentProfile.vue'),
    meta: {
      title: 'My Profile - ImmunizeMe',
      requiresAuth: true,
      role: 'parent'
    }
  },
  {
    path: '/parent/notifications',
    name: 'ParentNotifications',
    component: () => import('@/views/parent/ParentNotifications.vue'),
    meta: {
      title: 'Notifications - ImmunizeMe',
      requiresAuth: true,
      role: 'parent'
    }
  },
  {
    path: '/parent/faqs',
    name: 'ParentFAQs',
    component: () => import('@/views/parent/ParentFAQs.vue'),
    meta: {
      title: 'FAQs - ImmunizeMe',
      requiresAuth: true,
      role: 'parent'
    }
  },
  {
    path: '/parent/messages',
    name: 'ParentMessages',
    component: () => import('@/views/parent/ParentMessages.vue'),
    meta: {
      title: 'Messages - ImmunizeMe',
      requiresAuth: true,
      role: 'parent'
    }
  },
  {
    path: '/parent/messages/:conversationId',
    name: 'ParentChat',
    component: () => import('@/features/parent/messaging/Chat.vue'),
    meta: {
      title: 'Chat - ImmunizeMe',
      requiresAuth: true,
      role: 'parent'
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
  // Catch-all route for 404 -> NotFound page
  {
    path: '/:pathMatch(.*)*',
    redirect: '/not-found'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation guard for authentication, role, and parent child-ownership
router.beforeEach(async (to, from, next) => {
  document.title = to.meta.title || 'ImmunizeMe'

  const requiresAuth = to.meta?.requiresAuth
  if (!requiresAuth) return next()

  if (!isAuthenticated()) {
    return next({ path: '/auth/login', query: { redirect: to.fullPath } })
  }

  const role = (getRole() || '').toLowerCase()
  const requiredRole = (to.meta?.role || '').toLowerCase()
  
  // Check for offline restrictions on admin routes
  const offlineRestrictedRoutes = [
    '/admin/chat',
    '/admin/notifications-inbox', 
    '/admin/sms-management',
    '/admin/faqs',
    '/admin/activity-logs',
    '/admin/activity'
  ]
  
  if (role === 'admin' && offlineRestrictedRoutes.some(route => to.path.startsWith(route))) {
    try {
      const online = navigator.onLine
      if (!online) {
        // Show offline restriction message
        showOfflineRouteError('This feature is not available in offline mode.')
        return next(false) // Cancel navigation
      }
    } catch (error) {
      console.warn('Could not check online status:', error)
    }
  }
  // Accept both legacy 'healthworker' and new 'health_staff' role keys
  const normalizeRole = (r) => {
    const s = (r || '').toLowerCase()
    if (['healthworker','health-worker','health_worker','health staff','health_staff'].includes(s)) return 'healthstaff'
    return s
  }
  const normalizedRole = normalizeRole(role)
  const normalizedRequired = normalizeRole(requiredRole)
  
  // Normalize guardian/parent role
  const effectiveRole = normalizedRole === 'guardian' ? 'parent' : normalizedRole
  const effectiveRequired = normalizedRequired === 'guardian' ? 'parent' : normalizedRequired
  
  if (effectiveRequired && effectiveRole && effectiveRole !== effectiveRequired) {
    // Redirect to role-appropriate dashboard
    if (role === 'admin') return next('/admin/dashboard')
    if (normalizedRole === 'healthstaff') return next('/healthworker/dashboard')
    if (role === 'parent' || role === 'guardian') return next('/parent/home')
  }

  // For guardian/parent role, proactively verify child ownership before entering child-specific routes
  // If offline, skip remote validations and allow navigation (client-side only)
  try {
    const online = navigator.onLine
    if (!online) {
      return next()
    }
  } catch (_) {
    // If status check fails, default to allowing navigation
    return next()
  }
  
  // For guardian/parent role, proactively verify child ownership before entering child-specific routes
  try {
    if (effectiveRole === 'parent') {
      // Known parent routes that carry a child/patient id
      const parentRoutesWithChildId = new Set([
        'ParentDependentDetails',
        'ParentVisitSummary',
        'ParentVaccineRecordDetails',
        'DependentScheduleDetails',
        'ChildInfo',
        'VaccinationSchedule',
        'PatientRoute', // neutral route; still verify
      ])
      const hasChildContext = parentRoutesWithChildId.has(to.name) || ['id','patientId','childId'].some(k => Object.prototype.hasOwnProperty.call((to.params||{}), k))
      if (hasChildContext) {
        const childId = to.params.id || to.params.patientId || to.params.childId
        if (childId) {
          try {
            await api.get(`/parent/children/${childId}`)
          } catch (err) {
            const status = err?.response?.status
            if (status === 403 || status === 404) {
              return next('/not-found')
            }
            // For other errors, still fail closed to avoid revealing info
            return next('/not-found')
          }
        }
      }
    }
  } catch (_) {
    // On guard error, fail closed
    return next('/not-found')
  }

  // For health staff and admin, ensure immunization record belongs to the patient in URL before entering edit routes
  try {
    const isStaff = normalizedRole === 'healthstaff' || normalizedRole === 'admin'
    // Both admin and healthworker use the same route name 'EditVaccinationRecord' in this app
    if (isStaff && to.name === 'EditVaccinationRecord') {
      const patientId = to.params?.patientId
      const recordId = to.params?.recordId
      if (patientId && recordId) {
        try {
          const resp = await api.get(`/immunizations/${recordId}`)
          const rec = resp?.data?.data || resp?.data || {}
          const recPatientId = rec.patient_id || rec.patientId
          if (String(recPatientId) !== String(patientId)) {
            return next('/not-found')
          }
        } catch (err) {
          // If the record cannot be fetched, treat as not found
          return next('/not-found')
        }
      }
    }
    // For visit edit route, ensure visit belongs to the patient in URL
    if (isStaff && to.name === 'EditVisitRecord') {
      const patientId = to.params?.patientId
      const visitId = to.params?.visitId
      if (patientId && visitId) {
        try {
          const resp = await api.get(`/visits/${visitId}`)
          const row = resp?.data?.data || resp?.data || {}
          const rowPatientId = row.patient_id || row.patientId
          if (String(rowPatientId) !== String(patientId)) {
            return next('/not-found')
          }
        } catch (_) {
          return next('/not-found')
        }
      }
    }
    // Healthworker/BHS visit summary view must match patient -> visit relationship
    if (isStaff && to.name === 'VisitSummary') {
      const patientId = to.params?.patientId
      const visitId = to.params?.visitId
      if (patientId && visitId) {
        try {
          const resp = await api.get(`/visits/${visitId}`)
          const row = resp?.data?.data || resp?.data || {}
          const rowPatientId = row.patient_id || row.patientId
          if (String(rowPatientId) !== String(patientId)) {
            return next('/not-found')
          }
        } catch (_) {
          return next('/not-found')
        }
      }
    }
    // Admin visit summary view must also match patient -> visit relationship
    if (isStaff && to.name === 'AdminVisitSummary') {
      const patientId = to.params?.patientId
      const visitId = to.params?.visitId
      if (patientId && visitId) {
        try {
          const resp = await api.get(`/visits/${visitId}`)
          const row = resp?.data?.data || resp?.data || {}
          const rowPatientId = row.patient_id || row.patientId
          if (String(rowPatientId) !== String(patientId)) {
            return next('/not-found')
          }
        } catch (_) {
          return next('/not-found')
        }
      }
    }
    // Admin edit stock: ensure inventory item exists
    if (normalizedRole === 'admin' && to.name === 'EditStock') {
      const stockId = to.params?.id
      if (stockId) {
        try {
          const resp = await api.get(`/vaccines/inventory/${stockId}`)
          const row = resp?.data?.data || resp?.data || null
          if (!row) {
            return next('/not-found')
          }
        } catch (_) {
          return next('/not-found')
        }
      }
    }
    // Admin receiving report view: ensure report exists
    if (normalizedRole === 'admin' && to.name === 'ReceivingReportView') {
      const reportId = to.params?.id
      if (reportId) {
        try {
          const resp = await api.get(`/receiving-reports/${reportId}`)
          const row = resp?.data?.data || resp?.data || null
          if (!row) {
            return next('/not-found')
          }
        } catch (_) {
          return next('/not-found')
        }
      }
    }
  } catch (_) {
    return next('/not-found')
  }
  next()
})

// Global error handler for failed dynamic imports (offline navigation)
router.onError((error) => {
  // Only log in development, suppress in production
  if (import.meta.env.DEV) {
    console.error('🚫 Router error:', error)
  }
  
  // Check if it's a failed dynamic import (common when offline)
  if (error.message.includes('Failed to fetch dynamically imported module')) {
    // Check if this is specifically a ViewPatient.vue failure
    if (error.message.includes('ViewPatient.vue')) {
      console.warn('⚠️ ViewPatient.vue failed to load offline')
      console.log('💡 Solutions:')
      console.log('   1. Visit /admin/patients while online to cache the component')
      console.log('   2. Run window.__preloadViewPatient() in console to manually preload')
      console.log('   3. Run window.__warmAdminCache() to cache all admin components')
      console.log('   4. Check window.__checkCacheStatus() to verify caching')
    } else {
      // Only log in development
      if (import.meta.env.DEV) {
        console.warn('⚠️ Failed to load route component - likely offline')
        console.log('💡 This route needs to be visited while online first to be cached')
      }
    }
    
    // Show user-friendly error message using a toast or alert
    showOfflineRouteError()
    
    // Don't crash the app - stay on current route
    return false
  }
  
  // For other errors, let Vue Router handle them
  throw error
})

// Offline route error handler
function showOfflineRouteError(message = 'This page is not available offline. Please connect to the internet and try again.') {
  // Try to show a toast notification if available
  try {
    // Check if we have a toast system available
    if (window.$toast || window.toast) {
      const toast = window.$toast || window.toast
      toast.add({
        severity: 'warn',
        summary: 'Feature Unavailable Offline',
        detail: message,
        life: 5000
      })
    } else {
      // Fallback to alert
      alert(message)
    }
  } catch (e) {
    // Last resort - console warning
    console.warn('⚠️ Offline route error:', message)
  }
}

export default router
