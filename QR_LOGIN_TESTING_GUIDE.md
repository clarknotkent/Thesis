# QR Login Flow Testing Guide

## 🧪 How to Test the QR Login Redirect Flow Locally

### Test 1: Simulate QR Scan When Not Logged In

1. **Logout first:**
   ```javascript
   // Open browser console (F12) and run:
   localStorage.clear()
   sessionStorage.clear()
   location.reload()
   ```

2. **Simulate a QR scan redirect:**
   ```javascript
   // In browser console:
   sessionStorage.setItem('postLoginRedirect', '/patient/1')
   window.location.href = '/auth/login?redirect=/patient/1'
   ```

3. **Login with valid credentials**

4. **Expected Result:**
   - After login, you should be redirected to `/patient/1`
   - Check console logs for:
     - `🔍 [Login] Checking for redirect on mount`
     - `✅ [Login] Will redirect to after login: /patient/1`
     - `🎯 [Login] Login successful, checking redirect`
     - `✅ [Login] Redirecting to intended destination: /patient/1`

---

### Test 2: Simulate Manual URL Entry When Not Logged In

1. **Logout:**
   ```javascript
   localStorage.clear()
   sessionStorage.clear()
   ```

2. **Directly navigate to a patient page:**
   ```
   http://localhost:5173/patient/1
   ```

3. **Expected Result:**
   - You should be redirected to login page
   - URL should be: `/auth/login?redirect=/patient/1`
   - Console should show:
     - `🔒 [PatientRoute] Not authenticated, storing redirect and sending to login`

4. **Login with valid credentials**

5. **Expected Result:**
   - After login, you should be redirected back to `/patient/1`

---

### Test 3: Verify SessionStorage Persistence

1. **Set redirect and refresh:**
   ```javascript
   sessionStorage.setItem('postLoginRedirect', '/patient/123')
   location.reload()
   ```

2. **Check if it persists:**
   ```javascript
   console.log(sessionStorage.getItem('postLoginRedirect'))
   // Should output: /patient/123
   ```

3. **Navigate to login:**
   ```
   http://localhost:5173/auth/login
   ```

4. **Expected Result:**
   - Login page should show info alert: "You will be redirected to the requested page after login"
   - Console should show: `✅ [Login] Will redirect to after login: /patient/123`

---

### Test 4: Normal Login Without QR (Baseline)

1. **Clear everything:**
   ```javascript
   localStorage.clear()
   sessionStorage.clear()
   ```

2. **Go directly to login:**
   ```
   http://localhost:5173/auth/login
   ```

3. **Login normally**

4. **Expected Result:**
   - Should redirect to role-based default page:
     - Admin → `/admin/dashboard`
     - Health Worker → `/healthworker/dashboard`
     - Parent → `/parent/home`
   - Console should show: `ℹ️ [Login] No redirect found, using role-based routing`

---

## 🔍 What to Look For in Console

### Successful QR Flow:
```
🔒 [PatientRoute] Not authenticated, storing redirect and sending to login
🔍 [Login] Checking for redirect on mount: { queryRedirect: "/patient/1", ... }
✅ [Login] Will redirect to after login: /patient/1
🎯 [Login] Login successful, checking redirect: { targetPath: "/patient/1", ... }
✅ [Login] Redirecting to intended destination: /patient/1
🔍 [PatientRoute] role: admin, normalized: admin, patientId: 1
```

### Normal Login (No QR):
```
🔍 [Login] Checking for redirect on mount: { queryRedirect: undefined, storedRedirect: null }
ℹ️ [Login] No redirect path found, will use default role-based routing
🎯 [Login] Login successful, checking redirect: { targetPath: null, ... }
ℹ️ [Login] No redirect found, using role-based routing for: admin
```

---

## ✅ Verification Checklist

- [ ] QR scan while logged out → stores redirect → login → goes to patient
- [ ] Direct URL while logged out → stores redirect → login → goes to URL
- [ ] SessionStorage persists across page refresh
- [ ] Redirect clears after successful navigation
- [ ] Normal login without QR goes to default dashboard
- [ ] Info message shows on login page when redirect exists
- [ ] Console logs show correct flow

---

## 🐛 Troubleshooting

**If redirect doesn't work:**

1. Check sessionStorage:
   ```javascript
   console.log(sessionStorage.getItem('postLoginRedirect'))
   ```

2. Check redirectPath in Login:
   ```javascript
   // Should be set in onMounted
   ```

3. Verify router.push is called:
   ```javascript
   // Look for console log: "✅ [Login] Redirecting to intended destination"
   ```

4. Check if sessionStorage was cleared:
   ```javascript
   // After redirect, should be null
   console.log(sessionStorage.getItem('postLoginRedirect'))
   ```

**Common Issues:**

- Browser blocking sessionStorage (private mode)
- Multiple tabs interfering
- Route guard blocking navigation
- Wrong patient ID (non-existent)

---

## 📝 Notes

- SessionStorage is **per-tab** (not shared across tabs)
- SessionStorage clears when tab is closed
- LocalStorage persists even after browser restart
- We use sessionStorage for security (auto-clears)
