import api from './api'

const TOKEN_KEY = 'authToken'
const USER_KEY = 'authUser'

// Decode a JWT payload safely (no crypto verification)
function decodeJwt(token) {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const json = decodeURIComponent(
      atob(payload)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(json)
  } catch {
    return null
  }
}

// Normalize role tokens across known variants to a consistent string
function normalizeRole(value) {
  if (!value) return null;
  const raw = typeof value === 'string' ? value : (value.name || value.role || value.type || null);
  if (!raw) return null;
  const r = String(raw).toLowerCase();
  if (['admin', 'administrator', 'system admin'].includes(r)) return 'admin';
  if (['healthworker', 'health_worker', 'health-worker', 'health staff', 'health_staff', 'health worker'].includes(r)) return 'healthstaff';
  if (['guardian', 'parent', 'guardian-parent'].includes(r)) return 'guardian';
  return r; // fallback to whatever string it is
}

export async function login({ identifier, password }) {
  // identifier can be phone, username or email
  const payload = { identifier, password }
  const { data } = await api.post('/auth/login', payload)
  const { token, user } = data
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
  // Also store role and userInfo for compatibility with composables
  const normRole = normalizeRole(user?.role)
  if (normRole) localStorage.setItem('userRole', normRole)
  localStorage.setItem('userInfo', JSON.stringify(user))
  return { token, user }
}

export function logout() {
  try {
    const token = localStorage.getItem(TOKEN_KEY)
    if (token) {
      // fire-and-forget logout logging; ignore errors
      fetch('/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {})
    }
  } finally {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    localStorage.removeItem('userRole')
    localStorage.removeItem('userInfo')
  }
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function getUser() {
  const rawInfo = localStorage.getItem('userInfo')
  const rawAuth = localStorage.getItem(USER_KEY)
  const raw = rawInfo || rawAuth
  try {
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function isAuthenticated() {
  return !!getToken()
}

export function getRole() {
  // 1) direct cache set by other parts of the app
  const direct = localStorage.getItem('userRole')
  if (direct) {
    // If some code stored an object accidentally (e.g. "[object Object]" or JSON), try to recover
    if (direct === '[object Object]') {
      // ignore and try other sources
    } else if (/^[\[{]/.test(direct)) {
      try {
        const parsed = JSON.parse(direct)
        const n = normalizeRole(parsed)
        if (n) {
          localStorage.setItem('userRole', n)
          return n
        }
      } catch {
        // fall through to other sources
      }
    } else {
      // Looks like a normal token
      return direct
    }
  }

  // 2) derive from stored user object
  const u = getUser()
  let role = null
  if (u) {
    role = normalizeRole(u.role) || normalizeRole(u.user_role) || normalizeRole(u.type) || normalizeRole(u.userType) || null
  }

  // 3) fallback: decode JWT claims
  if (!role) {
    const tok = getToken()
    if (tok) {
      const payload = decodeJwt(tok)
      // Common claim shapes
      role = normalizeRole(payload?.role) ||
        normalizeRole(Array.isArray(payload?.roles) ? payload.roles[0] : null) ||
        normalizeRole(payload?.user_role) ||
        normalizeRole(payload?.type) ||
        normalizeRole(payload?.userType) ||
        null
    }
  }

  if (role) {
    // cache for next reads
    localStorage.setItem('userRole', role)
  }
  return role
}

export function getUserId() {
  const u = getUser()
  if (u?.user_id || u?.id) return u.user_id || u.id
  // Fallback to JWT
  const tok = getToken()
  if (tok) {
    const payload = decodeJwt(tok)
    if (payload?.id) return payload.id
    if (payload?.user_id) return payload.user_id
    if (payload?.sub) return payload.sub
  }
  return null
}
