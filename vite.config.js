import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    proxy: {
      // Forward /api and /d requests to Express during development
      '/api': 'http://localhost:5055',
      '/d':   'http://localhost:5055',
    }
  }
});
