# Uncommitted changes since last commit

Generated: 2025-10-21 (local)

- Branch: `system-prototype-v1`
- HEAD: `69eea7a` — Chat/Conversations fixes and UI polish (2025-10-21 00:36:41 +0800)

## Summary

- 10 files changed, 346 insertions(+), 158 deletions(-)

## Diffstat vs HEAD

```
 backend/controllers/visitController.js             |  22 ++
 backend/models/immunizationModel.js                |  23 +-
 backend/models/visitModel.js                       |  32 ++-
 frontend/src/components/common/VisitEditor.vue     |  90 +++++---
 frontend/src/router/index.js                       |   6 +-
 frontend/src/views/admin/chat/AdminChat.vue        |  58 ++++-
 .../src/views/admin/inventory/VaccineInventory.vue |   3 +
 .../admin/inventory/components/VaccineForm.vue     |   8 +-
 .../admin/notifications/NotificationsInbox.vue     | 244 +++++++++++++------
 note.txt                                           |  18 +-
```

## Changed files

- Modified: `backend/controllers/visitController.js`
- Modified: `backend/models/immunizationModel.js`
- Modified: `backend/models/visitModel.js`
- Modified: `frontend/src/components/common/VisitEditor.vue`
- Modified: `frontend/src/router/index.js`
- Modified: `frontend/src/views/admin/chat/AdminChat.vue`
- Modified: `frontend/src/views/admin/inventory/VaccineInventory.vue`
- Modified: `frontend/src/views/admin/inventory/components/VaccineForm.vue`
- Modified: `frontend/src/views/admin/notifications/NotificationsInbox.vue`
- Modified: `note.txt`

## Untracked (new) items

- `barangay-images/`
- `frontend/src/views/admin/inventory/EditVaccineType.vue`
- `schema-overview/`

## Quick highlights

- Visit and Immunization backend updates (controllers/models)
- Visit Editor UI refactors
- Router tweaks
- Admin Chat UI improvements
- Notifications Inbox major update
- Inventory views/forms adjustments
- Added new EditVaccineType view and asset/docs folders

## Suggested commit message

Visit/Immunization + UI updates; Notifications Inbox overhaul; add EditVaccineType view, assets

Details: update visit/immunization models/controllers; refactor VisitEditor; tweak router; enhance AdminChat; major NotificationsInbox improvements; adjust inventory views/forms; add barangay-images and schema-overview; add EditVaccineType view.
