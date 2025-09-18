import api from './api'

export async function listUsers({ page = 1, limit = 10, search = '', role = '', status = '' } = {}) {
  const params = { page, limit }
  if (search) params.search = search
  if (role) params.role = role
  if (status) params.status = status
  const { data } = await api.get('/users', { params })
  return data
}

export async function getUser(id) {
  const { data } = await api.get(`/users/${id}`)
  return data
}

// Use the auth/register endpoint to create both Supabase Auth user and DB user
export async function createUser(payload) {
  const { data } = await api.post('/auth/register', payload)
  return data
}

export async function updateUser(id, payload) {
  const { data } = await api.put(`/users/${id}`, payload)
  return data
}

export async function deleteUser(id) {
  const { data } = await api.delete(`/users/${id}`)
  return data
}
