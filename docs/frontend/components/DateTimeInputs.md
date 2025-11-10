# Date and Time Input Components

## DateInput Component

Auto-formatting date input with calendar picker support.

### Features
- Auto-formats as MM/DD/YYYY while typing
- Automatically adds `/` after month and day
- Smart backspace: deletes `/` along with the preceding digit
- Calendar picker button for easy date selection
- Validation on blur
- Supports both ISO (YYYY-MM-DD) and display (MM/DD/YYYY) output formats

### Usage

```vue
<script setup>
import DateInput from '@/components/common/DateInput.vue'
import { ref } from 'vue'

const birthDate = ref('')
const appointmentDate = ref('')
</script>

<template>
  <!-- Basic usage -->
  <DateInput v-model="birthDate" />

  <!-- With custom placeholder -->
  <DateInput 
    v-model="appointmentDate" 
    placeholder="Select appointment date"
  />

  <!-- Required field -->
  <DateInput 
    v-model="birthDate" 
    required 
  />

  <!-- ISO format output (YYYY-MM-DD) -->
  <DateInput 
    v-model="birthDate" 
    output-format="iso"
  />

  <!-- Display format output (MM/DD/YYYY) -->
  <DateInput 
    v-model="birthDate" 
    output-format="display"
  />

  <!-- Default to today's date -->
  <DateInput 
    v-model="appointmentDate" 
    default-today
  />

  <!-- Disabled -->
  <DateInput 
    v-model="birthDate" 
    disabled
  />

  <!-- Custom CSS class -->
  <DateInput 
    v-model="birthDate" 
    input-class="form-control form-control-lg"
  />
</template>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `modelValue` | String | `''` | The date value (v-model) |
| `placeholder` | String | `'MM/DD/YYYY'` | Placeholder text |
| `defaultToday` | Boolean | `false` | Set to today's date on mount |
| `disabled` | Boolean | `false` | Disable the input |
| `required` | Boolean | `false` | Make the field required |
| `inputClass` | String | `'form-control'` | CSS class for the input |
| `outputFormat` | String | `'iso'` | Output format: `'iso'` or `'display'` |

### Auto-Formatting Behavior

As you type:
- Type `12` → displays `12`
- Type `1` → displays `12/`
- Type `25` → displays `12/25`
- Type `2` → displays `12/25/`
- Type `2024` → displays `12/25/2024`

Backspace behavior:
- Cursor after `/` and press backspace → deletes `/` and the digit before it
- Example: `12/|` → backspace → `1|`

---

## TimeInput Component

Auto-formatting time input with time picker support.

### Features
- Auto-formats as HH:MM AM/PM (12-hour) or HH:MM (24-hour) while typing
- Automatically adds `:` after hour
- Allows typing AM or PM for 12-hour format
- Smart backspace: deletes `:` and spaces along with the preceding digit
- Time picker button for easy time selection
- Supports both 12-hour (default) and 24-hour formats
- Validation on blur

### Usage

```vue
<script setup>
import TimeInput from '@/components/common/TimeInput.vue'
import { ref } from 'vue'

const startTime = ref('')
const endTime = ref('02:30 PM')
const militaryTime = ref('14:30')
</script>

<template>
  <!-- Basic usage (12-hour format with AM/PM) -->
  <TimeInput v-model="startTime" />

  <!-- With custom placeholder -->
  <TimeInput 
    v-model="endTime" 
    placeholder="Enter time"
  />

  <!-- 24-hour format -->
  <TimeInput 
    v-model="militaryTime" 
    :format24="true"
    placeholder="HH:MM"
  />

  <!-- Required field -->
  <TimeInput 
    v-model="startTime" 
    required 
  />

  <!-- Disabled -->
  <TimeInput 
    v-model="startTime" 
    disabled
  />

  <!-- Custom CSS class -->
  <TimeInput 
    v-model="startTime" 
    input-class="form-control form-control-lg"
  />
</template>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `modelValue` | String | `''` | The time value (v-model) in HH:MM AM/PM or HH:MM format |
| `placeholder` | String | `'HH:MM AM/PM'` | Placeholder text |
| `disabled` | Boolean | `false` | Disable the input |
| `required` | Boolean | `false` | Make the field required |
| `inputClass` | String | `'form-control'` | CSS class for the input |
| `format24` | Boolean | `false` | Use 24-hour format (false = 12-hour with AM/PM) |

### Auto-Formatting Behavior

**12-hour format (default):**
As you type:
- Type `02` → displays `02`
- Type `3` → displays `02:`
- Type `30` → displays `02:30`
- Type `P` → displays `02:30 P`
- Type `M` → displays `02:30 PM`

**24-hour format:**
As you type:
- Type `14` → displays `14`
- Type `3` → displays `14:`
- Type `30` → displays `14:30`

Backspace behavior:
- Cursor after `:` and press backspace → deletes `:` and the digit before it
- Cursor after space (before AM/PM) and press backspace → deletes space and digit before it
- Example (12-hour): `02:30 |PM` → backspace → `02:3|`
- Example (24-hour): `14:|` → backspace → `1|`

---

## Complete Form Example

```vue
<script setup>
import DateInput from '@/components/common/DateInput.vue'
import TimeInput from '@/components/common/TimeInput.vue'
import { ref } from 'vue'

const formData = ref({
  appointmentDate: '',
  appointmentTime: '',
  birthDate: ''
})

const handleSubmit = () => {
  console.log('Form data:', formData.value)
}
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <div class="mb-3">
      <label class="form-label">Birth Date</label>
      <DateInput 
        v-model="formData.birthDate" 
        output-format="iso"
        required
      />
    </div>

    <div class="mb-3">
      <label class="form-label">Appointment Date</label>
      <DateInput 
        v-model="formData.appointmentDate" 
        output-format="iso"
        required
      />
    </div>

    <div class="mb-3">
      <label class="form-label">Appointment Time</label>
      <TimeInput 
        v-model="formData.appointmentTime" 
        required
      />
    </div>

    <button type="submit" class="btn btn-primary">Submit</button>
  </form>
</template>
```
