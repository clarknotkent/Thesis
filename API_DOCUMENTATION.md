# API Documentation

## PhilSMS Demo — Backend API Reference

---

## Base URL

| Mode | URL |
|------|-----|
| Development (direct) | `http://localhost:3000` |
| Development (via Vite proxy) | `/send-sms` — use this from the frontend |
| Production | `http://localhost:3000` |

---

## Endpoints

### POST /send-sms

Sends an SMS to a Philippine mobile number via the PhilSMS API.

#### Request

**Headers**
```
Content-Type: application/json
```

**Body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `to` | string | Yes | Recipient phone number (Philippine format) |
| `message` | string | Yes | Message body — max 160 characters |

```json
{
  "to": "09171234567",
  "message": "Hello! This is a test message."
}
```

#### Response

**Success — `200 OK`**

The response body is forwarded directly from PhilSMS. Shape may vary, but typically:

```json
{
  "success": true,
  "message": "SMS sent successfully",
  "data": {
    "message_id": "abc123",
    "recipient": "+639171234567",
    "status": "sent"
  }
}
```

**Error — `500 Internal Server Error`**

| Cause | `error` value |
|-------|---------------|
| `PHILSMS_API_KEY` not set in `.env` | `"PhilSMS API key not configured."` |
| PhilSMS API rejected the request | Error message forwarded from PhilSMS |
| Network or unknown failure | `error.message` from Node.js |

```json
{
  "error": "PhilSMS API key not configured."
}
```

---

## Phone Number Formatting

The server normalises the `to` field to E.164 format before forwarding to PhilSMS.

| Input | Sent to PhilSMS |
|-------|-----------------|
| `09171234567` | `+639171234567` |
| `639171234567` | `+639171234567` |
| `+639171234567` | `+639171234567` |

**Logic in `server.js`:**

```javascript
if (!to.startsWith("+63")) {
  to = to.replace(/^0/, "+63");
}
```

---

## PhilSMS Integration

The backend POSTs to the PhilSMS API:

```
POST https://app.philsms.com/api/v3/sms/send
```

**Payload:**
```json
{
  "sender_id": "YOUR_SENDER_ID",
  "recipient": "+639171234567",
  "message": "Your message here"
}
```

**Headers:**
```
Authorization: Bearer <PHILSMS_API_KEY>
Content-Type: application/json
```

---

## Environment Variables

Defined in `.env` at the project root (git-ignored):

| Variable | Description | Required |
|----------|-------------|----------|
| `PHILSMS_API_KEY` | PhilSMS API Bearer token | Yes |
| `PHILSMS_SENDER_ID` | Sender name shown on the SMS | Yes |
| `PORT` | Express server port (default: `3000`) | No |

---

## Testing the Endpoint

### cURL

```bash
curl -X POST http://localhost:3000/send-sms \
  -H "Content-Type: application/json" \
  -d '{"to":"09171234567","message":"Test message"}'
```

### fetch (browser console)

```javascript
fetch('/send-sms', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ to: '09171234567', message: 'Test message' })
})
  .then(r => r.json())
  .then(console.log);
```

### Postman

| Field | Value |
|-------|-------|
| Method | `POST` |
| URL | `http://localhost:3000/send-sms` |
| Header | `Content-Type: application/json` |
| Body (raw JSON) | `{ "to": "09171234567", "message": "Test" }` |
