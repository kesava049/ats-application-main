"use client"

import type React from "react"
import { useState, useCallback, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Badge } from "../../components/ui/badge"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { Avatar, AvatarFallback } from "../../components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu"
import {
  Clock,
  IndianRupee,
  MapPin,
  Mail,
  Calendar,
  User,
  Building2,
  GripVertical,
  Search,
  X,
  Star,
  Phone,
  Globe,
  Award,
  Target,
  TrendingUp,
  ChevronDown,
  Sparkles,
  MoreVertical,
  MessageCircle,
  Eye,
  Edit,
  CheckCircle2,
  Brain,
  Users,
  Briefcase,
  RefreshCw,
} from "lucide-react"
import { formatDate, isDateInRange } from "../../lib/date-utils"
import { DateFilter } from "../../components/date-filter"

// Enhanced pipeline statuses with better visual design and workflow logic
const PIPELINE_STATUSES = [
  {
    key: "new",
    label: "New Application",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    bgColor: "bg-blue-50",
    icon: "📝",
    description: "Recently submitted applications",
    category: "screening",
  },
  {
    key: "screening",
    label: "Initial Screening",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    bgColor: "bg-yellow-50",
    icon: "🔍",
    description: "Resume and profile review",
    category: "screening",
  },
  {
    key: "phone-screen",
    label: "Phone Screening",
    color: "bg-orange-100 text-orange-800 border-orange-200",
    bgColor: "bg-orange-50",
    icon: "📞",
    description: "Initial phone conversation",
    category: "screening",
  },
  {
    key: "assessment",
    label: "Skills Assessment",
    color: "bg-purple-100 text-purple-800 border-purple-200",
    bgColor: "bg-purple-50",
    icon: "📊",
    description: "Technical or skills evaluation",
    category: "assessment",
  },
  {
    key: "interview-1",
    label: "First Interview",
    color: "bg-indigo-100 text-indigo-800 border-indigo-200",
    bgColor: "bg-indigo-50",
    icon: "👥",
    description: "Initial interview round",
    category: "interview",
  },
  {
    key: "interview-2",
    label: "Second Interview",
    color: "bg-violet-100 text-violet-800 border-violet-200",
    bgColor: "bg-violet-50",
    icon: "🎯",
    description: "Follow-up interview",
    category: "interview",
  },
  {
    key: "final-interview",
    label: "Final Interview",
    color: "bg-pink-100 text-pink-800 border-pink-200",
    bgColor: "bg-pink-50",
    icon: "⭐",
    description: "Final decision interview",
    category: "interview",
  },
  {
    key: "reference-check",
    label: "Reference Check",
    color: "bg-cyan-100 text-cyan-800 border-cyan-200",
    bgColor: "bg-cyan-50",
    icon: "✅",
    description: "Verifying references",
    category: "verification",
  },
  {
    key: "offer-preparation",
    label: "Offer Preparation",
    color: "bg-emerald-100 text-emerald-800 border-emerald-200",
    bgColor: "bg-emerald-50",
    icon: "📋",
    description: "Preparing job offer",
    category: "offer",
  },
  {
    key: "offer-sent",
    label: "Offer Sent",
    color: "bg-green-100 text-green-800 border-green-200",
    bgColor: "bg-green-50",
    icon: "📤",
    description: "Offer sent to candidate",
    category: "offer",
  },
  {
    key: "offer-negotiation",
    label: "Offer Negotiation",
    color: "bg-lime-100 text-lime-800 border-lime-200",
    bgColor: "bg-lime-50",
    icon: "🤝",
    description: "Negotiating offer terms",
    category: "offer",
  },
  {
    key: "offer-accepted",
    label: "Offer Accepted",
    color: "bg-teal-100 text-teal-800 border-teal-200",
    bgColor: "bg-teal-50",
    icon: "🎉",
    description: "Candidate accepted offer",
    category: "closing",
  },
  {
    key: "background-check",
    label: "Background Check",
    color: "bg-sky-100 text-sky-800 border-sky-200",
    bgColor: "bg-sky-50",
    icon: "🔒",
    description: "Conducting background verification",
    category: "verification",
  },
  {
    key: "hired",
    label: "Hired",
    color: "bg-green-200 text-green-900 border-green-300",
    bgColor: "bg-green-100",
    icon: "🏆",
    description: "Successfully hired",
    category: "closed",
  },
  {
    key: "rejected",
    label: "Rejected",
    color: "bg-red-100 text-red-800 border-red-200",
    bgColor: "bg-red-50",
    icon: "❌",
    description: "Application rejected",
    category: "closed",
  },
  {
    key: "withdrawn",
    label: "Withdrawn",
    color: "bg-gray-100 text-gray-800 border-gray-200",
    bgColor: "bg-gray-50",
    icon: "↩️",
    description: "Candidate withdrew",
    category: "closed",
  },
  {
    key: "on-hold",
    label: "On Hold",
    color: "bg-amber-100 text-amber-800 border-amber-200",
    bgColor: "bg-amber-50",
    icon: "⏸️",
    description: "Process temporarily paused",
    category: "paused",
  },
]

interface PipelineCandidate {
  id: string
  name: string
  email: string
  phone: string
  jobId: string
  jobTitle: string
  customerId: string
  customerName: string
  internalSPOC: string
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
  source: string
  priority: "urgent" | "high" | "medium" | "low"
  comments: string
  skills: string[]
  experience: string
  rating: number
  interviewCount: number
  lastActivity: string
  aiScore?: number
  aiVerdict?: "highly_recommended" | "recommended" | "consider" | "not_recommended"
  profileStrength: number
  responseRate: number
  engagementScore: number
}

interface SearchFilters {
  searchTerm: string
  customer: string
  job: string
  recruiter: string
  priority: string
  source: string
  skills: string
  experience: string
  dateRange: string
  stage: string
  rating: string
  aiVerdict: string
  profileStrength: string
}

export default function PipelineView() {
  const [draggedCandidate, setDraggedCandidate] = useState<PipelineCandidate | null>(null)
  const [dragOverStage, setDragOverStage] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState("stage")
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isAiSearchActive, setIsAiSearchActive] = useState(false)
  const [aiSearchQuery, setAiSearchQuery] = useState("")
  const [selectedColumns, setSelectedColumns] = useState(4)
  const [compactView, setCompactView] = useState(false)

  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    searchTerm: "",
    customer: "all",
    job: "all",
    recruiter: "all",
    priority: "all",
    source: "all",
    skills: "",
    experience: "all",
    dateRange: "all",
    stage: "all",
    rating: "all",
    aiVerdict: "all",
    profileStrength: "all",
  })

  // Mock data with enhanced fields including AI scores
  const customers = [
    { id: "1", name: "TechCorp Inc.", spoc: "Sarah Wilson", industry: "Technology", size: "Large" },
    { id: "2", name: "StartupXYZ", spoc: "Mike Johnson", industry: "Fintech", size: "Startup" },
    { id: "3", name: "DataFlow Solutions", spoc: "Emily Chen", industry: "Analytics", size: "Medium" },
    { id: "4", name: "Global Enterprises", spoc: "David Brown", industry: "Consulting", size: "Enterprise" },
    { id: "5", name: "InnovateNow", spoc: "Lisa Parker", industry: "SaaS", size: "Medium" },
  ]

  const jobPostings = [
    {
      id: "1",
      title: "Senior Software Engineer",
      customerId: "1",
      customerName: "TechCorp Inc.",
      department: "Engineering",
      type: "Full-time",
      urgency: "high",
    },
    {
      id: "2",
      title: "Marketing Manager",
      customerId: "2",
      customerName: "StartupXYZ",
      department: "Marketing",
      type: "Full-time",
      urgency: "medium",
    },
    {
      id: "3",
      title: "Data Analyst",
      customerId: "3",
      customerName: "DataFlow Solutions",
      department: "Analytics",
      type: "Contract",
      urgency: "low",
    },
    {
      id: "4",
      title: "Product Manager",
      customerId: "4",
      customerName: "Global Enterprises",
      department: "Product",
      type: "Full-time",
      urgency: "urgent",
    },
    {
      id: "5",
      title: "DevOps Engineer",
      customerId: "1",
      customerName: "TechCorp Inc.",
      department: "Engineering",
      type: "Full-time",
      urgency: "high",
    },
    {
      id: "6",
      title: "UX Designer",
      customerId: "5",
      customerName: "InnovateNow",
      department: "Design",
      type: "Full-time",
      urgency: "medium",
    },
  ]

  const recruiters = [
    { id: "1", name: "Sarah Wilson", email: "sarah@company.com", specialization: "Tech" },
    { id: "2", name: "Mike Johnson", email: "mike@company.com", specialization: "Marketing" },
    { id: "3", name: "Emily Chen", email: "emily@company.com", specialization: "Analytics" },
    { id: "4", name: "David Brown", email: "david@company.com", specialization: "Product" },
    { id: "5", name: "Lisa Parker", email: "lisa@company.com", specialization: "Design" },
  ]

  // Enhanced mock candidates with more data
  const [candidates, setCandidates] = useState<PipelineCandidate[]>([
    // TechCorp Inc. - Senior Software Engineer candidates
    {
      id: "1",
      name: "John Smith",
      email: "john.smith@email.com",
      phone: "+1-555-0123",
      jobId: "1",
      jobTitle: "Senior Software Engineer",
      customerId: "1",
      customerName: "TechCorp Inc.",
      internalSPOC: "Sarah Wilson",
      stage: "interview-1",
      expectedSalary: 120000,
      currentLocation: "San Francisco, CA",
      daysInStage: 3,
      nextAction: "Schedule second interview",
      recruiterNotes: "Strong technical skills, good cultural fit",
      appliedDate: "2024-01-15",
      lastUpdated: "2024-01-18",
      recruiterId: "1",
      recruiterName: "Sarah Wilson",
      source: "linkedin",
      priority: "high",
      comments: "Excellent problem-solving skills demonstrated in technical round.",
      skills: ["React", "Node.js", "TypeScript", "AWS"],
      experience: "senior",
      rating: 4.5,
      interviewCount: 2,
      lastActivity: "2024-01-18T10:30:00Z",
      aiScore: 87,
      aiVerdict: "recommended",
      profileStrength: 85,
      responseRate: 92,
      engagementScore: 88,
    },
    {
      id: "2",
      name: "Emily Davis",
      email: "emily.davis@email.com",
      phone: "+1-555-0126",
      jobId: "1",
      jobTitle: "Senior Software Engineer",
      customerId: "1",
      customerName: "TechCorp Inc.",
      internalSPOC: "Sarah Wilson",
      stage: "offer-sent",
      expectedSalary: 130000,
      currentLocation: "Seattle, WA",
      daysInStage: 1,
      nextAction: "Awaiting offer response",
      recruiterNotes: "Top candidate, competitive offer made",
      appliedDate: "2024-01-12",
      lastUpdated: "2024-01-15",
      recruiterId: "1",
      recruiterName: "Sarah Wilson",
      source: "recruiter",
      priority: "urgent",
      comments: "Exceptional candidate. Offer includes signing bonus and equity.",
      skills: ["React", "Python", "Docker", "Kubernetes"],
      experience: "senior",
      rating: 4.8,
      interviewCount: 3,
      lastActivity: "2024-01-15T16:20:00Z",
      aiScore: 94,
      aiVerdict: "highly_recommended",
      profileStrength: 96,
      responseRate: 98,
      engagementScore: 95,
    },
    // Add more candidates for different stages and jobs
    {
      id: "3",
      name: "Michael Chen",
      email: "michael.chen@email.com",
      phone: "+1-555-0127",
      jobId: "1",
      jobTitle: "Senior Software Engineer",
      customerId: "1",
      customerName: "TechCorp Inc.",
      internalSPOC: "Sarah Wilson",
      stage: "new",
      expectedSalary: 115000,
      currentLocation: "Austin, TX",
      daysInStage: 1,
      nextAction: "Initial screening",
      recruiterNotes: "Strong resume, needs review",
      appliedDate: "2024-01-19",
      lastUpdated: "2024-01-19",
      recruiterId: "1",
      recruiterName: "Sarah Wilson",
      source: "website",
      priority: "medium",
      comments: "Good technical background, worth exploring further.",
      skills: ["JavaScript", "React", "Node.js", "MongoDB"],
      experience: "senior",
      rating: 4.2,
      interviewCount: 0,
      lastActivity: "2024-01-19T09:15:00Z",
      aiScore: 76,
      aiVerdict: "consider",
      profileStrength: 78,
      responseRate: 85,
      engagementScore: 72,
    },
    // More candidates for different jobs and stages...
    {
      id: "4",
      name: "Sarah Johnson",
      email: "sarah.johnson@email.com",
      phone: "+1-555-0124",
      jobId: "2",
      jobTitle: "Marketing Manager",
      customerId: "2",
      customerName: "StartupXYZ",
      internalSPOC: "Mike Johnson",
      stage: "phone-screen",
      expectedSalary: 90000,
      currentLocation: "New York, NY",
      daysInStage: 1,
      nextAction: "Conduct phone screening",
      recruiterNotes: "Excellent marketing background",
      appliedDate: "2024-01-14",
      lastUpdated: "2024-01-17",
      recruiterId: "2",
      recruiterName: "Mike Johnson",
      source: "website",
      priority: "medium",
      comments: "Strong portfolio with proven ROI on digital campaigns.",
      skills: ["Digital Marketing", "SEO", "Analytics", "Content Strategy"],
      experience: "mid",
      rating: 4.2,
      interviewCount: 1,
      lastActivity: "2024-01-17T14:15:00Z",
      aiScore: 82,
      aiVerdict: "recommended",
      profileStrength: 88,
      responseRate: 90,
      engagementScore: 85,
    },
    // Add 20+ more candidates across different stages
    ...Array.from({ length: 25 }, (_, i) => ({
      id: `candidate-${i + 5}`,
      name: `Candidate ${i + 5}`,
      email: `candidate${i + 5}@email.com`,
      phone: `+1-555-${String(i + 5).padStart(4, "0")}`,
      jobId: ["1", "2", "3", "4", "5", "6"][i % 6],
      jobTitle: jobPostings[i % 6].title,
      customerId: jobPostings[i % 6].customerId,
      customerName: jobPostings[i % 6].customerName,
      internalSPOC: customers.find((c) => c.id === jobPostings[i % 6].customerId)?.spoc || "Unknown",
      stage: PIPELINE_STATUSES[i % PIPELINE_STATUSES.length].key,
      expectedSalary: 60000 + i * 3000,
      currentLocation: ["San Francisco, CA", "New York, NY", "Austin, TX", "Seattle, WA", "Chicago, IL"][i % 5],
      daysInStage: Math.floor(Math.sin(i + 1000) * 10000) % 14 + 1,
      nextAction: "Follow up required",
      recruiterNotes: `Notes for candidate ${i + 5}`,
      appliedDate: `2024-01-${String((Math.floor(Math.sin(i + 2000) * 10000) % 20) + 1).padStart(2, "0")}`,
      lastUpdated: `2024-01-${String((Math.floor(Math.sin(i + 3000) * 10000) % 20) + 1).padStart(2, "0")}`,
      recruiterId: String((i % 5) + 1),
      recruiterName: recruiters[i % 5].name,
      source: ["linkedin", "website", "referral", "recruiter"][i % 4],
      priority: ["urgent", "high", "medium", "low"][i % 4] as any,
      comments: `Candidate ${i + 5} has strong potential.`,
      skills: [
        ["React", "JavaScript", "CSS"],
        ["Python", "Django", "PostgreSQL"],
        ["Java", "Spring", "MySQL"],
        ["Marketing", "SEO", "Analytics"],
        ["Design", "Figma", "Photoshop"],
      ][i % 5],
      experience: ["entry", "mid", "senior"][i % 3],
      rating: 3.0 + (Math.floor(Math.sin(i + 4000) * 10000) % 200) / 100,
      interviewCount: Math.floor(Math.sin(i + 5000) * 10000) % 4,
      lastActivity: `2024-01-${String((Math.floor(Math.sin(i + 6000) * 10000) % 20) + 1).padStart(2, "0")}T10:00:00Z`,
      aiScore: 60 + Math.floor(Math.sin(i + 7000) * 10000) % 40,
      aiVerdict: ["highly_recommended", "recommended", "consider", "not_recommended"][i % 4] as any,
      profileStrength: 60 + Math.floor(Math.sin(i + 8000) * 10000) % 40,
      responseRate: 70 + Math.floor(Math.sin(i + 9000) * 10000) % 30,
      engagementScore: 65 + Math.floor(Math.sin(i + 10000) * 10000) % 35,
    })),
  ])

  // Enhanced filtering logic with AI search
  const getFilteredCandidates = useMemo(() => {
    const filtered = candidates.filter((candidate) => {
      // AI Search with natural language processing simulation
      if (isAiSearchActive && aiSearchQuery) {
        const query = aiSearchQuery.toLowerCase()
        const aiSearchMatch =
          // Skill-based search
          (query.includes("skill") &&
            candidate.skills.some((skill) => skill.toLowerCase().includes(query.replace(/skill[s]?/g, "").trim()))) ||
          // Experience-based search
          (query.includes("experience") && candidate.experience.includes(query.replace(/experience/g, "").trim())) ||
          // AI score-based search
          (query.includes("high score") && candidate.aiScore && candidate.aiScore > 85) ||
          (query.includes("recommended") && candidate.aiVerdict?.includes("recommended")) ||
          // Location-based search
          (query.includes("location") &&
            candidate.currentLocation.toLowerCase().includes(query.replace(/location/g, "").trim())) ||
          // General search across all fields
          candidate.name
            .toLowerCase()
            .includes(query) ||
          candidate.jobTitle.toLowerCase().includes(query) ||
          candidate.customerName.toLowerCase().includes(query) ||
          candidate.skills.some((skill) => skill.toLowerCase().includes(query))

        if (!aiSearchMatch) return false
      }

      // Regular search term filter
      if (searchFilters.searchTerm) {
        const searchTerm = searchFilters.searchTerm.toLowerCase()
        const matchesSearch =
          candidate.name.toLowerCase().includes(searchTerm) ||
          candidate.email.toLowerCase().includes(searchTerm) ||
          candidate.jobTitle.toLowerCase().includes(searchTerm) ||
          candidate.customerName.toLowerCase().includes(searchTerm) ||
          candidate.skills.some((skill) => skill.toLowerCase().includes(searchTerm)) ||
          candidate.currentLocation.toLowerCase().includes(searchTerm) ||
          candidate.recruiterName.toLowerCase().includes(searchTerm)

        if (!matchesSearch) return false
      }

      // Other filters
      if (searchFilters.customer !== "all" && candidate.customerId !== searchFilters.customer) return false
      if (searchFilters.job !== "all" && candidate.jobId !== searchFilters.job) return false
      if (searchFilters.recruiter !== "all" && candidate.recruiterId !== searchFilters.recruiter) return false
      if (searchFilters.priority !== "all" && candidate.priority !== searchFilters.priority) return false
      if (searchFilters.source !== "all" && candidate.source !== searchFilters.source) return false
      if (searchFilters.experience !== "all" && candidate.experience !== searchFilters.experience) return false
      if (searchFilters.stage !== "all" && candidate.stage !== searchFilters.stage) return false

      // AI Verdict filter
      if (searchFilters.aiVerdict !== "all" && candidate.aiVerdict !== searchFilters.aiVerdict) return false

      // Profile Strength filter
      if (searchFilters.profileStrength !== "all") {
        const minStrength = Number.parseFloat(searchFilters.profileStrength)
        if (candidate.profileStrength < minStrength) return false
      }

      // Skills filter
      if (searchFilters.skills) {
        const skillsToMatch = searchFilters.skills.toLowerCase()
        const hasSkill = candidate.skills.some((skill) => skill.toLowerCase().includes(skillsToMatch))
        if (!hasSkill) return false
      }

      // Rating filter
      if (searchFilters.rating !== "all") {
        const minRating = Number.parseFloat(searchFilters.rating)
        if (candidate.rating < minRating) return false
      }

      // Date range filter
      if (searchFilters.dateRange !== "all" && !isDateInRange(candidate.appliedDate, searchFilters.dateRange)) {
        return false
      }

      return true
    })

    return filtered
  }, [candidates, searchFilters, isAiSearchActive, aiSearchQuery])

  const getCandidatesByStage = (stage: string) => {
    return getFilteredCandidates.filter((candidate) => candidate.stage === stage)
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  const getStageInfo = (stage: string) => {
    return PIPELINE_STATUSES.find((s) => s.key === stage) || PIPELINE_STATUSES[0]
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800 border-red-200"
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "low":
        return "bg-gray-100 text-gray-800 border-gray-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getAiVerdictColor = (verdict?: string) => {
    switch (verdict) {
      case "highly_recommended":
        return "bg-green-100 text-green-800 border-green-200"
      case "recommended":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "consider":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "not_recommended":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getRatingStars = (rating: number) => {
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 !== 0
    const emptyStars = 5 - Math.ceil(rating)

    return (
      <div className="flex items-center space-x-0.5">
        {[...Array(fullStars)].map((_, i) => (
          <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
        ))}
        {hasHalfStar && <Star className="w-3 h-3 fill-yellow-200 text-yellow-400" />}
        {[...Array(emptyStars)].map((_, i) => (
          <Star key={i} className="w-3 h-3 text-gray-300" />
        ))}
        <span className="text-xs text-gray-600 ml-1">{rating.toFixed(1)}</span>
      </div>
    )
  }

  // Enhanced status change handler
  const handleStatusChange = useCallback((candidateId: string, newStatus: string) => {
    setCandidates((prevCandidates) =>
      prevCandidates.map((candidate) =>
        candidate.id === candidateId
          ? {
              ...candidate,
              stage: newStatus,
              lastUpdated: new Date().toISOString().split("T")[0],
              daysInStage: 0,
              lastActivity: new Date().toISOString(),
            }
          : candidate,
      ),
    )
  }, [])

  // Drag and Drop handlers
  const handleDragStart = useCallback((candidate: PipelineCandidate) => {
    setDraggedCandidate(candidate)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent, stage: string) => {
    e.preventDefault()
    setDragOverStage(stage)
  }, [])

  const handleDragLeave = useCallback(() => {
    setDragOverStage(null)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent, newStage: string) => {
      e.preventDefault()
      setDragOverStage(null)

      if (draggedCandidate && draggedCandidate.stage !== newStage) {
        handleStatusChange(draggedCandidate.id, newStage)
      }
      setDraggedCandidate(null)
    },
    [draggedCandidate, handleStatusChange],
  )

  const updateSearchFilter = (key: keyof SearchFilters, value: string) => {
    setSearchFilters((prev) => ({ ...prev, [key]: value }))
  }

  const clearAllFilters = () => {
    setSearchFilters({
      searchTerm: "",
      customer: "all",
      job: "all",
      recruiter: "all",
      priority: "all",
      source: "all",
      skills: "",
      experience: "all",
      dateRange: "all",
      stage: "all",
      rating: "all",
      aiVerdict: "all",
      profileStrength: "all",
    })
    setIsAiSearchActive(false)
    setAiSearchQuery("")
  }

  const getActiveFilterCount = () => {
    let count = 0
    Object.entries(searchFilters).forEach(([key, value]) => {
      if (key === "searchTerm" || key === "skills") {
        if (value) count++
      } else if (value !== "all") {
        count++
      }
    })
    if (isAiSearchActive && aiSearchQuery) count++
    return count
  }

  // Enhanced candidate card with status dropdown
  const renderCandidateCard = (candidate: PipelineCandidate, isCompact = false) => {
    const statusInfo = getStageInfo(candidate.stage)

    return (
      <Card
        key={candidate.id}
        className={`${isCompact ? "p-2" : "p-3"} hover:shadow-lg transition-all cursor-move border-l-4 ${
          candidate.priority === "urgent"
            ? "border-l-red-500 shadow-red-100"
            : candidate.priority === "high"
              ? "border-l-orange-500 shadow-orange-100"
              : candidate.priority === "medium"
                ? "border-l-yellow-500 shadow-yellow-100"
                : "border-l-gray-300"
        } ${draggedCandidate?.id === candidate.id ? "opacity-50 scale-95" : ""}`}
        draggable
        onDragStart={() => handleDragStart(candidate)}
      >
        <div className={`space-y-${isCompact ? "2" : "3"}`}>
          {/* Header with drag handle, priority, and quick actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 flex-1 min-w-0">
              <GripVertical className="w-4 h-4 text-gray-400 hover:text-gray-600 flex-shrink-0" />
              <Avatar className={isCompact ? "w-6 h-6" : "w-8 h-8"}>
                <AvatarFallback className={`${isCompact ? "text-xs" : "text-xs"} bg-blue-100 text-blue-700`}>
                  {getInitials(candidate.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className={`${isCompact ? "text-xs" : "text-sm"} font-medium truncate`}>{candidate.name}</p>
                <p className={`${isCompact ? "text-xs" : "text-xs"} text-gray-500 truncate`}>{candidate.jobTitle}</p>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              {/* Status Change Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {PIPELINE_STATUSES.map((status) => (
                    <DropdownMenuItem
                      key={status.key}
                      onClick={() => handleStatusChange(candidate.id, status.key)}
                      className={candidate.stage === status.key ? "bg-blue-50" : ""}
                    >
                      <span className="mr-2">{status.icon}</span>
                      <span className="flex-1">{status.label}</span>
                      {candidate.stage === status.key && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* More Actions */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <MoreVertical className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Eye className="w-4 h-4 mr-2" />
                    View Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Details
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Send Message
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-red-600">
                    <X className="w-4 h-4 mr-2" />
                    Remove
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Priority and AI Score */}
          <div className="flex items-center justify-between">
            <Badge className={getPriorityColor(candidate.priority)} variant="outline">
              {candidate.priority}
            </Badge>
            {candidate.aiScore && (
              <div className="flex items-center space-x-1">
                <Brain className="w-3 h-3 text-purple-600" />
                <span
                  className={`text-xs font-medium ${candidate.aiScore > 85 ? "text-green-600" : candidate.aiScore > 70 ? "text-blue-600" : "text-yellow-600"}`}
                >
                  {candidate.aiScore}
                </span>
                <Badge className={getAiVerdictColor(candidate.aiVerdict)} variant="outline">
                  {candidate.aiVerdict?.replace("_", " ")}
                </Badge>
              </div>
            )}
          </div>

          {!isCompact && (
            <>
              {/* Company and SPOC */}
              <div className="space-y-1 text-xs text-gray-600">
                <div className="flex items-center space-x-1">
                  <Building2 className="w-3 h-3" />
                  <span className="font-medium">{candidate.customerName}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <User className="w-3 h-3" />
                  <span>SPOC: {candidate.internalSPOC}</span>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-1 text-xs text-gray-600">
                <div className="flex items-center space-x-1">
                  <Mail className="w-3 h-3" />
                  <span className="truncate">{candidate.email}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Phone className="w-3 h-3" />
                  <span>{candidate.phone}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <MapPin className="w-3 h-3" />
                  <span>{candidate.currentLocation}</span>
                </div>
              </div>

              {/* Salary and Experience */}
              <div className="space-y-1 text-xs text-gray-600">
                <div className="flex items-center space-x-1">
                  <span>{candidate.expectedSalary.toLocaleString("en-IN", {
                    style: "currency",
                    currency: "INR",
                    minimumFractionDigits: 0,
                  })}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Award className="w-3 h-3" />
                  <span className="capitalize">{candidate.experience} level</span>
                </div>
              </div>

              {/* Skills */}
              <div className="space-y-1">
                <p className="text-xs text-gray-700 font-medium">Skills:</p>
                <div className="flex flex-wrap gap-1">
                  {candidate.skills.slice(0, 3).map((skill) => (
                    <Badge key={skill} variant="secondary" className="text-xs px-1 py-0">
                      {skill}
                    </Badge>
                  ))}
                  {candidate.skills.length > 3 && (
                    <Badge variant="outline" className="text-xs px-1 py-0">
                      +{candidate.skills.length - 3}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Timeline Information */}
              <div className="space-y-1 text-xs text-gray-600">
                <div className="flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>{candidate.daysInStage} days in stage</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="w-3 h-3" />
                  <span>Applied: {formatDate(candidate.appliedDate)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <TrendingUp className="w-3 h-3" />
                  <span>{candidate.interviewCount} interviews</span>
                </div>
              </div>

              {/* Recruiter Information */}
              <div className="space-y-1 text-xs text-gray-600">
                <div className="flex items-center space-x-1">
                  <User className="w-3 h-3" />
                  <span>Recruiter: {candidate.recruiterName}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Globe className="w-3 h-3" />
                  <span>Source: {candidate.source}</span>
                </div>
              </div>

              {/* Next Action */}
              <div className="pt-2 border-t">
                <p className="text-xs text-gray-700 font-medium">Next Action:</p>
                <p className="text-xs text-gray-600">{candidate.nextAction}</p>
              </div>

              {/* Comments */}
              {candidate.comments && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-gray-700 font-medium">Comments:</p>
                  <p className="text-xs text-gray-600 line-clamp-2">{candidate.comments}</p>
                </div>
              )}
            </>
          )}
        </div>
      </Card>
    )
  }

  const renderStageColumn = (stage: any, stageCandidates: PipelineCandidate[]) => (
    <div
      key={stage.key}
      className={`space-y-3 min-h-[600px] p-4 rounded-lg transition-all duration-200 ${
        dragOverStage === stage.key
          ? "bg-blue-100 border-2 border-blue-300 border-dashed scale-105"
          : `${stage.bgColor} border border-gray-200`
      }`}
      onDragOver={(e) => handleDragOver(e, stage.key)}
      onDragLeave={handleDragLeave}
      onDrop={(e) => handleDrop(e, stage.key)}
    >
      {/* Stage Header */}
      <div className="sticky top-0 bg-white p-3 rounded-lg shadow-sm border">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <span className="text-lg">{stage.icon}</span>
            <div>
              <h4 className="text-sm font-semibold">{stage.label}</h4>
              <p className="text-xs text-gray-500">{stage.description}</p>
            </div>
          </div>
          <Badge variant="outline" className={stage.color}>
            {stageCandidates.length}
          </Badge>
        </div>

        {/* Quick Stats for this stage */}
        {stageCandidates.length > 0 && (
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="text-center p-2 bg-blue-50 rounded">
              <div className="font-semibold text-blue-600">
                {Math.round(stageCandidates.reduce((acc, c) => acc + (c.aiScore || 0), 0) / stageCandidates.length)}
              </div>
              <div className="text-blue-600">Avg AI Score</div>
            </div>
            <div className="text-center p-2 bg-green-50 rounded">
              <div className="font-semibold text-green-600">
                {Math.round(stageCandidates.reduce((acc, c) => acc + c.daysInStage, 0) / stageCandidates.length)}
              </div>
              <div className="text-green-600">Avg Days</div>
            </div>
          </div>
        )}
      </div>

      {/* Candidates List with Scrolling */}
      <CardContent maxHeight="calc(100vh - 400px)" className="p-0">
        <div className="space-y-3">
          {stageCandidates.map((candidate) => renderCandidateCard(candidate, compactView))}
          {stageCandidates.length === 0 && (
            <div className="text-center py-12 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg bg-white/50">
              <div className="space-y-2">
                <div className="text-2xl">{stage.icon}</div>
                <p className="text-sm font-medium">No candidates in this stage</p>
                <p className="text-xs">Drag candidates here to move them</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Advanced Pipeline Management</h2>
          <p className="text-gray-600">AI-powered candidate pipeline with advanced filtering and status management</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            {getFilteredCandidates.length} candidates
          </Badge>
          <Button variant="outline" size="sm" onClick={() => setCompactView(!compactView)} className="relative">
            <Users className="w-4 h-4 mr-2" />
            {compactView ? "Detailed" : "Compact"} View
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsSearchOpen(!isSearchOpen)} className="relative">
            <Search className="w-4 h-4 mr-2" />
            Search & Filter
            {getActiveFilterCount() > 0 && (
              <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs bg-blue-600">
                {getActiveFilterCount()}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {/* Enhanced Search and Filters */}
      {isSearchOpen && (
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Advanced Search & Filters</h3>
              <div className="flex items-center space-x-2">
                <Button
                  variant={isAiSearchActive ? "default" : "outline"}
                  size="sm"
                  onClick={() => setIsAiSearchActive(!isAiSearchActive)}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  AI Search
                </Button>
                <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Clear All
                </Button>
              </div>
            </div>

            {/* AI Search */}
            {isAiSearchActive && (
              <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                <div className="flex items-center space-x-2 mb-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  <h4 className="font-medium text-purple-900">AI-Powered Search</h4>
                </div>
                <Input
                  placeholder="Try: 'Find React developers with high AI scores' or 'Show recommended candidates in San Francisco'"
                  value={aiSearchQuery}
                  onChange={(e) => setAiSearchQuery(e.target.value)}
                  className="border-purple-200 focus:border-purple-400"
                />
                <p className="text-xs text-purple-600 mt-1">
                  Use natural language to search for candidates based on skills, experience, location, AI scores, and
                  more.
                </p>
              </div>
            )}

            {/* Regular Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by name, email, job title, company, skills, location..."
                value={searchFilters.searchTerm}
                onChange={(e) => updateSearchFilter("searchTerm", e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filter Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {/* Customer Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Customer</label>
                <Select value={searchFilters.customer} onValueChange={(value) => updateSearchFilter("customer", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Customers</SelectItem>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Job Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Job Posting</label>
                <Select value={searchFilters.job} onValueChange={(value) => updateSearchFilter("job", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Jobs</SelectItem>
                    {jobPostings.map((job) => (
                      <SelectItem key={job.id} value={job.id}>
                        {job.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Recruiter Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Recruiter</label>
                <Select
                  value={searchFilters.recruiter}
                  onValueChange={(value) => updateSearchFilter("recruiter", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Recruiters</SelectItem>
                    {recruiters.map((recruiter) => (
                      <SelectItem key={recruiter.id} value={recruiter.id}>
                        {recruiter.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* AI Verdict Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">AI Verdict</label>
                <Select
                  value={searchFilters.aiVerdict}
                  onValueChange={(value) => updateSearchFilter("aiVerdict", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Verdicts</SelectItem>
                    <SelectItem value="highly_recommended">Highly Recommended</SelectItem>
                    <SelectItem value="recommended">Recommended</SelectItem>
                    <SelectItem value="consider">Consider</SelectItem>
                    <SelectItem value="not_recommended">Not Recommended</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Priority Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Priority</label>
                <Select value={searchFilters.priority} onValueChange={(value) => updateSearchFilter("priority", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Profile Strength Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Min Profile Strength</label>
                <Select
                  value={searchFilters.profileStrength}
                  onValueChange={(value) => updateSearchFilter("profileStrength", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any Strength</SelectItem>
                    <SelectItem value="90">90%+ Excellent</SelectItem>
                    <SelectItem value="80">80%+ Very Good</SelectItem>
                    <SelectItem value="70">70%+ Good</SelectItem>
                    <SelectItem value="60">60%+ Average</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Skills and Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Skills</label>
                <Input
                  placeholder="Search by specific skills (e.g., React, Python, Marketing)"
                  value={searchFilters.skills}
                  onChange={(e) => updateSearchFilter("skills", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Application Date</label>
                <DateFilter
                  value={searchFilters.dateRange}
                  onValueChange={(value) => updateSearchFilter("dateRange", value)}
                />
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Active Filters Display */}
      {getActiveFilterCount() > 0 && (
        <div className="flex flex-wrap gap-2">
          {searchFilters.searchTerm && (
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              Search: "{searchFilters.searchTerm}"
              <button onClick={() => updateSearchFilter("searchTerm", "")} className="ml-1 hover:text-red-600">
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          {isAiSearchActive && aiSearchQuery && (
            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
              AI: "{aiSearchQuery}"
              <button onClick={() => setAiSearchQuery("")} className="ml-1 hover:text-red-600">
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          {searchFilters.customer !== "all" && (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              Customer: {customers.find((c) => c.id === searchFilters.customer)?.name}
              <button onClick={() => updateSearchFilter("customer", "all")} className="ml-1 hover:text-red-600">
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          {searchFilters.job !== "all" && (
            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
              Job: {jobPostings.find((j) => j.id === searchFilters.job)?.title}
              <button onClick={() => updateSearchFilter("job", "all")} className="ml-1 hover:text-red-600">
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
        </div>
      )}

      {/* Pipeline Controls */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <span className="text-sm font-medium">View Options:</span>
            <div className="flex items-center space-x-2">
              <span className="text-xs">Columns:</span>
              <Select value={selectedColumns.toString()} onValueChange={(value) => setSelectedColumns(Number(value))}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3</SelectItem>
                  <SelectItem value="4">4</SelectItem>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="6">6</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center space-x-6">
            <span className="text-sm font-medium">Priority Legend:</span>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-red-500 rounded"></div>
                <span className="text-xs">Urgent</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-orange-500 rounded"></div>
                <span className="text-xs">High</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                <span className="text-xs">Medium</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-gray-300 rounded"></div>
                <span className="text-xs">Low</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Enhanced Pipeline Stages with Dynamic Columns */}
      <div className="space-y-6">
        {/* Active Stages */}
        <div>
          <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center">
            <Briefcase className="w-5 h-5 mr-2" />
            Active Pipeline Stages
          </h3>
          <div
            className={`grid gap-6 overflow-x-auto`}
            style={{ gridTemplateColumns: `repeat(${selectedColumns}, minmax(300px, 1fr))` }}
          >
            {PIPELINE_STATUSES.filter((s) => s.category !== "closed").map((stage) => {
              const stageCandidates = getCandidatesByStage(stage.key)
              return renderStageColumn(stage, stageCandidates)
            })}
          </div>
        </div>

        {/* Closed Stages */}
        <div>
          <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center">
            <CheckCircle2 className="w-5 h-5 mr-2" />
            Closed Stages
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {PIPELINE_STATUSES.filter((s) => s.category === "closed").map((stage) => {
              const stageCandidates = getCandidatesByStage(stage.key)
              return renderStageColumn(stage, stageCandidates)
            })}
          </div>
        </div>
      </div>

      {/* Enhanced Pipeline Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="w-5 h-5" />
            <span>Pipeline Analytics & Insights</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{getFilteredCandidates.length}</div>
              <div className="text-sm text-gray-600">Total Candidates</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{getCandidatesByStage("hired").length}</div>
              <div className="text-sm text-gray-600">Hired</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {getCandidatesByStage("offer-sent").length +
                  getCandidatesByStage("offer-negotiation").length +
                  getCandidatesByStage("offer-accepted").length}
              </div>
              <div className="text-sm text-gray-600">Active Offers</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {getCandidatesByStage("interview-1").length +
                  getCandidatesByStage("interview-2").length +
                  getCandidatesByStage("final-interview").length}
              </div>
              <div className="text-sm text-gray-600">In Interviews</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {getCandidatesByStage("new").length + getCandidatesByStage("screening").length}
              </div>
              <div className="text-sm text-gray-600">New Applications</div>
            </div>
            <div className="text-center p-4 bg-cyan-50 rounded-lg">
              <div className="text-2xl font-bold text-cyan-600">
                {Math.round(
                  getFilteredCandidates.reduce((acc, c) => acc + (c.aiScore || 0), 0) / getFilteredCandidates.length,
                ) || 0}
              </div>
              <div className="text-sm text-gray-600">Avg AI Score</div>
            </div>
            <div className="text-center p-4 bg-indigo-50 rounded-lg">
              <div className="text-2xl font-bold text-indigo-600">
                {getFilteredCandidates.filter((c) => c.aiVerdict?.includes("recommended")).length}
              </div>
              <div className="text-sm text-gray-600">AI Recommended</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {getCandidatesByStage("rejected").length + getCandidatesByStage("withdrawn").length}
              </div>
              <div className="text-sm text-gray-600">Closed Cases</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
