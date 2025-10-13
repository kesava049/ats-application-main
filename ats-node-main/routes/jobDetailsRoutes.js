import express from 'express';
import { 
  getAllJobDetails, 
  getMyJobs,
  getJobDetailsById, 
  getJobDetailsByStatus 
} from '../controllers/jobDetailsController.js';

const router = express.Router();

// Get all my jobs with complete details - single comprehensive API
router.get('/my-jobs', getMyJobs);

// Get all jobs with detailed information including application counts and status
router.get('/all', getAllJobDetails);

// Get detailed information for a specific job by ID
router.get('/job/:id', getJobDetailsById);

// Get jobs by status with detailed information
router.get('/status/:status', getJobDetailsByStatus);

export default router; 