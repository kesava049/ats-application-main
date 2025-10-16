#!/bin/bash

# Contabo VPS Frontend Deployment Script for ATS Frontend
# This script deploys the Next.js frontend to your Contabo server

set -e

echo "🚀 Starting Contabo VPS Frontend deployment process..."

# Configuration
APP_NAME="ats-frontend"
APP_DIR="/opt/$APP_NAME"
SERVICE_USER="root"
NODE_VERSION="18"
PM2_SERVICE_NAME="ats-frontend"
SERVER_IP="147.93.155.233"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   print_error "This script should be run as root on Contabo server"
   exit 1
fi

print_status "Starting frontend deployment process on Contabo VPS..."

# Update system packages
print_status "Updating system packages..."
apt update && apt upgrade -y

# Install Node.js 18
print_status "Installing Node.js $NODE_VERSION..."
curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
apt-get install -y nodejs

# Install PM2 globally
print_status "Installing PM2 process manager..."
npm install -g pm2

# Install nginx (for reverse proxy)
print_status "Installing nginx..."
apt install -y nginx

# Create application directory
print_status "Creating application directory..."
mkdir -p $APP_DIR
cd $APP_DIR

# Create logs directory
print_status "Creating logs directory..."
mkdir -p $APP_DIR/logs

# Copy application files (assuming you're running this from the project directory)
print_status "Copying application files..."
if [ -f "../package.json" ]; then
    cp -r ../* $APP_DIR/
else
    print_error "Please run this script from the ats-frontend-main directory"
    exit 1
fi

# Install dependencies
print_status "Installing Node.js dependencies..."
npm install --legacy-peer-deps

# Create environment file
print_status "Creating environment file..."
cat > $APP_DIR/.env.local <<EOF
# Frontend Environment Variables for Contabo Deployment

# API Configuration
NEXT_PUBLIC_NODE_API_URL=http://147.93.155.233:5000
NEXT_PUBLIC_PYTHON_API_URL=http://147.93.155.233:8000
NEXT_PUBLIC_FRONTEND_URL=http://147.93.155.233:3001

# Application Configuration
NODE_ENV=production
PORT=3001
EOF

# Build the application
print_status "Building Next.js application..."
npm run build

# Create PM2 ecosystem file
print_status "Creating PM2 configuration..."
cat > $APP_DIR/ecosystem.config.js <<EOF
module.exports = {
  apps: [{
    name: '$PM2_SERVICE_NAME',
    script: 'npm',
    args: 'start',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    // Logging
    log_file: './logs/combined.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    
    // Auto restart configuration
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    
    // Health monitoring
    min_uptime: '10s',
    max_restarts: 10,
    
    // Graceful shutdown
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 10000,
    
    // Environment variables
    env_file: '.env.local',
    
    // Process management
    merge_logs: true,
    time: true,
    
    // Error handling
    ignore_watch: ['node_modules', 'logs', '.next'],
    
    // Restart policy
    restart_delay: 4000,
    exp_backoff_restart_delay: 100
  }]
};
EOF

# Create systemd service for PM2
print_status "Creating systemd service..."
cat > /etc/systemd/system/$PM2_SERVICE_NAME.service <<EOF
[Unit]
Description=ATS Frontend PM2 Service
After=network.target

[Service]
Type=forking
User=root
WorkingDirectory=$APP_DIR
ExecStart=/usr/bin/pm2 start ecosystem.config.js --env production
ExecReload=/usr/bin/pm2 reload ecosystem.config.js --env production
ExecStop=/usr/bin/pm2 stop ecosystem.config.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd and enable service
print_status "Enabling and starting service..."
systemctl daemon-reload
systemctl enable $PM2_SERVICE_NAME

# Configure nginx reverse proxy
print_status "Configuring nginx reverse proxy..."
cat > /etc/nginx/sites-available/$APP_NAME <<EOF
server {
    listen 80;
    server_name $SERVER_IP;

    # Frontend application
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
    }

    # Handle Next.js static files
    location /_next/static/ {
        proxy_pass http://localhost:3001;
        proxy_cache_valid 200 1y;
        add_header Cache-Control "public, immutable";
    }

    # Handle public files
    location /public/ {
        proxy_pass http://localhost:3001;
        proxy_cache_valid 200 1y;
        add_header Cache-Control "public";
    }
}
EOF

# Enable the site
ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test nginx configuration
print_status "Testing nginx configuration..."
nginx -t

# Restart nginx
print_status "Restarting nginx..."
systemctl restart nginx
systemctl enable nginx

# Configure firewall
print_status "Configuring firewall..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 3001/tcp
ufw --force enable

# Set up log rotation
print_status "Setting up log rotation..."
cat > /etc/logrotate.d/$PM2_SERVICE_NAME <<EOF
$APP_DIR/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 root root
    postrotate
        /usr/bin/pm2 reloadLogs
    endscript
}
EOF

# Start the application
print_status "Starting the application..."
cd $APP_DIR
pm2 start ecosystem.config.js --env production
pm2 save

# Enable PM2 startup
pm2 startup systemd -u root --hp /root

print_status "Frontend deployment completed successfully!"
print_status "Application is running on: http://$SERVER_IP"
print_status "Check status with: pm2 status"
print_status "View logs with: pm2 logs $PM2_SERVICE_NAME"

echo ""
print_status "Deployment Summary:"
echo "✅ Node.js $NODE_VERSION installed"
echo "✅ PM2 process manager configured"
echo "✅ Nginx reverse proxy configured"
echo "✅ Firewall configured"
echo "✅ Log rotation set up"
echo "✅ Application running on port 3001"
echo "✅ Accessible at: http://$SERVER_IP"

echo ""
print_status "Next steps:"
echo "1. Test the application at: http://$SERVER_IP"
echo "2. Set up SSL certificate with Let's Encrypt (optional)"
echo "3. Configure domain name (if you have one)"
echo "4. Set up monitoring and alerts"
echo "5. Configure backup strategy"

print_warning "Your frontend is now accessible at: http://$SERVER_IP"
