#!/bin/bash
# Quick fix for Contabo server - One command solution

echo "🚀 Quick fix for Contabo server deployment..."

# Create environment file
cat > .env.local << 'EOF'
NODE_ENV=production
NEXT_PUBLIC_API_URL=http://147.93.155.233:5000/api
NEXT_PUBLIC_NODE_API_URL=http://147.93.155.233:5000
NEXT_PUBLIC_PYTHON_API_URL=http://147.93.155.233:8000/api/v1
NEXT_PUBLIC_PYTHON_BASE_URL=http://147.93.155.233:8000
NEXT_PUBLIC_BASE_API_URL=http://147.93.155.233:5000/api
PORT=3001
EOF

# Restart PM2 if available
if command -v pm2 >/dev/null 2>&1; then
    echo "🔄 Restarting PM2 processes..."
    pm2 restart all --update-env
    echo "✅ PM2 restarted successfully!"
else
    echo "⚠️  PM2 not found. Please restart your application manually."
fi

echo "✅ Quick fix completed!"
echo "🌐 Your application should now work at: http://147.93.155.233:3001"
