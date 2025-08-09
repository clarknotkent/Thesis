Immunization Management System Application using PWA, QR, and SMS Technologies
A modern, web-based application designed to streamline the management of patient immunization records. This project utilizes Vue.js for a reactive frontend, a Node.js/Express backend, and Supabase for the database. It aims to serve different user roles with specific functionalities, incorporating technologies like PWA for offline access, QR codes for quick patient retrieval, and SMS for notifications.

✨ Key Features
Role-Based Access Control: Separate interfaces and permissions for different user types (Admin, Health Worker, Parent).

Patient Management: Create, retrieve, and update patient records.

Vaccine Inventory: Manage vaccine stocks and availability.

Appointment Scheduling: Set and manage vaccination appointments.

Secure Authentication: A robust login system for all users.

Responsive Design: Tailored experiences for Desktop, Tablet, and Mobile devices.

👥 User Roles
The application is built to serve three key user groups:

City Health Staff (Admin)

Platform: Desktop Only

Permissions: Full access to all modules.

Modules:

Patient Management

Vaccine Inventory Module

User Management (Create accounts for Health Workers and Parents)

Health Worker

Platform: Tablet (Primary), Desktop (Optional)

Permissions: Can manage patient interactions and vaccinations.

Modules:

Patient Information (Search or retrieve via QR Code)

Vaccine Administration (Create/Update patient immunization records)

Appointment Management

Parent / Guardian

Platform: Mobile Phone

Permissions: Read-only access to their child's information.

Modules:

View Patient Information

View Vaccination Schedules

View Vaccination Status & Token

🛠️ Tech Stack
Frontend:

Vue.js 3 (with Vite)

Vue Router for client-side routing

Pinia for state management

Bootstrap 5 for styling

Backend:

Node.js

Express.js

Database:

Supabase (PostgreSQL)

Future Integrations:

Progressive Web App (PWA) capabilities

QR Code generation and scanning

SMS notifications (via services like Twilio)

🚀 Getting Started
Follow these instructions to get the project up and running on your local machine for development and testing purposes.

Prerequisites
Node.js (v18.x or higher recommended)

npm / yarn / pnpm

Installation
Clone the repository:

git clone https://github.com/your-username/immunization-app.git

Navigate to the project directory:

cd immunization-app

Install dependencies:

npm install

Run the development server:

npm run dev

The application will be available at http://localhost:5173 (or another port if 5173 is in use).

📁 Project Structure
The project follows a standard Vue.js structure to keep the codebase organized and scalable.

/src
|-- /assets         # Static assets like images, fonts
|-- /components     # Reusable Vue components (e.g., buttons, modals)
|   |-- /admin
|   |-- /health-worker
|   `-- /shared
|-- /layouts        # Layout components that wrap views (e.g., AdminLayout)
|-- /router         # Vue Router configuration
|-- /services       # API calls and business logic (e.g., authService.js)
|-- /stores         # Pinia state management stores
|-- /views          # Page-level components mapped to routes
|   |-- /admin
|   |-- /health-worker
|   `-- /parent
|-- App.vue         # Root Vue component
`-- main.js         # Main entry point of the application
