import express from 'express';
import { getAllProjectReports } from '../controllers/reportsController.js';

const router = express.Router();

// Middleware for request logging
const logRequest = (req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    console.log(`📊 Reports API: ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
  });
  
  next();
};

// GET /api/reports-all - Single endpoint for all project data
router.get('/reports-all', 
  logRequest,
  getAllProjectReports
);

export default router; 