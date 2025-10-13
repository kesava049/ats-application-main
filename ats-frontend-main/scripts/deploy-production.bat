@echo off
REM Production Deployment Script for ATS Frontend (Windows)
echo 🚀 Starting Production Deployment...

REM Set production environment
set NODE_ENV=production

REM Clean previous builds
echo 🧹 Cleaning previous builds...
if exist .next rmdir /s /q .next
if exist out rmdir /s /q out

REM Install dependencies with production optimizations
echo 📦 Installing dependencies...
npm ci --only=production --legacy-peer-deps

REM Build the application
echo 🔨 Building application...
npm run build

REM Check if build was successful
if %errorlevel% equ 0 (
    echo ✅ Build completed successfully!
    
    REM Create production start script
    echo 📝 Creating production start script...
    (
        echo @echo off
        echo set NODE_ENV=production
        echo set PORT=%PORT%
        echo if "%PORT%"=="" set PORT=3000
        echo echo 🌐 Starting production server on port %PORT%
        echo npm start
    ) > start-production.bat
    
    echo 🎉 Production deployment ready!
    echo 📋 To start the production server:
    echo    start-production.bat
    echo.
    echo 📋 Or manually:
    echo    set NODE_ENV=production
    echo    npm start
    
) else (
    echo ❌ Build failed! Please check the errors above.
    exit /b 1
)
