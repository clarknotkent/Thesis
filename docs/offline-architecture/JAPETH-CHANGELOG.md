# JAPETH Change Log and Issue Log (system-prototype-v4)

Author: Japeth
Branch: system-prototype-v4
Date: 2025-11-04

This document summarizes the concrete changes implemented, attempts that were made and then adjusted/reverted, and the errors encountered (resolved vs. currently facing) while building the offline-first experience.

---

## Implemented Changes

These are merged changes currently in the branch and in use.

- Offline API caching and mappings
  - Updated `frontend/src/services/offlineAPI.js` to:
    - Map parent endpoints to local stores: `/parent/children` → patients, `/parent/children/:id` → patients, `/parent/children/:id/schedule` → schedules.
    - Add visits-by-patient cached reads for `/visits?patient_id=...` using the `visits` index.
    - Implement resilient ID handling (string/number fallback; last-chance scan) to avoid cache misses due to type mismatches.
    - Unwrap API responses and normalize records before IndexedDB writes to prevent keyPath errors.
- Role-aware sync orchestration
  - Updated `frontend/src/services/offlineSync.js` to:
    - Introduce `syncParentChildren()` that fetches only guardian-scoped data for parents and caches into `patients`.
    - Split `syncAll()` into baseOps, staffOps, and parentOps; keep admin-only datasets gated.
    - Treat HTTP 403s on gated datasets as informational skips (reduces log noise for parents).
- FAQ service offline support
  - Switched `frontend/src/services/faqService.js` to use the offline-aware transport for all CRUD so FAQs work offline and queue mutations.
- PWA registration and dev offline stability
  - Updated `frontend/src/main.js` to register the service worker and pre-warm the most-used parent views to reduce dev-time route load failures offline.
  - Enhanced `frontend/vite.config.js` (PWA/Workbox) to cache dynamic imports and Vite internals in dev, add a navigation fallback, and preserve API/image caching.
- IndexedDB write safety
  - Normalization and ID unwrapping applied before writes in the caching layer (affects `frontend/src/services/indexedDB.js` usage) to fix prior keyPath errors.

Reference commit: e210465 ("feat(offline): parent-only offline data, resilient patient lookups, and PWA caching for dev/prod...")

---

## Attempts Adjusted or Reverted

These are approaches that were tried and then changed or rolled back after validation/testing.

- Parent dataset scope
  - Initial approach fetched broader datasets for parent sessions; adjusted to guardian-only via `syncParentChildren()` to enforce least-privilege and reduce 403 noise.
- Endpoint-to-store mapping strictness
  - Early generic mapping occasionally misclassified collection vs. detail routes; replaced with explicit mappings and special-case handlers for parent endpoints and visits-by-patient queries.
- Dev offline route loading
  - Considered broad pre-caching of all routes/modules for offline development; retained a lighter strategy using targeted pre-warm of parent views plus Workbox runtimeCaching to avoid heavy caches and long first-loads.

Note: These adjustments were made through iterative commits; no persistent regressions remain from the earlier approaches.

---

## Errors Encountered and Resolutions

Resolved issues:

- Dexie SchemaError on `pending_uploads`
  - Symptom: Dexie `SchemaError` due to index/definition mismatch after schema changes.
  - Fix: Bumped Dexie version schema and added a migration path for `pending_uploads`; verified database opens cleanly.
- IndexedDB keyPath error: "keyPath did not yield a value"
  - Symptom: Writes failed because wrapped API payloads didnt contain the expected ID at the store keyPath.
  - Fix: Unwrapped API responses and normalized IDs before `put`/`bulkPut` operations across caches.
- Excessive 403 logs for parent role
  - Symptom: Parents hit staff/admin endpoints during sync and produced noisy 403s.
  - Fix: Role-based gating in sync; 403s treated as informational skips.
- Offline reads for parent routes returning empty
  - Symptom: Parent UIs (notifications, conversations, schedules) didnt find cached data.
  - Fix: Added explicit endpoint-to-store mappings and index-based reads; implemented guardian filter for `/parent/children`.
- Dev offline navigation failures (lazy routes)
  - Symptom: After going offline in dev, some routes failed due to missing dynamic imports.
  - Fix: Service worker registration plus Workbox runtimeCaching for `/src/**` and Vite internals; targeted pre-warm of parent views; added navigation fallback.

---

## Currently Facing / Open Items

- Optimize guardian filter
  - Improvement: Use the `patients.guardian_id` index directly instead of array filtering for `/parent/children` cached reads.
- QR detail offline fallback (edge case)
  - If a QR scan requests a patient that wasnt cached (e.g., only schedules exist offline), synthesize a minimal patient record from schedules as a fallback to avoid a blank detail view.
- Dev offline caveat
  - In dev mode, full offline behavior depends on first visiting routes while online (to warm caches). Production PWA install provides more robust offline guarantees.

---

## Verification Notes

- Parent flows use guardian-scoped datasets; `/visits?patient_id=` queries are served via an index.
- PWA caches dynamic imports and static assets; parent views pre-warmed during app bootstrap for smoother dev offline.
- IndexedDB writes verified post-normalization to avoid keyPath errors; reads handle string/number ID mismatches.

---

## Quick Timeline

- 2025-11-03: Implemented parent-only sync, endpoint mappings, resilient ID lookups, PWA caching/prewarm; committed and pushed (e210465).
- 2025-11-04: Prepared consolidated change and issue log (this file).

---

## Pointers to Code

- `frontend/src/services/offlineAPI.js`
- `frontend/src/services/offlineSync.js`
- `frontend/src/services/faqService.js`
- `frontend/src/main.js`
- `frontend/vite.config.js`
- `frontend/src/services/indexedDB.js`

If you want this log mirrored in the project README or release notes, let me know and Ill propagate a summarized version.
