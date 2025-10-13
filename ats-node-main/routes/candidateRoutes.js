import express from 'express';
import prisma from '../prismaClient.js';
import { companyAuth, requireCompany } from '../middlewares/companyAuth.js';
import {
    getJobForApplication,
    submitJobApplication,
    getApplicationStatus,
    getCandidateById,
    downloadResume,
    getAllCandidatesComplete,
    getCandidatesWithAIAnalysis,
    upload,
    getCandidateDetails,
    createCandidateFromResume,
    createCandidatesFromResumeData,
    getParsedResumeData,
    getAllCandidatesWithResumeData,
    backfillCandidatesFromResumeData,
    deleteCandidate
} from '../controllers/candidateController.js';
import { getAllCandidatesPipelineStatus } from '../controllers/pipelineController.js';

const router = express.Router();

// Full descriptive URL routes (like Naukri.com) - No auth required for public job applications
router.get('/job-listings/:slug', getJobForApplication);
router.post('/job-listings/:slug/apply', upload.single('resume'), submitJobApplication);

// Simple public job endpoint by ID - No auth required
router.get('/public/job/:jobId', async(req, res) => {
    try {
        const { jobId } = req.params;

        // Validate jobId
        if (!jobId || isNaN(parseInt(jobId))) {
            return res.status(400).json({
                success: false,
                message: 'Invalid job ID'
            });
        }

        const job = await prisma.ats_JobPost.findUnique({
            where: { id: parseInt(jobId) },
            select: {
                id: true,
                title: true,
                company: true,
                companyName: true,
                companyLogo: true,
                location: true,
                fullLocation: true,
                country: true,
                city: true,
                jobType: true,
                salaryMin: true,
                salaryMax: true,
                description: true,
                requirements: true,
                requiredSkills: true,
                experienceLevel: true,
                jobStatus: true,
                priority: true,
                createdAt: true,
                updatedAt: true,
                internalSPOC: true,
                recruiter: true,
                department: true,
                workType: true,
                benefits: true,
                applicants: true,
                views: true,
                companyId: true
            }
        });

        if (!job || job.jobStatus !== 'ACTIVE') {
            return res.status(404).json({
                success: false,
                message: 'Job not found or no longer available'
            });
        }

        res.json({
            success: true,
            job
        });

    } catch (error) {
        console.error('Error fetching public job:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Application status - No auth required for public application status
router.get('/application/:applicationId', getApplicationStatus);

// ========================================
// NEW CANDIDATE MANAGEMENT ENDPOINTS
// ========================================

// Apply company authentication to all candidate management routes - REMOVED
// Each route now has explicit companyAuth middleware
// router.use('/candidates', companyAuth);

/**
 * GET /api/candidates
 * 
 * Retrieves a paginated list of all candidates with their applied jobs and resume download URLs.
 * 
 * Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Number of candidates per page (default: 10)
 * - status: Filter by application status (pending, shortlisted, rejected, hired, all)
 * - search: Search in firstName, lastName, email, or keySkills
 * - companyId: Company ID for data isolation (automatically set from auth)
 * 
 * Returns:
 * - candidates: Array of candidate objects with applied jobs
 * - pagination: Pagination metadata
 * 
 * Example: GET /api/candidates?page=1&limit=5&status=pending&search=developer
 */
router.get('/candidates', companyAuth, getAllCandidatesWithResumeData);

/**
 * GET /api/candidates/all
 * 
 * Retrieves ALL candidates data without pagination - returns everything in one request.
 * This endpoint gives you complete candidate information with all their applications.
 * 
 * Returns:
 * - All candidates with complete profiles
 * - All applied jobs for each candidate
 * - Resume download URLs
 * - Total counts and statistics
 * 
 * Example: GET /api/candidates/all
 */
router.get('/candidates/all', companyAuth, getAllCandidatesComplete);

/**
 * GET /api/candidates/pipeline
 * 
 * Retrieves ALL candidates data with their pipeline status information.
 * This endpoint provides complete candidate information including their current
 * pipeline status for each job application, interview schedules, and pipeline statistics.
 * 
 * Returns:
 * - All candidates with complete profiles
 * - Pipeline status for each application
 * - Interview schedules for each candidate
 * - Pipeline statistics and breakdown
 * - Resume download URLs
 * 
 * Example: GET /api/candidates/pipeline
 */
router.get('/candidates/pipeline', companyAuth, getAllCandidatesPipelineStatus);

/**
 * GET /api/candidates/ai-analysis
 * 
 * Retrieves candidates with AI analysis data for the AI analysis page.
 * This endpoint provides candidates with simulated AI scores and analysis.
 * 
 * IMPORTANT: This route MUST come before /candidates/:candidateId routes
 * to avoid "ai-analysis" being interpreted as a candidateId parameter.
 * 
 * Returns:
 * - Candidates with mock AI analysis data
 * - Overall scores, skills match, experience scores
 * - AI explanations and recommendations
 * 
 * Example: GET /api/candidates/ai-analysis
 */
router.get('/candidates/ai-analysis', companyAuth, getCandidatesWithAIAnalysis);

/**
 * POST /api/candidates/create-from-resume
 * 
 * Creates a new candidate application from parsed resume data.
 * 
 * Body Parameters:
 * - resumeDataId: ID of the parsed resume data
 * - jobId: Optional job ID to associate with the application
 * 
 * Returns:
 * - Created candidate application
 * - Success message
 * 
 * Example: POST /api/candidates/create-from-resume
 * Body: { "resumeDataId": 123, "jobId": 456 }
 */
router.post('/candidates/create-from-resume', companyAuth, createCandidateFromResume);

/**
 * POST /api/candidates/create-from-resume-data
 * 
 * Creates multiple candidate applications from parsed resume data (bulk operation).
 * 
 * Body Parameters:
 * - resumeDataIds: Array of parsed resume data IDs
 * - jobId: Optional job ID to associate with all applications
 * 
 * Returns:
 * - Results for each resume data ID (success/failed/duplicate)
 * - Summary statistics
 * 
 * Example: POST /api/candidates/create-from-resume-data
 * Body: { "resumeDataIds": [123, 124, 125], "jobId": 456 }
 */
router.post('/candidates/create-from-resume-data', companyAuth, createCandidatesFromResumeData);


/**
 * DELETE /api/candidates/:candidateId
 * 
 * Deletes a candidate and all associated data from the system.
 * This endpoint provides comprehensive deletion including:
 * - Removes candidate from database
 * - Deletes resume files from filesystem
 * - Cascade deletes interview schedules
 * - Company isolation (only delete candidates from user's company)
 * 
 * Features:
 * - Company isolation (only delete candidates from user's company)
 * - Deletes resume files from filesystem
 * - Cascade deletes interview schedules
 * - Returns deleted candidate information
 * 
 * Example: DELETE /api/candidates/1
 * 
 * Response:
 * - Success: JSON with success status and deleted candidate info
 * - Error: JSON error message if candidate not found or access denied
 */
router.delete('/candidates/:candidateId', companyAuth, deleteCandidate);

/**
 * GET /api/candidates/:candidateId
 * 
 * Retrieves detailed information about a specific candidate including all their job applications.
 * 
 * Path Parameters:
 * - candidateId: The ID of the candidate
 * 
 * Returns:
 * - Complete candidate profile
 * - All applied jobs with application status
 * - Resume download URL
 * - Total number of applications
 * 
 * Example: GET /api/candidates/1
 */
router.get('/candidates/:candidateId', companyAuth, getCandidateById);

/**
 * GET /api/candidates/:candidateId/resume
 * 
 * Downloads the resume file for a specific candidate.
 * 
 * Path Parameters:
 * - candidateId: The ID of the candidate
 * 
 * Features:
 * - Supports multiple file types (PDF, DOC, DOCX, images)
 * - Sets proper content-type headers
 * - Streams file for efficient downloads
 * - Handles missing files gracefully
 * 
 * Example: GET /api/candidates/1/resume
 * 
 * Response:
 * - Success: File download with appropriate headers
 * - Error: JSON error message if file not found
 */
router.get('/candidates/:candidateId/resume', companyAuth, downloadResume);

/**
 * GET /api/candidates/:candidateId/details
 * 
 * Retrieves detailed information about a specific candidate including parsed resume data.
 * 
 * Path Parameters:
 * - candidateId: The ID of the candidate
 * 
 * Returns:
 * - Complete candidate profile with parsed resume data
 * - All applied jobs with application status
 * - Resume download URL
 * - Parsed resume information from ResumeData table
 * 
 * Example: GET /api/candidates/1/details
 */
router.get('/candidates/:candidateId/details', companyAuth, getCandidateDetails);


// Test endpoint to check if candidate exists
router.get('/candidates/:candidateId/test', companyAuth, async(req, res) => {
    try {
        const { candidateId } = req.params;
        const userCompanyId = req.companyId;

        console.log('🧪 Test endpoint - Candidate ID:', candidateId);
        console.log('🧪 Test endpoint - Company ID:', userCompanyId);

        const candidateIdInt = parseInt(candidateId);
        if (!candidateIdInt || isNaN(candidateIdInt)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid candidate ID'
            });
        }

        // Check if candidate exists with company filter
        const candidateWithCompany = await prisma.CandidateApplication.findFirst({
            where: {
                id: candidateIdInt,
                companyId: userCompanyId
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                companyId: true
            }
        });

        // Check if candidate exists without company filter
        const candidateWithoutCompany = await prisma.CandidateApplication.findFirst({
            where: { id: candidateIdInt },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                companyId: true
            }
        });

        // Get all candidates for this company
        const allCandidatesForCompany = await prisma.CandidateApplication.findMany({
            where: { companyId: userCompanyId },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
            },
            take: 5
        });

        res.json({
            success: true,
            candidateId: candidateIdInt,
            companyId: userCompanyId,
            candidateWithCompany,
            candidateWithoutCompany,
            allCandidatesForCompany,
            totalCandidatesForCompany: allCandidatesForCompany.length
        });

    } catch (error) {
        console.error('Test endpoint error:', error);
        res.status(500).json({
            success: false,
            message: 'Test endpoint error',
            error: error.message
        });
    }
});

/**
 * GET /api/resume-data
 * 
 * Retrieves parsed resume data for the company with pagination and search.
 * 
 * Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Number of records per page (default: 20)
 * - search: Search in candidate name, email, or filename
 * 
 * Returns:
 * - Parsed resume data records
 * - Pagination metadata
 * 
 * Example: GET /api/resume-data?page=1&limit=10&search=john
 */
router.get('/resume-data', getParsedResumeData);

/**
 * Re-upload Failed Resumes
 * 
 * Re-processes failed resumes by sending them to the Python backend for enhanced parsing.
 * 
 * Body:
 * - failed_resume_ids: Array of failed resume IDs to re-upload
 * 
 * Returns:
 * - Job ID for tracking
 * - Processing status
 * 
 * Example: POST /api/re-upload-failed-resumes
 */
// Re-upload failed resumes route removed

/**
 * Get Re-upload Job Status
 * 
 * Retrieves the status of a specific re-upload job.
 * 
 * Parameters:
 * - jobId: The job ID to check status for
 * 
 * Returns:
 * - Job status and results
 * 
 * Example: GET /api/reupload-job-status/reupload_1234567890_abc123
 */
// Reupload job status route removed

/**
 * Get All Re-upload Jobs
 * 
 * Retrieves all re-upload jobs for the authenticated company.
 * 
 * Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Number of records per page (default: 20)
 * 
 * Returns:
 * - List of re-upload jobs
 * - Pagination metadata
 * 
 * Example: GET /api/reupload-jobs?page=1&limit=10
 */
// Reupload jobs list route removed

// Manual backfill trigger to convert ResumeData -> CandidateApplication
router.post('/candidates/backfill', companyAuth, backfillCandidatesFromResumeData);

export default router;