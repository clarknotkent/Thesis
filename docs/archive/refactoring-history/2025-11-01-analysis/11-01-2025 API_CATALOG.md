# 11-01-2025 Backend API Catalog (code-sourced)

Branch: system-prototype-v2
Server mountpoints from `backend/server.js`. Middleware seen on routes:
- authenticateRequest (auth required)
- optionalAuthenticate (optional auth)
- validateToken (session check)
- checkUserMapping (role/user mapping consistency)
- authorizeRole([...]) (role-based guard)

Note: This catalog is generated from router definitions in `backend/routes/*.js`. It lists method, path (relative to mount), and observed guards.

---

## /api/auth (authRoutes)
- POST /register — optionalAuthenticate
- POST /login
- POST /logout — validateToken
- POST /link-supabase
- GET /user-mapping
- POST /refresh-token
- POST /change-password — authenticateRequest
- GET /debug/uuid — authenticateRequest

## /api/patients (patientRoutes)
- GET /helpers/age — authenticateRequest
- GET / — authenticateRequest
- GET /parents/options — authenticateRequest
- GET /parents/recorded — authenticateRequest
- GET /parents/suggestions — authenticateRequest
- GET /parents/distinct — authenticateRequest
- GET /parents/coparent — authenticateRequest
- POST / — authenticateRequest, checkUserMapping, authorizeRole([admin, health_worker, health_staff])
- GET /:id — authenticateRequest
- PUT /:id — authenticateRequest, checkUserMapping, authorizeRole([admin, health_worker, health_staff])
- DELETE /:id — authenticateRequest, checkUserMapping, authorizeRole([admin])
- GET /:id/schedule — authenticateRequest, checkUserMapping
- PUT /:id/tag — authenticateRequest, checkUserMapping, authorizeRole([admin, health_worker, health_staff])
- GET /:id/birth-history — authenticateRequest, checkUserMapping
- PUT /:id/birth-history — authenticateRequest, checkUserMapping, authorizeRole([admin, health_worker, health_staff])
- GET /:id/vitals — authenticateRequest, checkUserMapping
- PUT /:id/vitals — authenticateRequest, checkUserMapping, authorizeRole([admin, health_worker, health_staff])
- POST /onboard — authenticateRequest, checkUserMapping, authorizeRole([admin, health_worker, health_staff])
- POST /:id/update-schedules — authenticateRequest, checkUserMapping, authorizeRole([admin])
- GET /:id/smart-doses — authenticateRequest, checkUserMapping

## /api/vaccines (vaccineRoutes)
 POST / — authenticateRequest, checkUserMapping, authorizeRole([admin, health_staff])
 PUT /:id — authenticateRequest, checkUserMapping, authorizeRole([admin, health_staff])
 PUT /:id/tag — authenticateRequest, checkUserMapping, authorizeRole([admin, health_staff])
 PUT /:id/birth-history — authenticateRequest, checkUserMapping, authorizeRole([admin, health_staff])
 PUT /:id/vitals — authenticateRequest, checkUserMapping, authorizeRole([admin, health_staff])
 POST /onboard — authenticateRequest, checkUserMapping, authorizeRole([admin, health_staff])
- POST / — authenticateRequest, checkUserMapping, authorizeRole([admin])
 POST /requests — authenticateRequest, checkUserMapping, authorizeRole([admin, health_staff])
- GET /inventory — authenticateRequest, checkUserMapping
 POST / — authenticateRequest, checkUserMapping, authorizeRole([admin, health_staff])
 PUT /:id — authenticateRequest, checkUserMapping, authorizeRole([admin, health_staff])
 POST /schedule — authenticateRequest, checkUserMapping, authorizeRole([admin, health_staff])
 POST /enforce-interval — authenticateRequest, checkUserMapping, authorizeRole([admin, health_staff])
 PUT /schedule/:id — authenticateRequest, checkUserMapping, authorizeRole([admin, health_staff])
 POST /manual-reschedule — authenticateRequest, checkUserMapping, authorizeRole([admin, health_staff])
 GET /debug-reschedule — authenticateRequest, checkUserMapping, authorizeRole([admin, health_staff])
 POST /debug-reschedule-db — authenticateRequest, checkUserMapping, authorizeRole([admin, health_staff])
 POST /debug-reschedule-checkpoints — authenticateRequest, checkUserMapping, authorizeRole([admin, health_staff])
- PUT /requests/:id/approve — authenticateRequest, checkUserMapping, authorizeRole([admin])
 POST / — authenticateRequest, checkUserMapping, authorizeRole([admin, health_staff])
 POST /reminders — authenticateRequest, checkUserMapping, authorizeRole([admin, health_staff])
 GET /history — authenticateRequest, checkUserMapping, authorizeRole([admin, health_staff])
 GET /status/:messageId — authenticateRequest, checkUserMapping, authorizeRole([admin, health_staff])
 GET /templates — authenticateRequest, checkUserMapping, authorizeRole([admin, health_staff])
 POST /templates/preview — authenticateRequest, checkUserMapping, authorizeRole([admin, health_staff])
 POST / — authenticateRequest, checkUserMapping, authorizeRole([admin, health_staff, nurse, nutritionist])
 PUT /:id — authenticateRequest, checkUserMapping, authorizeRole([admin, health_staff, nurse, nutritionist])
 POST / — authenticateRequest, checkUserMapping, authorizeRole([admin, health_staff, nurse, nutritionist])
 PUT /:id — authenticateRequest, checkUserMapping, authorizeRole([admin, health_staff, nurse, nutritionist])
- PUT /:id — authenticateRequest, checkUserMapping, authorizeRole([admin, health_worker, health_staff])
- DELETE /:id — authenticateRequest, checkUserMapping, authorizeRole([admin])
- POST /schedule — authenticateRequest, checkUserMapping, authorizeRole([admin, health_worker, health_staff])
- POST /enforce-interval — authenticateRequest, checkUserMapping, authorizeRole([admin, health_worker, health_staff])
- PUT /schedule/:id — authenticateRequest, checkUserMapping, authorizeRole([admin, health_worker, health_staff])
- POST /manual-reschedule — authenticateRequest, checkUserMapping, authorizeRole([admin, health_worker, health_staff])
- GET /debug-reschedule — authenticateRequest, checkUserMapping, authorizeRole([admin, health_worker, health_staff])
- POST /debug-reschedule-db — authenticateRequest, checkUserMapping, authorizeRole([admin, health_worker, health_staff])
- POST /debug-reschedule-checkpoints — authenticateRequest, checkUserMapping, authorizeRole([admin, health_worker, health_staff])

## /api/receiving-reports
- GET / — authenticateRequest, checkUserMapping
- POST / — authenticateRequest, checkUserMapping
- GET /:id — authenticateRequest, checkUserMapping
- PUT /:id — authenticateRequest, checkUserMapping
- POST /:id/items — authenticateRequest, checkUserMapping
- PUT /:id/items/:itemId — authenticateRequest, checkUserMapping
- POST /:id/complete — authenticateRequest, checkUserMapping
- POST /:id/cancel — authenticateRequest, checkUserMapping

## /api/reports
- GET /monthly — authenticateRequest, checkUserMapping
- GET /annual — authenticateRequest, checkUserMapping
- GET /defaulters — authenticateRequest, checkUserMapping
- GET /due-soon — authenticateRequest, checkUserMapping
- GET /low-stock — authenticateRequest, checkUserMapping
- GET /tcl — authenticateRequest, checkUserMapping
- GET /monthly-immunization — authenticateRequest, checkUserMapping

## /api/dashboard
- GET /metrics — authenticateRequest, checkUserMapping
- GET /worker-progress — authenticateRequest, checkUserMapping
- GET /vaccine-report — authenticateRequest, checkUserMapping
- GET /overview — authenticateRequest, checkUserMapping

## /api/guardians
- GET / — (no guard in router)
- GET /:id — (no guard in router)
- POST / — (no guard in router)
- PUT /:id — (no guard in router)
- DELETE /:id — (no guard in router)
- POST /:id/cancel-pending-sms — authenticateRequest, authorizeRole([admin])

## /api/parent
- GET /profile
- PUT /profile
- POST /change-password
- GET /children
- GET /children/:childId
- GET /children/:childId/schedule
- GET /children/:childId/immunizations/:immunizationId

## /api/users
- GET / — authenticateRequest, checkUserMapping
- GET /:id — authenticateRequest, checkUserMapping
- GET /:id/profile — authenticateRequest, checkUserMapping
- GET /:id/activity — authenticateRequest, checkUserMapping
- POST / — authenticateRequest, checkUserMapping, authorizeRole([admin])
- PUT /:id — authenticateRequest, checkUserMapping, authorizeRole([admin])
- PUT /:id/role — authenticateRequest, checkUserMapping, authorizeRole([admin])
- PUT /:id/deactivate — authenticateRequest, checkUserMapping, authorizeRole([admin])
- DELETE /:id — authenticateRequest, checkUserMapping, authorizeRole([admin])
- POST /:id/restore — authenticateRequest, checkUserMapping, authorizeRole([admin])
- POST /:id/reset-password — authenticateRequest, checkUserMapping

## /api/health-staff
- GET / — authenticateRequest, checkUserMapping
- GET /:id — authenticateRequest, checkUserMapping
- POST / — authenticateRequest, checkUserMapping, authorizeRole([admin])
- PUT /:id — authenticateRequest, checkUserMapping, authorizeRole([admin])
- DELETE /:id — authenticateRequest, checkUserMapping, authorizeRole([admin])
- GET /:id/progress — authenticateRequest, checkUserMapping

## /api/activity-logs
- GET / — authenticateRequest, authorizeRole([admin, superadmin])
- GET /export — authenticateRequest, authorizeRole([admin, superadmin])
- DELETE /clear-old/:days — authenticateRequest, authorizeRole([admin, superadmin])
- GET /:id — authenticateRequest, authorizeRole([admin, superadmin])

## /api/visits
- GET / — authenticateRequest
- GET /:id — authenticateRequest
- POST / — authenticateRequest, checkUserMapping
- PUT /:id — authenticateRequest, checkUserMapping
- POST /ensure — authenticateRequest, checkUserMapping

## /api/conversations
- GET / — authenticateRequest, checkUserMapping
- POST / — authenticateRequest, checkUserMapping
- POST /start — authenticateRequest, checkUserMapping
- POST /:conversation_id/leave — authenticateRequest, checkUserMapping

## /api/messages
- GET /:conversation_id — authenticateRequest, checkUserMapping
- POST /:message_id/read — authenticateRequest, checkUserMapping
- POST / — authenticateRequest, checkUserMapping

## /api/sms
- POST / — authenticateRequest, checkUserMapping, authorizeRole([admin, health_worker])
- POST /reminders — authenticateRequest, checkUserMapping, authorizeRole([admin, health_worker])
- GET /history — authenticateRequest, checkUserMapping, authorizeRole([admin, health_worker])
- PUT /settings — authenticateRequest, checkUserMapping, authorizeRole([admin])
- GET /status/:messageId — authenticateRequest, checkUserMapping, authorizeRole([admin, health_worker])
- POST /bulk — authenticateRequest, checkUserMapping, authorizeRole([admin])
- GET /templates — authenticateRequest, checkUserMapping, authorizeRole([admin, health_worker])
- POST /templates — authenticateRequest, checkUserMapping, authorizeRole([admin])
- PUT /templates/:id — authenticateRequest, checkUserMapping, authorizeRole([admin])
- DELETE /templates/:id — authenticateRequest, checkUserMapping, authorizeRole([admin])
- GET /guardians — authenticateRequest, checkUserMapping, authorizeRole([admin])
- PUT /guardians/:guardianId — authenticateRequest, checkUserMapping, authorizeRole([admin])
- POST /guardians/bulk-toggle — authenticateRequest, checkUserMapping, authorizeRole([admin])
- GET /statistics — authenticateRequest, checkUserMapping, authorizeRole([admin])
- POST /templates/preview — authenticateRequest, checkUserMapping, authorizeRole([admin, health_worker])
- POST /cron/run-now — authenticateRequest, checkUserMapping, authorizeRole([admin])

## /api/notifications
- POST / — authenticateRequest
- GET / — authenticateRequest
- PUT /:id/read — authenticateRequest
- DELETE /:id — authenticateRequest
- GET /pending — authenticateRequest
- PUT /:id/status — authenticateRequest

## /api/faqs
- GET / — public
- POST / — authenticateRequest, authorizeRole([admin, superadmin])
- PUT /:faq_id — authenticateRequest, authorizeRole([admin, superadmin])
- DELETE /:faq_id — authenticateRequest, authorizeRole([admin, superadmin])

## /api/vitals
- GET /:visitId — authenticateRequest, checkUserMapping
- PUT /:visitId — authenticateRequest, checkUserMapping

## /api/deworming
- GET / — authenticateRequest, checkUserMapping
- GET /:id — authenticateRequest, checkUserMapping
- POST / — authenticateRequest, checkUserMapping, authorizeRole([admin, health_worker, nurse, nutritionist])
- PUT /:id — authenticateRequest, checkUserMapping, authorizeRole([admin, health_worker, nurse, nutritionist])
- DELETE /:id — authenticateRequest, checkUserMapping, authorizeRole([admin])

## /api/vitamina
- GET / — authenticateRequest, checkUserMapping
- GET /:id — authenticateRequest, checkUserMapping
- POST / — authenticateRequest, checkUserMapping, authorizeRole([admin, health_worker, nurse, nutritionist])
- PUT /:id — authenticateRequest, checkUserMapping, authorizeRole([admin, health_worker, nurse, nutritionist])
- DELETE /:id — authenticateRequest, checkUserMapping, authorizeRole([admin])

## /qr (public + protected)
- POST /patients/:id — authenticateRequest, checkUserMapping, authorizeRole([...])
- POST /patients/:id/rotate — authenticateRequest, checkUserMapping, authorizeRole([admin])
- GET /p/:id — public resolve

---

Health check:
- GET /api/health — no auth (server status)

Notes:
- Guardians routes appear open in router; ensure upstream middleware or network ACL protects if intended.
- Where both /api/immunizations and /api/vaccination-records are used, they share the same router.
