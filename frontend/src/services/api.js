/**
 * Axios API Client with Offline Cache Support
 * Clean refactored version using new offline architecture
 */

import axios from 'axios'
import { installCacheInterceptor } from './offline/apiCacheInterceptor'

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// ========================================
// REQUEST INTERCEPTOR - Add auth token
// ========================================
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('authToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    console.log(`📤 API Request: ${config.method?.toUpperCase()} ${config.url}`)
    return config
  },
  (error) => {
    console.error('❌ Request error:', error)
    return Promise.reject(error)
  }
)

// ========================================
// RESPONSE INTERCEPTOR - Handle errors
// ========================================
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`)
    return response
  },
  (error) => {
    console.error(`❌ API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url}`, error.message)
    
    // Handle specific error cases
    if (error.response) {
      // Server responded with error status
      const status = error.response.status
      
      if (status === 401) {
        // Unauthorized - clear token and redirect to login
        localStorage.removeItem('authToken')
        localStorage.removeItem('authUser')
        window.location.href = '/login'
      } else if (status === 403) {
        console.warn('Access forbidden')
      } else if (status === 404) {
        console.warn('Resource not found')
      } else if (status >= 500) {
        console.error('Server error')
      }
    } else if (error.request) {
      // Request made but no response (network error)
      console.error('Network error - no response received')
    }
    
    return Promise.reject(error)
  }
)

// ========================================
// INSTALL OFFLINE CACHE INTERCEPTOR
// ========================================
installCacheInterceptor(api)

// ========================================
// API HELPER FUNCTIONS
// ========================================

/**
 * Notification API functions
 */
export const notificationAPI = {
  // Create notification
  create: (data) => api.post('/notifications', data),

  // Broadcast notification by recipient group (admins/healthstaff/guardians/all-users)
  broadcast: (data) => api.post('/notifications/broadcast', data),

  // Get user's notifications (inbox)
  getMyNotifications: (params = {}) => api.get('/notifications', { params }),

  // Mark notification as read
  markAsRead: (id) => api.put(`/notifications/${id}/read`),

  // Delete notification
  delete: (id) => api.delete(`/notifications/${id}`),

  // Get pending notifications (admin)
  getPending: () => api.get('/notifications/pending'),

  // Update notification status (admin)
  updateStatus: (id, status, errorMessage) => 
    api.put(`/notifications/${id}/status`, { status, error_message: errorMessage })
}

/**
 * Conversation API functions
 */
export const conversationAPI = {
  // Get conversations for current user
  getConversations: (params = {}) => api.get('/conversations', { params }),

  // Create a new conversation
  create: (data) => api.post('/conversations', data),

  // Start conversation with first message
  startWithMessage: (data) => api.post('/conversations/start', data),

  // Leave a conversation
  leave: (conversationId) => api.post(`/conversations/${conversationId}/leave`),

  // Get total unread count for current user (fast path)
  getUnreadCount: () => api.get('/conversations/unread/count')
}

/**
 * Message API functions
 */
export const messageAPI = {
  // Get messages for a conversation
  getMessages: (conversationId, params = {}) => api.get(`/messages/${conversationId}`, { params }),

  // Send a message
  send: (data) => api.post('/messages', data),

  // Mark message as read
  markAsRead: (messageId) => api.post(`/messages/${messageId}/read`)
}

/**
 * Visits API (lightweight)
 */
export const visitsAPI = {
  // Non-destructive existence check for same-day visit
  existsCheck: (patientId, visitDateIso) =>
    api.get('/visits/exists/check', { params: { patient_id: patientId, visit_date: visitDateIso } })
}

// ========================================
// EXPORT DEFAULT API INSTANCE
// ========================================
export default api
