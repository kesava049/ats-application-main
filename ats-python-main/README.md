# ATS Resume Parser - Cloud Deployment with Docker

This document provides a complete guide for deploying the ATS Resume Parser application in the cloud using Docker, with full support for `.doc` file processing via `antiword`.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Docker Configuration](#docker-configuration)
4. [Environment Setup](#environment-setup)
5. [Deployment Options](#deployment-options)
6. [Production Considerations](#production-considerations)
7. [Troubleshooting](#troubleshooting)
8. [Monitoring & Maintenance](#monitoring--maintenance)

## Overview

The ATS Resume Parser supports multiple file formats including `.pdf`, `.docx`, `.doc`, `.txt`, `.rtf`, and image files. For optimal `.doc` file processing, we use `antiword` which provides clean text extraction without the bloat that can cause OpenAI context length issues.

### Key Features
- ✅ **antiword support** for clean `.doc` file processing
- ✅ **LibreOffice fallback** for complex documents
- ✅ **OCR support** for image-based documents
- ✅ **Input size management** to prevent context overflow
- ✅ **Compact-and-retry** for large documents
- ✅ **Multi-format support** (.pdf, .docx, .doc, .txt, .rtf, images)

## Prerequisites

### System Requirements
- Docker Engine 20.10+
- Docker Compose 2.0+
- 4GB+ RAM
- 10GB+ disk space
- Internet connection for package downloads

### Cloud Platform Options
- **AWS ECS/Fargate** (Recommended)
- **Google Cloud Run**
- **Azure Container Instances**
- **DigitalOcean App Platform**
- **Railway**
- **Render**

## Docker Configuration

### 1. Create Dockerfile

Create `Dockerfile` in the Python backend directory:

```dockerfile
# Use Python 3.13 slim image
FROM python:3.13-slim

# Set working directory
WORKDIR /app

# Install system dependencies including antiword
RUN apt-get update && apt-get install -y \
    antiword \
    libreoffice \
    pandoc \
    poppler-utils \
    tesseract-ocr \
    tesseract-ocr-eng \
    libmagic1 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create non-root user for security
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Run the application
CMD ["python", "run.py"]
```

### 2. Create .dockerignore

Create `.dockerignore` file:

```dockerignore
__pycache__/
*.pyc
*.pyo
*.pyd
.Python
env/
venv/
.venv/
pip-log.txt
pip-delete-this-directory.txt
.tox/
.coverage
.coverage.*
.cache
nosetests.xml
coverage.xml
*.cover
*.log
.git/
.mypy_cache/
.pytest_cache/
.hypothesis/
.DS_Store
*.swp
*.swo
*~
```

### 3. Create docker-compose.yml

Create `docker-compose.yml` for local development:

```yaml
version: '3.8'

services:
  ats-python-backend:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DEBUG=false
      - DATABASE_URL=postgresql://user:password@postgres:5432/ats_database
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - JWT_SECRET=${JWT_SECRET}
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis
    volumes:
      - ./uploads:/app/uploads
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  postgres:
    image: pgvector/pgvector:pg16
    environment:
      - POSTGRES_DB=ats_database
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

## Environment Setup

### 1. Environment Variables

Create `.env` file:

```bash
# Application Settings
DEBUG=false
APP_NAME="ATS Resume Parser"
APP_VERSION="1.0.0"
PORT=8000

# Database Configuration
DATABASE_URL=postgresql://user:password@postgres:5432/ats_database

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-3.5-turbo
OPENAI_MAX_TOKENS=2000
OPENAI_TEMPERATURE=0.1

# JWT Configuration
JWT_SECRET=your_super_secure_jwt_secret_here

# Redis Configuration
REDIS_URL=redis://redis:6379

# File Processing Configuration
MAX_FILE_SIZE=10485760  # 10MB
MAX_INPUT_CHARS=40000
CHARS_PER_TOKEN_ESTIMATE=4
MIN_TEXT_LENGTH_FOR_OCR=100

# DOC Processing Feature Flags
DOC_ENABLE_ANTIWORD=true
DOC_ENABLE_OCR=true
DOC_ENABLE_LIBREOFFICE=true
DOC_ENABLE_PANDOC=true

# CORS Configuration
CORS_ORIGINS=["http://localhost:3000", "https://yourdomain.com"]
```

### 2. Production Environment Variables

For production, set these additional variables:

```bash
# Production Database (use managed database)
DATABASE_URL=postgresql://username:password@your-db-host:5432/ats_database

# Production Redis (use managed Redis)
REDIS_URL=redis://your-redis-host:6379

# Security
JWT_SECRET=your_production_jwt_secret_here
CORS_ORIGINS=["https://yourdomain.com"]

# Monitoring
SENTRY_DSN=your_sentry_dsn_here
LOG_LEVEL=INFO
```

## Deployment Options

### Option 1: AWS ECS with Fargate (Recommended)

#### 1. Create ECR Repository

```bash
# Create ECR repository
aws ecr create-repository --repository-name ats-resume-parser

# Get login token
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789012.dkr.ecr.us-east-1.amazonaws.com

# Build and push image
docker build -t ats-resume-parser .
docker tag ats-resume-parser:latest 123456789012.dkr.ecr.us-east-1.amazonaws.com/ats-resume-parser:latest
docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/ats-resume-parser:latest
```

#### 2. Create ECS Task Definition

```json
{
  "family": "ats-resume-parser",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "executionRoleArn": "arn:aws:iam::123456789012:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "ats-python-backend",
      "image": "123456789012.dkr.ecr.us-east-1.amazonaws.com/ats-resume-parser:latest",
      "portMappings": [
        {
          "containerPort": 8000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "DATABASE_URL",
          "value": "postgresql://user:pass@your-rds-endpoint:5432/ats_database"
        },
        {
          "name": "OPENAI_API_KEY",
          "value": "your-openai-api-key"
        }
      ],
      "secrets": [
        {
          "name": "JWT_SECRET",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789012:secret:ats/jwt-secret"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/ats-resume-parser",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:8000/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
```

### Option 2: Google Cloud Run

#### 1. Build and Deploy

```bash
# Build image
docker build -t gcr.io/your-project-id/ats-resume-parser .

# Push to Google Container Registry
docker push gcr.io/your-project-id/ats-resume-parser

# Deploy to Cloud Run
gcloud run deploy ats-resume-parser \
  --image gcr.io/your-project-id/ats-resume-parser \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2 \
  --timeout 900 \
  --max-instances 10 \
  --set-env-vars DATABASE_URL=your-database-url,OPENAI_API_KEY=your-api-key
```

### Option 3: Railway

#### 1. Create railway.json

```json
{
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  },
  "deploy": {
    "startCommand": "python run.py",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

#### 2. Deploy

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

## Production Considerations

### 1. Database Setup

#### Option A: Managed Database (Recommended)
- **AWS RDS** with PostgreSQL + pgvector extension
- **Google Cloud SQL** with PostgreSQL
- **Azure Database** for PostgreSQL
- **Supabase** (PostgreSQL with pgvector)

#### Option B: Self-managed Database

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  postgres:
    image: pgvector/pgvector:pg16
    environment:
      - POSTGRES_DB=ats_database
      - POSTGRES_USER=ats_user
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped
    command: >
      postgres
      -c shared_preload_libraries=vector
      -c max_connections=200
      -c shared_buffers=256MB
      -c effective_cache_size=1GB
      -c maintenance_work_mem=64MB
      -c checkpoint_completion_target=0.9
      -c wal_buffers=16MB
      -c default_statistics_target=100
```

### 2. Redis Setup

#### Option A: Managed Redis
- **AWS ElastiCache**
- **Google Cloud Memorystore**
- **Azure Cache for Redis**

#### Option B: Self-managed Redis

```yaml
  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes --maxmemory 512mb --maxmemory-policy allkeys-lru
    volumes:
      - redis_data:/data
    restart: unless-stopped
```

### 3. Load Balancing & Scaling

#### Nginx Configuration

```nginx
upstream ats_backend {
    server ats-python-backend:8000;
    # Add more servers for load balancing
}

server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://ats_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeout settings for large file uploads
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # File upload size limit
        client_max_body_size 10M;
    }
}
```

### 4. Security Considerations

#### SSL/TLS
- Use Let's Encrypt for free SSL certificates
- Configure HTTPS redirects
- Set secure headers

#### Environment Security
- Use secrets management (AWS Secrets Manager, Google Secret Manager)
- Rotate API keys regularly
- Implement proper IAM roles and policies
- Use VPC for network isolation

#### Application Security
- Enable CORS properly
- Implement rate limiting
- Use secure JWT secrets
- Validate all inputs
- Implement proper error handling

### 5. Monitoring & Logging

#### CloudWatch (AWS)
```yaml
# Add to ECS task definition
"logConfiguration": {
  "logDriver": "awslogs",
  "options": {
    "awslogs-group": "/ecs/ats-resume-parser",
    "awslogs-region": "us-east-1",
    "awslogs-stream-prefix": "ecs"
  }
}
```

#### Prometheus + Grafana
```yaml
# Add to docker-compose.yml
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml

  grafana:
    image: grafana/grafana
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
```

## Troubleshooting

### Common Issues

#### 1. antiword Not Found
```bash
# Check if antiword is installed
docker exec -it container_name which antiword

# If not found, rebuild image
docker build --no-cache -t ats-resume-parser .
```

#### 2. Database Connection Issues
```bash
# Check database connectivity
docker exec -it container_name python -c "
import asyncpg
import asyncio
async def test():
    conn = await asyncpg.connect('your-database-url')
    result = await conn.fetchval('SELECT 1')
    print(f'Database connection: {result}')
    await conn.close()
asyncio.run(test())
"
```

#### 3. Memory Issues
```bash
# Check container memory usage
docker stats container_name

# Increase memory limits in docker-compose.yml
services:
  ats-python-backend:
    deploy:
      resources:
        limits:
          memory: 4G
        reservations:
          memory: 2G
```

#### 4. File Upload Issues
```bash
# Check file size limits
curl -X POST -F "files=@large-file.doc" http://localhost:8000/api/v1/bulk-parse-resumes

# Increase nginx client_max_body_size
client_max_body_size 50M;
```

### Debug Commands

```bash
# View container logs
docker logs -f container_name

# Execute shell in container
docker exec -it container_name /bin/bash

# Check converter availability
docker exec -it container_name bash -c "
echo 'antiword:' \$(which antiword)
echo 'soffice:' \$(which soffice)
echo 'pandoc:' \$(which pandoc)
"

# Test file processing
docker exec -it container_name python -c "
from app.services.file_processor import FileProcessor
import asyncio
async def test():
    fp = FileProcessor()
    with open('test.doc', 'rb') as f:
        result = await fp.process_file(f.read(), 'test.doc')
        print(f'Processed: {len(result)} characters')
asyncio.run(test())
"
```

## Monitoring & Maintenance

### 1. Health Checks

#### Application Health
```bash
# Check application health
curl http://your-domain.com/health

# Check startup status
curl http://your-domain.com/startup-status
```

#### Database Health
```bash
# Check database connections
docker exec -it container_name python -c "
from app.services.database_service import DatabaseService
import asyncio
async def check():
    db = DatabaseService()
    pool = await db._get_pool()
    print(f'Pool size: {pool.get_size()}')
    print(f'Pool idle: {pool.get_idle_size()}')
asyncio.run(check())
"
```

### 2. Performance Monitoring

#### Key Metrics to Monitor
- Response times for `/api/v1/bulk-parse-resumes`
- Memory usage during file processing
- Database connection pool utilization
- OpenAI API rate limits and costs
- File processing success rates by format

#### Alerting Rules
```yaml
# Example Prometheus alerting rules
groups:
- name: ats_alerts
  rules:
  - alert: HighMemoryUsage
    expr: container_memory_usage_bytes / container_spec_memory_limit_bytes > 0.8
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High memory usage detected"

  - alert: DatabaseConnectionHigh
    expr: postgresql_stat_activity_count > 80
    for: 2m
    labels:
      severity: critical
    annotations:
      summary: "High database connection count"
```

### 3. Backup Strategy

#### Database Backups
```bash
# Automated database backup
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker exec postgres_container pg_dump -U ats_user ats_database > backup_$DATE.sql
aws s3 cp backup_$DATE.sql s3://your-backup-bucket/
```

#### File Storage Backups
```bash
# Backup uploaded files
aws s3 sync ./uploads s3://your-backup-bucket/uploads/
```

### 4. Updates & Maintenance

#### Rolling Updates
```bash
# Update application
docker build -t ats-resume-parser:latest .
docker tag ats-resume-parser:latest your-registry/ats-resume-parser:latest
docker push your-registry/ats-resume-parser:latest

# Deploy update (ECS)
aws ecs update-service --cluster your-cluster --service ats-resume-parser --force-new-deployment
```

#### Dependency Updates
```bash
# Update Python dependencies
pip-compile requirements.in
docker build --no-cache -t ats-resume-parser .
```

## Cost Optimization

### 1. Resource Sizing
- Start with 1 vCPU, 2GB RAM
- Monitor usage and scale accordingly
- Use spot instances for non-critical workloads

### 2. Storage Optimization
- Use S3/Cloud Storage for file uploads
- Implement file cleanup policies
- Compress logs and old data

### 3. API Cost Management
- Implement request caching
- Use input size limits to prevent expensive API calls
- Monitor OpenAI usage and costs

## Support

For issues and questions:
1. Check the troubleshooting section above
2. Review application logs
3. Test with minimal configuration
4. Contact support with detailed error information

---

**Note**: This deployment guide assumes you have basic knowledge of Docker, cloud platforms, and database administration. Always test in a staging environment before deploying to production.