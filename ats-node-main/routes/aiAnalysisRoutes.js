import express from 'express';
import aiAnalysisService from '../services/aiAnalysisService.js';
import prisma from '../prismaClient.js';

const router = express.Router();

/**
 * POST /ai-analysis/analyze
 * Analyze a specific candidate for a specific job using AI
 */
export const analyzeCandidate = async(req, res) => {
    try {
        const { candidateId, jobId } = req.body;
        const companyId = req.companyId;

        console.log('🤖 AI Analysis Request:', { candidateId, jobId, companyId });

        if (!candidateId || !jobId) {
            return res.status(400).json({
                success: false,
                message: 'Candidate ID and Job ID are required'
            });
        }

        // Check for cached analysis first
        const cachedAnalysis = await aiAnalysisService.getCachedAnalysis(candidateId, jobId, companyId);
        if (cachedAnalysis) {
            console.log('🤖 Returning cached AI analysis');
            return res.json({
                success: true,
                data: cachedAnalysis,
                cached: true
            });
        }

        // Get candidate data
        const candidate = await prisma.CandidateApplication.findUnique({
            where: {
                id: parseInt(candidateId),
                companyId: parseInt(companyId)
            },
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
                        requiredSkills: true,
                        description: true,
                        salaryMin: true,
                        salaryMax: true
                    }
                }
            }
        });

        if (!candidate) {
            return res.status(404).json({
                success: false,
                message: 'Candidate not found'
            });
        }

        // Get job data
        const job = await prisma.ats_JobPost.findUnique({
            where: {
                id: parseInt(jobId),
                companyId: parseInt(companyId)
            }
        });

        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found'
            });
        }

        // Get company data for cultural fit analysis
        const company = await prisma.Company.findUnique({
            where: { id: parseInt(companyId) }
        });

        // Perform AI analysis
        console.log('🤖 Starting AI analysis...');
        const analysis = await aiAnalysisService.analyzeCandidateWithAI(candidate, job, company);

        // Save to cache
        await aiAnalysisService.saveAnalysisToCache(candidateId, jobId, companyId, analysis);

        console.log('🤖 AI analysis completed successfully');
        res.json({
            success: true,
            data: analysis,
            cached: false
        });

    } catch (error) {
        console.error('🤖 AI analysis error:', error);
        res.status(500).json({
            success: false,
            message: 'AI analysis failed',
            error: error.message
        });
    }
};

/**
 * GET /ai-analysis/results/:candidateId/:jobId
 * Get AI analysis results for a specific candidate-job pair
 */
export const getAnalysisResults = async(req, res) => {
    try {
        const { candidateId, jobId } = req.params;
        const companyId = req.companyId;

        const analysis = await aiAnalysisService.getCachedAnalysis(candidateId, jobId, companyId);

        if (!analysis) {
            return res.status(404).json({
                success: false,
                message: 'Analysis not found'
            });
        }

        res.json({
            success: true,
            data: analysis
        });

    } catch (error) {
        console.error('Error getting analysis results:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get analysis results',
            error: error.message
        });
    }
};

/**
 * POST /ai-analysis/batch-analyze
 * Analyze multiple candidates for a specific job
 */
export const batchAnalyzeCandidates = async(req, res) => {
    try {
        const { candidateIds, jobId } = req.body;
        const companyId = req.companyId;

        if (!candidateIds || !Array.isArray(candidateIds) || candidateIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Candidate IDs array is required'
            });
        }

        if (!jobId) {
            return res.status(400).json({
                success: false,
                message: 'Job ID is required'
            });
        }

        console.log('🤖 Batch AI Analysis Request:', { candidateIds, jobId, companyId });

        // Get job data
        const job = await prisma.ats_JobPost.findUnique({
            where: {
                id: parseInt(jobId),
                companyId: parseInt(companyId)
            }
        });

        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found'
            });
        }

        // Get company data
        const company = await prisma.Company.findUnique({
            where: { id: parseInt(companyId) }
        });

        // Process candidates in parallel (limit to 5 at a time to avoid rate limits)
        const batchSize = 5;
        const results = [];

        for (let i = 0; i < candidateIds.length; i += batchSize) {
            const batch = candidateIds.slice(i, i + batchSize);

            const batchPromises = batch.map(async(candidateId) => {
                try {
                    // Check cache first
                    const cachedAnalysis = await aiAnalysisService.getCachedAnalysis(candidateId, jobId, companyId);
                    if (cachedAnalysis) {
                        return {
                            candidateId: parseInt(candidateId),
                            analysis: cachedAnalysis,
                            cached: true
                        };
                    }

                    // Get candidate data
                    const candidate = await prisma.CandidateApplication.findUnique({
                        where: {
                            id: parseInt(candidateId),
                            companyId: parseInt(companyId)
                        }
                    });

                    if (!candidate) {
                        return {
                            candidateId: parseInt(candidateId),
                            error: 'Candidate not found'
                        };
                    }

                    // Perform AI analysis
                    const analysis = await aiAnalysisService.analyzeCandidateWithAI(candidate, job, company);

                    // Save to cache
                    await aiAnalysisService.saveAnalysisToCache(candidateId, jobId, companyId, analysis);

                    return {
                        candidateId: parseInt(candidateId),
                        analysis: analysis,
                        cached: false
                    };

                } catch (error) {
                    console.error(`Error analyzing candidate ${candidateId}:`, error);
                    return {
                        candidateId: parseInt(candidateId),
                        error: error.message
                    };
                }
            });

            const batchResults = await Promise.all(batchPromises);
            results.push(...batchResults);

            // Add small delay between batches to avoid rate limits
            if (i + batchSize < candidateIds.length) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        console.log('🤖 Batch AI analysis completed');
        res.json({
            success: true,
            data: results,
            totalProcessed: results.length
        });

    } catch (error) {
        console.error('Batch AI analysis error:', error);
        res.status(500).json({
            success: false,
            message: 'Batch AI analysis failed',
            error: error.message
        });
    }
};

/**
 * DELETE /ai-analysis/results/:candidateId/:jobId
 * Delete AI analysis results
 */
export const deleteAnalysisResults = async(req, res) => {
    try {
        const { candidateId, jobId } = req.params;
        const companyId = req.companyId;

        await prisma.aIAnalysisResult.deleteMany({
            where: {
                candidateId: parseInt(candidateId),
                jobId: parseInt(jobId),
                companyId: parseInt(companyId)
            }
        });

        res.json({
            success: true,
            message: 'Analysis results deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting analysis results:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete analysis results',
            error: error.message
        });
    }
};

// Define routes
router.post('/analyze', analyzeCandidate);
router.get('/results/:candidateId/:jobId', getAnalysisResults);
router.post('/batch-analyze', batchAnalyzeCandidates);
router.delete('/results/:candidateId/:jobId', deleteAnalysisResults);

export default router;