import { useAuthStore } from '../stores/authStore'

// Authentication guard
export function authGuard(to, from, next) {
  const authStore = useAuthStore()
  
  if (authStore.isAuthenticated) {
    next()
  } else {
    next({
      path: '/login',
      query: { redirect: to.fullPath }
    })
  }
}

// Guest guard (for login/register pages)
export function guestGuard(to, from, next) {
  const authStore = useAuthStore()
  
  if (!authStore.isAuthenticated) {
    next()
  } else {
    // Redirect authenticated users to their dashboard
    const redirectPath = getRedirectPath(authStore.userRole)
    next(redirectPath)
  }
}

// Role-based guard
export function roleGuard(allowedRoles) {
  return function(to, from, next) {
    const authStore = useAuthStore()
    
    if (!authStore.isAuthenticated) {
      next({
        path: '/login',
        query: { redirect: to.fullPath }
      })
      return
    }
    
    // Ensure allowedRoles is an array
    if (!Array.isArray(allowedRoles)) {
      allowedRoles = [allowedRoles]
    }
    
    if (allowedRoles.includes(authStore.userRole)) {
      next()
    } else {
      next('/unauthorized')
    }
  }
}

// Admin guard
export function adminGuard(to, from, next) {
  return roleGuard(['admin'])(to, from, next)
}

// Health worker guard
export function healthWorkerGuard(to, from, next) {
  return roleGuard(['health_worker', 'admin'])(to, from, next)
}

// Parent guard
export function parentGuard(to, from, next) {
  return roleGuard(['parent'])(to, from, next)
}

// Multi-role guard factory
export function createRoleGuard(...roles) {
  return roleGuard(roles)
}

// Helper function to get redirect path based on role
function getRedirectPath(role) {
  switch (role) {
    case 'admin':
      return '/admin/dashboard'
    case 'health_worker':
      return '/health-worker/dashboard'
    case 'parent':
      return '/parent/dashboard'
    default:
      return '/dashboard'
  }
}

// Permission-based guard
export function permissionGuard(requiredPermission) {
  return function(to, from, next) {
    const authStore = useAuthStore()
    
    if (!authStore.isAuthenticated) {
      next({
        path: '/login',
        query: { redirect: to.fullPath }
      })
      return
    }
    
    const rolePermissions = {
      admin: [
        'manage_users',
        'manage_facilities',
        'view_all_records',
        'manage_inventory',
        'generate_reports',
        'send_notifications',
        'system_settings'
      ],
      health_worker: [
        'manage_patients',
        'record_immunizations',
        'view_schedules',
        'update_inventory',
        'generate_facility_reports'
      ],
      parent: [
        'view_child_records',
        'schedule_appointments',
        'receive_notifications',
        'update_child_info'
      ]
    }
    
    const userPermissions = rolePermissions[authStore.userRole] || []
    
    if (userPermissions.includes(requiredPermission)) {
      next()
    } else {
      next('/unauthorized')
    }
  }
}