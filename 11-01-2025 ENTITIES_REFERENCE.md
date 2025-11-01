# 11-01-2025 Entities and Relationships Reference

Branch: system-prototype-v2
This is a pragmatic reference of main domain entities based on backend models, controllers, and schema usage.

---

## Users and Roles
- users
  - key fields: user_id (uuid), email, username, role (admin | health_staff | parent | guardian), hs_type (e.g., bhs), is_active
  - relations: may map to guardians (guardian_id) for parent users
  - notes: password resets, deactivate/restore actions; profile endpoints provide additional demographic fields

## Guardians
- guardians
  - key fields: guardian_id, firstname, surname, contact_number, address, barangay
  - relations: 1:N guardians → patients (guardian_id)

## Patients
- patients
  - key fields: patient_id, firstname, surname, sex, date_of_birth, address, barangay, health_center, guardian_id, relationship_to_guardian, tag
  - relations: N:1 to guardians; 1:N to immunizations; 1:N to schedules; 1:N to visits; 1:1 birth_history; 1:N vitals via visits
  - birth_history: time_of_birth, attendant_at_birth, type_of_delivery (required on create)

## Visits and Vitals
- visits
  - key fields: visit_id, patient_id, visit_date, created_by/updated_by
  - relations: N:1 to patients; 1:1 to vitals for in-facility services
- vitals
  - key fields: vital_id, visit_id, weight, height, temperature, etc.
  - relations: 1:1 with visits

## Vaccines, Inventory, and Receiving Reports
- vaccine_types
  - key fields: vaccine_id, name, category (VACCINE/ANTIGEN/etc.), manufacturer
- vaccine_schedules
  - key fields: schedule_id, vaccine_id, dose_number, min_age_days, interval_days
- inventory (vaccine_stock)
  - key fields: inventory_id, vaccine_id, lot_number, expiration_date, quantity_on_hand, storage_location
  - relations: N:1 vaccine_types
- receiving_reports
  - key fields: report_id, delivery_date, delivered_by, supplier_notes, status (DRAFT|COMPLETED|CANCELLED)
  - items: report_item_id, antigen_name/brand/manufacturer, lot_number, expiration_date, quantity_received
  - relations: 1:N report → items; items may reference vaccine_id (optional) and can generate inventory
- inventory transactions/adjustments
  - key fields: transaction_id, inventory_id, type (IN|OUT|ADJUST), quantity, reason

## Immunizations (Vaccination Records)
- immunizations
  - key fields: immunization_id, patient_id, vaccine_id/inventory_id, dose_number, administered_date, administered_by, remarks, outside_immunization (flag)
  - relations: N:1 patient; N:1 vaccine or inventory item; may relate to a visit and vital_id for in-facility records
- patient_schedules
  - key fields: patient_schedule_id, patient_id, vaccine_id, dose_number, scheduled_date, status (pending|done|cancelled|rescheduled), requested_date
  - relations: N:1 patient, vaccine; immunization updates cascade schedule status

## SMS and Notifications
- sms_templates
  - key fields: id, name, template, trigger_type ('1-week'|'3-days'|'1-day'|'0-day'|'manual'), time_range ('day'|'evening'), active
- sms_logs
  - key fields: id, guardian_id/patient_id/phone, message, type (manual|scheduled), status (pending|scheduled|sent|failed), scheduled_at, sent_at, error_message
  - relations: optional to guardians/patients; scheduler updates status and error fields
- notifications
  - key fields: id, user_id, title, body, status (unread|read), created_at, target_url
  - relations: N:1 to users

## Conversations and Messages
- conversations
  - key fields: conversation_id, title, created_by, participants (link table)
- messages
  - key fields: message_id, conversation_id, sender_id, message_content, attachment_url, created_at, read flags
  - relations: N:1 to conversations; N:1 to users (sender)

## Activity Logs
- activity_logs
  - key fields: id, actor_id (user or 'system'), action_type, entity_type, entity_id, metadata (before/after), created_at

## FAQs
- faqs
  - key fields: faq_id, question, answer, active

---

## Relationship overview
- guardian 1—N patients
- patient 1—N immunizations
- patient 1—N schedules
- patient 1—N visits; visit 1—1 vitals
- vaccine 1—N schedules; vaccine 1—N inventory items
- receiving_report 1—N items → generates/links to inventory
- user 1—N notifications; user N—M conversations (via participants); conversation 1—N messages
- patient/guardian → N sms_logs (optional link)

## Field constraints and rules (highlights)
- Patient creation requires guardian link and relationship; birth history fields are mandatory.
- Immunization requires either inventory_id (in-facility) or administered_by/remarks when outside; dose_number and administered_date required for outside.
- Inventory expiration_date cannot be past for new entries; adjustments require allowed types and positive quantities.
- Schedules require patient_schedule_id and new date for reschedules; status is updated accordingly by controllers.
- SMS templates must use allowed trigger_type values; logs transition through pending→sent or retain pending with error for retry.

Notes:
- Exact column names may vary slightly from model naming; consult `database/schema/*.sql` for authoritative definitions.
- This doc prioritizes developer ergonomics; use it with `11-01-2025 API_CATALOG.md` and `11-01-2025 VALIDATIONS.md` for end-to-end behavior.
