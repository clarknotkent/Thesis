<template>
  <div class="qr-code-card">
    <div class="qr-code-header">
      <i class="bi bi-qr-code-scan"></i>
      <h3 class="card-title">Patient QR Code</h3>
    </div>
    <div class="qr-code-content">
      <div class="qr-code-container">
        <canvas ref="qrCanvas" width="200" height="200"></canvas>
        <p v-if="!qrUrl" class="qr-error">QR Code not available</p>
      </div>
      <div v-if="qrUrl" class="qr-actions">
        <a :href="qrUrl" target="_blank" rel="noreferrer" class="qr-link">
          <i class="bi bi-box-arrow-up-right"></i>
          Open Link
        </a>
        <button v-if="allowRefresh" class="refresh-qr-button" @click="refreshQR">
          <i class="bi bi-arrow-clockwise"></i>
          Refresh QR
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import QRCode from 'qrcode'
import api from '@/services/offlineAPI'

const props = defineProps({
  patient: {
    type: Object,
    required: true
  },
  allowRefresh: {
    type: Boolean,
    default: true
  }
})

const qrCanvas = ref(null)
const qrData = ref(null)

const patientId = computed(() => props.patient?.patient_id || props.patient?.id)
const fallbackFrontendUrl = computed(() => {
  const id = patientId.value
  if (!id) return null
  try {
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    return `${origin}/patient/${id}`
  } catch (_) {
    return `/patient/${id}`
  }
})

const qrUrl = computed(() => qrData.value?.url || props.patient?.qr?.url || fallbackFrontendUrl.value)

const renderQR = async () => {
  if (qrCanvas.value && qrUrl.value) {
    try {
      await QRCode.toCanvas(qrCanvas.value, qrUrl.value, { 
        width: 200,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      })
      console.log('✅ QR code rendered successfully')
    } catch (error) {
      console.error('❌ Error rendering QR code:', error)
      // Fallback display
      const ctx = qrCanvas.value.getContext('2d')
      ctx.clearRect(0, 0, qrCanvas.value.width, qrCanvas.value.height)
      ctx.fillStyle = '#6b7280'
      ctx.font = '14px Arial'
      ctx.textAlign = 'center'
      ctx.fillText('QR Generation Error', 100, 90)
      ctx.fillText('Use link below', 100, 110)
    }
  }
}

const refreshQR = async () => {
  try {
    const patientId = props.patient?.patient_id || props.patient?.id
    const response = await api.post(`/qr/patients/${patientId}`)
    qrData.value = response.data.data
    await nextTick()
    await renderQR()
    console.log('✅ QR code refreshed')
  } catch (error) {
    console.error('❌ Error refreshing QR code:', error)
    alert('Failed to refresh QR code. Please try again.')
  }
}

// Watch for patient data changes
watch(() => props.patient?.qr, async (newQR) => {
  if (newQR?.url) {
    await nextTick()
    await renderQR()
  }
}, { deep: true })

// Watch for qrData changes
watch(() => qrData.value, async (newData) => {
  if (newData?.url) {
    await nextTick()
    await renderQR()
  }
}, { deep: true })

onMounted(async () => {
  await nextTick()
  if (qrUrl.value) {
    await renderQR()
  }
})

// Re-render when qrUrl becomes available (e.g., after patient loads) or changes
watch(qrUrl, async (newVal, oldVal) => {
  if (newVal && newVal !== oldVal) {
    await nextTick()
    await renderQR()
  }
})

// Also react when patientId changes (covers cases where qrUrl is fallback based on id)
watch(patientId, async (newId, oldId) => {
  if (newId && newId !== oldId && qrUrl.value) {
    await nextTick()
    await renderQR()
  }
})
</script>

<style scoped>
.qr-code-card {
  background: #007bff;
  border-radius: 1rem;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
}

.qr-code-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1.25rem 1.5rem;
  background: #007bff;
  color: white;
}

.qr-code-header i {
  font-size: 1.75rem;
}

.card-title {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0;
}

.qr-code-content {
  padding: 2rem 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  background: white;
}

.qr-code-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

canvas {
  border: 2px solid #e5e7eb;
  border-radius: 0.5rem;
  background: white;
}

.qr-error {
  font-size: 0.875rem;
  color: #dc2626;
  margin-top: 0.5rem;
  text-align: center;
}

.qr-actions {
  display: flex;
  gap: 0.75rem;
  width: 100%;
}

.qr-link {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.875rem 1rem;
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.qr-link:hover {
  background: #e5e7eb;
  color: #1f2937;
  border-color: #9ca3af;
}

.refresh-qr-button {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.875rem 1rem;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 123, 255, 0.3);
}

.refresh-qr-button:hover {
  background: #0056b3;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 123, 255, 0.4);
}

.refresh-qr-button:active {
  transform: translateY(0);
}

.refresh-qr-button i,
.qr-link i {
  font-size: 1rem;
}

/* Mobile optimizations */
@media (max-width: 576px) {
  .qr-code-header {
    padding: 1rem 1.25rem;
  }
  
  .card-title {
    font-size: 1rem;
  }
  
  .qr-code-content {
    padding: 1.5rem 1.25rem;
  }
  
  canvas {
    width: 180px;
    height: 180px;
  }
  
  .qr-actions {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .qr-link,
  .refresh-qr-button {
    width: 100%;
  }
}
</style>
