# ATS (Applicant Tracking System) Application Documentation

## Table of Contents
1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Technology Stack](#technology-stack)
4. [Core Features](#core-features)
5. [Database Schema](#database-schema)
6. [API Endpoints](#api-endpoints)
7. [AI Features](#ai-features)
8. [User Management](#user-management)
9. [Installation & Setup](#installation--setup)
10. [Usage Guide](#usage-guide)
11. [File Structure](#file-structure)
12. [Security Features](#security-features)
13. [Performance & Scalability](#performance--scalability)

---

## Overview

The ATS (Applicant Tracking System) is a comprehensive, multi-tenant recruitment platform designed to handle large-scale hiring operations. It's built as a microservices architecture with three main components:

- **Frontend**: Next.js 14 React application with TypeScript
- **Backend**: Node.js Express API server with PostgreSQL
- **AI Service**: Python FastAPI service for resume parsing and candidate matching

### Key Capabilities
- **Multi-tenant Architecture**: Supports multiple companies with isolated data
- **AI-Powered Resume Parsing**: Automated extraction of candidate information
- **Intelligent Candidate Matching**: AI-driven job-candidate matching algorithms
- **Comprehensive Analytics**: Real-time recruitment metrics and insights
- **Pipeline Management**: 17-stage recruitment pipeline with automation
- **Timesheet Tracking**: Time management for recruiters and activities
- **Email Automation**: Automated notifications and communications

---

## System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   AI Service    │
│   (Next.js)     │◄──►│   (Node.js)     │◄──►│   (Python)      │
│   Port: 3000    │    │   Port: 5000    │    │   Port: 8000    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PostgreSQL Database                          │
│                    (Port: 5432)                                │
└─────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

**Frontend (Next.js)**
- User interface and user experience
- Dashboard and analytics visualization
- Form handling and file uploads
- Real-time data display and updates

**Backend (Node.js)**
- Business logic and data processing
- Authentication and authorization
- Database operations via Prisma ORM
- Email notifications and file management
- API endpoints for all operations

**AI Service (Python)**
- Resume parsing using OpenAI GPT
- Candidate-job matching algorithms
- OCR processing for image-based resumes
- Semantic analysis and scoring

---

## Technology Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn/ui + Radix UI
- **Charts**: Chart.js, Recharts
- **Forms**: React Hook Form with Zod validation
- **State Management**: React Context + Hooks

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT tokens
- **File Upload**: Multer
- **Email**: Nodemailer
- **Validation**: Custom middleware

### AI Service
- **Framework**: FastAPI
- **Language**: Python 3.8+
- **AI/ML**: OpenAI GPT-4o-mini, scikit-learn
- **OCR**: EasyOCR
- **File Processing**: PyMuPDF, python-docx, Pillow
- **Database**: AsyncPG with PostgreSQL

### Database
- **Primary**: PostgreSQL
- **ORM**: Prisma (Node.js), AsyncPG (Python)
- **Features**: Multi-tenant isolation, JSON fields for embeddings

---

## Core Features

### 1. Multi-Tenant Architecture
- **Company Isolation**: Each company has isolated data and users
- **Superadmin Management**: Centralized administration across all companies
- **User Limits**: Configurable user limits per company
- **Custom Branding**: Company logos and branding support

### 2. Job Management
- **Job Posting**: Create and manage job postings
- **Job Categories**: Department, experience level, work type classification
- **Location Management**: Country, city, and full location support
- **Salary Ranges**: Min/max salary configuration
- **Job Status**: Active, Paused, Closed, Filled states
- **Public Job Listings**: External job posting capabilities

### 3. Candidate Management
- **Application Processing**: Handle candidate applications
- **Resume Upload**: Support for PDF, DOC, DOCX, images
- **Profile Management**: Comprehensive candidate profiles
- **Pipeline Tracking**: 17-stage recruitment pipeline
- **Status Management**: Real-time status updates
- **Bulk Operations**: Mass candidate operations

### 4. AI-Powered Features
- **Resume Parsing**: Automated extraction of candidate information
- **Candidate Matching**: AI-driven job-candidate matching
- **Semantic Analysis**: Deep understanding of skills and experience
- **Scoring System**: Percentage-based match scores
- **OCR Support**: Text extraction from image-based resumes

### 5. Interview Management
- **Scheduling**: Interview appointment scheduling
- **Multiple Types**: Phone, video, in-person interviews
- **Platform Integration**: Meeting links and platform support
- **Interviewer Assignment**: Multiple interviewer support
- **Notes Management**: Interview feedback and notes

### 6. Analytics & Reporting
- **Real-time Metrics**: Live performance tracking
- **KPI Dashboards**: Key performance indicators
- **Trend Analysis**: Historical data and forecasting
- **Custom Reports**: Configurable report generation
- **Export Capabilities**: Data export in multiple formats

### 7. Timesheet Management
- **Time Tracking**: Hours and task tracking
- **Billable Hours**: Billable vs non-billable time
- **Approval Workflow**: Timesheet approval process
- **Task Categories**: Recruitment, client management, administrative
- **Priority Levels**: Low, Medium, High, Urgent priorities

### 8. Customer Management
- **Client Profiles**: Comprehensive client information
- **Industry Classification**: Industry and company size tracking
- **Contract Management**: Contract values and billing cycles
- **Priority Levels**: Customer priority management
- **Status Tracking**: Active, Inactive, Prospect, Suspended

---

## Database Schema

### Core Entities

**Companies**
- Multi-tenant isolation
- User count limits
- Logo and branding
- Superadmin association

**Users (Ats_User)**
- User types: SUPERADMIN, ADMIN, MANAGER, USER
- Company association
- Login tracking
- Profile information

**Jobs (Ats_JobPost)**
- Job details and requirements
- Company and customer association
- Status management
- Embedding support for AI matching

**Candidates (CandidateApplication)**
- Application information
- Resume file paths
- Pipeline status
- Job association

**Resume Data**
- Parsed resume information
- AI-generated embeddings
- File metadata
- Processing metrics

**Interviews (InterviewSchedule)**
- Interview details
- Scheduling information
- Status tracking
- Notes and feedback

**Timesheets (TimesheetEntry)**
- Time tracking
- Task categorization
- Approval workflow
- Billable hours

### Key Relationships
- Companies → Users (One-to-Many)
- Companies → Jobs (One-to-Many)
- Jobs → Candidates (One-to-Many)
- Candidates → Interviews (One-to-Many)
- Companies → Resume Data (One-to-Many)

---

## API Endpoints

### Authentication
- `POST /api/auth/send-otp` - Send OTP for login
- `POST /api/auth/verify-otp` - Verify OTP and login
- `POST /api/auth/superadmin-login` - Superadmin login
- `POST /api/auth/create-user` - Create new user
- `POST /api/auth/register-superadmin` - Register superadmin

### Jobs
- `GET /api/jobs` - Get all jobs
- `POST /api/jobs` - Create new job
- `PUT /api/jobs/:id` - Update job
- `DELETE /api/jobs/:id` - Delete job
- `GET /api/public/jobs` - Public job listings

### Candidates
- `GET /api/candidates` - Get all candidates
- `POST /api/candidates` - Create candidate application
- `PUT /api/candidates/:id` - Update candidate
- `GET /api/candidates/:id/resume` - Download resume
- `POST /api/candidates/bulk-import` - Bulk import candidates

### Pipeline
- `PUT /api/pipeline/update-status` - Update candidate status
- `GET /api/pipeline/statuses` - Get pipeline statuses
- `GET /api/pipeline/candidates` - Get candidates by status

### Interviews
- `GET /api/interviews` - Get all interviews
- `POST /api/interviews` - Schedule interview
- `PUT /api/interviews/:id` - Update interview
- `DELETE /api/interviews/:id` - Cancel interview

### Analytics
- `GET /api/analytics` - Get comprehensive analytics
- `GET /api/analytics/jobs` - Job analytics
- `GET /api/analytics/candidates` - Candidate analytics
- `GET /api/analytics/interviews` - Interview analytics

### AI Service (Python)
- `POST /api/v1/parse-resume` - Parse resume files
- `GET /api/v1/resumes` - Get parsed resumes
- `GET /api/v1/job/{job_id}/candidates-fast` - Fast candidate matching
- `GET /api/v1/all-matches` - Bulk candidate matching

---

## AI Features

### Resume Parsing
- **Multi-format Support**: PDF, DOCX, DOC, TXT, RTF, PNG, JPG, JPEG, WEBP
- **AI Extraction**: OpenAI GPT-powered information extraction
- **OCR Processing**: Text extraction from images using EasyOCR
- **Structured Data**: Consistent JSON output format
- **Batch Processing**: Multiple file processing in single request

### Candidate Matching
- **Semantic Analysis**: Deep understanding of job requirements and candidate profiles
- **Scoring Algorithm**: 75% GPT analysis + 25% embeddings similarity
- **Skill Matching**: Intelligent skill recognition and synonym handling
- **Experience Analysis**: Experience level compatibility assessment
- **Location Matching**: Geographic compatibility scoring
- **Salary Alignment**: Salary expectation matching

### AI Pipeline
- **5-Stage Automation**: Sourcing → Screening → Assessment → Interview → Offer
- **Intelligent Routing**: AI-driven candidate progression
- **Automation Rules**: Configurable automation triggers
- **Performance Tracking**: AI accuracy and efficiency metrics

### Analytics & Insights
- **Predictive Analytics**: Hiring success forecasting
- **Skill Gap Analysis**: Identify missing skills in candidate pool
- **Diversity Metrics**: Diversity and inclusion analytics
- **Market Trends**: Industry and market trend analysis
- **Performance KPIs**: AI-driven performance indicators

---

## User Management

### User Types
1. **SUPERADMIN**: System-wide administration
2. **ADMIN**: Company-level administration
3. **MANAGER**: Team management and oversight
4. **USER**: Standard user with limited permissions

### Authentication Flow
1. **OTP-based Login**: Email-based OTP authentication
2. **JWT Tokens**: Secure token-based session management
3. **Company Context**: Multi-tenant user isolation
4. **Login Tracking**: Comprehensive login history

### Permission System
- **Role-based Access**: Different permissions per user type
- **Company Isolation**: Users can only access their company data
- **Feature Access**: Granular feature-level permissions
- **Data Security**: Encrypted data transmission and storage

---

## Installation & Setup

### Prerequisites
- Node.js 18+
- Python 3.8+
- PostgreSQL 12+
- npm or yarn
- pip (Python package manager)

### Environment Variables

**Backend (.env)**
```env
DATABASE_URL="postgresql://username:password@localhost:5432/ats_database"
PORT=5000
JWT_SECRET="your-jwt-secret"
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=587
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-app-password"
```

**AI Service (.env)**
```env
DATABASE_URL="postgresql://username:password@localhost:5432/ats_database"
OPENAI_API_KEY="your-openai-api-key"
OPENAI_MODEL="gpt-4o-mini"
```

### Installation Steps

1. **Clone Repository**
```bash
git clone <repository-url>
cd ats-application-main
```

2. **Backend Setup**
```bash
cd ats-node-main
npm install --legacy-peer-deps
npx prisma generate
npx prisma db push
npm start
```

3. **Frontend Setup**
```bash
cd ats-frontend-main
npm install --legacy-peer-deps
npm run dev
```

4. **AI Service Setup**
```bash
cd ats-python-main
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python run.py
```

### Database Setup
```bash
# Create database
createdb ats_database

# Run migrations
cd ats-node-main
npx prisma db push
```

---

## Usage Guide

### Getting Started
1. **Access Application**: Navigate to `http://localhost:3000`
2. **Superadmin Login**: Use superadmin credentials to access admin panel
3. **Create Company**: Set up your company profile
4. **Add Users**: Create user accounts for your team
5. **Post Jobs**: Create and publish job postings
6. **Process Applications**: Manage candidate applications

### Key Workflows

**Job Posting Workflow**
1. Navigate to Jobs section
2. Click "Create New Job"
3. Fill in job details and requirements
4. Set salary range and location
5. Publish job posting
6. Monitor applications

**Candidate Management Workflow**
1. View candidate applications
2. Review resumes and profiles
3. Update pipeline status
4. Schedule interviews
5. Track progress through pipeline
6. Make hiring decisions

**AI-Powered Matching**
1. Upload candidate resumes
2. AI automatically parses and extracts data
3. System generates match scores
4. Review AI recommendations
5. Shortlist top candidates
6. Proceed with interviews

### Best Practices
- **Regular Data Backup**: Ensure database backups
- **User Training**: Train users on system features
- **Performance Monitoring**: Monitor system performance
- **Security Updates**: Keep dependencies updated
- **Data Privacy**: Follow data protection regulations

---

## File Structure

```
ats-application-main/
├── ats-frontend-main/          # Next.js Frontend
│   ├── app/                    # App Router pages
│   │   ├── components/         # React components
│   │   ├── analytics/          # Analytics pages
│   │   ├── candidates/         # Candidate management
│   │   ├── jobs/              # Job management
│   │   └── admin/             # Admin pages
│   ├── components/             # Shared components
│   ├── lib/                    # Utilities and helpers
│   └── public/                 # Static assets
├── ats-node-main/              # Node.js Backend
│   ├── controllers/            # Business logic
│   ├── routes/                 # API routes
│   ├── middlewares/            # Authentication & validation
│   ├── prisma/                 # Database schema
│   ├── utils/                  # Email templates & utilities
│   └── uploads/                # File storage
└── ats-python-main/            # Python AI Service
    ├── app/
    │   ├── controllers/        # API endpoints
    │   ├── services/           # Business logic
    │   ├── models/             # Data models
    │   └── utils/              # Utilities
    └── uploads/                # File processing
```

---

## Security Features

### Authentication & Authorization
- **JWT Tokens**: Secure token-based authentication
- **OTP Verification**: Email-based OTP for login
- **Role-based Access**: Granular permission system
- **Session Management**: Secure session handling

### Data Protection
- **Multi-tenant Isolation**: Complete data separation
- **Encrypted Storage**: Sensitive data encryption
- **Secure File Upload**: File validation and sanitization
- **SQL Injection Prevention**: Parameterized queries via Prisma

### API Security
- **CORS Configuration**: Cross-origin request handling
- **Input Validation**: Comprehensive input sanitization
- **Rate Limiting**: API request rate limiting
- **Error Handling**: Secure error responses

---

## Performance & Scalability

### Frontend Optimization
- **Next.js 14**: Latest performance optimizations
- **Code Splitting**: Automatic code splitting
- **Image Optimization**: Next.js image optimization
- **Lazy Loading**: Component and data lazy loading
- **Caching**: Browser and CDN caching

### Backend Performance
- **Database Indexing**: Optimized database queries
- **Connection Pooling**: Efficient database connections
- **Caching**: Redis caching for frequently accessed data
- **API Optimization**: Efficient API response handling

### AI Service Scalability
- **Batch Processing**: Multiple file processing
- **Caching**: AI response caching
- **Async Processing**: Non-blocking operations
- **Resource Management**: Efficient memory usage

### Scalability Features
- **Multi-tenant Architecture**: Horizontal scaling support
- **Database Partitioning**: Data partitioning by company
- **Load Balancing**: Multiple service instances
- **Microservices**: Independent service scaling

---

## Conclusion

The ATS Application is a comprehensive, enterprise-grade recruitment platform that combines modern web technologies with advanced AI capabilities. Its multi-tenant architecture, robust security features, and scalable design make it suitable for organizations of all sizes.

The system's AI-powered features provide intelligent automation and insights, while its intuitive interface ensures ease of use for recruiters and HR professionals. With comprehensive analytics, pipeline management, and candidate matching capabilities, it streamlines the entire recruitment process from job posting to hiring.

The modular architecture allows for easy maintenance, updates, and feature additions, ensuring the system can evolve with changing business needs and technological advancements.
