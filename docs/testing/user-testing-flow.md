# User Testing Flows by Role

This guide defines end-to-end manual test flows for each user role (Admin, BHS staff, Nurse/Nutritionist, Guardian). Use it during UAT and regression to validate permissions, data integrity, soft-delete behavior, dashboards, messaging, notifications, reporting, and inventory.

## How to use this document
- Each flow is a concise checklist with expected results. Mark each step Pass/Fail.
- IDs like [TF-ADM-01] help reference results and defects.
- Unless stated, perform all steps on web UI with a clean test dataset. Where helpful, API/route references are noted from `backend/routes/*` and `backend/controllers/*`.

## Preconditions and test data
- Test accounts
  - Admin: `admin@test.local` / password
  - BHS staff: `bhs@test.local` / password
  - Nurse: `nurse@test.local` / password
  - Nutritionist: `nutri@test.local` / password
  - Guardian: `guardian@test.local` / password
- Seed data
  - At least 3 sample patients; 1 with complete immunizations, 1 partially vaccinated, 1 newborn with schedules.
  - Vaccine catalog items with stock (Receiving Reports) for 7 NIP vaccines defined in your system configuration.
  - At least 1 visit created by BHS, and a separate visit created by Nurse.
  - At least 2 SMS templates and 3 FAQs.
- Environment
  - Emails/SMS delivery pointed to sandbox/dev services. Ensure logs are viewable (`backend/models/smsModel.js`).
  - Activity logging enabled (`backend/models/activityLogger.js`).

---

## Common checks (all roles)
- [TF-COM-01] Authentication: login works; wrong password is rejected; lockout or throttling applied if configured.
- [TF-COM-02] Profile: view own profile; update allowed fields; password change requires current password and validates complexity.
- [TF-COM-03] Notifications: list shows newest first; unread badge updates when opened; pagination/"load more" works.
- [TF-COM-04] Conversations/Chat: start conversation where role allows; send/receive; typing indicator/read receipts if supported; attachments if applicable.
- [TF-COM-05] Security: cannot access another user’s private data by guessing IDs/URLs; API returns 403/404 appropriately.

---

## Admin flows
Admin can create, read, update, and soft-delete across all modules; can view everything.

### Dashboard
- [TF-ADM-01] 7 NIP Vaccines usage overview
  - Open Dashboard (`backend/routes/dashboardRoutes.js`).
  - Expected: Chart/cards reflect counts across all patients and all records for the seven NIP categories configured.
  - Cross-check: Navigate to Immunization records and verify total counts match underlying data.

### Patients and related records
- [TF-ADM-02] Patient CRUD + soft delete
  - Create a new patient with complete demographics (`patientRoutes.js`).
  - Read: find via list/search; open details page.
  - Update: edit an attribute (e.g., address) and save.
  - Soft-delete: delete the patient; confirm it disappears from default lists but exists in archived/with filter; restore if supported.
  - Smart autofill: when selecting a Guardian and setting relationship to Mother/Father, verify mother's/father's name, contact, and occupation auto-populate; when selecting Mother's/Father's name from suggestions, verify contact and occupation fill; co-parent suggestion should also include occupation when available.
- [TF-ADM-03] Visits and Vitals
  - Create a new Visit (`visitRoutes.js`), add Vitals (`vitalsRoutes via controllers/vitalsController.js`).
  - Update vitals; verify audit trail in Activity Logs.
- [TF-ADM-04] Immunizations including schedules
  - Add vaccines to a visit (`immunizationRoutes.js`).
  - Edit an immunization entry; mark as administered; set next schedule.
- [TF-ADM-05] Deworming and Vitamina
  - Add deworming record (`dewormingRoutes.js`), add vitamina record (`vitaminaController.js`).
  - Update and soft-delete; verify retention/audit.

### Users, roles, and staff
- [TF-ADM-06] Users & Roles management
  - Create a Health Worker (`healthWorkerRoutes.js`) and assign role (BHS, Nurse, Nutritionist).
  - Create a Guardian (`guardianRoutes.js`) and link to a patient/children where applicable.
  - Update user; disable/soft-delete; confirm access revoked on next login.

### Inventory and vaccines
- [TF-ADM-07] Receiving Reports (add stock)
  - Create a Receiving Report (`receivingReportRoutes.js`) to add stock for several vaccines.
  - Expected: Vaccine stock levels increase accordingly.
- [TF-ADM-08] Vaccine catalog and stock adjustments
  - Create a vaccine item (`vaccineRoutes.js`), edit metadata.
  - Adjust stock (increase/decrease) via inventory UI/service; record reason; verify stock ledger entry in Activity Logs.

### Messaging, notifications, and templates
- [TF-ADM-09] Conversations/Chat
  - Start a new chat with BHS, Nurse, and a Guardian (`conversationRoutes.js`). Send and receive messages.
- [TF-ADM-10] Notifications creation
  - Create a broadcast notification to all Guardians and a targeted one to a single user (`notificationRoutes.js`). -- NOT A FOCUS/IMPORTANT YET --
  - Verify recipients receive notifications and can open them.
- [TF-ADM-11] SMS: logs and templates; manual send
  - View SMS logs (`smsRoutes.js`) and filter by status/date.
  - Create/Update/Delete SMS templates (`notificationTemplatesRoutes.js` or SMS templates feature per UI).
  - Manually send an SMS reminder to a Guardian; check that it appears in logs with correct status and content.

### Reporting and FAQs
- [TF-ADM-12] Reports by month
  - Generate a report for a specific month (`reportRoutes.js`).
  - Validate totals across patients, doses, stocks used; export/print if available.
- [TF-ADM-13] FAQ Manager
  - Create a new FAQ (`faqRoutes.js`), update, and delete.
  - Verify ordering/search and visibility to Guardians.

### Auditing, logs, and system
- [TF-ADM-14] Activity logs (all users) and system logs
  - Open Activity Logs (`activityRoutes.js`), filter by user, date, module.
  - Verify that actions from tests above are present with correct metadata.
  - View system logs if available and check for warnings/errors during tests.

### QR access
- [TF-ADM-15] QR scan path
  - Use QR code scan flow (`qrRoutes.js`) to open a patient; verify details are accessible and correct. -- NOT IMPLEMENTED YET --

---

## BHS flows
BHS can view patients and their records; add new patients; limited editing depending on sub-role.

### BHS (generic permissions)
- [TF-BHS-01] View patient list and records
  - List patients; open details; verify tabs for details, vaccine history, schedules, medical history are visible and populated.
- [TF-BHS-02] Scan QR to patient details
  - Use QR scanner to open a known patient; verify navigation and data accuracy.
- [TF-BHS-03] Add new patient
  - Create a patient; verify appears in list and is visible to Admin and Nurse.
  - Smart autofill & suggestions (parity with Admin):
    - Select a Guardian and set Relationship to Mother/Father.
      - Expect the corresponding parent’s Name, Contact, and Occupation to auto-fill from the guardian; if Occupation is missing, the parent name field should open suggestions automatically.
    - Focus the Mother’s/Father’s Name input with an empty value.
      - Expect the dropdown to open with top suggestions (up to 10), even before typing.
      - Selecting a name should also fill Contact and Occupation when available.
    - When Mother or Father is filled, the co-parent should be suggested and auto-filled (including Occupation when available). If Contact/Occupation remains empty, the co-parent’s suggestions should open automatically.
- [TF-BHS-04] Reschedule not-completed schedules
  - For a patient with pending schedules, reschedule to a future date; verify status and audit entry.
- [TF-BHS-05] Inventory view-only
  - Open Inventory; verify stock list is visible but no create/edit controls; attempts to adjust stock are blocked by RBAC.
- [TF-BHS-06] Notifications and conversations
  - View notifications; start a conversation with Admin/Nurse; send and receive messages.

### Edit vaccine history with approval workflow
- [TF-BHS-07] Submit vaccine history edit (requires approval)
  - Attempt to edit an existing immunization entry; a modal for approval should appear that requires either an admin or another staff's credentials.

### Sub-roles under BHS umbrella

#### BHS (barangay health worker/non-allied staffs)
- [TF-BHS-01] Add patient and record vitals only
  - Create patient; create a Visit; add Vitals; verify that adding Immunizations is forbidden (no UI control or 403 on API).

#### Nurse
- [TF-NUR-01] Add patient and choose or create visit
  - Create patient; choose an existing Visit created by BHS or create a new Visit.
- [TF-NUR-02] Administer/add vaccines to a visit record
  - Add one or more immunizations; update dose status; set follow-up schedule; verify inventory decrement if tracked.

#### Nutritionist
- [TF-NUT-01] Add patient and choose/create visit
  - Same as Nurse for visit handling.
- [TF-NUT-02] Administer/add nutrition-related records
  - Add Vitamina entries and relevant supplements; verify they appear in patient history and activity logs.

---

## Guardian flows
Guardians can access only their linked family data.

- [TF-GUA-01] Family Health Summary
  - Open Family Summary; verify aggregate status across all children (due, overdue, completed counts).
- [TF-GUA-02] Children’s data visibility
  - Open each child’s profile; verify details, vaccine history, schedules, and medical history tabs.
  - Security: attempt to access another family’s child via direct URL or ID; access must be denied.
- [TF-GUA-03] Edit profile and change password
  - Update profile fields; change password with correct current password; login with new password; old password must fail.
- [TF-GUA-04] Notifications
  - Open notification list; ensure items created by Admin are visible; marking as read updates counters.
- [TF-GUA-05] Chat with staff/admin
  - Start a conversation with a chosen staff or Admin; send/receive messages.
- [TF-GUA-06] View FAQs
  - Open FAQs; search/filter; confirm that FAQs created by Admin are visible and accurate.

---

## Soft-delete and audit behavior (cross-cutting)
- [TF-AUD-01] Soft-delete hides from primary lists but preserves data in archived views; child records (visits, immunizations) follow defined cascade rules.
- [TF-AUD-02] Activity logs capture create/update/delete/approval with actor, timestamp, and before/after snapshots where applicable.
- [TF-AUD-03] Restoring a soft-deleted record (if supported) fully restores relationships and visibility.

## Negative and edge cases
- Invalid inputs: required fields empty, invalid dates (future DOB), duplicate identifiers; appropriate error messages. -- NOT FULLY FOLLOWED --
- Concurrency: two users editing the same record; last-write wins or optimistic locking behavior is correct. -- NOT YET IMPLEMENTED --
- Permissions: prohibited actions return 403 with clear UI messaging (e.g., BHS attempting stock adjustment).
- Reporting: months with no data produce empty but valid reports (no crashes).
- Dashboard: counts update after edits/approvals and soft-deletes.
- SMS: manual send with invalid number fails gracefully and logs error status.

## Sign-off checklist
- All [TF-*] items executed with Pass status or documented defects/waivers.
- RBAC confirmed for Admin, BHS, Nurse, Nutritionist, Guardian.
- Data integrity verified across Dashboard, Reports, and Inventory.
- Logs (Activity/System/SMS) reflect all actions.
- Exported artifacts (reports) open without errors.

## References (backend modules)
- Controllers: `backend/controllers/*Controller.js`
- Routes: `backend/routes/*Routes.js` (patients, visits, immunizations, vaccines, receiving reports, reports, notifications, conversations, FAQs, activity, sms, qr)
- Models: `backend/models/*.js` (patientModel, vaccineModel, immunizationModel, receivingReportModel, smsModel, activityLogger, etc.)
