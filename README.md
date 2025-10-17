# QR Mini App (Generator + Scanner)

Mini reference implementation to experiment with QR codes for patient vaccination documents (PDF or image) using Vue 3 + Vite (frontend) and Express (backend).

## Features
- Upload a PDF/image representing a patient vaccination profile
- Backend stores file locally and returns a secure URL + token
- Generate a QR code that encodes the document access URL
- Scan QR code via device camera to retrieve and display / download the document
- Simple HMAC token validation (no DB persistence required for demo)

## High-Level Flow
1. Admin/health staff (or patient) uploads a document in Generator view.
2. Server stores it under `uploads/` and returns: `docId`, `token`, and a public access URL.
3. Frontend renders a QR code of that URL.
4. Health staff scans QR with Scanner view (camera) which decodes URL.
5. Browser requests the URL; server validates token and streams the file.

## Security Notes (Demo Scope)
- Token = HMAC(docId) with server secret. Anyone guessing docId cannot read file without correct token.
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
