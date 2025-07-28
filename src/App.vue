<script setup>
import { ref, onMounted, watchEffect } from 'vue'
import { pwaState } from './pwa-state.js' // Import the shared state

// Reactive state for tasks and new task input
const tasks = ref([])
const newTask = ref('')

// PWA checklist items
const pwaChecklist = ref([
  { id: 1, text: 'Is served over HTTPS (or localhost)', checked: false },
  { id: 2, text: 'Has a Web App Manifest', checked: false },
  { id: 3, text: 'Has a Service Worker', checked: false },
  { id: 4, text: 'Is installable (shows install prompt)', checked: false },
  { id: 5, text: 'Works offline', checked: false },
  { id: 6, text: 'Has a start URL', checked: false },
  { id: 7, text: 'Manifest has necessary icons', checked: false },
  { id: 8, text: 'Manifest has theme & background color', checked: false },
  { id: 9, text: 'Is responsive on mobile', checked: true },
  { id: 10, text: 'Is fast and reliable', checked: false }
])

// Load tasks from localStorage when the component mounts
onMounted(() => {
  const savedTasks = localStorage.getItem('tasks')
  if (savedTasks) {
    tasks.value = JSON.parse(savedTasks)
  }
  runPwaChecks()
})

// NEW: Watch for changes in the shared PWA state
watchEffect(() => {
  const installableItem = pwaChecklist.value.find(item => item.id === 4)
  if (installableItem) {
    installableItem.checked = pwaState.isInstallable
  }
})

// Function to add a new task
const addTask = () => {
  if (newTask.value.trim() !== '') {
    tasks.value.unshift({ id: Date.now(), text: newTask.value.trim() })
    newTask.value = ''
    saveTasks()
  }
}

// Function to remove a task
const removeTask = (taskId) => {
  tasks.value = tasks.value.filter((task) => task.id !== taskId)
  saveTasks()
}

// Function to save tasks to localStorage
const saveTasks = () => {
  localStorage.setItem('tasks', JSON.stringify(tasks.value))
}

// UPDATED: PWA checks function (no longer needs the install listener)
const runPwaChecks = () => {
  pwaChecklist.value[0].checked = window.location.protocol === 'https:' || window.location.hostname === 'localhost'
  const manifestElement = document.querySelector('link[rel="manifest"]')
  pwaChecklist.value[1].checked = !!manifestElement
  pwaChecklist.value[2].checked = 'serviceWorker' in navigator && navigator.serviceWorker.controller !== null
  // The 'installable' check is now handled by the watchEffect above
  pwaChecklist.value[4].checked = navigator.onLine === false || ('serviceWorker' in navigator && navigator.serviceWorker.controller !== null)
  if (manifestElement) {
    fetch(manifestElement.href)
      .then(response => response.json())
      .then(manifest => {
        pwaChecklist.value[5].checked = !!manifest.start_url
        pwaChecklist.value[6].checked = manifest.icons && manifest.icons.length >= 2
        pwaChecklist.value[7].checked = !!manifest.theme_color && !!manifest.background_color
      })
  }
  pwaChecklist.value[9].checked = 'serviceWorker' in navigator
}
</script>

<template>
  <div class="container my-5">
    <div class="row justify-content-center">
      <div class="col-lg-8 col-md-10">

        <header class="text-center mb-5">
          <h1 class="fw-bold">📝 Vue Task PWA</h1>
          <p class="text-muted">A Simple Offline-First Task Management App (with Bootstrap!)</p>
        </header>

        <main>
          <div class="card shadow-sm mb-5">
            <div class="card-body">
              <div class="input-group mb-3">
                <input
                  type="text"
                  class="form-control form-control-lg"
                  v-model="newTask"
                  @keyup.enter="addTask"
                  placeholder="Add a new task..."
                  aria-label="New task input"
                />
                <button class="btn btn-primary" @click="addTask" type="button">Add Task</button>
              </div>

              <ul class="list-group list-group-flush">
                <li 
                  v-for="task in tasks" 
                  :key="task.id" 
                  class="list-group-item d-flex justify-content-between align-items-center"
                >
                  <span>{{ task.text }}</span>
                  <button @click="removeTask(task.id)" class="btn btn-sm btn-outline-danger border-0" aria-label="Delete task">
                    🗑️
                  </button>
                </li>
              </ul>
               <p v-if="tasks.length === 0" class="text-center text-muted mt-3">No tasks yet. Add one above!</p>
            </div>
          </div>
        </main>
        
        <section class="pwa-checklist">
           <div class="card shadow-sm">
             <div class="card-header text-center fw-bold">🎓 PWA Learning Checklist</div>
             <ul class="list-group list-group-flush">
                <li v-for="item in pwaChecklist" :key="item.id" class="list-group-item d-flex align-items-center" :class="{ 'text-muted': item.checked }">
                  <span class="me-2">{{ item.checked ? '✅' : '❌' }}</span>
                  <span :class="{ 'text-decoration-line-through': item.checked }">{{ item.text }}</span>
                </li>
             </ul>
             <div class="card-footer text-center text-muted small">
                 Note: For a full audit, use the Lighthouse tab in your browser's DevTools.
             </div>
           </div>
        </section>

      </div>
    </div>
  </div>
</template>

<style>
/* We can keep some global styles if needed */
body {
  background-color: #f8f9fa; /* A light Bootstrap gray */
}

/* Custom style for delete button to look cleaner on hover */
.btn-outline-danger:hover {
  color: #fff;
}
</style>