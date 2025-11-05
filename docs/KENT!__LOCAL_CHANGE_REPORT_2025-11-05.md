# Local Change Report (since last pull)

Generated: 2025-11-05
Current branch: system-prototype-v4
Upstream tracking: (not configured) — using last pull (current HEAD in reflog) as the base

## Base commit (last pull)
- Full SHA: 9b532158961bcb352d8b69b79ef05acb1efd159a
- Short SHA: 9b53215
- Date: Tue Nov 4 17:54:38 2025 +0800
- Author: clarknotkent
- Subject: feat(parent-portal): Complete offline system with bulk prefetch and toast notifications 

## Commits since last pull
- None (no new local commits after the last pull).

## Working tree changes vs HEAD (staged + unstaged)

### Name-status
```
M	backend/controllers/parentController.js
M	backend/controllers/patientController.js
M	frontend/src/App.vue
M	frontend/src/components/FAQList.vue
M	frontend/src/components/layout/desktop/Navbar.vue
M	frontend/src/composables/useAuth.js
M	frontend/src/features/parent/records/VaccineRecordDetails.vue
M	frontend/src/features/parent/records/VisitSummary.vue
M	frontend/src/features/parent/schedule/ScheduleDetails.vue
M	frontend/src/features/shared/chat/useChatService.js
M	frontend/src/main.js
M	frontend/src/router/index.js
M	frontend/src/services/auth.js
M	frontend/src/services/faqService.js
M	frontend/src/services/offline/apiCacheInterceptor.js
M	frontend/src/services/offline/db-parent-portal.js
M	frontend/src/services/offline/parentLoginPrefetch.js
M	frontend/src/views/healthworker/menu/Menu.vue
M	frontend/src/views/parent/ParentHome.vue
M	frontend/src/views/parent/ParentMessages.vue
M	frontend/src/views/parent/ParentNotifications.vue
M	frontend/src/views/parent/ParentProfile.vue
```

### Diffstat summary
```
 backend/controllers/parentController.js            |   5 -
 backend/controllers/patientController.js           |   1 -
 frontend/src/App.vue                               |   2 +
 frontend/src/components/FAQList.vue                |   6 +-
 frontend/src/components/layout/desktop/Navbar.vue  |  11 +-
 frontend/src/composables/useAuth.js                |  10 +
 .../parent/records/VaccineRecordDetails.vue        |   6 +-
 .../src/features/parent/records/VisitSummary.vue   |  17 +-
 .../features/parent/schedule/ScheduleDetails.vue   |  47 +-
 .../src/features/shared/chat/useChatService.js     |  31 +-
 frontend/src/main.js                               |   4 +
 frontend/src/router/index.js                       |  10 +
 frontend/src/services/auth.js                      |  29 +-
 frontend/src/services/faqService.js                |  35 +-
 .../src/services/offline/apiCacheInterceptor.js    | 674 ++++++++++++++-------
 frontend/src/services/offline/db-parent-portal.js  |  15 +-
 .../src/services/offline/parentLoginPrefetch.js    | 390 ++++++++++--
 frontend/src/views/healthworker/menu/Menu.vue      |   8 +-
 frontend/src/views/parent/ParentHome.vue           | 154 +++--
 frontend/src/views/parent/ParentMessages.vue       |  27 +-
 frontend/src/views/parent/ParentNotifications.vue  |  27 +-
 frontend/src/views/parent/ParentProfile.vue        |  10 +
 22 files changed, 1119 insertions(+), 400 deletions(-)
```

## Untracked files
```
docs/git-change-report-2025-11-05.md
frontend/src/components/system/OfflineBanner.vue
frontend/src/services/offline/chatOffline.js
frontend/src/views/parent/ParentFAQs.vue
```

## Notes
- Upstream tracking branch is not set for `system-prototype-v4`, so this report uses the last pull operation recorded in reflog as the baseline (current HEAD at the time of pull).
- To convert these working changes into a commit: stage desired files and commit with a clear message. To later compare with teammate changes, fetch and diff against the remote branch separately.
