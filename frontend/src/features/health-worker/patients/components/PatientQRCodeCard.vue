<template>
  <div class="qr-code-card">
    <div class="qr-code-header">
      <i class="bi bi-qr-code-scan" />
      <h3 class="card-title">
        Patient QR Code
      </h3>
    </div>
    <div class="qr-code-content">
      <div class="qr-code-container">
        <canvas
          ref="qrCanvas"
          width="200"
          height="200"
        />
        <p
          v-if="!qrUrl"
          class="qr-error"
        >
          QR Code not available
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import QRCode from 'qrcode'

const props = defineProps({
  patient: {
    type: Object,
    required: false,
    default: null
  }
})

const qrCanvas = ref(null)

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

const qrUrl = computed(() => props.patient?.qr?.url || fallbackFrontendUrl.value)

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

// Watch for patient data changes
watch(() => props.patient?.qr, async (newQR) => {
  if (newQR?.url) {
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
}
</style>
