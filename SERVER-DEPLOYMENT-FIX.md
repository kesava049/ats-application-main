# 🚀 Contabo Server Deployment Fix

## Problem: localhost Connection Refused on Server

Your ATS application is deployed on Contabo server but the frontend is still trying to connect to `localhost:5000` instead of the server's public IP addresses.

## ✅ Solution: Fix Server Environment Variables

### Step 1: Connect to Your Contabo Server

```bash
ssh root@147.93.155.233
# or
ssh your-username@147.93.155.233
```

### Step 2: Navigate to Frontend Directory

```bash
cd /path/to/ats-frontend-main
# or wherever your frontend is deployed
```

### Step 3: Run the Fix Script

```bash
./fix-server-env.sh
```

This script will:
- ✅ Create `.env.local` with correct server URLs
- ✅ Update `next.config.js` with environment variables
- ✅ Restart PM2 processes (if available)
- ✅ Rebuild the application
- ✅ Fix all localhost connection errors

### Step 4: Alternative Manual Fix

If the script doesn't work, manually create the environment file:

```bash
# Create .env.local
cat > .env.local << 'EOF'
NODE_ENV=production
NEXT_PUBLIC_API_URL=http://147.93.155.233:5000/api
NEXT_PUBLIC_NODE_API_URL=http://147.93.155.233:5000
NEXT_PUBLIC_PYTHON_API_URL=http://147.93.155.233:8000/api/v1
NEXT_PUBLIC_PYTHON_BASE_URL=http://147.93.155.233:8000
NEXT_PUBLIC_BASE_API_URL=http://147.93.155.233:5000/api
PORT=3001
EOF

# Restart the application
pm2 restart all --update-env
# or
npm run build && npm start
```

## 🔧 What This Fixes

- ✅ **No more localhost errors** - Frontend uses server IP addresses
- ✅ **All API calls work** - Login, OTP, and all features connect properly
- ✅ **Correct server URLs** - All services use `147.93.155.233`
- ✅ **Environment variables set** - No fallback to hardcoded localhost

## 🌐 Server Architecture

After the fix, your server will have:

```
Contabo Server (147.93.155.233)
├── Frontend (Port 3001) → http://147.93.155.233:3001
├── Node.js API (Port 5000) → http://147.93.155.233:5000
├── Python API (Port 8000) → http://147.93.155.233:8000
├── PostgreSQL (Port 5432) → 147.93.155.233:5432
└── Redis (Port 6379) → 147.93.155.233:6379
```

## 🚀 Verification Steps

1. **Check frontend loads**: `http://147.93.155.233:3001`
2. **Check browser console**: No localhost errors
3. **Test login**: Should work without connection errors
4. **Check API calls**: All should use server IP addresses

## 🆘 Troubleshooting

### If you still see localhost errors:

1. **Clear browser cache** and hard refresh
2. **Check environment variables** are loaded:
   ```bash
   # On server
   cat .env.local
   ```
3. **Restart all services**:
   ```bash
   pm2 restart all
   # or
   systemctl restart your-services
   ```
4. **Check PM2 logs**:
   ```bash
   pm2 logs
   ```

### If the script doesn't work:

1. **Check file permissions**:
   ```bash
   chmod +x fix-server-env.sh
   ```
2. **Run manually**:
   ```bash
   bash fix-server-env.sh
   ```
3. **Check directory**:
   ```bash
   ls -la
   # Make sure you're in the frontend directory
   ```

## 📋 Quick Commands

```bash
# Connect to server
ssh root@147.93.155.233

# Navigate to frontend
cd /path/to/ats-frontend-main

# Run fix script
./fix-server-env.sh

# Check status
pm2 status

# View logs
pm2 logs

# Restart if needed
pm2 restart all --update-env
```

## ✅ Expected Result

After running the fix:
- ✅ Frontend loads at `http://147.93.155.233:3001`
- ✅ No localhost connection errors in browser console
- ✅ Login and all features work properly
- ✅ All API calls use server IP addresses
- ✅ Application is fully functional on Contabo server

---

**The root cause was missing environment variables on the server, causing fallback to localhost URLs. This fix ensures your deployed application uses the correct server addresses.**
