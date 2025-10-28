# Health Worker Features

**Platform:** Mobile-optimized (PWA)  
**Target Users:** Barangay Health Workers  
**Permissions:** Create, Read, Update (No Delete)

## Feature Structure

### � Patients (`patients/`)
**Purpose:** Patient management for health workers
- **Components:**
  - Patient cards (mobile-friendly)
  - Search and filters
  - Patient forms (Add/Edit)
  - Patient detail views
- **Access:** CREATE, READ, UPDATE
- **UI Pattern:** Cards over tables

### 📊 Dashboard (`dashboard/`)
**Purpose:** Overview and quick stats
- **Components:**
  - Statistics cards
  - Today's appointments
  - Quick actions
- **Access:** READ only
- **UI Pattern:** Gallery grid cards

### 💉 Inventory (`inventory/`)
**Purpose:** Vaccine stock viewing
- **Components:**
  - Stock level cards
  - Vaccine details (read-only)
  - Expiry alerts
- **Access:** READ only
- **UI Pattern:** Cards with status indicators

## UI Guidelines

- **Layout:** Mobile bottom navigation
- **Forms:** Single column, large touch targets
- **Lists:** Card-based, swipeable
- **Actions:** Touch gestures, FAB buttons
- **Optimization:** Offline-first, minimal data entry
- **Design:** Card-based UI over tables

## Color Scheme

- Primary: Blue (#007bff)
- Success: Green (for completed)
- Warning: Orange (for pending)
- Info: Cyan (for active status)
