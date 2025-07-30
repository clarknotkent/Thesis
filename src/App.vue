<script setup>
import { ref, onMounted, watchEffect, nextTick, computed } from 'vue'
import { pwaState } from './pwa-state.js'
import './style.css' // Import the separated CSS file

// --- STATE MANAGEMENT ---

const tasks = ref([])
const newTask = ref({ text: '', category: '' })
const taskBeforeEdit = ref(null)

// State for our custom modal
const isModalVisible = ref(false)

// NEW: State for online/offline status
const isOnline = ref(navigator.onLine)

// State for Filtering and Sorting
const filterByStatus = ref('All')
const sortKey = ref('category')
const sortDirection =ref('asc')

const statuses = ref(['Not Started', 'In Progress', 'Completed'])

// --- PWA CHECKLIST STATE ---
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

// --- COMPUTED PROPERTIES ---

const displayedTasks = computed(() => {
  let filteredTasks = [...tasks.value];
  if (filterByStatus.value !== 'All') {
    filteredTasks = filteredTasks.filter(task => task.status === filterByStatus.value);
  }
  filteredTasks.sort((a, b) => {
    let valA = a[sortKey.value] ? a[sortKey.value].toLowerCase() : '';
    let valB = b[sortKey.value] ? b[sortKey.value].toLowerCase() : '';
    if (valA < valB) return sortDirection.value === 'asc' ? -1 : 1;
    if (valA > valB) return sortDirection.value === 'asc' ? 1 : -1;
    return 0;
  });
  return filteredTasks;
});

const existingCategories = computed(() => {
  const allCategories = tasks.value.map(task => task.category);
  return [...new Set(allCategories.filter(cat => cat))];
});

// --- LIFECYCLE HOOKS ---

onMounted(() => {
  // NEW: Listen for online/offline events
  window.addEventListener('online', () => isOnline.value = true)
  window.addEventListener('offline', () => isOnline.value = false)

  const savedTasks = localStorage.getItem('tasks')
  if (savedTasks && JSON.parse(savedTasks).length > 0) {
    tasks.value = JSON.parse(savedTasks)
  } else {
    tasks.value = [
      { id: 1, text: 'Refactor CSS for the main dashboard', category: 'Programming', status: 'In Progress', isEditing: false },
      { id: 2, text: 'Leg Day: Squats and Lunges', category: 'Fitness', status: 'Completed', isEditing: false },
      { id: 3, text: 'Practice passing and receiving', category: 'Sports', status: 'Not Started', isEditing: false },
      { id: 4, text: 'Organize the pantry', category: 'Home', status: 'Not Started', isEditing: false },
    ]
  }
  saveTasks()
  runPwaChecks()
})

watchEffect(() => {
  const installableItem = pwaChecklist.value.find(item => item.id === 4)
  if (installableItem) {
    installableItem.checked = pwaState.isInstallable
  }
})

// --- CRUD FUNCTIONS ---

const handleAddTask = () => {
  if (!newTask.value.text || !newTask.value.category) {
    alert('Please fill out both task description and category.')
    return
  }
  tasks.value.unshift({
    id: Date.now(),
    text: newTask.value.text.trim(),
    category: newTask.value.category.trim(),
    status: 'Not Started',
    isEditing: false,
  })
  saveTasks()
  newTask.value = { text: '', category: '' }
  isModalVisible.value = false // Hide custom modal
}

const editTask = (task) => {
  taskBeforeEdit.value = { ...task }
  task.isEditing = true
  nextTick(() => {
      const input = document.querySelector(`[data-task-id='${task.id}'] input[type='text']`)
      if(input) input.focus()
  })
}

const saveTask = (task) => {
  task.isEditing = false
  task.text = task.text.trim();
  task.category = task.category.trim();
  taskBeforeEdit.value = null
  saveTasks()
}

const cancelEdit = (task) => {
  Object.assign(task, taskBeforeEdit.value)
  task.isEditing = false
  taskBeforeEdit.value = null
}

const deleteTask = (taskId) => {
  if (confirm('Are you sure you want to delete this task?')) {
    tasks.value = tasks.value.filter((task) => task.id !== taskId)
    saveTasks()
  }
}

// --- UTILITY FUNCTIONS ---

const saveTasks = () => {
  localStorage.setItem('tasks', JSON.stringify(tasks.value))
}

const sortBy = (key) => {
  if (sortKey.value === key) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortKey.value = key;
    sortDirection.value = 'asc';
  }
};

// Gets a dynamic CSS class for the status badge
const getStatusClass = (status) => {
  if (status === 'Completed') return 'status--completed';
  if (status === 'In Progress') return 'status--in-progress';
  return 'status--not-started';
};

// --- PWA CHECKLIST LOGIC ---
const runPwaChecks = () => {
  pwaChecklist.value[0].checked = window.location.protocol === 'https:' || window.location.hostname === 'localhost'
  const manifestElement = document.querySelector('link[rel="manifest"]')
  pwaChecklist.value[1].checked = !!manifestElement
  pwaChecklist.value[2].checked = 'serviceWorker' in navigator && navigator.serviceWorker.controller !== null
  pwaChecklist.value[4].checked = navigator.onLine === false || ('serviceWorker' in navigator && navigator.serviceWorker.controller !== null)
  if (manifestElement) {
    fetch(manifestElement.href).then(response => response.json()).then(manifest => {
      pwaChecklist.value[5].checked = !!manifest.start_url
      pwaChecklist.value[6].checked = manifest.icons && manifest.icons.length >= 2
      pwaChecklist.value[7].checked = !!manifest.theme_color && !!manifest.background_color
    })
  }
  pwaChecklist.value[9].checked = 'serviceWorker' in navigator
}
</script>

<template>
  <div id="app-container">
    <header>
      <h1>📊 Vue Task Tracker</h1>
      <p>A tracker with your custom theme!</p>
      <!-- NEW: Online Status Indicator -->
      <div class="online-status" :class="{ 'is-online': isOnline, 'is-offline': !isOnline }">
        <span class="status-dot"></span>
        <span>{{ isOnline ? 'Online' : 'Offline' }}</span>
      </div>
    </header>

    <main>
      <div class="card">
        <div class="controls-header">
          <div class="filter-group">
            <label for="statusFilter">Filter:</label>
            <select id="statusFilter" v-model="filterByStatus">
              <option value="All">All Statuses</option>
              <option v-for="stat in statuses" :key="stat" :value="stat">{{ stat }}</option>
            </select>
          </div>
          <button @click="isModalVisible = true">Add New Task</button>
        </div>

        <div class="table-container">
          <table class="task-table">
            <thead>
              <tr>
                <th @click="sortBy('category')" class="sortable-header">Category</th>
                <th @click="sortBy('text')" class="sortable-header">Task</th>
                <th @click="sortBy('status')" class="sortable-header">Status</th>
                <th class="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="displayedTasks.length === 0">
                <td colspan="4" class="text-center empty-state">No tasks match your filter.</td>
              </tr>
              <tr v-for="task in displayedTasks" :key="task.id" :data-task-id="task.id">
                <template v-if="!task.isEditing">
                  <td>{{ task.category }}</td>
                  <td>{{ task.text }}</td>
                  <td>
                    <span class="status-badge" :class="getStatusClass(task.status)">
                      {{ task.status }}
                    </span>
                  </td>
                  <td class="actions-cell">
                    <button @click="editTask(task)" class="action-button action-button--edit">Edit</button>
                    <button @click="deleteTask(task.id)" class="action-button action-button--danger">Delete</button>
                  </td>
                </template>
                <template v-else>
                  <td><input type="text" v-model="task.category" list="category-suggestions-edit"></td>
                  <td><input type="text" v-model="task.text" @keyup.enter="saveTask(task)" @keyup.esc="cancelEdit(task)"></td>
                  <td>
                    <select v-model="task.status">
                      <option v-for="stat in statuses" :key="stat" :value="stat">{{ stat }}</option>
                    </select>
                  </td>
                  <td class="actions-cell">
                    <button @click="saveTask(task)" class="action-button action-button--success">Save</button>
                    <button @click="cancelEdit(task)" class="action-button">Cancel</button>
                  </td>
                </template>
              </tr>
            </tbody>
          </table>
          <datalist id="category-suggestions-edit">
            <option v-for="cat in existingCategories" :key="cat" :value="cat"></option>
          </datalist>
        </div>
      </div>
    </main>

    <section class="pwa-checklist card">
      <h2>🎓 PWA Learning Checklist</h2>
      <ul>
        <li v-for="item in pwaChecklist" :key="item.id" :class="{ checked: item.checked }">
          <span class="status">{{ item.checked ? '✅' : '❌' }}</span>
          <span class="text">{{ item.text }}</span>
        </li>
      </ul>
    </section>
  </div>

  <!-- Custom Add Task Modal -->
  <div v-if="isModalVisible" class="modal-overlay" @click.self="isModalVisible = false">
    <div class="modal-content card">
      <h3>Add a New Task</h3>
      <form @submit.prevent="handleAddTask">
        <div class="form-group">
          <label for="taskText">Task Description</label>
          <input type="text" id="taskText" v-model="newTask.text" required>
        </div>
        <div class="form-group">
          <label for="taskCategory">Category</label>
          <input type="text" id="taskCategory" v-model="newTask.category" list="category-suggestions-add" required>
          <datalist id="category-suggestions-add">
            <option v-for="cat in existingCategories" :key="cat" :value="cat"></option>
          </datalist>
        </div>
        <div class="modal-actions">
          <button type="button" @click="isModalVisible = false">Close</button>
          <button type="submit" class="action-button--success">Save Task</button>
        </div>
      </form>
    </div>
  </div>
</template>
