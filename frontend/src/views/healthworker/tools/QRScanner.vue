<template>
  <HealthWorkerLayout>
    <div class="qr-scanner-page">
      <div class="scanner-header">
        <h5 class="mb-1">
          <i class="bi bi-qr-code-scan me-2" />Scan Patient QR
        </h5>
        <p class="text-muted small mb-1">
          Point the camera at the QR. It will auto-redirect when detected.
        </p>
        <div class="small">
          <span class="badge bg-secondary me-2">Role: {{ displayRole }}</span>
          <span
            v-if="displayName"
            class="text-muted"
          >User: {{ displayName }}</span>
        </div>
      </div>

      <div class="scanner-container">
        <div class="video-wrapper">
          <video
            ref="videoEl"
            autoplay
            playsinline
            muted
          />
          <div class="scan-overlay">
            <div class="corner tl" /><div class="corner tr" />
            <div class="corner bl" /><div class="corner br" />
          </div>
        </div>
      </div>

      <div class="controls">
        <div class="row g-2 align-items-center">
          <div class="col-8">
            <select
              v-model="selectedDeviceId"
              class="form-select form-select-sm"
              @change="restart"
            >
              <option
                v-for="d in devices"
                :key="d.deviceId"
                :value="d.deviceId"
              >
                {{ d.label || 'Camera' }}
              </option>
            </select>
          </div>
          <div class="col-4 d-flex justify-content-end">
            <button
              class="btn btn-sm btn-outline-secondary me-2"
              :disabled="!canTorch"
              @click="toggleTorch"
            >
              <i
                class="bi"
                :class="torchOn ? 'bi-lightbulb-fill' : 'bi-lightbulb'"
              /> Torch
            </button>
            <button
              class="btn btn-sm"
              :class="isRunning ? 'btn-danger' : 'btn-primary'"
              @click="isRunning ? stop() : start()"
            >
              <i
                class="bi"
                :class="isRunning ? 'bi-stop-fill' : 'bi-play-fill'"
              />
              <span class="ms-1">{{ isRunning ? 'Stop' : 'Start' }}</span>
            </button>
          </div>
        </div>
      </div>

      <div class="fallback mt-3">
        <label class="form-label small text-muted">Or paste QR link</label>
        <div class="input-group input-group-sm">
          <input
            v-model="manualText"
            type="text"
            class="form-control"
            placeholder="https://... or patient ID"
          >
          <button
            class="btn btn-outline-primary"
            @click="handleResult(manualText)"
          >
            Go
          </button>
        </div>
      </div>

      <div
        v-if="message"
        class="alert alert-info py-2 mt-3"
      >
        <i class="bi bi-info-circle me-2" />{{ message }}
      </div>

      <div
        v-if="error"
        class="alert alert-danger py-2 mt-3"
      >
        <i class="bi bi-exclamation-triangle me-2" />{{ error }}
      </div>
    </div>
  </HealthWorkerLayout>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import HealthWorkerLayout from '@/components/layout/mobile/HealthWorkerLayout.vue'
import { BrowserMultiFormatReader, BrowserQRCodeReader } from '@zxing/browser'
import { useToast } from '@/composables/useToast'
import { getRole, getUser } from '@/services/auth'

const router = useRouter()
const { addToast } = useToast()

const videoEl = ref(null)
// Prefer QR-only reader for better detection performance
const reader = new BrowserQRCodeReader()
const devices = ref([])
const selectedDeviceId = ref('')
const isRunning = ref(false)
const torchOn = ref(false)
const canTorch = ref(false)
const message = ref('')
const error = ref('')
const manualText = ref('')
let currentStream = null
let handled = false
let statusTimer = null
const displayRole = ref('')
const displayName = ref('')

const listDevices = async () => {
  try {
    const inputs = await BrowserMultiFormatReader.listVideoInputDevices()
    devices.value = inputs
    // Prefer back camera
    const back = inputs.find(d => /back|rear/i.test(d.label)) || inputs.at(-1) || inputs[0]
    selectedDeviceId.value = back?.deviceId || inputs[0]?.deviceId || ''
  } catch (e) {
    console.error('List devices failed', e)
  }
}

const stop = () => {
  try { reader.reset() } catch {}
  if (currentStream) {
    currentStream.getTracks().forEach(t => t.stop())
    currentStream = null
  }
  isRunning.value = false
  torchOn.value = false
  canTorch.value = false
  if (statusTimer) { clearTimeout(statusTimer); statusTimer = null }
}

const restart = async () => {
  stop()
  await start()
}

const enableTorchIfSupported = () => {
  try {
    const track = currentStream?.getVideoTracks?.()[0]
    if (!track) return
    const caps = track.getCapabilities?.()
    canTorch.value = !!caps?.torch
  } catch {}
}

const toggleTorch = async () => {
  try {
    const track = currentStream?.getVideoTracks?.()[0]
    if (!track) return
    const caps = track.getCapabilities?.()
    if (!caps?.torch) return
    torchOn.value = !torchOn.value
    await track.applyConstraints({ advanced: [{ torch: torchOn.value }] })
  } catch (e) {
    console.warn('Torch toggle failed', e)
  }
}

const start = async () => {
  message.value = ''
  error.value = ''
  handled = false
  try {
    await nextTick()
    isRunning.value = true
    const onResult = (result, err, controls) => {
      if (result && !handled) {
        handled = true
        message.value = 'QR detected. Redirecting…'
        try { console.debug('[QRScanner] raw result:', result?.getText?.() || String(result)) } catch {}
        // Announce role on scan
        try {
          const role = getRole() || ''
          addToast({ title: 'QR scanned', message: `Your role: ${role || 'unknown'}`, type: 'info' })
          console.debug('[QRScanner] current role:', role)
        } catch {}
        // capture stream reference for torch
        if (!currentStream) {
          try { currentStream = videoEl.value?.srcObject || videoEl.value?.captureStream?.() } catch {}
        }
        try { controls?.stop() } catch {}
        stop()
        const text = result.getText?.() || String(result)
        handleResult(text)
      }
      if (err && err.name && err.name !== 'NotFoundException') {
        // Other decode errors are noisy; ignore continuously
        try { console.debug('[QRScanner] decode error:', err?.name) } catch {}
      }
    }

    if (selectedDeviceId.value) {
      // Use a specific camera if chosen
      await reader.decodeFromVideoDevice(selectedDeviceId.value, videoEl.value, onResult)
    } else {
      // Fallback: request environment/back camera via constraints
      await reader.decodeFromConstraints(
        { video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } } },
        videoEl.value,
        onResult
      )
    }
    // try to get stream to check torch
    try {
      const el = videoEl.value
      currentStream = el?.srcObject || currentStream
      enableTorchIfSupported()
    } catch {}
    // Announce scanner readiness
    try { addToast({ title: 'Scanner ready', message: 'Point camera at the QR code.', type: 'info' }) } catch {}
    // After a few seconds, reassure it's still scanning
    statusTimer = setTimeout(() => {
      if (isRunning.value && !handled) {
        try { addToast({ title: 'Still scanning…', message: 'Ensure good lighting and fill the frame.', type: 'info' }) } catch {}
      }
    }, 6000)
  } catch (e) {
    console.error('Start scanner failed', e)
    error.value = 'Unable to access camera. You can paste the QR link below.'
    try {
      const msg = e?.message?.includes('secure context') ? 'Camera requires HTTPS or localhost on this device.' : 'Camera not available. Use paste box below.'
      addToast({ title: 'Camera error', message: msg, type: 'error' })
    } catch {}
    isRunning.value = false
  }
}

function isUrl(str) {
  try { new URL(str); return true } catch { return false }
}

const extractPatientId = (text) => {
  // Try to parse known patterns: /qr/p/:id, /patient/:id, /admin/patients/view/:id, /healthworker/patients/:id, /parent/records/:id, /parent/child-info/:childId
  try {
    if (isUrl(text)) {
      const u = new URL(text)
      const parts = u.pathname.split('/').filter(Boolean)
      // backend public QR: /qr/p/:id
      if (parts.length >= 3 && parts[0] === 'qr' && parts[1] === 'p' && parts[2]) return parts[2]
      // neutral route: /patient/:id
      if (parts.length >= 2 && parts[0] === 'patient' && parts[1]) return parts[1]
      // admin views: /admin/patients/view/:id or /admin/patients/:id
      if (parts[0] === 'admin' && parts[1] === 'patients') {
        if (parts[2] === 'view' && parts[3]) return parts[3]
        if (parts[2]) return parts[2]
      }
      // healthworker: /healthworker/patients/:id
      if (parts[0] === 'healthworker' && parts[1] === 'patients' && parts[2]) return parts[2]
      // parent: /parent/records/:id or /parent/child-info/:childId
      if (parts[0] === 'parent') {
        if (parts[1] === 'records' && parts[2]) return parts[2]
        if (parts[1] === 'child-info' && parts[2]) return parts[2]
      }
    }
  } catch {}
  // Fallback: looks like a UUID/id
  if (/^[A-Za-z0-9_-]{6,}$/.test(text)) return text
  return null
}

const handleResult = (text) => {
  if (!text) return
  try { console.debug('[QRScanner] handleResult text:', text) } catch {}
  // If it’s the public QR URL, navigate there to keep backend verification
  if (isUrl(text)) {
    try {
      const u = new URL(text)
      // If this is a backend QR link like /qr/p/:id, prefer in-app redirect to avoid cross-origin auth loss
      const parts = u.pathname.split('/').filter(Boolean)
      const isQrPath = parts[0] === 'qr' && parts[1] === 'p' && parts[2]
      if (isQrPath) {
        const pid = parts[2]
        try { console.debug('[QRScanner] detected backend QR; extracted patientId:', pid) } catch {}
        addToast({ title: 'QR scanned', message: 'Redirecting to patient…', type: 'success' })
        setTimeout(() => {
          router.replace({ name: 'PatientRoute', params: { id: pid } })
        }, 500)
        return
      }
    } catch {}
    try { addToast({ title: 'QR scanned', message: 'Opening patient record…', type: 'success' }) } catch {}
    setTimeout(() => {
      window.location.assign(text)
    }, 500)
    return
  }
  // Otherwise, try to extract patientId and go to neutral route
  const pid = extractPatientId(text)
  if (pid) {
    try { console.debug('[QRScanner] extracted patientId from text:', pid) } catch {}
    try { addToast({ title: 'QR scanned', message: 'Redirecting to patient…', type: 'success' }) } catch {}
    setTimeout(() => {
      router.replace({ name: 'PatientRoute', params: { id: pid } })
    }, 500)
  } else {
    error.value = 'Unrecognized QR content.'
    try { addToast({ title: 'Scan failed', message: 'Unrecognized QR content.', type: 'error' }) } catch {}
    try { console.warn('[QRScanner] Unrecognized QR content') } catch {}
  }
}

onMounted(async () => {
  // Populate display role/name at page open
  try {
    const role = (getRole() || '').toString()
    displayRole.value = role
    const u = getUser()
    if (u) displayName.value = [u.firstname, u.surname].filter(Boolean).join(' ')
    console.debug('[QRScanner] user context:', { role, id: u?.user_id || u?.id, name: displayName.value })
  } catch {}
  await listDevices()
  await start()
})

onBeforeUnmount(() => {
  stop()
})
</script>

<style scoped>
.qr-scanner-page { padding: 12px; }
.scanner-header { margin-bottom: 8px; }
.scanner-container { display: flex; justify-content: center; }
.video-wrapper { position: relative; width: 100%; max-width: 520px; aspect-ratio: 3/4; background: #000; border-radius: 8px; overflow: hidden; }
video { width: 100%; height: 100%; object-fit: cover; }
.scan-overlay { position: absolute; inset: 12% 10%; border: 2px dashed rgba(255,255,255,0.35); border-radius: 8px; pointer-events: none; }
.corner { position: absolute; width: 22px; height: 22px; border: 3px solid #0d6efd; }
.corner.tl { top: -3px; left: -3px; border-right: 0; border-bottom: 0; }
.corner.tr { top: -3px; right: -3px; border-left: 0; border-bottom: 0; }
.corner.bl { bottom: -3px; left: -3px; border-right: 0; border-top: 0; }
.corner.br { bottom: -3px; right: -3px; border-left: 0; border-top: 0; }
.controls { margin-top: 10px; }
</style>
