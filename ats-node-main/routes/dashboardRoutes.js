import express from 'express';
import { 
  getDashboardData,
  getQuickStats
} from '../controllers/dashboardController.js';
import { companyAuth, requireCompany } from '../middlewares/companyAuth.js';

const router = express.Router();

// Apply company authentication to all dashboard routes
router.use(companyAuth);

// Get comprehensive dashboard data
router.get('/', getDashboardData);

// Get quick stats for dashboard widgets
router.get('/quick-stats', getQuickStats);

export default router; 