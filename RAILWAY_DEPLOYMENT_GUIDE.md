# 🚂 Railway Deployment Guide

**For Future PWA Deployment**

This guide covers deploying the ImmunizeMe system to Railway. Use this after converting the application to a Progressive Web App (PWA).

---

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Detailed Setup](#detailed-setup)
- [Environment Variables](#environment-variables)
- [Port Configuration](#port-configuration)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

- Railway account ([Sign up here](https://railway.app))
- GitHub repository with your code
- Supabase database credentials
- Code pushed to `system-prototype-v2` branch

---

## Quick Start

### 1️⃣ Push Your Code

```bash
git add .
git commit -m "Prepare for Railway deployment"
git push origin system-prototype-v2
```

### 2️⃣ Create Railway Project

1. Go to [railway.app](https://railway.app)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose: `clarknotkent/Thesis`
5. Branch: `system-prototype-v3`

### 3️⃣ Deploy Backend

**Service Configuration:**
- Root Directory: `backend`
- Start Command: `npm start` (auto-detected)

**Environment Variables:**
```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
JWT_SECRET=your-32-char-secret-key
NODE_ENV=production
CORS_ORIGIN=https://your-frontend.railway.app
```

Railway will auto-deploy. **Note your backend URL.**

### 4️⃣ Deploy Frontend

**Service Configuration:**
- Root Directory: `frontend`
- Build Command: `npm run build` (auto-detected)
- Start Command: `npm start`

**Environment Variables:**
```env
VITE_API_BASE_URL=https://your-backend.railway.app/api
NODE_ENV=production
```

Railway will build and deploy. **Note your frontend URL.**

### 5️⃣ Update CORS

Go back to backend service:
- Update `CORS_ORIGIN` with actual frontend URL
- Service will auto-redeploy

---

## Detailed Setup

### Architecture

This project uses a monorepo structure with two services:
- **Backend**: Node.js/Express API (runs on Railway's dynamic `PORT`)
- **Frontend**: Vue.js SPA served via `serve` package (runs on port 3000)

### Step 1: Create Railway Project

1. Log in to [Railway](https://railway.app)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your repository: `clarknotkent/Thesis`
5. Select branch: `system-prototype-v2`

### Step 2: Deploy Backend Service

#### Add Backend Service
1. In your Railway project, click **"+ New"**
2. Select **"GitHub Repo"**
3. Choose your repository and branch
4. Railway will detect it as a Node.js project

#### Configure Backend
1. Click on the backend service
2. Go to **Settings** tab
3. Set **Root Directory**: `backend`
4. Set **Start Command**: `npm start`
5. Set **Build Command**: Leave empty

#### Add Backend Environment Variables
Go to **Variables** tab and add:

```env
# Database
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# JWT
JWT_SECRET=your_super_secret_jwt_key_min_32_characters_long

# Semaphore SMS (if using)
SEMAPHORE_API_KEY=your_semaphore_api_key

# Node Environment
NODE_ENV=production

# Port (Railway auto-assigns)
PORT=3000

# CORS (set to your frontend URL after deployment)
CORS_ORIGIN=https://your-frontend.up.railway.app

# Optional: Timezone
TZ=Asia/Manila
```

#### Deploy Backend
Railway will automatically deploy. Note the URL (e.g., `https://backend-production-xxxx.up.railway.app`)

### Step 3: Deploy Frontend Service

#### Add Frontend Service
1. In your Railway project, click **"+ New"**
2. Select **"GitHub Repo"** (same repo)
3. Choose your repository and branch

#### Configure Frontend
1. Click on the frontend service
2. Go to **Settings** tab
3. Set **Root Directory**: `frontend`
4. Set **Start Command**: `npm start`
5. Set **Build Command**: `npm run build`

#### Add Frontend Environment Variables
Go to **Variables** tab and add:

```env
# API URL (use your backend Railway URL)
VITE_API_BASE_URL=https://backend-production-xxxx.up.railway.app/api

# Node Environment
NODE_ENV=production

# Port
PORT=3000
```

#### Deploy Frontend
Railway will build and deploy. Note the URL (e.g., `https://frontend-production-xxxx.up.railway.app`)

### Step 4: Update CORS Settings

1. Go back to **Backend service** → **Variables**
2. Update `CORS_ORIGIN` with your frontend URL:
   ```env
   CORS_ORIGIN=https://frontend-production-xxxx.up.railway.app
   ```
3. Backend will automatically redeploy

### Step 5: Configure Custom Domains (Optional)

#### Backend Domain
1. Click on backend service
2. Go to **Settings** → **Domains**
3. Click **"Generate Domain"** or add custom domain
4. Example: `api.immunizeme.com`

#### Frontend Domain
1. Click on frontend service
2. Go to **Settings** → **Domains**
3. Click **"Generate Domain"** or add custom domain
4. Example: `app.immunizeme.com`

#### Update Environment Variables
After setting domains:
- Backend: `CORS_ORIGIN=https://app.immunizeme.com`
- Frontend: `VITE_API_BASE_URL=https://api.immunizeme.com/api`

---

## Environment Variables

### Backend Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `SUPABASE_URL` | Yes | Supabase project URL | `https://xxxxx.supabase.co` |
| `SUPABASE_KEY` | Yes | Supabase anon key | `eyJhbGc...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key | `eyJhbGc...` |
| `JWT_SECRET` | Yes | JWT signing secret (32+ chars) | `your-secret-key` |
| `NODE_ENV` | Yes | Node environment | `production` |
| `PORT` | Auto | Server port (Railway assigns) | `3000` |
| `CORS_ORIGIN` | Yes | Frontend URL for CORS | `https://app.example.com` |
| `SEMAPHORE_API_KEY` | Optional | SMS service API key | `xxx-xxx` |
| `TZ` | Optional | Timezone | `Asia/Manila` |

### Frontend Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `VITE_API_BASE_URL` | Yes | Backend API URL | `https://api.example.com/api` |
| `NODE_ENV` | Yes | Node environment | `production` |
| `PORT` | Optional | Server port | `3000` |

---

## Port Configuration

### Railway (Production)

| Service | Port | URL |
|---------|------|-----|
| **Backend API** | Dynamic (Railway assigns) | `https://backend-production-xxxx.up.railway.app` |
| **Frontend** | `3000` | `https://frontend-production-xxxx.up.railway.app` |

### Local Development

| Service | Mode | Port | URL |
|---------|------|------|-----|
| **Backend API** | All | `3001` | http://localhost:3001 |
| **Frontend** | Development | `5173` | http://localhost:5173 |
| **Frontend** | Production | `5173` | http://localhost:5173 |

---

## Troubleshooting

### Backend Issues

**Problem**: Server not starting
- Check logs: Look for missing environment variables
- Verify `package.json` has correct start script
- Ensure all dependencies are in `dependencies` (not `devDependencies`)

**Problem**: Database connection errors
- Verify Supabase credentials are correct
- Check if Supabase project is active
- Verify IP allowlist in Supabase (Railway IPs change)

**Problem**: CORS errors
- Verify `CORS_ORIGIN` matches frontend URL exactly
- Check backend CORS middleware configuration

### Frontend Issues

**Problem**: Build fails
- Check build logs for missing dependencies
- Verify all imports are correct
- Run `npm run build` locally to test

**Problem**: API calls fail
- Verify `VITE_API_BASE_URL` is correct
- Check browser console for CORS errors
- Ensure backend is running

**Problem**: Environment variables not working
- Railway requires `VITE_` prefix for Vite variables
- Redeploy after adding variables
- Check if variables are set in **Variables** tab

---

## Monitoring

### View Logs

1. Click on service
2. Go to **"Deployments"** tab
3. Click on latest deployment
4. View **"Build Logs"** and **"Deploy Logs"**

### View Metrics

1. Click on service
2. Go to **"Metrics"** tab
3. Monitor:
   - CPU usage
   - Memory usage
   - Network traffic

### Rollback

If deployment fails:

1. Go to **Deployments** tab
2. Find previous successful deployment
3. Click **"..."** menu
4. Select **"Redeploy"**

---

## Continuous Deployment

Railway automatically deploys when you push to GitHub:

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Your commit message"
   git push origin system-prototype-v2
   ```

2. **Automatic Deployment**:
   - Railway detects the push
   - Builds both services
   - Deploys automatically
   - View progress in Railway dashboard

---

## Pricing

Railway offers:
- **Free Tier**: $5 worth of usage per month
- **Hobby Plan**: $5/month + usage
- **Pro Plan**: $20/month + usage

---

## Security Best Practices

1. **Never commit** `.env` files
2. Use **strong JWT secrets** (32+ characters)
3. Enable **CORS** only for your frontend domain
4. Use **HTTPS** for all production URLs
5. Keep **Supabase keys** secure
6. Regular **security updates**: `npm audit fix`
7. Use **environment variables** for all secrets

---

## Health Checks

### Backend Health Check
Available at: `GET /api/health` or `GET /`

### Frontend Health Check
The served static files at `/` serve as health check

---

## Support Resources

- **Railway Docs**: https://docs.railway.app
- **Railway Discord**: https://discord.gg/railway
- **Railway Status**: https://status.railway.app
- **Supabase Docs**: https://supabase.com/docs

---

## Deployment Checklist

- [ ] Push code to GitHub
- [ ] Create Railway project
- [ ] Deploy backend service
  - [ ] Set root directory: `backend`
  - [ ] Add environment variables
  - [ ] Note backend URL
- [ ] Deploy frontend service
  - [ ] Set root directory: `frontend`
  - [ ] Add environment variables with backend URL
  - [ ] Note frontend URL
- [ ] Update CORS in backend with frontend URL
- [ ] Test the deployed application
- [ ] Configure custom domains (optional)
- [ ] Set up monitoring and alerts

---

**Last Updated**: November 2, 2025  
**Project**: ImmunizeMe System  
**Branch**: system-prototype-v2  
**Note**: Use this guide after PWA conversion
