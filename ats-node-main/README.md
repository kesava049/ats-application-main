# ATS Backend Node.js

## Overview
Backend API server for the Applicant Tracking System (ATS) built with Node.js, Express, and PostgreSQL.

## Features
- Job posting management
- Candidate application handling
- Resume file uploads and downloads
- Interview scheduling
- Pipeline management
- Timesheet tracking
- Email notifications
- Analytics and reporting

## Tech Stack
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **File Upload**: Multer
- **Email**: Nodemailer
- **Authentication**: JWT

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database
- npm or yarn

### Installation
```bash
npm install
```

### Environment Setup
Create a `.env` file with:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/ats_database"
PORT=5000
```

### Database Setup
```bash
npx prisma generate
npx prisma db push
```

### Start Server
```bash
npm start
```

Server will run on `http://localhost:5000`

## API Endpoints

### Core Endpoints
- `POST /api/job-listings/:slug/apply` - Submit job application with resume
- `GET /api/candidates/:id/resume` - Download candidate resume
- `GET /api/candidates` - Get all candidates
- `GET /api/jobs` - Get all job postings

### File Structure
```
├── controllers/     # Business logic
├── routes/         # API route definitions
├── prisma/         # Database schema and migrations
├── utils/          # Email templates and utilities
├── uploads/        # File storage
└── server.js       # Main server file
```

## File Uploads
- Resume files stored in `./uploads/candidate_user/`
- Supports PDF, DOC, DOCX, and image formats
- Maximum file size: 5MB

## License
MIT
