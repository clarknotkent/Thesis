import { ref, computed } from 'vue'

export default function usePagination(items, itemsPerPage = 5) {
  const currentPage = ref(1)
  const perPage = ref(itemsPerPage)

  const totalPages = computed(() => {
    return Math.ceil(items.value.length / perPage.value)
  })

  const paginatedItems = computed(() => {
    const startIndex = (currentPage.value - 1) * perPage.value
    const endIndex = startIndex + perPage.value
    return items.value.slice(startIndex, endIndex)
  })

  const nextPage = () => {
    if (currentPage.value < totalPages.value) {
      currentPage.value++
    }
  }

  const prevPage = () => {
    if (currentPage.value > 1) {
      currentPage.value--
    }
  }

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages.value) {
      currentPage.value = page
    }
  }

  // Array of page numbers to display in pagination controls
  const pageNumbers = computed(() => {
    const pages = []
    const maxPagesToShow = 5
    
    if (totalPages.value <= maxPagesToShow) {
      // If we have fewer pages than max, show all pages
      for (let i = 1; i <= totalPages.value; i++) {
        pages.push(i)
      }
    } else {
      // Always include first page
      pages.push(1)
      
      // Calculate start and end pages to show
      let startPage = Math.max(2, currentPage.value - 1)
      let endPage = Math.min(totalPages.value - 1, currentPage.value + 1)
      
      // Adjust the start and end if we're at the beginning or end
      if (currentPage.value <= 3) {
        endPage = Math.min(maxPagesToShow - 1, totalPages.value - 1)
      } else if (currentPage.value >= totalPages.value - 2) {
        startPage = Math.max(2, totalPages.value - maxPagesToShow + 2)
      }
      
      // Add ellipsis if needed before the shown pages
      if (startPage > 2) {
        pages.push('...')
      }
      
      // Add the middle pages
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i)
      }
      
      // Add ellipsis if needed after the shown pages
      if (endPage < totalPages.value - 1) {
        pages.push('...')
      }
      
      // Always include last page
      if (totalPages.value > 1) {
        pages.push(totalPages.value)
      }
    }
    
    return pages
  })

  return {
    currentPage,
    perPage,
    totalPages,
    paginatedItems,
    nextPage,
    prevPage,
    goToPage,
    pageNumbers
  }
}