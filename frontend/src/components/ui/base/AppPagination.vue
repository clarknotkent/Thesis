<template>
  <nav
    v-if="totalPages > 1"
    aria-label="Page navigation"
  >
    <ul class="pagination justify-content-center mb-0">
      <!-- Previous Button -->
      <li
        class="page-item"
        :class="{ disabled: currentPage === 1 }"
      >
        <button 
          class="page-link" 
          :disabled="currentPage === 1"
          @click="changePage(currentPage - 1)"
        >
          <i class="bi bi-chevron-left" />
          Previous
        </button>
      </li>

      <!-- First Page -->
      <li
        v-if="showFirstPage"
        class="page-item"
        :class="{ active: currentPage === 1 }"
      >
        <button
          class="page-link"
          @click="changePage(1)"
        >
          1
        </button>
      </li>

      <!-- First Ellipsis -->
      <li
        v-if="showFirstEllipsis"
        class="page-item disabled"
      >
        <span class="page-link">...</span>
      </li>

      <!-- Page Numbers -->
      <li 
        v-for="page in visiblePages" 
        :key="page"
        class="page-item" 
        :class="{ active: currentPage === page }"
      >
        <button
          class="page-link"
          @click="changePage(page)"
        >
          {{ page }}
        </button>
      </li>

      <!-- Last Ellipsis -->
      <li
        v-if="showLastEllipsis"
        class="page-item disabled"
      >
        <span class="page-link">...</span>
      </li>

      <!-- Last Page -->
      <li
        v-if="showLastPage"
        class="page-item"
        :class="{ active: currentPage === totalPages }"
      >
        <button
          class="page-link"
          @click="changePage(totalPages)"
        >
          {{ totalPages }}
        </button>
      </li>

      <!-- Next Button -->
      <li
        class="page-item"
        :class="{ disabled: currentPage === totalPages }"
      >
        <button 
          class="page-link" 
          :disabled="currentPage === totalPages"
          @click="changePage(currentPage + 1)"
        >
          Next
          <i class="bi bi-chevron-right" />
        </button>
      </li>
    </ul>

    <!-- Page Info -->
    <div
      v-if="showPageInfo"
      class="text-center mt-2"
    >
      <small class="text-muted">
        Showing {{ startItem }} to {{ endItem }} of {{ totalItems }} entries
      </small>
    </div>
  </nav>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  currentPage: {
    type: Number,
    required: true
  },
  totalPages: {
    type: Number,
    required: true
  },
  totalItems: {
    type: Number,
    default: 0
  },
  itemsPerPage: {
    type: Number,
    default: 10
  },
  maxVisiblePages: {
    type: Number,
    default: 5
  },
  showPageInfo: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['page-changed'])

const startItem = computed(() => {
  return (props.currentPage - 1) * props.itemsPerPage + 1
})

const endItem = computed(() => {
  return Math.min(props.currentPage * props.itemsPerPage, props.totalItems)
})

const visiblePages = computed(() => {
  const delta = Math.floor(props.maxVisiblePages / 2)
  let start = Math.max(2, props.currentPage - delta)
  let end = Math.min(props.totalPages - 1, props.currentPage + delta)

  if (props.currentPage - delta < 2) {
    end = Math.min(props.totalPages - 1, end + (2 - (props.currentPage - delta)))
  }

  if (props.currentPage + delta > props.totalPages - 1) {
    start = Math.max(2, start - (props.currentPage + delta - (props.totalPages - 1)))
  }

  const pages = []
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  
  return pages
})

const showFirstPage = computed(() => props.totalPages > 1)
const showLastPage = computed(() => props.totalPages > 1 && props.currentPage !== props.totalPages)
const showFirstEllipsis = computed(() => visiblePages.value.length > 0 && visiblePages.value[0] > 2)
const showLastEllipsis = computed(() => {
  return visiblePages.value.length > 0 && 
         visiblePages.value[visiblePages.value.length - 1] < props.totalPages - 1
})

const changePage = (page) => {
  if (page >= 1 && page <= props.totalPages && page !== props.currentPage) {
    emit('page-changed', page)
  }
}
</script>

<style scoped>
.page-link {
  color: #0d6efd;
  border: 1px solid #dee2e6;
  padding: 0.5rem 0.75rem;
  margin: 0 0.125rem;
  border-radius: 0.25rem;
  transition: all 0.15s ease-in-out;
}

.page-link:hover:not(:disabled) {
  background-color: #e9ecef;
  border-color: #adb5bd;
}

.page-item.active .page-link {
  background-color: #0d6efd;
  border-color: #0d6efd;
  color: white;
}

.page-item.disabled .page-link {
  color: #6c757d;
  background-color: #fff;
  border-color: #dee2e6;
  cursor: not-allowed;
}

.page-link:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}
</style>
