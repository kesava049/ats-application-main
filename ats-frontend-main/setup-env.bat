@echo off
REM Setup script to create environment files for the ATS Frontend
echo 🚀 Setting up environment variables for ATS Frontend...

REM Create .env.local file
(
echo # Frontend Environment Variables for Production
echo NODE_ENV=production
echo.
echo # API Configuration - Server URLs
echo NEXT_PUBLIC_API_URL=http://147.93.155.233:5000/api
echo NEXT_PUBLIC_NODE_API_URL=http://147.93.155.233:5000
echo NEXT_PUBLIC_PYTHON_API_URL=http://147.93.155.233:8000/api/v1
echo NEXT_PUBLIC_PYTHON_BASE_URL=http://147.93.155.233:8000
echo NEXT_PUBLIC_BASE_API_URL=http://147.93.155.233:5000/api
echo.
echo # Frontend Configuration
echo PORT=3001
) > .env.local

REM Create .env file (backup)
(
echo # Frontend Environment Variables for Production
echo NODE_ENV=production
echo.
echo # API Configuration - Server URLs
echo NEXT_PUBLIC_API_URL=http://147.93.155.233:5000/api
echo NEXT_PUBLIC_NODE_API_URL=http://147.93.155.233:5000
echo NEXT_PUBLIC_PYTHON_API_URL=http://147.93.155.233:8000/api/v1
echo NEXT_PUBLIC_PYTHON_BASE_URL=http://147.93.155.233:8000
echo NEXT_PUBLIC_BASE_API_URL=http://147.93.155.233:5000/api
echo.
echo # Frontend Configuration
echo PORT=3001
) > .env

echo ✅ Environment files created successfully!
echo 📁 Files created:
echo    - .env.local (Next.js local environment)
echo    - .env (backup environment file)
echo.
echo 🔧 Environment variables set:
echo    - NEXT_PUBLIC_API_URL=http://147.93.155.233:5000/api
echo    - NEXT_PUBLIC_NODE_API_URL=http://147.93.155.233:5000
echo    - NEXT_PUBLIC_PYTHON_API_URL=http://147.93.155.233:8000/api/v1
echo    - NEXT_PUBLIC_PYTHON_BASE_URL=http://147.93.155.233:8000
echo    - PORT=3001
echo.
echo 🚀 You can now run: npm run dev
pause
