import api from './api'

const TOKEN_KEY = 'authToken'
const USER_KEY = 'authUser'

export async function login({ identifier, password }) {
  // identifier can be phone, username or email
  const payload = { identifier, password }
  const { data } = await api.post('/auth/login', payload)
  const { token, user } = data
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
  return { token, user }
}

export function logout() {
  try {
    const token = localStorage.getItem(TOKEN_KEY)
    if (token) {
      // fire-and-forget logout logging; ignore errors
      fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      }).catch(() => {})
    }
  } finally {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  }
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function getUser() {
  const raw = localStorage.getItem(USER_KEY)
  try { return raw ? JSON.parse(raw) : null } catch { return null }
}

export function isAuthenticated() {
  return !!getToken()
}

export function getRole() {
  const u = getUser()
  return u?.role || null
}
