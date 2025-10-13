import prisma from '../prismaClient.js';
import { sendPipelineStatusChangeRecruiterEmail, sendPipelineStatusChangeCandidateEmail } from '../utils/mailer.js';

// Update candidate status for a specific job
export const updateCandidateJobStatus = async(req, res) => {
    try {
        // Get company ID from auth middleware
        const companyId = req.companyId;
        if (!companyId) {
            return res.status(403).json({
                error: "Company context required. Please ensure you are logged in with a valid company account."
            });
        }

        const { candidateId, jobId, status, reason } = req.body;

        // Validate required fields
        if (!candidateId || !jobId || !status) {
            return res.status(400).json({
                success: false,
                message: 'Candidate ID, Job ID, and Status are required fields'
            });
        }

        // Validate status is one of the allowed pipeline status labels
        const allowedStatusLabels = [
            "New Application", "Initial Screening", "Phone Screening", "Skills Assessment",
            "First Interview", "Second Interview", "Final Interview", "Reference Check",
            "Offer Preparation", "Offer Sent", "Offer Negotiation", "Offer Accepted",
            "Background Check", "Hired", "Rejected", "Withdrawn", "On Hold"
        ];

        if (!allowedStatusLabels.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Please use a valid pipeline status label.',
                allowedStatusLabels: allowedStatusLabels
            });
        }

        // Check if the candidate application exists and get current status
        const existingApplication = await prisma.CandidateApplication.findFirst({
            where: {
                id: parseInt(candidateId),
                jobId: parseInt(jobId)
            },
            include: {
                job: {
                    select: {
                        id: true,
                        title: true,
                        company: true,
                        city: true,
                        country: true,
                        jobType: true,
                        experienceLevel: true,
                        workType: true,
                        jobStatus: true,
                        salaryMin: true,
                        salaryMax: true,
                        email: true,
                        recruiter: true,
                        internalSPOC: true
                    }
                }
            }
        });

        if (!existingApplication) {
            return res.status(404).json({
                success: false,
                message: 'Candidate application not found for the specified job'
            });
        }

        const oldStatus = existingApplication.status;
        const newStatus = status;

        // Update the candidate's status
        const updatedApplication = await prisma.CandidateApplication.update({
            where: {
                id: parseInt(candidateId)
            },
            data: {
                status: status,
                updatedAt: new Date()
            }
        });

        // Prepare change info for emails
        const changeInfo = {
            updatedBy: req.user ? user.name : 'System',
            updatedAt: new Date(),
            reason: reason || 'Status updated by recruitment team'
        };

        // Send emails to both parties
        try {
            // Send email to job poster/recruiter
            if (existingApplication.job.email) {
                await sendPipelineStatusChangeRecruiterEmail(
                    existingApplication.job.email,
                    existingApplication,
                    existingApplication.job,
                    oldStatus,
                    newStatus,
                    changeInfo
                );
            }

            // Send email to candidate
            await sendPipelineStatusChangeCandidateEmail(
                existingApplication.email,
                existingApplication,
                existingApplication.job,
                oldStatus,
                newStatus,
                changeInfo
            );

            console.log(`Pipeline status change emails sent successfully for candidate ${candidateId}`);
        } catch (emailError) {
            console.error('Error sending pipeline status change emails:', emailError);
            // Don't fail the request if emails fail, just log the error
        }

        res.status(200).json({
            success: true,
            message: `Candidate status updated to ${status} successfully`,
            data: {
                candidateId: parseInt(candidateId),
                jobId: parseInt(jobId),
                oldStatus: oldStatus,
                newStatus: status,
                updatedAt: updatedApplication.updatedAt,
                emailsSent: {
                    recruiter: existingApplication.job.email ? true : false,
                    candidate: true
                }
            }
        });

    } catch (error) {
        console.error('Error updating candidate status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update candidate status',
            error: error.message
        });
    }
};

/**
 * Get All Candidates with Pipeline Status
 * 
 * Retrieves ALL candidates data with their pipeline status information.
 * This endpoint provides complete candidate information including their current
 * pipeline status for each job application, interview schedules, and pipeline statistics.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getAllCandidatesPipelineStatus = async(req, res) => {
        try {
            // Get company ID from auth middleware
            const companyId = req.companyId;
            if (!companyId) {
                return res.status(403).json({
                    error: "Company context required. Please ensure you are logged in with a valid company account."
                });
            }

            // Get ALL candidates with their job applications
            const allCandidates = await prisma.CandidateApplication.findMany({
                where: { companyId: companyId },
                include: {
                    job: {
                        select: {
                            id: true,
                            title: true,
                            company: true,
                            city: true,
                            jobType: true,
                            experienceLevel: true,
                            workType: true,
                            jobStatus: true,
                            salaryMin: true,
                            salaryMax: true,
                            priority: true,
                            createdAt: true
                        }
                    },
                    interviewSchedules: {
                        select: {
                            id: true,
                            interviewDate: true,
                            interviewTime: true,
                            interviewType: true,
                            interviewMode: true,
                            platform: true,
                            meetingLink: true,
                            interviewer: true,
                            notes: true,
                            status: true,
                            createdAt: true
                        },
                        orderBy: {
                            interviewDate: 'desc'
                        }
                    }
                },
                orderBy: {
                    appliedAt: 'desc' // Most recent applications first
                }
            });

            // Group candidates by email to get all applications for each candidate
            const candidatesByEmail = {};

            allCandidates.forEach(application => {
                        const email = application.email;

                        if (!candidatesByEmail[email]) {
                            // First time seeing this candidate, create their profile
                            candidatesByEmail[email] = {
                                    id: application.id,
                                    fullName: `${application.firstName} ${application.lastName}`,
                                    firstName: application.firstName,
                                    lastName: application.lastName,
                                    email: application.email,
                                    phone: application.phone,
                                    currentLocation: application.currentLocation,
                                    keySkills: application.keySkills,
                                    salaryExpectation: application.salaryExpectation,
                                    noticePeriod: application.noticePeriod,
                                    yearsOfExperience: application.yearsOfExperience,
                                    remoteWork: application.remoteWork,
                                    startDate: application.startDate,
                                    portfolioUrl: application.portfolioUrl,
                                    status: application.status,
                                    appliedAt: application.appliedAt,
                                    updatedAt: application.updatedAt,
                                    resumeDownloadUrl: application.resumeFilePath ?
                                        `${process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`}/api/candidates/${application.id}/resume` : null,
          totalApplications: 0,
          appliedJobs: []
        };
      }
      
      // Add this application to the candidate's job list with pipeline status
      candidatesByEmail[email].appliedJobs.push({
        applicationId: application.id,
        applicationStatus: application.status, // This is the pipeline status
        appliedAt: application.appliedAt,
        job: application.job,
        interviews: application.interviewSchedules
      });
      
      // Update total applications count
      candidatesByEmail[email].totalApplications++;
    });

    // Convert to array and sort by most recent application
    const candidatesArray = Object.values(candidatesByEmail).sort((a, b) => {
      return new Date(b.appliedAt) - new Date(a.appliedAt);
    });

    // Calculate pipeline statistics
    const pipelineStats = {
      totalCandidates: candidatesArray.length,
      totalApplications: allCandidates.length,
      statusBreakdown: {},
      recentApplications: 0
    };

    // Count applications by status
    allCandidates.forEach(app => {
      const status = app.status;
      pipelineStats.statusBreakdown[status] = (pipelineStats.statusBreakdown[status] || 0) + 1;
    });

    // Count recent applications (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    pipelineStats.recentApplications = allCandidates.filter(app => 
      new Date(app.appliedAt) >= thirtyDaysAgo
    ).length;

    // Return complete data with pipeline information
    res.status(200).json({
      success: true,
      totalCandidates: candidatesArray.length,
      totalApplications: allCandidates.length,
      pipelineStats: pipelineStats,
      candidates: candidatesArray,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error fetching all candidates with pipeline status', 
      error: error.message 
    });
  }
};