<template>
  <nav>
    <ul class="pagination justify-content-center mb-0">
      <li class="page-item" :class="{disabled: currentPage === 1}">
        <a class="page-link" href="#" @click.prevent="changePage(currentPage - 1)">Previous</a>
      </li>
      <li v-for="page in totalPages" :key="page" class="page-item" :class="{active: currentPage === page}">
        <a class="page-link" href="#" @click.prevent="changePage(page)">{{ page }}</a>
      </li>
      <li class="page-item" :class="{disabled: currentPage === totalPages}">
        <a class="page-link" href="#" @click.prevent="changePage(currentPage + 1)">Next</a>
      </li>
    </ul>
  </nav>
</template>

<script setup>
defineProps({
  currentPage: {
    type: Number,
    required: true
  },
  totalPages: {
    type: Number,
    required: true
  }
})

const emit = defineEmits(['page-change'])

function changePage(page) {
  emit('page-change', page)
}
</script>
