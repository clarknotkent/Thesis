<template>
  <div class="row mb-4">
    <!-- Total Types Card -->
    <div class="col-lg-3 col-md-6 mb-3 mb-lg-0">
      <div class="card border-primary shadow h-100">
        <div class="card-body py-2">
          <div class="d-flex align-items-center justify-content-between">
            <div>
              <div class="text-primary fw-semibold small">
                Total Types
              </div>
              <div class="h4 mb-0 fw-bold">
                {{ stats.totalTypes }}
              </div>
            </div>
            <div class="text-primary opacity-50">
              <i
                class="bi bi-collection"
                style="font-size: 2rem;"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Total Doses Card -->
    <div class="col-lg-3 col-md-6 mb-3 mb-lg-0">
      <div class="card border-success shadow h-100">
        <div class="card-body py-2">
          <div class="d-flex align-items-center justify-content-between">
            <div>
              <div class="text-success fw-semibold small">
                Total Doses
              </div>
              <div class="h4 mb-0 fw-bold">
                {{ stats.totalDoses }}
              </div>
            </div>
            <div class="text-success opacity-50">
              <i
                class="bi bi-capsule"
                style="font-size: 2rem;"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Low Stock Card -->
    <div class="col-lg-3 col-md-6 mb-3 mb-md-0">
      <div class="card border-warning shadow h-100">
        <div class="card-body py-2">
          <div class="d-flex align-items-center justify-content-between">
            <div>
              <div class="text-warning fw-semibold small">
                Low Stock
              </div>
              <div class="h4 mb-0 fw-bold">
                {{ stats.lowStock }}
              </div>
            </div>
            <div class="text-warning opacity-50">
              <i
                class="bi bi-exclamation-triangle"
                style="font-size: 2rem;"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Expiring Soon Card -->
    <div class="col-lg-3 col-md-6">
      <div class="card border-danger shadow h-100">
        <div class="card-body py-2">
          <div class="d-flex align-items-center justify-content-between">
            <div>
              <div class="text-danger fw-semibold small">
                Expiring Soon
              </div>
              <div class="h4 mb-0 fw-bold">
                {{ stats.expiringSoon }}
              </div>
            </div>
            <div class="text-danger opacity-50">
              <i
                class="bi bi-calendar-x"
                style="font-size: 2rem;"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  stats: {
    type: Object,
    default: () => ({
      totalTypes: 0,
      totalDoses: 0,
      lowStock: 0,
      expiringSoon: 0
    })
  }
})
</script>
