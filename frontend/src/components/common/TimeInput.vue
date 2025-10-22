<template>
  <div class="time-input-wrapper">
    <div class="input-group">
      <input
        ref="textInput"
        type="text"
        :class="inputClass"
        :placeholder="placeholder"
        :disabled="disabled"
        :required="required"
        v-model="displayValue"
        @input="handleInput"
        @blur="handleBlur"
        @keydown="handleKeydown"
        :maxlength="format24 ? 5 : 8"
      />
      <button
        class="btn btn-outline-secondary"
        type="button"
        :disabled="disabled"
        @click="openPicker"
        title="Pick time from clock"
      >
        <i class="bi bi-clock"></i>
      </button>
      <input
        type="time"
        ref="nativePicker"
        class="native-picker-hidden"
        @change="onNativeChange"
      />
    </div>
    <small v-if="error" class="text-danger d-block mt-1">{{ error }}</small>
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
    default: 'HH:MM AM/PM' 
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
  format24: {
    type: Boolean,
    default: false // false for 12-hour with AM/PM, true for 24-hour
  }
})

const emit = defineEmits(['update:modelValue'])

const textInput = ref(null)
const nativePicker = ref(null)
const displayValue = ref('')
const error = ref('')
const lastValue = ref('')

// Initialize display value
onMounted(() => {
  if (props.modelValue) {
    displayValue.value = props.modelValue
    lastValue.value = props.modelValue
  }
})

// Watch for external value changes
watch(() => props.modelValue, (nv) => {
  if (nv !== displayValue.value) {
    displayValue.value = nv || ''
    lastValue.value = nv || ''
  }
})

// Auto-format as user types (adds colon automatically)
const handleInput = (e) => {
  const input = e.target
  let newValue = input.value.toUpperCase()
  
  // Get cursor position before formatting
  let cursor = input.selectionStart || 0
  
  if (props.format24) {
    // 24-hour format (HH:MM)
    let digits = newValue.replace(/\D/g, '')
    
    if (digits.length > 4) {
      digits = digits.substring(0, 4)
    }
    
    let formatted = ''
    if (digits.length > 0) {
      formatted = digits.substring(0, 2)
      if (digits.length >= 3) {
        formatted += ':' + digits.substring(2, 4)
      }
    }
    
    if (newValue.length > lastValue.value.length) {
      if (formatted.length > cursor && formatted[cursor] === ':') {
        cursor++
      }
    }
    
    displayValue.value = formatted
  } else {
    // 12-hour format (HH:MM AM/PM)
    // Extract AM/PM if present
    let ampm = ''
    if (newValue.includes('A')) ampm = 'AM'
    else if (newValue.includes('P')) ampm = 'PM'
    
    // Remove all non-digits except for tracking where user is typing
    let digits = newValue.replace(/[^0-9]/g, '')
    
    if (digits.length > 4) {
      digits = digits.substring(0, 4)
    }
    
    let formatted = ''
    if (digits.length > 0) {
      formatted = digits.substring(0, 2)
      if (digits.length >= 3) {
        formatted += ':' + digits.substring(2, 4)
      }
    }
    
    // Add space and AM/PM if we have time digits
    if (formatted && ampm) {
      formatted += ' ' + ampm
    } else if (formatted && digits.length >= 4) {
      // Auto-add AM if fully typed but no AM/PM specified yet
      formatted += ' '
    }
    
    if (newValue.length > lastValue.value.length) {
      if (formatted.length > cursor && formatted[cursor] === ':') {
        cursor++
      }
    }
    
    displayValue.value = formatted
  }
  
  lastValue.value = displayValue.value
  error.value = ''
  
  // Restore cursor position
  setTimeout(() => {
    input.setSelectionRange(cursor, cursor)
  }, 0)
}

// Validate and emit on blur
const handleBlur = () => {
  const parsed = parseTimeValue(displayValue.value)
  if (displayValue.value && parsed) {
    // Valid time - format and emit
    let formattedTime = ''
    
    if (props.format24) {
      formattedTime = `${String(parsed.hour).padStart(2, '0')}:${String(parsed.minute).padStart(2, '0')}`
    } else {
      // Convert to 12-hour format for display and storage
      const displayHour = parsed.hour12 || parsed.hour
      formattedTime = `${String(displayHour).padStart(2, '0')}:${String(parsed.minute).padStart(2, '0')} ${parsed.period || 'AM'}`
    }
    
    displayValue.value = formattedTime
    emit('update:modelValue', formattedTime)
    error.value = ''
  } else if (displayValue.value) {
    // Invalid format
    error.value = props.format24 
      ? 'Invalid time. Use HH:MM format.' 
      : 'Invalid time. Use HH:MM AM/PM format.'
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

// Handle backspace for colon deletion
const handleKeydown = (e) => {
  const input = e.target
  const cursor = input.selectionStart || 0
  const value = input.value
  
  // Handle backspace
  if (e.keyCode === 8 || e.key === 'Backspace') {
    // If cursor is right after a colon, delete the colon and the digit before it
    if (cursor > 0 && value[cursor - 1] === ':') {
      e.preventDefault()
      const beforeColon = value.substring(0, cursor - 2)
      const afterColon = value.substring(cursor)
      displayValue.value = beforeColon + afterColon
      lastValue.value = displayValue.value
      
      // Position cursor before the deleted digit
      setTimeout(() => {
        input.setSelectionRange(cursor - 2, cursor - 2)
      }, 0)
      return
    }
    // If cursor is right after a space (before AM/PM), delete the space and digit before
    if (cursor > 0 && value[cursor - 1] === ' ') {
      e.preventDefault()
      const beforeSpace = value.substring(0, cursor - 2)
      const afterSpace = value.substring(cursor)
      displayValue.value = beforeSpace + afterSpace
      lastValue.value = displayValue.value
      
      setTimeout(() => {
        input.setSelectionRange(cursor - 2, cursor - 2)
      }, 0)
      return
    }
  }
  
  // Handle delete key
  if (e.keyCode === 46 || e.key === 'Delete') {
    // If cursor is right before a colon, delete the colon and the digit after it
    if (cursor < value.length && value[cursor] === ':') {
      e.preventDefault()
      const beforeColon = value.substring(0, cursor)
      const afterDigit = value.substring(cursor + 2)
      displayValue.value = beforeColon + afterDigit
      lastValue.value = displayValue.value
      
      // Keep cursor in same position
      setTimeout(() => {
        input.setSelectionRange(cursor, cursor)
      }, 0)
      return
    }
    // If cursor is right before a space, delete the space and keep going
    if (cursor < value.length && value[cursor] === ' ') {
      e.preventDefault()
      const beforeSpace = value.substring(0, cursor)
      const afterSpace = value.substring(cursor + 1)
      displayValue.value = beforeSpace + afterSpace
      lastValue.value = displayValue.value
      
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
  
  // Allow A, P, M for AM/PM in 12-hour format
  if (!props.format24) {
    const key = e.key?.toUpperCase()
    if (key === 'A' || key === 'P' || key === 'M') {
      return
    }
  }
  
  // Ensure that it is a number and stop the keypress if not
  if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
    e.preventDefault()
  }
}

// Parse HH:MM or HH:MM AM/PM time value
const parseTimeValue = (val) => {
  if (!val) return null
  
  if (props.format24) {
    // 24-hour format
    const match = val.match(/^(\d{1,2}):(\d{2})$/)
    if (!match) return null
    
    const hour = parseInt(match[1])
    const minute = parseInt(match[2])
    
    if (hour < 0 || hour > 23) return null
    if (minute < 0 || minute > 59) return null
    
    return { hour, minute }
  } else {
    // 12-hour format with AM/PM
    const match = val.match(/^(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)?$/i)
    if (!match) return null
    
    let hour = parseInt(match[1])
    const minute = parseInt(match[2])
    const period = (match[3] || 'AM').toUpperCase()
    
    if (hour < 1 || hour > 12) return null
    if (minute < 0 || minute > 59) return null
    
    // Store the 12-hour format hour for display
    const hour12 = hour
    
    // Convert to 24-hour for internal use if needed
    if (period === 'PM' && hour !== 12) {
      hour = hour + 12
    } else if (period === 'AM' && hour === 12) {
      hour = 0
    }
    
    return { hour, minute, period, hour12 }
  }
}

// Open native time picker
const openPicker = () => {
  if (nativePicker.value) {
    // Set current value to native picker (always uses 24-hour format)
    const parsed = parseTimeValue(displayValue.value)
    if (parsed) {
      const hour24 = props.format24 ? parsed.hour : parsed.hour
      nativePicker.value.value = `${String(hour24).padStart(2, '0')}:${String(parsed.minute).padStart(2, '0')}`
    }
    nativePicker.value.showPicker?.()
  }
}

// Handle native picker change
const onNativeChange = (e) => {
  const timeValue = e.target.value // HH:MM in 24-hour format
  if (!timeValue) return
  
  const [hourStr, minuteStr] = timeValue.split(':')
  let hour = parseInt(hourStr)
  const minute = parseInt(minuteStr)
  
  if (props.format24) {
    displayValue.value = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
  } else {
    // Convert 24-hour to 12-hour with AM/PM
    const period = hour >= 12 ? 'PM' : 'AM'
    let hour12 = hour % 12
    if (hour12 === 0) hour12 = 12
    
    displayValue.value = `${String(hour12).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${period}`
  }
  
  lastValue.value = displayValue.value
  emit('update:modelValue', displayValue.value)
  error.value = ''
}
</script>

<style scoped>
.time-input-wrapper {
  position: relative;
}

.native-picker-hidden {
  position: absolute;
  visibility: hidden;
  pointer-events: none;
  width: 0;
  height: 0;
}

.input-group > input[type="time"] {
  display: none;
}
</style>
