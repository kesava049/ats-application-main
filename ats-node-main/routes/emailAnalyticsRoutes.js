import express from 'express';
import { getEmailAnalytics } from '../controllers/emailAnalyticsController.js';
import { companyAuth } from '../middlewares/companyAuth.js';

const router = express.Router();

// Apply company authentication to all email analytics routes
router.use(companyAuth);

// GET /api/email-analytics - Get comprehensive email analytics for the entire project
router.get('/', getEmailAnalytics);

export default router;
