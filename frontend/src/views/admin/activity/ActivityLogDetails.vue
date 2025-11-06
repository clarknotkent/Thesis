<template>
  <AdminLayout>
    <div class="container-fluid py-3">
      <div class="d-flex align-items-center mb-3">
        <h3 class="mb-0">
          <i class="bi bi-info-circle me-2" />
          Activity Log Details
        </h3>
        <button
          class="btn btn-outline-secondary ms-auto"
          @click="$router.back()"
        >
          Back
        </button>
      </div>

      <div
        v-if="loading"
        class="text-center py-5"
      >
        <div
          class="spinner-border text-primary"
          role="status"
        >
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>

      <div
        v-else-if="!log"
        class="alert alert-warning"
      >
        Log not found or inaccessible.
      </div>

      <div
        v-else
        class="card shadow-sm"
      >
        <div class="card-body">
          <div class="row g-3">
            <div class="col-md-6">
              <strong>Timestamp:</strong><br>
              <span class="text-muted">{{ formatDatePH(log.timestamp) }}</span>
            </div>
            <div class="col-md-6">
              <strong>User:</strong><br>
              <span class="text-muted">
                <i
                  :class="getRoleIcon(log.userRole)"
                  :style="{ color: getRoleColor(log.userRole) }"
                  class="me-1"
                />
                {{ log.userFullName }}
                <span
                  class="badge role-badge ms-2"
                  :class="getRoleBadgeClass(log.userRole)"
                >{{ formatUserRole(log.userRole) }}</span>
              </span>
            </div>
            <div class="col-md-6">
              <strong>Action:</strong><br>
              <span
                class="badge"
                :class="getActionBadgeClass(log.actionType)"
              >{{ log.displayAction }}</span>
            </div>
            <div class="col-md-6">
              <strong>Status:</strong><br>
              <span
                class="badge"
                :class="log.status === 'success' ? 'bg-success' : 'bg-danger'"
              >{{ log.status }}</span>
            </div>
            <div class="col-md-6">
              <strong>IP Address:</strong><br>
              <code>{{ log.ipAddress }}</code>
            </div>
            <div class="col-md-6">
              <strong>User Agent:</strong><br>
              <small class="text-muted">{{ log.userAgent || 'Not available' }}</small>
            </div>
            <div class="col-12">
              <strong>Resource:</strong><br>
              <span class="text-muted">{{ log.displayResource }}</span>
            </div>
            <div
              v-if="log.description"
              class="col-12"
            >
              <strong>Description:</strong><br>
              <p class="text-muted">
                {{ log.displayDescription }}
              </p>
            </div>
            <div class="col-12">
              <button
                class="btn btn-sm btn-outline-secondary"
                @click="showRaw = !showRaw"
              >
                {{ showRaw ? 'Hide raw backend payload' : 'Show raw backend payload' }}
              </button>
            </div>
            <div
              v-if="showRaw"
              class="col-12"
            >
              <strong>Raw Backend Payload:</strong>
              <pre class="bg-light p-3 rounded small"><code>{{ formatJSON(log.rawOriginal) }}</code></pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import AdminLayout from '@/components/layout/desktop/AdminLayout.vue'
import api from '@/services/api'
import { formatPHDateTime } from '@/utils/dateUtils'
import { useActivityLogStore } from '@/stores/activityLogStore'

const route = useRoute()
const loading = ref(true)
const log = ref(null)
const showRaw = ref(false)
const activityLogStore = useActivityLogStore()
// Replace IDs in description with names when available
const sanitizeDescription = (raw, meta, ctx = {}) => {
  if (!raw) return ''
  const text = String(raw)
  const findName = (m, keys) => {
    if (!m) return ''
    for (const k of keys) {
      const v = m[k]
      if (v && typeof v === 'string') return v
    }
    return ''
  }
  // try nested objects
  const nestedName = (m, paths) => {
    if (!m) return ''
    for (const p of paths) {
      const segs = p.split('.')
      let cur = m
      for (const s of segs) {
        if (!cur) break
        cur = cur[s]
      }
      if (cur && typeof cur === 'string') return cur
    }
    return ''
  }

  const userName = findName(meta, [
    'display_user_name', 'user_fullname', 'username', 'user_name',
    'full_name', 'name', 'guardian_name', 'parent_name', 'account_name'
  ]) || nestedName(meta, ['user.name', 'guardian.name', 'account.name'])

  const patientName = findName(meta, [
    'patient_name', 'child_name', 'child_fullname', 'child_full_name',
    'patient_fullname', 'patient_full_name'
  ]) || nestedName(meta, ['patient.name', 'child.name'])

  const actorName = ctx.actorName || ''
  const actorRole = ctx.actorRole || ''
  const actorDisplay = actorName ? (actorRole ? `${actorRole} ${actorName}` : actorName) : 'User'

  // subject user (the affected account) name
  const subjectName = findName(meta, [
    'target_user_name', 'target_name', 'affected_user_name', 'affected_name',
    'subject_user_name', 'subject_name', 'account_name', 'user_full_name',
    'full_name', 'name', 'user_name', 'display_user_name'
  ]) || nestedName(meta, [
    'target.user_name', 'target.full_name', 'target.name',
    'affected.user_name', 'affected.full_name', 'affected.name',
    'subject.user_name', 'subject.full_name', 'subject.name',
    'account.full_name', 'account.name'
  ])
  const subjectDisplay = ctx.subjectName || subjectName || userName || ''

  // If backend put only the subject's username in description, replace it with the full subject name
  // Try to detect a likely subject username from metadata
  const subjectUsername = findName(meta, [
    'subject_username', 'target_username', 'affected_username', 'username', 'user_name', 'account_username'
  ]) || nestedName(meta, [
    'subject.username', 'target.username', 'affected.username', 'user.username', 'account.username'
  ])

  let out = text
  if (userName) {
    out = out
      .replace(/\b(UserID|User_Id|user_id|userId)\s*[:=]\s*\d+\b/gi, `User: ${userName}`)
      .replace(/\buser\s*(id)?\s*[:#=]?\s*(\d+)\b/gi, `User: ${userName}`)
  } else {
    out = out
      .replace(/\b(UserID|User_Id|user_id|userId)\s*[:=]\s*\d+\b/gi, 'User')
      .replace(/\buser\s*(id)?\s*[:#=]?\s*(\d+)\b/gi, 'User')
  }
  if (patientName) {
    out = out
      .replace(/\b(PatientID|patient_id|patientId|ChildID|child_id|childId)\s*[:=]\s*\d+\b/gi, `Patient: ${patientName}`)
      .replace(/\b(patient|child)\s*(id)?\s*[:#=]?\s*(\d+)\b/gi, (_, p1) => `${p1.charAt(0).toUpperCase()+p1.slice(1)}: ${patientName}`)
  } else {
    out = out
      .replace(/\b(PatientID|patient_id|patientId|ChildID|child_id|childId)\s*[:=]\s*\d+\b/gi, 'Patient')
      .replace(/\b(patient|child)\s*(id)?\s*[:#=]?\s*(\d+)\b/gi, (_, p1) => `${p1.charAt(0).toUpperCase()+p1.slice(1)}`)
  }
  // replace trailing "by <number>" with actor name
  out = out.replace(/\bby\s+\d+\b/gi, `by ${actorDisplay}`)

  // Replace generic object labels like "... for User" or "... deleted User" with the subject's name
  if (subjectDisplay) {
    const subjectWithRole = ctx.subjectRole && isPersonRole(ctx.subjectRole)
      ? `${ctx.subjectRole} ${subjectDisplay}`
      : subjectDisplay
    out = out
      .replace(/\b(Password\s*reset\s*for)\s+User\b/gi, (_, p1) => `${p1} ${subjectWithRole}`)
      .replace(/\b(Reset\s*password\s*for)\s+User\b/gi, (_, p1) => `${p1} ${subjectWithRole}`)
      .replace(/\b(Soft\s+deleted|Deleted|Updated|Created|Deactivated|Activated|Restored|Suspended)\s+User\b/gi, (_, verb) => `${verb} ${subjectWithRole}`)
    // Replace bare username mentions with the subject's full name when we can identify it
    if (subjectUsername && subjectUsername !== subjectDisplay && !subjectDisplay.toLowerCase().includes(subjectUsername.toLowerCase())) {
      try {
        const rx = new RegExp(`\\b${subjectUsername.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}\\b`, 'gi')
        out = out.replace(rx, subjectDisplay)
      } catch {}
    }
  }

  // Replace patterns like "<entityType> <entityId>" with the resolved subject name (e.g., "vaccine 12" -> "UNICEF Vitamin A capsule")
  if (ctx.entityType && ctx.entityId && subjectDisplay) {
    const typeWord = String(ctx.entityType).toLowerCase().replace(/[_-]+/g, ' ')
    const idWord = String(ctx.entityId)
    try {
      const rx = new RegExp(`\\b(${typeWord}s?|${typeWord})\\s*(id)?\\s*[:#=]?\\s*(${idWord})\\b`, 'gi')
      const replacement = ctx.subjectRole && isPersonRole(ctx.subjectRole)
        ? `${ctx.subjectRole} ${subjectDisplay}`
        : subjectDisplay
      out = out.replace(rx, replacement)
    } catch {}
  }
  return out
}


const formatDatePH = (date) => {
  if (!date) return '-'
  return formatPHDateTime(date)
}

const formatJSON = (obj) => {
  try {
    return typeof obj === 'string' ? obj : JSON.stringify(obj, null, 2)
  } catch {
    return String(obj)
  }
}

const getActionBadgeClass = (action) => {
  switch ((action || '').toLowerCase()) {
    case 'login': return 'bg-success'
    case 'logout': return 'bg-info'
    case 'create': return 'bg-primary'
    case 'update': return 'bg-warning text-dark'
    case 'delete': return 'bg-danger'
    case 'view': return 'bg-secondary'
    default: return 'bg-light text-dark'
  }
}

// Role helpers (match list view)
const formatUserRole = (role) => {
  if (!role) return 'Unknown'
  const r = String(role).toLowerCase()
  if (r === 'admin') return 'Admin'
  if (r === 'health_worker' || r === 'healthworker' || r === 'health_staff' || r === 'healthstaff' || r === 'health staff') return 'Health Staff'
  if (r === 'parent' || r === 'guardian') return 'Guardian'
  return role
}

const getRoleBadgeClass = (role) => {
  const r = String(role).toLowerCase().replace(/[-\s]+/g, '_')
  if (r === 'admin') return 'role-admin'
  if (r === 'parent' || r === 'guardian') return 'role-parent'
  if (r === 'system') return 'role-system'
  if (r === 'health_worker' || r === 'healthworker' || r === 'health_staff' || r === 'healthstaff') return 'role-healthstaff'
  return 'role-system'
}

// Icons and colors for roles (match list view)
const getRoleIcon = (role) => {
  const r = String(role).toLowerCase()
  if (r === 'admin') return 'bi bi-shield-fill-check fs-5'
  if (r === 'health_worker' || r === 'healthworker' || r === 'health_staff' || r === 'healthstaff' || r === 'health staff') return 'bi bi-person-lines-fill fs-5'
  if (r === 'parent' || r === 'guardian') return 'bi bi-person-hearts fs-5'
  if (r === 'system') return 'bi bi-gear-fill fs-5'
  return 'bi bi-person-circle fs-5'
}

const getRoleColor = (role) => {
  const r = String(role).toLowerCase()
  if (r === 'admin') return '#601fc2'
  if (r === 'health_worker' || r === 'healthworker' || r === 'health_staff' || r === 'healthstaff' || r === 'health staff') return '#00b2e3'
  if (r === 'parent' || r === 'guardian') return '#bc4e1e'
  if (r === 'system') return '#ff3a3a'
  return '#6c757d'
}
// Normalize action into a canonical type and a display label
const deriveAction = (raw) => {
  const s = String(raw || '').toLowerCase().trim()
  // Prefer exact token mapping when action_type is provided
  const token = s.replace(/\s+/g, '_')
  const map = {
    'notification_create': { type: 'notification_create', label: 'Notification Created' },
    'notification_send': { type: 'notification_send', label: 'Notification Sent' },
    'notification_fail': { type: 'notification_fail', label: 'Notification Failed' },
    'notification_read': { type: 'notification_read', label: 'Notification Read' },
    'notification_deleted': { type: 'notification_deleted', label: 'Notification Deleted' },
    'message_created': { type: 'message_created', label: 'Message Created' },
    'message_send': { type: 'message_send', label: 'Message Sent' },
    'message_fail': { type: 'message_fail', label: 'Message Failed' },
    'schedule_create': { type: 'schedule_create', label: 'Schedule Created' },
    'schedule_update': { type: 'schedule_update', label: 'Schedule Updated' },
    'schedule_update_summary': { type: 'schedule_update_summary', label: 'Schedule Update Summary' },
    'user_login': { type: 'user_login', label: 'User Login' },
    'user_login_failed': { type: 'user_login_failed', label: 'User Login Failed' },
    'user_logout': { type: 'user_logout', label: 'User Logout' },
    'security_lockout': { type: 'security_lockout', label: 'Account Locked' },
    'inventory_create': { type: 'inventory_create', label: 'Inventory Created' },
    'inventory_update': { type: 'inventory_update', label: 'Inventory Updated' },
    'inventory_delete': { type: 'inventory_delete', label: 'Inventory Deleted' },
    'inventory_stock_expired': { type: 'inventory_stock_expired', label: 'Stock Expired' },
    'system_start': { type: 'system_start', label: 'System Start' },
    'system_shutdown': { type: 'system_shutdown', label: 'System Shutdown' },
    'task_run': { type: 'task_run', label: 'Task Started' },
    'task_success': { type: 'task_success', label: 'Task Succeeded' },
    'task_failure': { type: 'task_failure', label: 'Task Failed' }
  }
  if (map[token]) return map[token]

  const includes = (k) => s.includes(k)
  if (s === 'login' || includes('log in') || includes('signin') || includes('sign in')) {
    return { type: 'login', label: 'Login' }
  }
  if (s === 'logout' || includes('log out') || includes('signout') || includes('sign out')) {
    return { type: 'logout', label: 'Logout' }
  }
  if (s === 'create' || includes('add') || includes('insert') || includes('register') || includes('new ')) {
    return { type: 'create', label: 'Create' }
  }
  if (s === 'update' || includes('edit') || includes('modify') || includes('change')) {
    return { type: 'update', label: 'Update' }
  }
  if (s === 'delete' || includes('remove') || includes('destroy')) {
    return { type: 'delete', label: 'Delete' }
  }
  if (s === 'view' || includes('read') || includes('open') || includes('viewed')) {
    return { type: 'view', label: 'View' }
  }
  if (includes('send') || includes('sent') || includes('message')) {
    return { type: 'send', label: 'Send Message' }
  }
  if (includes('deliver') || includes('delivered')) {
    return { type: 'deliver', label: 'Delivery' }
  }
  if (includes('notify') || includes('notification') || includes('broadcast')) {
    return { type: 'notify', label: 'Notification' }
  }
  const title = s
    .replace(/[\-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase())
  return { type: 'other', label: title || 'Unknown' }
}

// Normalize resource display
const normalizeResource = (raw) => {
  const original = String(raw || 'System').trim()
  const key = original.toLowerCase().replace(/[\s-]+/g, '_')
  const tableMap = {
    user: "User's Table",
    users: "User's Table",
    guardian: "Guardian's Table",
    guardians: "Guardian's Table",
    health_worker: "Health Staff's Table",
    health_workers: "Health Staff's Table",
    health_staff: "Health Staff's Table",
    child: "Patient's Table",
    children: "Patient's Table",
    patient: "Patient's Table",
    patients: "Patient's Table",
  }
  if (tableMap[key]) return tableMap[key]
  const pretty = original
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\s*\/\s*/g, ' / ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase())
  return pretty
}

// Match the list view timestamp extraction
const extractTimestamp = (raw) => {
  if (!raw || typeof raw !== 'object') return null
  const candidates = [
    raw.timestamp,
    raw.created_at, raw.createdAt,
    raw.occurred_at, raw.occurredAt,
    raw.logged_at, raw.loggedAt,
    raw.datetime, raw.date_time,
    raw.event_time, raw.action_time,
    raw.time, raw.date,
    raw.ts,
    (raw.metadata && (raw.metadata.timestamp || raw.metadata.time || raw.metadata.date)) || null,
    (raw.additional_data && (raw.additional_data.timestamp || raw.additional_data.time || raw.additional_data.date)) || null
  ]
  for (const val of candidates) {
    if (val === undefined || val === null || val === '') continue
    if (typeof val === 'number') {
      const ms = val < 1e12 ? val * 1000 : val
      const d = new Date(ms)
      if (!isNaN(d.getTime())) return d
      continue
    }
    if (typeof val === 'string') {
      const v = val.trim()
      if (!v) continue
      if (/^\d{10,13}$/.test(v)) {
        const num = Number(v)
        const ms = num < 1e12 ? num * 1000 : num
        const d = new Date(ms)
        if (!isNaN(d.getTime())) return d
        continue
      }
      const d = new Date(v)
      if (!isNaN(d.getTime())) return d
    }
    if (val instanceof Date && !isNaN(val.getTime())) return val
  }
  return null
}

const pickFirst = (...vals) => vals.find(v => v !== undefined && v !== null && v !== '')

const normalizeLog = (raw) => {
  const metadata = raw.metadata || raw.additional_data || {}
  const entityType = (pickFirst(
    raw.entity_type, raw.entityType, raw.resource_type, raw.table_name, raw.resource,
    metadata.entity_type, metadata.entityType
  ) || '').toString()
  const entityId = pickFirst(
    raw.entity_id, raw.entityId, raw.target_id, raw.targetId,
    metadata.entity_id, metadata.entityId, metadata.target_id, metadata.targetId
  )
  // Build actor name from separate parts to ensure proper display
  const actorFirstName = pickFirst(
    raw.first_name, raw.firstname, raw.firstName,
    raw.given_name, raw.givenName,
    metadata?.first_name, metadata?.firstname, metadata?.firstName,
    metadata?.given_name, metadata?.givenName
  )
  const actorMiddleName = pickFirst(
    raw.middle_name, raw.middlename, raw.middleName, raw.middle,
    metadata?.middle_name, metadata?.middlename, metadata?.middleName, metadata?.middle
  )
  const actorSurname = pickFirst(
    raw.last_name, raw.lastname, raw.lastName, raw.surname, raw.sur_name,
    metadata?.last_name, metadata?.lastname, metadata?.lastName, metadata?.surname, metadata?.sur_name
  )
  const actorFromParts = [actorFirstName, actorMiddleName, actorSurname].filter(Boolean).join(' ')
  const actorName = pickFirst(
    raw.display_user_name,
    raw.user_fullname,
    raw.full_name,
    raw.name,
    actorFromParts,
    raw.username,
  ) || ''
  const actorRole = formatUserRole(raw.user_role || '')
  const resourceRaw = entityType || raw.resource || raw.table_name || 'System'
  const descriptionRaw = raw.full_description || raw.description || raw.details
  const base = {
    id: raw.log_id || raw.id,
    timestamp: extractTimestamp(raw),
  userId: pickFirst(raw.user_id, raw.actor_id, raw.performed_by_id, metadata?.user_id, metadata?.actor_id),
    userFullName: actorName || 'Unknown User',
    userRole: raw.user_role || 'Unknown',
    ...(() => { const aRaw = raw.action_type || raw.action || raw.actionName || raw.event || raw.display_action || raw.description; const a = deriveAction(aRaw); return { actionType: a.type, displayAction: a.label } })(),
    entityType,
    entityId,
    resource: resourceRaw,
    displayResource: normalizeResource(resourceRaw),
    ipAddress: raw.ip_address || 'N/A',
    status: raw.status || (raw.success ? 'success' : 'failed'),
    userAgent: raw.user_agent,
  description: descriptionRaw,
    metadata,
    rawOriginal: raw,
  }
  return {
    ...base,
    displayDescription: sanitizeDescription(descriptionRaw, metadata, { actorName, actorRole })
  }
}

// Cache for entity name resolutions by type:id
const entityNameCache = new Map()

const tryGetDisplayName = (obj) => {
  if (!obj) return ''
  const root = obj.data ?? obj
  const get = (o, path) => {
    if (!o || !path) return undefined
    const segs = path.split('.')
    let cur = o
    for (const s of segs) {
      if (cur && typeof cur === 'object' && s in cur) {
        cur = cur[s]
      } else {
        return undefined
      }
    }
    return cur
  }
  const toStr = (v) => typeof v === 'string' ? v.trim() : ''
  const combine = (a, b) => {
    const sa = toStr(a)
    const sb = toStr(b)
    return sa && sb ? `${sa} ${sb}` : ''
  }
  const composeParts = (o) => {
    if (!o || typeof o !== 'object') return ''
    const first = toStr(o.first_name) || toStr(o.firstname) || toStr(o.firstName) || toStr(o.given_name) || toStr(o.givenName)
    const middle = toStr(o.middle_name) || toStr(o.middlename) || toStr(o.middleName) || toStr(o.middle)
    const last = toStr(o.last_name) || toStr(o.lastname) || toStr(o.lastName) || toStr(o.surname) || toStr(o.sur_name)
    const parts = [first, middle, last].filter(Boolean)
    return parts.length ? parts.join(' ') : ''
  }
  const candidates = [
    // Common person/entity names (flat)
    toStr(root.full_name),
    toStr(root.display_name),
    toStr(root.user_fullname),
    toStr(root.name),
    combine(root.first_name, root.last_name),
    composeParts(root),
    toStr(root.child_name),
    combine(root.given_name, root.surname),
    // CamelCase variants some APIs use
    toStr(root.fullName),
    toStr(root.displayName),
    toStr(root.userFullName),
    toStr(root.childName),
    combine(root.firstName, root.lastName),
    combine(root.firstname, root.lastname),
    combine(root.firstname, root.surname),
    composeParts({ firstName: root.firstName, middleName: root.middleName, lastName: root.lastName, surname: root.surname }),
    combine(root.givenName, root.surname),
    // Nested common containers
    toStr(get(root, 'user.full_name')),
    toStr(get(root, 'user.display_name')),
    toStr(get(root, 'user.name')),
    combine(get(root, 'user.first_name'), get(root, 'user.last_name')),
    composeParts(get(root, 'user')),
    toStr(get(root, 'account.full_name')),
    combine(get(root, 'account.firstname'), get(root, 'account.surname')),
    combine(get(root, 'account.first_name'), get(root, 'account.surname')),
    toStr(get(root, 'account.display_name')),
    toStr(get(root, 'profile.full_name')),
    combine(get(root, 'profile.firstname'), get(root, 'profile.surname')),
    composeParts(get(root, 'profile')),
    toStr(get(root, 'profile.display_name')),
    toStr(get(root, 'data.full_name')),
    combine(get(root, 'data.firstname'), get(root, 'data.surname')),
    composeParts(get(root, 'data')),
    toStr(get(root, 'record.full_name')),
    combine(get(root, 'record.firstname'), get(root, 'record.surname')),
    composeParts(get(root, 'record')),
    // Vaccine-specific fields
    toStr(root.brand_name),
    toStr(root.antigen_name),
    toStr(root.brandName),
    toStr(root.antigenName),
    // Fallback to username if only that exists
    toStr(root.username),
    toStr(get(root, 'user.username')),
  ]
  return candidates.find(x => x && x.length > 0) || ''
}

const _resolveEntityName = async (type, id) => {
  if (!type || !id) return ''
  const key = `${String(type).toLowerCase()}:${id}`
  if (entityNameCache.has(key)) return entityNameCache.get(key)

  const t = String(type).toLowerCase().replace(/[^a-z0-9]+/g, '_')
  const idStr = encodeURIComponent(id)
  const candidates = []
  if (['admin', 'user', 'health_worker', 'healthstaff', 'health_staff', 'guardian', 'parent'].includes(t)) {
    if (t === 'guardian' || t === 'parent') {
      candidates.push(`/guardians/${idStr}`)
    }
    candidates.push(`/users/${idStr}`)
  } else if (['child', 'patient'].includes(t)) {
    candidates.push(`/children/${idStr}`)
    candidates.push(`/patients/${idStr}`)
  } else if (t === 'appointment') {
    candidates.push(`/appointments/${idStr}`)
  } else if (['vaccine', 'vaccines'].includes(t)) {
    candidates.push(`/vaccines/${idStr}`)
  } else if (['immunization', 'immunizations'].includes(t)) {
    candidates.push(`/immunizations/${idStr}`)
  } else if (['message', 'messages'].includes(t)) {
    candidates.push(`/messages/${idStr}`)
  } else {
    // heuristic: plural resource
    candidates.push(`/${t.replace(/_+/g,'-')}/${idStr}`)
  }

  for (const path of candidates) {
    try {
      const res = await api.get(path)
      const name = tryGetDisplayName(res.data)
      if (name) {
        entityNameCache.set(key, name)
        return name
      }
    } catch (e) {
      // continue
    }
  }
  entityNameCache.set(key, '')
  return ''
}

// Map entity type or user record role to a displayable role label
const mapEntityTypeToRole = (type, record) => {
  const t = String(type || '').toLowerCase()
  if (t === 'guardian' || t === 'parent') return 'Guardian'
  if (t === 'child' || t === 'patient') return 'Patient'
  if (t === 'health_worker' || t === 'healthstaff' || t === 'health_staff') return 'Health Staff'
  if (t === 'admin') return 'Admin'
  if (t === 'user') {
    const r = (record && (record.role || record.user_role || record.account_role || record.account_type)) || ''
    return formatUserRole(r) || 'User'
  }
  return ''
}

const isPersonRole = (role) => {
  const r = String(role || '').toLowerCase()
  return ['admin', 'guardian', 'health staff', 'patient', 'user'].includes(r)
}

// Resolve both subject name and role
const resolveEntityInfo = async (type, id) => {
  if (!type || !id) return { name: '', role: '' }
  const t = String(type).toLowerCase().replace(/[^a-z0-9]+/g, '_')
  const idStr = encodeURIComponent(id)
  const candidates = []
  if (['admin', 'user', 'health_worker', 'healthstaff', 'health_staff', 'guardian', 'parent'].includes(t)) {
    if (t === 'guardian' || t === 'parent') {
      candidates.push(`/guardians/${idStr}`)
    }
    candidates.push(`/users/${idStr}`)
  } else if (['child', 'patient'].includes(t)) {
    candidates.push(`/children/${idStr}`)
    candidates.push(`/patients/${idStr}`)
  } else if (t === 'appointment') {
    candidates.push(`/appointments/${idStr}`)
  } else if (['vaccine', 'vaccines'].includes(t)) {
    candidates.push(`/vaccines/${idStr}`)
  } else if (['immunization', 'immunizations'].includes(t)) {
    candidates.push(`/immunizations/${idStr}`)
  } else if (['message', 'messages'].includes(t)) {
    candidates.push(`/messages/${idStr}`)
  } else {
    candidates.push(`/${t.replace(/_+/g,'-')}/${idStr}`)
  }
  for (const path of candidates) {
    try {
      const res = await api.get(path)
      const data = res.data?.data || res.data
      const name = tryGetDisplayName(data)
      const role = mapEntityTypeToRole(type, data)
      if (name || role) return { name, role }
    } catch {}
  }
  return { name: '', role: '' }
}

const loadLog = async () => {
  loading.value = true
  try {
    const id = route.params.id
    // 0) Use pre-selected log from store if it matches
    if (activityLogStore.selectedLog && String(activityLogStore.selectedLog?.id) === String(id)) {
      log.value = normalizeLog(activityLogStore.selectedLog)
      // do not return; still try to refresh from server below
    }
    // 1) Try direct endpoint
    try {
      const res = await api.get(`/activity-logs/${id}`)
      const data = res.data?.data || res.data
      if (data) {
        log.value = normalizeLog(data)
        return
      }
    } catch (e) {
      // proceed to fallback
    }

    // 2) Try list endpoint with id filter (common variants)
    const attempts = [
      { id },
      { log_id: id },
      { activity_id: id },
      { audit_id: id },
      { event_id: id },
      { ids: id },
      { search: id }
    ]

    for (const params of attempts) {
      try {
        const listRes = await api.get('/activity-logs', { params: { page: 1, limit: 100, ...params } })
        const payload = listRes.data?.data || listRes.data
        const items = payload?.items || payload || []
        const arr = Array.isArray(items) ? items : []
        const found = arr.find(item => String(item.log_id || item.id || item.activity_id || item.audit_id || item.event_id) === String(id))
        if (found) {
          log.value = normalizeLog(found)
          return
        }
      } catch (e) {
        // try next attempt
      }
    }

    // 3) Not found
    // last attempt: localStorage snapshot
    try {
      const snap = JSON.parse(localStorage.getItem('activityLog:selected') || 'null')
      if (snap && String(snap.id) === String(id)) {
        log.value = normalizeLog(snap)
        return
      }
    } catch {}
    log.value = null
  } finally {
    loading.value = false
  }
}

onMounted(loadLog)

// After log is loaded, attempt resolving subject name if we have entityType/id
watch(
  () => log.value && `${log.value.entityType}:${log.value.entityId}`,
  async (key) => {
    if (!key || !log.value) return
    const { entityType, entityId, metadata, description, userRole, userFullName } = log.value
    const info = await resolveEntityInfo(entityType, entityId)
    if (info.name) {
      log.value.displaySubjectName = info.name
      log.value.displaySubjectRole = info.role
      log.value.displayDescription = sanitizeDescription(
        description,
        metadata,
        { actorName: userFullName, actorRole: formatUserRole(userRole), subjectName: info.name, subjectRole: info.role, entityType, entityId }
      )
    }
  },
  { immediate: false }
)

// Resolve actor's full name when only username is present
const actorNameCache = new Map()
const resolveActorName = async (userId) => {
  if (!userId) return ''
  const key = String(userId)
  if (actorNameCache.has(key)) return actorNameCache.get(key)
  try {
    const res = await api.get(`/users/${encodeURIComponent(userId)}`)
    const name = tryGetDisplayName(res.data)
    actorNameCache.set(key, name || '')
    return name || ''
  } catch {
    actorNameCache.set(key, '')
    return ''
  }
}

watch(
  () => log.value && log.value.userId,
  async (uid) => {
    if (!uid || !log.value) return
    // Heuristic: prefer values containing a space (likely full name). If not, try resolving.
    const current = log.value.userFullName || ''
    const looksLikeUsername = current && !current.includes(' ')
    if (!current || looksLikeUsername) {
      const name = await resolveActorName(uid)
      if (name) {
        log.value.userFullName = name
        // Recompute description to reflect updated actor name
        const { metadata, description, userRole, displaySubjectName, displaySubjectRole, entityType, entityId } = log.value
        log.value.displayDescription = sanitizeDescription(
          description,
          metadata,
          { actorName: name, actorRole: formatUserRole(userRole), subjectName: displaySubjectName, subjectRole: displaySubjectRole, entityType, entityId }
        )
      }
    }
  },
  { immediate: true }
)
</script>
