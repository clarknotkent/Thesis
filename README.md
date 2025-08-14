#  Vue Task Tracker PWA
A simple, modern, and offline-first task management application built with Vue.js and Vite. This project serves as a practical guide to understanding Progressive Web App (PWA) concepts, including service workers, offline capabilities, and installability, all while providing a functional task tracker with full CRUD operations.
--
## ✨ Features 
This application comes packed with features designed to demonstrate both modern web development practices and PWA functionality:

- Full CRUD Operations: Create, Read, Update, and Delete tasks seamlessly.

- Dynamic Categories: A free-flowing category system with autocomplete suggestions based on previously used categories.

- Task Filtering: Filter tasks by their status (Not Started, In Progress, Completed).

- Dynamic Sorting: Sort the task list by category, task description, or status in ascending or descending order.

- Persistent State: Tasks are saved to the browser's localStorage, so your data persists between sessions.

- Offline-First PWA: Fully functional as a Progressive Web App.

- Installable: Can be installed on desktop and mobile devices for a native-app-like experience.

- Works Offline: The service worker caches all necessary assets, allowing the app to load and function even without an internet connection.

- Online/Offline Indicator: A clear UI element that shows the user's current connection status.

- Responsive Design: A clean, custom-styled interface that works beautifully on all screen sizes.

- PWA Learning Checklist: An in-app checklist that dynamically updates to help you learn and verify the core concepts of a PWA.

## 🚀 Installation and Setup

### Prerequisites
- Node.js: Make sure you have Node.js installed. You can download it from nodejs.org.

### Steps
Clone the repository (or download the source code):

git clone <your-repository-url>
cd <your-project-directory>

Install dependencies:
This command will install all the necessary packages, including Vue, Vite, and the PWA plugin.

npm install

Run the development server:
This will start the application in development mode with hot-reloading.

npm run dev

Open in your browser:
Navigate to the local URL provided in the terminal (usually http://localhost:5173).

🛠️ Build and Deploy as a PWA
To build the application for production and test its PWA features, follow these instructions.

Build the application:
This command bundles the app and generates the service worker and manifest file. The output will be in a dist folder.

npm run build

Serve the production build:
To test the PWA features, you must serve the contents of the dist folder. The easiest way is with the serve package.

npx serve -s dist

Test and Install:
Open the local URL provided by serve (e.g., http://localhost:3000).

In your browser's developer tools, go to the Application tab to inspect the service worker and manifest.

Look for the install icon in the address bar to install the app on your device.

## 💻 Technologies Used
- Vue.js 3: A progressive JavaScript framework for building user interfaces.

- Vite: A next-generation frontend tooling that provides an extremely fast development experience.

- vite-plugin-pwa: A Vite plugin that generates the necessary service worker and manifest for a PWA.

- Custom CSS: A custom-built, responsive stylesheet for a unique light-mode theme.
