import prisma from '../prismaClient.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { sendJobApplicationEmail, sendNewApplicationNotification } from '../utils/mailer.js';
import { PRODUCTION_BASE_URL } from '../productionApi.js';

// Backfill: create CandidateApplication entries for ResumeData rows without candidates
export const backfillCandidatesFromResumeData = async(req, res) => {
    try {
        const userCompanyId = req.companyId;
        const { jobId } = req.body || {};

        // Determine default job to attach applications to
        let targetJobId = null;
        if (jobId) {
            targetJobId = parseInt(jobId);
        } else {
            const latestJob = await prisma.Ats_JobPost.findFirst({
                where: { companyId: userCompanyId },
                orderBy: { createdAt: 'desc' },
                select: { id: true }
            });
            if (latestJob) {
                targetJobId = latestJob.id;
            } else {
                return res.status(400).json({
                    success: false,
                    message: 'No job found for this company. Please create a job or supply jobId.'
                });
            }
        }

        // Find resume_data rows for this company that don't have a CandidateApplication with same email
        const resumes = await prisma.ResumeData.findMany({
            where: { company_id: userCompanyId },
            orderBy: { created_at: 'desc' }
        });

        let created = 0;
        let skipped = 0;
        const results = [];

        for (const resume of resumes) {
            if (!resume.candidate_email) { skipped++; continue; }

            // Check for existing candidate with same email, company, and job combination
            const exists = await prisma.CandidateApplication.findFirst({
                where: {
                    email: resume.candidate_email,
                    companyId: userCompanyId,
                    jobId: targetJobId
                }
            });
            if (exists) {
                console.log(`⏭️ Skipping resume ${resume.id} - candidate already exists for email ${resume.candidate_email} and job ${targetJobId}`);
                skipped++;
                continue;
            }

            const parsed = resume.parsed_data || {};
            const firstName = (parsed.Name ? parsed.Name.split(' ')[0] : null) || (resume.candidate_name ? resume.candidate_name.split(' ')[0] : 'Unknown');
            const lastName = (parsed.Name ? parsed.Name.split(' ').slice(1).join(' ') : null) || (resume.candidate_name ? resume.candidate_name.split(' ').slice(1).join(' ') : '');
            const keySkills = Array.isArray(parsed.Skills) ? parsed.Skills.join(', ') : (Array.isArray(parsed.KeySkills) ? parsed.KeySkills.join(', ') : '');
            const yearsOfExperience = parsed.TotalExperience || resume.total_experience || '0';
            const currentLocation = parsed.Location || parsed.CurrentLocation || '';
            const salaryExpectation = parsed.SalaryExpectation || parsed.ExpectedSalary || null;

            const candidate = await prisma.CandidateApplication.create({
                data: {
                    companyId: userCompanyId,
                    jobId: targetJobId,
                    firstName,
                    lastName,
                    email: resume.candidate_email,
                    phone: resume.candidate_phone || '',
                    keySkills,
                    yearsOfExperience: (typeof yearsOfExperience === 'number' ? String(yearsOfExperience) : String(yearsOfExperience || '0')),
                    currentLocation,
                    salaryExpectation: salaryExpectation ? parseInt(salaryExpectation) || null : null,
                    resumeFilePath: resume.file_path || '',
                    status: 'pending',
                    appliedAt: new Date(),
                    coverLetter: parsed.CoverLetter || '',
                    portfolioUrl: parsed.Portfolio || parsed.PortfolioUrl || '',
                    noticePeriod: parsed.NoticePeriod || '',
                    remoteWork: parsed.RemoteWork || false,
                    startDate: parsed.StartDate ? String(parsed.StartDate) : null
                }
            });

            results.push({ resumeDataId: resume.id, candidateId: candidate.id, status: 'created' });
            created++;
        }

        console.log(`✅ Backfill completed for company ${userCompanyId}: created ${created}, skipped ${skipped}`);
        return res.json({ success: true, created, skipped, results });
    } catch (error) {
        console.error('❌ Backfill candidates error:', error);
        return res.status(500).json({ success: false, message: 'Backfill failed', error: error.message });
    }
};

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        // Create uploads directory if it doesn't exist
        const uploadDir = './uploads';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        // Use consistent candidate_user folder for all resumes
        const candidateFolder = `${uploadDir}/candidate_user`;
        if (!fs.existsSync(candidateFolder)) {
            fs.mkdirSync(candidateFolder, { recursive: true });
        }

        cb(null, candidateFolder);
    },
    filename: function(req, file, cb) {
        // Create filename with timestamp only for consistency
        const timestamp = Date.now();
        const fileExtension = path.extname(file.originalname);
        const fileName = `resume_${timestamp}${fileExtension}`;
        cb(null, fileName);
    }
});

const fileFilter = (req, file, cb) => {
    // Allow PDF, DOC, DOCX, and image files
    const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/png',
        'image/jpg'
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only PDF, DOC, DOCX, and images are allowed.'), false);
    }
};

export const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Helper function to create SEO-friendly slug (same as in jobController)
const createJobSlug = (job) => {
    const title = job.title.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();

    const company = job.company.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();

    const location = job.city.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();

    const experience = job.experienceLevel ?
        job.experienceLevel.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim() :
        'freshers';

    const jobType = job.jobType ?
        job.jobType.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim() :
        'full-time';

    // Create full descriptive URL like Naukri.com
    return `job-listings-${title}-${experience}-${jobType}-${company}-${location}-${job.id}`;
};

// Get job details for application form (full descriptive URL) - PUBLIC ACCESS
export const getJobForApplication = async(req, res) => {
    try {
        const { slug } = req.params;

        // Extract job ID from the end of the slug
        const jobId = parseInt(slug.split('-').pop());

        if (!jobId || isNaN(jobId)) {
            return res.status(400).json({ message: 'Invalid job URL' });
        }

        // Get job with company information - NO AUTH REQUIRED (PUBLIC)
        const job = await prisma.ats_JobPost.findUnique({
            where: {
                id: jobId,
                jobStatus: 'ACTIVE' // Only show active jobs
            },
            include: {
                companyRelation: {
                    select: {
                        id: true,
                        name: true,
                        logo: true
                    }
                }
            }
        });

        if (!job) {
            return res.status(404).json({
                message: 'Job not found or no longer available',
                error: 'JOB_NOT_FOUND'
            });
        }

        // Verify the slug matches the job
        const expectedSlug = createJobSlug(job);
        if (slug !== expectedSlug) {
            // Redirect to correct URL for SEO
            return res.redirect(`/api/job-listings/${expectedSlug}`);
        }

        // Map company data for frontend
        const jobWithCompany = {
            ...job,
            companyId: job.companyId, // ✅ Add companyId for resume parsing
            company: job.companyRelation ? {
                id: job.companyRelation.id,
                name: job.companyRelation.name,
                logo: job.companyRelation.logo
            } : {
                id: job.companyId,
                name: job.companyName,
                logo: null
            }
        };

        res.status(200).json({
            success: true,
            job: jobWithCompany,
            applicationUrl: `${PRODUCTION_BASE_URL}/api/job-listings/${slug}/apply`
        });
    } catch (error) {
        console.error('Error fetching public job:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching job details',
            error: error.message
        });
    }
};

// Submit job application with file upload
export const submitJobApplication = async(req, res) => {
    try {
        const { slug } = req.params;

        // Extract job ID from slug
        const jobId = parseInt(slug.split('-').pop());

        if (!jobId || isNaN(jobId)) {
            return res.status(400).json({ message: 'Invalid job URL' });
        }

        // Verify job exists and get company ID
        const job = await prisma.ats_JobPost.findUnique({
            where: { id: jobId },
            select: {
                id: true,
                title: true,
                company: true,
                companyId: true,
                jobStatus: true
            }
        });

        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }

        // Check if job is active
        if (job.jobStatus !== 'ACTIVE') {
            return res.status(400).json({
                message: 'This job is no longer accepting applications',
                error: 'JOB_INACTIVE'
            });
        }

        // Get form data
        const {
            firstName,
            lastName,
            email,
            phone,
            currentLocation,
            coverLetter,
            keySkills,
            salaryExpectation,
            noticePeriod,
            yearsOfExperience,
            remoteWork,
            startDate,
            portfolioUrl
        } = req.body;

        // Validate required fields
        const requiredFields = {
            firstName: 'First Name',
            lastName: 'Last Name',
            email: 'Email Address',
            phone: 'Phone Number',
            currentLocation: 'Current Location',
            coverLetter: 'Cover Letter',
            keySkills: 'Key Skills',
            salaryExpectation: 'Salary Expectation',
            noticePeriod: 'Notice Period',
            yearsOfExperience: 'Years of Experience',
            startDate: 'Start Date'
        };

        const missingFields = [];
        for (const [field, label] of Object.entries(requiredFields)) {
            if (!req.body[field] || req.body[field].trim() === '') {
                missingFields.push(label);
            }
        }

        // Check if resume file is uploaded
        if (!req.file) {
            missingFields.push('Resume');
        }

        if (missingFields.length > 0) {
            return res.status(400).json({
                message: 'Please fill all required fields',
                missingFields: missingFields,
                error: 'VALIDATION_ERROR'
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                message: 'Please enter a valid email address',
                error: 'INVALID_EMAIL'
            });
        }

        // Validate phone number (basic validation)
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        if (!phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''))) {
            return res.status(400).json({
                message: 'Please enter a valid phone number',
                error: 'INVALID_PHONE'
            });
        }

        // Validate salary expectation
        if (isNaN(salaryExpectation) || parseInt(salaryExpectation) <= 0) {
            return res.status(400).json({
                message: 'Please enter a valid salary expectation',
                error: 'INVALID_SALARY'
            });
        }

        // Get resume file path
        const resumeFilePath = `${req.file.destination}/${req.file.filename}`;

        // Check for duplicate application (with company isolation)
        const existingApplication = await prisma.CandidateApplication.findFirst({
            where: {
                companyId: job.companyId, // ✅ Company isolation
                jobId: jobId,
                email: email.trim().toLowerCase()
            }
        });

        if (existingApplication) {
            return res.status(400).json({
                message: 'You have already applied for this job with this email address.',
                error: 'DUPLICATE_APPLICATION'
            });
        }

        // Create application with company ID from job
        const application = await prisma.CandidateApplication.create({
            data: {
                companyId: job.companyId, // ✅ Company ID from job
                jobId,
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                email: email.trim().toLowerCase(),
                phone: phone.trim(),
                currentLocation: currentLocation.trim(),
                resumeFilePath,
                coverLetter: coverLetter.trim(),
                keySkills: keySkills.trim(),
                salaryExpectation: parseInt(salaryExpectation),
                noticePeriod: noticePeriod.trim(),
                yearsOfExperience: yearsOfExperience.trim(),
                remoteWork: remoteWork === 'true' || remoteWork === true,
                startDate: startDate.trim(),
                portfolioUrl: portfolioUrl ? portfolioUrl.trim() : null,
                status: 'pending',
                appliedAt: new Date()
            }
        });

        // Send confirmation email to candidate
        try {
            await sendJobApplicationEmail(email, application, job);
        } catch (emailError) {
            console.error('Error sending application confirmation email:', emailError);
            // Don't fail the application submission if email fails
        }

        // Send notification email to recruiters/HR
        try {
            // Send to job email if available
            if (job.email) {
                await sendNewApplicationNotification(job.email, application, job);
            }

            // Send to internal SPOC if different from job email
            if (job.internalSPOC && job.internalSPOC !== job.email) {
                await sendNewApplicationNotification(job.internalSPOC, application, job);
            }
        } catch (notificationError) {
            console.error('Error sending application notification email:', notificationError);
            // Don't fail the application submission if notification email fails
        }

        res.status(201).json({
            message: 'Application submitted successfully!',
            applicationId: application.id,
            jobTitle: job.title,
            company: job.company,
            resumeFile: resumeFilePath
        });

    } catch (error) {
        res.status(500).json({ message: 'Error submitting application', error: error.message });
    }
};

/**
 * Get Application Status
 * 
 * Retrieves the detailed status of a specific job application.
 * 
 * @param {Object} req - Express request object
 * @param {Object} req.params - Path parameters
 * @param {string} req.params.applicationId - The application ID
 * @param {Object} res - Express response object
 */
export const getApplicationStatus = async(req, res) => {
    try {
        const { applicationId } = req.params;

        const application = await prisma.CandidateApplication.findUnique({
            where: { id: parseInt(applicationId) },
            include: {
                job: true
            }
        });

        if (!application) {
            return res.status(404).json({ message: 'Application not found' });
        }

        res.status(200).json({
            application,
            job: application.job
        });

    } catch (error) {
        res.status(500).json({ message: 'Error fetching application status', error: error.message });
    }
};


/**
 * Get Candidate by ID with All Applied Jobs
 * 
 * Retrieves detailed information about a specific candidate including all their job applications.
 * Groups all applications by the candidate's email address to show complete application history.
 * 
 * @param {Object} req - Express request object
 * @param {Object} req.params - Path parameters
 * @param {string} req.params.candidateId - The candidate ID
 * @param {Object} res - Express response object
 */
export const getCandidateById = async(req, res) => {
    try {
        const { candidateId } = req.params;

        // First, get the candidate's basic information
        const candidate = await prisma.CandidateApplication.findFirst({
            where: { id: parseInt(candidateId) }
        });

        if (!candidate) {
            return res.status(404).json({ message: 'Candidate not found' });
        }

        // Get all applications for this candidate (by email address)
        // This shows the complete application history for the candidate
        const allApplications = await prisma.CandidateApplication.findMany({
            where: { email: candidate.email },
            include: {
                job: {
                    select: {
                        id: true,
                        title: true,
                        company: true,
                        city: true,
                        jobType: true,
                        experienceLevel: true,
                        workType: true,
                        jobStatus: true,
                        salaryMin: true,
                        salaryMax: true,
                        priority: true,
                        createdAt: true
                    }
                }
            },
            orderBy: {
                appliedAt: 'desc' // Most recent applications first
            }
        });

        // Transform and structure the response data
        const candidateData = {
            id: candidate.id,
            fullName: `${candidate.firstName} ${candidate.lastName}`,
            firstName: candidate.firstName,
            lastName: candidate.lastName,
            email: candidate.email,
            phone: candidate.phone,
            currentLocation: candidate.currentLocation,
            keySkills: candidate.keySkills,
            salaryExpectation: candidate.salaryExpectation,
            noticePeriod: candidate.noticePeriod,
            yearsOfExperience: candidate.yearsOfExperience,
            remoteWork: candidate.remoteWork,
            startDate: candidate.startDate,
            portfolioUrl: candidate.portfolioUrl,
            status: candidate.status,
            appliedAt: candidate.appliedAt,
            updatedAt: candidate.updatedAt,
            // Generate resume download URL if resume exists
            resumeDownloadUrl: candidate.resumeFilePath ?
                `${PRODUCTION_BASE_URL}/api/candidates/${candidate.id}/resume` : null,
            totalApplications: allApplications.length,
            // Map all applications with their status and job details
            appliedJobs: allApplications.map(app => ({
                applicationId: app.id,
                applicationStatus: app.status,
                appliedAt: app.appliedAt,
                job: app.job
            }))
        };

        res.status(200).json(candidateData);

    } catch (error) {
        res.status(500).json({ message: 'Error fetching candidate details', error: error.message });
    }
};

/**
 * Download Candidate Resume
 * 
 * Downloads the resume file for a specific candidate with proper content-type headers.
 * Supports multiple file formats and handles missing files gracefully.
 * 
 * @param {Object} req - Express request object
 * @param {Object} req.params - Path parameters
 * @param {string} req.params.candidateId - The candidate ID
 * @param {Object} res - Express response object
 */
export const downloadResume = async(req, res) => {
    try {
        const { candidateId } = req.params;

        // Find the candidate by ID
        const candidate = await prisma.CandidateApplication.findUnique({
            where: { id: parseInt(candidateId) }
        });

        if (!candidate) {
            return res.status(404).json({ message: 'Candidate not found' });
        }

        // Check if candidate has a resume file
        if (!candidate.resumeFilePath) {
            return res.status(404).json({ message: 'Resume not found for this candidate' });
        }

        // Normalize the file path to handle both relative and absolute paths
        let filePath = candidate.resumeFilePath;

        // If the path doesn't start with ./uploads, assume it's relative to uploads/candidate_user
        if (!filePath.startsWith('./uploads/')) {
            filePath = `./uploads/candidate_user/${path.basename(filePath)}`;
        }

        // Verify the file exists on the filesystem
        if (!fs.existsSync(filePath)) {
            console.error(`Resume file not found: ${filePath}`);
            console.error(`Original path from DB: ${candidate.resumeFilePath}`);
            return res.status(404).json({
                message: 'Resume file not found on server',
                originalPath: candidate.resumeFilePath,
                resolvedPath: filePath
            });
        }

        // Determine content type based on file extension
        const fileExtension = path.extname(filePath).toLowerCase();
        let contentType = 'application/octet-stream';

        // Set appropriate content type for different file formats
        switch (fileExtension) {
            case '.pdf':
                contentType = 'application/pdf';
                break;
            case '.doc':
                contentType = 'application/msword';
                break;
            case '.docx':
                contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
                break;
            case '.jpg':
            case '.jpeg':
                contentType = 'image/jpeg';
                break;
            case '.png':
                contentType = 'image/png';
                break;
        }

        // Set headers for file download
        const fileName = `${candidate.firstName}_${candidate.lastName}_resume${fileExtension}`;

        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.setHeader('Content-Length', fs.statSync(filePath).size);

        // Stream the file for efficient memory usage
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);

    } catch (error) {
        console.error('Error downloading resume:', error);
        res.status(500).json({ message: 'Error downloading resume', error: error.message });
    }
};

/**
 * Get All Candidates Data (Complete)
 * 
 * Retrieves ALL candidates data without pagination - returns everything in one request.
 * This endpoint gives you complete candidate information with all their applications.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getAllCandidatesComplete = async(req, res) => {
    try {
        // Get company ID from query parameters for data isolation
        const { companyId } = req.query;
        const userCompanyId = req.companyId; // From auth middleware

        // Build where clause for company isolation
        let whereClause = {};
        const finalCompanyId = companyId || userCompanyId;
        if (finalCompanyId) {
            whereClause.companyId = parseInt(finalCompanyId);
        }

        // Get ALL candidates without any pagination or limits
        const allCandidates = await prisma.CandidateApplication.findMany({
            where: whereClause,
            include: {
                job: {
                    select: {
                        id: true,
                        title: true,
                        company: true,
                        city: true,
                        jobType: true,
                        experienceLevel: true,
                        workType: true,
                        jobStatus: true,
                        salaryMin: true,
                        salaryMax: true,
                        priority: true,
                        createdAt: true
                    }
                }
            },
            orderBy: {
                appliedAt: 'desc' // Most recent applications first
            }
        });

        // Group candidates by email to get all applications for each candidate
        const candidatesByEmail = {};

        allCandidates.forEach(application => {
            const email = application.email;

            if (!candidatesByEmail[email]) {
                // First time seeing this candidate, create their profile
                candidatesByEmail[email] = {
                    id: application.id,
                    fullName: `${application.firstName} ${application.lastName}`,
                    firstName: application.firstName,
                    lastName: application.lastName,
                    email: application.email,
                    phone: application.phone,
                    currentLocation: application.currentLocation,
                    keySkills: application.keySkills,
                    salaryExpectation: application.salaryExpectation,
                    noticePeriod: application.noticePeriod,
                    yearsOfExperience: application.yearsOfExperience,
                    remoteWork: application.remoteWork,
                    startDate: application.startDate,
                    portfolioUrl: application.portfolioUrl,
                    status: application.status,
                    appliedAt: application.appliedAt,
                    updatedAt: application.updatedAt,
                    resumeDownloadUrl: application.resumeFilePath ?
                        `${PRODUCTION_BASE_URL}/api/candidates/${application.id}/resume` : null,
                    totalApplications: 0,
                    appliedJobs: []
                };
            }

            // Add this application to the candidate's job list
            candidatesByEmail[email].appliedJobs.push({
                applicationId: application.id,
                applicationStatus: application.status,
                appliedAt: application.appliedAt,
                job: application.job
            });

            // Update total applications count
            candidatesByEmail[email].totalApplications++;
        });

        // Convert to array and sort by most recent application
        const candidatesArray = Object.values(candidatesByEmail).sort((a, b) => {
            return new Date(b.appliedAt) - new Date(a.appliedAt);
        });

        // Return complete data
        res.status(200).json({
            success: true,
            totalCandidates: candidatesArray.length,
            totalApplications: allCandidates.length,
            candidates: candidatesArray,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching all candidates data',
            error: error.message
        });
    }
};

// Utility function to normalize resume file paths
export const normalizeResumePath = (filePath) => {
    if (!filePath) return null;

    // If the path doesn't start with ./uploads, assume it's relative to uploads/candidate_user
    if (!filePath.startsWith('./uploads/')) {
        return `./uploads/candidate_user/${path.basename(filePath)}`;
    }

    return filePath;
};

// Utility function to check if resume file exists
export const checkResumeExists = (filePath) => {
    if (!filePath) return false;

    const normalizedPath = normalizeResumePath(filePath);
    return fs.existsSync(normalizedPath);
};

/**
 * Get Candidates with AI Analysis Data
 * 
 * Retrieves candidates with mock AI analysis data for the AI analysis page.
 * This endpoint provides candidates with simulated AI scores and analysis.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getCandidatesWithAIAnalysis = async(req, res) => {
    try {
        console.log('🔍 AI Analysis - Starting request');
        console.log('🔍 AI Analysis - Request query:', req.query);
        console.log('🔍 AI Analysis - Request headers:', req.headers);

        // Get company ID from query parameters for data isolation
        const { companyId } = req.query;
        const userCompanyId = req.companyId; // From auth middleware

        console.log('🔍 AI Analysis - Query companyId:', companyId);
        console.log('🔍 AI Analysis - Middleware companyId:', userCompanyId);

        // Validate that we have a company ID
        const finalCompanyId = companyId || userCompanyId;
        if (!finalCompanyId) {
            console.log('🔍 AI Analysis - ERROR: No company ID found');
            return res.status(400).json({
                success: false,
                message: 'Company ID is required for data isolation',
                error: 'MISSING_COMPANY_ID'
            });
        }

        // Build where clause for company isolation
        const whereClause = {
            companyId: parseInt(finalCompanyId)
        };

        // Log the query parameters for debugging
        console.log('🔍 AI Analysis - Company ID:', finalCompanyId);
        console.log('🔍 AI Analysis - Where clause:', whereClause);

        // Get candidates with basic info
        const candidates = await prisma.CandidateApplication.findMany({
            where: whereClause,
            include: {
                job: {
                    select: {
                        id: true,
                        title: true,
                        company: true,
                        city: true,
                        jobType: true,
                        experienceLevel: true,
                        workType: true,
                        jobStatus: true,
                        salaryMin: true,
                        salaryMax: true,
                        priority: true,
                        createdAt: true
                    }
                }
            },
            orderBy: {
                appliedAt: 'desc'
            },
            take: 20 // Limit to 20 candidates for AI analysis
        });

        console.log('🔍 AI Analysis - Found candidates:', candidates.length);

        // Get resume data for candidates to use real parsed data
        const candidateEmails = candidates.map(c => c.email);
        const resumeDataMap = new Map();

        try {
            const resumeData = await prisma.ResumeData.findMany({
                where: {
                    candidate_email: { in: candidateEmails
                    },
                    company_id: parseInt(finalCompanyId)
                },
                orderBy: {
                    created_at: 'desc'
                }
            });

            // Create a map for quick lookup
            resumeData.forEach(resume => {
                if (!resumeDataMap.has(resume.candidate_email)) {
                    resumeDataMap.set(resume.candidate_email, resume);
                }
            });
        } catch (resumeError) {
            console.log('🔍 AI Analysis - Warning: Could not fetch resume data:', resumeError.message);
        }

        // Transform candidates with AI analysis data (real + mock)
        const candidatesWithAI = await Promise.all(candidates.map(async candidate => {
            // Get resume data for this candidate
            const resumeData = resumeDataMap.get(candidate.email);
            let parsedData = null;

            if (resumeData && resumeData.parsed_data) {
                try {
                    parsedData = typeof resumeData.parsed_data === 'string' ?
                        JSON.parse(resumeData.parsed_data) :
                        resumeData.parsed_data;
                } catch (parseError) {
                    console.log('🔍 AI Analysis - Warning: Could not parse resume data for', candidate.email);
                }
            }

            // Use real AI analysis instead of mock scores
            let aiAnalysis = null;
            try {
                // Try to get cached AI analysis first
                const aiAnalysisService = (await
                    import ('../services/aiAnalysisService.js')).default;
                aiAnalysis = await aiAnalysisService.getCachedAnalysis(candidate.id, candidate.job.id, finalCompanyId);

                if (!aiAnalysis) {
                    console.log('🤖 No cached AI analysis found, generating new analysis...');
                    // For now, we'll use a simplified analysis to avoid API calls in the list endpoint
                    // Real AI analysis will be done when user clicks on specific candidate
                    aiAnalysis = {
                        overall_score: 0.5,
                        skills_match_score: 0.5,
                        experience_match_score: 0.5,
                        cultural_fit_score: 0.5,
                        verdict: "consider",
                        confidence: 70,
                        reasoning: "AI analysis pending - click to analyze",
                        strengths: ["Analysis pending"],
                        weaknesses: ["Click to generate AI analysis"],
                        ai_model: "pending",
                        analysis_date: new Date()
                    };
                }
            } catch (aiError) {
                console.log('🤖 AI analysis error, using fallback:', aiError.message);
                // Fallback to basic analysis
                aiAnalysis = {
                    overall_score: 0.5,
                    skills_match_score: 0.5,
                    experience_match_score: 0.5,
                    cultural_fit_score: 0.5,
                    verdict: "consider",
                    confidence: 60,
                    reasoning: "Basic analysis - AI analysis unavailable",
                    strengths: ["Basic analysis available"],
                    weaknesses: ["AI analysis unavailable"],
                    ai_model: "fallback",
                    analysis_date: new Date()
                };
            }

            const overallScore = aiAnalysis.overall_score;
            const skillsScore = aiAnalysis.skills_match_score;
            const experienceScore = aiAnalysis.experience_match_score;
            const culturalFit = aiAnalysis.cultural_fit_score;
            const fitStatus = aiAnalysis.verdict;

            // Extract real data from parsed resume or use fallbacks
            const experienceArray = parsedData && parsedData.Experience && Array.isArray(parsedData.Experience) ?
                parsedData.Experience :
                candidate.yearsOfExperience ? [{
                    Company: "Previous Experience",
                    Position: "Professional Role",
                    Duration: `${candidate.yearsOfExperience} years`,
                    Description: `Professional experience in ${candidate.keySkills || 'various technologies'}`
                }] : [];

            const educationArray = parsedData && parsedData.Education && Array.isArray(parsedData.Education) ?
                parsedData.Education : [];

            const projectsArray = parsedData && parsedData.Projects && Array.isArray(parsedData.Projects) ?
                parsedData.Projects : [];

            return {
                id: candidate.id.toString(),
                fullName: `${candidate.firstName} ${candidate.lastName}`,
                firstName: candidate.firstName,
                lastName: candidate.lastName,
                email: candidate.email,
                phone: candidate.phone,
                currentLocation: candidate.currentLocation,
                keySkills: candidate.keySkills,
                salaryExpectation: candidate.salaryExpectation,
                noticePeriod: candidate.noticePeriod,
                yearsOfExperience: candidate.yearsOfExperience,
                remoteWork: candidate.remoteWork,
                startDate: candidate.startDate,
                portfolioUrl: candidate.portfolioUrl,
                status: candidate.status,
                appliedAt: candidate.appliedAt,
                updatedAt: candidate.updatedAt,
                resumeDownloadUrl: candidate.resumeFilePath ?
                    `${PRODUCTION_BASE_URL}/api/candidates/${candidate.id}/resume` : null,
                // AI analysis data
                overall_score: {
                    score: overallScore,
                    fit_status: fitStatus,
                    explanation: aiAnalysis.reasoning
                },
                skills_matched_score: {
                    score: skillsScore,
                    explanation: `Skills match: ${Math.round(skillsScore * 100)}% - ${aiAnalysis.strengths[0] || 'Strong alignment with required technical competencies'}.`
                },
                experience_score: {
                    score: experienceScore,
                    explanation: `Experience level: ${Math.round(experienceScore * 100)}% - ${candidate.yearsOfExperience || 0} years of relevant experience.`
                },
                candidate_data: {
                    Phone: candidate.phone,
                    Experience: experienceArray, // Now properly structured as array
                    Education: educationArray, // Real or empty array
                    Projects: projectsArray, // Real or empty array
                    GitHub: (parsedData && parsedData.GitHub) || candidate.portfolioUrl || null
                },
                skills: candidate.keySkills ? candidate.keySkills.split(',').map(s => s.trim()) : [],
                location: candidate.currentLocation,
                experience: candidate.yearsOfExperience ? `${candidate.yearsOfExperience} years` : 'Not specified',
                appliedJobs: [candidate.job]
            };
        }));

        res.status(200).json({
            success: true,
            candidates: candidatesWithAI,
            totalCandidates: candidatesWithAI.length,
            message: 'Candidates with AI analysis data retrieved successfully'
        });

    } catch (error) {
        console.error('Error fetching candidates with AI analysis:', error);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            meta: error.meta,
            stack: error.stack
        });

        // Provide more specific error messages based on error type
        let errorMessage = 'Error fetching candidates with AI analysis';
        if (error.code === 'P2002') {
            errorMessage = 'Database constraint violation';
        } else if (error.code === 'P2025') {
            errorMessage = 'Record not found';
        } else if (error.message.includes('Invalid `prisma.candidateApplication.findFirst()` invocation')) {
            errorMessage = 'Database query error - missing required parameters';
        }

        res.status(500).json({
            success: false,
            message: errorMessage,
            error: error.message,
            code: error.code || 'UNKNOWN_ERROR'
        });
    }
};

// Get all candidates with parsed resume data
export const getAllCandidatesWithResumeData = async(req, res) => {
    try {
        console.log('🔍 Get All Candidates - Starting request');
        const userCompanyId = req.companyId;
        const { page = 1, limit = 20, search = '', status = 'all' } = req.query;

        console.log('🔍 Get All Candidates - Company ID:', userCompanyId);
        console.log('🔍 Get All Candidates - Query params:', { page, limit, search, status });

        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Build where clause
        const whereClause = {
            companyId: userCompanyId
        };

        // Add search filter
        if (search) {
            whereClause.OR = [
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { keySkills: { contains: search, mode: 'insensitive' } }
            ];
        }

        // Add status filter
        if (status && status !== 'all') {
            whereClause.status = status;
        }

        console.log('🔍 Get All Candidates - Where clause:', whereClause);

        // Get candidates with pagination
        const [candidates, totalCount] = await Promise.all([
            prisma.CandidateApplication.findMany({
                where: whereClause,
                include: {
                    job: {
                        select: {
                            id: true,
                            title: true,
                            company: true,
                            city: true,
                            jobType: true,
                            experienceLevel: true,
                            workType: true,
                            jobStatus: true,
                            salaryMin: true,
                            salaryMax: true,
                            priority: true,
                            createdAt: true
                        }
                    }
                },
                orderBy: {
                    appliedAt: 'desc'
                },
                skip: skip,
                take: parseInt(limit)
            }),
            prisma.CandidateApplication.count({
                where: whereClause
            })
        ]);

        console.log('🔍 Get All Candidates - Found candidates:', candidates.length);
        console.log('🔍 Get All Candidates - Total count:', totalCount);

        // Get parsed resume data for each candidate
        const candidatesWithResumeData = await Promise.all(
            candidates.map(async(candidate) => {
                // Try to find parsed resume data
                let parsedResumeData = null;
                try {
                    const resumeData = await prisma.ResumeData.findFirst({
                        where: {
                            candidate_email: candidate.email,
                            company_id: userCompanyId
                        },
                        orderBy: {
                            created_at: 'desc'
                        }
                    });

                    if (resumeData) {
                        parsedResumeData = {
                            id: resumeData.id,
                            filename: resumeData.filename,
                            file_path: resumeData.file_path,
                            file_type: resumeData.file_type,
                            candidate_name: resumeData.candidate_name,
                            candidate_email: resumeData.candidate_email,
                            candidate_phone: resumeData.candidate_phone,
                            total_experience: resumeData.total_experience,
                            parsed_data: resumeData.parsed_data,
                            created_at: resumeData.created_at
                        };
                    }
                } catch (error) {
                    console.log('🔍 Get All Candidates - Error fetching resume data for candidate:', candidate.id, error.message);
                }

                return {
                    ...candidate,
                    parsedResumeData
                };
            })
        );

        res.json({
            success: true,
            candidates: candidatesWithResumeData,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalCount / parseInt(limit)),
                totalCount: totalCount,
                hasNext: skip + parseInt(limit) < totalCount,
                hasPrev: parseInt(page) > 1
            }
        });

    } catch (error) {
        console.error('Error fetching all candidates:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching candidates',
            error: error.message
        });
    }
};

// Get candidate by ID with full details
export const getCandidateDetails = async(req, res) => {
    try {
        const { candidateId } = req.params;
        const userCompanyId = req.companyId;

        console.log('🔍 Get Candidate Details - Candidate ID:', candidateId);
        console.log('🔍 Get Candidate Details - Company ID:', userCompanyId);

        // Get candidate with all related data
        const candidate = await prisma.CandidateApplication.findFirst({
            where: {
                id: parseInt(candidateId),
                companyId: userCompanyId
            },
            include: {
                job: {
                    select: {
                        id: true,
                        title: true,
                        company: true,
                        city: true,
                        jobType: true,
                        experienceLevel: true,
                        workType: true,
                        jobStatus: true,
                        salaryMin: true,
                        salaryMax: true,
                        priority: true,
                        description: true,
                        requirements: true,
                        requiredSkills: true,
                        benefits: true,
                        createdAt: true
                    }
                }
            }
        });

        if (!candidate) {
            return res.status(404).json({
                success: false,
                message: 'Candidate not found or access denied'
            });
        }

        // Get parsed resume data
        let parsedResumeData = null;
        try {
            const resumeData = await prisma.ResumeData.findFirst({
                where: {
                    candidate_email: candidate.email,
                    company_id: userCompanyId
                },
                orderBy: {
                    created_at: 'desc'
                }
            });

            if (resumeData) {
                parsedResumeData = {
                    id: resumeData.id,
                    filename: resumeData.filename,
                    file_path: resumeData.file_path,
                    file_type: resumeData.file_type,
                    candidate_name: resumeData.candidate_name,
                    candidate_email: resumeData.candidate_email,
                    candidate_phone: resumeData.candidate_phone,
                    total_experience: resumeData.total_experience,
                    parsed_data: resumeData.parsed_data,
                    created_at: resumeData.created_at
                };
            }
        } catch (error) {
            console.log('🔍 Get Candidate Details - Error fetching resume data:', error.message);
        }

        res.json({
            success: true,
            candidate: {
                ...candidate,
                parsedResumeData
            }
        });

    } catch (error) {
        console.error('Error fetching candidate details:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching candidate details',
            error: error.message
        });
    }
};

// Create candidate from parsed resume data
export const createCandidatesFromResumeData = async(req, res) => {
    try {
        const { resumeDataIds, jobId } = req.body;
        const userCompanyId = req.companyId;

        console.log('🔍 Bulk Create Candidates - Resume Data IDs:', resumeDataIds);
        console.log('🔍 Bulk Create Candidates - Job ID:', jobId);
        console.log('🔍 Bulk Create Candidates - Company ID:', userCompanyId);

        if (!resumeDataIds || !Array.isArray(resumeDataIds) || resumeDataIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Resume data IDs array is required'
            });
        }

        // Determine target jobId: use provided or allow null (general pool)
        let targetJobId = null;
        if (jobId) {
            targetJobId = parseInt(jobId);
            console.log('🔍 Bulk Create - Using provided jobId:', targetJobId);
        } else {
            // Allow null jobId for bulk operations too
            console.log('🔍 Bulk Create - No jobId provided, creating candidates in general pool');
            targetJobId = null;
        }

        const results = [];
        let successCount = 0;
        let failureCount = 0;

        for (const resumeDataId of resumeDataIds) {
            try {
                // Get parsed resume data
                const resumeData = await prisma.ResumeData.findFirst({
                    where: {
                        id: parseInt(resumeDataId),
                        company_id: userCompanyId
                    }
                });

                if (!resumeData) {
                    results.push({
                        resumeDataId: parseInt(resumeDataId),
                        status: 'failed',
                        error: 'Resume data not found'
                    });
                    failureCount++;
                    continue;
                }

                // Normalize email
                const parsedData = resumeData.parsed_data;
                const extractedEmail = (parsedData && parsedData.Email ? parsedData.Email : null) || resumeData.candidate_email || '';
                const normalizedEmail = (extractedEmail || '').trim().toLowerCase();

                // Skip if no usable email
                if (!normalizedEmail) {
                    results.push({
                        resumeDataId: parseInt(resumeDataId),
                        status: 'skipped',
                        message: 'No email found to uniquely identify candidate'
                    });
                    continue;
                }

                // Check if candidate already exists for this email, company, and job
                const existingCandidate = await prisma.CandidateApplication.findFirst({
                    where: {
                        email: normalizedEmail,
                        companyId: userCompanyId,
                        jobId: targetJobId
                    }
                });

                if (existingCandidate) {
                    results.push({
                        resumeDataId: parseInt(resumeDataId),
                        status: 'duplicate',
                        candidateId: existingCandidate.id,
                        message: 'Candidate already exists'
                    });
                    continue;
                }

                // Extract candidate information from parsed data
                const firstName = (parsedData && parsedData.Name ? parsedData.Name.split(' ')[0] : null) ||
                    (resumeData.candidate_name ? resumeData.candidate_name.split(' ')[0] : null) || 'Unknown';
                const lastName = (parsedData && parsedData.Name ? parsedData.Name.split(' ').slice(1).join(' ') : null) ||
                    (resumeData.candidate_name ? resumeData.candidate_name.split(' ').slice(1).join(' ') : null) || '';
                const email = normalizedEmail;
                const phone = (parsedData && parsedData.Phone ? parsedData.Phone : null) || resumeData.candidate_phone || '';
                const keySkills = (parsedData && parsedData.Skills ? parsedData.Skills.join(', ') : null) ||
                    (parsedData && parsedData.KeySkills ? parsedData.KeySkills.join(', ') : null) || '';
                const yearsOfExperience = (parsedData && parsedData.TotalExperience ? parsedData.TotalExperience : null) || resumeData.total_experience || '0';
                const currentLocation = (parsedData && parsedData.Location ? parsedData.Location : null) ||
                    (parsedData && parsedData.CurrentLocation ? parsedData.CurrentLocation : null) || '';
                const salaryExpectation = (parsedData && parsedData.SalaryExpectation ? parsedData.SalaryExpectation : null) ||
                    (parsedData && parsedData.ExpectedSalary ? parsedData.ExpectedSalary : null) || '';

                // Create candidate application
                let candidate;
                try {
                    candidate = await prisma.CandidateApplication.create({
                        data: {
                            companyId: userCompanyId,
                            jobId: targetJobId,
                            firstName: firstName,
                            lastName: lastName,
                            email: email,
                            phone: phone,
                            keySkills: keySkills,
                            yearsOfExperience: (typeof yearsOfExperience === 'number' ? String(yearsOfExperience) : String(yearsOfExperience || '0')),
                            currentLocation: currentLocation,
                            salaryExpectation: salaryExpectation ? parseInt(salaryExpectation) || null : null,
                            resumeFilePath: resumeData.file_path || '',
                            status: 'pending',
                            appliedAt: new Date(),
                            coverLetter: (parsedData && parsedData.CoverLetter ? parsedData.CoverLetter : null) || '',
                            portfolioUrl: (parsedData && parsedData.Portfolio ? parsedData.Portfolio : null) ||
                                (parsedData && parsedData.PortfolioUrl ? parsedData.PortfolioUrl : null) || '',
                            noticePeriod: (parsedData && parsedData.NoticePeriod ? parsedData.NoticePeriod : null) || '',
                            remoteWork: (parsedData && parsedData.RemoteWork ? parsedData.RemoteWork : null) || false,
                            startDate: (parsedData && parsedData.StartDate ? String(parsedData.StartDate) : null)
                        }
                    });
                } catch (e) {
                    // Handle unique constraint violation gracefully
                    if (e && e.code === 'P2002') {
                        results.push({
                            resumeDataId: parseInt(resumeDataId),
                            status: 'duplicate',
                            message: 'Candidate already exists (unique constraint)'
                        });
                        continue;
                    }
                    throw e;
                }

                results.push({
                    resumeDataId: parseInt(resumeDataId),
                    status: 'success',
                    candidateId: candidate.id,
                    message: 'Candidate created successfully'
                });
                successCount++;

            } catch (error) {
                console.error('Error creating candidate from resume data ID', resumeDataId, ':', error);
                results.push({
                    resumeDataId: parseInt(resumeDataId),
                    status: 'failed',
                    error: error.message
                });
                failureCount++;
            }
        }

        console.log('🔍 Bulk Create Candidates - Results:', { successCount, failureCount, total: resumeDataIds.length });

        res.json({
            success: true,
            message: `Processed ${resumeDataIds.length} resume data entries`,
            results: results,
            summary: {
                total: resumeDataIds.length,
                success: successCount,
                failed: failureCount,
                duplicates: results.filter(r => r.status === 'duplicate').length
            }
        });

    } catch (error) {
        console.error('Error in bulk candidate creation:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating candidates from resume data',
            error: error.message
        });
    }
};

export const createCandidateFromResume = async(req, res) => {
    try {
        const { resumeDataId, jobId } = req.body;
        const userCompanyId = req.companyId;

        console.log('🔍 Create Candidate From Resume - Resume Data ID:', resumeDataId);
        console.log('🔍 Create Candidate From Resume - Job ID:', jobId);
        console.log('🔍 Create Candidate From Resume - Company ID:', userCompanyId);

        if (!resumeDataId) {
            return res.status(400).json({
                success: false,
                message: 'Resume data ID is required'
            });
        }

        // Get parsed resume data
        const resumeData = await prisma.ResumeData.findFirst({
            where: {
                id: parseInt(resumeDataId),
                company_id: userCompanyId
            }
        });

        if (!resumeData) {
            return res.status(404).json({
                success: false,
                message: 'Resume data not found'
            });
        }

        // Extract candidate information from parsed data
        const parsedData = resumeData.parsed_data;
        const firstName = (parsedData && parsedData.Name ? parsedData.Name.split(' ')[0] : null) ||
            (resumeData.candidate_name ? resumeData.candidate_name.split(' ')[0] : null) || 'Unknown';
        const lastName = (parsedData && parsedData.Name ? parsedData.Name.split(' ').slice(1).join(' ') : null) ||
            (resumeData.candidate_name ? resumeData.candidate_name.split(' ').slice(1).join(' ') : null) || '';
        const email = (((parsedData && parsedData.Email ? parsedData.Email : null) || resumeData.candidate_email || '')).trim().toLowerCase();
        const phone = (parsedData && parsedData.Phone ? parsedData.Phone : null) || resumeData.candidate_phone || '';
        const keySkills = (parsedData && parsedData.Skills ? parsedData.Skills.join(', ') : null) ||
            (parsedData && parsedData.KeySkills ? parsedData.KeySkills.join(', ') : null) || '';
        const yearsOfExperience = (parsedData && parsedData.TotalExperience ? parsedData.TotalExperience : null) || resumeData.total_experience || '0';
        const currentLocation = (parsedData && parsedData.Location ? parsedData.Location : null) ||
            (parsedData && parsedData.CurrentLocation ? parsedData.CurrentLocation : null) || '';
        const salaryExpectation = (parsedData && parsedData.SalaryExpectation ? parsedData.SalaryExpectation : null) ||
            (parsedData && parsedData.ExpectedSalary ? parsedData.ExpectedSalary : null) || '';

        // Determine target jobId: use provided or allow null (candidate without specific job)
        let targetJobId = null;
        if (jobId) {
            targetJobId = parseInt(jobId);
            console.log('🔍 Create Candidate - Using provided jobId:', targetJobId);
        } else {
            // Allow null jobId - candidate can be added to general pool
            console.log('🔍 Create Candidate - No jobId provided, creating candidate in general pool');
            targetJobId = null;
        }

        // Prevent duplicate per (company, email, job)
        // If jobId is null, check for duplicate by email only
        const whereClause = targetJobId ?
            { companyId: userCompanyId, email: email, jobId: targetJobId } :
            { companyId: userCompanyId, email: email, jobId: null };

        const existingCandidate = await prisma.CandidateApplication.findFirst({
            where: whereClause
        });
        if (existingCandidate) {
            return res.status(200).json({
                success: true,
                duplicate: true,
                candidateId: existingCandidate.id,
                message: 'Candidate already exists for this job'
            });
        }

        // Create candidate application
        const candidate = await prisma.CandidateApplication.create({
            data: {
                companyId: userCompanyId,
                jobId: targetJobId,
                firstName: firstName,
                lastName: lastName,
                email: email,
                phone: phone,
                keySkills: keySkills,
                // Schema expects String; store numeric as string if parsed
                yearsOfExperience: (typeof yearsOfExperience === 'number' ? String(yearsOfExperience) : String(yearsOfExperience || '0')),
                currentLocation: currentLocation,
                // Schema expects Int?; coerce to integer or null
                salaryExpectation: salaryExpectation ? parseInt(salaryExpectation) || null : null,
                resumeFilePath: resumeData.file_path || '',
                // Align with schema default "pending" if not provided
                status: 'pending',
                appliedAt: new Date(),
                coverLetter: (parsedData && parsedData.CoverLetter ? parsedData.CoverLetter : null) || '',
                portfolioUrl: (parsedData && parsedData.Portfolio ? parsedData.Portfolio : null) ||
                    (parsedData && parsedData.PortfolioUrl ? parsedData.PortfolioUrl : null) || '',
                noticePeriod: (parsedData && parsedData.NoticePeriod ? parsedData.NoticePeriod : null) || '',
                remoteWork: (parsedData && parsedData.RemoteWork ? parsedData.RemoteWork : null) || false,
                // Schema expects String? for startDate; store ISO string if available
                startDate: (parsedData && parsedData.StartDate ? String(parsedData.StartDate) : null)
            }
        });

        console.log('🔍 Create Candidate From Resume - Created candidate:', candidate.id);

        res.json({
            success: true,
            message: 'Candidate created successfully',
            candidate: candidate
        });

    } catch (error) {
        console.error('Error creating candidate from resume:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating candidate from resume',
            error: error.message
        });
    }
};

// Get parsed resume data for company
// Re-upload failed resumes
export const reUploadFailedResumes = async(req, res) => {
    try {
        const { failed_resume_ids } = req.body;
        const userCompanyId = req.companyId;

        console.log('🔄 Re-upload Failed Resumes - Company ID:', userCompanyId);
        console.log('🔄 Re-upload Failed Resumes - Resume IDs:', failed_resume_ids);

        if (!failed_resume_ids || !Array.isArray(failed_resume_ids) || failed_resume_ids.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No failed resume IDs provided'
            });
        }

        // Generate unique job ID for tracking
        const jobId = `reupload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Create job tracking record in database
        const jobRecord = await prisma.ReuploadJob.create({
            data: {
                jobId: jobId,
                companyId: userCompanyId,
                status: 'pending',
                failedResumeIds: failed_resume_ids,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        });

        console.log('✅ Re-upload job created:', jobId);

        // Send files to Python backend for processing
        try {
            const pythonResponse = await fetch('http://localhost:8000/api/v1/re-upload-failed-resumes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': req.headers.authorization
                },
                body: JSON.stringify({
                    failed_resume_ids: failed_resume_ids,
                    job_id: jobId,
                    company_id: userCompanyId
                })
            });

            if (pythonResponse.ok) {
                const pythonData = await pythonResponse.json();
                console.log('✅ Python backend response:', pythonData);

                // Update job status to processing
                await prisma.ReuploadJob.update({
                    where: { id: jobRecord.id },
                    data: {
                        status: 'processing',
                        updatedAt: new Date()
                    }
                });

                return res.json({
                    success: true,
                    message: 'Re-upload job created successfully',
                    job_id: jobId,
                    total_files: failed_resume_ids.length,
                    python_response: pythonData
                });
            } else {
                const errorText = await pythonResponse.text();
                console.error('❌ Python backend error:', errorText);

                // Update job status to failed
                await prisma.ReuploadJob.update({
                    where: { id: jobRecord.id },
                    data: {
                        status: 'failed',
                        results: { error: errorText },
                        updatedAt: new Date()
                    }
                });

                return res.status(500).json({
                    success: false,
                    message: 'Failed to process re-upload with Python backend',
                    error: errorText
                });
            }
        } catch (pythonError) {
            console.error('❌ Python backend connection error:', pythonError);

            // Update job status to failed
            await prisma.ReuploadJob.update({
                where: { id: jobRecord.id },
                data: {
                    status: 'failed',
                    results: { error: pythonError.message },
                    updatedAt: new Date()
                }
            });

            return res.status(500).json({
                success: false,
                message: 'Failed to connect to Python backend',
                error: pythonError.message
            });
        }

    } catch (error) {
        console.error('❌ Re-upload failed resumes error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error processing re-upload request',
            error: error.message
        });
    }
};

// Get re-upload job status
export const getReuploadJobStatus = async(req, res) => {
    try {
        const { jobId } = req.params;
        const userCompanyId = req.companyId;

        console.log('🔍 Get Re-upload Job Status - Job ID:', jobId);
        console.log('🔍 Get Re-upload Job Status - Company ID:', userCompanyId);

        // Get job from database
        const job = await prisma.ReuploadJob.findFirst({
            where: {
                jobId: jobId,
                companyId: userCompanyId
            }
        });

        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found'
            });
        }

        // If job is still processing, try to get status from Python backend
        if (job.status === 'processing') {
            try {
                const pythonResponse = await fetch(`http://localhost:8000/api/v1/job-status/${jobId}`, {
                    headers: {
                        'Authorization': req.headers.authorization
                    }
                });

                if (pythonResponse.ok) {
                    const pythonData = await pythonResponse.json();

                    // Update job status based on Python response
                    const newStatus = pythonData.status || job.status;
                    await prisma.ReuploadJob.update({
                        where: { id: job.id },
                        data: {
                            status: newStatus,
                            results: pythonData,
                            updatedAt: new Date()
                        }
                    });

                    return res.json({
                        success: true,
                        job_id: jobId,
                        status: newStatus,
                        results: pythonData,
                        created_at: job.createdAt,
                        updated_at: new Date()
                    });
                }
            } catch (pythonError) {
                console.error('❌ Error fetching status from Python backend:', pythonError);
            }
        }

        return res.json({
            success: true,
            job_id: jobId,
            status: job.status,
            results: job.results,
            created_at: job.createdAt,
            updated_at: job.updatedAt
        });

    } catch (error) {
        console.error('❌ Get re-upload job status error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching job status',
            error: error.message
        });
    }
};

// Get all re-upload jobs for company
export const getAllReuploadJobs = async(req, res) => {
    try {
        const userCompanyId = req.companyId;
        const { page = 1, limit = 20 } = req.query;

        console.log('🔍 Get All Re-upload Jobs - Company ID:', userCompanyId);

        const jobs = await prisma.ReuploadJob.findMany({
            where: {
                companyId: userCompanyId
            },
            orderBy: {
                createdAt: 'desc'
            },
            skip: (page - 1) * limit,
            take: parseInt(limit)
        });

        const totalJobs = await prisma.ReuploadJob.count({
            where: {
                companyId: userCompanyId
            }
        });

        return res.json({
            success: true,
            jobs: jobs,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: totalJobs,
                pages: Math.ceil(totalJobs / limit)
            }
        });

    } catch (error) {
        console.error('❌ Get all re-upload jobs error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching re-upload jobs',
            error: error.message
        });
    }
};

export const getParsedResumeData = async(req, res) => {
    try {
        const userCompanyId = req.companyId;
        const { page = 1, limit = 20, search = '' } = req.query;

        console.log('🔍 Get Parsed Resume Data - Company ID:', userCompanyId);
        console.log('🔍 Get Parsed Resume Data - Query params:', { page, limit, search });

        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Build where clause
        const whereClause = {
            company_id: userCompanyId
        };

        // Add search filter
        if (search) {
            whereClause.OR = [
                { candidate_name: { contains: search, mode: 'insensitive' } },
                { candidate_email: { contains: search, mode: 'insensitive' } },
                { filename: { contains: search, mode: 'insensitive' } }
            ];
        }

        // Get parsed resume data with pagination
        const [resumeData, totalCount] = await Promise.all([
            prisma.ResumeData.findMany({
                where: whereClause,
                orderBy: {
                    created_at: 'desc'
                },
                skip: skip,
                take: parseInt(limit)
            }),
            prisma.ResumeData.count({
                where: whereClause
            })
        ]);

        console.log('🔍 Get Parsed Resume Data - Found records:', resumeData.length);
        console.log('🔍 Get Parsed Resume Data - Total count:', totalCount);

        res.json({
            success: true,
            resumeData: resumeData,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalCount / parseInt(limit)),
                totalCount: totalCount,
                hasNext: skip + parseInt(limit) < totalCount,
                hasPrev: parseInt(page) > 1
            }
        });

    } catch (error) {
        console.error('Error fetching parsed resume data:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching parsed resume data',
            error: error.message
        });
    }
};

/**
 * Delete Candidate
 * 
 * Deletes a candidate and all related data including resume files and interview schedules.
 * 
 * @param {Object} req - Express request object
 * @param {Object} req.params - Path parameters
 * @param {string} req.params.candidateId - The candidate ID to delete
 * @param {Object} res - Express response object
 */
export const deleteCandidate = async(req, res) => {
    try {
        const { candidateId } = req.params;
        const userCompanyId = req.companyId;

        console.log('🗑️ Delete Candidate - Request received');
        console.log('🗑️ Delete Candidate - Candidate ID:', candidateId);
        console.log('🗑️ Delete Candidate - Company ID:', userCompanyId);
        console.log('🗑️ Delete Candidate - Request headers:', req.headers);
        console.log('🗑️ Delete Candidate - Request body:', req.body);

        // Validate candidate ID
        const candidateIdInt = parseInt(candidateId);
        if (!candidateIdInt || isNaN(candidateIdInt)) {
            console.log('🗑️ Delete Candidate - Invalid candidate ID:', candidateId);
            return res.status(400).json({
                success: false,
                message: 'Invalid candidate ID'
            });
        }

        // Get candidate data before deletion for logging and file cleanup
        console.log('🗑️ Delete Candidate - Querying database with:', {
            id: candidateIdInt,
            companyId: userCompanyId
        });

        const candidate = await prisma.CandidateApplication.findFirst({
            where: {
                id: candidateIdInt,
                companyId: userCompanyId
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                resumeFilePath: true,
                appliedAt: true
            }
        });

        console.log('🗑️ Delete Candidate - Database query result:', candidate);

        if (!candidate) {
            console.log('🗑️ Delete Candidate - Candidate not found in database');
            // Let's also check if candidate exists without company filter
            const candidateWithoutCompany = await prisma.CandidateApplication.findFirst({
                where: { id: candidateIdInt },
                select: { id: true, companyId: true, firstName: true, lastName: true }
            });
            console.log('🗑️ Delete Candidate - Candidate without company filter:', candidateWithoutCompany);

            return res.status(404).json({
                success: false,
                message: 'Candidate not found or access denied'
            });
        }

        console.log('🗑️ Delete Candidate - Found candidate:', {
            id: candidate.id,
            name: `${candidate.firstName} ${candidate.lastName}`,
            email: candidate.email
        });

        // Delete resume file if it exists
        if (candidate.resumeFilePath) {
            try {
                // Normalize the file path
                let filePath = candidate.resumeFilePath;
                if (!filePath.startsWith('./uploads/')) {
                    filePath = `./uploads/candidate_user/${path.basename(filePath)}`;
                }

                // Check if file exists and delete it
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                    console.log('🗑️ Delete Candidate - Deleted resume file:', filePath);
                } else {
                    console.log('🗑️ Delete Candidate - Resume file not found:', filePath);
                }
            } catch (fileError) {
                console.error('🗑️ Delete Candidate - Error deleting resume file:', fileError);
                // Don't fail the deletion if file deletion fails
            }
        }

        // Delete the candidate (this will cascade delete interview schedules due to onDelete: Cascade)
        await prisma.CandidateApplication.delete({
            where: {
                id: candidateIdInt
            }
        });

        console.log('🗑️ Delete Candidate - Successfully deleted candidate:', candidateIdInt);

        res.json({
            success: true,
            message: 'Candidate deleted successfully',
            deletedCandidate: {
                id: candidate.id,
                name: `${candidate.firstName} ${candidate.lastName}`,
                email: candidate.email
            }
        });

    } catch (error) {
        console.error('🗑️ Delete Candidate - Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting candidate',
            error: error.message
        });
    }
};