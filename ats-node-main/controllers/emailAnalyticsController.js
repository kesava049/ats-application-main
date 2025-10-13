import prisma from '../prismaClient.js';

// Get comprehensive email analytics for the entire project
export const getEmailAnalytics = async(req, res) => {
    try {
        // Get company ID from JWT token (from auth middleware) or query parameter
        const companyId = req.companyId || req.query.companyId;

        if (!companyId) {
            return res.status(400).json({
                success: false,
                message: 'Company ID is required for email analytics'
            });
        }

        console.log('📊 Email Analytics - Company ID:', companyId);
        console.log('📊 Email Analytics - JWT Token:', req.headers.authorization ? 'Present' : 'Missing');
        console.log('📊 Email Analytics - User ID:', req.userId);
        console.log('📊 Email Analytics - Request Headers:', req.headers);

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const startOfMonth = new Date(currentYear, currentMonth, 1);
        const endOfMonth = new Date(currentYear, currentMonth + 1, 0);
        const startOfYear = new Date(currentYear, 0, 1);
        const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59);

        // 1. JOB EMAIL ANALYTICS
        const jobEmailAnalytics = await getJobEmailAnalytics(now, startOfMonth, endOfMonth, startOfYear, endOfYear, companyId);

        // 2. CANDIDATE EMAIL ANALYTICS
        const candidateEmailAnalytics = await getCandidateEmailAnalytics(now, startOfMonth, endOfMonth, startOfYear, endOfYear, companyId);

        // 3. CUSTOMER EMAIL ANALYTICS
        const customerEmailAnalytics = await getCustomerEmailAnalytics(companyId);

        // 4. INTERVIEW EMAIL ANALYTICS
        const interviewEmailAnalytics = await getInterviewEmailAnalytics(now, startOfMonth, endOfMonth, companyId);

        // 5. TIMESHEET EMAIL ANALYTICS
        const timesheetEmailAnalytics = await getTimesheetEmailAnalytics(now, startOfMonth, endOfMonth, startOfYear, endOfYear, companyId);

        // 6. EMAIL TRENDS AND INSIGHTS
        const emailTrendsAndInsights = await getEmailTrendsAndInsights(now, startOfMonth, endOfMonth, companyId);

        const emailAnalytics = {
            timestamp: now.toISOString(),
            period: {
                current: {
                    month: startOfMonth.toISOString(),
                    year: startOfYear.toISOString()
                }
            },
            jobEmails: jobEmailAnalytics,
            candidateEmails: candidateEmailAnalytics,
            customerEmails: customerEmailAnalytics,
            interviewEmails: interviewEmailAnalytics,
            timesheetEmails: timesheetEmailAnalytics,
            trends: emailTrendsAndInsights,
            summary: {
                totalEmailsSent: jobEmailAnalytics.totalEmails + candidateEmailAnalytics.totalEmails + customerEmailAnalytics.totalEmails + interviewEmailAnalytics.totalEmails + timesheetEmailAnalytics.totalEmails,
                totalEmailsThisMonth: jobEmailAnalytics.emailsThisMonth + candidateEmailAnalytics.emailsThisMonth + customerEmailAnalytics.emailsThisMonth + interviewEmailAnalytics.emailsThisMonth + timesheetEmailAnalytics.emailsThisMonth,
                totalEmailsThisYear: jobEmailAnalytics.emailsThisYear + candidateEmailAnalytics.emailsThisYear + customerEmailAnalytics.emailsThisYear + interviewEmailAnalytics.emailsThisYear + timesheetEmailAnalytics.emailsThisYear
            }
        };

        res.status(200).json({
            success: true,
            message: 'Email analytics data retrieved successfully',
            data: emailAnalytics
        });

    } catch (error) {
        console.error('Error fetching email analytics:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch email analytics data',
            error: error.message
        });
    }
};

// Job Email Analytics Helper Function
async function getJobEmailAnalytics(now, startOfMonth, endOfMonth, startOfYear, endOfYear, companyId) {
    try {
        const totalJobs = await prisma.ats_JobPost.count({
            where: { companyId: parseInt(companyId) }
        });
        // Since email is required in Ats_JobPost, all jobs have emails
        const jobsWithEmail = totalJobs;

        // Jobs by email domain
        const jobsByDomain = await prisma.ats_JobPost.groupBy({
            by: ['email'],
            where: { companyId: parseInt(companyId) },
            _count: { email: true },
            orderBy: { _count: { email: 'desc' } },
            take: 10
        });

        // Jobs created this month with email
        const jobsThisMonth = await prisma.ats_JobPost.count({
            where: {
                companyId: parseInt(companyId),
                createdAt: { gte: startOfMonth, lte: endOfMonth }
            }
        });

        // Jobs created this year with email
        const jobsThisYear = await prisma.ats_JobPost.count({
            where: {
                companyId: parseInt(companyId),
                createdAt: { gte: startOfYear, lte: endOfYear }
            }
        });

        // Top companies by email count
        const topCompaniesByEmail = await prisma.ats_JobPost.groupBy({
            by: ['company'],
            where: { companyId: parseInt(companyId) },
            _count: { company: true },
            orderBy: { _count: { company: 'desc' } },
            take: 5
        });

        return {
            totalEmails: jobsWithEmail,
            totalJobs: totalJobs,
            emailCoverage: totalJobs > 0 ? (jobsWithEmail / totalJobs * 100).toFixed(2) : 0,
            emailsThisMonth: jobsThisMonth,
            emailsThisYear: jobsThisYear,
            topEmailDomains: jobsByDomain.map(item => ({
                email: item.email,
                count: item._count.email
            })),
            topCompaniesByEmail: topCompaniesByEmail.map(item => ({
                company: item.company,
                emailCount: item._count.company
            }))
        };
    } catch (error) {
        console.error('Error in job email analytics:', error);
        return {
            totalEmails: 0,
            totalJobs: 0,
            emailCoverage: "0.00",
            emailsThisMonth: 0,
            emailsThisYear: 0,
            topEmailDomains: [],
            topCompaniesByEmail: []
        };
    }
}

// Candidate Email Analytics Helper Function
async function getCandidateEmailAnalytics(now, startOfMonth, endOfMonth, startOfYear, endOfYear, companyId) {
    try {
        const totalCandidates = await prisma.CandidateApplication.count({
            where: { companyId: parseInt(companyId) }
        });
        // Since email is required in CandidateApplication, all candidates have emails
        const candidatesWithEmail = totalCandidates;

        // Candidates by email domain
        const candidatesByDomain = await prisma.CandidateApplication.groupBy({
            by: ['email'],
            where: { companyId: parseInt(companyId) },
            _count: { email: true },
            orderBy: { _count: { email: 'desc' } },
            take: 10
        });

        // Candidates this month with email
        const candidatesThisMonth = await prisma.CandidateApplication.count({
            where: {
                companyId: parseInt(companyId),
                appliedAt: { gte: startOfMonth, lte: endOfMonth }
            }
        });

        // Candidates this year with email
        const candidatesThisYear = await prisma.CandidateApplication.count({
            where: {
                companyId: parseInt(companyId),
                appliedAt: { gte: startOfYear, lte: endOfYear }
            }
        });

        // Email distribution by status
        const emailByStatus = await prisma.CandidateApplication.groupBy({
            by: ['status'],
            where: { companyId: parseInt(companyId) },
            _count: { status: true }
        });

        return {
            totalEmails: candidatesWithEmail,
            totalCandidates: totalCandidates,
            emailCoverage: totalCandidates > 0 ? (candidatesWithEmail / totalCandidates * 100).toFixed(2) : 0,
            emailsThisMonth: candidatesThisMonth,
            emailsThisYear: candidatesThisYear,
            topEmailDomains: candidatesByDomain.map(item => ({
                email: item.email,
                count: item._count.email
            })),
            emailByStatus: emailByStatus.map(item => ({
                status: item.status,
                count: item._count.status
            }))
        };
    } catch (error) {
        console.error('Error in candidate email analytics:', error);
        return {
            totalEmails: 0,
            totalCandidates: 0,
            emailCoverage: "0.00",
            emailsThisMonth: 0,
            emailsThisYear: 0,
            topEmailDomains: [],
            emailByStatus: []
        };
    }
}

// Customer Email Analytics Helper Function
async function getCustomerEmailAnalytics(companyId) {
    try {
        const totalCustomers = await prisma.customer.count({
            where: { companyId: parseInt(companyId) }
        });
        const customersWithEmail = await prisma.customer.count({
            where: {
                companyId: parseInt(companyId),
                email: {
                    not: null
                }
            }
        });

        // Customers by email domain
        const customersByDomain = await prisma.customer.groupBy({
            by: ['email'],
            where: {
                companyId: parseInt(companyId),
                email: {
                    not: null
                }
            },
            orderBy: { _count: { email: 'desc' } },
            take: 10
        });

        // Email distribution by status
        const emailByStatus = await prisma.customer.groupBy({
            by: ['status'],
            where: {
                companyId: parseInt(companyId),
                email: {
                    not: null
                }
            },
            _count: { status: true }
        });

        // Email distribution by priority
        const emailByPriority = await prisma.customer.groupBy({
            by: ['priority'],
            where: {
                companyId: parseInt(companyId),
                email: {
                    not: null
                }
            },
            _count: { priority: true }
        });

        return {
            totalEmails: customersWithEmail,
            totalCustomers: totalCustomers,
            emailCoverage: totalCustomers > 0 ? (customersWithEmail / totalCustomers * 100).toFixed(2) : 0,
            topEmailDomains: customersByDomain.map(item => ({
                email: item.email,
                count: item._count.email
            })),
            emailByStatus: emailByStatus.map(item => ({
                status: item.status,
                count: item._count.status
            })),
            emailByPriority: emailByPriority.map(item => ({
                priority: item.priority,
                count: item._count.priority
            }))
        };
    } catch (error) {
        console.error('Error in customer email analytics:', error);
        return {
            totalEmails: 0,
            totalCustomers: 0,
            emailCoverage: "0.00",
            topEmailDomains: [],
            emailByStatus: [],
            emailByPriority: []
        };
    }
}

// Interview Email Analytics Helper Function
async function getInterviewEmailAnalytics(now, startOfMonth, endOfMonth, companyId) {
    try {
        const totalInterviews = await prisma.interviewSchedule.count({
            where: { companyId: parseInt(companyId) }
        });

        // Since all candidates have emails (required field), all interviews have candidate emails
        const interviewsWithEmail = totalInterviews;

        // Interviews this month with email
        const interviewsThisMonth = await prisma.interviewSchedule.count({
            where: {
                companyId: parseInt(companyId),
                interviewDate: { gte: startOfMonth, lte: endOfMonth }
            }
        });

        // Email distribution by interview status
        const emailByStatus = await prisma.interviewSchedule.groupBy({
            by: ['status'],
            where: { companyId: parseInt(companyId) },
            _count: { status: true }
        });

        return {
            totalEmails: interviewsWithEmail,
            totalInterviews: totalInterviews,
            emailCoverage: totalInterviews > 0 ? (interviewsWithEmail / totalInterviews * 100).toFixed(2) : 0,
            emailsThisMonth: interviewsThisMonth,
            emailByStatus: emailByStatus.map(item => ({
                status: item.status,
                count: item._count.status
            }))
        };
    } catch (error) {
        console.error('Error in interview email analytics:', error);
        return {
            totalEmails: 0,
            totalInterviews: 0,
            emailCoverage: "0.00",
            emailsThisMonth: 0,
            emailByStatus: []
        };
    }
}

// Timesheet Email Analytics Helper Function
async function getTimesheetEmailAnalytics(now, startOfMonth, endOfMonth, startOfYear, endOfYear, companyId) {
    try {
        const totalTimesheets = await prisma.timesheetEntry.count({
            where: { companyId: parseInt(companyId) }
        });
        const timesheetsWithEmail = await prisma.timesheetEntry.count({
            where: {
                companyId: parseInt(companyId),
                recruiterEmail: {
                    not: null
                }
            }
        });

        // Timesheets this month with email
        const timesheetsThisMonth = await prisma.timesheetEntry.count({
            where: {
                companyId: parseInt(companyId),
                createdAt: { gte: startOfMonth, lte: endOfMonth },
                recruiterEmail: {
                    not: null
                }
            }
        });

        // Timesheets this year with email
        const timesheetsThisYear = await prisma.timesheetEntry.count({
            where: {
                companyId: parseInt(companyId),
                createdAt: { gte: startOfYear, lte: endOfYear },
                recruiterEmail: {
                    not: null
                }
            }
        });

        // Email distribution by status
        const emailByStatus = await prisma.timesheetEntry.groupBy({
            by: ['status'],
            where: {
                companyId: parseInt(companyId),
                recruiterEmail: {
                    not: null
                }
            },
            _count: { status: true }
        });

        return {
            totalEmails: timesheetsWithEmail,
            totalTimesheets: totalTimesheets,
            emailCoverage: totalTimesheets > 0 ? (timesheetsWithEmail / totalTimesheets * 100).toFixed(2) : 0,
            emailsThisMonth: timesheetsThisMonth,
            emailsThisYear: timesheetsThisYear,
            emailByStatus: emailByStatus.map(item => ({
                status: item.status,
                count: item._count.status
            }))
        };
    } catch (error) {
        console.error('Error in timesheet email analytics:', error);
        return {
            totalEmails: 0,
            totalTimesheets: 0,
            emailCoverage: "0.00",
            emailsThisMonth: 0,
            emailsThisYear: 0,
            emailByStatus: []
        };
    }
}

// Email Trends and Insights Helper Function
async function getEmailTrendsAndInsights(now, startOfMonth, endOfMonth, companyId) {
    try {
        // Monthly email growth trend
        const monthlyTrend = await prisma.ats_JobPost.groupBy({
            by: ['createdAt'],
            where: {
                companyId: parseInt(companyId),
                createdAt: { gte: startOfMonth, lte: endOfMonth }
            },
            _count: { email: true }
        });

        // Email domain analysis
        const emailDomains = await prisma.ats_JobPost.findMany({
            where: { companyId: parseInt(companyId) },
            select: { email: true }
        });

        const domainAnalysis = emailDomains.reduce((acc, job) => {
            if (job.email && job.email.includes('@')) {
                const domain = job.email.split('@')[1];
                if (domain) {
                    acc[domain] = (acc[domain] || 0) + 1;
                }
            }
            return acc;
        }, {});

        const topDomains = Object.entries(domainAnalysis)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([domain, count]) => ({ domain, count }));

        return {
            monthlyTrend: monthlyTrend.map(item => ({
                date: item.createdAt,
                emailCount: item._count.email
            })),
            topDomains,
            insights: {
                totalUniqueDomains: Object.keys(domainAnalysis).length,
                averageEmailsPerDomain: Object.keys(domainAnalysis).length > 0 ?
                    Object.values(domainAnalysis).reduce((a, b) => a + b, 0) / Object.keys(domainAnalysis).length : 0
            }
        };
    } catch (error) {
        console.error('Error in email trends and insights:', error);
        return {
            monthlyTrend: [],
            topDomains: [],
            insights: {
                totalUniqueDomains: 0,
                averageEmailsPerDomain: 0
            }
        };
    }
}