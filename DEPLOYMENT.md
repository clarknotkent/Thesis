# ImmunizeMe - Deployment Guide

Complete guide for deploying ImmunizeMe system to Railway.

---

## 📋 Table of Contents

1. [Port Configuration](#port-configuration)
2. [Quick Start](#quick-start)
3. [Deployment Checklist](#deployment-checklist)
4. [Detailed Deployment](#detailed-deployment)
5. [Environment Variables](#environment-variables)
6. [Monitoring & Troubleshooting](#monitoring--troubleshooting)

---

## Port Configuration

### Local Development Ports

| Service | Mode | Port | URL |
|---------|------|------|-----|
| **Backend API** | All | `3001` | http://localhost:3001 |
| **Frontend** | Development | `5173` | http://localhost:5173 |
| **Frontend** | Production | `5173` | http://localhost:5173 |

### Local Commands

**Development Mode (Hot Reload):**
```powershell
npm run dev
```
- Backend runs on `3001` with nodemon (auto-restart)
- Frontend runs on `5173` with Vite (hot module replacement)
- Frontend proxies `/api` → `http://localhost:3001`

**Production Mode (Built Files):**
```powershell
npm run build    # Build frontend first
npm run start    # Run both services
```
- Backend runs on `3001` with node
- Frontend serves built files on `5173` with serve

**Individual Services:**
```powershell
npm run dev:backend     # Backend only (port 3001)
npm run dev:frontend    # Frontend only (port 5173)
```

### Local Configuration Files

**Backend (.env):**
```properties
PORT=3001
PUBLIC_BASE_URL=http://localhost:5173
FRONTEND_BASE_URL=http://localhost:5173
```

**Frontend Development (.env.development):**
```properties
VITE_API_BASE_URL=/api
```

**Frontend Production (.env.production):**
```properties
VITE_API_BASE_URL=http://localhost:3001/api
```

---

## Quick Start

### Prerequisites

- [ ] Railway account ([Sign up here](https://railway.app))
- [ ] GitHub repository with your code
- [ ] Supabase database credentials
- [ ] All code pushed to `system-prototype-v2` branch

### Deploy in 5 Steps

#### 1️⃣ Push Your Code
```bash
git add .
git commit -m "Prepare for Railway deployment"
git push origin system-prototype-v2
```

#### 2️⃣ Create Railway Project
1. Go to [railway.app](https://railway.app)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose: `clarknotkent/Thesis`
5. Branch: `system-prototype-v2`

#### 3️⃣ Deploy Backend
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

#### 4️⃣ Deploy Frontend
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

#### 5️⃣ Update CORS
Go back to backend service:
- Update `CORS_ORIGIN` with actual frontend URL
- Service will auto-redeploy

**Done!** Visit your frontend URL and test.

---

## Deployment Checklist

### Pre-Deployment

#### 🔍 Code Preparation
- [ ] All code changes committed
- [ ] Build tested locally (`npm run build` in frontend)
- [ ] Backend tested locally (`npm start` in backend)
- [ ] No console errors in production build
- [ ] All environment variables identified

#### 📦 Git Repository
- [ ] Code pushed to GitHub
- [ ] Branch: `system-prototype-v2`
- [ ] Repository: `clarknotkent/Thesis`
- [ ] `.env` files NOT committed (in `.gitignore`)
- [ ] All deployment files present:
  - [ ] `railway.json`
  - [ ] `backend/nixpacks.toml`
  - [ ] `frontend/nixpacks.toml`
  - [ ] `.railwayignore`

#### 🗄️ Database
- [ ] Supabase project active
- [ ] Database schema up to date
- [ ] Required tables created
- [ ] Sample data available (if needed)
- [ ] RLS policies configured
- [ ] Supabase credentials ready:
  - [ ] Project URL
  - [ ] Anon key
  - [ ] Service role key

#### 🔐 Authentication
- [ ] JWT secret generated (32+ characters)
- [ ] Semaphore API key ready (if using SMS)

### During Deployment

#### 1️⃣ Create Railway Project
- [ ] Logged into Railway account
- [ ] Created new project
- [ ] Connected GitHub repository
- [ ] Selected `clarknotkent/Thesis`
- [ ] Selected branch: `system-prototype-v2`

#### 2️⃣ Backend Service Configuration
- [ ] Added backend service
- [ ] Set root directory: `backend`
- [ ] Verified start command: `npm start`
- [ ] Added all environment variables
- [ ] Backend deployed successfully
- [ ] Checked deploy logs for errors
- [ ] Backend URL noted: `______________________`

#### 3️⃣ Frontend Service Configuration
- [ ] Added frontend service
- [ ] Set root directory: `frontend`
- [ ] Verified build command: `npm run build`
- [ ] Verified start command: `npm start`
- [ ] Added environment variables
- [ ] Frontend deployed successfully
- [ ] Checked build logs for errors
- [ ] Frontend URL noted: `______________________`

#### 4️⃣ CORS Configuration
- [ ] Updated backend `CORS_ORIGIN` with frontend URL
- [ ] Backend redeployed automatically
- [ ] No CORS errors in browser console

### Post-Deployment

#### 🧪 Testing
- [ ] Frontend loads successfully
- [ ] Login page accessible
- [ ] Can create an account
- [ ] Can log in successfully
- [ ] Admin features work
- [ ] Health worker features work
- [ ] Parent portal works
- [ ] API calls succeed
- [ ] No console errors
- [ ] No network errors (check DevTools)

#### 🔒 Security Verification
- [ ] HTTPS enabled (automatic on Railway)
- [ ] CORS limited to frontend domain
- [ ] Environment variables not exposed in frontend
- [ ] JWT tokens working correctly
- [ ] Supabase RLS policies active
- [ ] No sensitive data in logs

#### 📊 Monitoring Setup
- [ ] Railway dashboard accessible
- [ ] Build logs reviewed
- [ ] Deploy logs reviewed
- [ ] Metrics visible (CPU, Memory, Network)
- [ ] Health checks responding

---

## Detailed Deployment

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

#### 2.1 Add Backend Service
1. In your Railway project, click **"+ New"**
2. Select **"GitHub Repo"**
3. Choose your repository and branch
4. Railway will detect it as a Node.js project

#### 2.2 Configure Backend
1. Click on the backend service
2. Go to **Settings** tab
3. Set **Root Directory**: `backend`
4. Set **Start Command**: `npm start` (or leave default)
5. Set **Build Command**: Leave empty (package.json has no build script)

#### 2.3 Add Backend Environment Variables
Go to **Variables** tab and add all required variables (see Environment Variables section below).

#### 2.4 Deploy Backend
1. Railway will automatically deploy after adding environment variables
2. Note the deployed URL (e.g., `https://backend-production-xxxx.up.railway.app`)

### Step 3: Deploy Frontend Service

#### 3.1 Add Frontend Service
1. In your Railway project, click **"+ New"**
2. Select **"GitHub Repo"** (same repo)
3. Choose your repository and branch

#### 3.2 Configure Frontend
1. Click on the frontend service
2. Go to **Settings** tab
3. Set **Root Directory**: `frontend`
4. Set **Start Command**: `npm start`
5. Set **Build Command**: `npm run build`

#### 3.3 Add Frontend Environment Variables
Go to **Variables** tab and add required variables (see Environment Variables section below).

#### 3.4 Deploy Frontend
1. Railway will automatically build and deploy
2. Note the deployed URL (e.g., `https://frontend-production-xxxx.up.railway.app`)

### Step 4: Update CORS Settings

1. Go back to **Backend service** → **Variables**
2. Update `CORS_ORIGIN` with your frontend URL
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
After setting domains, update:
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

### Environment File Templates

**Backend (.env.railway.template):**
```env
# Database
SUPABASE_URL=
SUPABASE_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# JWT
JWT_SECRET=

# SMS (optional)
SEMAPHORE_API_KEY=

# Environment
NODE_ENV=production
TZ=Asia/Manila

# CORS (set after frontend deployment)
CORS_ORIGIN=
```

**Frontend (.env.railway.template):**
```env
# API URL (set after backend deployment)
VITE_API_BASE_URL=

# Environment
NODE_ENV=production
```

---

## Monitoring & Troubleshooting

### View Logs

**Build Logs:**
1. Click on service
2. Go to **"Deployments"** tab
3. Click on latest deployment
4. View **"Build Logs"**

**Deploy Logs:**
1. Same location as build logs
2. View **"Deploy Logs"** tab
3. Monitor runtime errors

### View Metrics

1. Click on service
2. Go to **"Metrics"** tab
3. Monitor:
   - CPU usage
   - Memory usage
   - Network traffic

### Common Issues

#### Backend Won't Start

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

#### Frontend Issues

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

#### Local Development Issues

**Problem**: "Port already in use"
```powershell
# Kill all node processes
Get-Process node | Stop-Process -Force

# Or kill specific port
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

**Problem**: VS Code keeps crashing
- Too many node processes running
- Kill all node processes before restarting

**Problem**: API calls fail in production
- Check `frontend/.env.production` has correct backend URL
- Verify backend is running on port 3001
- Check browser console for CORS errors

### Rollback

If deployment fails:

1. Go to **Deployments** tab
2. Find previous successful deployment
3. Click **"..."** menu
4. Select **"Redeploy"**

### Emergency Procedures

#### If Deployment Fails
1. Check Railway status: https://status.railway.app
2. Review recent commits for issues
3. Rollback to previous deployment if needed
4. Check environment variables
5. Contact Railway support if needed

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

## Cost & Security

### Pricing

Railway offers:
- **Free Tier**: $5 worth of usage per month
- **Hobby Plan**: $5/month + usage
- **Pro Plan**: $20/month + usage

Tips to optimize:
1. Use **Sleep Mode** for development environments
2. Set **Auto-scale** to 0 when not in use
3. Monitor usage in Railway dashboard
4. Use Railway PostgreSQL only if needed (Supabase has free tier)

### Security Best Practices

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
Already available at: `GET /api/health` or `GET /`

### Frontend Health Check
The served static files at `/` serve as health check

---

## Support Resources

- **Railway Docs**: https://docs.railway.app
- **Railway Discord**: https://discord.gg/railway
- **Railway Status**: https://status.railway.app
- **Supabase Docs**: https://supabase.com/docs

---

## Success Criteria

Your deployment is successful when:
- ✅ Backend service is running and accessible
- ✅ Frontend service is running and accessible
- ✅ All features work correctly
- ✅ No console errors
- ✅ Authentication works
- ✅ Database queries succeed
- ✅ API calls complete successfully
- ✅ Mobile responsive design works
- ✅ All user roles can access their features
- ✅ HTTPS is enabled
- ✅ Performance is acceptable

---

**Last Updated**: November 2, 2025  
**Project**: ImmunizeMe System  
**Branch**: system-prototype-v2
