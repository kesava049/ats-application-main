# 🚀 ATS Database Setup Guide

## Prerequisites

Before setting up the database, ensure you have:

1. **PostgreSQL installed** on your Mac
2. **Node.js** (v16 or higher)
3. **Python** (v3.8 or higher)

## Step 1: Install PostgreSQL (if not already installed)

```bash
# Install PostgreSQL using Homebrew
brew install postgresql

# Start PostgreSQL service
brew services start postgresql

# Verify PostgreSQL is running
brew services list | grep postgresql
```

## Step 2: Create .env File

Create a `.env` file in the `ats-node-main` directory with the following content:

```env
# Database Configuration
DATABASE_URL="postgresql://postgres:password@localhost:5432/ats_database?schema=public"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-here-change-this-in-production"
JWT_EXPIRES_IN="7d"

# Server Configuration
PORT=3001
NODE_ENV=development

# Email Configuration (if needed)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# File Upload Configuration
UPLOAD_FOLDER=uploads
MAX_FILE_SIZE=10485760

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
```

## Step 3: Set Up PostgreSQL User and Database

```bash
# Connect to PostgreSQL as superuser
psql -U postgres

# In PostgreSQL prompt, run these commands:
CREATE USER postgres WITH PASSWORD 'password';
ALTER USER postgres CREATEDB;
CREATE DATABASE ats_database OWNER postgres;
GRANT ALL PRIVILEGES ON DATABASE ats_database TO postgres;
\q
```

## Step 4: Run Database Setup Script

```bash
# Navigate to the Node.js backend directory
cd ats-node-main

# Make the setup script executable
chmod +x setup-database.js

# Run the database setup script
node setup-database.js
```

## Step 5: Manual Setup (if script fails)

If the automated script fails, follow these manual steps:

### 5.1: Install Dependencies
```bash
cd ats-node-main
npm install
```

### 5.2: Generate Prisma Client
```bash
npx prisma generate
```

### 5.3: Push Database Schema
```bash
npx prisma db push
```

### 5.4: Verify Database Connection
```bash
npx prisma db pull
```

## Step 6: Test the Setup

### 6.1: Start Node.js Backend
```bash
cd ats-node-main
npm start
```

You should see:
```
✅ PostgreSQL Database connected successfully!
📊 Database connection established and ready for queries
🚀 Server running on port 3001
```

### 6.2: Test Database Connection
```bash
# Test with Prisma Studio (optional)
npx prisma studio
```

## Troubleshooting

### Common Issues and Solutions

#### 1. PostgreSQL Connection Failed
```bash
# Check if PostgreSQL is running
brew services list | grep postgresql

# If not running, start it
brew services start postgresql

# Check PostgreSQL status
pg_ctl status
```

#### 2. Database Permission Denied
```bash
# Connect to PostgreSQL and grant permissions
psql -U postgres
GRANT ALL PRIVILEGES ON DATABASE ats_database TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;
\q
```

#### 3. Prisma Migration Issues
```bash
# Reset database (WARNING: This will delete all data)
npx prisma db push --force-reset

# Or reset and migrate
npx prisma migrate reset
```

#### 4. Port Already in Use
```bash
# Check what's using port 5432
lsof -i :5432

# Kill the process if needed
kill -9 <PID>
```

## Environment Variables Reference

| Variable | Description | Default Value |
|----------|-------------|---------------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:password@localhost:5432/ats_database?schema=public` |
| `JWT_SECRET` | Secret key for JWT tokens | `your-super-secret-jwt-key-here` |
| `PORT` | Server port | `3001` |
| `NODE_ENV` | Environment mode | `development` |

## Database Schema

The database includes the following main tables:
- `superadmins` - Super admin users
- `companies` - Company information
- `ats_users` - Regular users
- `customers` - Customer data
- `ats_job_posts` - Job postings
- `candidate_applications` - Job applications
- `resume_data` - Parsed resume data
- `timesheet_entries` - Time tracking
- `interview_schedules` - Interview management

## Next Steps

After successful database setup:

1. **Start the Node.js backend**: `cd ats-node-main && npm start`
2. **Start the Python backend**: `cd ats-python-main && python run.py`
3. **Start the frontend**: `cd ats-frontend-main && npm run dev`

## Support

If you encounter issues:
1. Check the console logs for error messages
2. Verify PostgreSQL is running: `brew services list | grep postgresql`
3. Test database connection: `psql -h localhost -p 5432 -U postgres -d ats_database`
4. Check Prisma status: `npx prisma db pull`
