"use client"

import { useState, useMemo } from "react"
import { Card } from "../../components/ui/card"
import { Badge } from "../../components/ui/badge"
import { Button } from "../../components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { Avatar, AvatarFallback } from "../../components/ui/avatar"
import { Input } from "../../components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "../../components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../components/ui/dialog"
import {
  Clock,
  IndianRupee,
  MapPin,
  Mail,
  User,
  Search,
  MoreHorizontal,
  Star,
  Brain,
  Users,
  UserCheck,
  Briefcase,
  MessageSquare,
  Eye,
  Edit,
  Trash2,
  Phone,
  Target,
  Award,
  AlertCircle,
  CheckCircle,
  XCircle,
} from "lucide-react"
import { isDateInRange } from "../../lib/date-utils"
import { DateFilter } from "../../components/date-filter"
import { RecruiterFilter } from "../../components/recruiter-filter"
import AIInterviewScheduler from "./ai-interview-scheduler"
import InterviewIntegration from "./interview-integration"

interface PipelineCandidate {
  id: string
  name: string
  email: string
  phone: string
  position: string
  stage: string
  expectedSalary: number
  currentLocation: string
  daysInStage: number
  nextAction: string
  recruiterNotes: string
  appliedDate: string
  lastUpdated: string
  recruiterId: string
  recruiterName: string
  recruiterLoginName: string
  priority: "urgent" | "high" | "medium" | "low"
  aiScore: number
  aiVerdict: "recommended" | "maybe" | "not-recommended"
  profileStrength: "strong" | "moderate" | "weak"
  skills: string[]
  experience: number
  customer: string
  jobPosting: string
}

const stages = [
  { key: "new-application", label: "New Application", color: "bg-blue-100 text-blue-800 border-blue-200" },
  { key: "initial-review", label: "Initial Review", color: "bg-indigo-100 text-indigo-800 border-indigo-200" },
  { key: "screening", label: "Screening", color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  { key: "phone-interview", label: "Phone Interview", color: "bg-orange-100 text-orange-800 border-orange-200" },
  {
    key: "technical-interview",
    label: "Technical Interview",
    color: "bg-purple-100 text-purple-800 border-purple-200",
  },
  { key: "final-interview", label: "Final Interview", color: "bg-indigo-100 text-indigo-800 border-indigo-200" },
  { key: "reference-check", label: "Reference Check", color: "bg-cyan-100 text-cyan-800 border-cyan-200" },
  { key: "offer-preparation", label: "Offer Preparation", color: "bg-green-100 text-green-800 border-green-200" },
  { key: "offer-sent", label: "Offer Sent", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  { key: "offer-negotiation", label: "Offer Negotiation", color: "bg-teal-100 text-teal-800 border-teal-200" },
  { key: "offer-accepted", label: "Offer Accepted", color: "bg-green-100 text-green-800 border-green-200" },
  { key: "background-check", label: "Background Check", color: "bg-blue-100 text-blue-800 border-blue-200" },
  { key: "onboarding", label: "Onboarding", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  { key: "hired", label: "Hired", color: "bg-green-100 text-green-800 border-green-200" },
  { key: "offer-declined", label: "Offer Declined", color: "bg-orange-100 text-orange-800 border-orange-200" },
  { key: "withdrawn", label: "Withdrawn", color: "bg-gray-100 text-gray-800 border-gray-200" },
  { key: "rejected", label: "Rejected", color: "bg-red-100 text-red-800 border-red-200" },
]

export default function Pipeline() {
  const [selectedJob, setSelectedJob] = useState("all")
  const [dateFilter, setDateFilter] = useState("all")
  const [recruiterFilter, setRecruiterFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [customerFilter, setCustomerFilter] = useState("all")
  const [aiVerdictFilter, setAiVerdictFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [profileStrengthFilter, setProfileStrengthFilter] = useState("all")
  const [viewMode, setViewMode] = useState("detailed")
  const [columnCount, setColumnCount] = useState(4)
  const [isSchedulerOpen, setIsSchedulerOpen] = useState(false)
  const [selectedCandidateForScheduling, setSelectedCandidateForScheduling] = useState<string>("")

  // Add recruiter data
  const recruiters = [
    { id: "1", name: "Sarah Wilson", loginName: "swilson" },
    { id: "2", name: "Mike Johnson", loginName: "mjohnson" },
    { id: "3", name: "Emily Chen", loginName: "echen" },
    { id: "4", name: "David Brown", loginName: "dbrown" },
  ]

  const [candidates] = useState<PipelineCandidate[]>([
    {
      id: "1",
      name: "John Smith",
      email: "john.smith@email.com",
      phone: "+1-555-0123",
      position: "Senior Software Engineer",
      stage: "technical-interview",
      expectedSalary: 120000,
      currentLocation: "San Francisco, CA",
      daysInStage: 3,
      nextAction: "Schedule final interview",
      recruiterNotes: "Strong technical skills, good cultural fit",
      appliedDate: "2024-01-15",
      lastUpdated: "2024-01-18",
      recruiterId: "1",
      recruiterName: "Sarah Wilson",
      recruiterLoginName: "swilson",
      priority: "high",
      aiScore: 8.5,
      aiVerdict: "recommended",
      profileStrength: "strong",
      skills: ["React", "Node.js", "TypeScript", "AWS"],
      experience: 5,
      customer: "TechCorp Inc",
      jobPosting: "Senior Full Stack Developer",
    },
    {
      id: "2",
      name: "Sarah Johnson",
      email: "sarah.johnson@email.com",
      phone: "+1-555-0124",
      position: "Marketing Manager",
      stage: "phone-interview",
      expectedSalary: 90000,
      currentLocation: "New York, NY",
      daysInStage: 1,
      nextAction: "Conduct phone screening",
      recruiterNotes: "Excellent marketing background",
      appliedDate: "2024-01-14",
      lastUpdated: "2024-01-17",
      recruiterId: "2",
      recruiterName: "Mike Johnson",
      recruiterLoginName: "mjohnson",
      priority: "medium",
      aiScore: 7.2,
      aiVerdict: "maybe",
      profileStrength: "moderate",
      skills: ["Digital Marketing", "SEO", "Analytics", "Content Strategy"],
      experience: 4,
      customer: "Marketing Solutions LLC",
      jobPosting: "Digital Marketing Manager",
    },
    {
      id: "3",
      name: "Mike Chen",
      email: "mike.chen@email.com",
      phone: "+1-555-0125",
      position: "Data Analyst",
      stage: "screening",
      expectedSalary: 75000,
      currentLocation: "Austin, TX",
      daysInStage: 2,
      nextAction: "Review portfolio",
      recruiterNotes: "Strong analytical skills",
      appliedDate: "2024-01-13",
      lastUpdated: "2024-01-16",
      recruiterId: "3",
      recruiterName: "Emily Chen",
      recruiterLoginName: "echen",
      priority: "low",
      aiScore: 6.8,
      aiVerdict: "maybe",
      profileStrength: "moderate",
      skills: ["Python", "SQL", "Tableau", "Statistics"],
      experience: 3,
      customer: "DataTech Corp",
      jobPosting: "Junior Data Analyst",
    },
    {
      id: "4",
      name: "Emily Davis",
      email: "emily.davis@email.com",
      phone: "+1-555-0126",
      position: "Senior Software Engineer",
      stage: "offer-sent",
      expectedSalary: 130000,
      currentLocation: "Seattle, WA",
      daysInStage: 1,
      nextAction: "Awaiting offer response",
      recruiterNotes: "Top candidate, competitive offer made",
      appliedDate: "2024-01-12",
      lastUpdated: "2024-01-15",
      recruiterId: "4",
      recruiterName: "David Brown",
      recruiterLoginName: "dbrown",
      priority: "urgent",
      aiScore: 9.1,
      aiVerdict: "recommended",
      profileStrength: "strong",
      skills: ["Java", "Spring", "Microservices", "Docker"],
      experience: 7,
      customer: "Enterprise Solutions",
      jobPosting: "Senior Backend Engineer",
    },
    {
      id: "5",
      name: "David Wilson",
      email: "david.wilson@email.com",
      phone: "+1-555-0127",
      position: "Marketing Manager",
      stage: "final-interview",
      expectedSalary: 85000,
      currentLocation: "Chicago, IL",
      daysInStage: 2,
      nextAction: "Final interview with CEO",
      recruiterNotes: "Great presentation skills",
      appliedDate: "2024-01-11",
      lastUpdated: "2024-01-14",
      recruiterId: "1",
      recruiterName: "Sarah Wilson",
      recruiterLoginName: "swilson",
      priority: "high",
      aiScore: 7.8,
      aiVerdict: "recommended",
      profileStrength: "strong",
      skills: ["Brand Management", "Campaign Strategy", "Social Media"],
      experience: 6,
      customer: "Brand Agency",
      jobPosting: "Senior Marketing Manager",
    },
    {
      id: "6",
      name: "Lisa Brown",
      email: "lisa.brown@email.com",
      phone: "+1-555-0128",
      position: "Data Analyst",
      stage: "hired",
      expectedSalary: 70000,
      currentLocation: "Denver, CO",
      daysInStage: 0,
      nextAction: "Onboarding scheduled",
      recruiterNotes: "Successfully hired, start date confirmed",
      appliedDate: "2024-01-10",
      lastUpdated: "2024-01-13",
      recruiterId: "2",
      recruiterName: "Mike Johnson",
      recruiterLoginName: "mjohnson",
      priority: "medium",
      aiScore: 7.5,
      aiVerdict: "recommended",
      profileStrength: "strong",
      skills: ["R", "Machine Learning", "Data Visualization"],
      experience: 4,
      customer: "Analytics Pro",
      jobPosting: "Data Scientist",
    },
  ])

  const getStageInfo = (stage: string) => {
    return stages.find((s) => s.key === stage) || stages[0]
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "border-l-red-500"
      case "high":
        return "border-l-orange-500"
      case "medium":
        return "border-l-yellow-500"
      case "low":
        return "border-l-gray-400"
      default:
        return "border-l-gray-300"
    }
  }

  const getAiVerdictIcon = (verdict: string) => {
    switch (verdict) {
      case "recommended":
        return <CheckCircle className="w-3 h-3 text-green-600" />
      case "maybe":
        return <AlertCircle className="w-3 h-3 text-yellow-600" />
      case "not-recommended":
        return <XCircle className="w-3 h-3 text-red-600" />
      default:
        return null
    }
  }

  const filteredCandidates = useMemo(() => {
    return candidates.filter((candidate) => {
      const matchesSearch =
        searchQuery === "" ||
        candidate.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        candidate.skills.some((skill) => skill.toLowerCase().includes(searchQuery.toLowerCase())) ||
        candidate.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
        candidate.currentLocation.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesJob = selectedJob === "all" || candidate.position === selectedJob
      const matchesDate = dateFilter === "all" || isDateInRange(candidate.appliedDate, dateFilter)
      const matchesRecruiter = recruiterFilter === "all" || candidate.recruiterId === recruiterFilter
      const matchesCustomer = customerFilter === "all" || candidate.customer === customerFilter
      const matchesAiVerdict = aiVerdictFilter === "all" || candidate.aiVerdict === aiVerdictFilter
      const matchesPriority = priorityFilter === "all" || candidate.priority === priorityFilter
      const matchesProfileStrength =
        profileStrengthFilter === "all" || candidate.profileStrength === profileStrengthFilter

      return (
        matchesSearch &&
        matchesJob &&
        matchesDate &&
        matchesRecruiter &&
        matchesCustomer &&
        matchesAiVerdict &&
        matchesPriority &&
        matchesProfileStrength
      )
    })
  }, [
    candidates,
    searchQuery,
    selectedJob,
    dateFilter,
    recruiterFilter,
    customerFilter,
    aiVerdictFilter,
    priorityFilter,
    profileStrengthFilter,
  ])

  const getCandidatesByStage = (stage: string) => {
    return filteredCandidates.filter((candidate) => candidate.stage === stage)
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  const moveCandidate = (candidateId: string, newStage: string) => {
    console.log(`Moving candidate ${candidateId} to ${newStage}`)
  }

  const handleStatusChange = (candidateId: string, newStatus: string) => {
    console.log(`Changing candidate ${candidateId} status to ${newStatus}`)
  }

  const handleScheduleInterview = (candidateId: string) => {
    setSelectedCandidateForScheduling(candidateId)
    setIsSchedulerOpen(true)
  }

  // Analytics calculations
  const analytics = useMemo(() => {
    const total = filteredCandidates.length
    const hired = filteredCandidates.filter((c) => c.stage === "hired").length
    const activeOffers = filteredCandidates.filter((c) =>
      ["offer-sent", "offer-negotiation", "offer-accepted"].includes(c.stage),
    ).length
    const interviews = filteredCandidates.filter((c) => c.stage.includes("interview")).length
    const newApplications = filteredCandidates.filter((c) => c.stage === "new-application").length
    const avgAiScore = filteredCandidates.reduce((sum, c) => sum + c.aiScore, 0) / total || 0
    const recommended = filteredCandidates.filter((c) => c.aiVerdict === "recommended").length
    const closed = filteredCandidates.filter((c) =>
      ["hired", "rejected", "withdrawn", "offer-declined"].includes(c.stage),
    ).length

    return { total, hired, activeOffers, interviews, newApplications, avgAiScore, recommended, closed }
  }, [filteredCandidates])

  const visibleStages = stages.slice(0, columnCount)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Enhanced Hiring Pipeline</h2>
          <p className="text-gray-600">AI-powered candidate tracking with drag-and-drop and interview scheduling</p>
        </div>
        <div className="flex gap-2">
          <Select value={columnCount.toString()} onValueChange={(value) => setColumnCount(Number.parseInt(value))}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">3 Columns</SelectItem>
              <SelectItem value="4">4 Columns</SelectItem>
              <SelectItem value="5">5 Columns</SelectItem>
              <SelectItem value="6">6 Columns</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant={viewMode === "compact" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode(viewMode === "compact" ? "detailed" : "compact")}
          >
            {viewMode === "compact" ? "Compact" : "Detailed"}
          </Button>
        </div>
      </div>

      {/* Analytics Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-blue-600" />
            <div>
              <p className="text-2xl font-bold text-blue-600">{analytics.total}</p>
              <p className="text-xs text-gray-600">Total Candidates</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center space-x-2">
            <UserCheck className="w-4 h-4 text-green-600" />
            <div>
              <p className="text-2xl font-bold text-green-600">{analytics.hired}</p>
              <p className="text-xs text-gray-600">Hired</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center space-x-2">
            <Briefcase className="w-4 h-4 text-emerald-600" />
            <div>
              <p className="text-2xl font-bold text-emerald-600">{analytics.activeOffers}</p>
              <p className="text-xs text-gray-600">Active Offers</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center space-x-2">
            <MessageSquare className="w-4 h-4 text-purple-600" />
            <div>
              <p className="text-2xl font-bold text-purple-600">{analytics.interviews}</p>
              <p className="text-xs text-gray-600">Interviews</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center space-x-2">
            <Star className="w-4 h-4 text-blue-600" />
            <div>
              <p className="text-2xl font-bold text-blue-600">{analytics.newApplications}</p>
              <p className="text-xs text-gray-600">New Applications</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center space-x-2">
            <Brain className="w-4 h-4 text-indigo-600" />
            <div>
              <p className="text-2xl font-bold text-indigo-600">{analytics.avgAiScore.toFixed(1)}</p>
              <p className="text-xs text-gray-600">Avg AI Score</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center space-x-2">
            <Award className="w-4 h-4 text-green-600" />
            <div>
              <p className="text-2xl font-bold text-green-600">{analytics.recommended}</p>
              <p className="text-xs text-gray-600">AI Recommended</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center space-x-2">
            <Target className="w-4 h-4 text-gray-600" />
            <div>
              <p className="text-2xl font-bold text-gray-600">{analytics.closed}</p>
              <p className="text-xs text-gray-600">Closed Cases</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="AI Search: Try 'React developers with high scores' or 'recommended candidates in SF'"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Select value={selectedJob} onValueChange={setSelectedJob}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by position" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Positions</SelectItem>
              <SelectItem value="Senior Software Engineer">Senior Software Engineer</SelectItem>
              <SelectItem value="Marketing Manager">Marketing Manager</SelectItem>
              <SelectItem value="Data Analyst">Data Analyst</SelectItem>
            </SelectContent>
          </Select>

          <Select value={customerFilter} onValueChange={setCustomerFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Customer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Customers</SelectItem>
              <SelectItem value="TechCorp Inc">TechCorp Inc</SelectItem>
              <SelectItem value="Marketing Solutions LLC">Marketing Solutions LLC</SelectItem>
              <SelectItem value="DataTech Corp">DataTech Corp</SelectItem>
              <SelectItem value="Enterprise Solutions">Enterprise Solutions</SelectItem>
            </SelectContent>
          </Select>

          <Select value={aiVerdictFilter} onValueChange={setAiVerdictFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="AI Verdict" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Verdicts</SelectItem>
              <SelectItem value="recommended">Recommended</SelectItem>
              <SelectItem value="maybe">Maybe</SelectItem>
              <SelectItem value="not-recommended">Not Recommended</SelectItem>
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>

          <Select value={profileStrengthFilter} onValueChange={setProfileStrengthFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Profile Strength" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Strengths</SelectItem>
              <SelectItem value="strong">Strong</SelectItem>
              <SelectItem value="moderate">Moderate</SelectItem>
              <SelectItem value="weak">Weak</SelectItem>
            </SelectContent>
          </Select>

          <DateFilter value={dateFilter} onValueChange={setDateFilter} />
          <RecruiterFilter value={recruiterFilter} onValueChange={setRecruiterFilter} recruiters={recruiters} />
        </div>
      </div>

      {/* AI Interview Scheduler Dialog */}
      <Dialog open={isSchedulerOpen} onOpenChange={setIsSchedulerOpen}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Brain className="w-5 h-5 text-purple-600" />
              <span>AI Interview Scheduler</span>
            </DialogTitle>
            <DialogDescription>
              Intelligent scheduling for{" "}
              {selectedCandidateForScheduling && candidates.find((c) => c.id === selectedCandidateForScheduling)?.name}
            </DialogDescription>
          </DialogHeader>
          <AIInterviewScheduler />
        </DialogContent>
      </Dialog>

      {/* Pipeline Columns with Drag and Drop */}
      <div className={`grid grid-cols-1 lg:grid-cols-${columnCount} gap-6 overflow-x-auto`}>
        {visibleStages.map((stage) => {
          const stageCandidates = getCandidatesByStage(stage.key)
          return (
            <div key={stage.key} className="min-w-[300px]">
              <div className="mb-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
                    <span>{stage.label}</span>
                    <Badge variant="secondary" className="text-xs">
                      {stageCandidates.length}
                    </Badge>
                  </h3>
                  <div className="text-xs text-gray-500">
                    {stageCandidates
                      .reduce((sum, c) => sum + c.expectedSalary, 0)
                      .toLocaleString("en-IN", {
                        style: "currency",
                        currency: "INR",
                        minimumFractionDigits: 0,
                      })}
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
                  <div
                    className="bg-blue-600 h-1 rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min((stageCandidates.length / Math.max(filteredCandidates.length, 1)) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>

              <div className="space-y-3 min-h-[200px] bg-gray-50 rounded-lg p-3">
                {stageCandidates.map((candidate) => {
                  const stageInfo = getStageInfo(candidate.stage)
                  return (
                    <Card
                      key={candidate.id}
                      className={`p-4 hover:shadow-lg transition-all duration-200 cursor-pointer border-l-4 ${getPriorityColor(candidate.priority)} bg-white`}
                    >
                      <div className="space-y-3">
                        {/* Header */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-2">
                            <Avatar className="w-8 h-8">
                              <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                                {getInitials(candidate.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h4 className="font-medium text-gray-900 text-sm">{candidate.name}</h4>
                              <p className="text-xs text-gray-600">{candidate.position}</p>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                <MoreHorizontal className="w-3 h-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem onClick={() => console.log("View profile")}>
                                <Eye className="w-4 h-4 mr-2" />
                                View Profile
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => console.log("Edit candidate")}>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit Details
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleScheduleInterview(candidate.id)}>
                                <Brain className="w-4 h-4 mr-2 text-purple-600" />
                                AI Schedule Interview
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => console.log("Send email")}>
                                <Mail className="w-4 h-4 mr-2" />
                                Send Email
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => console.log("Call candidate")}>
                                <Phone className="w-4 h-4 mr-2" />
                                Call Candidate
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => console.log("Delete candidate")}
                                className="text-red-600"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Remove
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {/* AI Insights */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {getAiVerdictIcon(candidate.aiVerdict)}
                            <span className="text-xs font-medium">AI Score: {candidate.aiScore}/10</span>
                          </div>
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              candidate.profileStrength === "strong"
                                ? "border-green-300 text-green-700"
                                : candidate.profileStrength === "moderate"
                                  ? "border-yellow-300 text-yellow-700"
                                  : "border-red-300 text-red-700"
                            }`}
                          >
                            {candidate.profileStrength}
                          </Badge>
                        </div>

                        {/* Details */}
                        {viewMode === "detailed" && (
                          <div className="space-y-2 text-xs text-gray-600">
                            <div className="flex items-center space-x-1">
                              <MapPin className="w-3 h-3" />
                              <span>{candidate.currentLocation}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <span>
                                {candidate.expectedSalary.toLocaleString("en-IN", {
                                  style: "currency",
                                  currency: "INR",
                                  minimumFractionDigits: 0,
                                })}
                              </span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span>{candidate.daysInStage} days in stage</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <User className="w-3 h-3" />
                              <span>{candidate.recruiterName}</span>
                            </div>
                          </div>
                        )}

                        {/* Skills */}
                        {viewMode === "detailed" && (
                          <div className="flex flex-wrap gap-1">
                            {candidate.skills.slice(0, 3).map((skill) => (
                              <Badge key={skill} variant="secondary" className="text-xs px-2 py-0">
                                {skill}
                              </Badge>
                            ))}
                            {candidate.skills.length > 3 && (
                              <Badge variant="secondary" className="text-xs px-2 py-0">
                                +{candidate.skills.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}

                        {/* Status Badge */}
                        <div className="flex items-center justify-between">
                          <Badge className={`text-xs ${stageInfo.color}`}>{stageInfo.label}</Badge>
                          <div className="flex items-center space-x-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 px-2 text-xs"
                              onClick={() => handleScheduleInterview(candidate.id)}
                            >
                              <Brain className="w-3 h-3 mr-1 text-purple-600" />
                              Schedule
                            </Button>
                          </div>
                        </div>

                        {/* Next Action */}
                        {viewMode === "detailed" && (
                          <div className="pt-2 border-t border-gray-100">
                            <p className="text-xs text-gray-700 font-medium">Next: {candidate.nextAction}</p>
                          </div>
                        )}
                      </div>
                    </Card>
                  )
                })}

                {stageCandidates.length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No candidates in this stage</p>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Interview Integration Component */}
      <InterviewIntegration candidates={filteredCandidates} onScheduleInterview={handleScheduleInterview} />
    </div>
  )
}
