#!/bin/bash

# Fix Server Environment Variables for Contabo Deployment
# This script ensures the frontend uses the correct server URLs

echo "🚀 Fixing server environment variables for Contabo deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the frontend directory
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the ats-frontend-main directory"
    exit 1
fi

print_status "Setting up environment variables for server deployment..."

# Create .env.local file
print_status "Creating .env.local file..."
cat > .env.local << 'EOF'
# Frontend Environment Variables for Contabo Server
NODE_ENV=production

# API Configuration - Server URLs
NEXT_PUBLIC_API_URL=http://147.93.155.233:5000/api
NEXT_PUBLIC_NODE_API_URL=http://147.93.155.233:5000
NEXT_PUBLIC_PYTHON_API_URL=http://147.93.155.233:8000/api/v1
NEXT_PUBLIC_PYTHON_BASE_URL=http://147.93.155.233:8000
NEXT_PUBLIC_BASE_API_URL=http://147.93.155.233:5000/api

# Frontend Configuration
PORT=3001
EOF

# Create .env file (backup)
print_status "Creating .env file (backup)..."
cat > .env << 'EOF'
# Frontend Environment Variables for Contabo Server
NODE_ENV=production

# API Configuration - Server URLs
NEXT_PUBLIC_API_URL=http://147.93.155.233:5000/api
NEXT_PUBLIC_NODE_API_URL=http://147.93.155.233:5000
NEXT_PUBLIC_PYTHON_API_URL=http://147.93.155.233:8000/api/v1
NEXT_PUBLIC_PYTHON_BASE_URL=http://147.93.155.233:8000
NEXT_PUBLIC_BASE_API_URL=http://147.93.155.233:5000/api

# Frontend Configuration
PORT=3001
EOF

# Update next.config.js to ensure environment variables are set
print_status "Updating next.config.js..."
cat > next.config.js << 'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
    // Environment variables
    env: {
        NEXT_PUBLIC_API_URL: 'http://147.93.155.233:5000/api',
        NEXT_PUBLIC_NODE_API_URL: 'http://147.93.155.233:5000',
        NEXT_PUBLIC_PYTHON_API_URL: 'http://147.93.155.233:8000/api/v1',
        NEXT_PUBLIC_PYTHON_BASE_URL: 'http://147.93.155.233:8000',
        NEXT_PUBLIC_BASE_API_URL: 'http://147.93.155.233:5000/api',
        PORT: '3001'
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    },
    images: {
        unoptimized: true,
    },
    devIndicators: {
        position: 'bottom-right',
    },
    experimental: {
        // Reduce hydration warnings in development
        optimizePackageImports: ['@radix-ui/react-toast'],
    },
    // Suppress hydration warnings for specific patterns
    onDemandEntries: {
        // period (in ms) where the server will keep pages in the buffer
        maxInactiveAge: 25 * 1000,
        // number of pages that should be kept simultaneously without being disposed
        pagesBufferLength: 2,
    },
    // Production-specific configurations
    compiler: {
        // Remove console logs in production
        removeConsole: process.env.NODE_ENV === 'production',
    },
    // Ensure consistent rendering between server and client
    reactStrictMode: true,
    // Disable x-powered-by header
    poweredByHeader: false,
    // Proxy API calls to backend server
    async rewrites() {
        return [{
            source: '/api/:path*',
            destination: 'http://147.93.155.233:5000/api/:path*',
        }, ];
    },
}

module.exports = nextConfig
EOF

print_success "Environment files created successfully!"

# Check if PM2 is running
if command -v pm2 >/dev/null 2>&1; then
    print_status "PM2 detected. Checking running processes..."
    pm2 list
    
    print_status "Restarting frontend application..."
    pm2 restart all --update-env
    
    print_success "Frontend application restarted with new environment variables!"
else
    print_warning "PM2 not found. Please restart your frontend application manually."
fi

# Build the application with new environment variables
print_status "Building application with new environment variables..."
npm run build

print_success "✅ Server environment variables fixed successfully!"
print_status "📁 Files created/updated:"
print_status "   - .env.local (Next.js environment variables)"
print_status "   - .env (backup environment file)"
print_status "   - next.config.js (updated with environment variables)"
print_status ""
print_status "🔧 Environment variables set:"
print_status "   - NEXT_PUBLIC_API_URL=http://147.93.155.233:5000/api"
print_status "   - NEXT_PUBLIC_NODE_API_URL=http://147.93.155.233:5000"
print_status "   - NEXT_PUBLIC_PYTHON_API_URL=http://147.93.155.233:8000/api/v1"
print_status "   - NEXT_PUBLIC_PYTHON_BASE_URL=http://147.93.155.233:8000"
print_status "   - PORT=3001"
print_status ""
print_status "🌐 Your application should now be accessible at:"
print_status "   - Frontend: http://147.93.155.233:3001"
print_status "   - Node.js API: http://147.93.155.233:5000"
print_status "   - Python API: http://147.93.155.233:8000"
print_status ""
print_success "🎉 No more localhost connection errors!"
