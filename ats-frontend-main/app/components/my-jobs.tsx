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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table"
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
  Eye,
  Users,
  Calendar,
  MapPin,
  IndianRupee,
  Building2,
  Clock,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Pause,
  XCircle,
  UserCheck,
  UserX,
  User,
  Mail,
  Phone,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Download,
  Share2,
  Edit,
  Trash2,
  Plus,
  RefreshCw,
  BarChart3,
  PieChart,
  Activity,
  Target,
  Award,
  Zap,
  Star,
  TrendingDown,
  Users2,
  Briefcase,
  GraduationCap,
  Globe,
  Home,
  Monitor,
  Smartphone,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Info,
} from "lucide-react"
import BASE_API_URL from '../../BaseUrlApi'
import { useToast } from "../../components/ui/use-toast"

interface JobApplication {
  id: number
  name: string
  email: string
  phone: string
  location: string
  status: string
  appliedAt: string
  keySkills: string
  salaryExpectation: number
  yearsOfExperience: string
  remoteWork: boolean
  startDate: string
  portfolioUrl: string
}

interface Job {
  id: number
  title: string
  company: string
  department: string
  internalSPOC: string
  recruiter: string
  jobType: string
  experienceLevel: string
  country: string
  city: string
  fullLocation: string
  workType: string
  jobStatus: string
  salaryMin: number
  salaryMax: number
  priority: string
  description: string
  requirements: string
  requiredSkills: string
  benefits: string
  createdAt: string
  totalApplications: number
  pendingApplications: number
  shortlistedApplications: number
  rejectedApplications: number
  hiredApplications: number
  openPositions: number
  filledPositions: number
  availablePositions: number
  applicationRate: number
  daysSincePosted: number
  isActive: boolean
  isPaused: boolean
  isClosed: boolean
  isFilled: boolean
  hasApplications: boolean
  hasShortlisted: boolean
  hasHired: boolean
  recentApplications: JobApplication[]
  allApplications: JobApplication[]
}

interface JobSummary {
  totalJobs: number
  activeJobs: number
  pausedJobs: number
  closedJobs: number
  filledJobs: number
  totalApplications: number
  totalOpenPositions: number
  totalFilledPositions: number
  totalAvailablePositions: number
}

interface StatusBreakdown {
  active: { count: number; applications: number; openPositions: number }
  paused: { count: number; applications: number }
  closed: { count: number; applications: number }
  filled: { count: number; applications: number; filledPositions: number }
}

interface MyJobsData {
  jobs: Job[]
  summary: JobSummary
  statusBreakdown: StatusBreakdown
}

export default function MyJobs() {
  const [jobsData, setJobsData] = useState<MyJobsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [isJobDetailOpen, setIsJobDetailOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortBy, setSortBy] = useState("createdAt")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const { toast } = useToast()

  // Fetch jobs data
  const fetchJobs = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Get company ID and token from localStorage
      const user = JSON.parse(localStorage.getItem('ats_user') || 'null');
      const companyId = user?.companyId;
      const token = user?.token;
      
      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }
      
      const url = new URL(`${BASE_API_URL}/job-details/my-jobs`);
      if (companyId) {
        url.searchParams.set('companyId', companyId.toString());
      }
      
      console.log('Fetching jobs from:', url.toString())
      
      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      })
      console.log('Response status:', response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('API Error:', errorText)
        throw new Error(`Failed to fetch jobs data: ${response.status} ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log('API Response:', data)
      
      if (data.success) {
        setJobsData(data.data)
      } else {
        throw new Error(data.message || 'Failed to fetch jobs data')
      }
    } catch (err) {
      console.error('Fetch error:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to fetch jobs data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchJobs()
  }, [])

  // Filter and sort jobs
  const filteredJobs = jobsData?.jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.department.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "active" && job.isActive) ||
                         (statusFilter === "paused" && job.isPaused) ||
                         (statusFilter === "closed" && job.isClosed) ||
                         (statusFilter === "filled" && job.isFilled)
    
    return matchesSearch && matchesStatus
  }) || []

  // Sort jobs
  const sortedJobs = [...filteredJobs].sort((a, b) => {
    let aValue: any = a[sortBy as keyof Job]
    let bValue: any = b[sortBy as keyof Job]
    
    if (sortBy === "createdAt") {
      aValue = new Date(aValue).getTime()
      bValue = new Date(bValue).getTime()
    }
    
    if (sortOrder === "asc") {
      return aValue > bValue ? 1 : -1
    } else {
      return aValue < bValue ? 1 : -1
    }
  })

  // Pagination
  const totalPages = Math.ceil(sortedJobs.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentJobs = sortedJobs.slice(startIndex, endIndex)

  // Helper functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE": return "bg-emerald-50 text-emerald-700 border-emerald-200"
      case "PAUSED": return "bg-amber-50 text-amber-700 border-amber-200"
      case "CLOSED": return "bg-red-50 text-red-700 border-red-200"
      case "FILLED": return "bg-blue-50 text-blue-700 border-blue-200"
      default: return "bg-gray-50 text-gray-700 border-gray-200"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "high": return "bg-red-50 text-red-700 border-red-200"
      case "medium": return "bg-yellow-50 text-yellow-700 border-yellow-200"
      case "low": return "bg-green-50 text-green-700 border-green-200"
      default: return "bg-gray-50 text-gray-700 border-gray-200"
    }
  }

  const getWorkTypeIcon = (workType: string) => {
    switch (workType) {
      case "ONSITE": return <Building2 className="h-4 w-4 text-blue-600" />
      case "REMOTE": return <Globe className="h-4 w-4 text-purple-600" />
      case "HYBRID": return <Home className="h-4 w-4 text-green-600" />
      default: return <Building2 className="h-4 w-4 text-blue-600" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatSalary = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
              currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center space-y-4">
              <div className="relative">
                <RefreshCw className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
                <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-20"></div>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-900">Loading Your Jobs</h3>
                <p className="text-sm text-gray-600">Please wait while we fetch your job data...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <Card className="w-full max-w-md shadow-lg border-red-200">
              <CardContent className="flex flex-col items-center space-y-6 p-8">
                <div className="relative">
                  <AlertCircle className="h-16 w-16 text-red-500" />
                  <div className="absolute inset-0 bg-red-100 rounded-full animate-pulse opacity-30"></div>
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-bold text-gray-900">Error Loading Jobs</h3>
                  <p className="text-sm text-gray-600">{error}</p>
                </div>
                <Button onClick={fetchJobs} variant="outline" className="border-red-200 hover:bg-red-50">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (!jobsData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <Card className="w-full max-w-md shadow-lg">
              <CardContent className="flex flex-col items-center space-y-6 p-8">
                <div className="relative">
                  <Info className="h-16 w-16 text-gray-400" />
                  <div className="absolute inset-0 bg-gray-100 rounded-full animate-pulse opacity-30"></div>
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-bold text-gray-900">No Data Available</h3>
                  <p className="text-sm text-gray-600">No jobs data found. Please check your connection and try again.</p>
                </div>
                <Button onClick={fetchJobs} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl">
                  <Briefcase className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    My Jobs
                  </h1>
                  <p className="text-lg text-gray-600">
                    Manage and track all your job postings and applications
                  </p>
                </div>
              </div>
            </div>
            <Button 
              onClick={fetchJobs} 
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Data
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        {jobsData && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 border-0">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-blue-100">Total Jobs</CardTitle>
                <Briefcase className="h-5 w-5 text-blue-200" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{jobsData.summary.totalJobs}</div>
                <p className="text-xs text-blue-200">
                  {jobsData.summary.activeJobs} active, {jobsData.summary.filledJobs} filled
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 border-0">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-emerald-100">Total Applications</CardTitle>
                <Users className="h-5 w-5 text-emerald-200" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{jobsData.summary.totalApplications}</div>
                <p className="text-xs text-emerald-200">
                  Across all job postings
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 border-0">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-purple-100">Open Positions</CardTitle>
                <Target className="h-5 w-5 text-purple-200" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{jobsData.summary.totalOpenPositions}</div>
                <p className="text-xs text-purple-200">
                  {jobsData.summary.totalAvailablePositions} available
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 border-0">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-orange-100">Avg. Applications/Day</CardTitle>
                <TrendingUp className="h-5 w-5 text-orange-200" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {jobsData.jobs.length > 0 
                    ? (jobsData.jobs.reduce((sum, job) => sum + job.applicationRate, 0) / jobsData.jobs.length).toFixed(1)
                    : "0"
                  }
                </div>
                <p className="text-xs text-orange-200">
                  Per active job
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters and Search */}
        <Card className="bg-white shadow-lg border border-gray-100 rounded-2xl">
          <CardHeader className="pb-6">
            <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
              <div className="flex flex-col lg:flex-row gap-4 flex-1 w-full">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    placeholder="Search jobs by title, company, or department..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 h-12 text-base border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                  />
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[200px] h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                    <SelectItem value="filled">Filled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                <Sparkles className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-semibold text-blue-700">
                  {filteredJobs.length} of {jobsData?.jobs.length || 0} jobs
                </span>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Jobs Table */}
        <Card className="bg-white shadow-lg border border-gray-100 rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
            <CardTitle className="flex items-center gap-3 text-xl font-bold text-gray-900">
              <BarChart3 className="h-6 w-6 text-blue-600" />
              Job Postings
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 hover:bg-gray-50">
                    <TableHead className="font-semibold text-gray-900">Job Details</TableHead>
                    <TableHead className="font-semibold text-gray-900">Status</TableHead>
                    <TableHead className="font-semibold text-gray-900">Applications</TableHead>
                    <TableHead className="font-semibold text-gray-900">Performance</TableHead>
                    <TableHead className="font-semibold text-gray-900">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentJobs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-12">
                        <div className="text-center space-y-4">
                          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
                            <Briefcase className="h-8 w-8 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">No Jobs Found</h3>
                            <p className="text-sm text-gray-600 mt-1">
                              {searchTerm || statusFilter !== "all" 
                                ? "Try adjusting your search or filter criteria"
                                : "No job postings available at the moment"
                              }
                            </p>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    currentJobs.map((job, index) => (
                    <TableRow key={job.id} className={`hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-300 border-b border-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                      <TableCell className="py-6">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2">
                              <h4 className="font-bold text-lg text-gray-900">{job.title}</h4>
                              <p className="text-base text-gray-600 font-medium">{job.company}</p>
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <MapPin className="h-4 w-4" />
                                {job.fullLocation}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {getWorkTypeIcon(job.workType)}
                              <Badge variant="outline" className={`${getPriorityColor(job.priority)} font-medium`}>
                                {job.priority}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center gap-6 text-sm text-gray-600">
                            <span className="flex items-center gap-2">
                              <span className="font-medium">₹{job.salaryMin.toLocaleString()} - ₹{job.salaryMax.toLocaleString()}/year</span>
                            </span>
                            <span className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-blue-600" />
                              <span className="font-medium">{formatDate(job.createdAt)}</span>
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell className="py-6">
                        <div className="space-y-3">
                          <Badge className={`${getStatusColor(job.jobStatus)} font-semibold text-sm px-3 py-1`}>
                            {job.jobStatus}
                          </Badge>
                          <div className="text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <Target className="h-4 w-4 text-blue-600" />
                              <span>{job.openPositions} open, {job.filledPositions} filled</span>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell className="py-6">
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <Users className="h-5 w-5 text-purple-600" />
                            <span className="font-bold text-lg text-gray-900">{job.totalApplications}</span>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600">Pending:</span>
                              <span className="font-medium text-amber-600">{job.pendingApplications}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600">Shortlisted:</span>
                              <span className="font-medium text-green-600">{job.shortlistedApplications}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600">Hired:</span>
                              <span className="font-medium text-blue-600">{job.hiredApplications}</span>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell className="py-6">
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <TrendingUp className="h-5 w-5 text-orange-600" />
                            <span className="font-bold text-lg text-gray-900">{job.applicationRate.toFixed(1)}</span>
                            <span className="text-sm text-gray-500">/day</span>
                          </div>
                          <div className="text-sm text-gray-600">
                            {job.daysSincePosted} days ago
                          </div>
                          {job.hasApplications && (
                            <div className="flex items-center gap-2 text-sm">
                              {job.hasShortlisted && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                              {job.hasHired && <Award className="h-4 w-4 text-blue-500" />}
                              {job.recentApplications.length > 0 && (
                                <span className="text-gray-500">
                                  {job.recentApplications.length} recent
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell className="py-6">
                        <div className="flex items-center gap-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedJob(job)
                              setIsJobDetailOpen(true)
                            }}
                            className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200 font-semibold"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
                </TableBody>
              </Table>
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between space-x-2 py-6 px-6 bg-gradient-to-r from-gray-50 to-blue-50 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  Showing {startIndex + 1} to {Math.min(endIndex, sortedJobs.length)} of {sortedJobs.length} jobs
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="border-gray-300 hover:bg-gray-50"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className={`w-10 h-10 ${currentPage === page ? 'bg-blue-600 hover:bg-blue-700' : 'border-gray-300 hover:bg-gray-50'}`}
                      >
                        {page}
                      </Button>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="border-gray-300 hover:bg-gray-50"
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Job Detail Dialog */}
        <Dialog open={isJobDetailOpen} onOpenChange={setIsJobDetailOpen}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-white">
            <DialogHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-t-lg">
              <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <Briefcase className="h-6 w-6 text-blue-600" />
                Job Details
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                Detailed view of job posting and applications
              </DialogDescription>
            </DialogHeader>
            
            {selectedJob && (
              <div className="space-y-8 p-6">
                {/* Job Information */}
                <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50">
                  <CardHeader className="bg-white rounded-t-lg border-b border-gray-200">
                    <CardTitle className="flex items-center gap-3 text-xl font-bold text-gray-900">
                      <Briefcase className="h-6 w-6 text-blue-600" />
                      Job Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6 p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <h3 className="text-2xl font-bold text-gray-900">{selectedJob.title}</h3>
                        <p className="text-lg text-gray-600 font-medium">{selectedJob.company}</p>
                        <p className="text-base text-gray-500">{selectedJob.department}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={`${getStatusColor(selectedJob.jobStatus)} text-sm px-4 py-2 font-semibold`}>
                          {selectedJob.jobStatus}
                        </Badge>
                        <Badge variant="outline" className={`${getPriorityColor(selectedJob.priority)} text-sm px-4 py-2 font-semibold`}>
                          {selectedJob.priority}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200">
                        <MapPin className="h-5 w-5 text-blue-600" />
                        <span className="font-medium text-gray-900">{selectedJob.fullLocation}</span>
                      </div>
                      <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200">
                        <span className="font-medium text-gray-900">
                          ₹{selectedJob.salaryMin.toLocaleString()} - ₹{selectedJob.salaryMax.toLocaleString()}/year
                        </span>
                      </div>
                      <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200">
                        {getWorkTypeIcon(selectedJob.workType)}
                        <span className="font-medium text-gray-900">{selectedJob.workType}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-bold text-lg text-gray-900 mb-2">Description</h4>
                        <p className="text-gray-700 leading-relaxed">{selectedJob.description}</p>
                      </div>
                      
                      <div>
                        <h4 className="font-bold text-lg text-gray-900 mb-2">Requirements</h4>
                        <p className="text-gray-700 leading-relaxed">{selectedJob.requirements}</p>
                      </div>
                      
                      <div>
                        <h4 className="font-bold text-lg text-gray-900 mb-2">Required Skills</h4>
                        <p className="text-gray-700 leading-relaxed">{selectedJob.requiredSkills}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Statistics */}
                <Card className="border-0 shadow-lg bg-gradient-to-r from-purple-50 to-pink-50">
                  <CardHeader className="bg-white rounded-t-lg border-b border-gray-200">
                    <CardTitle className="flex items-center gap-3 text-xl font-bold text-gray-900">
                      <BarChart3 className="h-6 w-6 text-purple-600" />
                      Statistics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      <div className="text-center p-4 bg-white rounded-xl border border-gray-200">
                        <div className="text-3xl font-bold text-blue-600">{selectedJob.totalApplications}</div>
                        <div className="text-sm text-gray-600 font-medium">Total Applications</div>
                      </div>
                      <div className="text-center p-4 bg-white rounded-xl border border-gray-200">
                        <div className="text-3xl font-bold text-amber-600">{selectedJob.pendingApplications}</div>
                        <div className="text-sm text-gray-600 font-medium">Pending</div>
                      </div>
                      <div className="text-center p-4 bg-white rounded-xl border border-gray-200">
                        <div className="text-3xl font-bold text-green-600">{selectedJob.shortlistedApplications}</div>
                        <div className="text-sm text-gray-600 font-medium">Shortlisted</div>
                      </div>
                      <div className="text-center p-4 bg-white rounded-xl border border-gray-200">
                        <div className="text-3xl font-bold text-purple-600">{selectedJob.hiredApplications}</div>
                        <div className="text-sm text-gray-600 font-medium">Hired</div>
                      </div>
                    </div>
                    
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center p-4 bg-white rounded-xl border border-gray-200">
                        <div className="text-2xl font-bold text-orange-600">{selectedJob.applicationRate.toFixed(1)}</div>
                        <div className="text-sm text-gray-600 font-medium">Applications/Day</div>
                      </div>
                      <div className="text-center p-4 bg-white rounded-xl border border-gray-200">
                        <div className="text-2xl font-bold text-indigo-600">{selectedJob.daysSincePosted}</div>
                        <div className="text-sm text-gray-600 font-medium">Days Posted</div>
                      </div>
                      <div className="text-center p-4 bg-white rounded-xl border border-gray-200">
                        <div className="text-2xl font-bold text-teal-600">{selectedJob.availablePositions}</div>
                        <div className="text-sm text-gray-600 font-medium">Available Positions</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Applications */}
                {selectedJob.allApplications.length > 0 && (
                  <Card className="border-0 shadow-lg bg-gradient-to-r from-green-50 to-emerald-50">
                    <CardHeader className="bg-white rounded-t-lg border-b border-gray-200">
                      <CardTitle className="flex items-center gap-3 text-xl font-bold text-gray-900">
                        <Users className="h-6 w-6 text-green-600" />
                        Applications ({selectedJob.allApplications.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-6">
                        {selectedJob.allApplications.map((application) => (
                          <div key={application.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
                            <div className="flex items-start justify-between mb-4">
                              <div className="space-y-3">
                                <h4 className="text-lg font-bold text-gray-900">{application.name}</h4>
                                <div className="flex items-center gap-6 text-sm text-gray-600">
                                  <span className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-blue-600" />
                                    {application.email}
                                  </span>
                                  <span className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-green-600" />
                                    {application.phone}
                                  </span>
                                  <span className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-purple-600" />
                                    {application.location}
                                  </span>
                                </div>
                              </div>
                              <Badge variant="outline" className="font-semibold">{application.status}</Badge>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="font-medium text-gray-700">Skills:</span>
                                  <span className="text-gray-900">{application.keySkills}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="font-medium text-gray-700">Experience:</span>
                                  <span className="text-gray-900">{application.yearsOfExperience}</span>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="font-medium text-gray-700">Salary Expectation:</span>
                                  <span className="text-gray-900">{formatSalary(application.salaryExpectation)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="font-medium text-gray-700">Start Date:</span>
                                  <span className="text-gray-900">{application.startDate}</span>
                                </div>
                              </div>
                            </div>
                            
                            {application.portfolioUrl && (
                              <div className="mt-4">
                                <Button variant="outline" size="sm" asChild className="border-blue-200 text-blue-700 hover:bg-blue-50">
                                  <a href={application.portfolioUrl} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    View Portfolio
                                  </a>
                                </Button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
} 