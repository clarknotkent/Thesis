<template>
  <AdminLayout>
    <div class="container-fluid">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h1 class="h3 mb-0 text-gray-800">
            FAQ Manager
          </h1>
          <p class="text-muted mb-0">
            Create, edit and manage frequently asked questions
          </p>
        </div>
      </div>

      <div class="faq-manager container py-0">
        <div class="faq-shell">
          <div class="row g-4 align-items-stretch h-100">
            <div class="col-lg-5">
              <div class="card shadow h-100 d-flex flex-column">
                <div class="card-header bg-success text-white">
                  <div class="d-flex align-items-center">
                    <i class="bi bi-plus-circle me-2" />
                    <strong>{{ editing ? 'Edit FAQ' : 'New FAQ' }}</strong>
                  </div>
                </div>
                <div class="card-body d-flex flex-column grow">
                  <div class="mb-3">
                    <label class="form-label fw-bold">
                      <i class="bi bi-question-circle text-primary me-1" />Question
                    </label>
                    <input
                      v-model.trim="newQuestion"
                      class="form-control"
                      placeholder="Enter the question..."
                    >
                  </div>
                  <div class="mb-3">
                    <label class="form-label fw-bold">
                      <i class="bi bi-chat-quote text-success me-1" />Answer
                    </label>
                    <textarea
                      v-model.trim="newAnswer"
                      class="form-control"
                      rows="8"
                      placeholder="Provide a detailed answer..."
                    />
                  </div>
                  <div class="d-flex justify-content-between align-items-center gap-2 mt-auto pt-2">
                    <small
                      v-if="editing"
                      class="text-muted"
                    >Editing ID: {{ editing?.faq_id }}</small>
                    <button
                      v-if="editing"
                      class="btn btn-secondary"
                      @click="cancelEdit"
                    >
                      <i class="bi bi-x-circle me-1" />Cancel
                    </button>
                    <button
                      class="btn btn-success"
                      :disabled="!newQuestion || !newAnswer || saving"
                      @click="create"
                    >
                      <span
                        v-if="saving"
                        class="spinner-border spinner-border-sm me-2"
                      />
                      <i class="bi bi-check-circle me-1" />{{ editing ? 'Update' : 'Create' }} FAQ
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div class="col-lg-7">
              <div class="card shadow h-100 faq-list-card d-flex flex-column">
                <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center flex-wrap gap-2">
                  <div class="d-flex align-items-center gap-2">
                    <i class="bi bi-list-check" />
                    <strong>FAQ Library</strong>
                    <span class="chip chip-light">Total: {{ faqs.length }}</span>
                    <span class="chip chip-accent">Showing: {{ filteredFAQs.length }}</span>
                  </div>
                  <div class="d-flex align-items-center gap-2">
                    <select
                      v-model="sortOption"
                      class="form-select form-select-sm w-auto"
                      @change="applySort"
                    >
                      <option value="newest">
                        Newest first
                      </option>
                      <option value="oldest">
                        Oldest first
                      </option>
                      <option value="az">
                        A → Z
                      </option>
                      <option value="za">
                        Z → A
                      </option>
                    </select>
                    <select
                      v-model.number="pageSize"
                      class="form-select form-select-sm w-auto"
                    >
                      <option :value="5">
                        5 / page
                      </option>
                      <option :value="10">
                        10 / page
                      </option>
                      <option :value="20">
                        20 / page
                      </option>
                    </select>
                    <button
                      class="btn btn-sm btn-light"
                      :disabled="loading"
                      @click="load"
                    >
                      <span
                        v-if="loading"
                        class="spinner-border spinner-border-sm me-2"
                      />
                      <i
                        v-else
                        class="bi bi-arrow-clockwise me-1"
                      />Refresh
                    </button>
                  </div>
                </div>
                <div class="card-body p-0 d-flex flex-column">
                  <div class="search-bar p-2 border-bottom bg-light sticky-top">
                    <div class="input-group">
                      <span class="input-group-text">
                        <i class="bi bi-search" />
                      </span>
                      <input
                        v-model="searchQuery"
                        class="form-control"
                        placeholder="Search FAQs..."
                        @input="debouncedSearch"
                      >
                      <button
                        class="btn btn-outline-secondary"
                        type="button"
                        :disabled="!searchQuery"
                        @click="clearSearch"
                      >
                        <i class="bi bi-x-circle" />
                      </button>
                    </div>
                  </div>
                  <div class="faq-list">
                    <div
                      v-if="loading"
                      class="p-3"
                    >
                      <div class="placeholder-glow">
                        <div
                          class="placeholder col-12 mb-2"
                          style="height:24px"
                        />
                        <div
                          class="placeholder col-10 mb-2"
                          style="height:18px"
                        />
                        <div
                          class="placeholder col-8 mb-2"
                          style="height:18px"
                        />
                      </div>
                    </div>
                    <div
                      v-else-if="filteredFAQs.length === 0"
                      class="text-center py-5"
                    >
                      <i
                        class="bi bi-question-circle text-muted"
                        style="font-size: 3rem;"
                      />
                      <h6 class="text-muted mt-3">
                        No FAQs found
                      </h6>
                      <p class="text-muted small">
                        Create your first FAQ or adjust your search
                      </p>
                    </div>
                    <div
                      v-for="f in pagedFAQs"
                      v-else
                      :key="f.faq_id"
                      class="faq-item border-bottom p-3"
                    >
                      <div class="d-flex justify-content-between align-items-start">
                        <button
                          class="btn btn-link text-start p-0 grow"
                          :aria-expanded="expandedId===f.faq_id"
                          @click="toggleExpand(f.faq_id)"
                        >
                          <div class="d-flex align-items-center mb-1">
                            <i :class="['me-2', expandedId===f.faq_id ? 'bi bi-caret-down-square' : 'bi bi-caret-right-square']" />
                            <h6 class="mb-0 fw-bold">
                              {{ f.question }}
                            </h6>
                          </div>
                        </button>
                        <div class="btn-group ms-3">
                          <button
                            class="btn btn-sm btn-outline-primary"
                            title="Edit"
                            @click="edit(f)"
                          >
                            <i class="bi bi-pencil" />
                          </button>
                          <button
                            class="btn btn-sm btn-outline-danger"
                            title="Delete"
                            @click="remove(f.faq_id)"
                          >
                            <i class="bi bi-trash" />
                          </button>
                        </div>
                      </div>
                      <transition name="fade">
                        <div
                          v-if="expandedId===f.faq_id"
                          class="mt-2"
                        >
                          <div class="text-muted">
                            {{ f.answer }}
                          </div>
                        </div>
                      </transition>
                    </div>
                  </div>
                </div>
                <div class="card-footer bg-light d-flex justify-content-between align-items-center flex-wrap gap-2">
                  <div class="text-muted small">
                    <i class="bi bi-info-circle me-1" />
                    <template v-if="filteredFAQs.length > 0">
                      Showing {{ (currentPage - 1) * pageSize + 1 }}–{{ Math.min(currentPage * pageSize, filteredFAQs.length) }} of {{ filteredFAQs.length }} FAQs
                    </template>
                    <template v-else>
                      No FAQs to show
                    </template>
                  </div>
                  <nav aria-label="FAQ pagination">
                    <ul class="pagination mb-0 pagination-sm">
                      <li
                        class="page-item"
                        :class="{ disabled: currentPage === 1 }"
                      >
                        <button
                          class="page-link"
                          :disabled="currentPage === 1"
                          @click="prevPage"
                        >
                          Prev
                        </button>
                      </li>
                      <li
                        v-for="n in totalPages"
                        :key="'p'+n"
                        class="page-item"
                        :class="{ active: n === currentPage }"
                      >
                        <button
                          class="page-link"
                          @click="goToPage(n)"
                        >
                          {{ n }}
                        </button>
                      </li>
                      <li
                        class="page-item"
                        :class="{ disabled: currentPage === totalPages }"
                      >
                        <button
                          class="page-link"
                          :disabled="currentPage === totalPages"
                          @click="nextPage"
                        >
                          Next
                        </button>
                      </li>
                    </ul>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import AdminLayout from '@/components/layout/desktop/AdminLayout.vue'
import { getFaqs, createFaq, updateFaq, deleteFaq } from '@/services/faqService'
import { useToast } from '@/composables/useToast'

const faqs = ref([])
const filteredFAQs = ref([])
const newQuestion = ref('')
const newAnswer = ref('')
const editing = ref(null)
const searchQuery = ref('')
const { addToast } = useToast()
const loading = ref(false)
const saving = ref(false)
const sortOption = ref('newest')
const expandedId = ref(null)
const pageSize = ref(5)
const currentPage = ref(1)

const totalPages = computed(() => {
  const total = Math.ceil((filteredFAQs.value?.length || 0) / pageSize.value)
  return Math.max(1, total)
})

const pagedFAQs = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredFAQs.value.slice(start, start + pageSize.value)
})

const load = async () => {
  try {
    loading.value = true
    const res = await getFaqs()
    faqs.value = Array.isArray(res?.data) ? res.data : []
    filterFAQs()
  } catch (e) { addToast({ title: 'Error', message: 'Failed to load FAQs', type: 'error' }) }
  finally { loading.value = false }
}

const filterFAQs = () => {
  if (!searchQuery.value.trim()) {
    filteredFAQs.value = faqs.value
  } else {
    const query = searchQuery.value.toLowerCase()
    filteredFAQs.value = faqs.value.filter(faq =>
      (faq.question || '').toLowerCase().includes(query) ||
      (faq.answer || '').toLowerCase().includes(query)
    )
  }
  applySort()
}

const create = async () => {
  try {
    if (!newQuestion.value || !newAnswer.value) return
    saving.value = true
    if (editing.value) {
      await updateFaq(editing.value.faq_id, { question: newQuestion.value, answer: newAnswer.value })
      editing.value = null
    } else {
      await createFaq({ question: newQuestion.value, answer: newAnswer.value })
    }
    newQuestion.value = ''
    newAnswer.value = ''
    await load()
    addToast({ title: 'Saved', message: 'FAQ saved', type: 'success' })
  } catch (e) { addToast({ title: 'Error', message: 'Failed to save FAQ', type: 'error' }) }
  finally { saving.value = false }
}

const edit = (f) => {
  editing.value = f
  newQuestion.value = f.question
  newAnswer.value = f.answer
}

const cancelEdit = () => {
  editing.value = null
  newQuestion.value = ''
  newAnswer.value = ''
}

const remove = async (id) => {
  try {
    if (!confirm('Delete this FAQ?')) return
    await deleteFaq(id)
    await load()
    addToast({ title: 'Deleted', message: 'FAQ removed', type: 'success' })
  } catch (e) { addToast({ title: 'Error', message: 'Failed to delete FAQ', type: 'error' }) }
}

const truncate = (s, n) => s && s.length > n ? s.slice(0,n) + '…' : s

const formatDate = (s) => s ? new Date(s).toLocaleDateString() : 'Unknown'

onMounted(load)

// UX helpers
let searchTimer
const debouncedSearch = () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(filterFAQs, 300)
}

const applySort = () => {
  const arr = [...filteredFAQs.value]
  switch (sortOption.value) {
    case 'oldest':
      arr.sort((a,b) => new Date(a.created_at || a.updated_at || 0) - new Date(b.created_at || b.updated_at || 0))
      break
    case 'az':
      arr.sort((a,b) => (a.question||'').localeCompare(b.question||''))
      break
    case 'za':
      arr.sort((a,b) => (b.question||'').localeCompare(a.question||''))
      break
    case 'newest':
    default:
      arr.sort((a,b) => new Date(b.created_at || b.updated_at || 0) - new Date(a.created_at || a.updated_at || 0))
  }
  filteredFAQs.value = arr
  currentPage.value = 1
}

const toggleExpand = (id) => {
  expandedId.value = (expandedId.value === id ? null : id)
}

const clearSearch = () => {
  searchQuery.value = ''
  filterFAQs()
}

// pagination handlers
const goToPage = (n) => {
  const target = Math.min(Math.max(1, n), totalPages.value)
  currentPage.value = target
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) currentPage.value += 1
}

const prevPage = () => {
  if (currentPage.value > 1) currentPage.value -= 1
}

// keep current page valid when filtered list changes
watch(filteredFAQs, () => {
  if ((currentPage.value - 1) * pageSize.value >= filteredFAQs.value.length) {
    currentPage.value = 1
  }
})
</script>

<style scoped>
.faq-manager {
  background: var(--bs-body-bg);
  background-color: transparent;
  padding: 0;
}

/* Fixed-height shell similar to chat layout so only internal list scrolls */
.faq-shell {
  height: calc(100vh - 200px);
  min-height: 600px;
  overflow: hidden;
}

.faq-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.faq-header {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 15px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.faq-header h2 {
  color: #2c3e50;
  margin-bottom: 1rem;
  font-weight: 600;
}

.search-input {
  border-radius: 25px;
  border: 2px solid #e9ecef;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.search-input:focus {
  border-color: none !important;
  box-shadow: none !important;
}

.faq-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

/* Ensure cards fill the shell height in this view */
.faq-manager .card { height: 100% !important; }

.faq-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 15px;
  padding: 1.5rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.faq-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}

.faq-card h5 {
  color: #2c3e50;
  margin-bottom: 0.5rem;
  font-weight: 600;
}

.faq-card p {
  color: #6c757d;
  margin-bottom: 1rem;
  line-height: 1.5;
}

.faq-meta {
  font-size: 0.875rem;
  color: #adb5bd;
  margin-bottom: 1rem;
}

.faq-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

.btn-icon {
  width: 35px;
  height: 35px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-edit {
  background: #ffc107;
  color: white;
}

.btn-edit:hover {
  background: #e0a800;
  transform: scale(1.1);
}

.btn-delete {
  background: #dc3545;
  color: white;
}

.btn-delete:hover {
  background: #c82333;
  transform: scale(1.1);
}

.form-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 15px;
  padding: 2rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.form-card h4 {
  color: #2c3e50;
  margin-bottom: 1.5rem;
  font-weight: 600;
}

.search-bar {
  border: 1px solid #dee2e6;
  height: auto;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-label {
  color: #495057;
  font-weight: 500;
  margin-bottom: 0.5rem;
  display: block;
}

.form-control {
  border-radius: 10px;
  border: 2px solid #e9ecef;
  padding: 0.75rem;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.form-control:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25);
}

.form-control.textarea {
  min-height: 120px;
  resize: vertical;
}

.btn-primary {
  background: #667eea;
  border: none;
  border-radius: 25px;
  padding: 0.75rem 2rem;
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.btn-secondary {
  background: #6c757d;
  border: none;
  border-radius: 25px;
  padding: 0.75rem 2rem;
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn-secondary:hover {
  background: #5a6268;
  transform: translateY(-2px);
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #6c757d;
}

.fade-enter-active, .fade-leave-active { transition: opacity .15s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* Keep list layout tidy without internal scrolling */
.faq-list-card .card-body { display: flex; flex-direction: column; }

/* Header polish */
.faq-list-card .card-header.bg-primary {
  background: linear-gradient(135deg, #0d6efd 0%, #3b82f6 100%);
}
.card-header.bg-success {
  background: linear-gradient(135deg, #198754 0%, #22c55e 100%);
}

/* Chips */
.chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 16px;
  font-size: 0.75rem;
  font-weight: 600;
}
.chip-light { background: rgba(255,255,255,0.9); color: #0f172a; }
.chip-accent { background: rgba(13,110,253,0.15); color: #0d6efd; }

/* Tidy link appearance and beautify list */
.faq-manager a { text-decoration: none; }
.faq-manager a:hover, .faq-manager a:focus { text-decoration: none; }

.faq-item { transition: background-color .15s ease, box-shadow .15s ease; border-bottom: 1px solid #eef1f4; border-radius: 8px; }
.faq-item:hover { background-color: #f8fafc; box-shadow: 0 1px 0 rgba(0,0,0,0.02); }
.faq-item .btn-link { text-decoration: none; color: inherit; }
.faq-item .btn-link:hover, .faq-item .btn-link:focus { text-decoration: none; color: var(--bs-primary); }
.faq-item .btn-group .btn { border-radius: 8px; }

.empty-state i {
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

@media (max-width: 768px) {
  .faq-grid {
    grid-template-columns: 1fr;
  }
  
  .faq-header, .form-card {
    padding: 1.5rem;
  }
  
  .faq-actions {
    justify-content: center;
  }
}
</style>
