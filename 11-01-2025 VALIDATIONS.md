# 11-01-2025 Validation Rules (frontend + backend)

Branch: system-prototype-v2
This captures required fields, format checks, and business rules observed in controllers and views.

---

## Authentication
- Login (backend): identifier + password required; identifier accepts email/username/phone. Error 400 when missing.
- Change password (backend): currentPassword and newPassword required for both auth and parent controllers.
- Registration (backend): email, password, role required; contact_number required and normalized; phone normalization enforced by sms/auth utils.

## Patients
- Create Patient (backend): required — firstname, surname, date_of_birth, guardian_id, relationship_to_guardian.
- Birth History (backend + FE): required — time_of_birth, attendant_at_birth, type_of_delivery.
- Update Tag: tag required.
- Vitals read/update: visit must exist; ensures vitals found for visit for certain operations.
- FE AddPatient.vue: multiple inputs marked required; save blocked with alerts when required missing.

## Immunizations (Vaccination Records)
- Outside immunization (backend): patient_id, dose_number, administered_date required; if administered_by missing, remarks required.
- In-facility immunization (backend): visit_id or patient_id required; inventory_id required; vital_id must resolve for visit.
- Schedule updates (backend): patient_schedule_id and date fields required on schedule update, manual reschedule, and enforce interval endpoints.
- FE EditVaccinationRecord.vue/Admin equivalents: vaccine, dose number, and date fields required; save disabled when invalid; approval modal may be required for sensitive changes.

## Deworming / Vitamina
- Outside: patient_id required; for outside record, dose/date-like critical fields enforced similarly to immunization (see controllers for specifics).
- In-facility: visit_id or patient_id required; inventory_id required; vital_id must exist for visit.

## Guardians
- Create/Update (backend): firstname and surname required.

## Users
- Create: email, password, role required; role updates and deactivation require admin role.

## SMS
- Manual send: phone number and message/template required.
- Bulk: recipients array non-empty; message required.
- Templates: name, template, trigger_type required; trigger_type must be allowed (set includes '1-week','3-days','1-day','0-day','manual').
- Template preview: templateId required.

## Reports
- Monthly: month and year required.
- Annual: year required.
- Monthly immunization: month and year required.

## Inventory / Vaccines
- Inventory adjustments: type allowed only in whitelist; quantity must be positive; expiration dates cannot be in the past where enforced.
- Receiving reports FE: required fields such as delivered_by; item rows have quantity min=1; disable controls when report completed.

## Conversations/Messages
- Send message: conversation_id and message_content or attachment_url required.
- Mark read: message_id required.
- Conversations: creating requires content or attachment accordingly; leave requires conversation_id and auth.

## Notifications
- All list/manipulation endpoints require auth; some FE actions disabled based on state (e.g., mark all read only when unread visible).

---

## Frontend common patterns
- Buttons are often disabled during async actions: saving, creating, loading.
- Required inputs: marked via `required` attribute across forms (AddPatient, EditVaccinationRecord, Admin Users, SMS forms, Inventory forms, etc.).
- Validation feedback: Alerts or toasts with explicit guidance on missing fields (e.g., AddPatient shows specific missing fields).

## Phone number normalization
- Backend ensures PH numbers normalized (+63) and validated before send; template replacement sanitizes messages and ensures telco-friendly characters.

## Date guards
- Some controllers ensure dates are not in the past/future depending on context (e.g., inventory expiration cannot be past; vaccination date logic enforced in UI and through scheduling logic).

Notes:
- This summary reflects observed checks in controllers and views via code scan; for full details, refer to per-endpoint logic in controllers listed in `11-01-2025 API_CATALOG.md` and UI screens in `11-01-2025 UI_BUTTONS_AND_MODALS.md`.
