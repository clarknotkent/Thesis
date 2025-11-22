# Push Notification Setup Guide

This guide covers setting up Web Push notifications for the ChildCare+ application.

## Prerequisites

- Node.js v16+ installed
- Access to backend/.env file
- Access to frontend/.env file
- PostgreSQL database running

## Step 1: Install Backend Dependencies

Navigate to the backend directory and install the web-push package:

```bash
cd backend
npm install web-push
```

## Step 2: Generate VAPID Keys

VAPID (Voluntary Application Server Identification) keys are required for secure push notifications.

### Option A: Using the built-in utility function

Run this command in the backend directory:

```bash
node -e "const webpush = require('web-push'); const keys = webpush.generateVAPIDKeys(); console.log('Public Key:', keys.publicKey); console.log('Private Key:', keys.privateKey);"
```

### Option B: Using the generateVapidKeys function

Create a temporary script file `generate-keys.js` in the backend directory:

```javascript
const { generateVapidKeys } = require('./utils/webPush.js');

const keys = generateVapidKeys();
console.log('Generated VAPID Keys:');
console.log('======================');
console.log('Public Key:', keys.publicKey);
console.log('Private Key:', keys.privateKey);
console.log('\nAdd these to your .env files:');
console.log('\nBackend .env:');
console.log(`VAPID_PUBLIC_KEY=${keys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${keys.privateKey}`);
console.log(`VAPID_SUBJECT=mailto:your-email@example.com`);
console.log('\nFrontend .env:');
console.log(`VITE_VAPID_PUBLIC_KEY=${keys.publicKey}`);
```

Run it:

```bash
node generate-keys.js
```

## Step 3: Configure Backend Environment

Add the following to `backend/.env`:

```env
# Web Push Notifications (VAPID)
VAPID_PUBLIC_KEY=YOUR_GENERATED_PUBLIC_KEY
VAPID_PRIVATE_KEY=YOUR_GENERATED_PRIVATE_KEY
VAPID_SUBJECT=mailto:your-admin-email@example.com
```

**Important:**
- Replace `YOUR_GENERATED_PUBLIC_KEY` with the public key from Step 2
- Replace `YOUR_GENERATED_PRIVATE_KEY` with the private key from Step 2
- Replace `your-admin-email@example.com` with a real contact email

## Step 4: Configure Frontend Environment

Add the following to `frontend/.env`:

```env
# Web Push Notifications
VITE_VAPID_PUBLIC_KEY=YOUR_GENERATED_PUBLIC_KEY
```

**Note:** Only the public key is needed in the frontend.

## Step 5: Run Database Migration

Run the push_subscriptions table migration:

### Using Supabase CLI:

```bash
supabase migration up
```

### Using Direct SQL:

Connect to your PostgreSQL database and run the migration file:

```bash
psql -h localhost -U your_user -d your_database -f backend/migrations/002_create_push_subscriptions_table.sql
```

Or execute the SQL directly in your database management tool.

## Step 6: Verify Setup

### Backend Verification

Start the backend server and check for VAPID initialization logs:

```bash
cd backend
npm run dev
```

You should see:
```
✅ Web Push configured with VAPID keys
```

If you see warnings about missing VAPID keys, check your .env file.

### Frontend Verification

1. Start the frontend development server:

```bash
cd frontend
npm run dev
```

2. Open the app in a browser (must be HTTPS or localhost)

3. Open browser DevTools Console

4. Navigate to a Parent or Health Worker page

5. After 3 seconds, you should see the Push Permission Modal

6. Check console for:
   - "Push notifications are supported ✓"
   - Browser notification permission status

### Test Push Notification Flow

1. **Enable Push Notifications:**
   - Click "Enable Notifications" in the permission modal
   - Grant permission in browser prompt

2. **Check Subscription:**
   - Open DevTools Console
   - You should see logs about subscription success
   - Check `push_subscriptions` table in database for new entry

3. **Trigger Test Notification:**
   - Create a new notification in the app (e.g., message a parent)
   - Check if:
     - App badge count updates (Chrome/Edge only)
     - Push notification appears (if app is in background)
     - Notification appears in notification center

4. **Test Multi-Device:**
   - Open app on another device/browser
   - Subscribe to push
   - Verify both devices receive notifications

## Troubleshooting

### Issue: "Push notifications not supported"

**Causes:**
- HTTP site (must be HTTPS or localhost)
- Insecure context (iframe without proper permissions)
- Browser doesn't support Push API (Safari < 16.4)

**Solution:**
- Use HTTPS in production
- Use localhost for development
- Check browser compatibility

### Issue: "Permission denied"

**Causes:**
- User denied browser permission
- Permission blocked at OS level
- Site already blocked in browser settings

**Solution:**
- Ask user to check browser notification settings
- Clear site data and try again
- Guide user to enable notifications in OS settings

### Issue: Push not received

**Causes:**
- Invalid VAPID keys
- Subscription expired
- Push service unreachable
- Browser not running

**Solution:**
- Verify VAPID keys match between frontend and backend
- Check `push_subscriptions` table for valid entries
- Check browser DevTools → Application → Service Workers
- Ensure backend has internet access

### Issue: App badge not working

**Causes:**
- Browser doesn't support Badging API (Firefox, Safari)
- PWA not installed
- Permission not granted

**Solution:**
- Only works on Chrome/Edge desktop and Android
- Install app as PWA for better badge support
- Check `navigator.setAppBadge` availability

## Browser Support

### Push Notifications
- ✅ Chrome 42+
- ✅ Edge 17+
- ✅ Firefox 44+
- ✅ Safari 16+ (macOS 13+, iOS 16.4+)
- ✅ Opera 37+

### Badging API
- ✅ Chrome 81+ (Desktop & Android)
- ✅ Edge 81+
- ❌ Firefox (not supported)
- ❌ Safari (not supported)

### Service Workers
- ✅ Chrome 40+
- ✅ Edge 17+
- ✅ Firefox 44+
- ✅ Safari 11.1+
- ✅ Opera 27+

## Production Deployment

### Railway/Render/Vercel

1. Add environment variables to deployment platform:
   - `VAPID_PUBLIC_KEY`
   - `VAPID_PRIVATE_KEY`
   - `VAPID_SUBJECT`

2. Ensure HTTPS is enabled (usually default)

3. Run database migration on production database

4. Update frontend environment variables:
   - `VITE_VAPID_PUBLIC_KEY`

5. Deploy and test with real devices

### Security Considerations

- ✅ Never commit VAPID keys to version control
- ✅ Use different keys for dev/staging/production
- ✅ Rotate keys periodically (requires re-subscription)
- ✅ Validate user permissions before sending push
- ✅ Implement rate limiting for push notifications
- ✅ Clean up expired subscriptions regularly

## Monitoring

### Database Queries

Check subscription count:
```sql
SELECT COUNT(*) FROM push_subscriptions;
```

Check subscriptions by user:
```sql
SELECT user_id, COUNT(*) as device_count
FROM push_subscriptions
GROUP BY user_id
ORDER BY device_count DESC;
```

Find old subscriptions:
```sql
SELECT * FROM push_subscriptions
WHERE updated_at < NOW() - INTERVAL '30 days';
```

### Logs to Monitor

- Push subscription success/failure
- Push send success/failure
- Expired subscription cleanup
- VAPID key validation errors
- Permission request outcomes

## Next Steps

1. Set up automated cleanup of expired subscriptions (cron job)
2. Implement push notification analytics
3. Add notification action buttons (reply, dismiss, etc.)
4. Configure notification categories/priorities
5. Add notification scheduling for specific times
6. Implement quiet hours (don't send at night)

## Resources

- [Web Push Protocol Spec](https://tools.ietf.org/html/rfc8030)
- [VAPID Spec](https://tools.ietf.org/html/rfc8292)
- [MDN: Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [MDN: Notifications API](https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API)
- [Google: Web Push Best Practices](https://web.dev/push-notifications-overview/)
