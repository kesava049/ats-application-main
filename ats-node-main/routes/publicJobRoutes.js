import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Public route to get a single job by ID (no authentication required)
router.get('/get-job/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    
    console.log('Public job request for ID:', jobId);
    
    // Find job by ID
    const job = await prisma.ats_JobPost.findUnique({
      where: {
        id: parseInt(jobId)
      },
      select: {
        id: true,
        title: true,
        company: true,
        companyName: true,
        companyLogo: true,
        location: true,
        fullLocation: true,
        country: true,
        city: true,
        jobType: true,
        salaryMin: true,
        salaryMax: true,
        description: true,
        requirements: true,
        requiredSkills: true,
        experienceLevel: true,
        jobStatus: true,
        priority: true,
        createdAt: true,
        updatedAt: true,
        internalSPOC: true,
        recruiter: true,
        department: true,
        workType: true,
        benefits: true,
        applicants: true,
        views: true,
        companyId: true
      }
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Only return active jobs to public
    if (job.jobStatus !== 'ACTIVE') {
      return res.status(404).json({
        success: false,
        message: 'Job is no longer available'
      });
    }

    // Increment view count
    await prisma.ats_JobPost.update({
      where: { id: parseInt(jobId) },
      data: { views: (job.views || 0) + 1 }
    });

    res.json({
      success: true,
      job: {
        ...job,
        views: (job.views || 0) + 1
      }
    });

  } catch (error) {
    console.error('Error fetching public job:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Public route to get all active jobs (for job listings page)
router.get('/get-all-jobs', async (req, res) => {
  try {
    const { page = 1, limit = 20, search, location, jobType, experience } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build where clause for filtering
    const where = {
      jobStatus: 'ACTIVE'
    };
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (location) {
      where.OR = [
        { city: { contains: location, mode: 'insensitive' } },
        { country: { contains: location, mode: 'insensitive' } },
        { fullLocation: { contains: location, mode: 'insensitive' } }
      ];
    }
    
    if (jobType) {
      where.jobType = jobType;
    }
    
    if (experience) {
      where.experienceLevel = experience;
    }

    const [jobs, total] = await Promise.all([
      prisma.ats_JobPost.findMany({
        where,
        select: {
          id: true,
          title: true,
          company: true,
          companyName: true,
          companyLogo: true,
          location: true,
          fullLocation: true,
          country: true,
          city: true,
          jobType: true,
          salaryMin: true,
          salaryMax: true,
          description: true,
          experienceLevel: true,
          workType: true,
          createdAt: true,
          applicants: true,
          views: true
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.ats_JobPost.count({ where })
    ]);

    res.json({
      success: true,
      jobs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error fetching public jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;
