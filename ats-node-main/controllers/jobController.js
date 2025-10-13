import prisma from '../prismaClient.js';
import { sendJobUpdateEmail, sendJobDeleteEmail, sendJobCreateEmail } from '../utils/mailer.js';

// Helper function to create SEO-friendly slug
const createJobSlug = (job) => {
    const title = job.title.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single
        .trim();

    const company = job.company.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();

    const location = job.city.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();

    const experience = job.experienceLevel ?
        job.experienceLevel.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim() :
        'freshers';

    const jobType = job.jobType ?
        job.jobType.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim() :
        'full-time';

    // Create full descriptive URL like Naukri.com
    return `job-listings-${title}-${experience}-${jobType}-${company}-${location}-${job.id}`;
};

// Validation function for enum values
const validateEnumValues = (workType, jobStatus) => {
    const validWorkTypes = ['ONSITE', 'REMOTE', 'HYBRID'];
    const validJobStatuses = ['ACTIVE', 'PAUSED', 'CLOSED', 'FILLED'];

    if (workType && !validWorkTypes.includes(workType.toUpperCase())) {
        throw new Error(`Invalid workType. Must be one of: ${validWorkTypes.join(', ')}`);
    }

    if (jobStatus && !validJobStatuses.includes(jobStatus.toUpperCase())) {
        throw new Error(`Invalid jobStatus. Must be one of: ${validJobStatuses.join(', ')}`);
    }
};



// Helper function to validate and process a single job
const processSingleJob = async(jobData, req) => {
    const {
        title,
        company,
        companyId,
        department,
        internalSPOC,
        recruiter,
        email,
        jobType,
        experienceLevel,
        country,
        city,
        fullLocation,
        workType,
        jobStatus,
        salaryMin,
        salaryMax,
        priority,
        description,
        requirements,
        requiredSkills,
        benefits
    } = jobData;

    // Validate required fields
    if (!email || !email.trim()) {
        throw new Error('Email is required for job posting');
    }

    if (!companyId) {
        throw new Error('Company ID is required for job posting');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        throw new Error('Invalid email format');
    }

    // Validate enum values
    validateEnumValues(workType, jobStatus);

    // Create fullLocation if not provided
    const finalFullLocation = fullLocation || (city && country ? `${city}, ${country}` : city || country || '');

    // Convert salary strings to integers with better validation
    const convertSalaryToInt = (salary, fieldName) => {
        if (!salary) return null;
        if (typeof salary === 'number') return salary;

        // Remove $, commas, and spaces, then convert to integer
        const cleanSalary = salary.toString().replace(/[$,\s]/g, '');
        const parsed = parseInt(cleanSalary, 10);

        if (isNaN(parsed)) {
            throw new Error(`Invalid ${fieldName}: "${salary}". Please provide a valid numeric value.`);
        }

        if (parsed < 0) {
            throw new Error(`Invalid ${fieldName}: "${salary}". Salary cannot be negative.`);
        }

        return parsed;
    };

    let finalSalaryMin, finalSalaryMax;
    try {
        finalSalaryMin = convertSalaryToInt(salaryMin, 'salaryMin');
        finalSalaryMax = convertSalaryToInt(salaryMax, 'salaryMax');
    } catch (salaryError) {
        throw new Error(salaryError.message);
    }

    // Validate salary range
    if (finalSalaryMin && finalSalaryMax && finalSalaryMin > finalSalaryMax) {
        throw new Error(`Invalid salary range: Minimum salary (${finalSalaryMin}) cannot be greater than maximum salary (${finalSalaryMax}).`);
    }

    // Debug logging
    console.log(`🔍 Salary Debug for ${title}:`);
    console.log(`  Original salaryMin: "${salaryMin}" (type: ${typeof salaryMin})`);
    console.log(`  Original salaryMax: "${salaryMax}" (type: ${typeof salaryMax})`);
    console.log(`  Converted salaryMin: ${finalSalaryMin} (type: ${typeof finalSalaryMin})`);
    console.log(`  Converted salaryMax: ${finalSalaryMax} (type: ${typeof finalSalaryMax})`);

    // Create a new job post in the database
    const newJob = await prisma.ats_JobPost.create({
        data: {
            title,
            company,
            companyName: company, // Set companyName to the same value as company
            department,
            internalSPOC,
            recruiter,
            email,
            jobType,
            experienceLevel,
            country,
            city,
            fullLocation: finalFullLocation,
            workType: workType ? workType.toUpperCase() : 'ONSITE',
            jobStatus: jobStatus ? jobStatus.toUpperCase() : 'ACTIVE',
            salaryMin: finalSalaryMin,
            salaryMax: finalSalaryMax,
            priority,
            description,
            requirements,
            requiredSkills,
            benefits,
            companyRelation: {
                connect: { id: companyId }
            }
        }
    });

    // Generate job embedding automatically (async, don't wait)
    try {
        console.log(`🔄 Generating embedding for job ${newJob.id}: ${newJob.title}`);
        // Call Python API to generate job embedding asynchronously
        fetch('http://localhost:8000/api/v1/job-post-embeddings/update-job-embedding', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                job_id: newJob.id,
                job_data: {
                    id: newJob.id,
                    title: newJob.title,
                    description: newJob.description,
                    requirements: newJob.requirements,
                    requiredSkills: newJob.requiredSkills,
                    experienceLevel: newJob.experienceLevel,
                    company: newJob.company
                }
            })
        }).then(response => {
            if (response.ok) {
                console.log(`✅ Embedding generated successfully for job ${newJob.id}`);
            } else {
                console.warn(`⚠️ Failed to generate embedding for job ${newJob.id}`);
            }
        }).catch(error => {
            console.error(`❌ Error generating embedding for job ${newJob.id}:`, error.message);
        });
    } catch (embeddingError) {
        console.error('Failed to initiate embedding generation:', embeddingError);
        // Don't fail the request if embedding generation fails
    }

    // Send email notification for job creation
    if (newJob.email) {
        try {
            const createInfo = {
                createdBy: (req.user && req.user.name) || (req.user && req.user.email) || 'System Administrator',
                createdAt: new Date(),
                reason: jobData.createReason || 'New job posting created',
                jobId: newJob.id
            };
            await sendJobCreateEmail(newJob.email, newJob, createInfo);
        } catch (emailError) {
            console.error('Failed to send creation email:', emailError);
            // Don't fail the request if email fails
        }
    }

    return newJob;
};

export const createJobPost = async(req, res) => {
    try {
        // Check if request body is an array (bulk posting) or single object
        const isBulkPosting = Array.isArray(req.body);
        const jobsData = isBulkPosting ? req.body : [req.body];

        console.log(`🚀 ${isBulkPosting ? 'BULK' : 'SINGLE'} job posting request received`);
        console.log(`📊 Processing ${jobsData.length} job(s)`);

        const results = [];
        const errors = [];

        // Process each job
        for (let i = 0; i < jobsData.length; i++) {
            try {
                const jobData = jobsData[i];
                console.log(`📝 Processing job ${i + 1}/${jobsData.length}: ${jobData.title || 'Untitled'}`);

                const newJob = await processSingleJob(jobData, req);
                results.push({
                    index: i,
                    success: true,
                    job: newJob
                });
                console.log(`✅ Job ${i + 1} created successfully with ID: ${newJob.id}`);
            } catch (error) {
                console.error(`❌ Job ${i + 1} failed:`, error.message);

                // Create detailed error information
                const errorInfo = {
                    index: i,
                    success: false,
                    error: error.message,
                    jobData: jobsData[i],
                    fieldErrors: {},
                    suggestions: []
                };

                // Parse specific field errors
                if (error.message.includes('salaryMin')) {
                    errorInfo.fieldErrors.salaryMin = error.message;
                    errorInfo.suggestions.push('Please provide a valid minimum salary (e.g., 500000 for ₹5 Lakhs)');
                }
                if (error.message.includes('salaryMax')) {
                    errorInfo.fieldErrors.salaryMax = error.message;
                    errorInfo.suggestions.push('Please provide a valid maximum salary (e.g., 1000000 for ₹10 Lakhs)');
                }
                if (error.message.includes('salary range')) {
                    errorInfo.fieldErrors.salaryRange = error.message;
                    errorInfo.suggestions.push('Ensure minimum salary is less than maximum salary');
                }
                if (error.message.includes('Email')) {
                    errorInfo.fieldErrors.email = error.message;
                    errorInfo.suggestions.push('Please provide a valid email address');
                }
                if (error.message.includes('Company ID')) {
                    errorInfo.fieldErrors.companyId = error.message;
                    errorInfo.suggestions.push('Company ID is required for job posting');
                }

                errors.push(errorInfo);
            }
        }

        // Prepare response based on results
        const successCount = results.length;
        const errorCount = errors.length;

        if (isBulkPosting) {
            if (successCount === 0) {
                return res.status(400).json({
                    message: 'All job postings failed',
                    success: false,
                    totalJobs: jobsData.length,
                    successfulJobs: successCount,
                    failedJobs: errorCount,
                    results: results,
                    errors: errors,
                    validationErrors: errors.reduce((acc, error) => {
                        if (error.fieldErrors) {
                            Object.assign(acc, error.fieldErrors);
                        }
                        return acc;
                    }, {}),
                    suggestions: errors.reduce((acc, error) => {
                        if (error.suggestions) {
                            acc.push(...error.suggestions);
                        }
                        return acc;
                    }, [])
                });
            } else if (errorCount > 0) {
                return res.status(207).json({ // 207 Multi-Status for partial success
                    message: `Bulk job posting completed with ${errorCount} error(s)`,
                    success: true,
                    totalJobs: jobsData.length,
                    successfulJobs: successCount,
                    failedJobs: errorCount,
                    results: results,
                    errors: errors,
                    validationErrors: errors.reduce((acc, error) => {
                        if (error.fieldErrors) {
                            Object.assign(acc, error.fieldErrors);
                        }
                        return acc;
                    }, {}),
                    suggestions: errors.reduce((acc, error) => {
                        if (error.suggestions) {
                            acc.push(...error.suggestions);
                        }
                        return acc;
                    }, [])
                });
            } else {
                return res.status(201).json({
                    message: `All ${successCount} job postings created successfully!`,
                    success: true,
                    totalJobs: jobsData.length,
                    successfulJobs: successCount,
                    failedJobs: errorCount,
                    results: results
                });
            }
        } else {
            // Single job posting
            if (successCount === 1) {
                return res.status(201).json({
                    message: 'Job post created successfully!',
                    success: true,
                    job: results[0].job
                });
            } else {
                return res.status(400).json({
                    message: 'Job post creation failed',
                    success: false,
                    error: errors[0].error
                });
            }
        }
    } catch (error) {
        console.error('❌ Unexpected error in createJobPost:', error);
        res.status(500).json({
            message: 'Error creating job post(s)',
            error: error.message
        });
    }
};

export const getJobPosts = async(req, res) => {
    try {
        // Get company ID from query parameters or user context
        const { companyId } = req.query;
        const userCompanyId = req.companyId; // From auth middleware

        // Build where clause for company isolation
        let whereClause = {};
        const finalCompanyId = companyId || userCompanyId;
        if (finalCompanyId) {
            whereClause.companyId = parseInt(finalCompanyId);
        }

        const jobs = await prisma.ats_JobPost.findMany({
            where: whereClause,
            include: {
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
        const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
        const jobsWithUrl = jobs.map(job => ({
            ...job,
            companyLogo: (job.companyRelation && job.companyRelation.logo) || null,
            applyUrl: `${baseUrl}/api/job-listings/${createJobSlug(job)}`
        }));
        res.status(200).json({ jobs: jobsWithUrl });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching job posts', error: error.message });
    }
};

export const updateJobPost = async(req, res) => {
    const jobId = parseInt(req.params.id);
    const {
        title,
        company,
        department,
        internalSPOC,
        recruiter,
        email,
        jobType,
        experienceLevel,
        country,
        city,
        fullLocation,
        workType,
        jobStatus,
        salaryMin,
        salaryMax,
        priority,
        description,
        requirements,
        requiredSkills,
        benefits
    } = req.body;

    try {
        // Get the original job data before update
        const originalJob = await prisma.ats_JobPost.findUnique({
            where: { id: jobId }
        });

        if (!originalJob) {
            return res.status(404).json({ message: 'Job post not found' });
        }

        // Validate enum values
        validateEnumValues(workType, jobStatus);

        // Create fullLocation if not provided
        const finalFullLocation = fullLocation || (city && country ? `${city}, ${country}` : city || country || '');

        const updatedJob = await prisma.ats_JobPost.update({
            where: { id: jobId },
            data: {
                title,
                company,
                companyName: company, // Update companyName to match company
                department,
                internalSPOC,
                recruiter,
                email,
                jobType,
                experienceLevel,
                country,
                city,
                fullLocation: finalFullLocation,
                workType: workType ? workType.toUpperCase() : undefined,
                jobStatus: jobStatus ? jobStatus.toUpperCase() : undefined,
                salaryMin,
                salaryMax,
                priority,
                description,
                requirements,
                requiredSkills,
                benefits,
            }
        });

        // Determine which fields were updated
        const updatedFields = [];
        const fieldsToCheck = [
            { name: 'Title', original: originalJob.title, updated: title },
            { name: 'Company', original: originalJob.company, updated: company },
            { name: 'Department', original: originalJob.department, updated: department },
            { name: 'Internal SPOC', original: originalJob.internalSPOC, updated: internalSPOC },
            { name: 'Recruiter', original: originalJob.recruiter, updated: recruiter },
            { name: 'Job Type', original: originalJob.jobType, updated: jobType },
            { name: 'Experience Level', original: originalJob.experienceLevel, updated: experienceLevel },
            { name: 'Country', original: originalJob.country, updated: country },
            { name: 'City', original: originalJob.city, updated: city },
            { name: 'Full Location', original: originalJob.fullLocation, updated: fullLocation },
            { name: 'Work Type', original: originalJob.workType, updated: workType },
            { name: 'Job Status', original: originalJob.jobStatus, updated: jobStatus },
            { name: 'Salary Min', original: originalJob.salaryMin, updated: salaryMin },
            { name: 'Salary Max', original: originalJob.salaryMax, updated: salaryMax },
            { name: 'Priority', original: originalJob.priority, updated: priority },
            { name: 'Description', original: originalJob.description, updated: description },
            { name: 'Requirements', original: originalJob.requirements, updated: requirements },
            { name: 'Required Skills', original: originalJob.requiredSkills, updated: requiredSkills },
            { name: 'Benefits', original: originalJob.benefits, updated: benefits }
        ];

        fieldsToCheck.forEach(field => {
            if (field.original !== field.updated && field.updated !== undefined) {
                updatedFields.push(field.name);
            }
        });

        // Regenerate job embedding if content changed (async, don't wait)
        const contentFields = ['title', 'description', 'requirements', 'requiredSkills', 'experienceLevel'];
        const contentChanged = contentFields.some(field =>
            originalJob[field] !== updatedJob[field] && updatedJob[field] !== undefined
        );

        if (contentChanged) {
            try {
                console.log(`🔄 Regenerating embedding for updated job ${updatedJob.id}: ${updatedJob.title}`);
                fetch('http://localhost:8000/api/v1/job-post-embeddings/update-job-embedding', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        job_id: updatedJob.id,
                        job_data: {
                            id: updatedJob.id,
                            title: updatedJob.title,
                            description: updatedJob.description,
                            requirements: updatedJob.requirements,
                            requiredSkills: updatedJob.requiredSkills,
                            experienceLevel: updatedJob.experienceLevel,
                            company: updatedJob.company
                        }
                    })
                }).then(response => {
                    if (response.ok) {
                        console.log(`✅ Embedding regenerated successfully for job ${updatedJob.id}`);
                    } else {
                        console.warn(`⚠️ Failed to regenerate embedding for job ${updatedJob.id}`);
                    }
                }).catch(error => {
                    console.error(`❌ Error regenerating embedding for job ${updatedJob.id}:`, error.message);
                });
            } catch (embeddingError) {
                console.error('Failed to initiate embedding regeneration:', embeddingError);
                // Don't fail the request if embedding generation fails
            }
        }

        // Send email notification if there are updates and email is provided
        if (updatedFields.length > 0 && updatedJob.email) {
            try {
                const updateInfo = {
                    updatedBy: (req.user && req.user.name) || (req.user && req.user.email) || 'System Administrator',
                    updatedAt: new Date(),
                    reason: req.body.updateReason || 'Job posting information updated',
                    jobId: updatedJob.id
                };
                await sendJobUpdateEmail(updatedJob.email, updatedJob, updatedFields, updateInfo);
            } catch (emailError) {
                console.error('Failed to send update email:', emailError);
                // Don't fail the request if email fails
            }
        }



        res.status(200).json({
            message: 'Job post updated successfully!',
            job: updatedJob,
            updatedFields: updatedFields
        });
    } catch (error) {
        res.status(500).json({ message: 'Error updating job post', error: error.message });
    }
};

export const deleteJobPost = async(req, res) => {
    const jobId = parseInt(req.params.id);

    console.log('🚀 DELETE JOB REQUEST RECEIVED');
    console.log('Job ID:', jobId);
    console.log('Request User:', req.user);
    console.log('Request Body:', req.body);

    try {
        // Get the job data before deletion
        const jobToDelete = await prisma.ats_JobPost.findUnique({
            where: { id: jobId }
        });

        if (!jobToDelete) {
            console.log('❌ Job not found in database');
            return res.status(404).json({ message: 'Job post not found' });
        }

        console.log('✅ Job found in database:', jobToDelete.title);

        // Delete the job post
        await prisma.ats_JobPost.delete({
            where: { id: jobId }
        });

        console.log('✅ Job deleted from database');

        // Send email notification if email is provided
        console.log('🔍 Delete Email Debug:');
        console.log('Job Email from DB:', jobToDelete.email);
        console.log('Job Email from Request:', req.body.email);
        console.log('Job Data:', jobToDelete);

        // Use email from request body as fallback if not in database
        const emailToUse = jobToDelete.email || req.body.email;

        if (emailToUse) {
            try {
                const deleteInfo = {
                    deletedBy: (req.user && req.user.name) || (req.user && req.user.email) || 'System Administrator',
                    deletedAt: new Date(),
                    reason: req.body.deleteReason || 'Job posting removed from system',
                    jobId: jobToDelete.id
                };
                console.log('Delete Info:', deleteInfo);
                console.log('Using email:', emailToUse);
                await sendJobDeleteEmail(emailToUse, jobToDelete, deleteInfo);
                console.log('✅ Delete email sent successfully!');
            } catch (emailError) {
                console.error('❌ Failed to send deletion email:', emailError);
                console.error('Full error:', emailError);
                // Don't fail the request if email fails
            }
        } else {
            console.log('⚠️  No email found for job, skipping email notification');
        }

        res.status(200).json({
            message: 'Job post deleted successfully!',
            deletedJob: {
                id: jobToDelete.id,
                title: jobToDelete.title,
                company: jobToDelete.company
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting job post', error: error.message });
    }
};

// New function to update job status
export const updateJobStatus = async(req, res) => {
    const jobId = parseInt(req.params.id);
    const { jobStatus } = req.body;

    try {
        // Get the original job data before update
        const originalJob = await prisma.ats_JobPost.findUnique({
            where: { id: jobId }
        });

        if (!originalJob) {
            return res.status(404).json({ message: 'Job post not found' });
        }

        // Validate job status
        validateEnumValues(null, jobStatus);

        const updatedJob = await prisma.ats_JobPost.update({
            where: { id: jobId },
            data: {
                jobStatus: jobStatus.toUpperCase()
            }
        });

        // Send email notification if status changed and email is provided
        if (originalJob.jobStatus !== jobStatus.toUpperCase() && updatedJob.email) {
            try {
                const updatedFields = ['Job Status'];
                const updateInfo = {
                    updatedBy: (req.user && req.user.name) || (req.user && req.user.email) || 'System Administrator',
                    updatedAt: new Date(),
                    reason: req.body.statusUpdateReason || `Job status changed from ${originalJob.jobStatus} to ${jobStatus.toUpperCase()}`,
                    jobId: updatedJob.id
                };
                await sendJobUpdateEmail(updatedJob.email, updatedJob, updatedFields, updateInfo);
            } catch (emailError) {
                console.error('Failed to send status update email:', emailError);
                // Don't fail the request if email fails
            }
        }

        res.status(200).json({
            message: 'Job status updated successfully!',
            job: updatedJob,
            previousStatus: originalJob.jobStatus,
            newStatus: jobStatus.toUpperCase()
        });
    } catch (error) {
        res.status(500).json({ message: 'Error updating job status', error: error.message });
    }
};

// New function to get jobs by status
export const getJobsByStatus = async(req, res) => {
    const { status } = req.params;

    try {
        // Validate status
        validateEnumValues(null, status);

        const jobs = await prisma.ats_JobPost.findMany({
            where: {
                jobStatus: status.toUpperCase()
            },
            select: {
                id: true,
                title: true,
                company: true,
                companyName: true,
                department: true,
                internalSPOC: true,
                recruiter: true,
                jobType: true,
                experienceLevel: true,
                country: true,
                city: true,
                fullLocation: true,
                salaryMin: true,
                salaryMax: true,
                priority: true,
                description: true,
                requirements: true,
                requiredSkills: true,
                benefits: true,
                createdAt: true,
                jobStatus: true,
                workType: true,
                customerId: true,
                email: true
                    // embedding field is excluded to improve API performance
            }
        });

        const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
        const jobsWithUrl = jobs.map(job => ({
            ...job,
            applyUrl: `${baseUrl}/api/job-listings/${createJobSlug(job)}`
        }));

        res.status(200).json({
            jobs: jobsWithUrl,
            count: jobs.length,
            status: status.toUpperCase()
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching jobs by status', error: error.message });
    }
};