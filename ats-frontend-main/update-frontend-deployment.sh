#!/bin/bash

# Update Frontend Deployment Script for ATS Frontend
# This script updates an existing frontend deployment with new code

set -e

# Configuration
APP_DIR="/opt/ats-frontend"
SERVICE_NAME="ats-frontend"
BACKUP_DIR="/opt/backups/ats-frontend"

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

# Check if running as correct user
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root"
   exit 1
fi

print_status "Starting frontend deployment update process..."

# Create backup directory
print_status "Creating backup directory..."
mkdir -p $BACKUP_DIR

# Create timestamp for backup
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_PATH="$BACKUP_DIR/backup_$TIMESTAMP"

# Backup current deployment
print_status "Creating backup of current deployment..."
cp -r $APP_DIR $BACKUP_PATH
print_status "Backup created at: $BACKUP_PATH"

# Stop the application
print_status "Stopping application..."
pm2 stop $SERVICE_NAME || print_warning "Application was not running"

# Update application code
print_status "Updating application code..."
cd $APP_DIR

# If using git
if [ -d ".git" ]; then
    print_status "Pulling latest changes from git..."
    git pull origin main
else
    print_warning "Not a git repository. Please update files manually."
    print_status "Copying new files..."
    # Add your file copy logic here
fi

# Install/update dependencies
print_status "Installing/updating dependencies..."
npm install --production

# Build the application
print_status "Building Next.js application..."
npm run build

# Start the application
print_status "Starting application..."
pm2 start ecosystem.config.js --env production

# Wait for application to start
print_status "Waiting for application to start..."
sleep 15

# Check application health
print_status "Checking application health..."
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    print_status "✅ Application is healthy and running!"
else
    print_error "❌ Application health check failed!"
    print_status "Rolling back to previous version..."
    
    # Rollback
    print_status "Stopping current application..."
    pm2 stop $SERVICE_NAME
    
    print_status "Restoring from backup..."
    rm -rf $APP_DIR
    mv $BACKUP_PATH $APP_DIR
    
    print_status "Starting previous version..."
    cd $APP_DIR
    pm2 start ecosystem.config.js --env production
    
    print_error "Rollback completed. Please check the logs and fix issues before retrying."
    exit 1
fi

# Clean up old backups (keep last 5)
print_status "Cleaning up old backups..."
cd $BACKUP_DIR
ls -t | tail -n +6 | xargs -r rm -rf

print_status "🎉 Frontend deployment update completed successfully!"
print_status "Application is running on port 3000"
print_status "Check status with: pm2 status"
print_status "View logs with: pm2 logs $SERVICE_NAME"

# Show recent logs
print_status "Recent application logs:"
pm2 logs $SERVICE_NAME --lines 20
