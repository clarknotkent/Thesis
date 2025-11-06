<template>
  <div class="date-input-wrapper">
    <div class="input-group">
      <input
        ref="textInput"
        v-model="displayValue"
        type="text"
        :class="inputClass"
        :placeholder="placeholder"
        :disabled="disabled"
        :required="required"
        maxlength="10"
        @input="handleInput"
        @blur="handleBlur"
        @keydown="handleKeydown"
      >
      <button
        class="btn btn-outline-secondary"
        type="button"
        :disabled="disabled"
        title="Pick date from calendar"
        @click="openPicker"
      >
        <i class="bi bi-calendar3" />
      </button>
      <input
        ref="nativePicker"
        type="date"
        class="native-picker-hidden"
        @change="onNativeChange"
      >
    </div>
    <small
      v-if="error"
      class="text-danger d-block mt-1"
    >{{ error }}</small>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'

const props = defineProps({
  modelValue: { 
    type: String, 
    default: '' 
  },
  placeholder: { 
    type: String, 
    default: 'MM/DD/YYYY' 
  },
  defaultToday: { 
    type: Boolean, 
    default: false 
  },
  disabled: {
    type: Boolean,
    default: false
  },
  required: {
    type: Boolean,
    default: false
  },
  inputClass: {
    type: String,
    default: 'form-control'
  },
  outputFormat: {
    type: String,
    default: 'iso', // 'iso' (YYYY-MM-DD) or 'display' (MM/DD/YYYY)
    validator: (value) => ['iso', 'display'].includes(value)
  }
})

const emit = defineEmits(['update:modelValue'])

const textInput = ref(null)
const nativePicker = ref(null)
const displayValue = ref('')
const error = ref('')
const lastValue = ref('')
const cursorPosition = ref(0)

// Format date to MM/DD/YYYY for display
const formatDisplay = (d) => {
  if (!d) return ''
  const date = new Date(d)
  if (isNaN(date.getTime())) return ''
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const yyyy = date.getFullYear()
  return `${mm}/${dd}/${yyyy}`
}

// Format date to YYYY-MM-DD for ISO
const formatISO = (d) => {
  if (!d) return ''
  const date = new Date(d)
  if (isNaN(date.getTime())) return ''
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const yyyy = date.getFullYear()
  return `${yyyy}-${mm}-${dd}`
}

// Initialize display value
onMounted(() => {
  if (props.defaultToday && !props.modelValue) {
    const today = new Date()
    displayValue.value = formatDisplay(today)
    const output = props.outputFormat === 'iso' ? formatISO(today) : formatDisplay(today)
    emit('update:modelValue', output)
  } else if (props.modelValue) {
    // Handle both ISO and display formats
    const match = props.modelValue.match(/^(\d{4})-(\d{2})-(\d{2})$/)
    if (match) {
      // ISO format input
      displayValue.value = `${match[2]}/${match[3]}/${match[1]}`
    } else {
      // Display format input
      displayValue.value = props.modelValue
    }
  }
})

// Watch for external value changes
watch(() => props.modelValue, (nv) => {
  if (!nv) {
    displayValue.value = ''
    return
  }
  
  // Handle both ISO and display formats
  const match = nv.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (match) {
    displayValue.value = `${match[2]}/${match[3]}/${match[1]}`
  } else if (nv !== displayValue.value) {
    displayValue.value = nv
  }
})

// Auto-format as user types (adds slashes automatically)
const handleInput = (e) => {
  const input = e.target
  const newValue = input.value
  const oldValue = lastValue.value
  
  // Get cursor position before formatting
  let cursor = input.selectionStart || 0
  
  // Remove all non-digits
  let digits = newValue.replace(/\D/g, '')
  
  // Limit to 8 digits (MMDDYYYY)
  if (digits.length > 8) {
    digits = digits.substring(0, 8)
  }
  
  // Format as MM/DD/YYYY
  let formatted = ''
  if (digits.length > 0) {
    formatted = digits.substring(0, 2)
    if (digits.length >= 3) {
      formatted += '/' + digits.substring(2, 4)
    }
    if (digits.length >= 5) {
      formatted += '/' + digits.substring(4, 8)
    }
  }
  
  // Calculate new cursor position
  if (newValue.length > oldValue.length) {
    // Typing - move cursor forward if we just added a slash
    if (formatted.length > cursor && formatted[cursor] === '/') {
      cursor++
    }
  }
  
  displayValue.value = formatted
  lastValue.value = formatted
  error.value = ''
  
  // Restore cursor position
  e.target.setSelectionRange(cursor, cursor)
}

// Validate and emit on blur
const handleBlur = () => {
  const parsed = parseDisplayValue(displayValue.value)
  if (displayValue.value && parsed) {
    // Valid date - format and emit
    const formattedDisplay = `${String(parsed.month).padStart(2, '0')}/${String(parsed.day).padStart(2, '0')}/${parsed.year}`
    displayValue.value = formattedDisplay
    
    const output = props.outputFormat === 'iso' 
      ? `${parsed.year}-${String(parsed.month).padStart(2, '0')}-${String(parsed.day).padStart(2, '0')}`
      : formattedDisplay
    
    emit('update:modelValue', output)
    error.value = ''
  } else if (displayValue.value) {
    // Invalid format
    error.value = 'Invalid date. Use MM/DD/YYYY format.'
    if (!props.required) {
      // Clear if not required
      displayValue.value = ''
      emit('update:modelValue', '')
    }
  } else {
    // Empty
    emit('update:modelValue', '')
    error.value = ''
  }
}

// Restrict input to numbers and navigation keys, handle backspace for slashes
const handleKeydown = (e) => {
  const input = e.target
  const cursor = input.selectionStart || 0
  const value = input.value
  
  // Handle backspace
  if (e.keyCode === 8 || e.key === 'Backspace') {
    // If cursor is right after a slash, delete the slash and the digit before it
    if (cursor > 0 && value[cursor - 1] === '/') {
      e.preventDefault()
      const beforeSlash = value.substring(0, cursor - 2)
      const afterSlash = value.substring(cursor)
      displayValue.value = beforeSlash + afterSlash
      lastValue.value = displayValue.value
      
      // Position cursor before the deleted digit
      setTimeout(() => {
        input.setSelectionRange(cursor - 2, cursor - 2)
      }, 0)
      return
    }
  }
  
  // Handle delete key
  if (e.keyCode === 46 || e.key === 'Delete') {
    // If cursor is right before a slash, delete the slash and the digit after it
    if (cursor < value.length && value[cursor] === '/') {
      e.preventDefault()
      const beforeSlash = value.substring(0, cursor)
      const afterDigit = value.substring(cursor + 2)
      displayValue.value = beforeSlash + afterDigit
      lastValue.value = displayValue.value
      
      // Keep cursor in same position
      setTimeout(() => {
        input.setSelectionRange(cursor, cursor)
      }, 0)
      return
    }
  }
  
  // Allow: backspace, delete, tab, escape, enter
  if ([8, 9, 27, 13, 46].indexOf(e.keyCode) !== -1 ||
      // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
      (e.keyCode === 65 && e.ctrlKey === true) ||
      (e.keyCode === 67 && e.ctrlKey === true) ||
      (e.keyCode === 86 && e.ctrlKey === true) ||
      (e.keyCode === 88 && e.ctrlKey === true) ||
      // Allow: home, end, left, right
      (e.keyCode >= 35 && e.keyCode <= 39)) {
    return
  }
  // Ensure that it is a number and stop the keypress if not
  if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
    e.preventDefault()
  }
}

// Parse MM/DD/YYYY display value
const parseDisplayValue = (val) => {
  if (!val) return null
  const match = val.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (!match) return null
  
  const month = parseInt(match[1])
  const day = parseInt(match[2])
  const year = parseInt(match[3])
  
  // Validate month and day
  if (month < 1 || month > 12) return null
  if (day < 1 || day > 31) return null
  if (year < 1900 || year > 2100) return null
  
  // Check if date is valid (e.g., not Feb 30)
  const date = new Date(year, month - 1, day)
  if (date.getMonth() !== month - 1) return null
  
  return { month, day, year }
}

// Open native date picker
const openPicker = () => {
  if (nativePicker.value) {
    // Set current value to native picker
    const parsed = parseDisplayValue(displayValue.value)
    if (parsed) {
      nativePicker.value.value = `${parsed.year}-${String(parsed.month).padStart(2, '0')}-${String(parsed.day).padStart(2, '0')}`
    }
    nativePicker.value.showPicker?.()
  }
}

// Handle native picker change
const onNativeChange = (e) => {
  const iso = e.target.value // YYYY-MM-DD
  if (!iso) return
  
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (match) {
    displayValue.value = `${match[2]}/${match[3]}/${match[1]}`
    const output = props.outputFormat === 'iso' ? iso : displayValue.value
    emit('update:modelValue', output)
    error.value = ''
  }
}
</script>

<style scoped>
.date-input-wrapper {
  position: relative;
}

.native-picker-hidden {
  position: absolute;
  visibility: hidden;
  pointer-events: none;
  width: 0;
  height: 0;
}

.input-group > input[type="date"] {
  display: none;
}
</style>
