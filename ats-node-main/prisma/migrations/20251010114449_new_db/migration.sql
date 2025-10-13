-- CreateEnum
CREATE TYPE "CustomerStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'PROSPECT', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "CustomerPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "WorkType" AS ENUM ('ONSITE', 'REMOTE', 'HYBRID');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('ACTIVE', 'PAUSED', 'CLOSED', 'FILLED');

-- CreateEnum
CREATE TYPE "EntityType" AS ENUM ('CUSTOMER', 'JOB', 'CANDIDATE');

-- CreateEnum
CREATE TYPE "TaskCategory" AS ENUM ('RECRUITMENT', 'CLIENT_MANAGEMENT', 'ADMINISTRATIVE', 'TRAINING', 'MEETING', 'RESEARCH', 'OTHER');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "TimesheetStatus" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'SUBMITTED');

-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('SUPERADMIN', 'ADMIN', 'MANAGER', 'USER');

-- CreateTable
CREATE TABLE "superadmins" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "userType" TEXT NOT NULL DEFAULT 'SUPERADMIN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "superadmins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companies" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "logo" TEXT,
    "userCount" INTEGER NOT NULL DEFAULT 0,
    "superadminId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ats_users" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "userType" "UserType" NOT NULL DEFAULT 'USER',
    "companyId" INTEGER,

    CONSTRAINT "ats_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ats_Login" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "loggedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Ats_Login_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "companyName" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "companySize" TEXT,
    "website" TEXT,
    "description" TEXT,
    "status" "CustomerStatus" NOT NULL DEFAULT 'ACTIVE',
    "priority" "CustomerPriority" NOT NULL DEFAULT 'MEDIUM',
    "country" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "address" TEXT,
    "annualRevenue" TEXT,
    "contractValue" DECIMAL(10,2),
    "billingCycle" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "email" TEXT,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ats_JobPost" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "department" TEXT,
    "internalSPOC" TEXT NOT NULL,
    "recruiter" TEXT,
    "jobType" TEXT NOT NULL,
    "experienceLevel" TEXT,
    "country" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "fullLocation" TEXT NOT NULL,
    "salaryMin" INTEGER NOT NULL,
    "salaryMax" INTEGER NOT NULL,
    "priority" TEXT,
    "description" TEXT NOT NULL,
    "requirements" TEXT NOT NULL,
    "requiredSkills" TEXT NOT NULL,
    "benefits" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "jobStatus" "JobStatus" NOT NULL DEFAULT 'ACTIVE',
    "workType" "WorkType" NOT NULL DEFAULT 'ONSITE',
    "customerId" INTEGER,
    "email" TEXT NOT NULL,
    "embedding" JSONB,

    CONSTRAINT "Ats_JobPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CandidateApplication" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "jobId" INTEGER NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "coverLetter" TEXT,
    "portfolioUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "currentLocation" TEXT,
    "firstName" TEXT NOT NULL,
    "keySkills" TEXT,
    "lastName" TEXT NOT NULL,
    "noticePeriod" TEXT,
    "remoteWork" BOOLEAN,
    "resumeFilePath" TEXT,
    "salaryExpectation" INTEGER,
    "startDate" TEXT,
    "yearsOfExperience" TEXT,
    "jobDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "CandidateApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterviewSchedule" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "candidateId" INTEGER NOT NULL,
    "candidateName" TEXT NOT NULL,
    "interviewDate" TIMESTAMP(3) NOT NULL,
    "interviewTime" TEXT NOT NULL,
    "interviewType" TEXT NOT NULL,
    "interviewMode" TEXT NOT NULL,
    "platform" TEXT,
    "meetingLink" TEXT,
    "interviewer" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InterviewSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimesheetEntry" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "date" TEXT NOT NULL,
    "hours" DECIMAL(4,2) NOT NULL,
    "entityType" "EntityType" NOT NULL,
    "taskType" TEXT NOT NULL,
    "comments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "attachments" TEXT,
    "billable" BOOLEAN NOT NULL DEFAULT true,
    "billableRate" DECIMAL(8,2),
    "breakTime" DECIMAL(3,2),
    "companyName" TEXT,
    "endTime" TEXT,
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "recruiterEmail" TEXT,
    "recruiterName" TEXT NOT NULL,
    "startTime" TEXT,
    "status" "TimesheetStatus" NOT NULL DEFAULT 'PENDING',
    "taskCategory" "TaskCategory" NOT NULL DEFAULT 'RECRUITMENT',
    "entityId" TEXT,
    "entityName" TEXT,
    "recruiterId" TEXT,
    "jobId" INTEGER,

    CONSTRAINT "TimesheetEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resume_data" (
    "id" SERIAL NOT NULL,
    "filename" TEXT NOT NULL,
    "file_path" TEXT,
    "file_type" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "processing_time" DOUBLE PRECISION NOT NULL,
    "parsed_data" JSONB NOT NULL,
    "candidate_name" TEXT NOT NULL,
    "candidate_email" TEXT NOT NULL,
    "candidate_phone" TEXT NOT NULL,
    "total_experience" TEXT NOT NULL,
    "is_unique" BOOLEAN NOT NULL DEFAULT true,
    "embedding" JSONB,
    "company_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resume_data_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "superadmins_email_key" ON "superadmins"("email");

-- CreateIndex
CREATE UNIQUE INDEX "companies_name_key" ON "companies"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ats_users_email_key" ON "ats_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "CandidateApplication_companyId_email_jobId_key" ON "CandidateApplication"("companyId", "email", "jobId");

-- AddForeignKey
ALTER TABLE "companies" ADD CONSTRAINT "companies_superadminId_fkey" FOREIGN KEY ("superadminId") REFERENCES "superadmins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ats_users" ADD CONSTRAINT "ats_users_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ats_Login" ADD CONSTRAINT "Ats_Login_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ats_Login" ADD CONSTRAINT "Ats_Login_userId_fkey" FOREIGN KEY ("userId") REFERENCES "ats_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ats_JobPost" ADD CONSTRAINT "Ats_JobPost_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ats_JobPost" ADD CONSTRAINT "Ats_JobPost_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateApplication" ADD CONSTRAINT "CandidateApplication_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateApplication" ADD CONSTRAINT "CandidateApplication_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Ats_JobPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewSchedule" ADD CONSTRAINT "InterviewSchedule_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewSchedule" ADD CONSTRAINT "InterviewSchedule_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "CandidateApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimesheetEntry" ADD CONSTRAINT "TimesheetEntry_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimesheetEntry" ADD CONSTRAINT "TimesheetEntry_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Ats_JobPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resume_data" ADD CONSTRAINT "resume_data_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
