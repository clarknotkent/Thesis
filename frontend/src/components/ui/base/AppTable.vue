<template>
  <AppCard :title="title">
    <template #actions>
      <div class="btn-group btn-group-sm">
        <AppButton 
          v-for="action in headerActions" 
          :key="action.key"
          :variant="action.variant || 'outline-primary'"
          :icon="action.icon"
          @click="$emit('header-action', action.key)"
        >
          {{ action.label }}
        </AppButton>
      </div>
    </template>

    <div class="table-responsive">
      <table class="table table-hover">
        <thead>
          <tr>
            <th
              v-for="column in columns"
              :key="column.key"
            >
              {{ column.label }}
            </th>
            <th v-if="actions.length > 0">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in data"
            :key="item[keyField]"
          >
            <td
              v-for="column in columns"
              :key="column.key"
            >
              <slot
                :name="`cell-${column.key}`"
                :item="item"
                :value="item[column.key]"
              >
                {{ item[column.key] }}
              </slot>
            </td>
            <td v-if="actions.length > 0">
              <div class="btn-group btn-group-sm">
                <AppButton 
                  v-for="action in actions" 
                  :key="action.key"
                  :variant="action.variant || 'outline-primary'"
                  :icon="action.icon"
                  @click="$emit('row-action', action.key, item)"
                >
                  {{ action.label }}
                </AppButton>
              </div>
            </td>
          </tr>
          <tr v-if="data.length === 0">
            <td
              :colspan="columns.length + (actions.length > 0 ? 1 : 0)"
              class="text-center text-muted py-4"
            >
              <slot name="empty">
                No data available
              </slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <template #footer>
      <AppPagination 
        v-if="pagination"
        :current-page="pagination.currentPage"
        :total-pages="pagination.totalPages"
        @page-change="$emit('page-change', $event)"
      />
    </template>
  </AppCard>
</template>

<script setup>
import AppCard from './AppCard.vue'
import AppButton from './AppButton.vue'
import AppPagination from './AppPagination.vue'

defineProps({
  title: {
    type: String,
    default: null
  },
  columns: {
    type: Array,
    required: true
  },
  data: {
    type: Array,
    required: true
  },
  keyField: {
    type: String,
    default: 'id'
  },
  actions: {
    type: Array,
    default: () => []
  },
  headerActions: {
    type: Array,
    default: () => []
  },
  pagination: {
    type: Object,
    default: null
  }
})

defineEmits(['row-action', 'header-action', 'page-change'])
</script>