import prisma from '../prismaClient.js';

// Get comprehensive dashboard data
export const getDashboardData = async(req, res) => {
    try {
        // Get company ID from auth middleware
        const companyId = req.companyId;
        if (!companyId) {
            return res.status(403).json({
                error: "Company context required. Please ensure you are logged in with a valid company account."
            });
        }

        // Get current date and date ranges
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const startOfMonth = new Date(currentYear, currentMonth, 1);
        const endOfMonth = new Date(currentYear, currentMonth + 1, 0);

        // Job Statistics with company filtering
        const totalJobs = await prisma.ats_JobPost.count({
            where: { companyId: companyId }
        });
        const activeJobs = await prisma.ats_JobPost.count({
            where: {
                jobStatus: 'ACTIVE',
                companyId: companyId
            }
        });
        const filledJobs = await prisma.ats_JobPost.count({
            where: {
                jobStatus: 'FILLED',
                companyId: companyId
            }
        });

        // Recent Jobs (last 10) with company filtering
        const recentJobs = await prisma.ats_JobPost.findMany({
            where: { companyId: companyId },
            take: 10,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                title: true,
                companyName: true,
                jobStatus: true,
                createdAt: true
            }
        });

        // Candidate Statistics with company filtering
        const totalCandidates = await prisma.CandidateApplication.count({
            where: { companyId: companyId }
        });
        const pendingCandidates = await prisma.CandidateApplication.count({
            where: {
                status: 'pending',
                companyId: companyId
            }
        });
        const shortlistedCandidates = await prisma.CandidateApplication.count({
            where: {
                status: 'shortlisted',
                companyId: companyId
            }
        });
        const hiredCandidates = await prisma.CandidateApplication.count({
            where: {
                status: 'hired',
                companyId: companyId
            }
        });

        // Recent Applications (last 10) with company filtering
        const recentApplications = await prisma.CandidateApplication.findMany({
            where: { companyId: companyId },
            take: 10,
            orderBy: { appliedAt: 'desc' },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                status: true,
                appliedAt: true,
                job: {
                    select: {
                        title: true,
                        company: true
                    }
                }
            }
        });

        // Interview Statistics with company filtering
        const totalInterviews = await prisma.interviewSchedule.count({
            where: { companyId: companyId }
        });

        // Get today's date for filtering
        const today = new Date();
        const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

        const scheduledInterviews = await prisma.interviewSchedule.count({
            where: {
                companyId: companyId,
                status: 'SCHEDULED',
                interviewDate: {
                    gte: startOfToday,
                    lt: endOfToday
                }
            }
        });

        const completedInterviews = await prisma.interviewSchedule.count({
            where: {
                companyId: companyId,
                status: 'COMPLETED'
            }
        });

        // Upcoming Interviews (next 7 days) with company filtering
        const upcomingInterviews = await prisma.interviewSchedule.findMany({
            where: {
                companyId: companyId,
                interviewDate: {
                    gte: now,
                    lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
                },
                status: 'SCHEDULED'
            },
            take: 10,
            orderBy: { interviewDate: 'asc' },
            select: {
                id: true,
                candidateName: true,
                interviewDate: true,
                interviewTime: true,
                interviewType: true,
                interviewMode: true,
                platform: true,
                interviewer: true
            }
        });

        // Customer Statistics with company filtering
        const totalCustomers = await prisma.customer.count({
            where: { companyId: companyId }
        });
        const activeCustomers = await prisma.customer.count({
            where: {
                companyId: companyId,
                status: 'ACTIVE'
            }
        });

        // Recent Customers (last 10) with company filtering
        const recentCustomers = await prisma.customer.findMany({
            where: { companyId: companyId },
            take: 10,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                companyName: true,
                industry: true,
                status: true,
                createdAt: true
            }
        });

        // Timesheet Statistics with company filtering
        const totalTimesheets = await prisma.timesheetEntry.count({
            where: { companyId: companyId }
        });
        const pendingTimesheets = await prisma.timesheetEntry.count({
            where: {
                companyId: companyId,
                status: 'PENDING'
            }
        });
        const approvedTimesheets = await prisma.timesheetEntry.count({
            where: {
                companyId: companyId,
                status: 'APPROVED'
            }
        });

        // Monthly timesheet hours with company filtering
        const monthlyHours = await prisma.timesheetEntry.aggregate({
            where: {
                companyId: companyId,
                date: {
                    gte: startOfMonth.toISOString().split('T')[0],
                    lte: endOfMonth.toISOString().split('T')[0]
                },
                status: 'APPROVED'
            },
            _sum: {
                hours: true
            }
        });

        // Recent Timesheets (last 10) with company filtering
        const recentTimesheets = await prisma.timesheetEntry.findMany({
            where: { companyId: companyId },
            take: 10,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                recruiterName: true,
                date: true,
                hours: true,
                taskType: true,
                status: true,
                createdAt: true
            }
        });

        // Work Type Distribution
        const workTypeDistribution = await prisma.ats_JobPost.groupBy({
            by: ['workType'],
            _count: {
                id: true
            }
        });

        // Industry Distribution
        const industryDistribution = await prisma.customer.groupBy({
            by: ['industry'],
            _count: {
                id: true
            }
        });

        // Task Category Distribution
        const taskCategoryDistribution = await prisma.timesheetEntry.groupBy({
            by: ['taskCategory'],
            _count: {
                id: true
            }
        });

        // Compile dashboard data
        const dashboardData = {
            summary: {
                totalJobs,
                activeJobs,
                filledJobs,
                totalCandidates,
                pendingCandidates,
                shortlistedCandidates,
                hiredCandidates,
                totalInterviews,
                scheduledInterviews,
                completedInterviews,
                totalCustomers,
                activeCustomers,
                totalTimesheets,
                pendingTimesheets,
                approvedTimesheets,
                monthlyHours: monthlyHours._sum.hours || 0
            },
            charts: {
                workTypeDistribution: workTypeDistribution.map(stat => ({
                    workType: stat.workType,
                    count: stat._count.id
                })),
                industryDistribution: industryDistribution.map(stat => ({
                    industry: stat.industry,
                    count: stat._count.id
                })),
                taskCategoryDistribution: taskCategoryDistribution.map(stat => ({
                    category: stat.taskCategory,
                    count: stat._count.id
                }))
            },
            recent: {
                jobs: recentJobs,
                applications: recentApplications,
                upcomingInterviews,
                customers: recentCustomers,
                timesheets: recentTimesheets
            }
        };

        res.status(200).json({
            success: true,
            message: 'Dashboard data retrieved successfully',
            data: dashboardData
        });

    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch dashboard data',
            error: error.message
        });
    }
};

// Get quick stats for dashboard widgets
export const getQuickStats = async(req, res) => {
    try {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const startOfMonth = new Date(currentYear, currentMonth, 1);

        // Quick counts
        const activeJobs = await prisma.ats_JobPost.count({
            where: { jobStatus: 'ACTIVE' }
        });

        const pendingCandidates = await prisma.CandidateApplication.count({
            where: { status: 'pending' }
        });

        const scheduledInterviews = await prisma.interviewSchedule.count({
            where: { status: 'SCHEDULED' }
        });

        const pendingTimesheets = await prisma.timesheetEntry.count({
            where: { status: 'PENDING' }
        });

        // This month's new applications
        const newApplicationsThisMonth = await prisma.CandidateApplication.count({
            where: {
                appliedAt: {
                    gte: startOfMonth
                }
            }
        });

        // This month's new jobs
        const newJobsThisMonth = await prisma.ats_JobPost.count({
            where: {
                createdAt: {
                    gte: startOfMonth
                }
            }
        });

        const quickStats = {
            activeJobs,
            pendingCandidates,
            scheduledInterviews,
            pendingTimesheets,
            newApplicationsThisMonth,
            newJobsThisMonth
        };

        res.status(200).json({
            success: true,
            message: 'Quick stats retrieved successfully',
            data: quickStats
        });

    } catch (error) {
        console.error('Error fetching quick stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch quick stats',
            error: error.message
        });
    }
};