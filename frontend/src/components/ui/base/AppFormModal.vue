<template>
  <AppModal
    :show="show"
    :title="title"
    @close="$emit('close')"
  >
    <form @submit.prevent="$emit('submit', formData)">
      <div
        v-for="field in fields"
        :key="field.key"
        class="mb-3"
      >
        <label class="form-label">{{ field.label }}</label>
        
        <!-- Text Input -->
        <input 
          v-if="field.type === 'text' || field.type === 'email' || field.type === 'tel'"
          v-model="formData[field.key]"
          :type="field.type"
          class="form-control"
          :required="field.required"
          :placeholder="field.placeholder"
        >
        
        <!-- Date Input -->
        <input 
          v-else-if="field.type === 'date'"
          v-model="formData[field.key]"
          type="date"
          class="form-control"
          :required="field.required"
        >
        
        <!-- Select Input -->
        <select 
          v-else-if="field.type === 'select'"
          v-model="formData[field.key]"
          class="form-select"
          :required="field.required"
        >
          <option
            v-for="option in field.options"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </option>
        </select>
        
        <!-- Textarea -->
        <textarea 
          v-else-if="field.type === 'textarea'"
          v-model="formData[field.key]"
          class="form-control"
          :required="field.required"
          :placeholder="field.placeholder"
          :rows="field.rows || 3"
        />
      </div>
      
      <div class="d-flex gap-2">
        <AppButton
          type="submit"
          variant="primary"
          :loading="loading"
        >
          {{ submitText }}
        </AppButton>
        <AppButton
          variant="secondary"
          @click="$emit('close')"
        >
          Cancel
        </AppButton>
      </div>
    </form>
  </AppModal>
</template>

<script setup>
import { ref, watch } from 'vue'
import AppModal from './AppModal.vue'
import AppButton from './AppButton.vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    required: true
  },
  fields: {
    type: Array,
    required: true
  },
  initialData: {
    type: Object,
    default: () => ({})
  },
  submitText: {
    type: String,
    default: 'Submit'
  },
  loading: {
    type: Boolean,
    default: false
  }
})

defineEmits(['close', 'submit'])

const formData = ref({})

// Initialize form data when modal opens or initial data changes
watch(() => [props.show, props.initialData], () => {
  if (props.show) {
    formData.value = { ...props.initialData }
  }
}, { immediate: true, deep: true })
</script>
