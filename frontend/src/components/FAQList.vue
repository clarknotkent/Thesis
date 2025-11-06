<template>
  <div class="card shadow-sm">
    <div class="card-header d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2">
      <h5 class="mb-0">
        Frequently Asked Questions
      </h5>
      <div
        class="input-group input-group-sm"
        style="max-width: 360px;"
      >
        <span class="input-group-text bg-white"><i class="bi bi-search" /></span>
        <input
          v-model.trim="searchQuery"
          type="text"
          class="form-control"
          placeholder="Search questions or answers..."
          aria-label="Search FAQs"
        >
        <button
          v-if="searchQuery"
          class="btn btn-outline-secondary"
          title="Clear"
          @click="searchQuery = ''"
        >
          <i class="bi bi-x" />
        </button>
      </div>
    </div>
    <div class="card-body p-0">
      <!-- Loading -->
      <div
        v-if="loading"
        class="d-flex justify-content-center py-5"
      >
        <div
          class="spinner-border text-primary"
          role="status"
        >
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>

      <!-- Empty / No results -->
      <div
        v-else-if="!filteredItems.length"
        class="text-center text-muted py-5"
      >
        <i class="bi bi-inboxes fs-1 d-block mb-2" />
        <div class="fw-semibold">
          No FAQs found
        </div>
        <small class="d-block">{{ searchQuery ? 'Try adjusting your search.' : 'Please check back later.' }}</small>
      </div>

      <!-- List -->
      <div
        v-else
        class="list-group list-group-flush"
      >
        <div
          v-for="f in filteredItems"
          :key="f.faq_id"
          class="list-group-item"
        >
          <div class="fw-semibold">
            {{ f.question }}
          </div>
          <div
            class="text-body small mt-1 answer-text"
            v-html="f.answer"
          />
          <div
            v-if="f.created_at"
            class="text-muted small mt-2"
          >
            <i class="bi bi-clock me-1" />{{ formatDate(f.created_at) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { getFaqs } from '@/services/faqService'

const items = ref([])
const loading = ref(true)
const searchQuery = ref('')

const filteredItems = computed(() => {
  if (!searchQuery.value) return items.value
  const q = searchQuery.value.toLowerCase()
  return items.value.filter(f =>
    (f.question || '').toLowerCase().includes(q) ||
    (f.answer || '').toLowerCase().includes(q)
  )
})

const load = async () => {
  try {
    loading.value = true
    const res = await getFaqs()
    items.value = Array.isArray(res?.data?.items) ? res.data.items : (Array.isArray(res?.data) ? res.data : [])
  } catch (e) {
    items.value = []
  } finally {
    loading.value = false
  }
}

const formatDate = (iso) => {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    if (isNaN(d.getTime())) return ''
    return d.toLocaleString()
  } catch (_) {
    return ''
  }
}

onMounted(load)
</script>

<style scoped>
.answer-text { white-space: pre-wrap; }
</style>
