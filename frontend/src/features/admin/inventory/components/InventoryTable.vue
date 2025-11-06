<template>
  <div class="card shadow mb-4">
    <div class="card-header py-3 d-flex justify-content-between align-items-center">
      <h6 class="m-0 fw-bold text-primary">
        Vaccine Stock
      </h6>
      <div class="d-flex gap-2 align-items-center">
        <div class="input-group w-25">
          <input 
            type="text" 
            class="form-control" 
            placeholder="Search vaccines..." 
            :value="searchTerm"
            aria-label="Search"
            @input="$emit('update:searchTerm', $event.target.value)"
          >
          <button
            class="btn btn-outline-primary"
            type="button"
          >
            <i class="bi bi-search" />
          </button>
        </div>
        <div class="dropdown ms-2">
          <button 
            id="filterDropdown" 
            class="btn btn-outline-secondary dropdown-toggle" 
            type="button" 
            data-bs-toggle="dropdown" 
            aria-expanded="false"
          >
            Filter: {{ filterLabel }}
          </button>
          <ul
            class="dropdown-menu"
            aria-labelledby="filterDropdown"
          >
            <li>
              <a
                class="dropdown-item"
                href="#"
                @click.prevent="$emit('filter-change', 'All')"
              >All Vaccines</a>
            </li>
            <li>
              <a
                class="dropdown-item"
                href="#"
                @click.prevent="$emit('filter-change', 'NIP')"
              >NIP Vaccines</a>
            </li>
            <li>
              <a
                class="dropdown-item"
                href="#"
                @click.prevent="$emit('filter-change', 'Others')"
              >Other Vaccines</a>
            </li>
          </ul>
        </div>
        <!-- Sort Dropdown -->
        <div class="dropdown ms-2">
          <button 
            id="sortDropdown" 
            class="btn btn-outline-secondary dropdown-toggle" 
            type="button" 
            data-bs-toggle="dropdown" 
            aria-expanded="false"
          >
            Sort: {{ currentSort }}
          </button>
          <ul
            class="dropdown-menu"
            aria-labelledby="sortDropdown"
          >
            <li>
              <a
                class="dropdown-item"
                href="#"
                @click.prevent="$emit('sort-change', 'Name A-Z')"
              >Name A-Z</a>
            </li>
            <li>
              <a
                class="dropdown-item"
                href="#"
                @click.prevent="$emit('sort-change', 'Name Z-A')"
              >Name Z-A</a>
            </li>
            <li>
              <a
                class="dropdown-item"
                href="#"
                @click.prevent="$emit('sort-change', 'Quantity Low-High')"
              >Quantity Low-High</a>
            </li>
            <li>
              <a
                class="dropdown-item"
                href="#"
                @click.prevent="$emit('sort-change', 'Quantity High-Low')"
              >Quantity High-Low</a>
            </li>
            <li>
              <a
                class="dropdown-item"
                href="#"
                @click.prevent="$emit('sort-change', 'Expiry Date')"
              >Expiry Date</a>
            </li>
          </ul>
        </div>
      </div>
    </div>
    <div class="card-body">
      <div class="table-responsive">
        <table class="table table-hover">
          <thead class="table-light">
            <tr>
              <th>Vaccine Name</th>
              <th>Brand Name</th>
              <th>Manufacturer</th>
              <th>Expiry Date</th>
              <th>Quantity</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="vaccine in paginatedVaccines"
              :key="vaccine.id"
            >
              <td class="fw-semibold">
                {{ vaccine.vaccineName }}
              </td>
              <td>{{ vaccine.brandName }}</td>
              <td>{{ vaccine.manufacturer }}</td>
              <td>{{ formatDate(vaccine.expiryDate) }}</td>
              <td>
                <span
                  class="fw-bold"
                  :class="getQuantityClass(vaccine.quantity)"
                >
                  {{ vaccine.quantity }}
                </span>
              </td>
              <td>
                <span
                  class="badge"
                  :class="getStatusBadgeClass(vaccine.status)"
                >
                  {{ vaccine.status }}
                </span>
              </td>
              <td>
                <div class="d-flex gap-2">
                  <router-link 
                    :to="`/admin/vaccines/view/${vaccine.id}`"
                    class="btn btn-sm btn-outline-primary"
                  >
                    <i class="bi bi-eye me-2" />View
                  </router-link>
                  <button 
                    class="btn btn-sm btn-outline-danger" 
                    @click="$emit('delete', vaccine)"
                  >
                    <i class="bi bi-trash me-2" />Delete
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="paginatedVaccines.length === 0">
              <td
                colspan="7"
                class="text-center text-muted py-4"
              >
                No vaccines found
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <div class="card-footer">
      <AppPagination
        :current-page="currentPage"
        :total-pages="totalPages"
        :total-items="totalItems"
        :items-per-page="itemsPerPage"
        @page-changed="$emit('page-changed', $event)"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import AppPagination from '@/components/ui/base/AppPagination.vue'

const props = defineProps({
  paginatedVaccines: {
    type: Array,
    required: true
  },
  searchTerm: {
    type: String,
    default: ''
  },
  currentFilter: {
    type: String,
    default: 'All'
  },
  currentSort: {
    type: String,
    default: 'Name A-Z'
  },
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
    required: true
  },
  itemsPerPage: {
    type: Number,
    default: 5
  },
  formatDate: {
    type: Function,
    required: true
  },
  getQuantityClass: {
    type: Function,
    required: true
  },
  getStatusBadgeClass: {
    type: Function,
    required: true
  }
})

const filterLabel = computed(() => {
  switch (props.currentFilter) {
    case 'NIP': return 'NIP Vaccines'
    case 'Others': return 'Other Vaccines'
    default: return 'All Vaccines'
  }
})

defineEmits(['update:searchTerm', 'filter-change', 'sort-change', 'delete', 'page-changed'])
</script>
