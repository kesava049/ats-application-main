#!/bin/bash

# Setup script to create environment files for the ATS Frontend
echo "🚀 Setting up environment variables for ATS Frontend..."

# Create .env.local file
cat > .env.local << 'EOF'
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
EOF

# Create .env file (backup)
cat > .env << 'EOF'
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
EOF

echo "✅ Environment files created successfully!"
echo "📁 Files created:"
echo "   - .env.local (Next.js local environment)"
echo "   - .env (backup environment file)"
echo ""
echo "🔧 Environment variables set:"
echo "   - NEXT_PUBLIC_API_URL=http://147.93.155.233:5000/api"
echo "   - NEXT_PUBLIC_NODE_API_URL=http://147.93.155.233:5000"
echo "   - NEXT_PUBLIC_PYTHON_API_URL=http://147.93.155.233:8000/api/v1"
echo "   - NEXT_PUBLIC_PYTHON_BASE_URL=http://147.93.155.233:8000"
echo "   - PORT=3001"
echo ""
echo "🚀 You can now run: npm run dev"
