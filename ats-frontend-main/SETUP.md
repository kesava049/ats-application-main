# 🚀 ATS Frontend Setup Guide

## Problem Solved: localhost Connection Refused

The error `POST http://localhost:5000/api/auth/send-otp net::ERR_CONNECTION_REFUSED` occurs because your frontend is trying to connect to `localhost:5000` instead of your server's public IP address.

## ✅ Solution: Environment Variables

Your frontend needs to know the correct server URLs. Here are **3 ways** to fix this:

### Method 1: Quick Setup Scripts (Recommended)

**On macOS/Linux:**
```bash
./setup-env.sh
```

**On Windows:**
```cmd
setup-env.bat
```

### Method 2: Manual Environment File Creation

Create `.env.local` in the frontend root directory:

```env
# Frontend Environment Variables for Production
NODE_ENV=production

# API Configuration - Server URLs
NEXT_PUBLIC_API_URL=http://147.93.155.233:5000/api
NEXT_PUBLIC_NODE_API_URL=http://147.93.155.233:5000
NEXT_PUBLIC_PYTHON_API_URL=http://147.93.155.233:8000/api/v1
NEXT_PUBLIC_PYTHON_BASE_URL=http://147.93.155.233:8000
NEXT_PUBLIC_BASE_API_URL=http://147.93.155.233:5000/api

# Frontend Configuration
PORT=3001
```

### Method 3: Inline Environment Variables

Run the frontend with environment variables directly:

```bash
npm run dev:server
```

## 🔧 What This Fixes

- ✅ Frontend will connect to `http://147.93.155.233:5000` instead of `localhost:5000`
- ✅ All API calls will use the correct server URLs
- ✅ Login, OTP, and all other features will work properly
- ✅ Frontend will run on port 3001 as configured

## 🚀 After Setup

1. **Start the frontend:**
   ```bash
   npm run dev
   ```

2. **Access your application:**
   - Frontend: `http://147.93.155.233:3001`
   - Node.js API: `http://147.93.155.233:5000`
   - Python API: `http://147.93.155.233:8000`

## 🔍 Verification

After setup, check that:
- No more `localhost:5000` errors in browser console
- Login form submits to correct server
- All API calls use `147.93.155.233` URLs
- Frontend loads without connection errors

## 📁 Files Created/Modified

- `.env.local` - Environment variables for Next.js
- `next.config.js` - Updated with environment variables
- `setup-env.sh` - macOS/Linux setup script
- `setup-env.bat` - Windows setup script
- `package.json` - Added setup scripts

## 🆘 Troubleshooting

If you still see localhost errors:
1. Clear browser cache
2. Restart the development server
3. Check that `.env.local` exists and has correct URLs
4. Verify the environment variables are loaded in browser dev tools

---

**The root cause was missing environment variables causing fallback to localhost URLs. This setup ensures your frontend always uses the correct server addresses.**
