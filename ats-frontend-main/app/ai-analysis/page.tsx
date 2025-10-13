"use client"

import { useState, useEffect } from "react"
import AICandidateAnalysis from "../components/ai-candidate-analysis"
import ProtectedRoute from "../components/protected-route"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { Brain, AlertCircle, Loader2 } from "lucide-react"
import BASE_API_URL from '../../BaseUrlApi'
import { handleAuthError } from '../../lib/auth-error-handler'

interface Candidate {
  id: string
  fullName: string
  email: string
  overall_score?: {
    score: number
    fit_status: string
    explanation: string
  }
  skills_matched_score?: {
    score: number
    explanation: string
  }
  experience_score?: {
    score: number
    explanation: string
  }
  candidate_data?: any
  skills?: string[]
  location?: string
  experience?: string
}

interface JobPosting {
  id: string
  title: string
  company: string
  location: string
  jobType: string
  experienceLevel: string
}

function AIAnalysisPageContent() {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [jobs, setJobs] = useState<JobPosting[]>([])
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null)
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get authentication token and company ID
      const user = JSON.parse(localStorage.getItem('ats_user') || 'null');
      const token = user?.token;
      const companyId = user?.companyId;

      if (!token || !companyId) {
        console.log('🔍 ❌ AI Analysis Authentication failed');
        throw new Error('Authentication required. Please login again.');
      }

      console.log('🔍 ✅ AI Analysis Authentication passed');

      // Fetch candidates with AI analysis data
      console.log('🔍 Fetching AI Analysis candidates...');

      const candidatesResponse = await fetch(`${BASE_API_URL}/candidates/ai-analysis`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!candidatesResponse.ok) {
        // Handle authentication errors (401, 403)
        if (candidatesResponse.status === 401 || candidatesResponse.status === 403) {
          handleAuthError(candidatesResponse);
        }
        
        // Handle other errors
        let errorDetails = '';
        try {
          const errorData = await candidatesResponse.json();
          errorDetails = errorData.error || errorData.message || '';
        } catch (e) {
          // Could not parse error response
        }
        throw new Error(`Failed to fetch candidates: ${candidatesResponse.status}${errorDetails ? ` - ${errorDetails}` : ''}`);
      }

      const candidatesData = await candidatesResponse.json();
      console.log('🔍 ✅ AI Analysis candidates loaded:', candidatesData.candidates?.length || 0, 'candidates');
      setCandidates(candidatesData.candidates || []);

      // Fetch jobs
      console.log('🔍 Fetching jobs...');

      const jobsResponse = await fetch(`${BASE_API_URL}/jobs/get-jobs`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!jobsResponse.ok) {
        // Handle authentication errors (401, 403)
        if (jobsResponse.status === 401 || jobsResponse.status === 403) {
          handleAuthError(jobsResponse);
        }
        
        // Handle other errors
        let errorDetails = '';
        try {
          const errorData = await jobsResponse.json();
          errorDetails = errorData.error || errorData.message || '';
        } catch (e) {
          // Could not parse error response
        }
        throw new Error(`Failed to fetch jobs: ${jobsResponse.status}${errorDetails ? ` - ${errorDetails}` : ''}`);
      }

      const jobsData = await jobsResponse.json();
      console.log('🔍 ✅ Jobs loaded:', jobsData.jobs?.length || 0, 'jobs');
      setJobs(jobsData.jobs || [])

      // Auto-select first candidate and job if available
      if (candidatesData.candidates?.length > 0) {
        setSelectedCandidate(candidatesData.candidates[0])
      }
      if (jobsData.jobs?.length > 0) {
        setSelectedJob(jobsData.jobs[0])
      }

    } catch (err) {
      console.error('Error fetching data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-gray-600">Loading AI analysis data...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <AlertCircle className="w-8 h-8 mx-auto mb-4 text-red-600" />
              <h3 className="text-lg font-semibold mb-2">Error Loading Data</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={fetchData} variant="outline">
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (candidates.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <Brain className="w-8 h-8 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold mb-2">No Candidates Available</h3>
              <p className="text-gray-600 mb-4">No candidates with AI analysis data found.</p>
              <Button onClick={fetchData} variant="outline">
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Selection Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="w-5 h-5 text-purple-600" />
            <span>AI Analysis Configuration</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Select Candidate
              </label>
              <Select
                value={selectedCandidate?.id || ""}
                onValueChange={(value) => {
                  const candidate = candidates.find(c => c.id === value)
                  setSelectedCandidate(candidate || null)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a candidate..." />
                </SelectTrigger>
                <SelectContent>
                  {candidates.map((candidate) => (
                    <SelectItem key={candidate.id} value={candidate.id}>
                      {candidate.fullName} ({candidate.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Select Job Position
              </label>
              <Select
                value={selectedJob?.id || ""}
                onValueChange={(value) => {
                  const job = jobs.find(j => j.id === value)
                  setSelectedJob(job || null)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a job position..." />
                </SelectTrigger>
                <SelectContent>
                  {jobs.map((job) => (
                    <SelectItem key={job.id} value={job.id}>
                      {job.title} - {job.company}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Analysis Component */}
      {selectedCandidate && selectedJob && (
        <AICandidateAnalysis
          candidate={selectedCandidate}
          jobPosting={selectedJob}
          onAnalysisComplete={(analysis) => {
            console.log('AI Analysis completed:', analysis)
          }}
        />
      )}

      {(!selectedCandidate || !selectedJob) && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <Brain className="w-8 h-8 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold mb-2">Select Candidate and Job</h3>
              <p className="text-gray-600">Please select both a candidate and job position to view AI analysis.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default function AIAnalysisPage() {
  return (
    <ProtectedRoute>
      <AIAnalysisPageContent />
    </ProtectedRoute>
  )
}
