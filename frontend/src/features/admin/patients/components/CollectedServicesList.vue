<template>
  <div>
    <h6 class="mb-2">
      Collected Services
    </h6>
    
    <div
      v-if="services.length === 0"
      class="alert alert-info"
    >
      No services collected yet.
    </div>

    <div
      v-else
      class="table-responsive"
    >
      <table class="table table-sm table-bordered">
        <thead class="table-light">
          <tr>
            <th>Vaccine</th>
            <th>Date Administered</th>
            <th>Dose</th>
            <th>Site</th>
            <th>Health Worker</th>
            <th>Type</th>
            <th
              v-if="!disabled"
              style="width: 100px;"
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(service, idx) in services"
            :key="idx"
          >
            <td>{{ service.vaccine_name }}</td>
            <td>{{ formatDate(service.date_administered) }}</td>
            <td>{{ service.dose_ordinal }}</td>
            <td>{{ service.site_of_administration || 'N/A' }}</td>
            <td>{{ service.health_worker_name || 'N/A' }}</td>
            <td>
              <span 
                :class="['badge', service.is_outside_record ? 'bg-warning' : 'bg-success']"
              >
                {{ service.is_outside_record ? 'Outside' : 'Facility' }}
              </span>
            </td>
            <td v-if="!disabled">
              <button 
                type="button" 
                class="btn btn-sm btn-outline-primary me-1"
                title="Edit"
                @click="$emit('edit', idx)"
              >
                <i class="bi bi-pencil" />
              </button>
              <button 
                type="button" 
                class="btn btn-sm btn-outline-danger"
                title="Remove"
                @click="$emit('remove', idx)"
              >
                <i class="bi bi-trash" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
defineProps({
  services: {
    type: Array,
    required: true,
    default: () => []
  },
  disabled: {
    type: Boolean,
    default: false
  }
});

defineEmits(['edit', 'remove']);

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};
</script>
