#!/bin/bash

# AWS Frontend Deployment Script for ATS Frontend (Non-Docker)
# This script helps deploy the Next.js frontend to AWS

set -e

echo "🚀 Starting AWS Frontend deployment process..."

# Configuration
APP_NAME="ats-frontend"
APP_DIR="/opt/$APP_NAME"
SERVICE_USER="nodejs"
NODE_VERSION="18"
PM2_SERVICE_NAME="ats-frontend"

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
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root for security reasons"
   exit 1
fi

print_status "Starting frontend deployment process..."

# Update system packages
print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
print_status "Installing Node.js $NODE_VERSION..."
curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
print_status "Installing PM2 process manager..."
sudo npm install -g pm2

# Create application directory
print_status "Creating application directory..."
sudo mkdir -p $APP_DIR
sudo chown $USER:$USER $APP_DIR

# Create logs directory
print_status "Creating logs directory..."
mkdir -p $APP_DIR/logs

# Copy application files
print_status "Copying application files..."
cp -r . $APP_DIR/
cd $APP_DIR

# Install dependencies
print_status "Installing Node.js dependencies..."
npm install --production

# Create environment file template
print_status "Creating environment file template..."
if [ ! -f "$APP_DIR/.env.local" ]; then
    cat > $APP_DIR/.env.local <<EOF
# Frontend Environment Variables for AWS Deployment

# API Configuration
NEXT_PUBLIC_API_URL=http://147.93.155.233:5000/api
NEXT_PUBLIC_NODE_API_URL=http://147.93.155.233:5000
NEXT_PUBLIC_PYTHON_API_URL=http://147.93.155.233:8000/api/v1
NEXT_PUBLIC_PYTHON_BASE_URL=http://147.93.155.233:8000

# Production API URLs (update these for production)
# NEXT_PUBLIC_API_URL=https://your-backend-domain.com/api
# NEXT_PUBLIC_NODE_API_URL=https://your-backend-domain.com
# NEXT_PUBLIC_PYTHON_API_URL=https://your-python-api-domain.com/api/v1
# NEXT_PUBLIC_PYTHON_BASE_URL=https://your-python-api-domain.com

# Application Configuration
NODE_ENV=production
PORT=3001
EOF
    print_warning "Please update $APP_DIR/.env.local with your actual API URLs"
fi

# Build the application
print_status "Building Next.js application..."
npm run build

# Create PM2 ecosystem file for frontend
print_status "Creating PM2 configuration..."
cat > $APP_DIR/ecosystem.config.js <<EOF
module.exports = {
  apps: [{
    name: '$PM2_SERVICE_NAME',
    script: 'server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development',
      PORT: 3001
    },
    env_production: {
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
    
    // AWS-specific optimizations
    node_args: '--max-old-space-size=1024',
    
    // Process management
    merge_logs: true,
    time: true,
    
    // Error handling
    ignore_watch: ['node_modules', 'logs', '.next'],
    
    // Memory management
    max_memory_restart: '1G',
    
    // Restart policy
    restart_delay: 4000,
    exp_backoff_restart_delay: 100
  }]
};
EOF

# Create systemd service for PM2
print_status "Creating systemd service..."
sudo tee /etc/systemd/system/$PM2_SERVICE_NAME.service > /dev/null <<EOF
[Unit]
Description=ATS Frontend PM2 Service
After=network.target

[Service]
Type=forking
User=$USER
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
sudo systemctl daemon-reload
sudo systemctl enable $PM2_SERVICE_NAME

# Set up log rotation
print_status "Setting up log rotation..."
sudo tee /etc/logrotate.d/$PM2_SERVICE_NAME > /dev/null <<EOF
$APP_DIR/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 $USER $USER
    postrotate
        /usr/bin/pm2 reloadLogs
    endscript
}
EOF

# Configure firewall (if ufw is available)
if command -v ufw >/dev/null 2>&1; then
    print_status "Configuring firewall..."
    sudo ufw allow 3001/tcp
    sudo ufw allow ssh
    print_warning "Firewall configured. Make sure to configure security groups in AWS as well."
fi

# Start the application
print_status "Starting the application..."
pm2 start ecosystem.config.js --env production
pm2 save

# Enable PM2 startup
pm2 startup
print_warning "Run the command shown above to enable PM2 startup on boot"

print_status "Frontend deployment completed successfully!"
print_status "Application is running on port 3001"
print_status "Check status with: pm2 status"
print_status "View logs with: pm2 logs $PM2_SERVICE_NAME"

echo ""
print_status "Next steps:"
echo "1. Update $APP_DIR/.env.local with your actual API URLs"
echo "2. Set up a reverse proxy (nginx) for production"
echo "3. Configure SSL certificates"
echo "4. Set up monitoring and alerts"
echo "5. Configure CDN for static assets"
