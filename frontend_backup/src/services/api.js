import axios from 'axios'
import { useRouter } from 'vue-router'

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Store reference to router for navigation
let router = null

// Function to set router instance
export const setRouter = (routerInstance) => {
  router = routerInstance
}

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // Add request timestamp
    config.metadata = { startTime: new Date() }
    
    return config
  },
  (error) => {
    console.error('Request interceptor error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // Calculate request duration
    if (response.config.metadata) {
      const duration = new Date() - response.config.metadata.startTime
      console.log(`API Request to ${response.config.url} took ${duration}ms`)
    }
    
    return response
  },
  async (error) => {
    const originalRequest = error.config
    
    // Handle different error status codes
    if (error.response?.status === 401) {
      // Unauthorized - token expired or invalid
      if (!originalRequest._retry) {
        originalRequest._retry = true
        
        // Try to refresh token
        try {
          const refreshResponse = await api.post('/auth/refresh-token')
          const newToken = refreshResponse.data.token
          
          localStorage.setItem('auth_token', newToken)
          originalRequest.headers.Authorization = `Bearer ${newToken}`
          
          return api(originalRequest)
        } catch (refreshError) {
          // Refresh failed - redirect to login
          localStorage.removeItem('auth_token')
          localStorage.removeItem('user_data')
          
          if (router) {
            router.push('/login')
          } else {
            window.location.href = '/login'
          }
          
          return Promise.reject(refreshError)
        }
      } else {
        // Already tried refresh - redirect to login
        localStorage.removeItem('auth_token')
        localStorage.removeItem('user_data')
        
        if (router) {
          router.push('/login')
        } else {
          window.location.href = '/login'
        }
      }
    } else if (error.response?.status === 403) {
      // Forbidden - insufficient permissions
      console.error('Access forbidden - insufficient permissions')
      
      // Optionally redirect to unauthorized page
      if (router) {
        router.push('/unauthorized')
      }
    } else if (error.response?.status === 404) {
      // Not found
      console.error('Resource not found:', error.response.config.url)
    } else if (error.response?.status >= 500) {
      // Server errors
      console.error('Server error occurred:', error.response.status, error.response.statusText)
    } else if (error.code === 'NETWORK_ERROR' || error.code === 'ECONNABORTED') {
      // Network or timeout errors
      console.error('Network error or timeout:', error.message)
    }
    
    return Promise.reject(error)
  }
)

// Add common API methods
export const apiMethods = {
  // GET request
  get: (url, config = {}) => api.get(url, config),
  
  // POST request
  post: (url, data = {}, config = {}) => api.post(url, data, config),
  
  // PUT request
  put: (url, data = {}, config = {}) => api.put(url, data, config),
  
  // DELETE request
  delete: (url, config = {}) => api.delete(url, config),
  
  // PATCH request
  patch: (url, data = {}, config = {}) => api.patch(url, data, config),
  
  // Upload file
  uploadFile: (url, fileData, config = {}) => {
    const formData = new FormData()
    
    if (fileData instanceof FormData) {
      return api.post(url, fileData, {
        ...config,
        headers: {
          'Content-Type': 'multipart/form-data',
          ...config.headers
        }
      })
    } else {
      Object.keys(fileData).forEach(key => {
        formData.append(key, fileData[key])
      })
      
      return api.post(url, formData, {
        ...config,
        headers: {
          'Content-Type': 'multipart/form-data',
          ...config.headers
        }
      })
    }
  },
  
  // Download file
  downloadFile: (url, config = {}) => {
    return api.get(url, {
      ...config,
      responseType: 'blob'
    })
  }
}

export default api