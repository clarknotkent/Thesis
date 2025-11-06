<template>
  <div 
    class="notification-item"
    :class="{ unread: !read }"
    @click="$emit('click', $props)"
  >
    <div class="notification-icon" :class="type">
      <i :class="iconClass"></i>
    </div>
    <div class="notification-content">
      <div class="notification-header">
        <h6 class="notification-title">{{ title || 'Notification' }}</h6>
        <div class="notification-actions">
          <small class="notification-time">{{ displayTime }}</small>
          <button 
            v-if="showDelete"
            class="delete-btn"
            @click.stop="$emit('delete', $props)"
            title="Delete"
          >
            <i class="bi bi-x"></i>
          </button>
        </div>
      </div>
      <p class="notification-message">{{ message }}</p>
      <div class="notification-footer" v-if="channel">
        <span class="notification-channel">
          <i :class="channelIcon"></i>
          {{ channelLabel }}
        </span>
      </div>
      <span v-if="!read" class="unread-indicator"></span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  id: [String, Number],
  title: String,
  message: String,
  type: { type: String, default: 'system' },
  time: String, // preformatted time
  created_at: String, // raw ISO
  channel: String,
  read: { type: Boolean, default: false },
  showDelete: { type: Boolean, default: false },
})

const displayTime = computed(() => {
  if (props.time) return props.time
  if (!props.created_at) return ''
  const d = new Date(props.created_at)
  // Relative-ish: show "Just now", "xh ago", or date
  const now = new Date()
  const diffMs = now - d
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return d.toLocaleDateString()
})

const iconClass = computed(() => {
  const map = {
    urgent: 'bi bi-exclamation-triangle-fill',
    appointment: 'bi bi-calendar-check-fill',
    system: 'bi bi-gear-fill',
    reminder: 'bi bi-clock-fill',
    info: 'bi bi-info-circle-fill'
  }
  return map[props.type] || map.info
})

const channelIcon = computed(() => {
  const ch = String(props.channel || '').toLowerCase()
  if (ch === 'sms') return 'bi bi-chat'
  if (ch === 'email') return 'bi bi-envelope'
  return 'bi bi-app'
})

const channelLabel = computed(() => {
  // Normalize to user-friendly
  const ch = String(props.channel || '').toLowerCase()
  if (!ch) return ''
  if (ch === 'push' || ch === 'inapp' || ch === 'in-app') return 'in-app'
  return ch
})
</script>

<style scoped>
.notification-item {
  display: flex;
  padding: 1rem;
  border-bottom: 1px solid #f1f3f4;
  transition: background-color 0.2s ease;
  position: relative;
  cursor: pointer;
  background: #fff;
}
.notification-item.unread {
  background-color: #fffbf0;
  border-left: 3px solid #ffc107;
}
.notification-item:hover { background-color: #f8f9fa; }
.notification-icon { width: 40px; height: 40px; border-radius: 50%; display:flex; align-items:center; justify-content:center; color:#fff; font-size:1.2rem; margin-right: .75rem; flex-shrink:0; }
.notification-icon.urgent { background: #dc3545; }
.notification-icon.appointment { background: #28a745; }
.notification-icon.system { background: #6c757d; }
.notification-icon.reminder { background: #ffc107; color: #212529; }
.notification-content { flex:1; min-width:0; }
.notification-header { display:flex; justify-content:space-between; align-items:flex-start; gap:.5rem; margin-bottom:.25rem; }
.notification-title { font-weight:600; margin:0; color:#333; font-size:.95rem; }
.notification-actions { display:flex; align-items:center; gap:.5rem; flex-shrink:0; }
.notification-time { color:#6c757d; font-size:.75rem; white-space:nowrap; }
.delete-btn { background:none; border:none; color:#dc3545; cursor:pointer; padding:0; width:20px; height:20px; display:flex; align-items:center; justify-content:center; border-radius:50%; transition: background-color .2s; opacity:0; }
.notification-item:hover .delete-btn { opacity:1; }
.delete-btn:hover { background: rgba(220,53,69,.1); }
.notification-message { margin:0 0 .5rem 0; color:#555; font-size:.875rem; line-height:1.4; }
.notification-footer { display:flex; align-items:center; gap:.5rem; }
.notification-channel { display:inline-flex; align-items:center; gap:.25rem; font-size:.75rem; color:#6c757d; background:#f8f9fa; padding:.25rem .5rem; border-radius:.25rem; }
.unread-indicator { position:absolute; top:1rem; right:1rem; width:8px; height:8px; background:#ffc107; border-radius:50%; }
</style>