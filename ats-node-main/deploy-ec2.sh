#!/bin/bash

# AWS EC2 Deployment Script for ATS Backend (Non-Docker)
# This script helps deploy the Node.js backend directly to AWS EC2

set -e

echo "🚀 Starting AWS EC2 deployment process..."

# Configuration
APP_NAME="ats-backend"
APP_DIR="/opt/$APP_NAME"
SERVICE_USER="nodejs"
NODE_VERSION="18"
PM2_SERVICE_NAME="ats-backend"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
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

print_status "Starting deployment process..."

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

# Install PostgreSQL client (for database operations)
print_status "Installing PostgreSQL client..."
sudo apt-get install -y postgresql-client

# Create application directory
print_status "Creating application directory..."
sudo mkdir -p $APP_DIR
sudo chown $USER:$USER $APP_DIR

# Create logs directory
print_status "Creating logs directory..."
mkdir -p $APP_DIR/logs

# Create uploads directories
print_status "Creating upload directories..."
mkdir -p $APP_DIR/uploads/candidate_user
mkdir -p $APP_DIR/uploads/company
mkdir -p $APP_DIR/uploads/timesheet

# Copy application files
print_status "Copying application files..."
cp -r . $APP_DIR/
cd $APP_DIR

# Install dependencies
print_status "Installing Node.js dependencies..."
npm install --production

# Generate Prisma client
print_status "Generating Prisma client..."
npx prisma generate

# Create systemd service for PM2
print_status "Creating systemd service..."
sudo tee /etc/systemd/system/$PM2_SERVICE_NAME.service > /dev/null <<EOF
[Unit]
Description=ATS Backend PM2 Service
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

# Create environment file template
print_status "Creating environment file template..."
if [ ! -f "$APP_DIR/.env" ]; then
    cat > $APP_DIR/.env <<EOF
# Database Configuration
DATABASE_URL="postgresql://username:password@your-rds-endpoint:5432/ats_database"

# Server Configuration
PORT=5000
NODE_ENV=production

# Email Configuration
MAIL_HOST="smtp.gmail.com"
MAIL_PORT=587
MAIL_USERNAME="your-email@gmail.com"
MAIL_PASSWORD="your-app-password"
MAIL_FROM_NAME="ATS System"
MAIL_FROM_ADDRESS="your-email@gmail.com"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-here"

# OpenAI Configuration (if using AI features)
OPENAI_API_KEY="your-openai-api-key-here"

# Optional: Auto-backfill configuration
ENABLE_AUTO_BACKFILL=false
EOF
    print_warning "Please update $APP_DIR/.env with your actual configuration values"
fi

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
    sudo ufw allow 5000/tcp
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

print_status "Deployment completed successfully!"
print_status "Application is running on port 5000"
print_status "Check status with: pm2 status"
print_status "View logs with: pm2 logs $PM2_SERVICE_NAME"
print_status "Restart with: pm2 restart $PM2_SERVICE_NAME"

echo ""
print_status "Next steps:"
echo "1. Update $APP_DIR/.env with your actual configuration"
echo "2. Configure your database connection"
echo "3. Set up a reverse proxy (nginx) if needed"
echo "4. Configure SSL certificates"
echo "5. Set up monitoring and alerts"
