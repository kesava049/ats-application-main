# ATS Frontend Next.js

## Overview
Frontend application for the Applicant Tracking System (ATS) built with Next.js 14, React, and TypeScript.

## Features
- Job posting management and display
- Candidate application forms with resume upload
- Admin dashboard for recruiters and HR
- Responsive design with mobile support
- Real-time updates and notifications

## Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn/ui
- **State Management**: React hooks
- **Forms**: React Hook Form

## Quick Start

### Prerequisites
- Node.js 18+
- npm, yarn, or pnpm

### Installation
```bash
npm install
# or
yarn install
# or
pnpm install
```

### Development
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build
```bash
npm run build
npm start
```

## Project Structure
```
├── app/                    # Next.js app router pages
│   ├── apply/             # Job application forms
│   ├── components/        # Reusable UI components
│   ├── auth/              # Authentication pages
│   └── layout.tsx         # Root layout
├── components/             # Shared components
│   ├── ui/                # Base UI components
│   └── admin/             # Admin-specific components
├── lib/                    # Utility functions and data
├── hooks/                  # Custom React hooks
└── public/                 # Static assets
```

## Configuration
- **Backend API**: Configured in `BaseUrlApi.js`
- **Python API**: Configured in `PythonApi.js`
- **Environment**: Automatically detects development/production

## Key Components
- **Job Postings**: Display and manage job listings
- **Application Forms**: Handle candidate applications
- **Admin Dashboard**: Manage candidates, jobs, and analytics
- **Resume Upload**: File upload with validation

## License
MIT
