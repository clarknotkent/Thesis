<template>
  <div class="card shadow mb-4">
    <div class="card-header py-3 d-flex justify-content-between align-items-center">
      <h6 class="m-0 fw-bold text-primary">
        Receiving Reports
      </h6>
      <div class="d-flex align-items-center gap-2">
        <input 
          class="form-control" 
          placeholder="Search RR-..." 
          :value="searchTerm"
          style="max-width: 240px;"
          @input="$emit('update:searchTerm', $event.target.value)" 
        >
        <select 
          class="form-select" 
          :value="status"
          style="max-width: 180px;"
          @change="$emit('update:status', $event.target.value)"
        >
          <option value="">
            All Status
          </option>
          <option value="DRAFT">
            Draft
          </option>
          <option value="COMPLETED">
            Completed
          </option>
          <option value="CANCELLED">
            Cancelled
          </option>
        </select>
        <button 
          class="btn btn-outline-secondary" 
          title="Refresh" 
          @click="$emit('refresh')"
        >
          <i class="bi bi-arrow-clockwise" />
        </button>
      </div>
    </div>
    <div class="card-body">
      <div
        v-if="loading"
        class="text-center py-4"
      >
        <div
          class="spinner-border text-primary"
          role="status"
        >
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>
      <div
        v-else
        class="table-responsive"
      >
        <table class="table table-hover table-striped">
          <thead class="table-light">
            <tr>
              <th>Report #</th>
              <th>Delivery Date</th>
              <th>Delivered By</th>
              <th>Received By</th>
              <th>Total Items</th>
              <th>Total Qty</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="r in receivingList.items" 
              :key="r.report_id" 
              style="cursor:pointer;" 
              @click="$emit('view', r)"
            >
              <td class="fw-semibold">
                {{ r.report_number }}
              </td>
              <td>{{ formatDate(r.delivery_date) }}</td>
              <td>{{ r.delivered_by }}</td>
              <td>{{ r.received_by_name || '-' }}</td>
              <td>{{ r.total_items || 0 }}</td>
              <td>{{ r.total_quantity || 0 }}</td>
              <td>
                <span
                  class="badge"
                  :class="getReceivingBadgeClass(r.status)"
                >{{ r.status }}</span>
              </td>
              <td>
                <div class="btn-group btn-group-sm">
                  <button 
                    class="btn btn-outline-primary" 
                    @click.stop="$emit('view', r)"
                  >
                    <i class="bi bi-eye" />
                  </button>
                  <button 
                    class="btn btn-outline-success" 
                    :disabled="r.status !== 'DRAFT'" 
                    @click.stop="$emit('complete', r)"
                  >
                    <i class="bi bi-check2-circle" />
                  </button>
                  <button 
                    class="btn btn-outline-danger" 
                    :disabled="r.status !== 'DRAFT'" 
                    @click.stop="$emit('cancel', r)"
                  >
                    <i class="bi bi-x-circle" />
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="(receivingList.items || []).length === 0">
              <td
                colspan="8"
                class="text-center text-muted py-4"
              >
                No receiving reports found
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  receivingList: {
    type: Object,
    required: true,
    default: () => ({ items: [], totalCount: 0, totalPages: 0 })
  },
  loading: {
    type: Boolean,
    default: false
  },
  searchTerm: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    default: ''
  },
  formatDate: {
    type: Function,
    required: true
  },
  getReceivingBadgeClass: {
    type: Function,
    required: true
  }
})

defineEmits(['update:searchTerm', 'update:status', 'refresh', 'view', 'complete', 'cancel'])
</script>
