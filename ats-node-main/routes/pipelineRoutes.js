import express from 'express';
import { updateCandidateJobStatus } from '../controllers/pipelineController.js';
import { companyAuth, requireCompany } from '../middlewares/companyAuth.js';

const router = express.Router();

// Apply company authentication to all pipeline routes
router.use(companyAuth);

// Update candidate status for a specific job
router.put('/update-status', requireCompany, updateCandidateJobStatus);

export default router; 