# Chat Feature Troubleshooting Guide

## Issue: Can't Send New Chat

### What I Fixed

I've improved the chat feature with better error handling and user feedback. Here's what changed:

#### 1. **Better User Loading**
- Now requests 100 users instead of default 10
- Only shows active users
- Filters out current user automatically
- Shows alert if no users are available

#### 2. **Enhanced Error Messages**
- Clear error messages shown in alerts
- Console logs for debugging
- Shows specific error from server

#### 3. **Improved UI Feedback**
- Required field indicators (*)
- Character counters (1000 char limit)
- Loading state in modal
- Disabled controls while creating
- Better validation messages

#### 4. **Debug Logging**
- Logs conversation creation payload
- Logs success response
- Logs user count loaded

---

## How to Test the Fix

### 1. **Open Browser Console**
Press `F12` to open Developer Tools, then click "Console" tab

### 2. **Try Creating a Chat**
1. Go to `/healthworker/messages`
2. Click "New" button
3. Watch the console for messages

### 3. **What to Look For**

#### ✅ Success Path:
```
Loaded X available users
Creating conversation with: { ... }
Conversation created successfully: { ... }
```

#### ❌ Error Path:
```
Failed to load users: [error message]
- OR -
Failed to create conversation: [error message]
```

---

## Common Issues & Solutions

### Issue 1: "No users available to message"

**Cause:** Database has no users or API returned empty

**Solutions:**
1. Check if there are other users in the system (admin/health workers)
2. Verify you're logged in correctly
3. Check if your account has proper permissions

**Debug:**
```javascript
// Open console and check:
localStorage.getItem('authToken') // Should show token
localStorage.getItem('authUser')   // Should show user info
```

---

### Issue 2: "Failed to load users: 401 Unauthorized"

**Cause:** Authentication token is invalid or expired

**Solutions:**
1. Log out and log back in
2. Clear browser cache and cookies
3. Check if token exists in localStorage

**Debug:**
```javascript
// Check token
console.log(localStorage.getItem('authToken'))
// If null or undefined, you need to login again
```

---

### Issue 3: "Failed to load users: 403 Forbidden"

**Cause:** Your role doesn't have permission to view users

**Solutions:**
1. Verify you're logged in as health worker
2. Contact admin to check your role permissions
3. Check backend logs for authorization errors

**Backend Check:**
- Verify `userRoutes.js` allows health workers
- Check `authenticateRequest` middleware
- Verify `checkUserMapping` is working

---

### Issue 4: "Failed to start conversation: [error]"

**Cause:** Various backend issues

**Common Causes & Solutions:**

#### a) Participant not found
```
Error: "participants required" or "user not found"
```
**Solution:** Ensure recipient user_id exists in database

#### b) Message too long
```
Error: "message too long" or validation error
```
**Solution:** Keep message under 1000 characters (now enforced in UI)

#### c) Backend error
```
Error: "Failed to create conversation"
```
**Solution:** Check backend logs for details

---

## Debugging Steps

### Step 1: Check Authentication
```javascript
// In browser console
console.log('Token:', localStorage.getItem('authToken'))
console.log('User:', JSON.parse(localStorage.getItem('authUser') || '{}'))
```

### Step 2: Check Network Tab
1. Open DevTools → Network tab
2. Click "New" to open modal
3. Look for request to `/api/users?limit=100...`
4. Check response:
   - Status 200 = Success
   - Status 401 = Not authenticated
   - Status 403 = Not authorized
   - Status 500 = Server error

### Step 3: Check Response Data
```javascript
// In Network tab, click the /api/users request
// Look at "Response" or "Preview" tab
// Should see:
{
  "users": [ ... array of users ... ],
  "pagination": { ... }
}
```

### Step 4: Test Create Conversation
1. Select a recipient
2. Type a message
3. Click "Send"
4. Watch Network tab for `/api/conversations/start`
5. Check response

---

## Quick Fixes

### Fix 1: Clear Cache and Restart
```bash
# Clear browser cache
Ctrl + Shift + Delete

# Or in DevTools:
# Application → Storage → Clear site data
```

### Fix 2: Re-login
1. Log out
2. Close all browser tabs
3. Log back in
4. Try again

### Fix 3: Check Backend Status
```bash
# Make sure backend is running
# Check backend logs for errors
# Verify database connection
```

---

## API Testing (Manual)

### Test 1: Can I Get Users?
```bash
# Using curl or Postman:
curl -X GET "http://localhost:3000/api/users?limit=100" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Expected: List of users
# If error: Check auth token and permissions
```

### Test 2: Can I Create Conversation?
```bash
curl -X POST "http://localhost:3000/api/conversations/start" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "participants": ["USER_ID_HERE"],
    "message_content": "Test message",
    "message_type": "chat"
  }'

# Expected: New conversation object
# If error: Check participant ID and message
```

---

## What the New Code Does

### 1. Enhanced Error Handling
```javascript
// Before:
catch (error) {
  console.error('Failed to load users:', error)
}

// After:
catch (error) {
  console.error('Failed to load users:', error)
  const errorMsg = error.response?.data?.message || error.message
  alert(`Failed to load users: ${errorMsg}`)
}
```

### 2. Better User Feedback
```vue
<!-- Shows loading state -->
<div v-if="availableUsers.length === 0">
  Loading available users...
</div>

<!-- Shows character count -->
<small>{{ message.length }}/1000 characters</small>

<!-- Shows required fields -->
<label>Recipient: <span class="text-danger">*</span></label>
```

### 3. Improved Validation
```javascript
// Requests more users
params: {
  limit: 100,
  page: 1,
  status: 'active'
}

// Checks if users loaded
if (users.length === 0) {
  alert('No users available')
}

// Validates before creating
if (!canCreateConversation.value) return
```

---

## Next Steps If Still Not Working

1. **Check Backend Logs**
   - Look for errors when fetching users
   - Look for errors when creating conversation
   - Check database connection

2. **Verify Database**
   - Are there users in the `users` table?
   - Are conversations/messages tables accessible?
   - Check for permission issues

3. **Check Middleware**
   - Is `authenticateRequest` working?
   - Is `checkUserMapping` working?
   - Are health workers allowed to access these endpoints?

4. **Test with Admin**
   - Can admin create conversations?
   - If yes, it's a permission issue
   - If no, it's a general backend issue

5. **Share Error Details**
   - Copy error from browser console
   - Copy error from backend logs
   - Share network request/response
   - This helps diagnose the specific issue

---

## Contact Info

If you're still having issues, provide:
1. ✅ Error message from browser console
2. ✅ Error message from backend logs
3. ✅ Network request/response (from DevTools)
4. ✅ Your user role (health worker/admin)
5. ✅ Are there other users in the system?

This information will help diagnose the exact issue! 🔍
