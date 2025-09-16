<template>
  <div class="landing-page bg-light min-vh-100 d-flex flex-column justify-content-center align-items-center">
    <div class="text-center">
      <div class="mb-2">
        <i class="bi bi-shield-check" style="font-size: 2.5rem; color: #1976d2; vertical-align: middle;"></i>
      </div>
      <h1 class="display-4 fw-bold mb-1" style="color: #1976d2;">
        ImmunizeMe
      </h1>
      <div class="mb-4">
        <span class="fs-4 text-secondary">Immunization Management System</span>
      </div>
      <p class="lead mb-4">
        A modern solution for managing vaccine administration, patient records, and immunization schedules.
      </p>
      <router-link to="/auth/login" class="btn btn-primary btn-lg px-5">
        Get Started
      </router-link>
    </div>
    <div class="mt-5 text-muted">
      <small>&copy; 2025 Thesis/Capstone 2. All rights reserved.</small>
    </div>
  </div>
</template>

<script setup>
// No script needed for static landing page
</script>

<!-- Styles moved to src/assets/styles/components.css for consistency -->
