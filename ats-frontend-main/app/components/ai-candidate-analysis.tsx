"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Badge } from "../../components/ui/badge"
import { Progress } from "../../components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs"
import { handleAuthError } from "../../lib/auth-error-handler"
import {
  Brain,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Star,
  Target,
  Lightbulb,
  Zap,
  Award,
  ThumbsUp,
  ThumbsDown,
  User,
} from "lucide-react"

// AI Analysis types
interface AIAnalysis {
  overallScore: number
  skillsMatch: number
  experienceMatch: number
  culturalFit: number
  verdict: "highly_recommended" | "recommended" | "consider" | "not_recommended"
  reasoning: string
  confidence: number
  strengths: string[]
  weaknesses: string[]
  analysisDate: Date
}

interface AICandidateAnalysisProps {
  candidate: any
  jobPosting: any
  onAnalysisComplete?: (analysis: AIAnalysis) => void
}

// Helper function to format date
const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

// Note: convertToAIAnalysis function removed - now using real AI analysis via API

export default function AICandidateAnalysis({ candidate, jobPosting, onAnalysisComplete }: AICandidateAnalysisProps) {
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    if (candidate && jobPosting) {
      performAIAnalysis()
    }
  }, [candidate, jobPosting])

  const performAIAnalysis = async () => {
    setIsLoading(true)
    try {
      console.log('🤖 Starting real AI analysis for candidate:', candidate.id, 'job:', jobPosting.id)
      
      // Get authentication token
      const user = JSON.parse(localStorage.getItem('ats_user') || 'null');
      const token = user?.token;
      
      if (!token) {
        throw new Error('Authentication required. Please login again.');
      }

      // Call real AI analysis API
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/ai-analysis/analyze`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          candidateId: candidate.id,
          jobId: jobPosting.id
        })
      });

      if (!response.ok) {
        // Handle authentication errors (401, 403)
        if (response.status === 401 || response.status === 403) {
          handleAuthError(response);
        }
        
        // Handle other errors
        const errorData = await response.json();
        throw new Error(errorData.message || `AI analysis failed: ${response.status}`);
      }

      const result = await response.json();
      console.log('🤖 AI analysis result:', result)
      
      if (!result.success) {
        throw new Error(result.message || 'AI analysis failed');
      }

      // Convert API response to frontend format
      const aiAnalysis: AIAnalysis = {
        overallScore: Math.round(result.data.overall_score * 100),
        skillsMatch: Math.round(result.data.skills_match_score * 100),
        experienceMatch: Math.round(result.data.experience_match_score * 100),
        culturalFit: Math.round(result.data.cultural_fit_score * 100),
        verdict: result.data.verdict,
        reasoning: result.data.reasoning,
        confidence: Math.round(result.data.confidence),
        strengths: result.data.strengths || [],
        weaknesses: result.data.weaknesses || [],
        analysisDate: new Date(result.data.analysis_date)
      }
      
      setAnalysis(aiAnalysis)
      onAnalysisComplete?.(aiAnalysis)
      
    } catch (error) {
      console.error("AI Analysis failed:", error)
      const err = error as Error
      // Set a fallback analysis if AI analysis fails
      const fallbackAnalysis: AIAnalysis = {
        overallScore: 50,
        skillsMatch: 50,
        experienceMatch: 50,
        culturalFit: 50,
        verdict: "consider",
        reasoning: `Unable to perform AI analysis: ${err.message}. Please try again.`,
        confidence: 30,
        strengths: ["AI analysis unavailable"],
        weaknesses: ["Please retry AI analysis"],
        analysisDate: new Date(),
      }
      setAnalysis(fallbackAnalysis)
    } finally {
      setIsLoading(false)
    }
  }

  const getVerdictColor = (verdict: string) => {
    switch (verdict) {
      case "highly_recommended":
        return "text-green-600 bg-green-100 border-green-200"
      case "recommended":
        return "text-blue-600 bg-blue-100 border-blue-200"
      case "consider":
        return "text-yellow-600 bg-yellow-100 border-yellow-200"
      case "not_recommended":
        return "text-red-600 bg-red-100 border-red-200"
      default:
        return "text-gray-600 bg-gray-100 border-gray-200"
    }
  }

  const getVerdictIcon = (verdict: string) => {
    switch (verdict) {
      case "highly_recommended":
        return <ThumbsUp className="w-5 h-5 text-green-600" />
      case "recommended":
        return <CheckCircle className="w-5 h-5 text-blue-600" />
      case "consider":
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />
      case "not_recommended":
        return <ThumbsDown className="w-5 h-5 text-red-600" />
      default:
        return <Brain className="w-5 h-5 text-gray-600" />
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600"
    if (score >= 80) return "text-blue-600"
    if (score >= 70) return "text-yellow-600"
    if (score >= 60) return "text-orange-600"
    return "text-red-600"
  }

  const getProgressColor = (score: number) => {
    if (score >= 90) return "bg-green-600"
    if (score >= 80) return "bg-blue-600"
    if (score >= 70) return "bg-yellow-600"
    if (score >= 60) return "bg-orange-600"
    return "bg-red-600"
  }

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="w-5 h-5 text-purple-600 animate-pulse" />
            <span>AI Analysis in Progress...</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-purple-600 animate-bounce" />
              <span className="text-sm text-gray-600">Analyzing candidate profile...</span>
            </div>
            <Progress value={33} className="w-full" />
            <div className="flex items-center space-x-2">
              <Target className="w-4 h-4 text-purple-600 animate-bounce" />
              <span className="text-sm text-gray-600">Matching skills and experience...</span>
            </div>
            <Progress value={66} className="w-full" />
            <div className="flex items-center space-x-2">
              <Award className="w-4 h-4 text-purple-600 animate-bounce" />
              <span className="text-sm text-gray-600">Generating recommendations...</span>
            </div>
            <Progress value={90} className="w-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!analysis) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="w-5 h-5 text-gray-400" />
            <span>AI Analysis Unavailable</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">Unable to generate AI analysis at this time.</p>
          <Button onClick={performAIAnalysis} className="mt-4">
            <Brain className="w-4 h-4 mr-2" />
            Retry Analysis
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* AI Analysis Header */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Brain className="w-6 h-6 text-purple-600" />
                <span>AI-Powered Candidate Analysis</span>
              </CardTitle>
              <p className="text-gray-600 mt-1">
                Comprehensive evaluation for {candidate?.name || "Candidate"} • {jobPosting?.title || "Position"}
              </p>
            </div>
            <Badge className={`${getVerdictColor(analysis.verdict)} border`}>
              {analysis.verdict.replace("_", " ").toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className={`text-3xl font-bold ${getScoreColor(analysis.overallScore)}`}>
                {analysis.overallScore}
              </div>
              <p className="text-sm text-gray-600">Overall Score</p>
            </div>
            <div className="text-center">
              <div className={`text-3xl font-bold ${getScoreColor(analysis.skillsMatch)}`}>{analysis.skillsMatch}%</div>
              <p className="text-sm text-gray-600">Skills Match</p>
            </div>
            <div className="text-center">
              <div className={`text-3xl font-bold ${getScoreColor(analysis.experienceMatch)}`}>
                {analysis.experienceMatch}%
              </div>
              <p className="text-sm text-gray-600">Experience</p>
            </div>
            <div className="text-center">
              <div className={`text-3xl font-bold ${getScoreColor(analysis.culturalFit)}`}>{analysis.culturalFit}%</div>
              <p className="text-sm text-gray-600">Cultural Fit</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="candidate">Candidate Details</TabsTrigger>
          <TabsTrigger value="strengths">Strengths</TabsTrigger>
          <TabsTrigger value="areas">Areas for Growth</TabsTrigger>
          <TabsTrigger value="recommendation">Recommendation</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Score Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  <span>Score Breakdown</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Skills Match</span>
                    <span className={`font-bold ${getScoreColor(analysis.skillsMatch)}`}>{analysis.skillsMatch}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getProgressColor(analysis.skillsMatch)}`}
                      style={{ width: `${analysis.skillsMatch}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Experience Match</span>
                    <span className={`font-bold ${getScoreColor(analysis.experienceMatch)}`}>
                      {analysis.experienceMatch}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getProgressColor(analysis.experienceMatch)}`}
                      style={{ width: `${analysis.experienceMatch}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Cultural Fit</span>
                    <span className={`font-bold ${getScoreColor(analysis.culturalFit)}`}>{analysis.culturalFit}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getProgressColor(analysis.culturalFit)}`}
                      style={{ width: `${analysis.culturalFit}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Verdict */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  {getVerdictIcon(analysis.verdict)}
                  <span>AI Verdict</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`p-4 rounded-lg border ${getVerdictColor(analysis.verdict)}`}>
                  <h3 className="font-semibold text-lg mb-2">{analysis.verdict.replace("_", " ").toUpperCase()}</h3>
                  <p className="text-sm mb-3">{analysis.reasoning}</p>
                  <div className="flex items-center space-x-2 text-sm">
                    <Brain className="w-4 h-4" />
                    <span>Confidence: {analysis.confidence}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="candidate" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="w-5 h-5 text-blue-600" />
                  <span>Basic Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-600">Name</label>
                  <p className="text-lg font-semibold">{candidate?.fullName || "N/A"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Email</label>
                  <p className="text-sm">{candidate?.email || "N/A"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Phone</label>
                  <p className="text-sm">{candidate?.phone || "N/A"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Location</label>
                  <p className="text-sm">{candidate?.location || "N/A"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Experience</label>
                  <p className="text-sm">{candidate?.experience || "N/A"}</p>
                </div>
                {candidate?.candidate_data?.GitHub && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">GitHub</label>
                    <a 
                      href={candidate?.candidate_data.GitHub} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {candidate?.candidate_data.GitHub}
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Skills */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="w-5 h-5 text-green-600" />
                  <span>Skills</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {candidate?.skills?.map((skill: string, index: number) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Experience */}
          {candidate?.candidate_data?.Experience && 
           Array.isArray(candidate.candidate_data.Experience) && 
           candidate.candidate_data.Experience.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Award className="w-5 h-5 text-purple-600" />
                  <span>Work Experience</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {candidate.candidate_data.Experience.map((exp: any, index: number) => (
                    <div key={index} className="border-l-4 border-blue-200 pl-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-semibold text-lg">{exp.Position || 'Position Not Specified'}</h4>
                          <p className="text-blue-600 font-medium">{exp.Company || 'Company Not Specified'}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {exp.Duration || 'Duration Not Specified'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-700">{exp.Description || 'No description available'}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Education */}
          {candidate?.candidate_data?.Education && 
           Array.isArray(candidate.candidate_data.Education) && 
           candidate.candidate_data.Education.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Star className="w-5 h-5 text-yellow-600" />
                  <span>Education</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {candidate.candidate_data.Education.map((edu: any, index: number) => (
                    <div key={index} className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold">{edu.Degree}</h4>
                        <p className="text-gray-600">{edu.Institution}</p>
                        {edu.Field && <p className="text-sm text-gray-500">{edu.Field}</p>}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {edu.Year}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Projects */}
          {candidate?.candidate_data?.Projects && 
           Array.isArray(candidate.candidate_data.Projects) && 
           candidate.candidate_data.Projects.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Lightbulb className="w-5 h-5 text-orange-600" />
                  <span>Projects</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {candidate.candidate_data.Projects.map((project: any, index: number) => (
                    <div key={index} className="border rounded-lg p-4">
                      <h4 className="font-semibold text-lg mb-2">{project.Name}</h4>
                      <p className="text-sm text-gray-700 mb-3">{project.Description}</p>
                      <div className="flex flex-wrap gap-1">
                        {project.Technologies?.map((tech: string, techIndex: number) => (
                          <Badge key={techIndex} variant="outline" className="text-xs">
                            {tech}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="strengths" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Star className="w-5 h-5 text-green-600" />
                <span>Key Strengths</span>
              </CardTitle>
              <p className="text-sm text-gray-600">Areas where the candidate excels</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analysis.strengths.map((strength, index) => (
                  <div
                    key={index}
                    className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg border border-green-200"
                  >
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-green-900">{strength}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="areas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Lightbulb className="w-5 h-5 text-orange-600" />
                <span>Areas for Growth</span>
              </CardTitle>
              <p className="text-sm text-gray-600">Potential areas for improvement or consideration</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analysis.weaknesses.map((weakness, index) => (
                  <div
                    key={index}
                    className="flex items-start space-x-3 p-3 bg-orange-50 rounded-lg border border-orange-200"
                  >
                    <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-orange-900">{weakness}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Award className="w-5 h-5 text-purple-600" />
                <span>AI Recommendation</span>
              </CardTitle>
              <p className="text-sm text-gray-600">Detailed analysis and next steps</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className={`p-4 rounded-lg border ${getVerdictColor(analysis.verdict)}`}>
                  <div className="flex items-center space-x-2 mb-3">
                    {getVerdictIcon(analysis.verdict)}
                    <h3 className="font-semibold text-lg">{analysis.verdict.replace("_", " ").toUpperCase()}</h3>
                  </div>
                  <p className="mb-4">{analysis.reasoning}</p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${getScoreColor(analysis.overallScore)}`}>
                        {analysis.overallScore}/100
                      </div>
                      <p className="text-xs text-gray-600">Overall Score</p>
                    </div>
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${getScoreColor(analysis.confidence)}`}>
                        {analysis.confidence}%
                      </div>
                      <p className="text-xs text-gray-600">AI Confidence</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{analysis.strengths.length}</div>
                      <p className="text-xs text-gray-600">Key Strengths</p>
                    </div>
                  </div>

                  {/* Next Steps */}
                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-2">Recommended Next Steps:</h4>
                    <ul className="space-y-1 text-sm">
                      {analysis.verdict === "highly_recommended" && (
                        <>
                          <li>• Schedule technical interview immediately</li>
                          <li>• Prepare competitive offer package</li>
                          <li>• Fast-track through interview process</li>
                        </>
                      )}
                      {analysis.verdict === "recommended" && (
                        <>
                          <li>• Proceed with standard interview process</li>
                          <li>• Conduct thorough skills assessment</li>
                          <li>• Check references for cultural fit</li>
                        </>
                      )}
                      {analysis.verdict === "consider" && (
                        <>
                          <li>• Additional screening interview recommended</li>
                          <li>• Skills gap assessment needed</li>
                          <li>• Consider for future opportunities</li>
                        </>
                      )}
                      {analysis.verdict === "not_recommended" && (
                        <>
                          <li>• Politely decline application</li>
                          <li>• Keep profile for future suitable roles</li>
                          <li>• Provide constructive feedback if requested</li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Analysis Metadata */}
      <Card className="bg-gray-50">
        <CardContent className="p-4">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <div className="flex items-center space-x-4">
              <span>Analysis Date: {formatDate(analysis.analysisDate)}</span>
              <span>•</span>
              <span>AI Model: Pure Embedding Similarity</span>
              <span>•</span>
              <span>Processing Time: 0.5s</span>
              <span>•</span>
              <span>Match Score: {candidate?.overall_score?.score ? Math.round(candidate.overall_score.score * 100) : 'N/A'}%</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={performAIAnalysis}
              className="text-purple-600 border-purple-200 hover:bg-purple-50 bg-transparent"
            >
              <Brain className="w-4 h-4 mr-2" />
              Refresh Analysis
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
