<template>
  <div class="landing-page bg-light min-vh-100 d-flex flex-column justify-content-center align-items-center">
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

    <!-- Credits/About Section -->
    <div
      class="credits-section mt-5 p-4 bg-white rounded shadow-sm"
      style="max-width: 600px;"
    >
      <h5
        class="text-center mb-3 fw-semibold"
        style="color: #1976d2;"
      >
        <i class="bi bi-people-fill me-2" />About the Developers
      </h5>
      <div class="row g-3">
        <div class="col-12">
          <div class="developer-card p-3 border rounded">
            <h6 class="mb-2 fw-bold">
              Japeth D. Aguelo
            </h6>
            <p class="mb-1 text-muted small">
              <i class="bi bi-briefcase me-2" />Developer
            </p>
            <p class="mb-1 small">
              <i class="bi bi-envelope me-2" /><a href="mailto:japethaguelo2001@gmail.com">japethaguelo2001@gmail.com</a>
            </p>
            <p class="mb-0 small">
              <i class="bi bi-phone me-2" />09923861591
            </p>
          </div>
        </div>
        <div class="col-12">
          <div class="developer-card p-3 border rounded">
            <h6 class="mb-2 fw-bold">
              Robert Theodore R. Bite
            </h6>
            <p class="mb-1 text-muted small">
              <i class="bi bi-briefcase me-2" />Developer
            </p>
          </div>
        </div>
        <div class="col-12">
          <div class="developer-card p-3 border rounded">
            <h6 class="mb-2 fw-bold">
              Kent Elrond Andionne L. Aspa
            </h6>
            <p class="mb-1 text-muted small">
              <i class="bi bi-briefcase me-2" />Developer
            </p>
            <p class="mb-1 small">
              <i class="bi bi-envelope me-2" /><a href="mailto:kentaspa54@gmail.com">kentaspa54@gmail.com</a>
            </p>
            <p class="mb-0 small">
              <i class="bi bi-phone me-2" />09481144267
            </p>
          </div>
        </div>
      </div>
    </div>

    <div class="mt-4 text-muted">
      <small>&copy; 2025 Thesis/Capstone 2. All rights reserved.</small>
    </div>
  </div>
</template>

<script setup>
// No script needed for static landing page
</script>

<style scoped>
.landing-page {
  background: linear-gradient(135deg, #f5f7fa 0%, #e8eef5 100%);
}

.developer-card {
  background: #fafbfc;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.developer-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.developer-card a {
  color: #1976d2;
  text-decoration: none;
}

.developer-card a:hover {
  text-decoration: underline;
}

.credits-section {
  animation: fadeInUp 0.6s ease;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>

<!-- Styles moved to src/assets/styles/components.css for consistency -->
