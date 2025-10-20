<template>
  <div class="container py-4">
    <div class="d-flex align-items-center justify-content-between mb-3">
      <div>
        <h1 class="h3 mb-0">FAQ Manager</h1>
        <div class="text-muted small">Create, edit, and manage frequently asked questions</div>
      </div>
      <div class="text-muted small">
        <i class="bi bi-card-checklist me-1"></i>
        {{ statsText }}
      </div>
    </div>

    <!-- Alerts -->
    <div v-if="error" class="alert alert-danger d-flex align-items-center" role="alert">
      <i class="bi bi-exclamation-triangle-fill me-2"></i>
      <div>{{ error }}</div>
    </div>
    <div v-if="success" class="alert alert-success d-flex align-items-center" role="alert">
      <i class="bi bi-check-circle-fill me-2"></i>
      <div>{{ success }}</div>
    </div>

    <div class="row g-4">
      <!-- Form column -->
      <div class="col-12 col-lg-5">
        <div class="card shadow-sm h-100">
          <div class="card-header d-flex align-items-center justify-content-between">
            <h2 class="h5 mb-0">{{ editingFaq ? 'Edit FAQ' : 'Create New FAQ' }}</h2>
            <span v-if="editingFaq" class="badge text-bg-warning">Editing</span>
          </div>
          <div class="card-body">
            <form @submit.prevent="handleSaveFaq" novalidate>
              <div class="mb-3">
                <label for="question" class="form-label">Question</label>
                <input
                  type="text"
                  id="question"
                  v-model.trim="newFaq.question"
                  class="form-control"
                  placeholder="e.g. How do I reschedule a vaccination?"
                  :disabled="saving"
                  required
                >
              </div>
              <div class="mb-3">
                <label for="answer" class="form-label">Answer</label>
                <textarea
                  id="answer"
                  v-model.trim="newFaq.answer"
                  class="form-control"
                  rows="5"
                  placeholder="Provide a clear and concise answer"
                  :disabled="saving"
                  required
                ></textarea>
              </div>
              <div class="d-flex justify-content-end gap-2">
                <button type="button" @click="resetForm" class="btn btn-outline-secondary" :disabled="saving">
                  <i class="bi bi-x-circle me-1"></i> Cancel
                </button>
                <button type="submit" class="btn btn-primary" :disabled="!isFormValid || saving">
                  <span v-if="saving" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  <i v-else :class="editingFaq ? 'bi bi-save' : 'bi bi-plus-circle'" class="me-1"></i>
                  {{ editingFaq ? 'Update FAQ' : 'Create FAQ' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- List column -->
      <div class="col-12 col-lg-7">
        <div class="card shadow-sm h-100">
          <div class="card-header">
            <div class="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2">
              <h2 class="h5 mb-0">All FAQs</h2>
              <div class="d-flex align-items-center gap-2 w-100 w-md-auto">
                <div class="input-group input-group-sm" style="max-width: 360px;">
                  <span class="input-group-text bg-white"><i class="bi bi-search"></i></span>
                  <input
                    type="text"
                    class="form-control"
                    placeholder="Search questions or answers..."
                    v-model.trim="searchQuery"
                    aria-label="Search FAQs"
                  />
                  <button v-if="searchQuery" class="btn btn-outline-secondary" @click="searchQuery = ''" title="Clear">
                    <i class="bi bi-x"></i>
                  </button>
                </div>
                <button class="btn btn-sm btn-outline-primary" @click="fetchFaqs" :disabled="loading">
                  <span v-if="loading" class="spinner-border spinner-border-sm me-1"></span>
                  <i v-else class="bi bi-arrow-clockwise me-1"></i>
                  Refresh
                </button>
              </div>
            </div>
          </div>
          <div class="card-body p-0">
            <!-- Loading state -->
            <div v-if="loading" class="d-flex justify-content-center py-5">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
              </div>
            </div>

            <!-- Empty state / No results -->
            <div v-else-if="!filteredFaqs.length" class="text-center text-muted py-5">
              <i class="bi bi-inboxes fs-1 d-block mb-2"></i>
              <div class="fw-semibold">No FAQs found</div>
              <small class="d-block">{{ searchQuery ? 'Try adjusting your search.' : 'Create your first FAQ using the form.' }}</small>
            </div>

            <!-- Clean list -->
            <div v-else class="list-group list-group-flush">
              <div class="list-group-item" v-for="faq in filteredFaqs" :key="faq.faq_id">
                <div class="d-flex align-items-start justify-content-between">
                  <div class="pe-3">
                    <div class="fw-semibold">{{ faq.question }}</div>
                    <div class="text-body answer-text mt-1">{{ faq.answer }}</div>
                    <div class="text-muted small mt-2" v-if="faq.created_at">
                      <i class="bi bi-clock me-1"></i>
                      {{ formatDate(faq.created_at) }}
                    </div>
                  </div>
                  <div class="ms-2 text-nowrap">
                    <button class="btn btn-sm btn-outline-primary me-1" @click="editFaq(faq)">
                      <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" @click="confirmDelete(faq)">
                      <i class="bi bi-trash"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete confirmation modal -->
    <div class="modal fade" id="deleteFaqModal" tabindex="-1" aria-labelledby="deleteFaqModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="deleteFaqModalLabel">Delete FAQ</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            Are you sure you want to delete this FAQ?
            <div v-if="faqToDelete" class="mt-2">
              <strong>Question:</strong>
              <div class="text-muted">{{ faqToDelete.question }}</div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn btn-danger" @click="performDelete">
              <i class="bi bi-trash me-1"></i> Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
  
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Modal } from 'bootstrap'
import { getFaqs, createFaq, updateFaq, deleteFaq } from '@/services/faqService'

const faqs = ref([])
const loading = ref(true)
const error = ref(null)
const success = ref('')
const editingFaq = ref(null)
const saving = ref(false)

const searchQuery = ref('')

const newFaq = ref({
  question: '',
  answer: '',
})

const filteredFaqs = computed(() => {
  if (!searchQuery.value) return faqs.value
  const q = searchQuery.value.toLowerCase()
  return faqs.value.filter(f =>
    (f.question || '').toLowerCase().includes(q) ||
    (f.answer || '').toLowerCase().includes(q)
  )
})

const statsText = computed(() => {
  const total = faqs.value.length
  const shown = filteredFaqs.value.length
  if (loading.value) return 'Loading FAQs…'
  return shown === total ? `${total} total` : `Showing ${shown} of ${total}`
})

const isFormValid = computed(() => {
  return newFaq.value.question.trim().length > 3 && newFaq.value.answer.trim().length > 3
})

const formatDate = (isoString) => {
  if (!isoString) return ''
  try {
    const d = new Date(isoString)
    if (isNaN(d.getTime())) return ''
    return d.toLocaleString()
  } catch (_) {
    return ''
  }
}

const fetchFaqs = async () => {
  try {
    error.value = null
    loading.value = true
    const response = await getFaqs()
    // Backend returns { items: [...] }
    faqs.value = Array.isArray(response.data.items) ? response.data.items : []
  } catch (err) {
    error.value = 'Failed to load FAQs.'
    console.error(err)
  } finally {
    loading.value = false
  }
}

const handleSaveFaq = async () => {
  try {
    error.value = null
    success.value = ''
    saving.value = true
    if (editingFaq.value) {
      // Update existing FAQ
      const updatedFaq = await updateFaq(editingFaq.value.faq_id, {
        question: newFaq.value.question,
        answer: newFaq.value.answer,
      })
      const index = faqs.value.findIndex(f => f.faq_id === editingFaq.value.faq_id)
      if (index !== -1) {
        // Replace immutably to keep reactivity
        const cloned = [...faqs.value]
        cloned[index] = updatedFaq.data.faq
        faqs.value = cloned
      }
      success.value = 'FAQ updated successfully.'
    } else {
      // Create new FAQ
      const result = await createFaq({
        question: newFaq.value.question,
        answer: newFaq.value.answer,
      })
      faqs.value = [result.data.faq, ...faqs.value]
      success.value = 'FAQ created successfully.'
    }
    resetForm()
  } catch (err) {
    error.value = `Failed to ${editingFaq.value ? 'update' : 'create'} FAQ.`
    console.error(err)
  } finally {
    saving.value = false
  }
}

// Delete handling with modal confirmation
const faqToDelete = ref(null)
let deleteModalInstance = null

const confirmDelete = (faq) => {
  faqToDelete.value = faq
  if (deleteModalInstance) deleteModalInstance.show()
}

const performDelete = async () => {
  if (!faqToDelete.value) return
  try {
    error.value = null
    await deleteFaq(faqToDelete.value.faq_id)
    faqs.value = faqs.value.filter(f => f.faq_id !== faqToDelete.value.faq_id)
    success.value = 'FAQ deleted successfully.'
  } catch (err) {
    error.value = 'Failed to delete FAQ.'
    console.error(err)
  } finally {
    if (deleteModalInstance) deleteModalInstance.hide()
    faqToDelete.value = null
  }
}

const editFaq = (faq) => {
  editingFaq.value = faq
  newFaq.value.question = faq.question
  newFaq.value.answer = faq.answer
}

const resetForm = () => {
  editingFaq.value = null
  newFaq.value.question = ''
  newFaq.value.answer = ''
}

onMounted(() => {
  fetchFaqs()
  const modalEl = document.getElementById('deleteFaqModal')
  if (modalEl) {
    deleteModalInstance = new Modal(modalEl)
  }
})
</script>

<style scoped>
/* Clean typography and spacing */
.answer-text { white-space: pre-wrap; }
.card { border-radius: 0.5rem; }
.list-group-item { padding: 1rem 1.25rem; }
</style>
