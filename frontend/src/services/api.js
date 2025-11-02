import axios from 'axios'

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('authToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    // Handle common error responses
    if (error.response?.status === 401) {
      // Unauthorized - redirect to login
      localStorage.removeItem('authToken')
      localStorage.removeItem('authUser')
      window.location.href = '/auth/login'
    } else if (error.response?.status === 403 || error.response?.status === 404) {
      // For patient-related routes, send the user to a friendly Not Found page
      try {
        const url = (error.config?.url || '').toString()
        // Match protected resources for the guardian UI
        const isPatientResource = /\/patients\//.test(url) || /\/parent\/children\//.test(url)
        if (isPatientResource) {
          // Avoid infinite redirects if we're already on NotFound
          if (window.location.pathname !== '/not-found') {
            window.location.href = '/not-found'
            return
          }
        }
      } catch (_) {}
      console.error('Access forbidden or resource not found')
    } else if (error.response?.status >= 500) {
      // Server errors
      console.error('Server error occurred')
    }
    
    return Promise.reject(error)
  }
)

// Notification API functions
export const notificationAPI = {
  // Create notification
  create: (data) => api.post('/notifications', data),

  // Get user's notifications (inbox)
  getMyNotifications: (params = {}) => api.get('/notifications', { params }),

  // Mark notification as read
  markAsRead: (id) => api.put(`/notifications/${id}/read`),

  // Delete notification
  delete: (id) => api.delete(`/notifications/${id}`),

  // Get pending notifications (admin)
  getPending: () => api.get('/notifications/pending'),

  // Update notification status (admin)
  updateStatus: (id, status, errorMessage) => api.put(`/notifications/${id}/status`, { status, error_message: errorMessage })
}

// Conversation API functions
export const conversationAPI = {
  // Get conversations for current user
  getConversations: (params = {}) => api.get('/conversations', { params }),

  // Create a new conversation
  create: (data) => api.post('/conversations', data),

  // Start conversation with first message
  startWithMessage: (data) => api.post('/conversations/start', data),

  // Leave a conversation
  leave: (conversationId) => api.post(`/conversations/${conversationId}/leave`)
}

// Message API functions
export const messageAPI = {
  // Get messages for a conversation
  getMessages: (conversationId, params = {}) => api.get(`/messages/${conversationId}`, { params }),

  // Send a message
  send: (data) => api.post('/messages', data),

  // Mark message as read
  markAsRead: (messageId) => api.post(`/messages/${messageId}/read`)
}

export default api