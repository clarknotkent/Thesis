# Parent Records Feature - Reorganized Structure

## 📁 New Folder Organization

The parent records feature has been reorganized by splitting components into feature-based folders for easier tracking and maintenance.

### Structure

```
features/parent/records/
├── patient-info/              # Patient information feature
│   ├── DependentDetails.vue   # Main page: Patient record details with tabs
│   └── PatientInfoTab.vue     # Tab component: Shows patient/guardian/birth info
│
├── vaccination-history/       # Vaccination history feature
│   ├── VaccinationHistoryTab.vue  # Tab component: Shows vaccination list
│   └── DoseCard.vue               # Component: Individual dose details card
│
├── medical-history/           # Medical history feature
│   └── MedicalHistoryTab.vue  # Tab component: Shows visit history list
│
├── visit-summary/             # Visit details feature
│   ├── VisitSummary.vue           # Main page: Detailed visit information
│   ├── VisitInfoCard.vue          # Component: Visit metadata card
│   ├── VitalSignsCard.vue         # Component: Vital signs card
│   └── ServicesProvidedCard.vue   # Component: Services provided card
│
└── vaccine-details/           # Vaccine details feature
    ├── VaccineRecordDetails.vue   # Main page: Vaccine dose history
    ├── VaccineInfoCard.vue        # Component: Vaccine information card
    └── DoseCard.vue (shared)      # Component: Individual dose card
```

## 🎯 Organization Rules

### Pages vs Components

- **Pages** (Main Views): Stay in their feature folder root
  - `DependentDetails.vue` - Patient record details page
  - `VisitSummary.vue` - Visit details page
  - `VaccineRecordDetails.vue` - Vaccine dose history page

- **Components**: Organized within their feature folder
  - Tab components (e.g., `PatientInfoTab.vue`, `VaccinationHistoryTab.vue`)
  - Card components (e.g., `DoseCard.vue`, `VisitInfoCard.vue`)
  - Feature-specific UI components

### Import Path Examples

```javascript
// DependentDetails.vue imports
import PatientInfoTab from './PatientInfoTab.vue'  // Same folder
import VaccinationHistoryTab from '../vaccination-history/VaccinationHistoryTab.vue'  // Adjacent feature
import MedicalHistoryTab from '../medical-history/MedicalHistoryTab.vue'  // Adjacent feature

// VaccineRecordDetails.vue imports
import VaccineInfoCard from './VaccineInfoCard.vue'  // Same folder
import DoseCard from '../vaccination-history/DoseCard.vue'  // Shared component

// VisitSummary.vue imports
import VisitInfoCard from './VisitInfoCard.vue'  // Same folder
import ServicesProvidedCard from './ServicesProvidedCard.vue'  // Same folder
```

## 🔄 Router Updates

All router imports have been updated to point to the new structure:

```javascript
// Parent record routes
{
  path: '/parent/records/:id',
  component: () => import('@/features/parent/records/patient-info/DependentDetails.vue')
},
{
  path: '/parent/records/:patientId/vaccine-details',
  component: () => import('@/features/parent/records/vaccine-details/VaccineRecordDetails.vue')
},
{
  path: '/parent/records/:patientId/visit/:visitId',
  component: () => import('@/features/parent/records/visit-summary/VisitSummary.vue')
}
```

## ✅ Benefits

1. **Feature-based Organization**: Each feature has its own folder with related components
2. **Easier Navigation**: Clear separation between different record types
3. **Better Maintainability**: Changes to a feature are isolated to its folder
4. **Clearer Dependencies**: Import paths show feature relationships
5. **Scalable Structure**: Easy to add new features or components

## 🚀 Next Steps

When building the new offline system from scratch:
1. Each feature folder can have its own offline strategy
2. Cache logic can be feature-specific (e.g., patient-info vs vaccination-history)
3. IndexedDB tables can map directly to feature folders
4. Easier to test and validate each feature independently
