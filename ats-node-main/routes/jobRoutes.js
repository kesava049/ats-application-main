import express from 'express';
import { 
  createJobPost, 
  getJobPosts, 
  updateJobPost, 
  deleteJobPost,
  updateJobStatus,
  getJobsByStatus
} from '../controllers/jobController.js';
import { companyAuth, requireCompany } from '../middlewares/companyAuth.js';

const router = express.Router();

// Apply company authentication to all job routes
router.use(companyAuth);

router.post('/post-job', requireCompany, createJobPost);
router.get('/get-jobs', getJobPosts);
router.get('/get-jobs/status/:status', getJobsByStatus);
router.put('/update-job/:id', requireCompany, updateJobPost);
router.patch('/update-job-status/:id', requireCompany, updateJobStatus);
router.delete('/delete-job/:id', requireCompany, deleteJobPost);

export default router;
