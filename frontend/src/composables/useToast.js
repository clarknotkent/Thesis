import { ref } from 'vue';

const toasts = ref([]);
let nextId = 1;

export function addToast({ title = 'Notice', message = '', type = 'info', timeout = 4000 } = {}) {
  const id = nextId++;
  const time = new Date().toLocaleTimeString('en-PH', { timeZone: 'Asia/Manila' });
  toasts.value.push({ id, title, message, type, time });
  if (timeout > 0) setTimeout(() => dismiss(id), timeout);
  return id;
}

export function dismiss(id) {
  const idx = toasts.value.findIndex(t => t.id === id);
  if (idx !== -1) toasts.value.splice(idx, 1);
}

export function useToast() {
  return {
    toasts,
    addToast,
    dismiss,
  };
}

export default useToast;
