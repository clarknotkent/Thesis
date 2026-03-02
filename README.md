# QR Document Demo — Patient Vaccination QR System

A full-stack reference implementation for QR-based patient vaccination document retrieval. Built with **Vue 3 + Vite** (frontend) and **Express.js** (backend). Designed as a thesis demonstration project.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Project Structure](#project-structure)
4. [Tech Stack](#tech-stack)
5. [Features](#features)
6. [Data Flow](#data-flow)
7. [API Reference](#api-reference)
8. [Environment Variables](#environment-variables)
9. [Running the App](#running-the-app)
10. [Security Notes](#security-notes)

---

## Overview

This system allows health staff to:
- Upload a patient's vaccination document (PDF or image).
- Receive a secure, tokenized URL encoded in a QR code.
- Scan the QR code at a later point to retrieve and view or download the document.

No database is required. Document metadata is stored as JSON sidecars alongside the physical files.

---

## Architecture

This project uses a **coupled monorepo architecture** — everything lives in a single root folder with one `package.json`. Express serves both the REST API and (in production) the compiled Vue SPA. During development, Vite runs its own dev server with HMR and proxies API calls to Express.

### Production (Coupled / Single Process)

```
┌──────────────────────────────────────────────────────────┐
│                Express.js  (port 5055)                    │
│                                                          │
│  Static files   →  dist/  (built Vue SPA)                │
│  /api/*         →  Document CRUD (upload, list, delete)  │
│  /d/:docId      →  Token-validated file streaming        │
└──────────────────────────────────────────────────────────┘
```

### Development (Two Processes, Same Codebase)

```
┌─────────────────────────┐          proxy /api, /d
│  Vite dev server :5173  │  ─────────────────────────►  ┌───────────────────────┐
│  (Vue SPA + HMR)        │                              │  Express.js  :5055    │
└─────────────────────────┘                              │  (API + file serving) │
                                                         └───────────────────────┘
```

The Vite proxy in `vite.config.js` forwards `/api/*` and `/d/*` to `http://localhost:5055`, so the browser always talks to a single origin (`localhost:5173`) during development — no CORS issues.

### Coupling Summary

| Aspect | Detail |
|---|---|
| Repository | Single root folder, one `package.json` |
| API base URL | Relative `/api` — works in both dev (proxied) and prod (same origin) |
| CORS | Only needed in dev (Express allows `ORIGIN` env var); not needed in production |
| Dev startup | `npm run dev` → starts Express + Vite concurrently |
| Prod startup | `npm run build` then `npm start` → single Express process on :5055 |
| Deployment | Single deployable unit |

---

## Project Structure

```
QRDemo2/
├── package.json          # Single unified package.json (frontend + backend + dev tools)
├── server.js             # Express REST API + static file serving
├── vite.config.js        # Vite config with dev proxy for /api and /d
├── index.html            # SPA entry point
├── .env.example          # Environment variable template
├── uploads/              # Active documents (UUID-named files + JSON metadata sidecars)
├── trash/                # Soft-deleted documents
└── src/
    ├── main.js            # Vue app entry point
    ├── App.vue            # Shell with nav (RouterLink)
    ├── router.js          # Vue Router — /generate, /scan
    ├── style.css          # Global styles
    ├── components/
    │   ├── QrGenerator.vue  # Upload form, QR display, recent docs, recycle bin
    │   └── QrScanner.vue    # Camera scanner + image decode
    └── services/
        └── api.js           # Axios instance (relative /api base URL)
```

---

## Tech Stack

### Frontend
| Package | Purpose |
|---|---|
| Vue 3 | UI framework (Composition API) |
| Vue Router 4 | SPA routing |
| Vite | Dev server + bundler |
| axios | HTTP client |
| qrcode-vue | QR code rendering |
| @zxing/browser | QR code decoding from camera / image |

### Backend
| Package | Purpose |
|---|---|
| Express 4 | HTTP server + routing |
| multer | Multipart file upload handling |
| mime-types | MIME type detection |
| crypto (built-in) | HMAC token signing (no DB needed) |
| dotenv | Environment variable loading |
| cors | Cross-origin request handling |
| nodemon | Dev auto-restart |

---

## Features

- **Document Upload** — Drag-and-drop or file-picker for PDF, PNG, JPG (max 10 MB).
- **Patient Metadata** — Patient name and ID attached to each document.
- **QR Code Generation** — Encodes a secure, tokenized URL served by the backend.
- **Download Control** — QR can target inline view or forced download (`?dl=1`).
- **Custom Filename** — Suggested filename (without extension) appended to URL for named downloads.
- **Document List** — Paginated list of recent uploads with copy/open/download/delete actions.
- **Soft Delete / Recycle Bin** — Deletes move files to `trash/`; can be restored or permanently removed.
- **Camera QR Scanner** — Live camera scan using `@zxing/browser`; supports torch toggle and device selection.
- **Image QR Decode** — Upload a QR image (PNG/JPG) for decode without camera.
- **Inline Preview** — Decoded PDF/image URLs shown in an iframe inside the Scanner view.

---

## Data Flow

```
[Staff / Browser]
      │
      │  1. POST /api/documents  (multipart: file + patientName + patientId)
      ▼
[Express Backend]
      │  • Saves file as  uploads/<uuid>.<ext>
      │  • Saves metadata as  uploads/<uuid>.json
      │  • Signs token:  HMAC-SHA256(docId, APP_SECRET)  → base64url
      │  • Returns:  { docId, token, url, originalName, mime }
      │
      │  url = http://<host>/d/<docId>?token=<token>
      ▼
[Frontend — QrGenerator]
      │  • Renders QR code of url
      │  • Optionally appends ?dl=1 and ?name=<custom>
      ▼
[QR Code printed / displayed]
      │
      │  2. Scan (camera or image)
      ▼
[Frontend — QrScanner]
      │  • Decodes QR → URL string
      │  • Opens URL in browser
      ▼
[Express Backend  GET /d/:docId?token=...]
      │  • Validates token
      │  • Sets Content-Disposition (inline or attachment)
      │  • Streams file to browser
      ▼
[Staff / Patient views or downloads document]
```

---

## API Reference

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Health check — returns `{ status: "ok" }` |
| `POST` | `/api/documents` | Upload document. Body: `multipart/form-data` with fields `file`, `patientName`, `patientId` |
| `GET` | `/api/documents` | List active documents. Query: `page`, `limit` (max 50) |
| `DELETE` | `/api/documents/:docId` | Soft-delete document (moves to trash) |
| `GET` | `/api/trash` | List trashed documents. Query: `page`, `limit` |
| `POST` | `/api/trash/:docId/restore` | Restore document from trash |
| `DELETE` | `/api/trash/:docId` | Permanently delete from trash |
| `GET` | `/d/:docId` | Serve document. Query: `token` (required), `dl` (`1` = download), `name` (filename override) |

### Upload Response Example
```json
{
  "docId": "a1b2c3d4-...",
  "token": "abc123...",
  "url": "http://localhost:5055/d/a1b2c3d4-...?token=abc123...",
  "originalName": "vaccination_card.pdf",
  "mime": "application/pdf"
}
```

### Document List Response Example
```json
{
  "items": [
    {
      "docId": "a1b2c3d4-...",
      "url": "http://localhost:5055/d/a1b2c3d4-...?token=...",
      "originalName": "vaccination_card.pdf",
      "mime": "application/pdf",
      "createdAt": "2026-03-01T10:00:00.000Z",
      "patientName": "Robert Theodore",
      "patientId": "PT-001",
      "size": 204800
    }
  ],
  "page": 1,
  "limit": 10,
  "total": 1,
  "totalPages": 1
}
```

---

## Environment Variables

Create a `.env` file inside the `backend/` directory:

```env
PORT=5055
ORIGIN=http://localhost:5173
APP_SECRET=replace_with_a_strong_random_secret
```

| Variable | Default | Description |
|---|---|---|
| `PORT` | `5055` | Port the Express server listens on |
| `ORIGIN` | `http://localhost:5173` | Allowed CORS origin (frontend URL) |
| `APP_SECRET` | `change_me_dev_secret` | HMAC signing secret for document tokens |

> **Important:** Change `APP_SECRET` before any non-local deployment. Existing tokens are invalidated when this value changes.

---

## Running the App

### Prerequisites
- Node.js ≥ 18
- npm ≥ 9

### Install Dependencies
```bash
npm install
```

---

### Development Mode (Vite HMR + Express)
```bash
npm run dev
```
This starts both servers concurrently via `concurrently`:
- **Vite** on `http://localhost:5173` — Vue SPA with hot module reload
- **Express** on `http://localhost:5055` — REST API and file serving

Vite proxies `/api` and `/d` to Express, so the browser only ever talks to `localhost:5173`.

---

### Production Mode (Single Process)
```bash
# Build the Vue SPA
npm run build

# Start Express (serves SPA + API on one port)
npm start
```
Open `http://localhost:5055`. Express detects `dist/` and serves the compiled Vue app alongside the API — no separate Vite process needed.

---

## Security Notes

| Concern | Current Approach |
|---|---|
| Token forgery | HMAC-SHA256 with `APP_SECRET`. Guessing `docId` alone is not enough. |
| File type validation | Backend allowlist: `application/pdf`, `image/png`, `image/jpeg` |
| File size | Hard limit of 10 MB via multer |
| Filename sanitization | Special characters stripped; max 120 chars; RFC 5987 encoding for headers |
| No authentication | This is a demo — there is no login or role system |
| No HTTPS | Run behind a reverse proxy (nginx, Caddy) with TLS for production |
| Secret rotation | Changing `APP_SECRET` invalidates all existing QR codes |

> This project is scoped as a **thesis demonstration**. It is not production-hardened. Do not use for real patient data without adding proper authentication, HTTPS, and encrypted storage.
- For production: add expiry (timestamp inside token payload), possibly JWT, TLS, audit logging, patient consent, rate limiting, and storage encryption.

## Backend Setup
```powershell
cd qr-mini-app/backend
npm install
npm run dev  # or: npm start
```

## Frontend Setup
```powershell
cd qr-mini-app/frontend
npm install
npm run dev
```

Open the shown local URL (e.g., http://localhost:5173) then navigate between:
- /generate
- /scan

## Environment Variables
Copy `.env.example` to `.env` and adjust as needed.

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 5055 | Backend port |
| ORIGIN | http://localhost:5173 | Allowed CORS origin |
| APP_SECRET | change_me_dev_secret | HMAC secret for token generation |

## Token Generation (Deterministic)
`token = base64url(HMAC_SHA256(APP_SECRET, docId))`

## QR Payload Example
```
http://localhost:5055/d/7f2c6b9b-3d8e-4d1c-9a4e-1b2c5aa2f9a1?token=J2v8JX5... (truncated)
```

## Next Steps / Ideas
- Add patient metadata embedding (encrypted JSON) inside QR as fallback.
- Add short-lived signed URLs (expiry + issuedAt).
- Switch to object storage (S3, GCS) with pre-signed URLs.
- Add PDF generation from structured vaccination data.
- Integrate with main thesis backend auth + audit trail.

## License
Educational / thesis demo purpose.
