# Features Folder Structure

This folder contains all business domain features organized by user role.

## 📁 Structure

```
features/
├── admin/              # Desktop-optimized features for Admins
│   ├── analytics/
│   ├── inventory/
│   ├── patients/
│   └── user-management/
│
├── health-worker/      # Mobile-optimized features for Health Workers
│   ├── patient-lookup/
│   ├── quick-visit/
│   └── vaccine-tracking/
│
├── parent/             # Mobile-optimized features for Parents
│   ├── appointments/
│   ├── my-children/
│   └── vaccine-card/
│
└── shared/             # Features shared across multiple roles
    └── chat/
```

## 🎯 Role Guidelines

### Admin (Desktop)
- **Platform:** Desktop browsers (Chrome, Edge, Firefox)
- **Screen Size:** 1024px+ 
- **Interaction:** Mouse, keyboard
- **Layout:** Sidebar navigation, complex data tables
- **Focus:** Productivity, data management, reporting

### Health Worker (Mobile)
- **Platform:** Mobile PWA (iOS Safari, Android Chrome)
- **Screen Size:** 320px - 428px
- **Interaction:** Touch, gestures
- **Layout:** Bottom navigation, card-based
- **Focus:** Quick data entry, offline capability, field work

### Parent (Mobile)
- **Platform:** Mobile PWA (iOS Safari, Android Chrome)
- **Screen Size:** 320px - 428px
- **Interaction:** Touch, gestures
- **Layout:** Tab navigation, simple views
- **Focus:** View-only, notifications, simplicity

## 📦 Import Guidelines

### Importing Admin Features
```javascript
import { PatientForm, PatientTable } from '@/features/admin/patients'
import { InventoryStats } from '@/features/admin/inventory'
```

### Importing Health Worker Features
```javascript
import { QuickVisit } from '@/features/health-worker/quick-visit'
import { QRScanner } from '@/features/health-worker/patient-lookup'
```

### Importing Parent Features
```javascript
import { VaccineCard } from '@/features/parent/vaccine-card'
import { ChildrenList } from '@/features/parent/my-children'
```

### Importing Shared Features
```javascript
import { ChatWidget } from '@/features/shared/chat'
```

## 🏗️ When to Create a New Feature

### Add to `admin/`
- Complex CRUD operations
- Data tables with advanced filtering
- Bulk operations
- System configuration
- Reports and analytics

### Add to `health-worker/`
- Field data collection
- Offline-capable forms
- QR/barcode scanning
- Quick lookups
- Mobile-optimized workflows

### Add to `parent/`
- View-only interfaces
- Simple appointment booking
- Notification preferences
- Profile updates

### Add to `shared/`
- Only if the component is:
  - Used by 2+ roles
  - Has the same UI/UX
  - Differs only in data/permissions

## ⚠️ Anti-Patterns to Avoid

❌ Don't create role-specific variations in shared  
❌ Don't duplicate components across role folders  
❌ Don't mix desktop and mobile components in same feature  
❌ Don't add features before you need them (YAGNI)

## ✅ Best Practices

✅ Keep components small and focused  
✅ Use composables for shared business logic  
✅ Export all components through index.js  
✅ Document component purpose in README  
✅ Use role-appropriate UI patterns
