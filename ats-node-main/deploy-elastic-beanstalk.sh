#!/bin/bash

# AWS Elastic Beanstalk Deployment Script for ATS Backend (Non-Docker)
# This script helps deploy the Node.js backend to AWS Elastic Beanstalk

set -e

echo "🚀 Starting AWS Elastic Beanstalk deployment process..."

# Configuration
APP_NAME="ats-backend"
ENVIRONMENT_NAME="ats-backend-prod"
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

print_status "Starting Elastic Beanstalk deployment..."

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
    PORT: 5000
  aws:elasticbeanstalk:environment:proxy:staticfiles:
    /uploads: uploads
    /public: public
  aws:autoscaling:launchconfiguration:
    IamInstanceProfile: aws-elasticbeanstalk-ec2-role
  aws:elasticbeanstalk:environment:process:default:
    HealthCheckPath: /health
    Port: 5000
    Protocol: HTTP
EOF

# Create environment variables configuration
print_status "Creating environment variables configuration..."
cat > .ebextensions/02-environment.config <<EOF
option_settings:
  aws:elasticbeanstalk:application:environment:
    DATABASE_URL: "postgresql://username:password@your-rds-endpoint:5432/ats_database"
    MAIL_HOST: "smtp.gmail.com"
    MAIL_PORT: "587"
    MAIL_USERNAME: "your-email@gmail.com"
    MAIL_PASSWORD: "your-app-password"
    MAIL_FROM_NAME: "ATS System"
    MAIL_FROM_ADDRESS: "your-email@gmail.com"
    JWT_SECRET: "your-super-secret-jwt-key-here"
    OPENAI_API_KEY: "your-openai-api-key-here"
    ENABLE_AUTO_BACKFILL: "false"
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
      GroupDescription: Security group for ATS Backend
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
          FromPort: 5000
          ToPort: 5000
          CidrIp: 0.0.0.0/0
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

print_status "Deployment completed successfully!"
print_status "Application is running at: http://$ENVIRONMENT_URL"
print_status "Health check endpoint: http://$ENVIRONMENT_URL/health"

echo ""
print_status "Next steps:"
echo "1. Update environment variables in AWS EB console"
echo "2. Configure your RDS database connection"
echo "3. Set up custom domain and SSL certificate"
echo "4. Configure monitoring and alerts"
echo "5. Set up auto-scaling if needed"

print_warning "Important: Update the environment variables in the EB console with your actual values!"
