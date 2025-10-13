import express from 'express';
import { getAllAnalytics } from '../controllers/analyticsController.js';
import { companyAuth, requireCompany } from '../middlewares/companyAuth.js';

const router = express.Router();

// Apply company authentication to all analytics routes
router.use(companyAuth);

// GET /api/analytics - Get comprehensive analytics for the entire project
router.get('/', getAllAnalytics);

export default router; 