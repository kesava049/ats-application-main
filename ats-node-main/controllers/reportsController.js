import prisma from '../prismaClient.js';

// Production-level error handling utility
const handleError = (error, res, operation = 'operation') => {
    console.error(`❌ Error in ${operation}:`, error);

    // Database connection errors
    if (error.code === 'P1001' || error.code === 'P1002') {
        return res.status(503).json({
            success: false,
            message: 'Database connection temporarily unavailable',
            error: 'Please try again in a few moments',
            timestamp: new Date().toISOString()
        });
    }

    // Validation errors
    if (error.code === 'P2002') {
        return res.status(400).json({
            success: false,
            message: 'Data validation error',
            error: 'Duplicate entry found'
        });
    }

    // Generic error response
    return res.status(500).json({
        success: false,
        message: `Failed to complete ${operation}`,
        error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message,
        timestamp: new Date().toISOString()
    });
};

// Cache utility for performance optimization
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const getCachedData = (key) => {
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data;
    }
    return null;
};

const setCachedData = (key, data) => {
    cache.set(key, {
        data,
        timestamp: Date.now()
    });
};

// Main comprehensive reports API - Single endpoint for all project data
export const getAllProjectReports = async(req, res) => {
    try {
        // Get company ID from auth middleware
        const companyId = req.companyId;
        if (!companyId) {
            return res.status(403).json({
                error: "Company context required. Please ensure you are logged in with a valid company account."
            });
        }

        const cacheKey = `all_project_reports_${companyId}`;
        const cachedResult = getCachedData(cacheKey);

        if (cachedResult) {
            return res.status(200).json({
                success: true,
                message: 'Project reports retrieved from cache',
                data: cachedResult,
                cached: true,
                timestamp: new Date().toISOString()
            });
        }

        const now = new Date();

        // Get all project data in parallel for better performance
        const [
            jobsData,
            candidatesData,
            interviewsData,
            customersData,
            timesheetsData,
            overallMetrics,
            performanceInsights,
            trendsAnalysis
        ] = await Promise.all([
            getJobsData(companyId),
            getCandidatesData(companyId),
            getInterviewsData(companyId),
            getCustomersData(companyId),
            getTimesheetsData(companyId),
            getOverallMetrics(companyId),
            getPerformanceInsights(companyId),
            getTrendsAnalysis(companyId)
        ]);

        const reports = {
            metadata: {
                generatedAt: now.toISOString(),
                totalRecords: overallMetrics.totalActivities
            },
            summary: {
                overall: overallMetrics,
                jobs: jobsData.summary,
                candidates: candidatesData.summary,
                interviews: interviewsData.summary,
                customers: customersData.summary,
                timesheets: timesheetsData.summary
            },
            details: {
                jobs: jobsData.details,
                candidates: candidatesData.details,
                interviews: interviewsData.details,
                customers: customersData.details,
                timesheets: timesheetsData.details
            },
            insights: performanceInsights,
            trends: trendsAnalysis
        };

        // Cache the result
        setCachedData(cacheKey, reports);

        res.status(200).json({
            success: true,
            message: 'All project reports generated successfully',
            data: reports,
            cached: false,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        handleError(error, res, 'getAllProjectReports');
    }
};

// Jobs Data
const getJobsData = async(companyId) => {
    const [jobs, total, active, filled, paused, closed] = await Promise.all([
        prisma.ats_JobPost.findMany({
            where: { companyId: companyId },
            include: {
                applications: {
                    select: {
                        id: true,
                        status: true,
                        appliedAt: true
                    }
                },
                customer: {
                    select: {
                        companyName: true,
                        industry: true,
                        status: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        }),
        prisma.ats_JobPost.count({ where: { companyId: companyId } }),
        prisma.ats_JobPost.count({ where: { jobStatus: 'ACTIVE', companyId: companyId } }),
        prisma.ats_JobPost.count({ where: { jobStatus: 'FILLED', companyId: companyId } }),
        prisma.ats_JobPost.count({ where: { jobStatus: 'PAUSED', companyId: companyId } }),
        prisma.ats_JobPost.count({ where: { jobStatus: 'CLOSED', companyId: companyId } })
    ]);

    const [statusBreakdown, workTypeBreakdown, topCompanies] = await Promise.all([
        prisma.ats_JobPost.groupBy({
            by: ['jobStatus'],
            _count: { jobStatus: true },
            where: { companyId: companyId }
        }),
        prisma.ats_JobPost.groupBy({
            by: ['workType'],
            _count: { workType: true },
            where: { companyId: companyId }
        }),
        prisma.ats_JobPost.groupBy({
            by: ['company'],
            _count: { company: true },
            where: { companyId: companyId },
            orderBy: { _count: { company: 'desc' } },
            take: 10
        })
    ]);

    return {
        summary: {
            total,
            active,
            filled,
            paused,
            closed,
            fillRate: total > 0 ? ((filled / total) * 100).toFixed(2) : 0
        },
        details: {
            data: jobs,
            total,
            statusBreakdown,
            workTypeBreakdown,
            topCompanies
        }
    };
};

// Candidates Data
const getCandidatesData = async(companyId) => {
    const [candidates, total, pending, shortlisted, rejected, hired] = await Promise.all([
        prisma.CandidateApplication.findMany({
            where: { companyId: companyId },
            include: {
                job: {
                    select: {
                        title: true,
                        company: true,
                        jobStatus: true
                    }
                },
                interviewSchedules: {
                    select: {
                        interviewDate: true,
                        status: true,
                        interviewType: true
                    }
                }
            },
            orderBy: { appliedAt: 'desc' }
        }),
        prisma.CandidateApplication.count({ where: { companyId: companyId } }),
        prisma.CandidateApplication.count({ where: { status: 'pending', companyId: companyId } }),
        prisma.CandidateApplication.count({ where: { status: 'shortlisted', companyId: companyId } }),
        prisma.CandidateApplication.count({ where: { status: 'rejected', companyId: companyId } }),
        prisma.CandidateApplication.count({ where: { status: 'hired', companyId: companyId } })
    ]);

    const [statusBreakdown, topSkills, experienceBreakdown] = await Promise.all([
        prisma.CandidateApplication.groupBy({
            by: ['status'],
            _count: { status: true },
            where: { companyId: companyId }
        }),
        getTopSkills(companyId),
        prisma.CandidateApplication.groupBy({
            by: ['yearsOfExperience'],
            _count: { yearsOfExperience: true },
            where: { yearsOfExperience: { not: null }, companyId: companyId }
        })
    ]);

    return {
        summary: {
            total,
            pending,
            shortlisted,
            rejected,
            hired,
            conversionRate: total > 0 ? ((hired / total) * 100).toFixed(2) : 0
        },
        details: {
            data: candidates,
            total,
            statusBreakdown,
            topSkills,
            experienceBreakdown
        }
    };
};

// Interviews Data
const getInterviewsData = async(companyId) => {
    const [interviews, total, scheduled, completed, cancelled, rescheduled] = await Promise.all([
        prisma.interviewSchedule.findMany({
            where: { companyId: companyId },
            include: {
                candidate: {
                    select: {
                        firstName: true,
                        lastName: true,
                        email: true,
                        status: true,
                        job: {
                            select: {
                                title: true,
                                company: true
                            }
                        }
                    }
                }
            },
            orderBy: { interviewDate: 'desc' }
        }),
        prisma.interviewSchedule.count({ where: { companyId: companyId } }),
        prisma.interviewSchedule.count({ where: { status: 'SCHEDULED', companyId: companyId } }),
        prisma.interviewSchedule.count({ where: { status: 'COMPLETED', companyId: companyId } }),
        prisma.interviewSchedule.count({ where: { status: 'CANCELLED', companyId: companyId } }),
        prisma.interviewSchedule.count({ where: { status: 'RESCHEDULED', companyId: companyId } })
    ]);

    const [statusBreakdown, typeBreakdown, modeBreakdown] = await Promise.all([
        prisma.interviewSchedule.groupBy({
            by: ['status'],
            _count: { status: true },
            where: { companyId: companyId }
        }),
        prisma.interviewSchedule.groupBy({
            by: ['interviewType'],
            _count: { interviewType: true },
            where: { companyId: companyId }
        }),
        prisma.interviewSchedule.groupBy({
            by: ['interviewMode'],
            _count: { interviewMode: true },
            where: { companyId: companyId }
        })
    ]);

    return {
        summary: {
            total,
            scheduled,
            completed,
            cancelled,
            rescheduled,
            completionRate: total > 0 ? ((completed / total) * 100).toFixed(2) : 0
        },
        details: {
            data: interviews,
            total,
            statusBreakdown,
            typeBreakdown,
            modeBreakdown
        }
    };
};

// Customers Data
const getCustomersData = async(companyId) => {
    const [customers, total, active, inactive, prospect, suspended] = await Promise.all([
        prisma.customer.findMany({
            where: { companyId: companyId },
            include: {
                jobs: {
                    select: {
                        id: true,
                        title: true,
                        jobStatus: true,
                        applications: {
                            select: {
                                id: true,
                                status: true
                            }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        }),
        prisma.customer.count({ where: { companyId: companyId } }),
        prisma.customer.count({ where: { status: 'ACTIVE', companyId: companyId } }),
        prisma.customer.count({ where: { status: 'INACTIVE', companyId: companyId } }),
        prisma.customer.count({ where: { status: 'PROSPECT', companyId: companyId } }),
        prisma.customer.count({ where: { status: 'SUSPENDED', companyId: companyId } })
    ]);

    const [statusBreakdown, priorityBreakdown, industryBreakdown] = await Promise.all([
        prisma.customer.groupBy({
            by: ['status'],
            _count: { status: true },
            where: { companyId: companyId }
        }),
        prisma.customer.groupBy({
            by: ['priority'],
            _count: { priority: true },
            where: { companyId: companyId }
        }),
        prisma.customer.groupBy({
            by: ['industry'],
            _count: { industry: true },
            where: { companyId: companyId }
        })
    ]);

    return {
        summary: {
            total,
            active,
            inactive,
            prospect,
            suspended,
            activeRate: total > 0 ? ((active / total) * 100).toFixed(2) : 0
        },
        details: {
            data: customers,
            total,
            statusBreakdown,
            priorityBreakdown,
            industryBreakdown
        }
    };
};

// Timesheets Data
const getTimesheetsData = async(companyId) => {
    const [timesheets, total, totalHours, billableHours, approved, pending] = await Promise.all([
        prisma.timesheetEntry.findMany({
            where: { companyId: companyId },
            orderBy: { date: 'desc' }
        }),
        prisma.timesheetEntry.count({ where: { companyId: companyId } }),
        prisma.timesheetEntry.aggregate({
            _sum: { hours: true },
            where: { companyId: companyId }
        }),
        prisma.timesheetEntry.aggregate({
            where: { billable: true, companyId: companyId },
            _sum: { hours: true }
        }),
        prisma.timesheetEntry.count({ where: { status: 'APPROVED', companyId: companyId } }),
        prisma.timesheetEntry.count({ where: { status: 'PENDING', companyId: companyId } })
    ]);

    const [taskCategoryBreakdown, entityTypeBreakdown, priorityBreakdown] = await Promise.all([
        prisma.timesheetEntry.groupBy({
            by: ['taskCategory'],
            _count: { taskCategory: true },
            where: { companyId: companyId }
        }),
        prisma.timesheetEntry.groupBy({
            by: ['entityType'],
            _count: { entityType: true },
            where: { companyId: companyId }
        }),
        prisma.timesheetEntry.groupBy({
            by: ['priority'],
            _count: { priority: true },
            where: { companyId: companyId }
        })
    ]);

    return {
        summary: {
            total,
            totalHours: totalHours._sum.hours || 0,
            billableHours: billableHours._sum.hours || 0,
            approved,
            pending,
            approvalRate: total > 0 ? ((approved / total) * 100).toFixed(2) : 0
        },
        details: {
            data: timesheets,
            total,
            taskCategoryBreakdown,
            entityTypeBreakdown,
            priorityBreakdown
        }
    };
};

// Overall metrics
const getOverallMetrics = async(companyId) => {
    const [totalJobs, totalCandidates, totalInterviews, totalCustomers, totalTimesheets] = await Promise.all([
        prisma.ats_JobPost.count({ where: { companyId: companyId } }),
        prisma.CandidateApplication.count({ where: { companyId: companyId } }),
        prisma.interviewSchedule.count({ where: { companyId: companyId } }),
        prisma.customer.count({ where: { companyId: companyId } }),
        prisma.timesheetEntry.count({ where: { companyId: companyId } })
    ]);

    return {
        totalJobs,
        totalCandidates,
        totalInterviews,
        totalCustomers,
        totalTimesheets,
        totalActivities: totalJobs + totalCandidates + totalInterviews + totalCustomers + totalTimesheets
    };
};

// Performance insights
const getPerformanceInsights = async(companyId) => {
    const insights = [];

    // Job fill rate insight
    const totalJobs = await prisma.ats_JobPost.count({ where: { companyId: companyId } });
    const filledJobs = await prisma.ats_JobPost.count({ where: { jobStatus: 'FILLED', companyId: companyId } });
    const fillRate = totalJobs > 0 ? (filledJobs / totalJobs) * 100 : 0;

    if (fillRate < 30) {
        insights.push({
            type: 'warning',
            category: 'jobs',
            message: 'Job fill rate is below 30%. Consider reviewing job requirements or recruitment strategies.',
            metric: `${fillRate.toFixed(1)}% fill rate`
        });
    }

    // Candidate conversion insight
    const totalCandidates = await prisma.CandidateApplication.count({ where: { companyId: companyId } });
    const hiredCandidates = await prisma.CandidateApplication.count({ where: { status: 'hired', companyId: companyId } });
    const conversionRate = totalCandidates > 0 ? (hiredCandidates / totalCandidates) * 100 : 0;

    if (conversionRate < 10) {
        insights.push({
            type: 'warning',
            category: 'candidates',
            message: 'Candidate conversion rate is low. Review screening and interview processes.',
            metric: `${conversionRate.toFixed(1)}% conversion rate`
        });
    }

    // Interview completion insight
    const totalInterviews = await prisma.interviewSchedule.count({ where: { companyId: companyId } });
    const completedInterviews = await prisma.interviewSchedule.count({ where: { status: 'COMPLETED', companyId: companyId } });
    const completionRate = totalInterviews > 0 ? (completedInterviews / totalInterviews) * 100 : 0;

    if (completionRate < 80) {
        insights.push({
            type: 'warning',
            category: 'interviews',
            message: 'Interview completion rate is below 80%. Check for scheduling issues.',
            metric: `${completionRate.toFixed(1)}% completion rate`
        });
    }

    return insights;
};

// Trends analysis
const getTrendsAnalysis = async(companyId) => {
    const trends = [];

    // Monthly job posting trend
    const monthlyJobs = await prisma.ats_JobPost.groupBy({
        by: ['createdAt'],
        _count: { createdAt: true },
        where: { companyId: companyId },
        orderBy: { createdAt: 'asc' }
    });

    if (monthlyJobs.length > 1) {
        const recentJobs = monthlyJobs.slice(-2);
        const trend = recentJobs[1]._count.createdAt - recentJobs[0]._count.createdAt;

        trends.push({
            category: 'jobs',
            trend: trend > 0 ? 'increasing' : trend < 0 ? 'decreasing' : 'stable',
            change: Math.abs(trend),
            period: 'monthly'
        });
    }

    // Monthly candidate application trend
    const monthlyCandidates = await prisma.CandidateApplication.groupBy({
        by: ['appliedAt'],
        _count: { appliedAt: true },
        where: { companyId: companyId },
        orderBy: { appliedAt: 'asc' }
    });

    if (monthlyCandidates.length > 1) {
        const recentCandidates = monthlyCandidates.slice(-2);
        const trend = recentCandidates[1]._count.appliedAt - recentCandidates[0]._count.appliedAt;

        trends.push({
            category: 'candidates',
            trend: trend > 0 ? 'increasing' : trend < 0 ? 'decreasing' : 'stable',
            change: Math.abs(trend),
            period: 'monthly'
        });
    }

    return trends;
};

// Helper function for top skills
const getTopSkills = async(companyId) => {
    const candidates = await prisma.CandidateApplication.findMany({
        where: {
            keySkills: { not: null },
            companyId: companyId
        },
        select: { keySkills: true }
    });

    const skillsCount = {};
    candidates.forEach(candidate => {
        if (candidate.keySkills) {
            const skills = candidate.keySkills.split(',').map(skill => skill.trim());
            skills.forEach(skill => {
                skillsCount[skill] = (skillsCount[skill] || 0) + 1;
            });
        }
    });

    return Object.entries(skillsCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([skill, count]) => ({ skill, count }));
};