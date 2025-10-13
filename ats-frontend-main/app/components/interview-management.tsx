"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs"
import { Badge } from "../../components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar"
import { Input } from "../../components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { Button } from "../../components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../../components/ui/dialog"
import { Label } from "../../components/ui/label"
import { Textarea } from "../../components/ui/textarea"
import { Checkbox } from "../../components/ui/checkbox"
import { toast } from "../../components/ui/use-toast"
import {
  CalendarIcon,
  Clock,
  Users,
  Video,
  Phone,
  MapPin,
  Search,
  Filter,
  Star,
  MessageSquare,
  FileText,
  Brain,
  Eye,
  Copy,
  ExternalLink,
  Settings,
  Play,
  Square,
  Mic,
  MicOff,
  Camera,
  CameraOff,
  Monitor,
  PhoneCall,
  Download,
  RefreshCw,
  Mail,
  Calendar,
  User,
  Building,
  IndianRupee,
  Globe,
  Briefcase,
  GraduationCap,
  MapPin as MapPinIcon,
  Mail as MailIcon,
  Phone as PhoneIcon,
  ExternalLink as ExternalLinkIcon,
  AlertCircle,
  Plus,
  CalendarDays,
  Clock as ClockIcon,
  Video as VideoIcon,
  Phone as PhoneIcon2,
  MapPin as MapPinIcon2,
  User as UserIcon,
  MessageSquare as MessageSquareIcon,
  Brain as BrainIcon,
  Users as UsersIcon,
  CheckCircle,
  XCircle,
} from "lucide-react"
import { format, parseISO } from "date-fns"
import BASE_API_URL from "../../BaseUrlApi"

// Types for Selected Interviews API
interface SelectedInterviewsData {
  success: boolean
  totalCandidates: number
  candidates: Array<{
    id: number
    name: string
    email: string
    phone: string
    skills: string
    experience: string
    expectedSalary: number
    interviewStage: string
    job: {
      title: string
      company: string
      location: string
    }
  }>
  stageCounts: {
    "First Interview": number
    "Second Interview": number
    "Final Interview": number
  }
}

// Types for Scheduled Interviews API
interface ScheduledInterviewsData {
  success: boolean
  message: string
  data: {
    totalScheduled: number
    upcomingInterviews: number
    completedInterviews: number
    statistics: {
      interviewTypeStats: Record<string, number>
      interviewModeStats: Record<string, number>
    }
    candidates: Array<{
      interviewId: number
      interviewDate: string
      interviewTime: string
      interviewType: string
      interviewMode: string
      platform: string
      meetingLink: string
      interviewer: string
      notes: string
      interviewStatus: string
      interviewCreatedAt: string
      interviewUpdatedAt: string
      candidateId: number
      candidateName: string
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
      candidateStatus: string
      appliedAt: string
      updatedAt: string
      resumeDownloadUrl: string
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
    }>
  }
  timestamp: string
}

export default function InterviewManagement() {
  const [activeTab, setActiveTab] = useState("overview")
  const [selectedData, setSelectedData] = useState<SelectedInterviewsData | null>(null)
  const [scheduledData, setScheduledData] = useState<ScheduledInterviewsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Search and filter states for Overview tab
  const [overviewSearchTerm, setOverviewSearchTerm] = useState("")
  const [overviewFilterStage, setOverviewFilterStage] = useState("all")

  // Search and filter states for Scheduled tab
  const [scheduledSearchTerm, setScheduledSearchTerm] = useState("")
  const [scheduledFilterType, setScheduledFilterType] = useState("all")
  const [scheduledFilterMode, setScheduledFilterMode] = useState("all")

  // Interview scheduling states
  const [singleScheduleOpen, setSingleScheduleOpen] = useState(false)
  const [bulkScheduleOpen, setBulkScheduleOpen] = useState(false)
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null)
  const [selectedCandidates, setSelectedCandidates] = useState<number[]>([])
  const [schedulingLoading, setSchedulingLoading] = useState(false)

  // Single interview form state
  const [singleInterviewForm, setSingleInterviewForm] = useState({
    candidateId: "",
    candidateName: "",
    interviewDate: "",
    interviewTime: "",
    interviewType: "",
    interviewMode: "",
    platform: "Zoom",
    meetingLink: "",
    interviewer: "",
    notes: ""
  })

  // Bulk interview form state
  const [bulkInterviewForm, setBulkInterviewForm] = useState({
    candidateIds: [] as number[],
    interviewDate: "",
    interviewTime: "",
    interviewType: "",
    interviewMode: "",
    platform: "Zoom",
    meetingLink: "",
    interviewer: "",
    notes: ""
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    setError(null)

    try {
      // Get company ID and token from localStorage
      const user = JSON.parse(localStorage.getItem('ats_user') || 'null');
      const companyId = user?.companyId;
      const token = user?.token;
      
      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }
      
      // Fetch selected interviews data
      const selectedUrl = new URL(`${BASE_API_URL}/interviews/selected`);
      if (companyId) {
        selectedUrl.searchParams.set('companyId', companyId.toString());
      }
      const selectedResponse = await fetch(selectedUrl.toString(), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      })
      const selectedResult = await selectedResponse.json()

      // Fetch scheduled interviews data
      const scheduledUrl = new URL(`${BASE_API_URL}/interviews/scheduled`);
      if (companyId) {
        scheduledUrl.searchParams.set('companyId', companyId.toString());
      }
      const scheduledResponse = await fetch(scheduledUrl.toString(), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      })
      const scheduledResult = await scheduledResponse.json()

      if (selectedResult.success) {
        setSelectedData(selectedResult)
      }

      if (scheduledResult.success) {
        setScheduledData(scheduledResult)
      }

      setLoading(false)
    } catch (err) {
      setError("Failed to fetch data")
      setLoading(false)
    }
  }

  // Schedule single interview
  const handleSingleSchedule = async () => {
    setSchedulingLoading(true)
    try {
      // Get token from localStorage
      const user = JSON.parse(localStorage.getItem('ats_user') || 'null');
      const token = user?.token;
      
      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }

      const response = await fetch(`${BASE_API_URL}/interviews/schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(singleInterviewForm),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Success",
          description: "Interview scheduled successfully!",
        })
        setSingleScheduleOpen(false)
        setSingleInterviewForm({
          candidateId: "",
          candidateName: "",
          interviewDate: "",
          interviewTime: "",
          interviewType: "",
          interviewMode: "",
          platform: "Zoom",
          meetingLink: "",
          interviewer: "",
          notes: ""
        })
        fetchData() // Refresh data
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to schedule interview",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to schedule interview",
        variant: "destructive",
      })
    } finally {
      setSchedulingLoading(false)
    }
  }

  // Schedule bulk interviews
  const handleBulkSchedule = async () => {
    setSchedulingLoading(true)
    try {
      // Get token from localStorage
      const user = JSON.parse(localStorage.getItem('ats_user') || 'null');
      const token = user?.token;
      
      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }

      const response = await fetch(`${BASE_API_URL}/interviews/bulk-schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(bulkInterviewForm),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Success",
          description: `Successfully scheduled ${result.data.totalScheduled} interviews!`,
        })
        setBulkScheduleOpen(false)
        setBulkInterviewForm({
          candidateIds: [],
          interviewDate: "",
          interviewTime: "",
          interviewType: "",
          interviewMode: "",
          platform: "Zoom",
          meetingLink: "",
          interviewer: "",
          notes: ""
        })
        setSelectedCandidates([])
        fetchData() // Refresh data
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to schedule interviews",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to schedule interviews",
        variant: "destructive",
      })
    } finally {
      setSchedulingLoading(false)
    }
  }

  // Handle candidate selection for single scheduling
  const handleSingleScheduleClick = (candidate: any) => {
    setSelectedCandidate(candidate)
    setSingleInterviewForm({
      candidateId: candidate.id.toString(),
      candidateName: candidate.name,
      interviewDate: "",
      interviewTime: "",
      interviewType: "",
      interviewMode: "",
      platform: "Zoom",
      meetingLink: "",
      interviewer: "",
      notes: ""
    })
    setSingleScheduleOpen(true)
  }

  // Handle candidate selection for bulk scheduling
  const handleCandidateSelection = (candidateId: number, checked: boolean) => {
    if (checked) {
      setSelectedCandidates([...selectedCandidates, candidateId])
    } else {
      setSelectedCandidates(selectedCandidates.filter(id => id !== candidateId))
    }
  }

  // Handle select all candidates
  const handleSelectAll = () => {
    if (selectedCandidates.length === filteredOverviewCandidates.length) {
      // If all are selected, deselect all
      setSelectedCandidates([])
    } else {
      // Select all filtered candidates
      const allCandidateIds = filteredOverviewCandidates.map(candidate => candidate.id)
      setSelectedCandidates(allCandidateIds)
    }
  }

  // Handle bulk schedule button click
  const handleBulkScheduleClick = () => {
    if (selectedCandidates.length === 0) {
      toast({
        title: "No candidates selected",
        description: "Please select at least one candidate to schedule interviews",
        variant: "destructive",
      })
      return
    }
    setBulkInterviewForm({
      ...bulkInterviewForm,
      candidateIds: selectedCandidates
    })
    setBulkScheduleOpen(true)
  }

  // Filter functions for Overview tab
  const filteredOverviewCandidates = selectedData?.candidates.filter((candidate) => {
    const matchesSearch = candidate.name.toLowerCase().includes(overviewSearchTerm.toLowerCase()) ||
                         candidate.email.toLowerCase().includes(overviewSearchTerm.toLowerCase())
    const matchesStage = overviewFilterStage === "all" || candidate.interviewStage === overviewFilterStage
    return matchesSearch && matchesStage
  }) || []

  // Filter functions for Scheduled tab
  const filteredScheduledCandidates = scheduledData?.data.candidates.filter((candidate) => {
    const matchesSearch = candidate.candidateName.toLowerCase().includes(scheduledSearchTerm.toLowerCase()) ||
                         candidate.email.toLowerCase().includes(scheduledSearchTerm.toLowerCase())
    const matchesType = scheduledFilterType === "all" || candidate.interviewType === scheduledFilterType
    const matchesMode = scheduledFilterMode === "all" || candidate.interviewMode === scheduledFilterMode
    return matchesSearch && matchesType && matchesMode
  }) || []

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SCHEDULED":
        return "bg-blue-100 text-blue-800"
      case "COMPLETED":
        return "bg-green-100 text-green-800"
      case "CANCELLED":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getInterviewTypeIcon = (type: string) => {
    switch (type) {
      case "HR":
        return <User className="w-4 h-4" />
      case "Technical":
        return <Brain className="w-4 h-4" />
      case "Behavioral":
        return <MessageSquare className="w-4 h-4" />
      default:
        return <CalendarIcon className="w-4 h-4" />
    }
  }

  const getInterviewModeIcon = (mode: string) => {
    switch (mode) {
      case "Phone":
        return <Phone className="w-4 h-4" />
      case "Video":
        return <Video className="w-4 h-4" />
      case "In-Person":
        return <MapPin className="w-4 h-4" />
      default:
        return <CalendarIcon className="w-4 h-4" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading interview data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="p-4 bg-red-100 rounded-full mb-4 mx-auto w-16 h-16 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Data</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Interview Management</h2>
          <p className="text-gray-600">Manage selected and scheduled interviews</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            onClick={handleBulkScheduleClick}
            disabled={selectedCandidates.length === 0}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <UsersIcon className="w-4 h-4 mr-2" />
            Bulk Schedule ({selectedCandidates.length})
          </Button>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled Interviews</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6">
          <div className="space-y-6">
            {/* Search and Filters for Overview */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Search by name or email..."
                        value={overviewSearchTerm}
                        onChange={(e) => setOverviewSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Select value={overviewFilterStage} onValueChange={setOverviewFilterStage}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Filter by stage" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Stages</SelectItem>
                        <SelectItem value="First Interview">First Interview</SelectItem>
                        <SelectItem value="Second Interview">Second Interview</SelectItem>
                        <SelectItem value="Final Interview">Final Interview</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={handleSelectAll}
                      variant="outline"
                      size="sm"
                      className="flex items-center space-x-1"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>
                        {selectedCandidates.length === filteredOverviewCandidates.length && filteredOverviewCandidates.length > 0
                          ? "Deselect All"
                          : "Select All"}
                      </span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Statistics Cards */}
            {selectedData && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Candidates</p>
                        <p className="text-2xl font-bold text-gray-900">{selectedData.totalCandidates}</p>
                      </div>
                      <Users className="w-8 h-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">First Interview</p>
                        <p className="text-2xl font-bold text-purple-600">{selectedData.stageCounts["First Interview"]}</p>
                      </div>
                      <CalendarIcon className="w-8 h-8 text-purple-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Second Interview</p>
                        <p className="text-2xl font-bold text-green-600">{selectedData.stageCounts["Second Interview"]}</p>
                      </div>
                      <Clock className="w-8 h-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Final Interview</p>
                        <p className="text-2xl font-bold text-orange-600">{selectedData.stageCounts["Final Interview"]}</p>
                      </div>
                      <Star className="w-8 h-8 text-orange-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Candidates Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredOverviewCandidates.map((candidate) => (
                <Card key={candidate.id} className="hover:shadow-xl transition-all duration-300 hover:scale-105 bg-gradient-to-br from-white to-gray-50 border-gray-200">
                  <CardHeader className="pb-4">
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-12 h-12">
                        <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold">
                          {candidate.name.split(" ").map((n) => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-gray-900">{candidate.name}</h3>
                        <Badge className={`mt-1 ${
                          candidate.interviewStage === "First Interview" ? "bg-blue-100 text-blue-800" :
                          candidate.interviewStage === "Second Interview" ? "bg-green-100 text-green-800" :
                          "bg-orange-100 text-orange-800"
                        }`}>
                          {candidate.interviewStage}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {/* Contact Info */}
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <MailIcon className="w-4 h-4" />
                        <span>{candidate.email}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <PhoneIcon className="w-4 h-4" />
                        <span>{candidate.phone}</span>
                      </div>
                    </div>

                    {/* Job Info */}
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-sm">
                        <Briefcase className="w-4 h-4 text-gray-500" />
                        <span className="font-medium">{candidate.job.title}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Building className="w-4 h-4" />
                        <span>{candidate.job.company}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <MapPinIcon className="w-4 h-4" />
                        <span>{candidate.job.location}</span>
                      </div>
                    </div>

                    {/* Skills */}
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-sm">
                        <GraduationCap className="w-4 h-4 text-gray-500" />
                        <span className="font-medium">Skills</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {candidate.skills.split(" ").map((skill, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Experience & Salary */}
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span>{candidate.experience}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <IndianRupee className="w-4 h-4 text-gray-500" />
                        <span>₹{candidate.expectedSalary.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={selectedCandidates.includes(candidate.id)}
                          onCheckedChange={(checked) => 
                            handleCandidateSelection(candidate.id, checked as boolean)
                          }
                        />
                        <span className="text-xs text-gray-600">Select for bulk</span>
                      </div>
                      <Button
                        onClick={() => handleSingleScheduleClick(candidate)}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <CalendarDays className="w-4 h-4 mr-1" />
                        Schedule
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredOverviewCandidates.length === 0 && (
              <Card className="bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <div className="p-4 bg-blue-100 rounded-full mb-4">
                    <Users className="w-12 h-12 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No candidates found</h3>
                  <p className="text-gray-600 text-center max-w-md">
                    No candidates match your current search and filter criteria.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Scheduled Interviews Tab */}
        <TabsContent value="scheduled" className="mt-6">
          <div className="space-y-6">
            {/* Search and Filters for Scheduled */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Search by name or email..."
                        value={scheduledSearchTerm}
                        onChange={(e) => setScheduledSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Select value={scheduledFilterType} onValueChange={setScheduledFilterType}>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="HR">HR</SelectItem>
                        <SelectItem value="Technical">Technical</SelectItem>
                        <SelectItem value="Behavioral">Behavioral</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={scheduledFilterMode} onValueChange={setScheduledFilterMode}>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Mode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Modes</SelectItem>
                        <SelectItem value="Phone">Phone</SelectItem>
                        <SelectItem value="Video">Video</SelectItem>
                        <SelectItem value="In-Person">In-Person</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Statistics Cards */}
            {scheduledData && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Scheduled</p>
                        <p className="text-2xl font-bold text-gray-900">{scheduledData.data.totalScheduled}</p>
                      </div>
                      <Calendar className="w-8 h-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Upcoming</p>
                        <p className="text-2xl font-bold text-green-600">{scheduledData.data.upcomingInterviews}</p>
                      </div>
                      <Clock className="w-8 h-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Completed</p>
                        <p className="text-2xl font-bold text-purple-600">{scheduledData.data.completedInterviews}</p>
                      </div>
                      <Star className="w-8 h-8 text-purple-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Candidates</p>
                        <p className="text-2xl font-bold text-orange-600">{scheduledData.data.candidates.length}</p>
                      </div>
                      <Users className="w-8 h-8 text-orange-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Scheduled Candidates Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredScheduledCandidates.map((candidate) => (
                <Card key={candidate.interviewId} className="hover:shadow-xl transition-all duration-300 hover:scale-105 bg-gradient-to-br from-white to-gray-50 border-gray-200">
                  <CardHeader className="pb-4">
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-12 h-12">
                        <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold">
                          {candidate.candidateName.split(" ").map((n) => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-gray-900">{candidate.candidateName}</h3>
                        <Badge className={`mt-1 ${getStatusColor(candidate.interviewStatus)}`}>
                          {candidate.interviewStatus}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {/* Interview Details */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {getInterviewTypeIcon(candidate.interviewType)}
                          <span className="text-sm font-medium">{candidate.interviewType}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getInterviewModeIcon(candidate.interviewMode)}
                          <span className="text-sm">{candidate.interviewMode}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <CalendarIcon className="w-4 h-4" />
                        <span>{format(parseISO(candidate.interviewDate), "MMM dd, yyyy")}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>{candidate.interviewTime}</span>
                      </div>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <MailIcon className="w-4 h-4" />
                        <span>{candidate.email}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <PhoneIcon className="w-4 h-4" />
                        <span>{candidate.phone}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <MapPinIcon className="w-4 h-4" />
                        <span>{candidate.currentLocation}</span>
                      </div>
                    </div>

                    {/* Job Info */}
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-sm">
                        <Briefcase className="w-4 h-4 text-gray-500" />
                        <span className="font-medium">{candidate.job.title}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Building className="w-4 h-4" />
                        <span>{candidate.job.company}</span>
                      </div>
                    </div>

                    {/* Interview Details */}
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-sm">
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="font-medium">Interviewer: {candidate.interviewer}</span>
                      </div>
                      {candidate.meetingLink && (
                        <div className="flex items-center space-x-2 text-sm">
                          <Video className="w-4 h-4 text-gray-500" />
                          <span className="font-medium">Platform: {candidate.platform}</span>
                        </div>
                      )}
                    </div>

                    {/* Skills & Experience */}
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-sm">
                        <GraduationCap className="w-4 h-4 text-gray-500" />
                        <span className="font-medium">Skills</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {candidate.keySkills.split(" ").map((skill, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">{candidate.yearsOfExperience}</span>
                        <span className="font-medium">₹{candidate.salaryExpectation.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Meeting Link */}
                    {candidate.meetingLink && (
                      <div className="pt-2 border-t">
                        <a
                          href={candidate.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          <ExternalLinkIcon className="w-4 h-4" />
                          <span>Join Meeting</span>
                        </a>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredScheduledCandidates.length === 0 && (
              <Card className="bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <div className="p-4 bg-blue-100 rounded-full mb-4">
                    <Calendar className="w-12 h-12 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No scheduled interviews found</h3>
                  <p className="text-gray-600 text-center max-w-md">
                    No scheduled interviews match your current search and filter criteria.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Single Interview Schedule Dialog */}
      <Dialog open={singleScheduleOpen} onOpenChange={setSingleScheduleOpen}>
        <DialogContent className="max-w-5xl w-[95vw] h-[85vh] overflow-hidden">
          <DialogHeader className="border-b pb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CalendarDays className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold text-gray-900">Schedule Interview</DialogTitle>
                <DialogDescription className="text-gray-600 mt-1">
                  Schedule an interview for <span className="font-semibold text-blue-600">{selectedCandidate?.name}</span>
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-8">
              {/* Candidate Information Section */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                <div className="flex items-center space-x-3 mb-4">
                  <User className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Candidate Information</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="candidateId" className="text-sm font-medium text-gray-700">Candidate ID</Label>
                    <Input
                      id="candidateId"
                      value={singleInterviewForm.candidateId}
                      onChange={(e) => setSingleInterviewForm({
                        ...singleInterviewForm,
                        candidateId: e.target.value
                      })}
                      disabled
                      className="bg-gray-50 border-gray-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="candidateName" className="text-sm font-medium text-gray-700">Candidate Name</Label>
                    <Input
                      id="candidateName"
                      value={singleInterviewForm.candidateName}
                      onChange={(e) => setSingleInterviewForm({
                        ...singleInterviewForm,
                        candidateName: e.target.value
                      })}
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Interview Details Section */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
                <div className="flex items-center space-x-3 mb-4">
                  <Calendar className="w-5 h-5 text-green-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Interview Details</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="interviewDate" className="text-sm font-medium text-gray-700">Interview Date</Label>
                    <Input
                      id="interviewDate"
                      type="date"
                      value={singleInterviewForm.interviewDate}
                      onChange={(e) => setSingleInterviewForm({
                        ...singleInterviewForm,
                        interviewDate: e.target.value
                      })}
                      className="border-gray-300 focus:border-green-500 focus:ring-green-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="interviewTime" className="text-sm font-medium text-gray-700">Interview Time</Label>
                    <Input
                      id="interviewTime"
                      type="time"
                      value={singleInterviewForm.interviewTime}
                      onChange={(e) => setSingleInterviewForm({
                        ...singleInterviewForm,
                        interviewTime: e.target.value
                      })}
                      className="border-gray-300 focus:border-green-500 focus:ring-green-500"
                    />
                  </div>
                </div>
              </div>

              {/* Interview Configuration Section */}
              <div className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl p-6 border border-purple-100">
                <div className="flex items-center space-x-3 mb-4">
                  <Settings className="w-5 h-5 text-purple-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Interview Configuration</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="interviewType" className="text-sm font-medium text-gray-700">Interview Type</Label>
                    <Select
                      value={singleInterviewForm.interviewType}
                      onValueChange={(value) => setSingleInterviewForm({
                        ...singleInterviewForm,
                        interviewType: value
                      })}
                    >
                      <SelectTrigger className="border-gray-300 focus:border-purple-500 focus:ring-purple-500">
                        <SelectValue placeholder="Select interview type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Technical">Technical</SelectItem>
                        <SelectItem value="HR">HR</SelectItem>
                        <SelectItem value="Behavioral">Behavioral</SelectItem>
                        <SelectItem value="Panel">Panel</SelectItem>
                        <SelectItem value="Final">Final</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="interviewMode" className="text-sm font-medium text-gray-700">Interview Mode</Label>
                    <Select
                      value={singleInterviewForm.interviewMode}
                      onValueChange={(value) => setSingleInterviewForm({
                        ...singleInterviewForm,
                        interviewMode: value
                      })}
                    >
                      <SelectTrigger className="border-gray-300 focus:border-purple-500 focus:ring-purple-500">
                        <SelectValue placeholder="Select interview mode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Online">Online</SelectItem>
                        <SelectItem value="Onsite">Onsite</SelectItem>
                        <SelectItem value="Phone">Phone</SelectItem>
                        <SelectItem value="Hybrid">Hybrid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Meeting Information Section */}
              <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-6 border border-orange-100">
                <div className="flex items-center space-x-3 mb-4">
                  <Video className="w-5 h-5 text-orange-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Meeting Information</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="platform" className="text-sm font-medium text-gray-700">Platform</Label>
                    <Input
                      id="platform"
                      value={singleInterviewForm.platform}
                      onChange={(e) => setSingleInterviewForm({
                        ...singleInterviewForm,
                        platform: e.target.value
                      })}
                      placeholder="Zoom, Google Meet, etc."
                      className="border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="meetingLink" className="text-sm font-medium text-gray-700">Meeting Link</Label>
                    <Input
                      id="meetingLink"
                      value={singleInterviewForm.meetingLink}
                      onChange={(e) => setSingleInterviewForm({
                        ...singleInterviewForm,
                        meetingLink: e.target.value
                      })}
                      placeholder="https://..."
                      className="border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="interviewer" className="text-sm font-medium text-gray-700">Interviewer</Label>
                    <Input
                      id="interviewer"
                      value={singleInterviewForm.interviewer}
                      onChange={(e) => setSingleInterviewForm({
                        ...singleInterviewForm,
                        interviewer: e.target.value
                      })}
                      placeholder="Interviewer name"
                      className="border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                    />
                  </div>
                </div>
              </div>

              {/* Additional Notes Section */}
              <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-6 border border-gray-200">
                <div className="flex items-center space-x-3 mb-4">
                  <FileText className="w-5 h-5 text-gray-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Additional Notes</h3>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-sm font-medium text-gray-700">Notes</Label>
                  <Textarea
                    id="notes"
                    value={singleInterviewForm.notes}
                    onChange={(e) => setSingleInterviewForm({
                      ...singleInterviewForm,
                      notes: e.target.value
                    })}
                    placeholder="Add any additional notes or instructions for the interview..."
                    rows={4}
                    className="border-gray-300 focus:border-gray-500 focus:ring-gray-500 resize-none"
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="border-t pt-6 bg-white">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <AlertCircle className="w-4 h-4" />
                <span>All fields marked with * are required</span>
              </div>
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setSingleScheduleOpen(false)}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSingleSchedule}
                  disabled={schedulingLoading || !singleInterviewForm.candidateId || !singleInterviewForm.interviewDate || !singleInterviewForm.interviewTime || !singleInterviewForm.interviewType || !singleInterviewForm.interviewMode}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6"
                >
                  {schedulingLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Scheduling...
                    </>
                  ) : (
                    <>
                      <CalendarDays className="w-4 h-4 mr-2" />
                      Schedule Interview
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Interview Schedule Dialog */}
      <Dialog open={bulkScheduleOpen} onOpenChange={setBulkScheduleOpen}>
        <DialogContent className="max-w-5xl w-[95vw] h-[85vh] overflow-hidden">
          <DialogHeader className="border-b pb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold text-gray-900">Bulk Schedule Interviews</DialogTitle>
                <DialogDescription className="text-gray-600 mt-1">
                  Schedule interviews for <span className="font-semibold text-purple-600">{selectedCandidates.length} selected candidates</span>
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-8">
              {/* Selected Candidates Summary */}
              <div className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl p-6 border border-purple-100">
                <div className="flex items-center space-x-3 mb-4">
                  <Users className="w-5 h-5 text-purple-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Selected Candidates</h3>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <span className="text-2xl font-bold text-purple-600">{selectedCandidates.length}</span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total candidates selected</p>
                      <p className="text-xs text-gray-500">All candidates will be scheduled with the same interview details</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="border-purple-200 text-purple-700">
                    Bulk Operation
                  </Badge>
                </div>
              </div>

              {/* Interview Details Section */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
                <div className="flex items-center space-x-3 mb-4">
                  <Calendar className="w-5 h-5 text-green-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Interview Details</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bulkInterviewDate" className="text-sm font-medium text-gray-700">Interview Date</Label>
                    <Input
                      id="bulkInterviewDate"
                      type="date"
                      value={bulkInterviewForm.interviewDate}
                      onChange={(e) => setBulkInterviewForm({
                        ...bulkInterviewForm,
                        interviewDate: e.target.value
                      })}
                      className="border-gray-300 focus:border-green-500 focus:ring-green-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bulkInterviewTime" className="text-sm font-medium text-gray-700">Interview Time</Label>
                    <Input
                      id="bulkInterviewTime"
                      type="time"
                      value={bulkInterviewForm.interviewTime}
                      onChange={(e) => setBulkInterviewForm({
                        ...bulkInterviewForm,
                        interviewTime: e.target.value
                      })}
                      className="border-gray-300 focus:border-green-500 focus:ring-green-500"
                    />
                  </div>
                </div>
              </div>

              {/* Interview Configuration Section */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                <div className="flex items-center space-x-3 mb-4">
                  <Settings className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Interview Configuration</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bulkInterviewType" className="text-sm font-medium text-gray-700">Interview Type</Label>
                    <Select
                      value={bulkInterviewForm.interviewType}
                      onValueChange={(value) => setBulkInterviewForm({
                        ...bulkInterviewForm,
                        interviewType: value
                      })}
                    >
                      <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                        <SelectValue placeholder="Select interview type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Technical">Technical</SelectItem>
                        <SelectItem value="HR">HR</SelectItem>
                        <SelectItem value="Behavioral">Behavioral</SelectItem>
                        <SelectItem value="Panel">Panel</SelectItem>
                        <SelectItem value="Final">Final</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bulkInterviewMode" className="text-sm font-medium text-gray-700">Interview Mode</Label>
                    <Select
                      value={bulkInterviewForm.interviewMode}
                      onValueChange={(value) => setBulkInterviewForm({
                        ...bulkInterviewForm,
                        interviewMode: value
                      })}
                    >
                      <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                        <SelectValue placeholder="Select interview mode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Online">Online</SelectItem>
                        <SelectItem value="Onsite">Onsite</SelectItem>
                        <SelectItem value="Phone">Phone</SelectItem>
                        <SelectItem value="Hybrid">Hybrid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Meeting Information Section */}
              <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-6 border border-orange-100">
                <div className="flex items-center space-x-3 mb-4">
                  <Video className="w-5 h-5 text-orange-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Meeting Information</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bulkPlatform" className="text-sm font-medium text-gray-700">Platform</Label>
                    <Input
                      id="bulkPlatform"
                      value={bulkInterviewForm.platform}
                      onChange={(e) => setBulkInterviewForm({
                        ...bulkInterviewForm,
                        platform: e.target.value
                      })}
                      placeholder="Zoom, Google Meet, etc."
                      className="border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bulkMeetingLink" className="text-sm font-medium text-gray-700">Meeting Link</Label>
                    <Input
                      id="bulkMeetingLink"
                      value={bulkInterviewForm.meetingLink}
                      onChange={(e) => setBulkInterviewForm({
                        ...bulkInterviewForm,
                        meetingLink: e.target.value
                      })}
                      placeholder="https://..."
                      className="border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bulkInterviewer" className="text-sm font-medium text-gray-700">Interviewer</Label>
                    <Input
                      id="bulkInterviewer"
                      value={bulkInterviewForm.interviewer}
                      onChange={(e) => setBulkInterviewForm({
                        ...bulkInterviewForm,
                        interviewer: e.target.value
                      })}
                      placeholder="Interviewer name"
                      className="border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                    />
                  </div>
                </div>
              </div>

              {/* Additional Notes Section */}
              <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-6 border border-gray-200">
                <div className="flex items-center space-x-3 mb-4">
                  <FileText className="w-5 h-5 text-gray-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Additional Notes</h3>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bulkNotes" className="text-sm font-medium text-gray-700">Notes</Label>
                  <Textarea
                    id="bulkNotes"
                    value={bulkInterviewForm.notes}
                    onChange={(e) => setBulkInterviewForm({
                      ...bulkInterviewForm,
                      notes: e.target.value
                    })}
                    placeholder="Add any additional notes or instructions for all interviews..."
                    rows={4}
                    className="border-gray-300 focus:border-gray-500 focus:ring-gray-500 resize-none"
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="border-t pt-6 bg-white">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <AlertCircle className="w-4 h-4" />
                <span>All fields marked with * are required</span>
              </div>
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setBulkScheduleOpen(false)}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleBulkSchedule}
                  disabled={schedulingLoading || !bulkInterviewForm.interviewDate || !bulkInterviewForm.interviewTime || !bulkInterviewForm.interviewType || !bulkInterviewForm.interviewMode}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6"
                >
                  {schedulingLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Scheduling...
                    </>
                  ) : (
                    <>
                      <Users className="w-4 h-4 mr-2" />
                      Schedule {selectedCandidates.length} Interviews
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
