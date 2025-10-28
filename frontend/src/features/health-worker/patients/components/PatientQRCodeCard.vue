<template>
  <div class="qr-code-card">
    <div class="qr-code-header">
      <i class="bi bi-qr-code-scan"></i>
      <h3 class="card-title">Patient QR Code</h3>
    </div>
    <div class="qr-code-content">
      <div class="qr-code-placeholder">
        <i class="bi bi-qr-code-scan qr-icon"></i>
        <p class="qr-id">ID: {{ patient?.patient_id || patient?.id }}</p>
      </div>
      <button class="view-qr-button" @click="openQRCode">
        <i class="bi bi-arrows-fullscreen"></i>
        View Full QR Code
      </button>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  patient: {
    type: Object,
    required: true
  }
})

const openQRCode = () => {
  // TODO: Implement QR code modal or full screen view
  alert(`Open QR Code for Patient ID: ${props.patient?.patient_id || props.patient?.id}`)
}
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

.qr-code-placeholder {
  width: 200px;
  height: 200px;
  border: 2px dashed #d1d5db;
  border-radius: 0.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  background: #f9fafb;
}

.qr-icon {
  font-size: 4rem;
  color: #9ca3af;
}

.qr-id {
  font-size: 0.875rem;
  font-weight: 600;
  color: #6b7280;
  margin: 0;
}

.view-qr-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 2rem;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 123, 255, 0.3);
}

.view-qr-button:hover {
  background: #0056b3;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 123, 255, 0.4);
}

.view-qr-button:active {
  transform: translateY(0);
}

.view-qr-button i {
  font-size: 1.125rem;
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
  
  .qr-code-placeholder {
    width: 180px;
    height: 180px;
  }
  
  .qr-icon {
    font-size: 3.5rem;
  }
  
  .view-qr-button {
    width: 100%;
    justify-content: center;
    padding: 0.875rem 1.5rem;
  }
}
</style>
