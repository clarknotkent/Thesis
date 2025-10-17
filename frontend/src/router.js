import { createRouter, createWebHistory } from 'vue-router';
import QrGenerator from './components/QrGenerator.vue';
import QrScanner from './components/QrScanner.vue';

const routes = [
  { path: '/', redirect: '/generate' },
  { path: '/generate', component: QrGenerator },
  { path: '/scan', component: QrScanner }
];

export default createRouter({
  history: createWebHistory(),
  routes
});
