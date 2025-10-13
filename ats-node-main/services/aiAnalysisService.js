import OpenAI from 'openai';
import prisma from '../prismaClient.js';

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

class AIAnalysisService {
    /**
     * Analyze candidate with AI for job fit
     * @param {Object} candidate - Candidate data
     * @param {Object} jobPosting - Job posting data
     * @param {Object} company - Company data
     * @returns {Object} AI analysis results
     */
    async analyzeCandidateWithAI(candidate, jobPosting, company = null) {
        try {
            console.log('🤖 Starting AI analysis for candidate:', candidate.email);

            // Extract candidate data
            const candidateData = this.extractCandidateData(candidate);
            const jobData = this.extractJobData(jobPosting);

            // Perform parallel AI analysis
            const [skillsAnalysis, experienceAnalysis, culturalFitAnalysis, strengthsWeaknesses] = await Promise.all([
                this.analyzeSkillsWithAI(candidateData.skills, jobData.requiredSkills, jobData.title),
                this.analyzeExperienceWithAI(candidateData.experience, jobData.experienceLevel, jobData.title),
                this.analyzeCulturalFitWithAI(candidateData, jobData, company),
                this.generateStrengthsAndWeaknesses(candidateData, jobData)
            ]);

            // Calculate overall score
            const overallScore = this.calculateOverallScore(
                skillsAnalysis.skills_match_score,
                experienceAnalysis.experience_match_score,
                culturalFitAnalysis.cultural_fit_score
            );

            // Determine verdict
            const verdict = this.determineVerdict(overallScore);

            // Calculate confidence
            const confidence = this.calculateConfidence(
                skillsAnalysis.skills_match_score,
                experienceAnalysis.experience_match_score,
                culturalFitAnalysis.cultural_fit_score
            );

            // Generate reasoning
            const reasoning = this.generateReasoning(
                overallScore,
                skillsAnalysis.explanation,
                experienceAnalysis.explanation,
                culturalFitAnalysis.explanation
            );

            const analysis = {
                overall_score: overallScore,
                skills_match_score: skillsAnalysis.skills_match_score,
                experience_match_score: experienceAnalysis.experience_match_score,
                cultural_fit_score: culturalFitAnalysis.cultural_fit_score,
                verdict: verdict,
                confidence: confidence,
                reasoning: reasoning,
                strengths: strengthsWeaknesses.strengths,
                weaknesses: strengthsWeaknesses.weaknesses,
                ai_model: 'gpt-4o-mini',
                analysis_date: new Date()
            };

            console.log('🤖 AI analysis completed:', {
                overallScore: overallScore,
                verdict: verdict,
                confidence: confidence
            });

            return analysis;

        } catch (error) {
            console.error('🤖 AI analysis error:', error);
            throw new Error(`AI analysis failed: ${error.message}`);
        }
    }

    /**
     * Analyze skills match using AI
     */
    async analyzeSkillsWithAI(candidateSkills, jobSkills, jobTitle) {
        try {
            console.log('🤖 Starting AI skills analysis...');

            const prompt = `
        You are an expert HR recruiter analyzing skills alignment between a candidate and job requirements.
        
        JOB DETAILS:
        - Title: ${jobTitle}
        - Required Skills: ${jobSkills.join(', ')}
        
        CANDIDATE DETAILS:
        - Skills: ${candidateSkills.join(', ')}
        
        ANALYSIS TASK:
        Rate how well the candidate's skills match the job requirements (0.0-1.0)
        
        CONSIDER:
        - Skill synonyms and variations (React = React.js, Node.js = Node, Python = Python 3.9)
        - Related technologies and frameworks
        - Industry-specific terminology
        - Technology stack compatibility
        - Transferable skills and knowledge areas
        - Skill level alignment
        
        SCORING GUIDELINES:
        - 0.8-1.0: Excellent skills match (most/all required skills present)
        - 0.6-0.79: Good skills match (many required skills present)
        - 0.4-0.59: Fair skills match (some required skills present)
        - 0.2-0.39: Poor skills match (few required skills present)
        - 0.0-0.19: Very poor skills match (no relevant skills)
        
        IMPORTANT: Be FAIR and recognize skill synonyms, related technologies, and transferable abilities.
        
        Return ONLY a JSON response with these exact keys:
        {
          "skills_match_score": [YOUR_SCORE_HERE],
          "explanation": "[YOUR_EXPLANATION_HERE]"
        }
      `;

            const response = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [{
                        role: "system",
                        content: "You are an expert HR recruiter providing fair and accurate skills analysis. Be intelligent about skill recognition and transferable abilities. Respond only with valid JSON."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                max_tokens: 300,
                temperature: 0.2,
                response_format: { type: "json_object" }
            });

            const result = JSON.parse(response.choices[0].message.content);
            console.log('🤖 Skills analysis completed:', result);
            return {
                skills_match_score: parseFloat(result.skills_match_score),
                explanation: result.explanation
            };
        } catch (error) {
            console.error('Skills analysis error:', error);
            return {
                skills_match_score: 0.5,
                explanation: "Unable to analyze skills due to AI service error"
            };
        }
    }

    /**
     * Analyze experience match using AI
     */
    async analyzeExperienceWithAI(candidateExperience, jobExperienceLevel, jobTitle) {
        try {
            console.log('🤖 Starting AI experience analysis...');

            const prompt = `
        You are an expert HR recruiter analyzing experience alignment between a candidate and job requirements.
        
        JOB DETAILS:
        - Title: ${jobTitle}
        - Required Experience Level: ${jobExperienceLevel}
        
        CANDIDATE DETAILS:
        - Experience: ${candidateExperience}
        
        ANALYSIS TASK:
        Rate how well the candidate's experience matches the job requirements (0.0-1.0)
        
        CONSIDER:
        - Years of experience relevance
        - Industry experience alignment
        - Role progression and growth
        - Leadership and management experience
        - Technical depth and breadth
        - Project complexity and scope
        
        SCORING GUIDELINES:
        - 0.8-1.0: Excellent experience match (exceeds requirements)
        - 0.6-0.79: Good experience match (meets requirements well)
        - 0.4-0.59: Fair experience match (meets basic requirements)
        - 0.2-0.39: Poor experience match (below requirements)
        - 0.0-0.19: Very poor experience match (significantly below requirements)
        
        IMPORTANT: Be FAIR and consider transferable experience and growth potential.
        
        Return ONLY a JSON response with these exact keys:
        {
          "experience_match_score": [YOUR_SCORE_HERE],
          "explanation": "[YOUR_EXPLANATION_HERE]"
        }
      `;

            const response = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [{
                        role: "system",
                        content: "You are an expert HR recruiter providing fair and accurate experience analysis. Consider transferable skills and growth potential. Respond only with valid JSON."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                max_tokens: 300,
                temperature: 0.2,
                response_format: { type: "json_object" }
            });

            const result = JSON.parse(response.choices[0].message.content);
            console.log('🤖 Experience analysis completed:', result);
            return {
                experience_match_score: parseFloat(result.experience_match_score),
                explanation: result.explanation
            };
        } catch (error) {
            console.error('Experience analysis error:', error);
            return {
                experience_match_score: 0.5,
                explanation: "Unable to analyze experience due to AI service error"
            };
        }
    }

    /**
     * Analyze cultural fit using AI
     */
    async analyzeCulturalFitWithAI(candidateData, jobData, company = null) {
            try {
                console.log('🤖 Starting AI cultural fit analysis...');

                const prompt = `
        You are an expert HR recruiter analyzing cultural fit between a candidate and job/company.
        
        JOB DETAILS:
        - Title: ${jobData.title}
        - Job Type: ${jobData.jobType}
        - Work Type: ${jobData.workType}
        - Location: ${jobData.location}
        
        CANDIDATE DETAILS:
        - Location: ${candidateData.location}
        - Remote Work Preference: ${candidateData.remoteWork}
        - Experience: ${candidateData.experience}
        - Skills: ${candidateData.skills.join(', ')}
        
        ${company ? `COMPANY DETAILS:
        - Name: ${company.name}
        - Industry: ${company.industry || 'Not specified'}` : ''}
        
        ANALYSIS TASK:
        Rate the cultural fit between candidate and job/company (0.0-1.0)
        
        CONSIDER:
        - Work environment preferences (remote, hybrid, onsite)
        - Geographic compatibility
        - Industry alignment
        - Work style preferences
        - Career growth alignment
        - Company culture fit indicators
        
        SCORING GUIDELINES:
        - 0.8-1.0: Excellent cultural fit (perfect alignment)
        - 0.6-0.79: Good cultural fit (strong alignment)
        - 0.4-0.59: Fair cultural fit (moderate alignment)
        - 0.2-0.39: Poor cultural fit (weak alignment)
        - 0.0-0.19: Very poor cultural fit (misalignment)
        
        IMPORTANT: Be FAIR and consider flexibility and adaptability.
        
        Return ONLY a JSON response with these exact keys:
        {
          "cultural_fit_score": [YOUR_SCORE_HERE],
          "explanation": "[YOUR_EXPLANATION_HERE]"
        }
      `;
      
            // Temporarily disabled - return default analysis
            const response = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "system",
                        content: "You are an expert HR recruiter providing fair and accurate cultural fit analysis. Consider flexibility and adaptability. Respond only with valid JSON."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                max_tokens: 400,
                temperature: 0.3,
                response_format: { type: "json_object" }
            });
            
            const result = JSON.parse(response.choices[0].message.content);
            console.log('🤖 Cultural fit analysis completed:', result);
            return {
                cultural_fit_score: parseFloat(result.cultural_fit_score),
                explanation: result.explanation
            };
        } catch (error) {
            console.error('Cultural fit analysis error:', error);
            return {
                cultural_fit_score: 0.6,
                explanation: "Unable to analyze cultural fit due to AI service error"
            };
        }
    }

    /**
     * Generate strengths and weaknesses using AI
     */
    async generateStrengthsAndWeaknesses(candidateData, jobData) {
        try {
            console.log('🤖 Starting AI strengths/weaknesses generation...');
            
            const prompt = `
              You are an expert HR recruiter generating specific strengths and weaknesses for a candidate-job match.
              
              CANDIDATE DETAILS:
              - Name: ${candidateData.fullName}
              - Skills: ${candidateData.skills.join(', ')}
              - Experience: ${candidateData.experience}
              - Location: ${candidateData.location}
              
              JOB DETAILS:
              - Title: ${jobData.title}
              - Required Skills: ${jobData.requiredSkills.join(', ')}
              - Experience Level: ${jobData.experienceLevel}
              - Job Type: ${jobData.jobType}
              
              TASK:
              Generate 3-5 specific strengths and 2-3 specific weaknesses for this candidate-job match.
              Be specific, actionable, and based on the actual data provided.
              
              STRENGTHS should highlight:
              - Technical competencies that align with job requirements
              - Relevant experience and achievements
              - Transferable skills
              - Positive attributes for the role
              
              WEAKNESSES should identify:
              - Skill gaps or missing competencies
              - Areas for improvement
              - Potential challenges or concerns
              - Development opportunities
              
              IMPORTANT: Be constructive and specific. Avoid generic statements.
              
              Return ONLY a JSON response with these exact keys:
              {
                "strengths": ["strength1", "strength2", "strength3"],
                "weaknesses": ["weakness1", "weakness2"]
              }
            `;
      
            const response = await openai.chat.completions.create({
              model: "gpt-4o-mini",
              messages: [
                {
                  role: "system",
                  content: "You are an expert HR recruiter providing constructive and specific feedback. Be specific and actionable. Respond only with valid JSON."
                },
                {
                  role: "user",
                  content: prompt
                }
              ],
              max_tokens: 400,
              temperature: 0.3,
              response_format: { type: "json_object" }
            });
      
            const result = JSON.parse(response.choices[0].message.content);
            console.log('🤖 Strengths/weaknesses generation completed:', result);
            return {
              strengths: result.strengths || [],
              weaknesses: result.weaknesses || []
            };
        } catch (error) {
            console.error('Strengths/weaknesses generation error:', error);
            return {
                strengths: ["Strong technical background", "Relevant experience"],
                weaknesses: ["Limited experience with specific technologies", "Could benefit from additional training"]
            };
        }
    }

    /**
     * Get default skills analysis when AI is disabled
     */
    getDefaultSkillsAnalysis() {
        return {
            skills_match_score: 0.7,
            explanation: "Skills analysis temporarily disabled - using default score"
        };
    }

    /**
     * Get default experience analysis when AI is disabled
     */
    getDefaultExperienceAnalysis() {
        return {
            experience_match_score: 0.7,
            explanation: "Experience analysis temporarily disabled - using default score"
        };
    }

    /**
     * Get default cultural fit analysis when AI is disabled
     */
    getDefaultCulturalFitAnalysis() {
        return {
            cultural_fit_score: 0.6,
            explanation: "Cultural fit analysis temporarily disabled - using default score"
        };
    }

    /**
     * Get default strengths and weaknesses when AI is disabled
     */
    getDefaultStrengthsWeaknesses() {
        return {
            strengths: ["Strong technical background", "Relevant experience"],
            weaknesses: ["Limited experience with specific technologies", "Could benefit from additional training"]
        };
    }

    /**
     * Extract candidate data for analysis
     */
    extractCandidateData(candidate) {
        return {
            fullName: `${candidate.firstName} ${candidate.lastName}`,
            email: candidate.email,
            phone: candidate.phone,
            location: candidate.currentLocation,
            experience: candidate.yearsOfExperience ? `${candidate.yearsOfExperience} years` : 'Not specified',
            skills: candidate.keySkills ? candidate.keySkills.split(',').map(s => s.trim()) : [],
            remoteWork: candidate.remoteWork,
            salaryExpectation: candidate.salaryExpectation,
            noticePeriod: candidate.noticePeriod
        };
    }

    /**
     * Extract job data for analysis
     */
    extractJobData(jobPosting) {
        return {
            title: jobPosting.title,
            company: jobPosting.company,
            location: jobPosting.city,
            jobType: jobPosting.jobType,
            experienceLevel: jobPosting.experienceLevel,
            workType: jobPosting.workType,
            requiredSkills: jobPosting.requiredSkills ? jobPosting.requiredSkills.split(',').map(s => s.trim()) : [],
            description: jobPosting.description || '',
            salaryMin: jobPosting.salaryMin,
            salaryMax: jobPosting.salaryMax
        };
    }

    /**
     * Calculate overall score from individual scores
     */
    calculateOverallScore(skillsScore, experienceScore, culturalFitScore) {
        // Weighted average: 40% skills, 35% experience, 25% cultural fit
        const overallScore = (skillsScore * 0.4) + (experienceScore * 0.35) + (culturalFitScore * 0.25);
        return Math.round(overallScore * 100) / 100; // Round to 2 decimal places
    }

    /**
     * Determine verdict based on overall score
     */
    determineVerdict(overallScore) {
        if (overallScore >= 0.85) return "highly_recommended";
        if (overallScore >= 0.70) return "recommended";
        if (overallScore >= 0.50) return "consider";
        return "not_recommended";
    }

    /**
     * Calculate confidence based on score consistency
     */
    calculateConfidence(skillsScore, experienceScore, culturalFitScore) {
        const scores = [skillsScore, experienceScore, culturalFitScore];
        const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
        const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
        const standardDeviation = Math.sqrt(variance);

        // Higher confidence for more consistent scores
        const consistency = Math.max(0, 1 - (standardDeviation * 2));
        const confidence = Math.round((mean * 0.7 + consistency * 0.3) * 100);

        return Math.max(60, Math.min(95, confidence)); // Clamp between 60-95%
    }

    /**
     * Generate comprehensive reasoning
     */
    generateReasoning(overallScore, skillsExplanation, experienceExplanation, culturalFitExplanation) {
        const scorePercentage = Math.round(overallScore * 100);

        let baseReasoning = `Based on comprehensive AI analysis, this candidate shows ${scorePercentage}% overall fit for the role. `;

        if (overallScore >= 0.85) {
            baseReasoning += "The candidate demonstrates exceptional alignment across all key areas including technical skills, relevant experience, and cultural fit. ";
        } else if (overallScore >= 0.70) {
            baseReasoning += "The candidate shows strong potential with good alignment in most areas. ";
        } else if (overallScore >= 0.50) {
            baseReasoning += "The candidate presents a moderate fit with some areas of strength and opportunities for development. ";
        } else {
            baseReasoning += "The candidate shows limited alignment with the role requirements. ";
        }

        baseReasoning += `Skills analysis: ${skillsExplanation}. Experience evaluation: ${experienceExplanation}. Cultural fit assessment: ${culturalFitExplanation}.`;

        return baseReasoning;
    }

    /**
     * Get cached analysis result
     */
    async getCachedAnalysis(candidateId, jobId, companyId) {
        try {
            const cached = await prisma.aIAnalysisResult.findUnique({
                where: {
                    unique_ai_analysis: {
                        candidateId: parseInt(candidateId),
                        jobId: parseInt(jobId),
                        companyId: parseInt(companyId)
                    }
                }
            });

            if (cached) {
                // Check if cache is still valid (24 hours)
                const cacheAge = Date.now() - new Date(cached.analysisDate).getTime();
                const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

                if (cacheAge < maxAge) {
                    console.log('🤖 Using cached AI analysis result');
                    return {
                        overall_score: cached.overallScore,
                        skills_match_score: cached.skillsMatch,
                        experience_match_score: cached.experienceMatch,
                        cultural_fit_score: cached.culturalFit,
                        verdict: cached.verdict,
                        confidence: cached.confidence,
                        reasoning: cached.reasoning,
                        strengths: cached.strengths,
                        weaknesses: cached.weaknesses,
                        ai_model: cached.aiModel,
                        analysis_date: cached.analysisDate
                    };
                }
            }

            return null;
        } catch (error) {
            console.error('Error getting cached analysis:', error);
            return null;
        }
    }

    /**
     * Save analysis result to cache
     */
    async saveAnalysisToCache(candidateId, jobId, companyId, analysis) {
        try {
            await prisma.aIAnalysisResult.upsert({
                where: {
                    unique_ai_analysis: {
                        candidateId: parseInt(candidateId),
                        jobId: parseInt(jobId),
                        companyId: parseInt(companyId)
                    }
                },
                update: {
                    overallScore: analysis.overall_score,
                    skillsMatch: analysis.skills_match_score,
                    experienceMatch: analysis.experience_match_score,
                    culturalFit: analysis.cultural_fit_score,
                    verdict: analysis.verdict,
                    confidence: analysis.confidence,
                    reasoning: analysis.reasoning,
                    strengths: analysis.strengths,
                    weaknesses: analysis.weaknesses,
                    aiModel: analysis.ai_model,
                    analysisDate: analysis.analysis_date,
                    updatedAt: new Date()
                },
                create: {
                    candidateId: parseInt(candidateId),
                    jobId: parseInt(jobId),
                    companyId: parseInt(companyId),
                    overallScore: analysis.overall_score,
                    skillsMatch: analysis.skills_match_score,
                    experienceMatch: analysis.experience_match_score,
                    culturalFit: analysis.cultural_fit_score,
                    verdict: analysis.verdict,
                    confidence: analysis.confidence,
                    reasoning: analysis.reasoning,
                    strengths: analysis.strengths,
                    weaknesses: analysis.weaknesses,
                    aiModel: analysis.ai_model,
                    analysisDate: analysis.analysis_date
                }
            });

            console.log('🤖 AI analysis result saved to cache');
        } catch (error) {
            console.error('Error saving analysis to cache:', error);
        }
    }
}

export default new AIAnalysisService();