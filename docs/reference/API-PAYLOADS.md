# Admin vs BHS: API Payloads (Patients + Immunizations)

This document captures the exact request payloads sent by the Admin UI and the BHS (Health Worker) UI for common flows. Derived from the current frontend implementation as of 2025-11-07.

References:
- Admin Add Patient: `frontend/src/views/admin/patients/AddPatient.vue`
- Admin Add Immunization/Visit: `frontend/src/features/admin/patients/VisitEditor.vue`
- BHS Add Patient: `frontend/src/features/health-worker/patients/composables/usePatientForm.js`
- BHS Add Immunization: `frontend/src/views/healthworker/patients/AddPatientImmunizationRecord.vue` and `.../composables/usePatientImmunizationForm.js`


## Patients

### Admin — Create Patient (POST /patients)
Minimal shape; Admin formats `birthhistory` block.

Payload shape:
```
{
  surname: string,
  firstname: string,
  middlename?: string,
  sex: 'Male' | 'Female' | string,
  date_of_birth: 'YYYY-MM-DD',
  address?: string,
  barangay?: string,
  health_center?: string,

  guardian_id: number|string,
  relationship_to_guardian: 'mother' | 'father' | string,
  family_number?: string,

  mother_name: string,
  mother_occupation?: string,
  mother_contact_number?: string,
  father_name?: string,
  father_occupation?: string,
  father_contact_number?: string,

  // Some backends also accept these at top-level; Admin sends only inside birthhistory except (weight/length/place) may also be duplicated top-level in other flows
  birthhistory: {
    birth_weight?: number,
    birth_length?: number,
    place_of_birth?: string,
    time_of_birth: string,            // required
    attendant_at_birth: string,       // required
    type_of_delivery: string,         // required
    ballards_score?: number,
    newborn_screening_result?: string,
    hearing_test_date?: 'YYYY-MM-DD' | null,
    newborn_screening_date?: 'YYYY-MM-DD' | null
  }
}
```

Example:
```
{
  "surname": "Dela Cruz",
  "firstname": "Juan",
  "middlename": "S",
  "sex": "Male",
  "date_of_birth": "2024-08-02",
  "address": "Blk 1 Lot 2",
  "barangay": "San Roque",
  "health_center": "HC-1",
  "guardian_id": 123,
  "relationship_to_guardian": "mother",
  "family_number": "FN-001",
  "mother_name": "Maria Dela Cruz",
  "mother_occupation": "Vendor",
  "mother_contact_number": "09171234567",
  "father_name": "Jose Dela Cruz",
  "father_occupation": "Driver",
  "father_contact_number": "09181234567",
  "birthhistory": {
    "birth_weight": 3.2,
    "birth_length": 50.5,
    "place_of_birth": "City Hospital",
    "time_of_birth": "10:35",
    "attendant_at_birth": "Midwife",
    "type_of_delivery": "NSD",
    "ballards_score": 38,
    "newborn_screening_result": "Normal",
    "hearing_test_date": "2024-08-05",
    "newborn_screening_date": "2024-08-04"
  }
}
```


### BHS — Create Patient (POST /patients)
BHS follows the same server contract as Admin. The composable prepares and submits a `birthhistory` block, and may also include top-level duplicates (birth_weight/length/place) for compatibility.

Payload shape (same as Admin, with optional top-level duplicates):
```
{
  ...Admin payload fields,
  // Optional duplicates for broader backend compatibility
  birth_weight?: number,
  birth_length?: number,
  place_of_birth?: string
}
```


## Immunizations and Visits

Both Admin and BHS support two paths:
- Add immunizations into an EXISTING visit
- Create a NEW visit and include immunizations in one call

Common field meanings:
- inventory_id: inventory lot ID (required for in-facility vaccines)
- vaccine_id: vaccine master ID
- dose_number: numeric dose (1..n)
- administered_date: 'YYYY-MM-DD'
- administered_by: user_id who administered (defaults to current user when not provided)
- facility_name: optional free-text facility name
- outside: boolean, true when recorded from outside facility (no inventory_id)
- remarks: notes; Admin/BHS often auto-append Lot/Manufacturer/Site/Facility

### Admin — Add Immunization(s)

Origin: `VisitEditor.vue`

1) Add to an existing visit
- Update visit meta
  - PUT /visits/{visit_id}
  - Payload:
```
{
  recorded_by?: string|number, // user_id
  visit_date: 'YYYY-MM-DD',
  findings?: string,
  service_rendered?: string,
  updated_by?: string|number // mirrors recorded_by
}
```
- Update vitals for the visit (non-blocking if it fails)
  - PUT /vitals/{visit_id}
  - Payload:
```
{
  temperature?: number|string,
  muac?: number|string,
  respiration?: number|string,
  weight?: number|string,
  height?: number|string
}
```
- Create immunizations (one POST per vaccine)
  - POST /immunizations
  - Payload for OUTSIDE entry:
```
{
  visit_id: string|number,
  patient_id: string|number,
  vaccine_id: number,
  disease_prevented?: string|null,
  dose_number: number,
  administered_date: 'YYYY-MM-DD',
  age_at_administration?: string|null,
  administered_by?: string|number|null,
  remarks?: string|null,
  outside: true,
  vaccine_name?: string
}
```
  - Payload for IN-FACILITY entry:
```
{
  visit_id: string|number,
  patient_id: string|number,
  inventory_id: string|number,     // required
  disease_prevented?: string|null,
  dose_number: number,
  administered_date: 'YYYY-MM-DD',
  age_at_administration?: string|null,
  administered_by?: string|number|null,
  facility_name?: string|null,
  vaccine_name?: string,
  remarks?: string|null             // may include site info
}
```

2) Create a new visit and include collected immunizations
- POST /visits
- Payload:
```
{
  patient_id: string|number,
  recorded_by?: string|number,      // user_id
  visit_date: 'YYYY-MM-DD',
  findings?: string,
  service_rendered?: string,
  vitals?: {
    temperature?: number|string,
    muac?: number|string,
    respiration?: number|string,
    weight?: number|string,
    height?: number|string
  },
  collectedVaccinations: Array<OutsideEntry | InFacilityEntry>,
  services: []
}
```
- Where `OutsideEntry` and `InFacilityEntry` match the shapes above (without `visit_id` since the backend associates them on creation)


### BHS — Add Immunization(s)

Origin: `AddPatientImmunizationRecord.vue` + `usePatientImmunizationForm.js`

1) Add to an existing visit
- Upsert vitals for the visit (non-blocking if it fails)
  - PUT /vitalsigns/{visit_id}
  - Payload:
```
{
  temperature?: number|string,
  muac?: number|string,
  respiration?: number|string,
  weight?: number|string,
  height?: number|string
}
```
- Create immunizations (one POST per vaccine)
  - POST /immunizations
  - OUTSIDE payload:
```
{
  patient_id: string|number,
  vaccine_id: number,
  disease_prevented?: string|null,
  dose_number: number,
  administered_date: 'YYYY-MM-DD',
  age_at_administration?: string|null,
  administered_by?: string|number|null, // defaults to current user
  facility_name?: string|null,
  outside: true,
  remarks?: string|null
}
```
  - IN-FACILITY payload:
```
{
  patient_id: string|number,
  inventory_id: string|number,
  vaccine_id: number,
  disease_prevented?: string|null,
  dose_number: number,
  administered_date: 'YYYY-MM-DD',
  age_at_administration?: string|null,
  administered_by?: string|number|null, // defaults to current user
  facility_name?: string|null,
  remarks?: string|null,
  visit_id: string|number
}
```

2) Create a new visit and include immunizations
- POST /visits
- Payload:
```
{
  patient_id: string|number,
  visit_date: string,               // ISO timestamp used by BHS path
  recorded_by?: string|number,      // defaults to current user
  findings?: string|null,
  service_rendered?: string|null,
  vitals?: {
    temperature?: number|string,
    muac?: number|string,
    respiration?: number|string,
    weight?: number|string,
    height?: number|string
  },
  collectedVaccinations: Array<{
    inventory_id: string|number|null,
    vaccine_id: number,
    vaccine_name?: string|null,
    disease_prevented?: string|null,
    dose_number: number|null,
    administered_date: 'YYYY-MM-DD',
    age_at_administration?: string|null,
    manufacturer?: string|null,
    lot_number?: string|null,
    site?: string|null,
    administered_by?: string|number|null,
    facility_name?: string|null,
    outside: boolean,
    remarks?: string|null
  }>,
  services: []
}
```


## Notes and differences
- Admin and BHS both support outside immunizations (no inventory_id, `outside: true`).
- Admin uses `PUT /vitals/{visit_id}`, while BHS uses `PUT /vitalsigns/{visit_id}` for vitals. Both payloads are the same in shape; endpoints differ.
- Admin visit_date is formatted to PH date (YYYY-MM-DD), BHS uses a full ISO timestamp when creating a new visit.
- For in-facility entries, `inventory_id` is required; for outside, `vaccine_id` is required and `outside: true` is set.
- `remarks` may be auto-augmented with Lot, Manufacturer, Site, Facility depending on flow.
- When adding immunizations to an existing visit, Admin explicitly includes `visit_id` in each POST /immunizations call; BHS includes `visit_id` only for in-facility payloads in that path.


## Quick field reference
- patient_id: string|number — required in all immunization flows
- visit_id: string|number — required when attaching to existing visit; omitted when creating new visit
- inventory_id: string|number — required for in-facility immunization; null/omitted for outside
- vaccine_id: number — required for both outside and in-facility
- dose_number: number — required
- administered_date: 'YYYY-MM-DD' — required
- administered_by: string|number — optional; defaults to current user id in BHS flow
- vitals: { temperature, muac, respiration, weight, height } — optional; recommended when recording services in a new visit
