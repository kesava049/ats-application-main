import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";
import authRoutes from "./routes/authRoutes.js"; // Import routes using ES Modules syntax
import jobRoutes from "./routes/jobRoutes.js"; // Import jobRoutes
import jobDetailsRoutes from "./routes/jobDetailsRoutes.js"; // Import job details routes
import candidateRoutes from "./routes/candidateRoutes.js"; // Import candidate routes
import pipelineRoutes from "./routes/pipelineRoutes.js"; // Import pipeline routes
import interviewRoutes from "./routes/interviewRoutes.js"; // Import interview routes
import customerRoutes from "./routes/customerRoutes.js"; // Import customer routes
import timesheetRoutes from "./routes/timesheetRoutes.js"; // Import timesheet routes
import dashboardRoutes from "./routes/dashboardRoutes.js"; // Import dashboard routes
import analyticsRoutes from "./routes/analyticsRoutes.js"; // Import analytics routes
import emailAnalyticsRoutes from "./routes/emailAnalyticsRoutes.js"; // Import email analytics routes
import reportsRoutes from "./routes/reportsRoutes.js"; // Import reports routes
import publicJobRoutes from "./routes/publicJobRoutes.js"; // Import public job routes
import aiAnalysisRoutes from "./routes/aiAnalysisRoutes.js"; // Import AI analysis routes
import prisma, { connectWithRetry } from "./prismaClient.js"; // Import Prisma client and connection function
import { backfillCandidatesFromResumeData as backfillFn } from "./controllers/candidateController.js";

// Initialize dotenv for environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors({
    origin: "*",
    credentials: false,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json()); // For parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));

// Serve static files from public directory
app.use('/public', express.static('public'));

// Database connection error handling middleware
app.use(async(req, res, next) => {
    try {
        // Test database connection before processing request
        await prisma.$queryRaw `SELECT 1`;
        next();
    } catch (error) {
        console.error('❌ Database connection error in request:', error.message);
        res.status(503).json({
            message: 'Database connection temporarily unavailable',
            error: 'Please try again in a few moments'
        });
    }
});

// Database connection function with retry logic
const connectDatabase = async() => {
    return await connectWithRetry();
};

// Periodic health check for database connection
const startHealthCheck = () => {
    setInterval(async() => {
        try {
            await prisma.$queryRaw `SELECT 1`;
            // Connection is healthy, no need to log
        } catch (error) {
            console.warn('⚠️ Database connection health check failed, attempting to reconnect...');
            await connectWithRetry();
        }
    }, 30000); // Check every 30 seconds
};

// Routes
app.use("/api/auth", authRoutes); // Authentication routes
app.use("/api/jobs", jobRoutes); // Job posting routes (this is new)
app.use("/api/job-details", jobDetailsRoutes); // Job details routes
app.use("/api", candidateRoutes); // Candidate application routes
app.use("/api/pipeline", pipelineRoutes); // Pipeline status routes
app.use("/api/interviews", interviewRoutes); // Interview routes
app.use("/api", customerRoutes); // Customer management routes
app.use("/api", timesheetRoutes); // Timesheet management routes
app.use("/api/dashboard", dashboardRoutes); // Dashboard routes
app.use("/api/analytics", analyticsRoutes); // Analytics routes
app.use("/api/email-analytics", emailAnalyticsRoutes); // Email analytics routes
app.use("/api/reports", reportsRoutes); // Reports routes
app.use("/api/ai-analysis", aiAnalysisRoutes); // AI analysis routes
app.use("/api/public/jobs", publicJobRoutes); // Public job routes (no authentication required)

// Health check endpoint
app.get('/health', async(req, res) => {
    try {
        // Test database connection
        await prisma.$queryRaw `SELECT 1`;
        res.status(200).json({
            status: 'healthy',
            database: 'connected',
            timestamp: new Date().toISOString(),
            uptime: process.uptime()
        });
    } catch (error) {
        res.status(503).json({
            status: 'unhealthy',
            database: 'disconnected',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

const PORT = process.env.PORT || 5000;

// Start server with database connection
const startServer = async() => {
    const dbConnected = await connectDatabase();

    if (!dbConnected) {
        console.error('❌ Server cannot start without database connection');
        process.exit(1);
    }

    // Start periodic health checks
    startHealthCheck();

    app.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
        console.log('🔗 Server successfully connected to PostgreSQL database');
    });
};

startServer();

// Lightweight periodic backfill runner (every 10 minutes) per process
// DISABLED: Automatic backfill causes unwanted candidate recreation
// Enable with ENABLE_AUTO_BACKFILL=true environment variable
if (process.env.ENABLE_AUTO_BACKFILL === 'true') {
    console.log('🔄 Auto-backfill enabled - running every 10 minutes');
    setInterval(async() => {
        try {
            const companies = await prisma.resumeData.findMany({
                where: { company_id: { not: null } },
                select: { company_id: true },
                distinct: ['company_id']
            });

            for (const c of companies) {
                const mockReq = { companyId: c.company_id, body: {} };
                const mockRes = { json: () => {}, status: () => ({ json: () => {} }) };
                await backfillFn(mockReq, mockRes);
            }
        } catch (e) {
            console.warn('⚠️ Backfill interval error:', e.message);
        }
    }, 10 * 60 * 1000);
} else {
    console.log('🚫 Auto-backfill disabled - use manual /api/candidates/backfill endpoint');
}