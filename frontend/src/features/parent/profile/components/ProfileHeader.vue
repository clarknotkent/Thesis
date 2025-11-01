<template>
  <div class="profile-header">
    <div class="profile-avatar">
      <i class="bi bi-person-circle"></i>
    </div>
    <h4 class="profile-name">{{ displayName }}</h4>
    <p class="profile-role">{{ role }}</p>
    <p class="profile-id">ID: {{ userId }}</p>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  userInfo: {
    type: Object,
    required: true
  },
  role: {
    type: String,
    default: 'Parent'
  }
})

const displayName = computed(() => {
  if (!props.userInfo) return 'Parent'
  
  if (props.userInfo.full_name) return props.userInfo.full_name
  if (props.userInfo.name) return props.userInfo.name
  
  const firstName = props.userInfo.firstname || props.userInfo.first_name || ''
  const lastName = props.userInfo.lastname || props.userInfo.surname || props.userInfo.last_name || ''
  
  const name = `${firstName} ${lastName}`.trim()
  return name || 'Parent'
})

const userId = computed(() => {
  return props.userInfo?.user_id || 
         props.userInfo?.id || 
         props.userInfo?.guardian_id || 
         'N/A'
})
</script>

<style scoped>
.profile-header {
  background: white;
  padding: 2rem 1rem;
  text-align: center;
  border-radius: 12px;
  margin-bottom: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.profile-avatar {
  width: 100px;
  height: 100px;
  margin: 0 auto 1rem;
  color: #007bff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.profile-avatar i {
  font-size: 6rem;
}

.profile-name {
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: #333;
}

.profile-role {
  margin: 0 0 0.25rem 0;
  font-size: 0.95rem;
  color: #6c757d;
  font-weight: 500;
}

.profile-id {
  margin: 0;
  font-size: 0.875rem;
  color: #9ca3af;
}

@media (max-width: 576px) {
  .profile-header {
    padding: 1.5rem 0.875rem;
  }

  .profile-avatar {
    width: 80px;
    height: 80px;
  }

  .profile-avatar i {
    font-size: 5rem;
  }

  .profile-name {
    font-size: 1.25rem;
  }

  .profile-role {
    font-size: 0.875rem;
  }

  .profile-id {
    font-size: 0.8125rem;
  }
}
</style>
