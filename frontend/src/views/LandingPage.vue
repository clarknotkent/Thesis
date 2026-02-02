<template>
  <div class="landing-page bg-light min-vh-100 d-flex flex-column">
    <div class="flex-grow-1 d-flex flex-column justify-content-center align-items-center">
      <div class="text-center">
        <div class="mb-2">
          <i
            class="bi bi-shield-check"
            style="font-size: 2.5rem; color: #1976d2; vertical-align: middle;"
          />
        </div>
        <h1
          class="display-4 fw-bold mb-1"
          style="color: #1976d2;"
        >
          ImmunizeMe
        </h1>
        <div class="mb-4">
          <span class="fs-4 text-secondary">Immunization Management System</span>
        </div>
        <p class="lead mb-4">
          A modern solution for managing vaccine administration, patient records, and immunization schedules.
        </p>
        <router-link
          to="/auth/login"
          class="btn btn-primary btn-lg px-5"
        >
          Get Started
        </router-link>
      </div>
    </div>

    <!-- Footer -->
    <footer class="landing-footer py-3">
      <div class="text-center">
        <p class="mb-1 text-muted" style="font-size: 0.85rem;">
          &copy; 2026 ImmunizeMe. Developed by Japeth D. Aguelo, Kent Elrond Andionne L. Aspa, Robert Theodore R. Bite
        </p>
        <p class="mb-0 text-muted" style="font-size: 0.75rem;">
          All rights reserved.
        </p>
      </div>
    </footer>
  </div>
</template>

<script setup>
// No script needed for static landing page
</script>

<style scoped>
.landing-page {
  background: linear-gradient(135deg, #f5f7fa 0%, #e8eef5 100%);
}

/* Footer Styles */
.landing-footer {
  width: 100%;
  border-top: 1px solid #e0e0e0;
  background: transparent;
  margin-top: auto;
}

@media (max-width: 768px) {
  .landing-footer p {
    font-size: 0.75rem !important;
  }
}
</style>

<!-- Styles moved to src/assets/styles/components.css for consistency -->
