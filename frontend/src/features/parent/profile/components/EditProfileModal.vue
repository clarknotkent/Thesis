<template>
  <div>
    <div
      class="modal fade show"
      tabindex="-1"
      style="display: block;"
    >
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              Edit Profile Information
            </h5>
            <button
              type="button"
              class="btn-close"
              @click="$emit('close')"
            />
          </div>
          <div class="modal-body">
            <div class="row g-2">
              <div class="col-6">
                <label class="form-label">First Name</label>
                <input
                  v-model="localForm.firstname"
                  type="text"
                  class="form-control"
                >
              </div>
              <div class="col-6">
                <label class="form-label">Last Name</label>
                <input
                  v-model="localForm.surname"
                  type="text"
                  class="form-control"
                >
              </div>
              <div class="col-12">
                <label class="form-label">Middle Name</label>
                <input
                  v-model="localForm.middlename"
                  type="text"
                  class="form-control"
                >
              </div>
              <div class="col-12">
                <label class="form-label">Email</label>
                <input
                  v-model="localForm.email"
                  type="email"
                  class="form-control"
                >
              </div>
              <div class="col-12">
                <label class="form-label">Phone</label>
                <input
                  v-model="localForm.contact_number"
                  type="tel"
                  class="form-control"
                >
              </div>
              <div class="col-12">
                <label class="form-label">Alternative Phone</label>
                <input
                  v-model="localForm.alternative_contact_number"
                  type="tel"
                  class="form-control"
                >
              </div>
              <div class="col-12">
                <label class="form-label">Occupation</label>
                <input
                  v-model="localForm.occupation"
                  type="text"
                  class="form-control"
                >
              </div>
              <div class="col-12">
                <label class="form-label">Address</label>
                <input
                  v-model="localForm.address"
                  type="text"
                  class="form-control"
                >
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button
              class="btn btn-secondary"
              @click="$emit('close')"
            >
              Cancel
            </button>
            <button
              class="btn btn-primary"
              :disabled="saving"
              @click="handleSave"
            >
              <i
                v-if="saving"
                class="bi bi-hourglass-split fa-spin me-1"
              />
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
    <div class="modal-backdrop fade show" />
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  form: {
    type: Object,
    required: true
  },
  saving: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'save'])

const localForm = ref({ ...props.form })

// Watch for form prop changes (when modal reopens)
watch(() => props.form, (newForm) => {
  localForm.value = { ...newForm }
}, { deep: true })

const handleSave = () => {
  emit('save', localForm.value)
}
</script>

<style scoped>
.form-label {
  font-weight: 600;
  font-size: 0.875rem;
  color: #495057;
  margin-bottom: 0.375rem;
}

.form-control {
  font-size: 0.875rem;
}
</style>
