"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/card"
import { Button } from "../../../../components/ui/button"
import { Badge } from "../../../../components/ui/badge"
import { Avatar, AvatarFallback } from "../../../../components/ui/avatar"
import { Separator } from "../../../../components/ui/separator"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../../../components/ui/dialog"
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  DollarSign,
  Calendar,
  User,
  MessageCircle,
  Brain,
  Building2,
  Target,
  Loader2,
  AlertCircle,
  FileText,
  Database,
  Briefcase,
  Download,
  Trash2,
} from "lucide-react"
import { formatDate } from "../../../../lib/date-utils"
import { formatSalary, COUNTRIES } from "../../../../lib/location-data"
import AICandidateAnalysis from "../../../components/ai-candidate-analysis"
import { getCandidatesForJob, getJobById, type CandidateMatch, type CandidatesResponse } from "../../../../lib/api/candidates-api"
import { handleAuthError } from "../../../../lib/auth-error-handler"

// Interface for job posting data
interface JobPosting {
  id: string;
  title: string;
  company: string;
  location: string;
  country: string;
  city: string;
  jobType: string;
  salaryMin: number;
  salaryMax: number;
  description: string;
  requirements: string[];
  skills: string[];
  experience: string;
  status: string;
  priority: string;
}

const PIPELINE_STATUSES = [
  { key: "new", label: "New Application", color: "bg-blue-100 text-blue-800 border-blue-200" },
  { key: "screening", label: "Initial Screening", color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  { key: "phone-screen", label: "Phone Screening", color: "bg-orange-100 text-orange-800 border-orange-200" },
  { key: "interview-1", label: "First Interview", color: "bg-indigo-100 text-indigo-800 border-indigo-200" },
  { key: "final-interview", label: "Final Interview", color: "bg-pink-100 text-pink-800 border-pink-200" },
  { key: "offer-sent", label: "Offer Sent", color: "bg-green-100 text-green-800 border-green-200" },
  { key: "hired", label: "Hired", color: "bg-green-200 text-green-900 border-green-300" },
  { key: "rejected", label: "Rejected", color: "bg-red-100 text-red-800 border-red-200" },
]

export default function JobApplicantsPage() {
  const params = useParams()
  const router = useRouter()
  const jobId = params.jobId as string
  const [showAiAnalysis, setShowAiAnalysis] = useState<string | null>(null)
  const [showParsedDataUrl, setShowParsedDataUrl] = useState<string | null>(null)
  const [minScore, setMinScore] = useState(0.1)
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards')
  const [candidatesData, setCandidatesData] = useState<CandidatesResponse | null>(null)
  const [jobPosting, setJobPosting] = useState<JobPosting | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Delete candidate states
  const [candidateToDelete, setCandidateToDelete] = useState<CandidateMatch | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Fetch candidates and job data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Get company ID from localStorage
        const user = JSON.parse(localStorage.getItem('ats_user') || 'null');
        const companyId = user?.companyId;
        
        // Debug: Check localStorage data
        console.log('🔍 Debug localStorage:');
        console.log('ats_user:', localStorage.getItem('ats_user'));
        console.log('user object:', user);
        console.log('token:', user?.token);
        console.log('companyId:', companyId);
        
        // Fetch candidates for the job with company context
        const candidatesResponse = await getCandidatesForJob(parseInt(jobId), minScore, companyId)
        console.log('API Response:', candidatesResponse)
        console.log('First candidate URLs:', candidatesResponse.candidates[0] ? {
          resume_download_url: candidatesResponse.candidates[0].resume_download_url,
          parsed_url: candidatesResponse.candidates[0].parsed_url,
          job_details_url: candidatesResponse.candidates[0].job_details_url
        } : 'No candidates')
        setCandidatesData(candidatesResponse)
        
        // Debug: Check candidates array
        console.log('Candidates array length:', candidatesResponse.candidates.length)
        console.log('Candidates array:', candidatesResponse.candidates)
        
        // Create job posting object from API response
        const jobData: JobPosting = {
          id: jobId,
          title: candidatesResponse.job_title,
          company: candidatesResponse.company,
          location: candidatesResponse.location,
          country: "IN", // Default to India, you might want to extract this from location
          city: candidatesResponse.location.split(',')[0] || "Unknown",
          jobType: "full-time", // Default, you might want to get this from job details API
          salaryMin: 0, // Default, you might want to get this from job details API
          salaryMax: 0, // Default, you might want to get this from job details API
          description: "", // Default, you might want to get this from job details API
          requirements: [], // Default, you might want to get this from job details API
          skills: candidatesResponse.skills.split(',').map(s => s.trim()),
          experience: candidatesResponse.experience_level,
          status: "active", // Default
          priority: "medium", // Default
        }
        setJobPosting(jobData)
        
      } catch (err) {
        console.error('Error fetching data:', err)
        
        // Check if it's the "Job has no embeddings" error
        if (err instanceof Error && err.message.includes('Job has no embeddings')) {
          setError('This job doesn\'t have AI-generated embeddings yet. Please go back to job posts and try again later.')
        } else {
          setError(err instanceof Error ? err.message : 'Failed to fetch data')
        }
      } finally {
        setLoading(false)
      }
    }

    if (jobId) {
      fetchData()
    }
  }, [jobId, minScore])

  const candidates = candidatesData?.candidates || []
  
  // Debug: Log candidates state
  console.log('Candidates state:', candidates)
  console.log('Candidates length:', candidates.length)

  // Delete candidate function
  const deleteCandidate = async (candidateId: number) => {
    try {
      setIsDeleting(true)
      
      // Get JWT token and company ID from localStorage
      const user = JSON.parse(localStorage.getItem('ats_user') || 'null');
      const token = user?.token;
      const companyId = user?.companyId;

      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }

      if (!companyId) {
        throw new Error('Company ID not found. Please login again.');
      }

      console.log('🗑️ Deleting candidate:', candidateId);

      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_API_URL || 'http://localhost:3001'}/candidates/${candidateId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        // Handle authentication errors (401, 403)
        if (response.status === 401 || response.status === 403) {
          handleAuthError(response);
        }
        
        // Handle other errors
        if (response.status === 403) {
          throw new Error('Access denied. You do not have permission to delete this candidate.');
        } else if (response.status === 404) {
          throw new Error('Candidate not found.');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Candidate deleted successfully:', result);

      // Remove candidate from local state
      if (candidatesData) {
        setCandidatesData({
          ...candidatesData,
          candidates: candidatesData.candidates.filter(candidate => candidate.candidate_id !== candidateId)
        });
      }

      // Show success message
      alert(`Candidate deleted successfully!`);

      // Close delete confirmation dialog
      setShowDeleteConfirm(false);
      setCandidateToDelete(null);

    } catch (error) {
      console.error('❌ Error deleting candidate:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Failed to delete candidate'}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle delete confirmation
  const handleDeleteCandidate = (candidate: CandidateMatch) => {
    setCandidateToDelete(candidate);
    setShowDeleteConfirm(true);
  };

  // Confirm delete
  const confirmDelete = () => {
    if (candidateToDelete) {
      deleteCandidate(candidateToDelete.candidate_id);
    }
  };

  const getStatusInfo = (status: string) => {
    return PIPELINE_STATUSES.find((s) => s.key === status) || PIPELINE_STATUSES[0]
  }

  const getVerdictColor = (fitStatus: string) => {
    switch (fitStatus.toLowerCase()) {
      case "highly recommended":
      case "highly_recommended":
        return "text-green-600 bg-green-100 border-green-200"
      case "recommended":
        return "text-blue-600 bg-blue-100 border-blue-200"
      case "consider":
        return "text-yellow-600 bg-yellow-100 border-yellow-200"
      case "not fit":
        return "text-red-700 bg-red-200 border-red-300"
      case "not_recommended":
        return "text-red-600 bg-red-100 border-red-200"
      default:
        return "text-gray-600 bg-gray-100 border-gray-200"
    }
  }

  // Convert API candidate data to display format
  const convertCandidateData = (candidate: CandidateMatch) => {
    const aiScore = Math.round(candidate.overall_score.score * 100)
    const skillsMatch = Math.round(candidate.skills_matched_score.score * 100)
    const experienceMatch = Math.round(candidate.experience_score.score * 100)
    
    // Debug: Log URLs to console
    console.log('Candidate URLs:', {
      resume_download_url: candidate.resume_download_url,
      parsed_url: candidate.parsed_url,
      job_details_url: candidate.job_details_url
    })
    
    return {
      id: candidate.candidate_id.toString(),
      name: candidate.candidate_name,
      email: candidate.candidate_email,
      phone: candidate.candidate_data.Phone || "N/A",
      currentSalary: 0, // Not available in API response
      expectedSalary: 0, // Not available in API response
      noticePeriod: "N/A", // Not available in API response
      currentLocation: candidate.location,
      country: "IN", // Default, you might want to extract from location
      city: candidate.location.split(',')[0] || "Unknown",
      skills: candidate.skills,
      experience: candidate.experience,
      status: "new", // Default status
      appliedDate: new Date().toISOString().split('T')[0], // Default to today
      jobId: jobId,
      jobTitle: jobPosting?.title || "Unknown",
      jobType: "full-time", // Default
      customerName: jobPosting?.company || "Unknown",
      internalSPOC: "N/A", // Not available in API response
      recruiterName: "N/A", // Not available in API response
      source: "ai_matching", // Indicates this came from AI matching
      comments: candidate.overall_score.explanation,
      aiScore: aiScore,
      aiVerdict: candidate.overall_score.fit_status.toLowerCase().replace(" ", "_"),
      aiAnalysis: {
        overallScore: aiScore,
        skillsMatch: skillsMatch,
        experienceMatch: experienceMatch,
        culturalFit: Math.round((aiScore + skillsMatch + experienceMatch) / 3), // Calculate average
        verdict: candidate.overall_score.fit_status.toLowerCase().replace(" ", "_") as any,
        reasoning: candidate.overall_score.explanation,
        confidence: Math.round((skillsMatch + experienceMatch) / 2), // Calculate confidence
        strengths: [candidate.skills_matched_score.explanation],
        weaknesses: [candidate.experience_score.explanation],
        analysisDate: new Date(),
      },
      // URL mappings from backend
      resume_url: candidate.resume_download_url,
      parsed_data_url: candidate.parsed_url,
      job_description_url: candidate.job_details_url,
    }
  }

  const getWhatsAppUrl = (phone: string, candidateName: string, jobTitle: string) => {
    const cleanPhone = phone.replace(/[^\d]/g, "")
    const message = encodeURIComponent(
      `Hi ${candidateName}, I'm reaching out regarding your application for the ${jobTitle} position. Would you be available for a quick chat?`,
    )
    return `https://wa.me/${cleanPhone}?text=${message}`
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Loading Candidates</h1>
          <p className="text-gray-600">Fetching AI-matched candidates for this job...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    // Check if it's the embeddings error to show special content
    const isEmbeddingsError = error.includes('AI-generated embeddings');
    
    if (isEmbeddingsError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md mx-auto text-center p-8 bg-white rounded-lg shadow-lg">
            <div className="w-20 h-20 mx-auto mb-6 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">AI Matching Not Available</h1>
            <p className="text-gray-600 mb-6">
              This job doesn't have AI-generated embeddings yet. To enable smart candidate matching, you need to generate embeddings first.
            </p>
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                <h3 className="font-semibold text-blue-900 mb-2">How to enable AI matching:</h3>
                <ol className="text-sm text-blue-800 space-y-1">
                  <li>1. Go back to Job Postings</li>
                  <li>2. Find this job in the list</li>
                  <li>3. Use the AI Job Generation feature</li>
                  <li>4. Generate or regenerate the job posting</li>
                  <li>5. Return here to see AI-matched candidates</li>
                </ol>
              </div>
              <Button onClick={() => window.location.href = '/?tab=jobs'} className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Job Posts
              </Button>
            </div>
          </div>
        </div>
      )
    }
    
    // For other errors, show the original error display
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Data</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button variant="outline" onClick={() => window.location.href = '/?tab=jobs'}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Job Posts
          </Button>
        </div>
      </div>
    )
  }

  // Job not found
  if (!jobPosting) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Job Not Found</h1>
          <Button onClick={() => window.history.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <Button variant="outline" onClick={() => router.push('/?tab=jobs')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Job Postings
          </Button>
          </div>
          <Card className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-200 shadow-lg">
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-3xl font-bold text-blue-900 mb-3">{jobPosting.title}</CardTitle>
                  <div className="flex items-center space-x-3 mt-3 text-blue-700">
                    <div className="flex items-center space-x-2">
                      <Building2 className="w-5 h-5" />
                      <span className="font-semibold text-lg">{jobPosting.company}</span>
                  </div>
                    <span className="text-blue-400">•</span>
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-5 h-5" />
                      <span className="font-semibold text-lg">{jobPosting.location}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 mt-4 text-blue-600">
                    <div className="flex items-center space-x-2 bg-white rounded-lg px-3 py-2 shadow-sm">
                      <Brain className="w-5 h-5 text-purple-600" />
                      <span className="font-bold">
                        AI-Matched Candidates: {candidatesData?.total_candidates || 0}
                    </span>
                    </div>
                    <div className="flex items-center space-x-2 bg-white rounded-lg px-3 py-2 shadow-sm">
                      <Target className="w-5 h-5 text-green-600" />
                      <span className="font-bold">
                        Min Score: {candidatesData?.min_score_threshold || 0.1}
                    </span>
                    </div>
                  </div>
                  
                  {/* Status Badges Row */}
                  <div className="flex items-center space-x-2 mt-3">
                    <Badge className="bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-200 cursor-pointer">
                     
                      Contract
                    </Badge>
                    <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-200 cursor-pointer">
                      
                      Active
                    </Badge>
                    <Badge className="bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200 cursor-pointer">
                      
                      On-site
                    </Badge>
                    <Badge className="bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-200 cursor-pointer">
                      
                      High Priority
                    </Badge>
                  </div>
                      </div>
                      
                              </div>
            </CardHeader>
            
            {/* Controls Section */}
            <div className="px-6 pb-4 border-t border-blue-200 pt-4">
              <div className="flex items-center justify-between">
                {/* View Toggle */}
                <div className="flex items-center space-x-2 bg-white rounded-lg p-2 shadow-sm border border-gray-200">
                  <Button
                    variant={viewMode === 'cards' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('cards')}
                    className="text-xs px-3 py-1"
                  >
                    <Target className="w-3 h-3 mr-1" />
                    Cards
                  </Button>
                  <Button
                    variant={viewMode === 'table' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('table')}
                    className="text-xs px-3 py-1"
                  >
                    <User className="w-3 h-3 mr-1" />
                    Table
                  </Button>
                            </div>
                            
                {/* Min Score */}
                <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
                              <div className="flex items-center space-x-2">
                    <Target className="w-4 h-4 text-blue-600" />
                    <label htmlFor="minScore" className="text-xs font-semibold text-gray-800">
                      Min Score
                    </label>
                    <input
                      id="minScore"
                      type="number"
                      min="0"
                      max="1"
                      step="0.1"
                      value={minScore}
                      onChange={(e) => setMinScore(parseFloat(e.target.value))}
                      className="w-16 px-2 py-1 text-xs font-medium text-center border border-blue-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-blue-50 text-blue-800"
                    />
                    <span className="text-xs text-gray-500">threshold</span>
                              </div>
                  <p className="text-xs text-gray-400 mt-1">
                    💡 Lower = more candidates, Higher = better matches
                  </p>
                              </div>
                            </div>
                              </div>
          </Card>
        </div>

        {/* Candidates View */}
        {viewMode === 'cards' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {candidates.map((candidate) => {
              const convertedCandidate = convertCandidateData(candidate)
              const statusInfo = getStatusInfo(convertedCandidate.status)
              const countryInfo = COUNTRIES.find((country) => country.code === convertedCandidate.country)

            return (
                <Card key={convertedCandidate.id} className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                  {/* Candidate Header */}
                    <div className="relative mb-4">
                      <div className="absolute top-0 right-0 z-10">
                        <Badge className={`${statusInfo.color} px-1 py-0.5`} variant="outline">
                          <span className="text-xs font-normal" style={{ fontSize: '10px' }}>{statusInfo.label}</span>
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-3 pt-8">
                        <Avatar className="h-12 w-12 flex-shrink-0">
                          <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold text-sm">
                            {convertedCandidate.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-base text-gray-900">{convertedCandidate.name}</h3>
                          <Badge className="bg-gray-100 text-gray-700 text-xs px-2 py-1 mt-1">
                            {convertedCandidate.experience} experience
                          </Badge>
                      </div>
                    </div>
                  </div>

                    {/* AI Analysis Section */}
                    <div className="bg-purple-50 rounded-lg p-3 mb-4 border border-purple-200">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-800">AI Analysis</span>
                        <Badge className={`${getVerdictColor(convertedCandidate.aiVerdict)} text-xs px-2 py-1`}>
                          {convertedCandidate.aiVerdict.replace("_", " ").toUpperCase()}
                      </Badge>
                    </div>
                      <div className="grid grid-cols-3 gap-3 mb-3">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-600">{convertedCandidate.aiScore}</div>
                          <div className="text-xs text-gray-600">Overall</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold text-blue-600">{convertedCandidate.aiAnalysis.skillsMatch}%</div>
                          <div className="text-xs text-gray-600">Skills</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold text-green-600">{convertedCandidate.aiAnalysis.experienceMatch}%</div>
                          <div className="text-xs text-gray-600">Experience</div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAiAnalysis(convertedCandidate.id)}
                        className="w-full text-purple-600 border-purple-300 hover:bg-purple-50 text-sm py-2"
                      >
                        <Brain className="w-4 h-4 mr-2" />
                        Details
                      </Button>
                  </div>

                  {/* Contact Information */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center space-x-2 text-sm">
                        <Mail className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-700 truncate">{convertedCandidate.email}</span>
                      </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-sm">
                          <Phone className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-700">{convertedCandidate.phone}</span>
                      </div>
                        {convertedCandidate.phone !== "N/A" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                              window.open(getWhatsAppUrl(convertedCandidate.phone, convertedCandidate.name, jobPosting.title), "_blank")
                        }
                            className="text-green-600 border-green-300 hover:bg-green-50 text-xs px-2 py-1"
                      >
                        <MessageCircle className="w-3 h-3 mr-1" />
                        WhatsApp
                      </Button>
                        )}
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-700">{convertedCandidate.currentLocation}</span>
                      {countryInfo && (
                          <Badge variant="outline" className="text-xs px-1 py-0.5">
                          {countryInfo.name}
                        </Badge>
                      )}
                    </div>
                  </div>

                    {/* Skills */}
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-2">
                        {convertedCandidate.skills.slice(0, 4).map((skill, index) => (
                          <Badge key={index} variant="outline" className="text-xs px-2 py-1 bg-gray-100 text-gray-700 border-gray-300">
                            {skill}
                          </Badge>
                        ))}
                        {convertedCandidate.skills.length > 4 && (
                          <Badge variant="outline" className="text-xs px-2 py-1 bg-gray-100 text-gray-600">
                            +{convertedCandidate.skills.length - 4}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* URL Buttons */}
                    <div className="flex gap-2 mb-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const candidate = candidates.find(c => c.candidate_id.toString() === convertedCandidate.id)
                          if (candidate?.resume_download_url) {
                            const link = document.createElement('a')
                            link.href = candidate.resume_download_url
                            link.download = `resume_${candidate.candidate_data?.Name || 'candidate'}.pdf`
                            link.click()
                          }
                        }}
                        className="flex-1 text-xs py-2 bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Download
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowParsedDataUrl(convertedCandidate.id)}
                        className="flex-1 text-xs py-2 bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                      >
                        <Database className="w-3 h-3 mr-1" />
                        Parsed
                      </Button>
                      </div>

                    {/* AI Analysis Comments */}
                    {convertedCandidate.comments && (
                      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-3 mb-3 border border-yellow-200">
                        <div className="flex items-start space-x-2">
                          <div className="p-1 bg-yellow-100 rounded">
                            <Brain className="w-3 h-3 text-yellow-600" />
                      </div>
                          <div className="flex-1">
                            <h4 className="text-xs font-semibold text-gray-800 mb-1">AI Analysis</h4>
                            <p className="text-xs text-gray-700 leading-relaxed">{convertedCandidate.comments}</p>
                    </div>
                      </div>
                      </div>
                    )}

                    {/* Application Details */}
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4" />
                        <span>Applied {formatDate(convertedCandidate.appliedDate)}</span>
                    </div>
                      <Badge variant="outline" className="capitalize text-xs px-2 py-1 bg-blue-50 text-blue-700">
                        {convertedCandidate.source}
                      </Badge>
                  </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          /* Table View */
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              <table className="w-full min-w-[800px]">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-64">Candidate</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-32">AI Score</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-48">Skills</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-32">Experience</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-40">Location</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-48">Contact</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-48">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {candidates.map((candidate) => {
                    const convertedCandidate = convertCandidateData(candidate)
                    const statusInfo = getStatusInfo(convertedCandidate.status)
                    
                    return (
                      <tr key={convertedCandidate.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4">
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold text-xs">
                                {convertedCandidate.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-sm text-gray-900 truncate">{convertedCandidate.name}</div>
                              <div className="text-xs text-gray-500 truncate">{convertedCandidate.experience} experience</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center space-x-1">
                            <Badge className={`${getVerdictColor(convertedCandidate.aiVerdict)} text-xs px-2 py-0.5 whitespace-nowrap`}>
                              {convertedCandidate.aiVerdict.replace("_", " ").toUpperCase()}
                            </Badge>
                            <Badge variant="outline" className="text-xs px-1 py-0.5 bg-gray-100 text-gray-700">
                              {convertedCandidate.aiScore}%
                            </Badge>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-1">
                            {convertedCandidate.skills.slice(0, 3).map((skill, index) => (
                              <Badge key={index} variant="outline" className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 whitespace-nowrap">
                          {skill}
                        </Badge>
                      ))}
                            {convertedCandidate.skills.length > 3 && (
                              <Badge variant="outline" className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 whitespace-nowrap">
                                +{convertedCandidate.skills.length - 3}
                        </Badge>
                      )}
                    </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm text-gray-900">{convertedCandidate.experience}</div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm text-gray-900">{convertedCandidate.currentLocation}</div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="space-y-1">
                            <div className="text-xs text-gray-600">{convertedCandidate.email}</div>
                            <div className="text-xs text-gray-600">{convertedCandidate.phone}</div>
                  </div>
                        </td>
                        <td className="px-4 py-4">
                    <div className="flex items-center space-x-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setShowAiAnalysis(convertedCandidate.id)}
                              className="text-xs px-2 py-1"
                            >
                              <Brain className="w-3 h-3 mr-1" />
                              Details
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const candidate = candidates.find(c => c.candidate_id.toString() === convertedCandidate.id)
                                if (candidate?.resume_download_url) {
                                  const link = document.createElement('a')
                                  link.href = candidate.resume_download_url
                                  link.download = `resume_${candidate.candidate_data?.Name || 'candidate'}.pdf`
                                  link.click()
                                }
                              }}
                              className="text-xs px-2 py-1 bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                            >
                              <Download className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setShowParsedDataUrl(convertedCandidate.id)}
                              className="text-xs px-2 py-1 bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                            >
                              <Database className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteCandidate(candidate)}
                              className="text-xs px-2 py-1 bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                    </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
        </div>
          </div>
        )}

        {/* AI Analysis Dialog */}
        {showAiAnalysis && (
          <Dialog open={!!showAiAnalysis} onOpenChange={() => setShowAiAnalysis(null)}>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>AI Candidate Analysis</DialogTitle>
                <DialogDescription>
                  Comprehensive AI-powered evaluation comparing candidate profile with job requirements
                </DialogDescription>
              </DialogHeader>
              <AICandidateAnalysis
                candidate={candidates.find((c) => c.candidate_id.toString() === showAiAnalysis)}
                jobPosting={jobPosting}
                onAnalysisComplete={(analysis: any) => {
                  // Handle analysis completion if needed
                }}
              />
            </DialogContent>
          </Dialog>
        )}

        {/* Empty State */}
        {candidates.length === 0 && !loading && (
          <Card className="text-center py-12">
            <CardContent>
              <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No AI-Matched Candidates</h3>
              <p className="text-gray-500">
                No candidates were found matching this job's requirements. This could be due to:
                <br />
                • No resumes with embeddings in the system
                <br />
                • Very specific job requirements
                <br />
                • Low similarity threshold
              </p>
            </CardContent>
          </Card>
        )}


        {/* Parsed Data Dialog */}
        {showParsedDataUrl && (
          <Dialog open={!!showParsedDataUrl} onOpenChange={() => setShowParsedDataUrl(null)}>
            <DialogContent className="max-w-4xl max-h-[90vh]">
              <DialogHeader>
                <DialogTitle>Parsed Resume Data</DialogTitle>
                <DialogDescription>
                  View and download the parsed candidate data
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex gap-2 mb-4">
                  <Button
                    onClick={() => window.open(candidates.find(c => c.candidate_id.toString() === showParsedDataUrl)?.parsed_url, '_blank')}
                    className="flex-1"
                  >
                    <Database className="w-4 h-4 mr-2" />
                    Open in New Tab
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      const candidate = candidates.find(c => c.candidate_id.toString() === showParsedDataUrl)
                      if (candidate?.candidate_data) {
                        // Create a formatted HTML content for download
                        const htmlContent = `
                          <html>
                            <head>
                              <title>Parsed Resume Data - ${candidate.candidate_data.Name}</title>
                              <style>
                                body { font-family: Arial, sans-serif; margin: 20px; }
                                h1 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
                                h2 { color: #555; margin-top: 20px; }
                                .section { margin-bottom: 20px; }
                                .skill { background: #f0f0f0; padding: 2px 8px; margin: 2px; border-radius: 4px; display: inline-block; }
                                .experience-item { margin-bottom: 15px; padding: 10px; border-left: 3px solid #007bff; background: #f9f9f9; }
                              </style>
                            </head>
                            <body>
                              <h1>${candidate.candidate_data.Name}</h1>
                              <div class="section">
                                <h2>Contact Information</h2>
                                <p><strong>Email:</strong> ${candidate.candidate_data.Email}</p>
                                <p><strong>Phone:</strong> ${candidate.candidate_data.Phone || 'N/A'}</p>
                                <p><strong>Location:</strong> ${candidate.candidate_data.Location}</p>
                                ${candidate.candidate_data.GitHub ? `<p><strong>GitHub:</strong> ${candidate.candidate_data.GitHub}</p>` : ''}
                              </div>
                              <div class="section">
                                <h2>Total Experience</h2>
                                <p>${candidate.candidate_data.TotalExperience}</p>
                              </div>
                              <div class="section">
                                <h2>Skills</h2>
                                <div>${candidate.candidate_data.Skills.map(skill => `<span class="skill">${skill}</span>`).join('')}</div>
                              </div>
                              ${candidate.candidate_data.Experience && candidate.candidate_data.Experience.length > 0 ? `
                                <div class="section">
                                  <h2>Work Experience</h2>
                                  ${candidate.candidate_data.Experience.map(exp => `
                                    <div class="experience-item">
                                      <h3>${exp.Position} at ${exp.Company}</h3>
                                      <p><strong>Duration:</strong> ${exp.Duration}</p>
                                      <p><strong>Description:</strong> ${exp.Description}</p>
                                    </div>
                                  `).join('')}
                                </div>
                              ` : ''}
                              ${candidate.candidate_data.Education && candidate.candidate_data.Education.length > 0 ? `
                                <div class="section">
                                  <h2>Education</h2>
                                  ${candidate.candidate_data.Education.map(edu => `
                                    <div class="experience-item">
                                      <h3>${edu.Degree} in ${edu.Field || 'N/A'}</h3>
                                      <p><strong>Institution:</strong> ${edu.Institution}</p>
                                      <p><strong>Year:</strong> ${edu.Year}</p>
                                    </div>
                                  `).join('')}
                                </div>
                              ` : ''}
                              ${candidate.candidate_data.Projects && candidate.candidate_data.Projects.length > 0 ? `
                                <div class="section">
                                  <h2>Projects</h2>
                                  ${candidate.candidate_data.Projects.map(project => `
                                    <div class="experience-item">
                                      <h3>${project.Name}</h3>
                                      <p><strong>Description:</strong> ${project.Description}</p>
                                      <p><strong>Technologies:</strong> ${project.Technologies.join(', ')}</p>
                                    </div>
                                  `).join('')}
                                </div>
                              ` : ''}
                            </body>
                          </html>
                        `
                        
                        // Create blob and download
                        const blob = new Blob([htmlContent], { type: 'text/html' })
                        const url = URL.createObjectURL(blob)
                        const link = document.createElement('a')
                        link.href = url
                        link.download = `parsed_data_${candidate.candidate_data.Name || 'candidate'}.html`
                        link.click()
                        URL.revokeObjectURL(url)
                      }
                    }}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download as HTML
                  </Button>
                </div>
                <div className="border rounded-lg overflow-hidden">
                  <div className="p-4 bg-gray-50 max-h-[500px] overflow-y-auto">
                    <h3 className="text-lg font-semibold mb-4">Parsed Resume Data</h3>
                    <div className="space-y-4">
                      {(() => {
                        const candidate = candidates.find(c => c.candidate_id.toString() === showParsedDataUrl)
                        if (!candidate?.candidate_data) return <p>No parsed data available</p>
                        
                        const data = candidate.candidate_data
                        return (
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-semibold text-gray-800">Contact Information</h4>
                              <p><strong>Name:</strong> {data.Name}</p>
                              <p><strong>Email:</strong> {data.Email}</p>
                              <p><strong>Phone:</strong> {data.Phone || 'N/A'}</p>
                              <p><strong>Location:</strong> {data.Location}</p>
                              {data.GitHub && <p><strong>GitHub:</strong> {data.GitHub}</p>}
                            </div>
                            
                            <div>
                              <h4 className="font-semibold text-gray-800">Experience</h4>
                              <p><strong>Total Experience:</strong> {data.TotalExperience}</p>
                            </div>
                            
                            <div>
                              <h4 className="font-semibold text-gray-800">Skills</h4>
                              <div className="flex flex-wrap gap-2">
                                {data.Skills.map((skill, index) => (
                                  <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            </div>
                            
                            {data.Experience && data.Experience.length > 0 && (
                              <div>
                                <h4 className="font-semibold text-gray-800">Work Experience</h4>
                                <div className="space-y-3">
                                  {data.Experience.map((exp, index) => (
                                    <div key={index} className="border-l-4 border-blue-500 pl-4 bg-gray-50 p-3 rounded">
                                      <h5 className="font-medium">{exp.Position} at {exp.Company}</h5>
                                      <p className="text-sm text-gray-600">{exp.Duration}</p>
                                      <p className="text-sm mt-2">{exp.Description}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {data.Education && data.Education.length > 0 && (
                              <div>
                                <h4 className="font-semibold text-gray-800">Education</h4>
                                <div className="space-y-2">
                                  {data.Education.map((edu, index) => (
                                    <div key={index} className="border-l-4 border-green-500 pl-4 bg-gray-50 p-3 rounded">
                                      <h5 className="font-medium">{edu.Degree} {edu.Field && `in ${edu.Field}`}</h5>
                                      <p className="text-sm text-gray-600">{edu.Institution} - {edu.Year}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {data.Projects && data.Projects.length > 0 && (
                              <div>
                                <h4 className="font-semibold text-gray-800">Projects</h4>
                                <div className="space-y-3">
                                  {data.Projects.map((project, index) => (
                                    <div key={index} className="border-l-4 border-purple-500 pl-4 bg-gray-50 p-3 rounded">
                                      <h5 className="font-medium">{project.Name}</h5>
                                      <p className="text-sm mt-2">{project.Description}</p>
                                      <div className="flex flex-wrap gap-1 mt-2">
                                        {project.Technologies.map((tech, techIndex) => (
                                          <span key={techIndex} className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">
                                            {tech}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-2 mb-4">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <h3 className="text-lg font-semibold">Delete Candidate</h3>
            </div>
            
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete this candidate? This action cannot be undone.
            </p>
            
            {candidateToDelete && (
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <h4 className="font-medium text-gray-900">{candidateToDelete.candidate_data?.Name || 'Unknown'}</h4>
                <p className="text-sm text-gray-600">{candidateToDelete.candidate_data?.Email || 'No email'}</p>
                <p className="text-sm text-gray-500 mt-1">
                  Match Score: {Math.round(candidateToDelete.match_score * 100)}%
                </p>
              </div>
            )}
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-red-800">
                <strong>Warning:</strong> This will permanently delete:
              </p>
              <ul className="text-sm text-red-700 mt-1 ml-4 list-disc">
                <li>Candidate profile and all data</li>
                <li>Resume files</li>
                <li>Interview schedules</li>
                <li>Application history</li>
              </ul>
            </div>

            <div className="flex justify-end space-x-3">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setCandidateToDelete(null);
                }}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={confirmDelete}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Candidate
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      </div>
    </div>
  )
}
