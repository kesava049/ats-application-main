#!/bin/bash

# AWS Elastic Beanstalk Frontend Deployment Script for ATS Frontend (Non-Docker)
# This script helps deploy the Next.js frontend to AWS Elastic Beanstalk

set -e

echo "🚀 Starting AWS Elastic Beanstalk Frontend deployment process..."

# Configuration
APP_NAME="ats-frontend"
ENVIRONMENT_NAME="ats-frontend-prod"
REGION="us-east-1"
NODE_VERSION="18"

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

# Check if EB CLI is installed
if ! command -v eb &> /dev/null; then
    print_error "AWS Elastic Beanstalk CLI is not installed."
    print_status "Installing EB CLI..."
    pip install awsebcli
fi

# Check if AWS CLI is configured
if ! aws sts get-caller-identity &> /dev/null; then
    print_error "AWS CLI is not configured. Please run 'aws configure' first."
    exit 1
fi

print_status "Starting Elastic Beanstalk frontend deployment..."

# Create .ebextensions directory if it doesn't exist
mkdir -p .ebextensions

# Create Node.js platform configuration
print_status "Creating Elastic Beanstalk configuration..."
cat > .ebextensions/01-nodejs.config <<EOF
option_settings:
  aws:elasticbeanstalk:container:nodejs:
    NodeCommand: "npm start"
    NodeVersion: $NODE_VERSION
  aws:elasticbeanstalk:application:environment:
    NODE_ENV: production
    PORT: 3001
  aws:elasticbeanstalk:environment:proxy:staticfiles:
    /_next/static: .next/static
    /public: public
  aws:autoscaling:launchconfiguration:
    IamInstanceProfile: aws-elasticbeanstalk-ec2-role
  aws:elasticbeanstalk:environment:process:default:
    HealthCheckPath: /
    Port: 3001
    Protocol: HTTP
EOF

# Create environment variables configuration
print_status "Creating environment variables configuration..."
cat > .ebextensions/02-environment.config <<EOF
option_settings:
  aws:elasticbeanstalk:application:environment:
    # API Configuration - Update these with your actual URLs
    NEXT_PUBLIC_API_URL: "http://147.93.155.233:5000/api"
    NEXT_PUBLIC_NODE_API_URL: "http://147.93.155.233:5000"
    NEXT_PUBLIC_PYTHON_API_URL: "http://147.93.155.233:8000/api/v1"
    NEXT_PUBLIC_PYTHON_BASE_URL: "http://147.93.155.233:8000"
    
    # Production API URLs (uncomment and update for production)
    # NEXT_PUBLIC_API_URL: "https://your-backend-domain.com/api"
    # NEXT_PUBLIC_NODE_API_URL: "https://your-backend-domain.com"
    # NEXT_PUBLIC_PYTHON_API_URL: "https://your-python-api-domain.com/api/v1"
    # NEXT_PUBLIC_PYTHON_BASE_URL: "https://your-python-api-domain.com"
EOF

# Create logging configuration
print_status "Creating logging configuration..."
cat > .ebextensions/03-logging.config <<EOF
option_settings:
  aws:elasticbeanstalk:cloudwatch:logs:
    StreamLogs: true
    DeleteOnTerminate: false
    RetentionInDays: 7
  aws:elasticbeanstalk:cloudwatch:logs:health:
    HealthStreamingEnabled: true
    DeleteOnTerminate: false
    RetentionInDays: 7
EOF

# Create security group configuration
print_status "Creating security group configuration..."
cat > .ebextensions/04-security.config <<EOF
Resources:
  AWSEBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for ATS Frontend
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
        - IpProtocol: tcp
          FromPort: 3001
          ToPort: 3001
          CidrIp: 0.0.0.0/0
EOF

# Update next.config.js for production
print_status "Updating Next.js configuration for production..."
cat > next.config.js <<EOF
/** @type {import('next').NextConfig} */
const nextConfig = {
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
    // Output configuration for static export (if needed)
    output: 'standalone',
    // Disable API rewrites in production (use environment variables instead)
    async rewrites() {
        // Only use rewrites in development
        if (process.env.NODE_ENV === 'development') {
            return [{
                source: '/api/:path*',
                destination: 'http://147.93.155.233:5000/api/:path*',
            }];
        }
        return [];
    },
}

module.exports = nextConfig
EOF

# Create package.json for EB (if not exists)
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root."
    exit 1
fi

# Initialize EB application (if not already initialized)
if [ ! -f ".elasticbeanstalk/config.yml" ]; then
    print_status "Initializing Elastic Beanstalk application..."
    eb init $APP_NAME --region $REGION --platform "Node.js $NODE_VERSION"
fi

# Create environment (if not exists)
print_status "Creating Elastic Beanstalk environment..."
if ! eb list | grep -q $ENVIRONMENT_NAME; then
    eb create $ENVIRONMENT_NAME --instance-type t3.micro --single-instance
    print_warning "Environment created. Please wait for it to be ready..."
    eb health --wait
else
    print_status "Environment already exists. Updating..."
fi

# Deploy application
print_status "Deploying application..."
eb deploy

# Get environment URL
print_status "Getting environment URL..."
ENVIRONMENT_URL=$(eb status | grep "CNAME" | awk '{print $2}')
print_status "Application deployed successfully!"
print_status "Environment URL: http://$ENVIRONMENT_URL"

# Show health status
print_status "Checking application health..."
eb health

print_status "Frontend deployment completed successfully!"
print_status "Application is running at: http://$ENVIRONMENT_URL"

echo ""
print_status "Next steps:"
echo "1. Update environment variables in AWS EB console with your actual API URLs"
echo "2. Set up custom domain and SSL certificate"
echo "3. Configure CDN for static assets"
echo "4. Set up monitoring and alerts"
echo "5. Configure auto-scaling if needed"

print_warning "Important: Update the environment variables in the EB console with your actual API URLs!"
