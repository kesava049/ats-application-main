import express from 'express';
import {
  getCandidatesSelectedForInterviews,
  scheduleInterview,
  bulkScheduleInterviews,
  getAllInterviewScheduledCandidates
} from '../controllers/interviewController.js';
import { companyAuth, requireCompany } from '../middlewares/companyAuth.js';

const router = express.Router();

// Apply company authentication to all interview routes
router.use(companyAuth);

/**
 * GET /api/interviews/selected
 * 
 * Returns only candidates who are selected for interviews.
 * Shows candidates for first interview, second interview, third interview, and final interview.
 * 
 * Returns:
 * - totalInterviewCandidates: Total number of candidates selected for interviews
 * - candidates: Array of candidate objects with interview details
 * - stageCounts: Count of candidates in each interview stage
 * - timestamp: When the data was fetched
 * 
 * Example: GET http://localhost:5000/api/interviews/selected
 */
router.get('/selected', getCandidatesSelectedForInterviews);

/**
 * GET /api/interviews/scheduled
 * 
 * Returns all candidates who have interviews scheduled with complete details.
 * 
 * Returns:
 * - success: Boolean indicating success
 * - message: Success/error message
 * - data: Object containing:
 *   - totalScheduled: Total number of scheduled interviews
 *   - upcomingInterviews: Number of upcoming interviews
 *   - completedInterviews: Number of completed interviews
 *   - statistics: Interview type and mode statistics
 *   - candidates: Array of scheduled candidates with complete details
 * - timestamp: When the data was fetched
 * 
 * Example: GET http://localhost:5000/api/interviews/scheduled
 */
router.get('/scheduled', getAllInterviewScheduledCandidates);

/**
 * POST /api/interviews/schedule
 * 
 * Schedule an interview for a single candidate.
 * 
 * Body:
 * - candidateId: ID of the candidate
 * - candidateName: Name of the candidate (optional, will use candidate's name if not provided)
 * - interviewDate: Date of the interview (YYYY-MM-DD)
 * - interviewTime: Time of the interview (HH:MM)
 * - interviewType: Type of interview (Technical, HR, Behavioral, Panel, Final)
 * - interviewMode: Mode of interview (Online, Onsite, Phone, Hybrid)
 * - platform: Platform for online interviews (Zoom, Google Meet, etc.) - optional
 * - meetingLink: Meeting link for online interviews - optional
 * - interviewer: Name of the interviewer - optional
 * - notes: Additional notes - optional
 * 
 * Returns:
 * - success: Boolean indicating success
 * - message: Success/error message
 * - data: Interview schedule details
 * 
 * Example: POST http://localhost:5000/api/interviews/schedule
 */
router.post('/schedule', scheduleInterview);

/**
 * POST /api/interviews/bulk-schedule
 * 
 * Schedule interviews for multiple candidates at once.
 * 
 * Body:
 * - candidateIds: Array of candidate IDs
 * - interviewDate: Date of the interview (YYYY-MM-DD)
 * - interviewTime: Time of the interview (HH:MM)
 * - interviewType: Type of interview (Technical, HR, Behavioral, Panel, Final)
 * - interviewMode: Mode of interview (Online, Onsite, Phone, Hybrid)
 * - platform: Platform for online interviews (Zoom, Google Meet, etc.) - optional
 * - meetingLink: Meeting link for online interviews - optional
 * - interviewer: Name of the interviewer - optional
 * - notes: Additional notes - optional
 * 
 * Returns:
 * - success: Boolean indicating success
 * - message: Success/error message
 * - data: Array of interview schedule details
 * 
 * Example: POST http://localhost:5000/api/interviews/bulk-schedule
 */
router.post('/bulk-schedule', bulkScheduleInterviews);

export default router; 