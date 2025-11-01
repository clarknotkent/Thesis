# 11-01-2025 UI Buttons and Modals Inventory (code-sourced)

Branch: system-prototype-v2
Scope: frontend/src (Vue 3 + Bootstrap). Extracted by scanning for <button>, @click, and modal usage. Focuses on key screens; additional occurrences exist beyond this list.

Legend:
- file — component/view path
- buttons — visible labels/classes and click handlers
- modals — modal components or modal-like overlays and their actions

---

## Global / Shared
- components/ApprovalModal.vue
  - Buttons: Confirm (emits approved), Cancel (emits cancel)
  - Props/Behavior: verifies approver via POST /api/auth/login; prevents same-user and BHS approvers.

## Health Staff — Patients
- views/healthworker/AddPatient.vue
  - Buttons: Back (goBack), Save (submit handler in form), dropdown actions for parent suggestions.
  - Modals: none (inline confirms via window.confirm for back navigation)

- views/healthworker/PatientRecords.vue
  - Buttons: Card click (viewPatientDetail), Add Patient (goToAddPatient)

- views/healthworker/PatientDetails.vue
  - Buttons: Back (goBack), Add Immunization (goToAddImmunization)
  - Tabs: tab buttons set activeTab
  - Modals: Edit Schedule (Save, Cancel); Calendar modal (Close)

- views/healthworker/AddPatientImmunizationRecord.vue
  - Buttons: Back (goBack), Toggle Service Form (toggleServiceForm)
  - Service form: Cancel (cancelServiceForm), Add (addServiceToRecord)
  - Service list: Edit (editService), Delete (removeService)
  - Footer: Cancel (goBack), Save (submit, :disabled="submitting")

- views/healthworker/EditVaccinationRecord.vue
  - Buttons: Back (handleBack), Retry (fetchVaccinationRecord)
  - Timeline: Jump to dose (jumpToDose)
  - Footer: Back (handleBack), Save (submit handler; disabled states)
  - Modals: ApprovalModal (onApproverApproved/onApproverCancel)

- views/healthworker/VaccineRecordDetails.vue
  - Buttons: Back (goBack), Retry (fetchVaccineDetails)

- views/healthworker/VisitSummary.vue
  - Buttons: Back (goBack), Retry (fetchVisitData)

- views/healthworker/QRScanner.vue
  - Buttons: Toggle Torch (toggleTorch, :disabled="!canTorch"), Start/Stop (start/stop), Go (handleResult)

- views/healthworker/Notifications.vue
  - Header Buttons: Mark All Read (markAllAsRead), Clear Read (clearAllRead), Refresh (loadNotifications)
  - Filters: All / Unread / Read (sets filter)
  - Per-item: Mark as Read (markAsRead), Delete (deleteNotification)

- views/healthworker/Messages.vue
  - Buttons: Back (goBack), New (showNewMessageModal=true)
  - Conversation list: openConversation(conv)
  - Chat: Back (selectedConversation=null), Send (handleSendMessage)
  - Modal: New Conversation modal with Cancel (closeModal) and Create (createConversation)

## Parent — Home and Records
- views/parent/ParentDashboard.vue
  - Child card: selectChild(child)
  - Quick actions: View Profile, View Schedule, Download Records, Schedule Appointment
  - Resources: openResource('vaccination-guide' | 'growth-milestones' | 'emergency-care')
  - Message area: sendMessage

- views/parent/ChildInfo.vue
  - Buttons: View Vaccination Schedule, Download Records, Schedule Appointment, Contact Doctor
  - Charts: viewGrowthChart

- views/parent/VaccinationSchedule.vue
  - Actions: downloadSchedule, scheduleAppointment, contactDoctor, viewReminders
  - Item actions: scheduleAppointment(vaccine), scheduleUrgent(vaccine), reschedule, cancelAppointment
  - Info: learnMore('importance'|'faq')

- views/parent/ParentVaccineRecordDetails.vue
  - Buttons: Back (goBack), Retry (fetchVaccineDetails)

- views/parent/ParentVisitSummary.vue
  - Buttons: Back (goBack), Retry (fetchVisitData)

- views/parent/ParentNotifications.vue
  - Item click: handleClick(notification)

- views/parent/ParentMessages.vue
  - Buttons: New Chat (openNewChat), toggleFaq, selectFaq(faq)
  - Tabs in modal: team/staff (switch newChatMode)
  - Modal: New Chat — Cancel (closeNewChat), Create (createConversation)

- views/parent/ParentProfile.vue
  - Buttons: Edit (openEdit), Change Password (openChangePwd), Logout (logout)
  - Modals: Edit Profile — Close (closeEdit), Cancel (closeEdit), Save (saveEdit, :disabled="saving")
  - Change Password — Close (closeChangePwd), Cancel (closeChangePwd), Save (saveChangePwd, :disabled="changingPwd")

- views/parent/ParentSchedule.vue
  - Header: Notifications (goToNotifications), Messages (goToMessages)
  - Body: Retry (fetchChildren)

## Admin — SMS (selected)
- features/admin/sms/components/MessageTemplates.vue
  - Buttons: Refresh, Create Template, View, Edit, Duplicate, Delete, Toggle Active, Save Template
  - Modal: Template Editor (fields + Save)

- features/admin/sms/components/MessageLogs.vue
  - Buttons: Refresh, Manual (open manual SMS modal)
  - Modal: Manual SMS (Use Template toggle, Preview, Send Now)

## Admin — Activity and Reports (selected)
- views/admin/activity/ActivityLogs.vue
  - Actions: view details, export (per backend capabilities)
- views/admin/reports/Reports.vue
  - Actions: filter/switch report; specifics depend on backend availability

---

Notes:
- This inventory is derived from static template scans and may miss programmatic button creation.
- Where Bootstrap modal markup is used without a dedicated component, actions are listed under Buttons and Modal sections of the view.
- For exact labels and disabled states, refer to each listed file; many buttons bind :disabled to form/saving flags.
