"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Card } from "../../components/ui/card"
import { Badge } from "../../components/ui/badge"
import { Button } from "../../components/ui/button"
import { Avatar, AvatarFallback } from "../../components/ui/avatar"
import { Input } from "../../components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu"
import {
  Clock,
  IndianRupee,
  MapPin,
  Mail,
  Search,
  MoreHorizontal,
  Star,
  Users,
  Briefcase,
  MessageSquare,
  Phone,
  Download,
  Calendar,
  Building,
  GraduationCap,
  TrendingUp,
  RefreshCw,
  AlertCircle,
  Award,
  Filter,
  Grid3X3,
  List,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit,
  Trash2,
} from "lucide-react"
import BASE_API_URL from "../../BaseUrlApi.js"
import { useCompany } from "../../lib/company-context"

interface PipelineCandidate {
  id: number
  fullName: string
  firstName: string
  lastName: string
  email: string
  phone: string
  currentLocation: string
  keySkills: string
  salaryExpectation: number
  noticePeriod: string
  yearsOfExperience: string
  remoteWork: boolean
  startDate: string
  portfolioUrl: string
  status: string
  appliedAt: string
  updatedAt: string
  resumeDownloadUrl: string | null
  totalApplications: number
  appliedJobs: Array<{
    applicationId: number
    applicationStatus: string
    appliedAt: string
    job: {
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
    interviews: Array<{
      id: number
      interviewDate: string
      interviewTime: string
      interviewType: string
      interviewMode: string
      platform: string
      meetingLink: string
      interviewer: string
      notes: string
      status: string
      createdAt: string
    }>
  }>
}

interface PipelineStats {
  totalCandidates: number
  totalApplications: number
  statusBreakdown: Record<string, number>
  recentApplications: number
}

interface PipelineResponse {
  success: boolean
  totalCandidates: number
  totalApplications: number
  pipelineStats: PipelineStats
  candidates: PipelineCandidate[]
  timestamp: string
}

const statusColors = {
  "New Application": "bg-blue-100 text-blue-800 border-blue-200",
  "Initial Screening": "bg-indigo-100 text-indigo-800 border-indigo-200",
  "Phone Screening": "bg-yellow-100 text-yellow-800 border-yellow-200",
  "Skills Assessment": "bg-orange-100 text-orange-800 border-orange-200",
  "First Interview": "bg-purple-100 text-purple-800 border-purple-200",
  "Second Interview": "bg-cyan-100 text-cyan-800 border-cyan-200",
  "Final Interview": "bg-indigo-100 text-indigo-800 border-indigo-200",
  "Reference Check": "bg-green-100 text-green-800 border-green-200",
  "Offer Preparation": "bg-emerald-100 text-emerald-800 border-emerald-200",
  "Offer Sent": "bg-teal-100 text-teal-800 border-teal-200",
  "Offer Negotiation": "bg-green-100 text-green-800 border-green-200",
  "Offer Accepted": "bg-blue-100 text-blue-800 border-blue-200",
  "Background Check": "bg-emerald-100 text-emerald-800 border-emerald-200",
  "Hired": "bg-green-100 text-green-800 border-green-200",
  "Rejected": "bg-red-100 text-red-800 border-red-200",
  "Withdrawn": "bg-gray-100 text-gray-800 border-gray-200",
  "On Hold": "bg-yellow-100 text-yellow-800 border-yellow-200",
  "Interview Scheduled": "bg-purple-100 text-purple-800 border-purple-200",
}

export default function PipelineAPI() {
  const router = useRouter()
  const { companyId, isAuthenticated, isLoading } = useCompany()
  const [candidates, setCandidates] = useState<PipelineCandidate[]>([])
  const [pipelineStats, setPipelineStats] = useState<PipelineStats | null>(null)

  // Show loading while company context is loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-spin">
            <div className="w-6 h-6 text-white">⏳</div>
          </div>
          <p className="text-gray-600">Loading company context...</p>
        </div>
      </div>
    )
  }
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedStage, setSelectedStage] = useState("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(12)
  const [sortBy, setSortBy] = useState<"name" | "date" | "salary">("date")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [expandedStages, setExpandedStages] = useState<Set<string>>(new Set())
  const [candidatesPerStage] = useState(6)
  const [expandingStage, setExpandingStage] = useState<string | null>(null)
  
  // Delete candidate states
  const [candidateToDelete, setCandidateToDelete] = useState<PipelineCandidate | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (isAuthenticated && companyId) {
      fetchPipelineData()
    }
  }, [isAuthenticated, companyId])

  const fetchPipelineData = async () => {
    if (!companyId) {
      setError('Company context required')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      
      // Get token from localStorage
      const user = JSON.parse(localStorage.getItem('ats_user') || 'null');
      const token = user?.token;
      
      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }
      
      const response = await fetch(`${BASE_API_URL}/candidates/pipeline?companyId=${companyId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      })
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data: PipelineResponse = await response.json()
      
      if (data.success) {
        setCandidates(data.candidates)
        setPipelineStats(data.pipelineStats)
      } else {
        setError("Failed to fetch pipeline data")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    return statusColors[status as keyof typeof statusColors] || "bg-gray-100 text-gray-800 border-gray-200"
  }

  // Delete candidate function
  const deleteCandidate = async (candidateId: number) => {
    try {
      setIsDeleting(true)
      
      // Get JWT token and company ID from localStorage
      const user = JSON.parse(localStorage.getItem('ats_user') || 'null');
      const token = user?.token;

      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }

      if (!companyId) {
        throw new Error('Company ID not found. Please login again.');
      }

      console.log('🗑️ Deleting candidate:', candidateId);

      const response = await fetch(`${BASE_API_URL}/candidates/${candidateId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("authenticated");
          localStorage.removeItem("auth_email");
          localStorage.removeItem("ats_user");
          window.location.href = '/login';
          throw new Error('Session expired. Please login again.');
        } else if (response.status === 403) {
          throw new Error('Access denied. You do not have permission to delete this candidate.');
        } else if (response.status === 404) {
          throw new Error('Candidate not found.');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Candidate deleted successfully:', result);

      // Remove candidate from local state
      setCandidates(prevCandidates => prevCandidates.filter(candidate => candidate.id !== candidateId));

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
  const handleDeleteCandidate = (candidate: PipelineCandidate) => {
    setCandidateToDelete(candidate);
    setShowDeleteConfirm(true);
  };

  // Confirm delete
  const confirmDelete = () => {
    if (candidateToDelete) {
      deleteCandidate(candidateToDelete.id);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  const filteredAndSortedCandidates = useMemo(() => {
    let filtered = candidates.filter((candidate) => {
      const matchesSearch =
        searchQuery === "" ||
        candidate.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        candidate.keySkills.toLowerCase().includes(searchQuery.toLowerCase()) ||
        candidate.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        candidate.currentLocation.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStage = selectedStage === "all" || candidate.status === selectedStage

      return matchesSearch && matchesStage
    })

    // Sort candidates
    filtered.sort((a, b) => {
      let comparison = 0
      switch (sortBy) {
        case "name":
          comparison = a.fullName.localeCompare(b.fullName)
          break
        case "date":
          comparison = new Date(a.appliedAt).getTime() - new Date(b.appliedAt).getTime()
          break
        case "salary":
          comparison = a.salaryExpectation - b.salaryExpectation
          break
      }
      return sortOrder === "asc" ? comparison : -comparison
    })

    return filtered
  }, [candidates, searchQuery, selectedStage, sortBy, sortOrder])

  const paginatedCandidates = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredAndSortedCandidates.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredAndSortedCandidates, currentPage, itemsPerPage])

  const totalPages = Math.ceil(filteredAndSortedCandidates.length / itemsPerPage)

  const getCandidatesByStage = (stage: string) => {
    return filteredAndSortedCandidates.filter((candidate) => candidate.status === stage)
  }

  const toggleStageExpansion = (stage: string) => {
    const isCurrentlyExpanded = expandedStages.has(stage)
    
    if (isCurrentlyExpanded) {
      setExpandedStages(prev => {
        const newSet = new Set(prev)
        newSet.delete(stage)
        return newSet
      })
    } else {
      setExpandingStage(stage)
      setExpandedStages(prev => {
        const newSet = new Set(prev)
        newSet.add(stage)
        return newSet
      })
      
      // Clear loading state and scroll after animation
      setTimeout(() => {
        setExpandingStage(null)
        const stageElement = document.querySelector(`[data-stage="${stage}"]`)
        if (stageElement) {
          stageElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'nearest' 
          })
        }
      }, 300)
    }
  }

  const getDisplayCandidates = (stageCandidates: PipelineCandidate[], stage: string) => {
    const isExpanded = expandedStages.has(stage)
    return isExpanded ? stageCandidates : stageCandidates.slice(0, candidatesPerStage)
  }

  const handleDownloadResume = (candidateId: number) => {
    const candidate = candidates.find(c => c.id === candidateId)
    if (candidate?.resumeDownloadUrl) {
      window.open(candidate.resumeDownloadUrl, '_blank')
    }
  }

  const handleScheduleInterview = (candidateId: number) => {
    console.log(`Schedule interview for candidate ${candidateId}`)
    // TODO: Implement interview scheduling
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
              currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px] bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-6"></div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Loading Pipeline Data</h3>
          <p className="text-gray-500">Fetching your candidate pipeline...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[600px] bg-gradient-to-br from-red-50 to-pink-50">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
          <h3 className="text-xl font-semibold text-red-700 mb-4">Error Loading Data</h3>
          <p className="text-red-600 mb-6">{error}</p>
          <Button onClick={fetchPipelineData} variant="outline" size="lg" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  const uniqueStatuses = Array.from(new Set(candidates.map(candidate => candidate.status)))

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Enhanced Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Candidate Pipeline
              </h1>
              <p className="text-lg text-gray-600 mt-2">
                Manage your hiring pipeline with real-time data and insights
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                onClick={fetchPipelineData} 
                variant="outline" 
                size="lg"
                className="gap-2 hover:bg-blue-50 border-blue-200"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Enhanced Analytics Dashboard */}
          {pipelineStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <Card className="p-4 hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white/20 rounded-lg flex-shrink-0">
                    <Users className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-2xl font-bold">{pipelineStats.totalCandidates}</p>
                    <p className="text-blue-100 text-xs">Total Candidates</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white/20 rounded-lg flex-shrink-0">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-2xl font-bold">{pipelineStats.totalApplications}</p>
                    <p className="text-emerald-100 text-xs">Total Applications</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white/20 rounded-lg flex-shrink-0">
                    <Star className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-2xl font-bold">{pipelineStats.recentApplications}</p>
                    <p className="text-purple-100 text-xs">Recent Applications</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white/20 rounded-lg flex-shrink-0">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-2xl font-bold">
                      {candidates.filter(c => c.status === "Interview Scheduled").length}
                    </p>
                    <p className="text-orange-100 text-xs">Scheduled Interviews</p>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Enhanced Search and Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div className="flex-1 w-full lg:w-auto">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    placeholder="Search candidates by name, skills, email, or location..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 h-12 text-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <select
                  value={selectedStage}
                  onChange={(e) => setSelectedStage(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  <option value="all">All Stages</option>
                  {uniqueStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>

                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [field, order] = e.target.value.split('-')
                    setSortBy(field as "name" | "date" | "salary")
                    setSortOrder(order as "asc" | "desc")
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  <option value="date-desc">Newest First</option>
                  <option value="date-asc">Oldest First</option>
                  <option value="name-asc">Name A-Z</option>
                  <option value="name-desc">Name Z-A</option>
                  <option value="salary-desc">Salary High-Low</option>
                  <option value="salary-asc">Salary Low-High</option>
                </select>

                <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                    className="h-8 w-8 p-0"
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                    className="h-8 w-8 p-0"
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Results Summary */}
            <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
              <span>
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredAndSortedCandidates.length)} of {filteredAndSortedCandidates.length} candidates
              </span>
              <span>
                {filteredAndSortedCandidates.length} results
              </span>
            </div>
          </div>
        </div>

        {/* Enhanced Pipeline View */}
        {viewMode === "grid" ? (
          <div className="space-y-8">
            {uniqueStatuses.map((status) => {
              const stageCandidates = getCandidatesByStage(status)
              if (stageCandidates.length === 0) return null

              return (
                <div key={status} data-stage={status} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-300">
                  {/* Stage Header */}
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <h3 className="font-semibold text-gray-900 text-lg">{status}</h3>
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                          {stageCandidates.length}
                        </Badge>
                        {stageCandidates.length > candidatesPerStage && (
                          <Badge variant="outline" className="text-xs bg-orange-50 text-orange-600 border-orange-200">
                            {expandedStages.has(status) ? 'Expanded' : 'Limited'}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        {stageCandidates.length > candidatesPerStage && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-gray-500 hover:text-gray-700 transition-all duration-200"
                            onClick={() => toggleStageExpansion(status)}
                            disabled={expandingStage === status}
                            title={expandedStages.has(status) ? 'Collapse' : 'Expand'}
                          >
                            {expandingStage === status ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : expandedStages.has(status) ? (
                              <ChevronLeft className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min((stageCandidates.length / Math.max(filteredAndSortedCandidates.length, 1)) * 100, 100)}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Candidates Grid */}
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 transition-all duration-500 ease-in-out">
                      {getDisplayCandidates(stageCandidates, status).map((candidate, index) => {
                        const primaryJob = candidate.appliedJobs[0]
                        const isExpanded = expandedStages.has(status)
                        const isNewlyVisible = isExpanded && index >= candidatesPerStage
                        
                        return (
                          <Card
                            key={candidate.id}
                            className={`p-4 hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-200 bg-gradient-to-r from-white to-gray-50 hover:from-blue-50 hover:to-indigo-50 ${
                              isNewlyVisible ? 'animate-in fade-in-0 slide-in-from-bottom-2 duration-500' : ''
                            }`}
                            style={{
                              animationDelay: isNewlyVisible ? `${(index - candidatesPerStage) * 100}ms` : '0ms'
                            }}
                          >
                            <div className="space-y-3">
                              {/* Header */}
                              <div className="flex items-start justify-between">
                                <div className="flex items-center space-x-3 min-w-0 flex-1">
                                  <Avatar className="w-10 h-10 ring-2 ring-blue-100 flex-shrink-0">
                                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-semibold text-sm">
                                      {getInitials(candidate.fullName)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="min-w-0 flex-1">
                                    <h4 className="font-semibold text-gray-900 text-sm">{candidate.fullName}</h4>
                                    <p className="text-xs text-gray-600">{primaryJob?.job.title || "No job title"}</p>
                                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                      <Building className="w-3 h-3 flex-shrink-0" />
                                      <span>{primaryJob?.job.company || "Unknown Company"}</span>
                                    </p>
                                  </div>
                                </div>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-gray-100 flex-shrink-0">
                                      <MoreHorizontal className="w-4 h-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-48">
                                    {candidate.resumeDownloadUrl && (
                                      <DropdownMenuItem onClick={() => handleDownloadResume(candidate.id)}>
                                        <Download className="w-4 h-4 mr-2" />
                                        Download Resume
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem onClick={() => window.open(`tel:${candidate.phone}`)}>
                                      <Phone className="w-4 h-4 mr-2" />
                                      Call Candidate
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => window.open(`mailto:${candidate.email}`)}>
                                      <Mail className="w-4 h-4 mr-2" />
                                      Send Email
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                      onClick={() => handleDeleteCandidate(candidate)}
                                      className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                    >
                                      <Trash2 className="w-4 h-4 mr-2" />
                                      Delete Candidate
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>

                              {/* Details Grid */}
                              <div className="grid grid-cols-1 gap-2 text-xs">
                                <div className="flex items-center space-x-2 text-gray-600">
                                  <MapPin className="w-3 h-3 text-blue-500 flex-shrink-0" />
                                  <span>{candidate.currentLocation}</span>
                                </div>
                                <div className="flex items-center space-x-2 text-gray-600">
                                  <span>Expected Salary: {formatCurrency(candidate.salaryExpectation)}</span>
                                </div>
                                <div className="flex items-center space-x-2 text-gray-600">
                                  <GraduationCap className="w-3 h-3 text-purple-500 flex-shrink-0" />
                                  <span>{candidate.yearsOfExperience}</span>
                                </div>
                                <div className="flex items-center space-x-2 text-gray-600">
                                  <Clock className="w-3 h-3 text-orange-500 flex-shrink-0" />
                                  <span>Applied {formatDate(candidate.appliedAt)}</span>
                                </div>
                              </div>

                              {/* Skills */}
                              <div className="flex flex-wrap gap-1">
                                {candidate.keySkills.split(',').slice(0, 2).map((skill, index) => (
                                  <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5">
                                    {skill.trim()}
                                  </Badge>
                                ))}
                                {candidate.keySkills.split(',').length > 2 && (
                                  <Badge variant="secondary" className="bg-gray-100 text-gray-700 text-xs px-2 py-0.5">
                                    +{candidate.keySkills.split(',').length - 2}
                                  </Badge>
                                )}
                              </div>

                              {/* Status and Remote Badge */}
                              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                                <Badge className={`text-xs ${getStatusColor(status)}`}>
                                  {status}
                                </Badge>
                                {candidate.remoteWork && (
                                  <Badge variant="outline" className="text-xs border-green-300 text-green-700">
                                    Remote
                                  </Badge>
                                )}
                              </div>

                              {/* Interviews Info */}
                              {primaryJob?.interviews && primaryJob.interviews.length > 0 && (
                                <div className="pt-2 border-t border-gray-100">
                                  <div className="flex items-center space-x-2 text-xs text-gray-700">
                                    <Calendar className="w-3 h-3 text-green-500 flex-shrink-0" />
                                    <span className="font-medium">Interview Scheduled for {new Date(primaryJob.interviews[0].interviewDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at {primaryJob.interviews[0].interviewTime}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </Card>
                        )
                      })}
                    </div>

                    {stageCandidates.length > candidatesPerStage && (
                      <div className="mt-4 text-center">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-blue-600 border-blue-300 hover:bg-blue-50 transition-all duration-200 hover:scale-105"
                          onClick={() => toggleStageExpansion(status)}
                          disabled={expandingStage === status}
                          aria-label={`${expandedStages.has(status) ? 'Show less' : 'View all'} ${stageCandidates.length} candidates`}
                        >
                          {expandingStage === status ? (
                            <>
                              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                              Loading...
                            </>
                          ) : expandedStages.has(status) ? (
                            <>
                              <ChevronLeft className="w-4 h-4 mr-2" />
                              Show Less ({candidatesPerStage})
                            </>
                          ) : (
                            <>
                              <Users className="w-4 h-4 mr-2" />
                              View All {stageCandidates.length} Candidates
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          /* List View */
          <div className="space-y-6">
            {/* List Header */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-600 border-b border-gray-200 pb-4">
                <div className="col-span-3">Candidate</div>
                <div className="col-span-2">Position</div>
                <div className="col-span-2">Location</div>
                <div className="col-span-2">Expected Salary</div>
                <div className="col-span-2">Applied Date</div>
                <div className="col-span-1">Actions</div>
              </div>

              {/* Candidates List */}
              <div className="space-y-2">
                {paginatedCandidates.map((candidate) => {
                  const primaryJob = candidate.appliedJobs[0]
                  return (
                    <div
                      key={candidate.id}
                      className="grid grid-cols-12 gap-4 items-center py-4 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <div className="col-span-3">
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-xs">
                              {getInitials(candidate.fullName)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-gray-900">{candidate.fullName}</div>
                            <div className="text-xs text-gray-500">{candidate.email}</div>
                          </div>
                        </div>
                      </div>
                      <div className="col-span-2">
                        <div className="font-medium text-gray-900">{primaryJob?.job.title || "N/A"}</div>
                        <div className="text-xs text-gray-500">{primaryJob?.job.company || "N/A"}</div>
                      </div>
                      <div className="col-span-2">
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-3 h-3 text-gray-400" />
                          <span className="text-sm">{candidate.currentLocation}</span>
                        </div>
                      </div>
                      <div className="col-span-2">
                        <div className="font-medium text-gray-900">{formatCurrency(candidate.salaryExpectation)}</div>
                        <div className="text-xs text-gray-500">{candidate.yearsOfExperience}</div>
                      </div>
                      <div className="col-span-2">
                        <div className="text-sm text-gray-900">{formatDate(candidate.appliedAt)}</div>
                        <Badge className={`text-xs mt-1 ${getStatusColor(candidate.status)}`}>
                          {candidate.status}
                        </Badge>
                      </div>
                      <div className="col-span-1">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            {candidate.resumeDownloadUrl && (
                              <DropdownMenuItem onClick={() => handleDownloadResume(candidate.id)}>
                                <Download className="w-4 h-4 mr-2" />
                                Download Resume
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => window.open(`tel:${candidate.phone}`)}>
                              <Phone className="w-4 h-4 mr-2" />
                              Call Candidate
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => window.open(`mailto:${candidate.email}`)}>
                              <Mail className="w-4 h-4 mr-2" />
                              Send Email
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteCandidate(candidate)}
                              className="text-red-600 focus:text-red-600 focus:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete Candidate
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i
                      return (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className="w-8 h-8 p-0"
                        >
                          {page}
                        </Button>
                      )
                    })}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

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
                <h4 className="font-medium text-gray-900">{candidateToDelete.fullName}</h4>
                <p className="text-sm text-gray-600">{candidateToDelete.email}</p>
                <p className="text-sm text-gray-500 mt-1">
                  Status: {candidateToDelete.status}
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
          </div>
        </div>
      )}
    </div>
  )
} 