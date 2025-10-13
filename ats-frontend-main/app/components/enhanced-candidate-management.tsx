"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Badge } from "../../components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select"
import {
  Search,
  Filter,
  Download,
  Eye,
  Plus,
  RefreshCw,
  FileText,
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Calendar,
  Star,
  CheckCircle,
  XCircle,
  AlertCircle,
  ExternalLink,
  Upload,
  Brain,
  Trash2,
} from "lucide-react"
import { useToast } from "../../hooks/use-toast"
import { useCandidateContext } from "../contexts/candidate-context"
import BASE_API_URL from "../../BaseUrlApi"
import NODE_API_URL from "../../NodeApi"
import { handleAuthError } from "../../lib/auth-error-handler"

interface ParsedResumeData {
  id: number
  filename: string
  file_path: string
  file_type: string
  candidate_name: string
  candidate_email: string
  candidate_phone: string
  total_experience: string
  parsed_data: any
  created_at: string
}

interface Candidate {
  id: number
  firstName: string
  lastName: string
  email: string
  phone: string
  currentLocation: string
  keySkills: string
  yearsOfExperience: number
  salaryExpectation: string
  status: string
  appliedAt: string
  resumeFilePath: string
  parsedResumeData?: ParsedResumeData
  job?: {
    id: number
    title: string
    company: string
    city: string
    jobType: string
    experienceLevel: string
    workType: string
    jobStatus: string
    salaryMin: number
    salaryMax: number
    priority: string
    createdAt: string
  }
}

interface CandidatesResponse {
  success: boolean
  candidates: Candidate[]
  pagination: {
    currentPage: number
    totalPages: number
    totalCount: number
    hasNext: boolean
    hasPrev: boolean
  }
}

interface ResumeDataResponse {
  success: boolean
  resumeData: ParsedResumeData[]
  pagination: {
    currentPage: number
    totalPages: number
    totalCount: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export default function EnhancedCandidateManagement() {
  const { toast } = useToast()
  const { incrementCandidateCount, updateCandidateCount } = useCandidateContext()
  const [activeTab, setActiveTab] = useState("candidates")
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [resumeData, setResumeData] = useState<ParsedResumeData[]>([])
  // Tab-specific state variables to prevent cross-tab re-renders
  const [candidatesLoading, setCandidatesLoading] = useState(true)
  const [candidatesError, setCandidatesError] = useState<string | null>(null)
  const [candidatesCurrentPage, setCandidatesCurrentPage] = useState(1)
  const [candidatesTotalPages, setCandidatesTotalPages] = useState(1)
  const [candidatesTotalCount, setCandidatesTotalCount] = useState(0)
  
  const [resumeDataLoading, setResumeDataLoading] = useState(true)
  const [resumeDataError, setResumeDataError] = useState<string | null>(null)
  const [resumeDataCurrentPage, setResumeDataCurrentPage] = useState(1)
  const [resumeDataTotalPages, setResumeDataTotalPages] = useState(1)
  const [resumeDataTotalCount, setResumeDataTotalCount] = useState(0)
  
  // Shared state
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null)
  const [showCandidateDetails, setShowCandidateDetails] = useState(false)
  const [showResumeData, setShowResumeData] = useState<ParsedResumeData | null>(null)
  const [showResumeDetails, setShowResumeDetails] = useState(false)
  const [creatingCandidate, setCreatingCandidate] = useState<number | null>(null)
  const [refreshingCounts, setRefreshingCounts] = useState(false)
  
  // Delete candidate states
  const [candidateToDelete, setCandidateToDelete] = useState<Candidate | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Job selection states
  const [availableJobs, setAvailableJobs] = useState<any[]>([])
  const [selectedJobForCandidate, setSelectedJobForCandidate] = useState<number | null>(null)
  const [showJobSelectionModal, setShowJobSelectionModal] = useState(false)
  const [pendingResumeId, setPendingResumeId] = useState<number | null>(null)

  // Fetch candidates
  const fetchCandidates = async (page = 1, search = "", status = "all") => {
    try {
      setCandidatesLoading(true)
      const user = JSON.parse(localStorage.getItem('ats_user') || 'null')
      const token = user?.token

      if (!token) {
        throw new Error('Authentication required')
      }

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        search: search,
        status: status
      })

      const response = await fetch(`${BASE_API_URL}/candidates?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch candidates: ${response.status}`)
      }

      const data: CandidatesResponse = await response.json()
      setCandidates(data.candidates)
      setCandidatesTotalPages(data.pagination.totalPages)
      setCandidatesTotalCount(data.pagination.totalCount)
      setCandidatesCurrentPage(data.pagination.currentPage)
      // Update global context with the fetched count
      updateCandidateCount(data.pagination.totalCount)

    } catch (error) {
      console.error('Error fetching candidates:', error)
      setCandidatesError(error instanceof Error ? error.message : 'Failed to fetch candidates')
      toast({
        title: "Error",
        description: "Failed to fetch candidates",
        variant: "destructive"
      })
    } finally {
      setCandidatesLoading(false)
    }
  }

  // Fetch parsed resume data
  const fetchResumeData = async (page = 1, search = "") => {
    try {
      setResumeDataLoading(true)
      const user = JSON.parse(localStorage.getItem('ats_user') || 'null')
      const token = user?.token

      if (!token) {
        throw new Error('Authentication required')
      }

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        search: search
      })

      const response = await fetch(`${BASE_API_URL}/resume-data?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch resume data: ${response.status}`)
      }

      const data: ResumeDataResponse = await response.json()
      setResumeData(data.resumeData)
      setResumeDataTotalPages(data.pagination.totalPages)
      setResumeDataTotalCount(data.pagination.totalCount)
      setResumeDataCurrentPage(data.pagination.currentPage)

    } catch (error) {
      console.error('Error fetching resume data:', error)
      setResumeDataError(error instanceof Error ? error.message : 'Failed to fetch resume data')
      toast({
        title: "Error",
        description: "Failed to fetch resume data",
        variant: "destructive"
      })
    } finally {
      setResumeDataLoading(false)
    }
  }

  // Fetch available jobs for selection
  async function fetchAvailableJobs() {
    try {
      const user = JSON.parse(localStorage.getItem('ats_user') || 'null');
      const token = user?.token;
      const companyId = user?.companyId;

      if (!token || !companyId) {
        return;
      }

      const response = await fetch(`${NODE_API_URL}/api/jobs/get-jobs?companyId=${companyId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401 || response.status === 403) {
        handleAuthError(response);
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setAvailableJobs(data.jobs || []);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setAvailableJobs([]);
    }
  }

  // Show job selection modal before creating candidate
  const initiateCreateCandidate = (resumeDataId: number) => {
    setPendingResumeId(resumeDataId)
    setSelectedJobForCandidate(null)
    setShowJobSelectionModal(true)
  }

  // Create candidate from resume data with selected job
  const createCandidateFromResume = async () => {
    if (!pendingResumeId) return

    // Set loading state for this specific resume
    setCreatingCandidate(pendingResumeId)
    
    try {
      const user = JSON.parse(localStorage.getItem('ats_user') || 'null')
      const token = user?.token

      if (!token) {
        throw new Error('Authentication required')
      }

      // Close modal
      setShowJobSelectionModal(false)

      const response = await fetch(`${BASE_API_URL}/candidates/create-from-resume`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          resumeDataId: pendingResumeId,
          jobId: selectedJobForCandidate // Pass selected job ID (can be null)
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to create candidate: ${response.status}`)
      }

      const data = await response.json()
      
      // Show which job was assigned
      const jobName = selectedJobForCandidate 
        ? availableJobs.find(j => j.id === selectedJobForCandidate)?.title || 'Selected Job'
        : 'General Pool (No specific job)';
      
      toast({
        title: "✅ Success",
        description: `Candidate added to ${jobName}`,
        duration: 3000,
      })

      // Reset state
      setPendingResumeId(null)
      setSelectedJobForCandidate(null)

      // Always update the count regardless of active tab
      // Use optimistic update to avoid full page re-render
      setCandidatesTotalCount(prev => prev + 1)
      // Also update the global context for sidebar
      incrementCandidateCount()
      // Decrement parsed resumes count since one was converted to candidate
      setResumeDataTotalCount(prev => Math.max(0, prev - 1))
      
      // Refresh resume data to update the list
      fetchResumeData(resumeDataCurrentPage, searchQuery)

    } catch (error) {
      console.error('Error creating candidate:', error)
      toast({
        title: "❌ Error",
        description: "Failed to create candidate. Please try again.",
        variant: "destructive",
        duration: 4000,
      })
    } finally {
      // Clear loading state
      setCreatingCandidate(null)
    }
  }

  // Download resume
  const downloadResume = (candidateId: number) => {
    const user = JSON.parse(localStorage.getItem('ats_user') || 'null')
    const token = user?.token

    if (!token) {
      toast({
        title: "Error",
        description: "Authentication required",
        variant: "destructive"
      })
      return
    }

    const url = `${BASE_API_URL}/candidates/${candidateId}/resume`
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', '')
    link.setAttribute('target', '_blank')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Refresh both counts (useful for refresh button)
  const refreshBothCounts = async () => {
    try {
      setRefreshingCounts(true)
      await Promise.all([
        fetchCandidates(1, searchQuery, statusFilter),
        fetchResumeData(1, searchQuery)
      ])
    } catch (error) {
      console.error('Error refreshing counts:', error)
    } finally {
      setRefreshingCounts(false)
    }
  }

  // Delete candidate function
  const deleteCandidate = async (candidateId: number) => {
    try {
      setIsDeleting(true)
      
      // Get JWT token and company ID from localStorage
      const user = JSON.parse(localStorage.getItem('ats_user') || 'null');
      const token = user?.token;
      const companyId = user?.companyId;

      console.log('🗑️ Delete Candidate Debug - Frontend:');
      console.log('Candidate ID:', candidateId);
      console.log('User object:', user);
      console.log('Token:', token);
      console.log('Company ID:', companyId);
      console.log('Base API URL:', BASE_API_URL);

      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }

      if (!companyId) {
        throw new Error('Company ID not found. Please login again.');
      }

      const apiUrl = `${BASE_API_URL}/candidates/${candidateId}`;
      console.log('🗑️ API URL:', apiUrl);

      const response = await fetch(apiUrl, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('🗑️ Response status:', response.status);
      console.log('🗑️ Response headers:', response.headers);
      console.log('🗑️ Response ok:', response.ok);

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        let responseText = '';
        
        try {
          responseText = await response.text();
          console.log('🗑️ Response text:', responseText);
          
          // Try to parse as JSON
          try {
            const errorData = JSON.parse(responseText);
            errorMessage = errorData.message || errorMessage;
            console.log('🗑️ Error data:', errorData);
          } catch (parseError) {
            console.log('🗑️ Could not parse response as JSON:', parseError);
          }
        } catch (textError) {
          console.log('🗑️ Could not read response text:', textError);
        }

        if (response.status === 401) {
          localStorage.removeItem("authenticated");
          localStorage.removeItem("auth_email");
          localStorage.removeItem("ats_user");
          window.location.href = '/login';
          throw new Error('Session expired. Please login again.');
        } else if (response.status === 403) {
          throw new Error('Access denied. You do not have permission to delete this candidate.');
        } else if (response.status === 404) {
          throw new Error(`Candidate not found. ${responseText}`);
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('✅ Candidate deleted successfully:', result);

      // Remove candidate from local state
      setCandidates(prevCandidates => prevCandidates.filter(candidate => candidate.id !== candidateId));
      setCandidatesTotalCount(prev => prev - 1);

      // Update candidate count in context
      updateCandidateCount(candidatesTotalCount - 1);

      // Show success message
      toast({
        title: "Candidate Deleted",
        description: result.message || 'Candidate deleted successfully!',
      });

      // Close delete confirmation dialog
      setShowDeleteConfirm(false);
      setCandidateToDelete(null);

    } catch (error) {
      console.error('❌ Error deleting candidate:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to delete candidate',
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle delete confirmation
  const handleDeleteCandidate = (candidate: Candidate) => {
    setCandidateToDelete(candidate);
    setShowDeleteConfirm(true);
  };

  // Confirm delete
  const confirmDelete = () => {
    if (candidateToDelete) {
      deleteCandidate(candidateToDelete.id);
    }
  };

  // Handle search
  const handleSearch = () => {
    if (activeTab === "candidates") {
      fetchCandidates(1, searchQuery, statusFilter)
    } else {
      fetchResumeData(1, searchQuery)
    }
  }

  // Handle page change
  const handlePageChange = (page: number) => {
    if (activeTab === "candidates") {
      setCandidatesCurrentPage(page)
      fetchCandidates(page, searchQuery, statusFilter)
    } else {
      setResumeDataCurrentPage(page)
      fetchResumeData(page, searchQuery)
    }
  }

  // Load both counts on component mount
  useEffect(() => {
    fetchCandidates()
    fetchResumeData()
    fetchAvailableJobs()
  }, []) // Empty dependency array - runs only on mount

  // Load data on tab change (only if not already loaded)
  useEffect(() => {
    if (activeTab === "candidates") {
      // Only fetch if candidates data is empty or if we need to refresh
      if (candidates.length === 0 || candidatesCurrentPage !== 1) {
        fetchCandidates()
      }
    } else {
      // Only fetch if resume data is empty or if we need to refresh
      if (resumeData.length === 0 || resumeDataCurrentPage !== 1) {
        fetchResumeData()
      }
    }
  }, [activeTab])

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'applied':
        return 'bg-blue-100 text-blue-800'
      case 'shortlisted':
        return 'bg-green-100 text-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      case 'hired':
        return 'bg-emerald-100 text-emerald-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Render candidate details
  const renderCandidateDetails = (candidate: Candidate) => {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-500">Name</label>
            <p className="text-sm">{candidate.firstName} {candidate.lastName}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Email</label>
            <p className="text-sm">{candidate.email}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Phone</label>
            <p className="text-sm">{candidate.phone || 'N/A'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Location</label>
            <p className="text-sm">{candidate.currentLocation || 'N/A'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Experience</label>
            <p className="text-sm">{candidate.yearsOfExperience} years</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Salary Expectation</label>
            <p className="text-sm">{candidate.salaryExpectation || 'N/A'}</p>
          </div>
        </div>
        
        <div>
          <label className="text-sm font-medium text-gray-500">Skills</label>
          <div className="flex flex-wrap gap-2 mt-1">
            {candidate.keySkills?.split(',').map((skill, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {skill.trim()}
              </Badge>
            ))}
          </div>
        </div>

        {candidate.job && (
          <div>
            <label className="text-sm font-medium text-gray-500">Applied Job</label>
            <div className="mt-1 p-3 bg-gray-50 rounded-lg">
              <h4 className="font-medium">{candidate.job.title}</h4>
              <p className="text-sm text-gray-600">{candidate.job.company} - {candidate.job.city}</p>
              <p className="text-sm text-gray-500">{candidate.job.jobType} • {candidate.job.experienceLevel}</p>
            </div>
          </div>
        )}

        {candidate.parsedResumeData && (
          <div>
            <label className="text-sm font-medium text-gray-500">Parsed Resume Data</label>
            <div className="mt-1 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm">
                <strong>File:</strong> {candidate.parsedResumeData.filename}
              </p>
              <p className="text-sm">
                <strong>Parsed on:</strong> {formatDate(candidate.parsedResumeData.created_at)}
              </p>
              <p className="text-sm">
                <strong>Experience from resume:</strong> {candidate.parsedResumeData.total_experience}
              </p>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Render resume data details
  const renderResumeDataDetails = (resume: ParsedResumeData) => {
    const parsedData = resume.parsed_data || {}
    
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-500">Name</label>
            <p className="text-sm">{resume.candidate_name}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Email</label>
            <p className="text-sm">{resume.candidate_email}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Phone</label>
            <p className="text-sm">{resume.candidate_phone || 'N/A'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Experience</label>
            <p className="text-sm">{resume.total_experience}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">File Type</label>
            <p className="text-sm">{resume.file_type.toUpperCase()}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Parsed Date</label>
            <p className="text-sm">{formatDate(resume.created_at)}</p>
          </div>
        </div>

        {parsedData.Skills && (
          <div>
            <label className="text-sm font-medium text-gray-500">Skills</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {parsedData.Skills.map((skill: string, index: number) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {parsedData.Education && parsedData.Education.length > 0 && (
          <div>
            <label className="text-sm font-medium text-gray-500">Education</label>
            <div className="mt-1 space-y-2">
              {parsedData.Education.map((edu: any, index: number) => (
                <div key={index} className="p-2 bg-gray-50 rounded text-sm">
                  <p className="font-medium">{edu.Degree || edu.degree}</p>
                  <p className="text-gray-600">{edu.Institution || edu.institution}</p>
                  {edu.Year && <p className="text-gray-500">{edu.Year}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {parsedData.Experience && parsedData.Experience.length > 0 && (
          <div>
            <label className="text-sm font-medium text-gray-500">Work Experience</label>
            <div className="mt-1 space-y-2">
              {parsedData.Experience.map((exp: any, index: number) => (
                <div key={index} className="p-2 bg-gray-50 rounded text-sm">
                  <p className="font-medium">{exp.Company || exp.company}</p>
                  <p className="text-gray-600">{exp.Position || exp.position}</p>
                  {exp.Duration && <p className="text-gray-500">{exp.Duration}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            onClick={() => initiateCreateCandidate(resume.id)}
            disabled={creatingCandidate === resume.id}
            className="flex items-center gap-2"
          >
            {creatingCandidate === resume.id ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Create Candidate
              </>
            )}
          </Button>
          {resume.file_path && (
            <Button
              variant="outline"
              onClick={() => window.open(resume.file_path, '_blank')}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download Resume
            </Button>
          )}
        </div>
      </div>
    )
  }

  if ((activeTab === "candidates" && candidatesLoading && candidates.length === 0) || 
      (activeTab === "resume-data" && resumeDataLoading && resumeData.length === 0)) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Candidate Management</h1>
          <p className="text-gray-600">Manage candidates and parsed resume data</p>
        </div>
        <Button
          onClick={refreshBothCounts}
          variant="outline"
          disabled={refreshingCounts}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${refreshingCounts ? 'animate-spin' : ''}`} />
          {refreshingCounts ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="candidates" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Candidates ({candidatesLoading ? '...' : candidatesTotalCount})
          </TabsTrigger>
          <TabsTrigger value="resume-data" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Parsed Resumes ({resumeDataLoading ? '...' : resumeDataTotalCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="candidates" className="space-y-4">
          {/* Search and Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search candidates..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="APPLIED">Applied</SelectItem>
                    <SelectItem value="SHORTLISTED">Shortlisted</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                    <SelectItem value="HIRED">Hired</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleSearch}>
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Candidates Table */}
          <Card>
            <CardHeader>
              <CardTitle>Candidates ({candidatesTotalCount})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Experience</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Applied Job</TableHead>
                    <TableHead>Applied Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {candidates.map((candidate) => (
                    <TableRow key={candidate.id}>
                      <TableCell className="font-medium">
                        {candidate.firstName} {candidate.lastName}
                      </TableCell>
                      <TableCell>{candidate.email}</TableCell>
                      <TableCell>{candidate.phone || 'N/A'}</TableCell>
                      <TableCell>{candidate.yearsOfExperience} years</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(candidate.status)}>
                          {candidate.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {candidate.job ? (
                          <div>
                            <p className="font-medium">{candidate.job.title}</p>
                            <p className="text-sm text-gray-500">{candidate.job.company}</p>
                          </div>
                        ) : (
                          'No job applied'
                        )}
                      </TableCell>
                      <TableCell>{formatDate(candidate.appliedAt)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedCandidate(candidate)
                              setShowCandidateDetails(true)
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {candidate.resumeFilePath && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => downloadResume(candidate.id)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteCandidate(candidate)}
                            className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {candidatesTotalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-gray-500">
                    Showing {((candidatesCurrentPage - 1) * 20) + 1} to {Math.min(candidatesCurrentPage * 20, candidatesTotalCount)} of {candidatesTotalCount} candidates
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(candidatesCurrentPage - 1)}
                      disabled={candidatesCurrentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(candidatesCurrentPage + 1)}
                      disabled={candidatesCurrentPage === candidatesTotalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resume-data" className="space-y-4">
          {/* Search */}
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search parsed resumes..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    />
                  </div>
                </div>
                <Button onClick={handleSearch}>
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Resume Data Table */}
          <Card>
            <CardHeader>
              <CardTitle>Parsed Resume Data ({resumeDataTotalCount})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Experience</TableHead>
                    <TableHead>File</TableHead>
                    <TableHead>Parsed Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resumeDataLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="flex items-center justify-center">
                          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                          Loading parsed resumes...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : resumeData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        No parsed resumes found
                      </TableCell>
                    </TableRow>
                  ) : (
                    resumeData.map((resume) => (
                    <TableRow key={resume.id}>
                      <TableCell className="font-medium">{resume.candidate_name}</TableCell>
                      <TableCell>{resume.candidate_email}</TableCell>
                      <TableCell>{resume.candidate_phone || 'N/A'}</TableCell>
                      <TableCell>{resume.total_experience}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span className="text-sm">{resume.filename}</span>
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(resume.created_at)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setShowResumeData(resume)
                              setShowResumeDetails(true)
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => initiateCreateCandidate(resume.id)}
                            disabled={creatingCandidate === resume.id}
                            className="min-w-[40px]"
                          >
                            {creatingCandidate === resume.id ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <Plus className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              
              {/* Pagination for Parsed Resumes */}
              {resumeDataTotalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-gray-500">
                    Showing {((resumeDataCurrentPage - 1) * 20) + 1} to {Math.min(resumeDataCurrentPage * 20, resumeDataTotalCount)} of {resumeDataTotalCount} parsed resumes
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(resumeDataCurrentPage - 1)}
                      disabled={resumeDataCurrentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(resumeDataCurrentPage + 1)}
                      disabled={resumeDataCurrentPage === resumeDataTotalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Candidate Details Dialog */}
      <Dialog open={showCandidateDetails} onOpenChange={setShowCandidateDetails}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Candidate Details</DialogTitle>
            <DialogDescription>
              Complete information about the selected candidate
            </DialogDescription>
          </DialogHeader>
          {selectedCandidate && renderCandidateDetails(selectedCandidate)}
        </DialogContent>
      </Dialog>

      {/* Resume Data Details Dialog */}
      <Dialog open={showResumeDetails} onOpenChange={setShowResumeDetails}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Parsed Resume Details</DialogTitle>
            <DialogDescription>
              Detailed information from the parsed resume
            </DialogDescription>
          </DialogHeader>
          {showResumeData && renderResumeDataDetails(showResumeData)}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <span>Delete Candidate</span>
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this candidate? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          {candidateToDelete && (
            <div className="py-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900">{candidateToDelete.firstName} {candidateToDelete.lastName}</h4>
                <p className="text-sm text-gray-600">{candidateToDelete.email}</p>
                {candidateToDelete.job && (
                  <p className="text-sm text-gray-500 mt-1">
                    Applied for: {candidateToDelete.job.title}
                  </p>
                )}
              </div>
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
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
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
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
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
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
        </DialogContent>
      </Dialog>

      {/* Job Selection Modal */}
      <Dialog open={showJobSelectionModal} onOpenChange={setShowJobSelectionModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Select Job for Candidate</DialogTitle>
            <DialogDescription>
              Choose which job position this candidate should be applied to, or add them to the general pool.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Job Position</label>
              <Select 
                value={selectedJobForCandidate?.toString() || ""} 
                onValueChange={(value) => setSelectedJobForCandidate(value === "null" ? null : parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a job position" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="null">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <div>
                        <div className="font-medium">General Pool (No specific job)</div>
                        <div className="text-xs text-gray-500">Candidate can be assigned later</div>
                      </div>
                    </div>
                  </SelectItem>
                  {availableJobs.map((job) => (
                    <SelectItem key={job.id} value={job.id.toString()}>
                      <div className="flex flex-col">
                        <div className="font-medium">{job.title}</div>
                        <div className="text-xs text-gray-500">
                          {job.city} • {job.jobType}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowJobSelectionModal(false)
                setPendingResumeId(null)
                setSelectedJobForCandidate(null)
              }}
            >
              Cancel
            </Button>
            <Button onClick={createCandidateFromResume}>
              Add Candidate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

