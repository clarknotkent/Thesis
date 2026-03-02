<template>
  <div>
    <header>
      <h3 style="margin:0;">QR Mini App</h3>
      <nav>
        <RouterLink to="/generate">Generate</RouterLink>
        <RouterLink to="/scan">Scan</RouterLink>
        <a href="https://github.com" target="_blank">Docs?</a>
      </nav>
    </header>
    <main>
      <RouterView />
    </main>
  </div>
</template>

<script setup>
// Nothing yet
</script>

<style scoped>
header a.router-link-active { text-decoration:underline; }
</style>
