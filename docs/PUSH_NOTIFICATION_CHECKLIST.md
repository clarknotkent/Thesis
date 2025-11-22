# Push Notification Setup Checklist

Use this checklist to complete the setup of push notifications for ChildCare+.

## ✅ Completed (During Implementation)

- [x] Install web-push package in backend
- [x] Create notification store (Pinia)
- [x] Create push notification service layer
- [x] Create push composable for Vue components
- [x] Create push permission modal UI
- [x] Create backend VAPID utilities
- [x] Add push subscription endpoints to backend
- [x] Update service worker with push handlers
- [x] Integrate notification store in mobile TopBars
- [x] Add permission modal to mobile layouts
- [x] Create database migration SQL file
- [x] Fix all linting errors
- [x] Change Guardian badge color to light brown

## 📋 Manual Setup Required (Follow in Order)

### 1. Generate VAPID Keys

```bash
cd backend
node generate-vapid-keys.js
```

**Expected Output:** Public and private VAPID keys

**Action:** Copy the keys to clipboard

---

### 2. Configure Backend Environment

**File:** `backend/.env`

**Add these lines:**
```env
VAPID_PUBLIC_KEY=<paste-public-key-here>
VAPID_PRIVATE_KEY=<paste-private-key-here>
VAPID_SUBJECT=mailto:your-admin-email@childcareplus.com
```

**Verify:**
- [ ] All three variables added
- [ ] No extra spaces or quotes
- [ ] VAPID_SUBJECT uses real email address

---

### 3. Configure Frontend Environment

**File:** `frontend/.env`

**Add this line:**
```env
VITE_VAPID_PUBLIC_KEY=<paste-public-key-here>
```

**Verify:**
- [ ] Public key matches backend public key
- [ ] Variable name starts with VITE_

---

### 4. Run Database Migration

**Option A - Using psql:**
```bash
psql -h localhost -U postgres -d your_database -f backend/migrations/002_create_push_subscriptions_table.sql
```

**Option B - Using Supabase:**
```bash
supabase migration up
```

**Option C - Direct SQL:**
Open your database tool and execute the SQL from:
`backend/migrations/002_create_push_subscriptions_table.sql`

**Verify:**
- [ ] `push_subscriptions` table created
- [ ] Indexes created successfully
- [ ] Foreign key constraint added
- [ ] No errors in migration output

---

### 5. Restart Servers

**Backend:**
```bash
cd backend
npm run dev
```

**Look for this log:**
```
✅ Web Push configured with VAPID keys
```

**Frontend:**
```bash
cd frontend
npm run dev
```

**Verify:**
- [ ] Backend starts without VAPID warnings
- [ ] Frontend builds without errors
- [ ] No console errors about missing env variables

---

### 6. Test Basic Functionality

#### A. Test Permission Modal

1. Open app in Chrome/Edge browser
2. Navigate to Parent or Health Worker login
3. Log in
4. Wait 3 seconds

**Expected Result:**
- [ ] Push permission modal appears
- [ ] Modal shows benefits list
- [ ] Enable/Dismiss buttons work

#### B. Test Push Subscription

1. Click "Enable Notifications" in modal
2. Accept browser permission prompt
3. Open DevTools Console

**Expected Logs:**
- [ ] "Push notifications are supported ✓"
- [ ] "Subscribed to push notifications"
- [ ] No errors

**Database Check:**
```sql
SELECT * FROM push_subscriptions;
```

**Expected Result:**
- [ ] New row with your user_id
- [ ] endpoint, p256dh, auth fields populated
- [ ] created_at timestamp is recent

#### C. Test Badge Count

1. Stay on any page with TopBar
2. Open DevTools Console
3. Check for badge updates

**Expected:**
- [ ] App icon badge shows count (Chrome/Edge only)
- [ ] In-app notification badge shows count
- [ ] Count updates automatically every 30 seconds

#### D. Test Push Notification

**Method 1 - Create Real Notification:**
1. From another account, send a message to test user
2. Switch to background tab or minimize browser
3. Wait for push notification

**Expected:**
- [ ] Browser notification appears
- [ ] Notification shows correct title/body
- [ ] Clicking notification focuses app window
- [ ] App badge count increases

**Method 2 - Use Test Function:**
Open browser console and run:
```javascript
// In Parent or Health Worker page
const { showTestNotification } = usePushNotifications();
showTestNotification();
```

**Expected:**
- [ ] Test notification appears
- [ ] Notification shows with ChildCare+ icon

---

### 7. Test Multi-Device

1. Open app on second device/browser
2. Log in with same account
3. Subscribe to push notifications

**Database Check:**
```sql
SELECT user_id, COUNT(*) as device_count
FROM push_subscriptions
GROUP BY user_id;
```

**Expected:**
- [ ] Same user_id has 2+ rows
- [ ] Different endpoint values
- [ ] All subscriptions active

**Send Notification:**
- [ ] Both devices receive notification
- [ ] Badge updates on both devices

---

### 8. Test Error Handling

#### A. Denied Permission
1. Open app in new browser profile
2. When permission modal appears, click "Enable"
3. In browser prompt, click "Block"

**Expected:**
- [ ] Modal closes
- [ ] No errors in console
- [ ] localStorage flag set (no re-prompt)

#### B. Unsupported Browser
1. Open app in Firefox (no Badging API)

**Expected:**
- [ ] No errors
- [ ] In-app badge works
- [ ] App icon badge doesn't show (expected)
- [ ] Push still works

#### C. Offline Mode
1. Disconnect internet
2. Check notification badge

**Expected:**
- [ ] Shows cached count from IndexedDB
- [ ] No errors
- [ ] Reconnect → updates to real count

---

### 9. Production Deployment

#### A. Environment Variables

**On Railway/Render/Vercel:**
1. Add backend environment variables:
   - `VAPID_PUBLIC_KEY`
   - `VAPID_PRIVATE_KEY`
   - `VAPID_SUBJECT`

2. Add frontend environment variables:
   - `VITE_VAPID_PUBLIC_KEY`

**Verify:**
- [ ] All variables added to production
- [ ] Values match local .env files
- [ ] No trailing spaces in values

#### B. Database Migration

**On Production Database:**
```bash
# Connect to production DB
psql <production-connection-string>

# Run migration
\i backend/migrations/002_create_push_subscriptions_table.sql
```

**Verify:**
- [ ] Table created successfully
- [ ] No errors in production logs

#### C. Deploy Code

```bash
git add .
git commit -m "Add push notifications and app badge system"
git push origin main
```

**Verify:**
- [ ] Backend deploys successfully
- [ ] Frontend deploys successfully
- [ ] No build errors
- [ ] HTTPS enabled (required for push)

#### D. Production Testing

1. Open production URL on mobile device
2. Install as PWA (Add to Home Screen)
3. Subscribe to push notifications
4. Test notification delivery

**Verify:**
- [ ] Permission modal appears
- [ ] Subscription saves to production DB
- [ ] Push notifications received
- [ ] App badge updates (Android Chrome)

---

### 10. Monitoring Setup

#### A. Database Cleanup Cron Job

**Create script:** `backend/scripts/cleanup-expired-subscriptions.js`

**Schedule:** Run daily at 3 AM

**Check:**
- [ ] Removes subscriptions older than 90 days
- [ ] Logs cleanup statistics

#### B. Analytics Tracking

**Track these metrics:**
- [ ] Push subscription rate (% of users)
- [ ] Push delivery success rate
- [ ] Notification click-through rate
- [ ] Badge view frequency
- [ ] Unsubscribe rate

#### C. Error Monitoring

**Set up alerts for:**
- [ ] VAPID authentication failures
- [ ] High push failure rates
- [ ] Database connection errors
- [ ] Quota exceeded errors

---

## 🔍 Verification Commands

### Check if VAPID keys are loaded:
```bash
cd backend
node -e "require('dotenv').config(); console.log('Public:', !!process.env.VAPID_PUBLIC_KEY); console.log('Private:', !!process.env.VAPID_PRIVATE_KEY);"
```

**Expected:** Both show `true`

### Check database table:
```sql
-- Count subscriptions
SELECT COUNT(*) FROM push_subscriptions;

-- Check recent subscriptions
SELECT user_id, endpoint, created_at
FROM push_subscriptions
ORDER BY created_at DESC
LIMIT 5;

-- Check subscriptions by user
SELECT user_id, COUNT(*) as device_count
FROM push_subscriptions
GROUP BY user_id;
```

### Check service worker registration:
Open DevTools → Application → Service Workers

**Expected:**
- [ ] Service worker active
- [ ] No errors
- [ ] Push subscription registered

---

## 🚨 Troubleshooting

### Issue: "VAPID keys not configured"

**Solution:**
1. Check .env file exists in backend/
2. Verify VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY are set
3. Restart backend server
4. Check for typos in variable names

---

### Issue: "Push not supported"

**Solution:**
1. Ensure HTTPS enabled (or localhost)
2. Check browser compatibility (Chrome 42+)
3. Verify service worker registered
4. Check browser DevTools Console for errors

---

### Issue: "Notification not received"

**Solution:**
1. Check push subscription in database
2. Verify VAPID keys match frontend/backend
3. Check browser notification permissions
4. Ensure app not in foreground (push shows when backgrounded)
5. Check backend logs for push send errors

---

### Issue: "App badge not working"

**Solution:**
1. Only works on Chrome/Edge (not Firefox/Safari)
2. Check if PWA installed
3. Verify `navigator.setAppBadge` available
4. Try restarting browser

---

## 📚 Documentation References

- **Setup Guide:** `docs/PUSH_NOTIFICATION_SETUP.md`
- **Implementation Summary:** `docs/IMPLEMENTATION_SUMMARY_PUSH_NOTIFICATIONS.md`
- **Code Documentation:** JSDoc comments in source files

---

## ✅ Final Checklist

Before marking as complete, ensure:

- [ ] VAPID keys generated and added to both .env files
- [ ] Database migration applied successfully
- [ ] Backend shows "Web Push configured" message
- [ ] Frontend builds without errors
- [ ] Permission modal appears on first visit
- [ ] Push subscription saves to database
- [ ] Browser notifications received
- [ ] App badge updates (Chrome/Edge)
- [ ] Multi-device subscriptions work
- [ ] Production deployment successful
- [ ] Production testing complete
- [ ] Monitoring set up
- [ ] Team trained on troubleshooting

---

**Setup Status:** ⏳ Pending Manual Steps

**Estimated Time:** 15-20 minutes

**Next Action:** Run `node backend/generate-vapid-keys.js`
