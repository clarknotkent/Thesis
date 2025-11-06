<template>
  <HealthWorkerLayout>
    <!-- Fixed Header -->
    <div class="inventory-details-header">
      <div class="header-content">
        <button
          class="btn-back"
          @click="handleBack"
        >
          <i class="bi bi-arrow-left" />
        </button>
        <div class="header-title">
          <h1>Inventory Details</h1>
        </div>
      </div>
    </div>

    <!-- Scrollable Content -->
    <div class="details-content-wrapper">
      <!-- Loading State -->
      <div
        v-if="loading"
        class="loading-section"
      >
        <div class="spinner" />
        <p>Loading inventory details...</p>
      </div>

      <!-- Error State -->
      <div
        v-else-if="error"
        class="error-section"
      >
        <i class="bi bi-exclamation-circle" />
        <p>{{ error }}</p>
        <button
          class="btn-retry"
          @click="fetchInventoryDetails"
        >
          <i class="bi bi-arrow-clockwise" />
          Retry
        </button>
      </div>

      <!-- Inventory Details -->
      <div
        v-else-if="inventory"
        class="details-container"
      >
        <!-- Status Banner -->
        <div
          class="status-banner"
          :class="statusBannerClass"
        >
          <i
            class="bi"
            :class="statusIcon"
          />
          <div class="status-info">
            <h3 class="status-title">
              {{ status }}
            </h3>
            <p class="status-subtitle">
              {{ statusMessage }}
            </p>
          </div>
        </div>

        <!-- Vaccine Information Card -->
        <div class="details-card">
          <div class="card-header">
            <i class="bi bi-shield-fill-check card-icon" />
            <h2 class="card-title">
              Item Information
            </h2>
          </div>
          <div class="card-body">
            <div class="detail-row">
              <span class="detail-label">Vaccine Name</span>
              <span class="detail-value">{{ vaccineName }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Category</span>
              <span class="detail-value">{{ prettyCategory }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Disease Prevented</span>
              <span class="detail-value">{{ diseasePrevented }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Brand Name</span>
              <span class="detail-value">{{ brandName }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Manufacturer</span>
              <span class="detail-value">{{ manufacturer }}</span>
            </div>
            <div
              v-if="showType"
              class="detail-row"
            >
              <span class="detail-label">Type</span>
              <span
                class="detail-value"
                style="display:flex; gap:0.5rem; justify-content:flex-end; align-items:center; flex-wrap:wrap;"
              >
                <span
                  v-if="programLabel"
                  class="type-badge"
                  :class="isNIP ? 'type-nip' : 'type-other'"
                >{{ programLabel }}</span>
                <span
                  v-if="vaccineType"
                  class="type-chip"
                >{{ vaccineType }}</span>
              </span>
            </div>
          </div>
        </div>

        <!-- Stock Information Card -->
        <div class="details-card">
          <div class="card-header">
            <i class="bi bi-clipboard-data card-icon" />
            <h2 class="card-title">
              Stock Information
            </h2>
          </div>
          <div class="card-body">
            <div class="detail-row">
              <span class="detail-label">Status</span>
              <span class="detail-value">
                <span
                  class="status-badge"
                  :class="statusBadgeClass"
                >{{ status }}</span>
              </span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Current Quantity</span>
              <span
                class="detail-value quantity-value"
                :class="quantityClass"
              >
                {{ currentQuantity }} {{ currentQuantity === 1 ? 'dose' : 'doses' }}
              </span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Lot Number</span>
              <span class="detail-value lot-number">{{ lotNumber }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Expiration Date</span>
              <span
                class="detail-value"
                :class="expirationClass"
              >{{ expirationDate }}</span>
            </div>
            <div
              v-if="daysUntilExpiry !== null"
              class="detail-row"
            >
              <span class="detail-label">Days Until Expiry</span>
              <span
                class="detail-value"
                :class="daysUntilExpiryClass"
              >
                {{ daysUntilExpiry }} {{ Math.abs(daysUntilExpiry) === 1 ? 'day' : 'days' }}
                {{ daysUntilExpiry < 0 ? 'ago' : '' }}
              </span>
            </div>
          </div>
        </div>

        <!-- Storage Information Card -->
        <div class="details-card">
          <div class="card-header">
            <i class="bi bi-building card-icon" />
            <h2 class="card-title">
              Storage & Location
            </h2>
          </div>
          <div class="card-body">
            <div class="detail-row">
              <span class="detail-label">Storage Location</span>
              <span class="detail-value">{{ storageLocation }}</span>
            </div>
            <div
              v-if="receivedDate"
              class="detail-row"
            >
              <span class="detail-label">Date Received</span>
              <span class="detail-value">{{ receivedDate }}</span>
            </div>
          </div>
        </div>

        <!-- Additional Information Card -->
        <div
          v-if="remarks"
          class="details-card"
        >
          <div class="card-header">
            <i class="bi bi-chat-left-text card-icon" />
            <h2 class="card-title">
              Additional Information
            </h2>
          </div>
          <div class="card-body">
            <p class="remarks-text">
              {{ remarks }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </HealthWorkerLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import HealthWorkerLayout from '@/components/layout/mobile/HealthWorkerLayout.vue'
import api from '@/services/api'

const router = useRouter()
const route = useRoute()

// State
const loading = ref(true)
const error = ref(null)
const inventory = ref(null)

// Computed properties
const vaccineName = computed(() => {
  return inventory.value?.vaccinemaster?.antigen_name || 
         inventory.value?.vaccine_name || 
         'Unknown Vaccine'
})

const diseasePrevented = computed(() => {
  return inventory.value?.vaccinemaster?.disease_prevented || 
         inventory.value?.disease_prevented || 
         'N/A'
})

const brandName = computed(() => {
  return inventory.value?.vaccinemaster?.brand_name || 
         inventory.value?.brand_name || 
         'Generic'
})

const manufacturer = computed(() => {
  return inventory.value?.vaccinemaster?.manufacturer || 
         inventory.value?.manufacturer || 
         'Unknown'
})

const isNIP = computed(() => {
  return inventory.value?.is_nip || inventory.value?.vaccinemaster?.is_nip || false
})

const category = computed(() => {
  return inventory.value?.vaccinemaster?.category || inventory.value?.category || ''
})

const prettyCategory = computed(() => {
  const c = String(category.value || '').toUpperCase()
  return c === 'VACCINE' ? 'Vaccine' : c === 'DEWORMING' ? 'Deworming' : c === 'VITAMIN_A' ? 'Vitamin A' : (category.value || 'N/A')
})

const vaccineType = computed(() => {
  return inventory.value?.vaccinemaster?.vaccine_type || inventory.value?.vaccine_type || ''
})

const programLabel = computed(() => {
  if (!['VACCINE','DEWORMING','VITAMIN_A'].includes(String(category.value || '').toUpperCase())) return ''
  return isNIP.value ? 'NIP' : 'Other'
})

const showType = computed(() => {
  const c = String(category.value || '').toUpperCase()
  return ['VACCINE','DEWORMING','VITAMIN_A'].includes(c) && (programLabel.value || vaccineType.value)
})

const currentQuantity = computed(() => {
  return inventory.value?.current_stock_level || 0
})

const lotNumber = computed(() => {
  return inventory.value?.lot_number || 'N/A'
})

const expirationDate = computed(() => {
  const date = inventory.value?.expiration_date
  if (!date) return 'N/A'
  return new Date(date).toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
})

const receivedDate = computed(() => {
  const date = inventory.value?.date_received || inventory.value?.created_at
  if (!date) return null
  return new Date(date).toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
})

const daysUntilExpiry = computed(() => {
  const expiry = inventory.value?.expiration_date
  if (!expiry) return null
  const expiryDate = new Date(expiry)
  const today = new Date()
  return Math.floor((expiryDate - today) / (1000 * 60 * 60 * 24))
})

const status = computed(() => {
  const qty = currentQuantity.value
  const days = daysUntilExpiry.value

  if (days !== null && days < 0) return 'Expired'
  if (qty === 0) return 'Out of Stock'
  if (qty < 10) return 'Low Stock'
  return 'In Stock'
})

const statusMessage = computed(() => {
  const qty = currentQuantity.value
  const days = daysUntilExpiry.value

  if (status.value === 'Expired') {
    return 'This vaccine has expired and should not be administered'
  }
  if (status.value === 'Out of Stock') {
    return 'This vaccine is currently out of stock'
  }
  if (status.value === 'Low Stock') {
    return `Only ${qty} doses remaining. Consider restocking soon`
  }
  if (days !== null && days < 30) {
    return `Expiring in ${days} days. Plan usage accordingly`
  }
  return 'Sufficient stock available'
})

const statusIcon = computed(() => {
  switch (status.value) {
    case 'In Stock': return 'bi-check-circle-fill'
    case 'Low Stock': return 'bi-exclamation-triangle-fill'
    case 'Out of Stock': return 'bi-x-circle-fill'
    case 'Expired': return 'bi-x-octagon-fill'
    default: return 'bi-info-circle-fill'
  }
})

const statusBannerClass = computed(() => {
  switch (status.value) {
    case 'In Stock': return 'status-in-stock'
    case 'Low Stock': return 'status-low-stock'
    case 'Out of Stock': return 'status-out-of-stock'
    case 'Expired': return 'status-expired'
    default: return ''
  }
})

const statusBadgeClass = computed(() => {
  switch (status.value) {
    case 'In Stock': return 'badge-in-stock'
    case 'Low Stock': return 'badge-low-stock'
    case 'Out of Stock': return 'badge-out-of-stock'
    case 'Expired': return 'badge-expired'
    default: return ''
  }
})

const quantityClass = computed(() => {
  const qty = currentQuantity.value
  if (qty === 0) return 'quantity-zero'
  if (qty < 10) return 'quantity-low'
  if (qty < 50) return 'quantity-medium'
  return 'quantity-good'
})

const expirationClass = computed(() => {
  const days = daysUntilExpiry.value
  if (days === null) return ''
  if (days < 0) return 'expiration-expired'
  if (days < 30) return 'expiration-soon'
  return ''
})

const daysUntilExpiryClass = computed(() => {
  const days = daysUntilExpiry.value
  if (days === null) return ''
  if (days < 0) return 'days-expired'
  if (days < 30) return 'days-warning'
  if (days < 90) return 'days-caution'
  return 'days-good'
})

const storageLocation = computed(() => {
  return inventory.value?.storage_location || 
         inventory.value?.location || 
         'Main Vaccine Storage'
})

const remarks = computed(() => {
  return inventory.value?.remarks || inventory.value?.notes || ''
})

// Methods
const handleBack = () => {
  router.push({ name: 'HealthWorkerStock' })
}

const fetchInventoryDetails = async () => {
  try {
    loading.value = true
    error.value = null
    
    const inventoryId = route.params.id
    console.log('📦 [InventoryDetails] Fetching inventory ID:', inventoryId)
    
    const response = await api.get(`/vaccines/inventory/${inventoryId}`)
    inventory.value = response.data?.data || response.data
    
    console.log('✅ [InventoryDetails] Loaded inventory:', inventory.value)
  } catch (err) {
    console.error('❌ [InventoryDetails] Error fetching inventory:', err)
    error.value = 'Failed to load inventory details. Please try again.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchInventoryDetails()
})
</script>

<style scoped>
/* Fixed Header */
.inventory-details-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.btn-back {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  cursor: pointer;
  transition: background 0.2s;
  flex-shrink: 0;
}

.btn-back:hover {
  background: rgba(255, 255, 255, 0.3);
}

.header-title h1 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
}

/* Scrollable Content */
.details-content-wrapper {
  padding: 0 0 100px 0; /* Bottom padding for navbar */
  min-height: calc(100vh - 70px);
  background: #f3f4f6;
}

/* Loading Section */
.loading-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 1rem;
  text-align: center;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e5e7eb;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-section p {
  color: #6b7280;
  margin: 0;
}

/* Error Section */
.error-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  text-align: center;
}

.error-section i {
  font-size: 3rem;
  color: #ef4444;
  margin-bottom: 1rem;
}

.error-section p {
  color: #6b7280;
  margin: 0 0 1.5rem 0;
  font-size: 0.9375rem;
}

.btn-retry {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-size: 0.9375rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* Details Container */
.details-container {
  padding: 1rem;
}

/* Status Banner */
.status-banner {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  border-radius: 1rem;
  margin-bottom: 1rem;
}

.status-banner i {
  font-size: 2rem;
  flex-shrink: 0;
}

.status-info {
  flex: 1;
}

.status-title {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0 0 0.25rem 0;
}

.status-subtitle {
  font-size: 0.875rem;
  margin: 0;
  opacity: 0.9;
}

.status-in-stock {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  color: #065f46;
}

.status-low-stock {
  background: linear-gradient(135deg, #fed7aa 0%, #fdba74 100%);
  color: #92400e;
}

.status-out-of-stock {
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  color: #991b1b;
}

.status-expired {
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
  color: #374151;
}

/* Details Card */
.details-card {
  background: white;
  border-radius: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  margin-bottom: 1rem;
  overflow: hidden;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1.25rem;
  background: linear-gradient(135deg, #f0f7ff 0%, #e6f2ff 100%);
  border-bottom: 1px solid #e5e7eb;
}

.card-icon {
  font-size: 1.5rem;
  color: #007bff;
}

.card-title {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.card-body {
  padding: 1.25rem;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid #f3f4f6;
}

.detail-row:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.detail-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #6b7280;
  flex-shrink: 0;
  min-width: 120px;
}

.detail-value {
  font-size: 0.9375rem;
  color: #111827;
  text-align: right;
  flex: 1;
  font-weight: 500;
}

.lot-number {
  font-family: 'Courier New', monospace;
  font-weight: 600;
}

.quantity-value {
  font-weight: 700;
  font-size: 1.125rem;
}

.quantity-zero {
  color: #dc2626;
}

.quantity-low {
  color: #ea580c;
}

.quantity-medium {
  color: #ca8a04;
}

.quantity-good {
  color: #16a34a;
}

.expiration-expired {
  color: #dc2626;
  font-weight: 600;
}

.expiration-soon {
  color: #ea580c;
  font-weight: 600;
}

.days-expired {
  color: #dc2626;
  font-weight: 700;
}

.days-warning {
  color: #ea580c;
  font-weight: 700;
}

.days-caution {
  color: #ca8a04;
  font-weight: 600;
}

.days-good {
  color: #16a34a;
}

.type-badge {
  padding: 0.25rem 0.625rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.type-nip {
  background: #dbeafe;
  color: #1e40af;
}

.type-other {
  background: #f3f4f6;
  color: #6b7280;
}

.type-chip {
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  background: #eef2ff;
  color: #3730a3;
  font-size: 0.75rem;
  font-weight: 600;
}

.status-badge {
  padding: 0.375rem 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.badge-in-stock {
  background: #d1fae5;
  color: #065f46;
}

.badge-low-stock {
  background: #fed7aa;
  color: #92400e;
}

.badge-out-of-stock {
  background: #fee2e2;
  color: #991b1b;
}

.badge-expired {
  background: #f3f4f6;
  color: #374151;
}

.remarks-text {
  font-size: 0.9375rem;
  color: #6b7280;
  line-height: 1.6;
  margin: 0;
  white-space: pre-wrap;
}

/* Mobile Optimizations */
@media (max-width: 375px) {
  .status-banner {
    padding: 1rem;
  }

  .status-banner i {
    font-size: 1.75rem;
  }

  .status-title {
    font-size: 1rem;
  }

  .status-subtitle {
    font-size: 0.8125rem;
  }

  .detail-label {
    font-size: 0.8125rem;
    min-width: 100px;
  }

  .detail-value {
    font-size: 0.875rem;
  }
}
</style>
