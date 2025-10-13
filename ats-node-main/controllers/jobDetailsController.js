import prisma from '../prismaClient.js';

// Get all jobs with detailed information including application counts and status
export const getAllJobDetails = async (req, res) => {
  try {
    // Get all jobs with their applications and company info
    const jobsWithDetails = await prisma.ats_JobPost.findMany({
      include: {
        applications: {
          select: {
            id: true,
            status: true,
            appliedAt: true
          }
        },
        companyRelation: {
          select: {
            id: true,
            name: true,
            logo: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Process each job to add calculated fields
    const processedJobs = jobsWithDetails.map(job => {
      const totalApplications = job.applications.length;
      const pendingApplications = job.applications.filter(app => app.status === 'pending').length;
      const shortlistedApplications = job.applications.filter(app => app.status === 'shortlisted').length;
      const rejectedApplications = job.applications.filter(app => app.status === 'rejected').length;
      const hiredApplications = job.applications.filter(app => app.status === 'hired').length;

      // Calculate open positions (assuming 1 position per job unless specified otherwise)
      const openPositions = job.jobStatus === 'ACTIVE' ? 1 : 0;

      // Calculate application rate (applications per day since posting)
      const daysSincePosted = Math.ceil((new Date() - new Date(job.createdAt)) / (1000 * 60 * 60 * 24));
      const applicationRate = daysSincePosted > 0 ? (totalApplications / daysSincePosted).toFixed(2) : 0;

      return {
        id: job.id,
        title: job.title,
        company: job.company,
        companyName: job.companyName,
        companyLogo: job.companyRelation?.logo || null,
        department: job.department,
        internalSPOC: job.internalSPOC,
        recruiter: job.recruiter,
        jobType: job.jobType,
        experienceLevel: job.experienceLevel,
        country: job.country,
        city: job.city,
        fullLocation: job.fullLocation,
        workType: job.workType,
        jobStatus: job.jobStatus,
        salaryMin: job.salaryMin,
        salaryMax: job.salaryMax,
        priority: job.priority,
        description: job.description,
        requirements: job.requirements,
        requiredSkills: job.requiredSkills,
        benefits: job.benefits,
        createdAt: job.createdAt,
        
        // Application statistics
        totalApplications: totalApplications,
        pendingApplications: pendingApplications,
        shortlistedApplications: shortlistedApplications,
        rejectedApplications: rejectedApplications,
        hiredApplications: hiredApplications,
        
        // Position and status information
        openPositions: openPositions,
        filledPositions: hiredApplications,
        availablePositions: openPositions - hiredApplications,
        
        // Performance metrics
        applicationRate: parseFloat(applicationRate),
        daysSincePosted: daysSincePosted,
        
        // Status indicators
        isActive: job.jobStatus === 'ACTIVE',
        isPaused: job.jobStatus === 'PAUSED',
        isClosed: job.jobStatus === 'CLOSED',
        isFilled: job.jobStatus === 'FILLED',
        
        // Quick stats
        hasApplications: totalApplications > 0,
        hasShortlisted: shortlistedApplications > 0,
        hasHired: hiredApplications > 0
      };
    });

    // Calculate overall statistics
    const totalJobs = processedJobs.length;
    const activeJobs = processedJobs.filter(job => job.jobStatus === 'ACTIVE').length;
    const pausedJobs = processedJobs.filter(job => job.jobStatus === 'PAUSED').length;
    const closedJobs = processedJobs.filter(job => job.jobStatus === 'CLOSED').length;
    const filledJobs = processedJobs.filter(job => job.jobStatus === 'FILLED').length;
    
    const totalApplications = processedJobs.reduce((sum, job) => sum + job.totalApplications, 0);
    const totalOpenPositions = processedJobs.reduce((sum, job) => sum + job.openPositions, 0);
    const totalFilledPositions = processedJobs.reduce((sum, job) => sum + job.filledPositions, 0);

    res.status(200).json({
      success: true,
      message: 'Job details retrieved successfully',
      data: {
        jobs: processedJobs,
        summary: {
          totalJobs,
          activeJobs,
          pausedJobs,
          closedJobs,
          filledJobs,
          totalApplications,
          totalOpenPositions,
          totalFilledPositions,
          totalAvailablePositions: totalOpenPositions - totalFilledPositions
        }
      }
    });

  } catch (error) {
    console.error('Error fetching job details:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching job details',
      error: error.message
    });
  }
};

// Get all my jobs with complete details - single comprehensive API
export const getMyJobs = async (req, res) => {
  try {
    // Get all jobs with their applications and recent candidates
    const jobsWithDetails = await prisma.ats_JobPost.findMany({
      include: {
        applications: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            currentLocation: true,
            status: true,
            appliedAt: true,
            keySkills: true,
            salaryExpectation: true,
            yearsOfExperience: true,
            remoteWork: true,
            startDate: true,
            portfolioUrl: true
          },
          orderBy: {
            appliedAt: 'desc'
          }
        },
        companyRelation: {
          select: {
            id: true,
            name: true,
            logo: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Process each job with complete details
    const myJobs = jobsWithDetails.map(job => {
      const totalApplications = job.applications.length;
      const pendingApplications = job.applications.filter(app => app.status === 'pending').length;
      const shortlistedApplications = job.applications.filter(app => app.status === 'shortlisted').length;
      const rejectedApplications = job.applications.filter(app => app.status === 'rejected').length;
      const hiredApplications = job.applications.filter(app => app.status === 'hired').length;

      // Calculate open positions
      const openPositions = job.jobStatus === 'ACTIVE' ? 1 : 0;
      const availablePositions = openPositions - hiredApplications;

      // Calculate performance metrics
      const daysSincePosted = Math.ceil((new Date() - new Date(job.createdAt)) / (1000 * 60 * 60 * 24));
      const applicationRate = daysSincePosted > 0 ? (totalApplications / daysSincePosted).toFixed(2) : 0;

      // Get recent applications (last 5 for summary)
      const recentApplications = job.applications.slice(0, 5);

      return {
        // Basic job information
        id: job.id,
        title: job.title,
        company: job.company,
        companyName: job.companyName,
        companyLogo: job.companyRelation?.logo || null,
        department: job.department,
        internalSPOC: job.internalSPOC,
        recruiter: job.recruiter,
        jobType: job.jobType,
        experienceLevel: job.experienceLevel,
        country: job.country,
        city: job.city,
        fullLocation: job.fullLocation,
        workType: job.workType,
        jobStatus: job.jobStatus,
        salaryMin: job.salaryMin,
        salaryMax: job.salaryMax,
        priority: job.priority,
        description: job.description,
        requirements: job.requirements,
        requiredSkills: job.requiredSkills,
        benefits: job.benefits,
        createdAt: job.createdAt,
        
        // Application statistics
        totalApplications,
        pendingApplications,
        shortlistedApplications,
        rejectedApplications,
        hiredApplications,
        
        // Position information
        openPositions,
        filledPositions: hiredApplications,
        availablePositions,
        
        // Performance metrics
        applicationRate: parseFloat(applicationRate),
        daysSincePosted,
        
        // Status indicators
        isActive: job.jobStatus === 'ACTIVE',
        isPaused: job.jobStatus === 'PAUSED',
        isClosed: job.jobStatus === 'CLOSED',
        isFilled: job.jobStatus === 'FILLED',
        
        // Quick stats
        hasApplications: totalApplications > 0,
        hasShortlisted: shortlistedApplications > 0,
        hasHired: hiredApplications > 0,
        
        // Recent applications for quick overview
        recentApplications: recentApplications.map(app => ({
          id: app.id,
          name: `${app.firstName} ${app.lastName}`,
          email: app.email,
          phone: app.phone,
          location: app.currentLocation,
          status: app.status,
          appliedAt: app.appliedAt,
          keySkills: app.keySkills,
          salaryExpectation: app.salaryExpectation,
          yearsOfExperience: app.yearsOfExperience,
          remoteWork: app.remoteWork,
          startDate: app.startDate,
          portfolioUrl: app.portfolioUrl
        })),
        
        // All applications for detailed view
        allApplications: job.applications.map(app => ({
          id: app.id,
          name: `${app.firstName} ${app.lastName}`,
          email: app.email,
          phone: app.phone,
          location: app.currentLocation,
          status: app.status,
          appliedAt: app.appliedAt,
          keySkills: app.keySkills,
          salaryExpectation: app.salaryExpectation,
          yearsOfExperience: app.yearsOfExperience,
          remoteWork: app.remoteWork,
          startDate: app.startDate,
          portfolioUrl: app.portfolioUrl
        }))
      };
    });

    // Calculate overall summary statistics
    const totalJobs = myJobs.length;
    const activeJobs = myJobs.filter(job => job.jobStatus === 'ACTIVE').length;
    const pausedJobs = myJobs.filter(job => job.jobStatus === 'PAUSED').length;
    const closedJobs = myJobs.filter(job => job.jobStatus === 'CLOSED').length;
    const filledJobs = myJobs.filter(job => job.jobStatus === 'FILLED').length;
    
    const totalApplications = myJobs.reduce((sum, job) => sum + job.totalApplications, 0);
    const totalOpenPositions = myJobs.reduce((sum, job) => sum + job.openPositions, 0);
    const totalFilledPositions = myJobs.reduce((sum, job) => sum + job.filledPositions, 0);
    const totalAvailablePositions = myJobs.reduce((sum, job) => sum + job.availablePositions, 0);

    // Calculate status-wise summaries
    const activeJobsData = myJobs.filter(job => job.jobStatus === 'ACTIVE');
    const pausedJobsData = myJobs.filter(job => job.jobStatus === 'PAUSED');
    const closedJobsData = myJobs.filter(job => job.jobStatus === 'CLOSED');
    const filledJobsData = myJobs.filter(job => job.jobStatus === 'FILLED');

    res.status(200).json({
      success: true,
      message: 'My jobs retrieved successfully',
      data: {
        jobs: myJobs,
        summary: {
          totalJobs,
          activeJobs,
          pausedJobs,
          closedJobs,
          filledJobs,
          totalApplications,
          totalOpenPositions,
          totalFilledPositions,
          totalAvailablePositions
        },
        statusBreakdown: {
          active: {
            count: activeJobs,
            applications: activeJobsData.reduce((sum, job) => sum + job.totalApplications, 0),
            openPositions: activeJobsData.reduce((sum, job) => sum + job.openPositions, 0)
          },
          paused: {
            count: pausedJobs,
            applications: pausedJobsData.reduce((sum, job) => sum + job.totalApplications, 0)
          },
          closed: {
            count: closedJobs,
            applications: closedJobsData.reduce((sum, job) => sum + job.totalApplications, 0)
          },
          filled: {
            count: filledJobs,
            applications: filledJobsData.reduce((sum, job) => sum + job.totalApplications, 0),
            filledPositions: filledJobsData.reduce((sum, job) => sum + job.filledPositions, 0)
          }
        }
      }
    });

  } catch (error) {
    console.error('Error fetching my jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching my jobs',
      error: error.message
    });
  }
};

// Get detailed information for a specific job
export const getJobDetailsById = async (req, res) => {
  const jobId = parseInt(req.params.id);

  try {
    const jobDetails = await prisma.ats_JobPost.findUnique({
      where: { id: jobId },
      include: {
        applications: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            currentLocation: true,
            status: true,
            appliedAt: true,
            keySkills: true,
            salaryExpectation: true,
            yearsOfExperience: true,
            remoteWork: true,
            startDate: true,
            portfolioUrl: true
          },
          orderBy: {
            appliedAt: 'desc'
          }
        },
        companyRelation: {
          select: {
            id: true,
            name: true,
            logo: true
          }
        }
      }
    });

    if (!jobDetails) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Calculate statistics
    const totalApplications = jobDetails.applications.length;
    const pendingApplications = jobDetails.applications.filter(app => app.status === 'pending').length;
    const shortlistedApplications = jobDetails.applications.filter(app => app.status === 'shortlisted').length;
    const rejectedApplications = jobDetails.applications.filter(app => app.status === 'rejected').length;
    const hiredApplications = jobDetails.applications.filter(app => app.status === 'hired').length;

    const daysSincePosted = Math.ceil((new Date() - new Date(jobDetails.createdAt)) / (1000 * 60 * 60 * 24));
    const applicationRate = daysSincePosted > 0 ? (totalApplications / daysSincePosted).toFixed(2) : 0;

    // Get recent applications (last 10)
    const recentApplications = jobDetails.applications.slice(0, 10);

    res.status(200).json({
      success: true,
      message: 'Job details retrieved successfully',
      data: {
        job: {
          id: jobDetails.id,
          title: jobDetails.title,
          company: jobDetails.company,
          companyName: jobDetails.companyName,
          companyLogo: jobDetails.companyRelation?.logo || null,
          department: jobDetails.department,
          internalSPOC: jobDetails.internalSPOC,
          recruiter: jobDetails.recruiter,
          jobType: jobDetails.jobType,
          experienceLevel: jobDetails.experienceLevel,
          country: jobDetails.country,
          city: jobDetails.city,
          fullLocation: jobDetails.fullLocation,
          workType: jobDetails.workType,
          jobStatus: jobDetails.jobStatus,
          salaryMin: jobDetails.salaryMin,
          salaryMax: jobDetails.salaryMax,
          priority: jobDetails.priority,
          description: jobDetails.description,
          requirements: jobDetails.requirements,
          requiredSkills: jobDetails.requiredSkills,
          benefits: jobDetails.benefits,
          createdAt: jobDetails.createdAt
        },
        statistics: {
          totalApplications,
          pendingApplications,
          shortlistedApplications,
          rejectedApplications,
          hiredApplications,
          applicationRate: parseFloat(applicationRate),
          daysSincePosted,
          openPositions: jobDetails.jobStatus === 'ACTIVE' ? 1 : 0,
          filledPositions: hiredApplications,
          availablePositions: (jobDetails.jobStatus === 'ACTIVE' ? 1 : 0) - hiredApplications
        },
        recentApplications,
        allApplications: jobDetails.applications
      }
    });

  } catch (error) {
    console.error('Error fetching job details:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching job details',
      error: error.message
    });
  }
};

// Get jobs by status with detailed information
export const getJobDetailsByStatus = async (req, res) => {
  const { status } = req.params;

  try {
    // Validate status
    const validStatuses = ['ACTIVE', 'PAUSED', 'CLOSED', 'FILLED'];
    if (!validStatuses.includes(status.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const jobsWithDetails = await prisma.ats_JobPost.findMany({
      where: {
        jobStatus: status.toUpperCase()
      },
      include: {
        applications: {
          select: {
            id: true,
            status: true,
            appliedAt: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const processedJobs = jobsWithDetails.map(job => {
      const totalApplications = job.applications.length;
      const pendingApplications = job.applications.filter(app => app.status === 'pending').length;
      const shortlistedApplications = job.applications.filter(app => app.status === 'shortlisted').length;
      const rejectedApplications = job.applications.filter(app => app.status === 'rejected').length;
      const hiredApplications = job.applications.filter(app => app.status === 'hired').length;

      const daysSincePosted = Math.ceil((new Date() - new Date(job.createdAt)) / (1000 * 60 * 60 * 24));
      const applicationRate = daysSincePosted > 0 ? (totalApplications / daysSincePosted).toFixed(2) : 0;

      return {
        id: job.id,
        title: job.title,
        company: job.company,
        department: job.department,
        recruiter: job.recruiter,
        jobType: job.jobType,
        experienceLevel: job.experienceLevel,
        city: job.city,
        workType: job.workType,
        jobStatus: job.jobStatus,
        salaryMin: job.salaryMin,
        salaryMax: job.salaryMax,
        createdAt: job.createdAt,
        totalApplications,
        pendingApplications,
        shortlistedApplications,
        rejectedApplications,
        hiredApplications,
        applicationRate: parseFloat(applicationRate),
        daysSincePosted
      };
    });

    const totalJobs = processedJobs.length;
    const totalApplications = processedJobs.reduce((sum, job) => sum + job.totalApplications, 0);

    res.status(200).json({
      success: true,
      message: `Jobs with status ${status.toUpperCase()} retrieved successfully`,
      data: {
        status: status.toUpperCase(),
        jobs: processedJobs,
        summary: {
          totalJobs,
          totalApplications,
          averageApplicationsPerJob: totalJobs > 0 ? (totalApplications / totalJobs).toFixed(2) : 0
        }
      }
    });

  } catch (error) {
    console.error('Error fetching job details by status:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching job details by status',
      error: error.message
    });
  }
}; 