# 💉 Immunization Management System

A comprehensive web-based system for managing immunization records, vaccine inventory, and patient care workflows for barangay health centers.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Features](#features)
- [User Roles](#user-roles)
- [Development Guidelines](#development-guidelines)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Deployment](#deployment)
- [Contributing](#contributing)

---

## 🎯 Overview

The Immunization Management System is designed to digitize and streamline the immunization tracking process for barangay health centers in the Philippines. It provides a centralized platform for:

- **Patient Record Management** - Digital health records for children and guardians
- **Vaccination Tracking** - Scheduled and completed vaccinations with history
- **Inventory Management** - Vaccine stock levels, receiving reports, and expiry tracking
- **SMS Management** - Comprehensive SMS notification system with PhilSMS integration
- **Reporting & Analytics** - Dashboard insights and activity logs
- **Multi-User Access** - Role-based access for admins, health workers, and parents

---

## 🛠️ Tech Stack

### **Frontend**
- **Framework:** Vue.js 3 (Composition API)
- **Build Tool:** Vite
- **Routing:** Vue Router 4
- **State Management:** Vue Reactivity API (ref, computed, reactive)
- **UI Framework:** Bootstrap 5
- **Icons:** Bootstrap Icons
- **HTTP Client:** Axios
- **Charts:** Chart.js
- **QR Code:** html5-qrcode

### **Backend**
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** PostgreSQL (Supabase)
- **Authentication:** JWT (JSON Web Tokens)
- **File Upload:** Multer
- **SMS Integration:** PhilSMS API
- **Security:** bcrypt, CORS, helmet

### **Database**
- **DBMS:** PostgreSQL 14+
- **Hosting:** Supabase
- **Features:** Row Level Security (RLS), Triggers, Functions, Views
- **Migrations:** Version-controlled SQL files in `db/`

---

## 🏗️ Architecture

### **Frontend Architecture (Feature-Based)**

```
frontend/src/
├── components/
│   ├── layout/              # Layout wrappers (AdminLayout, HealthWorkerLayout, ParentLayout)
│   └── ui/                  # Global reusable UI components
│       ├── base/            # Primitive components (buttons, cards, modals, tables)
│       ├── form/            # Form inputs (date, time, searchable select)
│       └── feedback/        # User feedback (toasts, confirm dialogs)
│
├── features/                # Business domain modules
│   ├── admin/               # Admin-specific components (SMS, inventory, analytics)
│   ├── health-worker/       # Health worker components
│   ├── parent/              # Parent portal components
│   └── shared/              # Shared components across roles
│
├── views/                   # Page components (routes)
│   ├── admin/               # Admin portal pages
│   ├── healthworker/        # Health worker portal pages
│   └── parent/              # Parent portal pages
## Documentation moved

This project's documentation has been centralized under the docs/ folder.

- Start here: docs/README.md
- Full mapping of moved files: docs/INDEX.md

Quick links:
- Changelog: docs/CHANGELOG_V2.md
- Health Worker features: docs/HEALTH_WORKER_FEATURES_QUICK_GUIDE.md
- Chat & Notifications: docs/HEALTH_WORKER_CHAT_NOTIFICATIONS.md
- SMS System (complete): docs/SMS_SYSTEM_COMPLETE.md
- SMS Quick Reference: docs/SMS_QUICK_REFERENCE.md
If you encounter a broken link, check docs/INDEX.md for the original → new path mapping.
├── services/                # Business logic (SMS, notifications)
