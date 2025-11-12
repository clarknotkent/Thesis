import { ref } from 'vue';

const isOnline = ref(navigator.onLine);

const updateStatus = () => {
  isOnline.value = navigator.onLine;
  console.log(`Network status changed: ${isOnline.value ? 'Online' : 'Offline'}`);
};

// Set up listeners immediately
window.addEventListener('online', updateStatus);
window.addEventListener('offline', updateStatus);

export function useNetworkStore() {
  return { isOnline };
}