import { ref, computed, watch } from 'vue'

export default function usePagination(itemsRef, defaultPageSize = 6) {
  const currentPage = ref(1)
  const pageSize = ref(defaultPageSize)

  const totalPages = computed(() => {
    const len = (itemsRef && itemsRef.value) ? itemsRef.value.length : 0
    return Math.max(1, Math.ceil(len / pageSize.value))
  })

  const paginatedItems = computed(() => {
    const items = (itemsRef && itemsRef.value) ? itemsRef.value : []
    const start = (currentPage.value - 1) * pageSize.value
    return items.slice(start, start + pageSize.value)
  })

  // Keep currentPage in range when items change
  watch([itemsRef, pageSize], () => {
    if (currentPage.value > totalPages.value) {
      currentPage.value = Math.max(1, totalPages.value)
    }
  })

  function setPage(page) {
    let p = Number(page) || 1
    if (p < 1) p = 1
    if (p > totalPages.value) p = totalPages.value
    currentPage.value = p
  }

  const paginationData = computed(() => ({ currentPage: currentPage.value, totalPages: totalPages.value }))

  return { currentPage, pageSize, totalPages, paginatedItems, setPage, paginationData }
}
