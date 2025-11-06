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
        <div class="row g-4">
          <div class="col-md-5">
            <div class="card shadow">
              <div class="card-header bg-success text-white">
                <div class="d-flex align-items-center">
                  <i class="bi bi-plus-circle me-2" />
                  <strong>{{ editing ? 'Edit FAQ' : 'New FAQ' }}</strong>
                </div>
              </div>
              <div class="card-body">
                <div class="mb-3">
                  <label class="form-label fw-bold">
                    <i class="bi bi-question-circle text-primary me-1" />Question
                  </label>
                  <input
                    v-model="newQuestion"
                    class="form-control"
                    placeholder="Enter the question..."
                  >
                </div>
                <div class="mb-3">
                  <label class="form-label fw-bold">
                    <i class="bi bi-chat-quote text-success me-1" />Answer
                  </label>
                  <textarea
                    v-model="newAnswer"
                    class="form-control"
                    rows="8"
                    placeholder="Provide a detailed answer..."
                  />
                </div>
                <div class="d-flex justify-content-end gap-2">
                  <button
                    v-if="editing"
                    class="btn btn-secondary"
                    @click="cancelEdit"
                  >
                    <i class="bi bi-x-circle me-1" />Cancel
                  </button>
                  <button
                    class="btn btn-success"
                    @click="create"
                  >
                    <i class="bi bi-check-circle me-1" />{{ editing ? 'Update' : 'Create' }} FAQ
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="col-md-7">
            <div class="card shadow">
              <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                <div class="d-flex align-items-center">
                  <i class="bi bi-list-check me-2" />
                  <strong>FAQ List</strong>
                </div>
                <button
                  class="btn btn-sm btn-light"
                  @click="load"
                >
                  <i class="bi bi-arrow-clockwise me-1" />Refresh
                </button>
              </div>
              <div class="card-body p-0">
                <div class="p-3 border-bottom bg-light">
                  <div class="input-group">
                    <span class="input-group-text">
                      <i class="bi bi-search" />
                    </span>
                    <input
                      v-model="searchQuery"
                      class="form-control"
                      placeholder="Search FAQs..."
                      @input="filterFAQs"
                    >
                  </div>
                </div>
                <div style="max-height:500px; overflow:auto">
                  <div
                    v-if="filteredFAQs.length === 0"
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
                    v-for="f in filteredFAQs"
                    :key="f.faq_id"
                    class="faq-item border-bottom p-3"
                  >
                    <div class="d-flex justify-content-between align-items-start mb-2">
                      <div class="flex-grow-1">
                        <div class="d-flex align-items-center mb-2">
                          <i class="bi bi-question-circle text-primary me-2" />
                          <h6 class="mb-0 fw-bold">
                            {{ f.question }}
                          </h6>
                        </div>
                        <div class="text-muted small mb-2">
                          {{ truncate(f.answer, 150) }}
                        </div>
                        <div class="d-flex align-items-center text-muted small">
                          <i class="bi bi-calendar-event me-1" />
                          Created {{ formatDate(f.created_at) }}
                        </div>
                      </div>
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
                  </div>
                </div>
              </div>
              <div class="card-footer bg-light text-muted small">
                <i class="bi bi-info-circle me-1" />
                Total FAQs: {{ faqs.length }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import AdminLayout from '@/components/layout/desktop/AdminLayout.vue'
import api from '@/services/api'
import { useToast } from '@/composables/useToast'

const faqs = ref([])
const filteredFAQs = ref([])
const newQuestion = ref('')
const newAnswer = ref('')
const editing = ref(null)
const searchQuery = ref('')
const { addToast } = useToast()

const load = async () => {
  try {
    const res = await api.get('/faqs')
    faqs.value = res.data.items || res.data || []
    filterFAQs()
  } catch (e) { addToast({ title: 'Error', message: 'Failed to load faqs', type: 'error' }) }
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
}

const create = async () => {
  try {
    if (editing.value) {
      await api.put(`/faqs/${editing.value.faq_id}`, { question: newQuestion.value, answer: newAnswer.value })
      editing.value = null
    } else {
      await api.post('/faqs', { question: newQuestion.value, answer: newAnswer.value })
    }
    newQuestion.value = ''
    newAnswer.value = ''
    await load()
    addToast({ title: 'Saved', message: 'FAQ saved', type: 'success' })
  } catch (e) { addToast({ title: 'Error', message: 'Failed to save faq', type: 'error' }) }
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
    await api.delete(`/faqs/${id}`)
    await load()
    addToast({ title: 'Deleted', message: 'FAQ removed', type: 'success' })
  } catch (e) { addToast({ title: 'Error', message: 'Failed to delete faq', type: 'error' }) }
}

const truncate = (s, n) => s && s.length > n ? s.slice(0,n) + '…' : s

const formatDate = (s) => s ? new Date(s).toLocaleDateString() : 'Unknown'

onMounted(load)
</script>

<style scoped>
.faq-manager {
  background: var(--bs-body-bg);
  min-height: 100vh;
  padding: 2rem 0;
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
  border-color: #667eea;
  box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25);
}

.faq-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

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
