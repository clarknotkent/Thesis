<template>
  <div class="input-group">
    <input
      type="text"
      class="form-control"
      :placeholder="placeholder"
      v-model="textValue"
      @blur="formatText"
    />
    <button class="btn btn-outline-secondary" type="button" @click="openPicker" title="Select date">
      <i class="bi bi-calendar3"></i>
    </button>
    <input
      type="date"
      ref="nativePicker"
      style="position: absolute; visibility: hidden; pointer-events: none;"
      @change="onNativeChange"
    />
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: 'MM/DD/YYYY' },
  defaultToday: { type: Boolean, default: true }
})

const emit = defineEmits(['update:modelValue'])

const textValue = ref('')
const nativePicker = ref(null)

const fmt = (d) => {
  const date = new Date(d)
  if (isNaN(date.getTime())) return ''
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const yyyy = date.getFullYear()
  return `${mm}/${dd}/${yyyy}`
}

onMounted(() => {
  if (props.defaultToday && !props.modelValue) {
    const today = new Date()
    const mdy = fmt(today)
    textValue.value = mdy
    emit('update:modelValue', mdy)
  } else if (props.modelValue) {
    textValue.value = fmt(props.modelValue)
  }
})

watch(() => props.modelValue, (nv) => {
  if (!nv) return
  textValue.value = fmt(nv)
})

const openPicker = () => {
  if (nativePicker.value) nativePicker.value.showPicker?.()
}

const onNativeChange = (e) => {
  const iso = e.target.value // YYYY-MM-DD
  if (!iso) return
  const date = new Date(iso)
  const mdy = fmt(date)
  textValue.value = mdy
  emit('update:modelValue', mdy)
}

const formatText = () => {
  // Ensure value stays present; if invalid, keep last good or today
  const parts = (textValue.value || '').split(/[\\/\-]/)
  if (parts.length === 3) {
    const mm = parts[0].padStart(2, '0')
    const dd = parts[1].padStart(2, '0')
    const yyyy = parts[2]
    const d = new Date(`${yyyy}-${mm}-${dd}`)
    if (!isNaN(d.getTime())) {
      const mdy = fmt(d)
      textValue.value = mdy
      emit('update:modelValue', mdy)
      return
    }
  }
  // Fallback to today
  const today = new Date()
  const mdy = fmt(today)
  textValue.value = mdy
  emit('update:modelValue', mdy)
}
</script>

<style scoped>
.input-group > input[type="date"] { display: none; }
</style>
