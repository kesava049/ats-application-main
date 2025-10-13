#!/bin/bash

# Production Deployment Script for ATS Frontend
echo "🚀 Starting Production Deployment..."

# Set production environment
export NODE_ENV=production

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf .next
rm -rf out

# Install dependencies with production optimizations
echo "📦 Installing dependencies..."
npm ci --only=production --legacy-peer-deps

# Build the application
echo "🔨 Building application..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build completed successfully!"
    
    # Create production start script
    echo "📝 Creating production start script..."
    cat > start-production.sh << 'EOF'
#!/bin/bash
export NODE_ENV=production
export PORT=${PORT:-3000}
echo "🌐 Starting production server on port $PORT"
npm start
EOF
    
    chmod +x start-production.sh
    
    echo "🎉 Production deployment ready!"
    echo "📋 To start the production server:"
    echo "   ./start-production.sh"
    echo ""
    echo "📋 Or manually:"
    echo "   export NODE_ENV=production"
    echo "   npm start"
    
else
    echo "❌ Build failed! Please check the errors above."
    exit 1
fi
