# API Documentation

## PhilSMS Demo API Reference

This document provides detailed information about the backend API endpoints used in the PhilSMS Demo application.

---

## Base URL

```
http://localhost:3000
```

---

## Endpoints

### 1. Send SMS

Send an SMS message to a Philippine mobile number.

#### Endpoint

```
POST /send-sms
```

#### Request Headers

```
Content-Type: application/json
```

#### Request Body

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `to` | string | Yes | Recipient phone number (11 digits starting with 09) | `"09171234567"` |
| `message` | string | Yes | SMS message content (max 160 characters) | `"Hello, this is a test message"` |

#### Request Example

```json
{
  "to": "09171234567",
  "message": "Hello! This is a test message from PhilSMS Demo."
}
```

#### cURL Example

```bash
curl -X POST http://localhost:3000/send-sms \
  -H "Content-Type: application/json" \
  -d '{
    "to": "09171234567",
    "message": "Hello! This is a test message."
  }'
```

#### JavaScript/Axios Example

```javascript
const axios = require('axios');

const sendSMS = async () => {
  try {
    const response = await axios.post('http://localhost:3000/send-sms', {
      to: '09171234567',
      message: 'Hello! This is a test message.'
    });
    console.log('Success:', response.data);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
};

sendSMS();
```

#### Success Response

**Status Code:** `200 OK`

```json
{
  "success": true,
  "message": "SMS sent successfully",
  "data": {
    "message_id": "abc123def456",
    "recipient": "+639171234567",
    "status": "sent"
  }
}
```

#### Error Responses

**1. Missing API Key**

**Status Code:** `500 Internal Server Error`

```json
{
  "error": "PhilSMS API key not configured."
}
```

**2. Invalid Phone Number**

**Status Code:** `500 Internal Server Error`

```json
{
  "error": "Invalid phone number format"
}
```

**3. API Request Failed**

**Status Code:** `500 Internal Server Error`

```json
{
  "error": "Failed to send SMS: <error details>"
}
```

**4. Missing Required Fields**

**Status Code:** `500 Internal Server Error`

```json
{
  "error": "Missing required fields: to, message"
}
```

---

## Phone Number Formatting

The backend automatically formats Philippine mobile numbers:

| Input Format | Converted To | Valid? |
|--------------|--------------|--------|
| `09171234567` | `+639171234567` | ✅ Yes |
| `639171234567` | `+639171234567` | ✅ Yes |
| `+639171234567` | `+639171234567` | ✅ Yes |
| `9171234567` | `+639171234567` | ✅ Yes (adds 0) |

### Formatting Rules

1. If number starts with `09`, replace `0` with `+63`
2. If number starts with `63`, add `+` prefix
3. If number starts with `+63`, keep as is
4. All other formats are converted accordingly

### Code Example

```javascript
// Backend formatting logic
let phoneNumber = "09171234567";

if (!phoneNumber.startsWith("+63")) {
  phoneNumber = phoneNumber.replace(/^0/, "+63");
}

// Result: "+639171234567"
```

---

## PhilSMS API Integration

The backend server communicates with the PhilSMS API:

### PhilSMS Endpoint

```
POST https://app.philsms.com/api/v3/sms/send
```

### Request to PhilSMS

```json
{
  "sender_id": "Eulap",
  "recipient": "+639171234567",
  "message": "Your message here"
}
```

### Headers

```
Authorization: Bearer 362|jA3v0uuHjeHXb4LcPvVo4EWutmyLfLstje0WuIsX
Content-Type: application/json
```

---

## Environment Variables

The backend requires the following environment variables in the `.env` file:

| Variable | Description | Required |
|----------|-------------|----------|
| `PHILSMS_API_KEY` | PhilSMS API Bearer token | Yes |
| `PHILSMS_SENDER_ID` | Sender name (appears on SMS) | Yes |
| `PORT` | Server port (default: 3000) | No |

### Example `.env` File

```env
PHILSMS_API_KEY=362|jA3v0uuHjeHXb4LcPvVo4EWutmyLfLstje0WuIsX
PHILSMS_SENDER_ID=Eulap
PORT=3000
```

---

## Error Handling

The API implements comprehensive error handling:

### Server-Side Errors

```javascript
try {
  const response = await axios.post(PHILSMS_API_URL, payload, config);
  res.json(response.data);
} catch (error) {
  res.status(500).json({ 
    error: error.response?.data?.error || error.message 
  });
}
```

### Common Error Scenarios

1. **Invalid API Key**
   - PhilSMS returns 401 Unauthorized
   - Backend forwards the error to client

2. **Insufficient Balance**
   - PhilSMS returns balance error
   - Client receives descriptive error message

3. **Network Issues**
   - Axios timeout or connection errors
   - Client receives network error message

4. **Invalid Phone Number**
   - PhilSMS rejects the number
   - Client receives validation error

---

## CORS Configuration

The backend enables CORS for frontend communication:

```javascript
const cors = require('cors');
app.use(cors());
```

This allows the Vue.js frontend to make requests from a different port (5173).

---

## Rate Limiting

**Note:** The current implementation does not include rate limiting. For production use, consider adding:

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/send-sms', limiter);
```

---

## Security Considerations

### Current Implementation

✅ **Environment Variables** - API keys stored in `.env`  
✅ **CORS Enabled** - Cross-origin requests allowed  
⚠️ **No Authentication** - No user authentication required  
⚠️ **No Rate Limiting** - Unlimited requests allowed  
⚠️ **No Input Sanitization** - Trusts client input  

### Recommendations for Production

1. **Add Authentication**
   ```javascript
   app.use('/send-sms', authenticateUser);
   ```

2. **Implement Rate Limiting**
   - Prevent abuse and API quota exhaustion

3. **Input Validation**
   ```javascript
   const { body, validationResult } = require('express-validator');
   
   app.post('/send-sms', [
     body('to').isMobilePhone('en-PH'),
     body('message').isLength({ min: 1, max: 160 })
   ], handler);
   ```

4. **Request Logging**
   ```javascript
   const morgan = require('morgan');
   app.use(morgan('combined'));
   ```

5. **HTTPS Only**
   - Use HTTPS in production
   - Redirect HTTP to HTTPS

---

## Testing the API

### Using Postman

1. Open Postman
2. Create a new POST request
3. URL: `http://localhost:3000/send-sms`
4. Headers: `Content-Type: application/json`
5. Body (raw JSON):
   ```json
   {
     "to": "09171234567",
     "message": "Test from Postman"
   }
   ```
6. Click Send

### Using cURL

```bash
curl -X POST http://localhost:3000/send-sms \
  -H "Content-Type: application/json" \
  -d '{"to":"09171234567","message":"Test from cURL"}'
```

### Using Browser Console

```javascript
fetch('http://localhost:3000/send-sms', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    to: '09171234567',
    message: 'Test from browser'
  })
})
.then(res => res.json())
.then(data => console.log(data))
.catch(err => console.error(err));
```

---

## API Response Times

Typical response times:

- **Success:** 1-3 seconds
- **Validation Error:** < 100ms
- **Network Error:** Varies (timeout after 30s)

---

## Troubleshooting API Issues

### Problem: "PhilSMS API key not configured"

**Solution:** Check that `PHILSMS_API_KEY` is set in `server/.env`

### Problem: "Failed to send SMS"

**Possible Causes:**
1. Invalid API key
2. Insufficient PhilSMS balance
3. Invalid phone number
4. Network connectivity issues

**Debugging:**
```javascript
// Add console logging in server.js
console.log('Sending to:', to);
console.log('API Key:', apiKey ? 'Set' : 'Not set');
```

### Problem: CORS Errors

**Solution:** Ensure `cors` middleware is enabled:
```javascript
const cors = require('cors');
app.use(cors());
```

---

## Future Enhancements

Potential API improvements:

- [ ] Bulk SMS sending
- [ ] SMS scheduling
- [ ] Delivery status checking
- [ ] Message templates
- [ ] Contact list management
- [ ] SMS analytics and reporting
- [ ] Webhook support for delivery reports

---

## Support

For API-related issues:

1. Check server logs for errors
2. Verify PhilSMS API status
3. Test with cURL to isolate frontend issues
4. Review this documentation
5. Create a GitHub issue with details

---

**Last Updated:** October 27, 2025  
**API Version:** 1.0.0  
**PhilSMS API Version:** v3
