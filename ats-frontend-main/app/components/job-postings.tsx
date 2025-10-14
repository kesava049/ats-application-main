"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { Textarea } from "../../components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
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
  Plus,
  MapPin,
  IndianRupee,
  Calendar,
  Building2,
  User,
  Edit,
  Eye,
  Clock,
  Globe,
  AlertCircle,
  Brain,
  Zap,
  Target,
  Share2,
  Search,
  X,
  Trash2,
  Sparkles,
  CheckCircle,
  XCircle,
} from "lucide-react"
import {
  JOB_TYPES,
  formatSalary,
  type JobType,
  getSalaryPlaceholder,
  getCurrencyByCountry,
} from "../../lib/location-data"
import { useToast } from "../../components/ui/use-toast";
import BASE_API_URL from '../../BaseUrlApi';
import PYTHON_API_URL from '../../PythonApi';
import PYTHON_BASE_URL from '../../PythonApiBase';

import ViewFinalizeJobPosting from './viewFinalizeJobPosting';
import BulkJobPosting from './bulkJobPosting';

// SearchFilters interface definition
interface SearchFilters {
  searchTerm: string
  country: string
  city: string
  salaryMin: string
  salaryMax: string
  experience: string
  skills: string[]
  status: string
  priority: string
  source: string
  jobType: string
}

interface JobPosting {
  id: string
  title: string
  company: string
  location: string
  country: string
  city: string
  jobType: JobType
  salaryMin: number
  salaryMax: number
  description: string
  requirements: string[]
  skills: string[]
  experience: string
  status: "active" | "paused" | "closed" | "filled"
  priority: "urgent" | "high" | "medium" | "low"
  postedDate: string
  lastUpdated: string
  createdAt?: string // ISO timestamp from API
  applicants: number
  views: number
  internalSPOC: string
  recruiter: string
  email: string
  department: string
  employmentType: string
  remote: boolean
  benefits: string[]
  interviewCount?: number
  aiScore?: number
  aiTags?: string[]
  workType: "ONSITE" | "REMOTE" | "HYBRID"
  jobStatus: "ACTIVE" | "PAUSED" | "CLOSED" | "FILLED"
}

export default function JobPostings({ setActiveTab }: { setActiveTab?: (tab: string) => void }) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isMinScoreDialogOpen, setIsMinScoreDialogOpen] = useState(false)
  const [editingJob, setEditingJob] = useState<JobPosting | null>(null)
  const [viewMode, setViewMode] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isLoadingJobs, setIsLoadingJobs] = useState(true)
  const [isPostingJob, setIsPostingJob] = useState(false)
  const [isDeletingJob, setIsDeletingJob] = useState(false)
  const [apiAvailable, setApiAvailable] = useState(true)
  const [isAIGenerating, setIsAIGenerating] = useState(false)
  const [aiPrompt, setAiPrompt] = useState("")
  const [aiMessage, setAiMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // Custom confirmation dialog states
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [jobToDelete, setJobToDelete] = useState<JobPosting | null>(null)
  const [showCopySuccess, setShowCopySuccess] = useState(false)
  const [copiedLink, setCopiedLink] = useState("")

  // Custom dropdown change notification states
  const [showDropdownNotification, setShowDropdownNotification] = useState(false)
  const [dropdownNotificationData, setDropdownNotificationData] = useState<{
    field: string
    oldValue: string
    newValue: string
    jobTitle: string
  } | null>(null)

  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    searchTerm: "",
    country: "",
    city: "",
    salaryMin: "",
    salaryMax: "",
    experience: "",
    skills: [],
    status: "",
    priority: "",
    source: "",
    jobType: "",
  })

  const [jobPostings, setJobPostings] = useState<JobPosting[]>([])

  const { toast } = useToast();

  // Character limits for form fields - Professional standards
  const characterLimits = {
    title: 150,         // Job titles should be descriptive but not too long (e.g., "Senior Full-Stack Software Engineer")
    company: 100,       // Company names can be long but should be reasonable
    department: 80,     // Department names should be descriptive but concise
    internalSPOC: 100,  // Names can be long (first + last name + title)
    recruiter: 100,     // Names can be long (first + last name + title)
    email: 150,         // Email addresses can be long (e.g., "hr-recruitment@company-name.com")
    location: 200,      // Full location addresses can be long
    description: 5000,  // Job descriptions should be comprehensive (typical job posting length)
    requirements: 2000, // Requirements list can be detailed
    skills: 1000,       // Skills list can be comprehensive
    benefits: 1000      // Benefits list can be detailed
  }

  // Minimum character requirements for fields - Professional standards
  const minimumCharacters = {
    title: 8,           // Job titles should be descriptive (e.g., "Developer", "Manager", "Engineer")
    company: 3,         // Company names should be at least 3 characters (e.g., "IBM", "MS", "Apple")
    department: 3,      // Department names should be at least 3 characters (e.g., "IT", "HR", "Sales")
    internalSPOC: 4,    // Names should be at least 4 characters for professional names
    recruiter: 4,       // Names should be at least 4 characters for professional names
    email: 8,           // Email should be at least 8 characters (e.g., "a@b.com", "hr@company.com")
    location: 4,        // Location should be at least 4 characters (e.g., "NYC", "LA", "London")
    description: 50,    // Job descriptions should be at least 50 characters for meaningful professional content
    requirements: 10,   // Requirements should be at least 10 characters for meaningful professional content
    skills: 3,          // Skills should be at least 3 characters (e.g., "JS", "AI", "React")
    benefits: 4         // Benefits should be at least 4 characters (e.g., "401k", "Health", "PTO")
  }

  // Helper function to get character count and limit
  const getCharacterCount = (value: string, field: keyof typeof characterLimits) => {
    const limit = characterLimits[field]
    const count = value.length
    const remaining = limit - count
    return { count, limit, remaining }
  }

  // Helper function to render character count message with color coding
  const renderCharacterCount = (value: string, field: keyof typeof characterLimits) => {
    const { count, limit, remaining } = getCharacterCount(value, field)
    const minRequired = minimumCharacters[field]
    const isOverLimit = count > limit
    const isTooShort = count > 0 && count < minRequired
    const isGoodLength = count >= minRequired && count <= limit * 0.8
    const isNearLimit = count > limit * 0.8 && count <= limit

    let messageColor = 'text-gray-500'
    let messageText = `${count}/${limit} characters`

    if (count === 0) {
      messageColor = 'text-gray-400'
      messageText = `${count}/${limit} characters`
    } else if (isOverLimit) {
      messageColor = 'text-red-500'
      messageText = `${count}/${limit} characters (${Math.abs(remaining)} over limit)`
    } else if (isTooShort) {
      messageColor = 'text-red-500'
      messageText = `${count}/${limit} characters (minimum ${minRequired} characters required)`
    } else if (isGoodLength) {
      messageColor = 'text-green-500'
      messageText = `${count}/${limit} characters (good length)`
    } else if (isNearLimit) {
      messageColor = 'text-yellow-500'
      messageText = `${count}/${limit} characters (${remaining} remaining)`
    }

    return (
      <div className={`text-xs ${messageColor}`}>
        {messageText}
      </div>
    )
  }

  // Helper function to handle input changes with character limit validation
  const handleInputChange = (field: keyof typeof characterLimits, value: string, setter: (value: string) => void) => {
    const limit = characterLimits[field]
    if (value.length <= limit) {
      setter(value)
    }
  }

  // Helper function to show dropdown change notification
  const showDropdownChangeNotification = (field: string, oldValue: string, newValue: string, jobTitle: string) => {
    setDropdownNotificationData({
      field,
      oldValue,
      newValue,
      jobTitle
    })
    setShowDropdownNotification(true)
    
    // Auto-hide after 3 seconds
    setTimeout(() => setShowDropdownNotification(false), 3000)
  }

  // Function to fetch candidate count for a job
  const fetchCandidateCount = async (jobId: string, minScore: string = "0.1"): Promise<number> => {
    try {
      // Get JWT token and company ID from localStorage
      const user = JSON.parse(localStorage.getItem('ats_user') || 'null');
      const token = user?.token;
      const companyId = user?.companyId;

      if (!token || !companyId) {
        console.warn('Authentication required for candidate count fetch');
        return 0;
      }

      const url = new URL(`${PYTHON_API_URL}/candidates-matching/candidates-matching/job/${jobId}/candidates-fast`);
      url.searchParams.set('min_score', minScore);
      url.searchParams.set('company_id', companyId.toString());

      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        return data.total_candidates || 0
      }
      return 0
    } catch (error) {
      console.error(`Error fetching candidate count for job ${jobId}:`, error)
      return 0
    }
  }

  // Function to refresh candidate counts for all jobs
  const refreshCandidateCounts = async () => {
    if (jobPostings.length === 0) return
    
    const jobsWithUpdatedCounts = await Promise.all(
      jobPostings.map(async (job) => {
        const candidateCount = await fetchCandidateCount(job.id, newJob.minScore)
        return { ...job, applicants: candidateCount }
      })
    )
    
    setJobPostings(jobsWithUpdatedCounts)
  }

  // Function to fetch jobs from API
  const fetchJobs = async () => {
    try {
      setIsLoadingJobs(true)

      // Get company ID and JWT token from localStorage
      const user = JSON.parse(localStorage.getItem('ats_user') || 'null');
      const companyId = user?.companyId;
      const token = user?.token;
      
      if (!token) {
        throw new Error('No authentication token found. Please login again.');
      }
      
      const url = new URL(`${BASE_API_URL}/jobs/get-jobs`);
      if (companyId) {
        url.searchParams.set('companyId', companyId.toString());
      }

      console.log('Attempting to fetch jobs from:', url.toString())

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log('Fetched jobs from API:', data)

      // Extract jobs array from the response
      const jobsArray = data.jobs || data
      console.log('Jobs array:', jobsArray)

      // Check if jobsArray is actually an array
      if (!Array.isArray(jobsArray)) {
        console.error('Jobs data is not an array:', jobsArray)
        setJobPostings([])
        return
      }

      // Transform API data to match our JobPosting interface
      const transformedJobs: JobPosting[] = jobsArray.map((job: any) => ({
        id: job.id || job._id || Date.now().toString(),
        title: job.title || "Untitled Job",
        company: job.company || "Unknown Company",
        location: job.fullLocation || job.location || "Unknown Location",
        country: job.country || "Unknown",
        city: job.city || "Unknown",
        jobType: (job.jobType || "full-time").toLowerCase() as JobType,
        salaryMin: job.salaryMin || 0,
        salaryMax: job.salaryMax || 0,
        description: job.description || "No description available",
        requirements: Array.isArray(job.requirements) ? job.requirements :
          typeof job.requirements === 'string' ? job.requirements.split('\n').filter((r: string) => r.trim()) : [],
        skills: Array.isArray(job.requiredSkills) ? job.requiredSkills :
          typeof job.requiredSkills === 'string' ? job.requiredSkills.split(',').map((s: string) => s.trim()) : [],
        experience: job.experienceLevel || "Not specified",
        status: "active" as const,
        priority: (job.priority || "medium").toLowerCase() as "urgent" | "high" | "medium" | "low",
        postedDate: (() => {
          const date = job.createdAt ? new Date(job.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
          console.log(`Job ${job.title}: createdAt=${job.createdAt}, postedDate=${date}`);
          return date;
        })(),
        lastUpdated: job.updatedAt ? new Date(job.updatedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        createdAt: job.createdAt || job.postedDate || new Date().toISOString(), // Store the original createdAt timestamp
        applicants: 0, // Will be updated below
        views: job.views || 0,
        internalSPOC: job.internalSPOC || "Not specified",
        recruiter: job.recruiter || "Not specified",
        email: job.email || "Not specified",
        department: job.department || "Not specified",
        employmentType: job.jobType || "Full-time",
        remote: job.workType === "Remote",
        benefits: Array.isArray(job.benefits) ? job.benefits :
          typeof job.benefits === 'string' ? job.benefits.split(',').map((b: string) => b.trim()) : [],
        interviewCount: job.interviewCount || 0,
        aiScore: job.aiScore || Math.floor(Math.random() * 30) + 60,
        aiTags: job.aiTags || [],
        workType: (job.workType || "ONSITE") as "ONSITE" | "REMOTE" | "HYBRID",
        jobStatus: (job.jobStatus || "ACTIVE") as "ACTIVE" | "PAUSED" | "CLOSED" | "FILLED"
      }))

      // Fetch candidate counts for all jobs
      const jobsWithCounts = await Promise.all(
        transformedJobs.map(async (job) => {
          const candidateCount = await fetchCandidateCount(job.id, newJob.minScore)
          return { ...job, applicants: candidateCount }
        })
      )

      setJobPostings(jobsWithCounts)
      
      // Log the sorted jobs to verify sorting is working
      console.log('Jobs sorted by createdAt (newest first):', 
        transformedJobs.map(job => ({
          title: job.title,
          createdAt: job.createdAt,
          postedDate: job.postedDate,
          timestamp: job.createdAt ? new Date(job.createdAt).getTime() : new Date(job.postedDate).getTime()
        }))
      )
    } catch (error) {
      console.error('Error fetching jobs:', error)

      // Check if it's a connection error (API server not running)
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        console.log('API server appears to be offline. Using demo data instead.')
        setApiAvailable(false)
        // Set some demo data when API is not available
        setJobPostings([
          {
            id: "demo-1",
            title: "Senior Software Engineer",
            company: "TechCorp Inc.",
            location: "San Francisco, CA",
            country: "US",
            city: "San Francisco",
            jobType: "full-time",
            salaryMin: 120000,
            salaryMax: 180000,
            description: "We are looking for a Senior Software Engineer to join our dynamic team...",
            requirements: ["5+ years experience", "React/Node.js", "AWS"],
            skills: ["React", "Node.js", "TypeScript", "AWS", "Docker"],
            experience: "5+ years",
            status: "active",
            priority: "high",
            postedDate: "2024-01-15",
            lastUpdated: "2024-01-15",
            createdAt: "2024-01-15T10:00:00.000Z",
            applicants: 12,
            views: 45,
            internalSPOC: "Sarah Wilson",
            recruiter: "John Doe",
            email: "hr@techcorp.com",
            department: "Engineering",
            employmentType: "Full-time",
            remote: true,
            benefits: ["Health Insurance", "401k", "Flexible PTO"],
            interviewCount: 3,
            aiScore: 85,
            aiTags: ["Senior", "Full-stack", "Remote"],
            workType: "REMOTE",
            jobStatus: "ACTIVE"
          },
          {
            id: "demo-2",
            title: "Product Manager",
            company: "InnovateTech",
            location: "New York, NY",
            country: "US",
            city: "New York",
            jobType: "full-time",
            salaryMin: 100000,
            salaryMax: 150000,
            description: "Join our product team to drive innovation and user experience...",
            requirements: ["3+ years PM experience", "Agile methodology", "Analytics"],
            skills: ["Product Strategy", "Agile", "Analytics", "SQL", "Figma"],
            experience: "3+ years",
            status: "active",
            priority: "medium",
            postedDate: "2024-01-10",
            lastUpdated: "2024-01-10",
            createdAt: "2024-01-10T09:00:00.000Z",
            applicants: 8,
            views: 32,
            internalSPOC: "Mike Johnson",
            recruiter: "Lisa Chen",
            email: "hr@innovatetech.com",
            department: "Product",
            employmentType: "Full-time",
            remote: false,
            benefits: ["Health Insurance", "401k", "Stock Options"],
            interviewCount: 2,
            aiScore: 78,
            aiTags: ["Product", "Strategy", "On-site"],
            workType: "ONSITE",
            jobStatus: "ACTIVE"
          }
        ])
      } else {
        setJobPostings([])
      }
    } finally {
      setIsLoadingJobs(false)
    }
  }

  const [newJob, setNewJob] = useState({
    title: "",
    company: "",
    location: "",
    country: "",
    city: "",
    jobType: "" as JobType | "",
    salaryMin: "",
    salaryMax: "",
    description: "",
    requirements: "",
    skills: "",
    experience: "",
    priority: "" as "urgent" | "high" | "medium" | "low" | "",
    internalSPOC: "",
    recruiter: "",
    email: "",
    department: "",
    remote: false,
    benefits: "",
    workType: "" as "ONSITE" | "REMOTE" | "HYBRID" | "",
    jobStatus: "" as "ACTIVE" | "PAUSED" | "CLOSED" | "FILLED" | "",
    minScore: "0.1"
  })

  // Fetch jobs on component mount
  useEffect(() => {
    fetchJobs()
  }, [])

  // Refresh candidate counts when min score changes
  useEffect(() => {
    if (jobPostings.length > 0) {
      refreshCandidateCounts()
    }
  }, [newJob.minScore])

  const statusOptions = [
    { key: "active", label: "Active" },
    { key: "paused", label: "Paused" },
    { key: "closed", label: "Closed" },
    { key: "filled", label: "Filled" },
  ]

  const handleAddJob = async () => {
    setIsPostingJob(true)
    try {
      // Get companyId from localStorage
      const userData = localStorage.getItem('ats_user')
      if (!userData) {
        throw new Error('User not authenticated. Please login again.')
      }
      
      const user = JSON.parse(userData)
      const companyId = user.companyId
      
      if (!companyId) {
        throw new Error('Company information not found. Please contact support.')
      }

      // Prepare the job data according to the API endpoint structure
      const jobData = {
        title: newJob.title,
        company: newJob.company,
        companyId: companyId,
        department: newJob.department,
        internalSPOC: newJob.internalSPOC,
        recruiter: newJob.recruiter,
        email: newJob.email,
        jobType: newJob.jobType ?
          (newJob.jobType === "full-time" ? "Full-time" :
            newJob.jobType === "part-time" ? "Part-time" :
              newJob.jobType === "contract" ? "Contract" :
                newJob.jobType === "freelance" ? "Freelance" :
                  newJob.jobType === "internship" ? "Internship" :
                    newJob.jobType === "temporary" ? "Temporary" : "Full-time") : "Full-time",
        experienceLevel: newJob.experience || "Mid level",
        country: newJob.country,
        city: newJob.city,
        fullLocation: newJob.location,
        workType: newJob.workType || "ONSITE",
        jobStatus: newJob.jobStatus || "ACTIVE",
        salaryMin: Number.parseInt(newJob.salaryMin) || 0,
        salaryMax: Number.parseInt(newJob.salaryMax) || 0,
        priority: newJob.priority ?
          (newJob.priority === "urgent" ? "Urgent" :
            newJob.priority === "high" ? "High" :
              newJob.priority === "medium" ? "Medium" :
                newJob.priority === "low" ? "Low" : "Medium") : "Medium",
        description: newJob.description,
        requirements: newJob.requirements,
        requiredSkills: newJob.skills,
        benefits: newJob.benefits
      }

      // Get JWT token from localStorage
      let token = null;
      try {
        if (typeof window !== 'undefined' && localStorage) {
          const user = JSON.parse(localStorage.getItem('ats_user') || 'null');
          token = user?.token;
        }
      } catch (error) {
        console.error('Error accessing localStorage:', error);
      }
      
      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }

      // Make API call to post job
      const response = await fetch(`${BASE_API_URL}/jobs/post-job`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(jobData),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      console.log('Job posted successfully:', result)

      // Reset form and AI states
      setNewJob({
        title: "",
        company: "",
        location: "",
        country: "",
        city: "",
        jobType: "",
        salaryMin: "",
        salaryMax: "",
        description: "",
        requirements: "",
        skills: "",
        experience: "",
        priority: "",
        internalSPOC: "",
        recruiter: "",
        email: "",
        department: "",
        remote: false,
        benefits: "",
        workType: "",
        jobStatus: "",
        minScore: "0.1"
      })
      resetAIStates()
      
      // Close both dialogs immediately
      setIsAddDialogOpen(false)
      setIsViewDialogOpen(false)

      // Show success message
      toast({
        title: "Job Posted",
        description: "Job posting created successfully!",
      })

      // Refresh the jobs list to show the newly posted job
      await fetchJobs()

    } catch (error) {
      console.error('Error posting job:', error)

      // Check if it's a connection error (API server not running)
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        toast({
          title: "API Unavailable",
          description: "API server is not available. Please start your backend server on port 5000 to use this feature.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Error Posting Job",
          description: `Error posting job: ${error instanceof Error ? error.message : 'Unknown error'}`,
          variant: "destructive",
        })
      }
    } finally {
      setIsPostingJob(false)
    }
  }

  const handleEditJob = async () => {
    if (!editingJob) return

    setIsPostingJob(true)
    try {
      // Prepare the job data according to the API endpoint structure
      const jobData = {
        title: editingJob.title,
        company: editingJob.company,
        department: editingJob.department,
        internalSPOC: editingJob.internalSPOC,
        recruiter: editingJob.recruiter,
        email: editingJob.email || "",
        jobType: editingJob.jobType ?
          (editingJob.jobType === "full-time" ? "Full-time" :
            editingJob.jobType === "part-time" ? "Part-time" :
              editingJob.jobType === "contract" ? "Contract" :
                editingJob.jobType === "freelance" ? "Freelance" :
                  editingJob.jobType === "internship" ? "Internship" :
                    editingJob.jobType === "temporary" ? "Temporary" : "Full-time") : "Full-time",
        experienceLevel: editingJob.experience || "Mid level",
        country: editingJob.country,
        city: editingJob.city,
        fullLocation: editingJob.location,
        workType: editingJob.workType || "ONSITE",
        jobStatus: editingJob.jobStatus || "ACTIVE",
        salaryMin: editingJob.salaryMin,
        salaryMax: editingJob.salaryMax,
        priority: editingJob.priority ?
          (editingJob.priority === "urgent" ? "Urgent" :
            editingJob.priority === "high" ? "High" :
              editingJob.priority === "medium" ? "Medium" :
                editingJob.priority === "low" ? "Low" : "Medium") : "Medium",
        description: editingJob.description,
        requirements: editingJob.requirements.join('\n'),
        requiredSkills: editingJob.skills.join(', '),
        benefits: editingJob.benefits.join(', ')
      }

      // Get authentication token and company ID
      const user = JSON.parse(localStorage.getItem('ats_user') || 'null');
      const token = user?.token;
      const companyId = user?.companyId;

      // Enhanced authentication debugging
      console.log('🔍 Job Update Authentication check:', {
        hasToken: !!token,
        tokenLength: token?.length,
        hasUser: !!user,
        hasCompanyId: !!companyId,
        companyId: companyId,
        userData: user,
        tokenSource: 'user.token (from ats_user object)'
      });

      if (!token || !companyId) {
        console.log('🔍 ❌ Job Update Authentication failed:', {
          missingToken: !token,
          missingCompanyId: !companyId
        });
        throw new Error('Authentication required. Please login again.');
      }

      console.log('🔍 ✅ Job Update Authentication passed');

      // Add company ID to job data
      const jobDataWithCompany = {
        ...jobData,
        companyId: companyId
      };

      // Make API call to update job
      console.log('🔍 Job Update API call details:', {
        url: `${BASE_API_URL}/jobs/update-job/${editingJob.id}`,
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token?.substring(0, 20)}...`
        },
        body: jobDataWithCompany,
        note: 'companyId passed in request body (no custom headers to avoid CORS)'
      });

      const response = await fetch(`${BASE_API_URL}/jobs/update-job/${editingJob.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(jobDataWithCompany),
      })

      console.log('🔍 Job Update API response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (!response.ok) {
        console.log('🔍 ❌ Job Update API call failed:', {
          status: response.status,
          statusText: response.statusText
        });

        // Try to get error details from response
        let errorDetails = '';
        try {
          const errorData = await response.json();
          errorDetails = errorData.error || errorData.message || '';
          console.log('🔍 Error details from API:', errorData);
        } catch (e) {
          console.log('🔍 Could not parse error response');
        }

        // Handle authentication errors
        if (response.status === 401) {
          console.log('🔍 ❌ Authentication error - redirecting to login');
          localStorage.removeItem("authenticated");
          localStorage.removeItem("auth_email");
          localStorage.removeItem("ats_user");
          window.location.href = '/login';
          throw new Error('Session expired. Please login again.');
        } else if (response.status === 403) {
          console.log('🔍 ❌ Permission denied error');
          throw new Error('Access denied. You do not have permission to update this job.');
        }
        
        console.log('🔍 ❌ General HTTP error');
        throw new Error(`HTTP error! status: ${response.status}${errorDetails ? ` - ${errorDetails}` : ''}`)
      }

      const result = await response.json()
      console.log('🔍 ✅ Job Update API call successful:', result)

      // Update local state
      setJobPostings(
        jobPostings.map((job) =>
          job.id === editingJob.id ? { ...editingJob, lastUpdated: new Date().toISOString().split("T")[0] } : job,
        ),
      )

      setIsEditDialogOpen(false)
      setEditingJob(null)

      // Show success message
      toast({
        title: "Job Updated",
        description: "Job posting updated successfully!",
      })

    } catch (error) {
      console.error('Error updating job:', error)

      // Check if it's a connection error (API server not running)
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        toast({
          title: "API Unavailable",
          description: "API server is not available. Please start your backend server on port 5000 to use this feature.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Error Updating Job",
          description: `Error updating job: ${error instanceof Error ? error.message : 'Unknown error'}`,
          variant: "destructive",
        })
      }
    } finally {
      setIsPostingJob(false)
    }
  }

  const handleDeleteJob = async (jobId: string) => {
    // Find the job data to get email
    const job = jobPostings.find(job => job.id === jobId)
    if (!job) {
      toast({
        title: "Error",
        description: "Job not found in local state",
        variant: "destructive",
      })
      return
    }

    // Set job to delete and show confirmation dialog
    setJobToDelete(job)
    setShowDeleteConfirm(true)
  }

  const confirmDeleteJob = async () => {
    if (!jobToDelete) return

    setIsDeletingJob(true)
    try {
      console.log('Attempting to delete job:', jobToDelete.id)

      console.log('Job email:', jobToDelete.email)

      // Get authentication token and company ID
      const user = JSON.parse(localStorage.getItem('ats_user') || 'null');
      const token = user?.token;
      const companyId = user?.companyId;

      if (!token || !companyId) {
        throw new Error('Authentication required. Please login again.');
      }

      // Make API call to delete job with email data
      const response = await fetch(`${BASE_API_URL}/jobs/delete-job/${jobToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          email: jobToDelete.email,
          deleteReason: 'Job deleted from frontend',
          companyId: companyId
        }),
      })

      if (!response.ok) {
        // Handle authentication errors
        if (response.status === 401) {
          localStorage.removeItem("authenticated");
          localStorage.removeItem("auth_email");
          localStorage.removeItem("ats_user");
          window.location.href = '/login';
          throw new Error('Session expired. Please login again.');
        } else if (response.status === 403) {
          throw new Error('Access denied. You do not have permission to delete this job.');
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      console.log('Job deleted successfully:', result)

      // Remove job from local state
      setJobPostings(jobPostings.filter(job => job.id !== jobToDelete.id))

      // Show success message from API
      toast({
        title: "Job Deleted",
        description: result.message || 'Job deleted successfully!',
      })

    } catch (error) {
      console.error('Error deleting job:', error)

      // Check if it's a connection error (API server not running)
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        toast({
          title: "API Unavailable",
          description: "API server is not available. Please start your backend server on port 5000 to use this feature.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Error Deleting Job",
          description: `Error deleting job: ${error instanceof Error ? error.message : 'Unknown error'}`,
          variant: "destructive",
        })
      }
    } finally {
      setIsDeletingJob(false)
      // Close confirmation dialog and reset state
      setShowDeleteConfirm(false)
      setJobToDelete(null)
    }
  }

  // AI Job Posting Generation

  // Optimized button handlers
  const handleClearPrompt = useCallback(() => {
    setAiPrompt("")
    setAiMessage(null)
  }, [])

  const generateJobPosting = useCallback(async () => {
    if (!aiPrompt.trim()) {
      setAiMessage({ type: 'error', text: 'Please enter a prompt for job posting generation' })
      return
    }

    if (aiPrompt.length < 50) {
      setAiMessage({ type: 'error', text: `Please enter at least 50 characters. You have ${aiPrompt.length}/50 characters.` })
      return
    }

    try {
      setIsAIGenerating(true)
      setAiMessage(null)

      // Get JWT token and company ID from localStorage
      const user = JSON.parse(localStorage.getItem('ats_user') || 'null');
      const token = user?.token;
      const companyId = user?.companyId;

      if (!token || !companyId) {
        throw new Error('Authentication required. Please login again.');
      }

      const response = await fetch(`${PYTHON_BASE_URL}/job-posting/generate`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          prompt: aiPrompt.trim(),
          company_id: companyId
        })
      })

      if (!response.ok) {
        // Handle authentication errors
        if (response.status === 401) {
          localStorage.removeItem("authenticated");
          localStorage.removeItem("auth_email");
          localStorage.removeItem("ats_user");
          window.location.href = '/login';
          throw new Error('Session expired. Please login again.');
        } else if (response.status === 403) {
          throw new Error('Access denied. You do not have permission to generate job postings.');
        }
        
        // Try to get the actual error message from the response
        let errorMessage = `HTTP error! status: ${response.status}`
        try {
          const errorData = await response.json()
          if (errorData.detail) {
            errorMessage = errorData.detail
          } else if (errorData.message) {
            errorMessage = errorData.message
          }
        } catch (e) {
          // If we can't parse the error response, use the generic message
          console.warn('Could not parse error response:', e)
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()

      if (data.success && data.data) {
        const generatedData = data.data

        // Auto-fill the form fields with generated data - ensure ALL fields are mapped
        const updatedJob = {
          ...newJob,
          title: generatedData.title || newJob.title,
          company: generatedData.company || newJob.company,
          department: generatedData.department || newJob.department,
          internalSPOC: generatedData.internalSPOC || newJob.internalSPOC,
          recruiter: generatedData.recruiter || newJob.recruiter,
          email: generatedData.email || newJob.email,
          jobType: generatedData.jobType ? (generatedData.jobType.toLowerCase() as JobType) : newJob.jobType,
          experience: (() => {
            const expLevel = generatedData.experienceLevel || generatedData.experience || newJob.experience;
            if (expLevel) {
              // Extract just the level part from "Mid level (3-5 years)" -> "Mid level"
              if (expLevel.includes("Entry level") || expLevel.includes("Entry")) return "Entry level";
              if (expLevel.includes("Mid level") || expLevel.includes("Mid")) return "Mid level";
              if (expLevel.includes("Senior level") || expLevel.includes("Senior")) return "Senior level";
              if (expLevel.includes("Lead") || expLevel.includes("Principal")) return "Lead/Principal";
            }
            return expLevel;
          })(),
          country: generatedData.country || newJob.country,
          city: generatedData.city || newJob.city,
          location: generatedData.location || generatedData.fullLocation || newJob.location,
          workType: generatedData.workType ? generatedData.workType : newJob.workType,
          jobStatus: generatedData.jobStatus ? generatedData.jobStatus : newJob.jobStatus,
          salaryMin: generatedData.salaryMin?.toString() || newJob.salaryMin,
          salaryMax: generatedData.salaryMax?.toString() || newJob.salaryMax,
          priority: generatedData.priority ? (generatedData.priority.toLowerCase() as "urgent" | "high" | "medium" | "low") : newJob.priority,
          description: generatedData.description || newJob.description,
          requirements: generatedData.requirements || newJob.requirements,
          skills: generatedData.skills || generatedData.requiredSkills || newJob.skills,
          benefits: generatedData.benefits || newJob.benefits,
        }

        console.log('AI Generated Data:', generatedData)
        console.log('Updated Job State:', updatedJob)

        // Debug: Check each field individually
        console.log('Field Mapping Check:')
        console.log('Title:', generatedData.title, '->', updatedJob.title)
        console.log('Company:', generatedData.company, '->', updatedJob.company)
        console.log('Department:', generatedData.department, '->', updatedJob.department)
        console.log('InternalSPOC:', generatedData.internalSPOC, '->', updatedJob.internalSPOC)
        console.log('Recruiter:', generatedData.recruiter, '->', updatedJob.recruiter)
        console.log('Email:', generatedData.email, '->', updatedJob.email)
        console.log('JobType:', generatedData.jobType, '->', updatedJob.jobType)
        console.log('Experience:', generatedData.experience, '->', updatedJob.experience, '(Raw:', generatedData.experienceLevel, ')')
        console.log('Country:', generatedData.country, '->', updatedJob.country)
        console.log('City:', generatedData.city, '->', updatedJob.city)
        console.log('Location:', generatedData.location, '->', updatedJob.location)
        console.log('WorkType:', generatedData.workType, '->', updatedJob.workType)
        console.log('JobStatus:', generatedData.jobStatus, '->', updatedJob.jobStatus)
        console.log('SalaryMin:', generatedData.salaryMin, '->', updatedJob.salaryMin)
        console.log('SalaryMax:', generatedData.salaryMax, '->', updatedJob.salaryMax)
        console.log('Priority:', generatedData.priority, '->', updatedJob.priority)
        console.log('Description:', generatedData.description, '->', updatedJob.description)
        console.log('Requirements:', generatedData.requirements, '->', updatedJob.requirements)
        console.log('Skills:', generatedData.skills, '->', updatedJob.skills)
        console.log('Benefits:', generatedData.benefits, '->', updatedJob.benefits)

        // Force a complete state update to ensure all fields are rendered
        setNewJob(updatedJob)

        // Force a re-render by updating a timestamp
        setTimeout(() => {
          setNewJob(prev => ({ ...prev, ...updatedJob }))
        }, 100)

        setAiMessage({
          type: 'success',
          text: 'Job posting generated successfully! Form fields have been auto-filled.'
        })
        setAiPrompt("")

        toast({
          title: "Success!",
          description: "Job posting generated and form auto-filled successfully.",
          variant: "default",
        })
      } else {
        throw new Error(data.message || 'Failed to generate job posting')
      }
    } catch (error) {
      console.error('Error generating job posting:', error)

      let errorMessage = 'Failed to generate job posting'
      let errorTitle = 'Error'
      let isValidationError = false

      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        errorMessage = 'API server is not available. Please start your backend server to use this feature.'
        setApiAvailable(false)
      } else if (error instanceof Error) {
        errorMessage = error.message
        
        // Check if it's a validation error from backend
        if (error.message.includes('Invalid prompt') || 
            error.message.includes('not related to job postings') ||
            error.message.includes('Validation error') ||
            error.message.includes('Please provide a job-related prompt') ||
            error.message.includes('contains random characters') ||
            error.message.includes('not a meaningful job description')) {
          isValidationError = true
          errorTitle = 'Invalid Prompt'
        }
      }

      setAiMessage({ type: 'error', text: errorMessage })
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: isValidationError ? "default" : "destructive",
      })
    } finally {
      setIsAIGenerating(false)
    }
  }, [aiPrompt, toast])

  // Check if all required fields are filled for view button
  const isFormComplete = () => {
    const requiredFields = [
      'title', 'company', 'department', 'internalSPOC', 'recruiter', 'email',
      'jobType', 'experience', 'country', 'city', 'location', 'workType',
      'jobStatus', 'salaryMin', 'salaryMax', 'priority', 'description',
      'requirements', 'skills', 'benefits', 'minScore'
    ]
    
    return requiredFields.every(field => {
      const value = newJob[field as keyof typeof newJob]
      return value && value.toString().trim().length > 0
    })
  }

  // Handle finalize from view dialog
  const handleFinalizeJob = async (finalizedJobData: any) => {
    // Update the newJob state with any changes made in the view dialog
    setNewJob(finalizedJobData)
    
    // Call the original handleAddJob function
    // The dialog will be closed automatically by the ViewFinalizeJobPosting component
    await handleAddJob()
  }

  // Handle back from view dialog
  const handleBackFromView = (updatedJobData: any) => {
    // Update the newJob state with any changes made in the view dialog
    setNewJob(updatedJobData)
    
    // Close the view dialog and reopen the add dialog instantly
    setIsViewDialogOpen(false)
    setIsAddDialogOpen(true)
  }

  // Reset AI states and form
  const resetAIStates = () => {
    setAiPrompt("")
    setAiMessage(null)
  }

  // Clear all form data
  const clearForm = () => {
    setNewJob({
      title: "",
      company: "",
      location: "",
      country: "",
      city: "",
      jobType: "",
      salaryMin: "",
      salaryMax: "",
      description: "",
      requirements: "",
      skills: "",
      experience: "",
      priority: "",
      internalSPOC: "",
      recruiter: "",
      email: "",
      department: "",
      remote: false,
      benefits: "",
      workType: "",
      jobStatus: "",
      minScore: "0.1"
    })
    resetAIStates()
    // Reset any other states that might interfere
    setIsPostingJob(false)
  }

  // AI-powered job filtering and sorting
  const filteredJobs = jobPostings
    .filter((job) => {
      const searchTerm = searchFilters.searchTerm.toLowerCase()
      let matchesSearch = true

      if (searchTerm) {
        const basicMatch =
          job.title.toLowerCase().includes(searchTerm) ||
          job.company.toLowerCase().includes(searchTerm) ||
          job.location.toLowerCase().includes(searchTerm) ||
          job.description.toLowerCase().includes(searchTerm) ||
          job.skills.some((skill) => skill.toLowerCase().includes(searchTerm))

        matchesSearch = basicMatch
      }

      const matchesStatus = statusFilter === "all" || job.status === statusFilter
      const matchesJobType =
        !searchFilters.jobType || searchFilters.jobType === "any" || job.jobType === searchFilters.jobType
      const matchesCountry =
        !searchFilters.country || searchFilters.country === "all" || job.country === searchFilters.country
      const matchesCity = !searchFilters.city || searchFilters.city === "all" || job.city === searchFilters.city
      const matchesExperience =
        !searchFilters.experience ||
        searchFilters.experience === "any" ||
        job.experience.includes(searchFilters.experience)
      const matchesSkills =
        searchFilters.skills.length === 0 ||
        searchFilters.skills.some((skill) =>
          job.skills.some((jobSkill) => jobSkill.toLowerCase().includes(skill.toLowerCase())),
        )
      const matchesPriority =
        !searchFilters.priority || searchFilters.priority === "any" || job.priority === searchFilters.priority

      const salaryMin = searchFilters.salaryMin ? Number.parseFloat(searchFilters.salaryMin) : 0
      const salaryMax = searchFilters.salaryMax
        ? Number.parseFloat(searchFilters.salaryMax)
        : Number.POSITIVE_INFINITY
      const matchesSalary = job.salaryMax >= salaryMin && job.salaryMin <= salaryMax

      return (
        matchesSearch &&
        matchesStatus &&
        matchesJobType &&
        matchesCountry &&
        matchesCity &&
        matchesExperience &&
        matchesSkills &&
        matchesPriority &&
        matchesSalary
      )
    })
    .sort((a, b) => {
      // Sort by createdAt timestamp in descending order (newest first)
      // This ensures the most recently created jobs appear at the top
      // Use createdAt if available, otherwise fall back to postedDate
      let dateA: number
      let dateB: number
      
      try {
        // Try to parse createdAt timestamp first (most accurate)
        if (a.createdAt) {
          dateA = new Date(a.createdAt).getTime()
        } else if (a.postedDate) {
          dateA = new Date(a.postedDate).getTime()
        } else {
          dateA = 0 // Fallback for jobs without dates
        }
        
        if (b.createdAt) {
          dateB = new Date(b.createdAt).getTime()
        } else if (b.postedDate) {
          dateB = new Date(b.postedDate).getTime()
        } else {
          dateB = 0 // Fallback for jobs without dates
        }
      } catch (error) {
        console.warn('Error parsing dates for sorting:', error)
        // Fallback to string comparison if date parsing fails
        dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
        dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
      }
      
      // Sort in descending order (newest first)
      return dateB - dateA
    })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200"
      case "paused":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "closed":
        return "bg-red-100 text-red-800 border-red-200"
      case "filled":
        return "bg-blue-100 text-blue-800 border-blue-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
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
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getJobTypeColor = (jobType: string) => {
    switch (jobType) {
      case "full-time":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "part-time":
        return "bg-purple-100 text-purple-800 border-purple-200"
      case "contract":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "freelance":
        return "bg-green-100 text-green-800 border-green-200"
      case "internship":
        return "bg-pink-100 text-pink-800 border-pink-200"
      case "temporary":
        return "bg-gray-100 text-gray-800 border-gray-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const renderJobCard = (job: JobPosting) => {
    // Navigation handlers
    const handleInternalNavigation = () => {
      // Navigate to candidates module using setActiveTab
      if (setActiveTab) {
        setActiveTab("candidates")
      }
    }

    const handleAnalysisNavigation = () => {
      // Navigate to job applicants page for this specific job
      console.log('Internal button clicked! Job ID:', job.id)
      // Navigate to the job applicants page
      window.location.href = `/job/${job.id}/applicants?source=internal`
    }



    return (
      <Card key={job.id} className="mb-4 hover:shadow-lg transition-shadow relative">
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <h3 className="font-semibold text-xl mb-2">{job.title}</h3>
              
              <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                <Building2 className="w-4 h-4" />
                <span>{job.company}</span>
                <span>•</span>
                <MapPin className="w-4 h-4" />
                <span>{job.location}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600 mb-3">
                <span className="flex items-center space-x-1 font-medium text-green-600">
                  <span>{formatSalary(job.salaryMax, job.jobType, job.country, true, job.salaryMin)}</span>
                </span>
                <span>•</span>
                <Clock className="w-4 h-4" />
                <span>{job.experience}</span>
              </div>
            </div>

            <div className="flex flex-col items-end space-y-2">
              <div className="flex items-center space-x-2">
                <Select
                value={job.jobType}
                onValueChange={async (value) => {
                  try {
                    const oldValue = job.jobType
                    
                    // Update local state immediately for responsive UI
                    const updatedJobs = jobPostings.map((j) =>
                      j.id === job.id
                        ? {
                          ...j,
                          jobType: value as JobType,
                          lastUpdated: new Date().toISOString().split("T")[0],
                        }
                        : j,
                    )
                    setJobPostings(updatedJobs)

                    // Show dropdown change notification
                    showDropdownChangeNotification(
                      'Job Type',
                      oldValue,
                      value,
                      job.title
                    )

                    // Get authentication token and company ID
                    const user = JSON.parse(localStorage.getItem('ats_user') || 'null');
                    const token = user?.token;
                    const companyId = user?.companyId;

                    if (!token || !companyId) {
                      throw new Error('Authentication required. Please login again.');
                    }

                    // Prepare data for API
                    const jobData = {
                      jobType: value === "full-time" ? "Full-time" :
                        value === "part-time" ? "Part-time" :
                          value === "contract" ? "Contract" :
                            value === "freelance" ? "Freelance" :
                              value === "internship" ? "Internship" :
                                value === "temporary" ? "Temporary" : "Full-time",
                      companyId: companyId
                    }

                    // Call API to update job
                    const response = await fetch(`${BASE_API_URL}/jobs/update-job/${job.id}`, {
                      method: 'PUT',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                      },
                      body: JSON.stringify(jobData),
                    })

                    if (!response.ok) {
                      // Handle authentication errors
                      if (response.status === 401) {
                        localStorage.removeItem("authenticated");
                        localStorage.removeItem("auth_email");
                        localStorage.removeItem("ats_user");
                        window.location.href = '/login';
                        throw new Error('Session expired. Please login again.');
                      } else if (response.status === 403) {
                        throw new Error('Access denied. You do not have permission to update this job.');
                      }
                      throw new Error(`HTTP error! status: ${response.status}`)
                    }

                    toast({
                      title: "Job Updated",
                      description: "Job type updated successfully!",
                    })
                  } catch (error) {
                    console.error('Error updating job type:', error)
                    toast({
                      title: "Error",
                      description: "Failed to update job type. Please try again.",
                      variant: "destructive",
                    })
                  }
                }}
              >
                <SelectTrigger className={`w-auto h-6 px-2 text-xs border-0 ${getJobTypeColor(job.jobType)}`}>
                  <SelectValue placeholder={job.jobType} />
                </SelectTrigger>
                <SelectContent>
                  {JOB_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center space-x-2">
                        <Badge className={getJobTypeColor(type.value)} variant="outline">
                          {type.label}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={job.jobStatus}
                onValueChange={async (value) => {
                  try {
                    const oldValue = job.jobStatus
                    
                    // Update local state immediately for responsive UI
                    const updatedJobs = jobPostings.map((j) =>
                      j.id === job.id
                        ? {
                          ...j,
                          jobStatus: value as "ACTIVE" | "PAUSED" | "CLOSED" | "FILLED",
                          lastUpdated: new Date().toISOString().split("T")[0],
                        }
                        : j,
                    )
                    setJobPostings(updatedJobs)

                    // Show dropdown change notification
                    showDropdownChangeNotification(
                      'Job Status',
                      oldValue,
                      value,
                      job.title
                    )

                    // Get authentication token and company ID
                    const user = JSON.parse(localStorage.getItem('ats_user') || 'null');
                    const token = user?.token;
                    const companyId = user?.companyId;

                    if (!token || !companyId) {
                      throw new Error('Authentication required. Please login again.');
                    }

                    // Prepare data for API
                    const jobData = {
                      jobStatus: value,
                      companyId: companyId
                    }

                    // Call API to update job
                    const response = await fetch(`${BASE_API_URL}/jobs/update-job/${job.id}`, {
                      method: 'PUT',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                      },
                      body: JSON.stringify(jobData),
                    })

                    if (!response.ok) {
                      // Handle authentication errors
                      if (response.status === 401) {
                        localStorage.removeItem("authenticated");
                        localStorage.removeItem("auth_email");
                        localStorage.removeItem("ats_user");
                        window.location.href = '/login';
                        throw new Error('Session expired. Please login again.');
                      } else if (response.status === 403) {
                        throw new Error('Access denied. You do not have permission to update this job.');
                      }
                      throw new Error(`HTTP error! status: ${response.status}`)
                    }

                    toast({
                      title: "Job Updated",
                      description: "Job status updated successfully!",
                    })
                  } catch (error) {
                    console.error('Error updating job status:', error)
                    toast({
                      title: "Error",
                      description: "Failed to update job status. Please try again.",
                      variant: "destructive",
                    })
                  }
                }}
              >
                <SelectTrigger className={`w-auto h-6 px-2 text-xs border-0 ${getStatusColor(job.jobStatus.toLowerCase())}`}>
                  <SelectValue placeholder={job.jobStatus} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor("active")} variant="outline">
                        Active
                      </Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="PAUSED">
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor("paused")} variant="outline">
                        Paused
                      </Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="CLOSED">
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor("closed")} variant="outline">
                        Closed
                      </Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="FILLED">
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor("filled")} variant="outline">
                        Filled
                      </Badge>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={job.workType}
                onValueChange={async (value) => {
                  try {
                    const oldValue = job.workType
                    
                    // Update local state immediately for responsive UI
                    const updatedJobs = jobPostings.map((j) =>
                      j.id === job.id
                        ? {
                          ...j,
                          workType: value as "ONSITE" | "REMOTE" | "HYBRID",
                          lastUpdated: new Date().toISOString().split("T")[0],
                        }
                        : j,
                    )
                    setJobPostings(updatedJobs)

                    // Show dropdown change notification
                    showDropdownChangeNotification(
                      'Work Type',
                      oldValue,
                      value,
                      job.title
                    )

                    // Get authentication token and company ID
                    const user = JSON.parse(localStorage.getItem('ats_user') || 'null');
                    const token = user?.token;
                    const companyId = user?.companyId;

                    if (!token || !companyId) {
                      throw new Error('Authentication required. Please login again.');
                    }

                    // Prepare data for API
                    const jobData = {
                      workType: value,
                      companyId: companyId
                    }

                    // Call API to update job
                    const response = await fetch(`${BASE_API_URL}/jobs/update-job/${job.id}`, {
                      method: 'PUT',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                      },
                      body: JSON.stringify(jobData),
                    })

                    if (!response.ok) {
                      // Handle authentication errors
                      if (response.status === 401) {
                        localStorage.removeItem("authenticated");
                        localStorage.removeItem("auth_email");
                        localStorage.removeItem("ats_user");
                        window.location.href = '/login';
                        throw new Error('Session expired. Please login again.');
                      } else if (response.status === 403) {
                        throw new Error('Access denied. You do not have permission to update this job.');
                      }
                      throw new Error(`HTTP error! status: ${response.status}`)
                    }

                    toast({
                      title: "Job Updated",
                      description: "Work type updated successfully!",
                    })
                  } catch (error) {
                    console.error('Error updating work type:', error)
                    toast({
                      title: "Error",
                      description: "Failed to update work type. Please try again.",
                      variant: "destructive",
                    })
                  }
                }}
              >
                <SelectTrigger className={`w-auto h-6 px-2 text-xs border-0 ${getJobTypeColor(job.workType.toLowerCase())}`}>
                  <SelectValue placeholder={job.workType} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ONSITE">
                    <div className="flex items-center space-x-2">
                      <Badge className="bg-blue-100 text-blue-800 border-blue-200" variant="outline">
                        On-site
                      </Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="REMOTE">
                    <div className="flex items-center space-x-2">
                      <Badge className="bg-green-100 text-green-800 border-green-200" variant="outline">
                        Remote
                      </Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="HYBRID">
                    <div className="flex items-center space-x-2">
                      <Badge className="bg-purple-100 text-purple-800 border-purple-200" variant="outline">
                        Hybrid
                      </Badge>
                    </div>
                  </SelectItem>
                </SelectContent>
                </Select>
                <Select
                value={job.priority}
                onValueChange={async (value) => {
                  try {
                    const oldValue = job.priority
                    
                    // Update local state immediately for responsive UI
                    const updatedJobs = jobPostings.map((j) =>
                      j.id === job.id
                        ? {
                          ...j,
                          priority: value as "urgent" | "high" | "medium" | "low",
                          lastUpdated: new Date().toISOString().split("T")[0],
                        }
                        : j,
                    )
                    setJobPostings(updatedJobs)

                    // Show dropdown change notification
                    showDropdownChangeNotification(
                      'Priority',
                      oldValue,
                      value,
                      job.title
                    )

                    // Get authentication token and company ID
                    const user = JSON.parse(localStorage.getItem('ats_user') || 'null');
                    const token = user?.token;
                    const companyId = user?.companyId;

                    if (!token || !companyId) {
                      throw new Error('Authentication required. Please login again.');
                    }

                    // Prepare data for API
                    const jobData = {
                      priority: value === "urgent" ? "Urgent" :
                        value === "high" ? "High" :
                          value === "medium" ? "Medium" :
                            value === "low" ? "Low" : "Medium",
                      companyId: companyId
                    }

                    // Call API to update job
                    const response = await fetch(`${BASE_API_URL}/jobs/update-job/${job.id}`, {
                      method: 'PUT',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                      },
                      body: JSON.stringify(jobData),
                    })

                    if (!response.ok) {
                      // Handle authentication errors
                      if (response.status === 401) {
                        localStorage.removeItem("authenticated");
                        localStorage.removeItem("auth_email");
                        localStorage.removeItem("ats_user");
                        window.location.href = '/login';
                        throw new Error('Session expired. Please login again.');
                      } else if (response.status === 403) {
                        throw new Error('Access denied. You do not have permission to update this job.');
                      }
                      throw new Error(`HTTP error! status: ${response.status}`)
                    }

                    toast({
                      title: "Job Updated",
                      description: "Priority updated successfully!",
                    })
                  } catch (error) {
                    console.error('Error updating priority:', error)
                    toast({
                      title: "Error",
                      description: "Failed to update priority. Please try again.",
                      variant: "destructive",
                    })
                  }
                }}
              >
                <SelectTrigger className={`w-auto h-6 px-2 text-xs border-0 ${getPriorityColor(job.priority)}`}>
                  <SelectValue placeholder={job.priority}>{job.priority} priority</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="urgent">
                    <div className="flex items-center space-x-2">
                      <Badge className={getPriorityColor("urgent")} variant="outline">
                        Urgent Priority
                      </Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="high">
                    <div className="flex items-center space-x-2">
                      <Badge className={getPriorityColor("high")} variant="outline">
                        High Priority
                      </Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="medium">
                    <div className="flex items-center space-x-2">
                      <Badge className={getPriorityColor("medium")} variant="outline">
                        Medium Priority
                      </Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="low">
                    <div className="flex items-center space-x-2">
                      <Badge className={getPriorityColor("low")} variant="outline">
                        Low Priority
                      </Badge>
                    </div>
                  </SelectItem>
                </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <div 
                  onClick={handleInternalNavigation}
                  className="flex items-center space-x-1 px-3 py-1 bg-green-50 border border-green-200 rounded-full cursor-pointer hover:bg-green-100 transition-colors"
                >
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-green-700 font-medium text-sm">
                    External
                  </span>
                  <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <div 
                  onClick={handleAnalysisNavigation}
                  className="flex items-center space-x-1 px-3 py-1 bg-blue-50 border border-blue-200 rounded-full cursor-pointer hover:bg-blue-100 transition-colors"
                >
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-blue-700 font-medium text-sm">
                    Internal
                  </span>
                  {/* <span className="bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-full font-medium">
                    {job.applicants || 0}
                  </span> */}
                  <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <p className="text-gray-700 text-sm mb-4">{job.description}</p>

          <div className="mb-4">
            <div className="flex flex-wrap gap-1">
              {job.skills.slice(0, 6).map((skill, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {skill}
                </Badge>
              ))}
              {job.skills.length > 6 && (
                <Badge variant="outline" className="text-xs">
                  +{job.skills.length - 6} more
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4" />
              <span>SPOC: {job.internalSPOC}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Eye className="w-4 h-4" />
              <span>{job.views} views</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
                             <Calendar className="w-4 h-4 text-gray-400" />
                       <span>
             Posted: {new Date(job.postedDate).toLocaleDateString()}
           </span>
            </div>
            <div className="flex space-x-2">
              <div className="flex items-center space-x-2">
                <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full shadow-md">
                  <Share2 className="w-4 h-4 text-white" />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Generate full job slug URL
                    const slugify = (str: string) => str?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
                    const jobSlug = `job-listings-${slugify(job.title)}-${slugify(job.experience || 'senior')}-${slugify(job.jobType || 'full-time')}-${slugify(job.company)}-${slugify(job.city)}-${job.id}`
                    const applyLink = `${window.location.origin}/apply/${jobSlug}`
                    
                    // Simple copy function
                    const copyToClipboard = async (text: string) => {
                      try {
                        // Method 1: Modern Clipboard API
                        if (navigator.clipboard && window.isSecureContext) {
                          await navigator.clipboard.writeText(text)
                          return true
                        }
                        
                        // Method 2: Fallback for older browsers
                        const textArea = document.createElement('textarea')
                        textArea.value = text
                        textArea.style.position = 'fixed'
                        textArea.style.left = '-999999px'
                        textArea.style.top = '-999999px'
                        document.body.appendChild(textArea)
                        textArea.focus()
                        textArea.select()
                        
                        try {
                          const successful = document.execCommand('copy')
                          document.body.removeChild(textArea)
                          return successful
                        } catch (err) {
                          document.body.removeChild(textArea)
                          return false
                        }
                      } catch (err) {
                        console.error('Failed to copy to clipboard:', err)
                        return false
                      }
                    }
                    
                    // Attempt to copy and show custom success popup
                    copyToClipboard(applyLink).then(success => {
                      if (success) {
                        setCopiedLink(applyLink)
                        setShowCopySuccess(true)
                        // Auto-hide after 3 seconds
                        setTimeout(() => setShowCopySuccess(false), 3000)
                      } else {
                        // Silent fallback - just copy the link to console for manual copying
                        console.log('Copy this link manually:', applyLink)
                        toast({
                          title: "Copy Failed",
                          description: "Please copy the link manually from the console",
                          variant: "destructive",
                        })
                      }
                    }).catch(error => {
                      console.error('Error in copy operation:', error)
                      // Silent fallback - just copy the link to console for manual copying
                      console.log('Copy this link manually:', applyLink)
                      toast({
                        title: "Copy Failed",
                        description: "Please copy the link manually from the console",
                        variant: "destructive",
                      })
                    })
                  }}
                  className="text-green-600 border-green-200 hover:bg-green-50 text-xs"
                >
                  Copy Link
                </Button>
              </div>

              {/* Social Media Sharing Icons */}
              <div className="flex items-center space-x-1">
                {/* WhatsApp */}
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`🚀 Exciting Job Opportunity!\n\n${job.title} at ${job.company}\n📍 ${job.location}\n${formatSalary(job.salaryMax, job.jobType, job.country, true, job.salaryMin)}\n\n${job.description.substring(0, 200)}...\n\nApply now: ${window.location.origin}/apply/job-listings-${job.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')}-${job.experience?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'senior'}-${job.jobType?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'full-time'}-${job.company.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')}-${job.city?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'remote'}-${job.id}?utm_source=whatsapp&utm_medium=social&utm_campaign=job_posting`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-green-500 hover:bg-green-600 text-white transition-colors duration-200"
                  title="Share on WhatsApp"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
                  </svg>
                </a>

                {/* Instagram */}
                <a
                  href={`https://www.instagram.com/?url=${encodeURIComponent(`${window.location.origin}/apply/job-listings-${job.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')}-${job.experience?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'senior'}-${job.jobType?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'full-time'}-${job.company.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')}-${job.city?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'remote'}-${job.id}?utm_source=instagram&utm_medium=social&utm_campaign=job_posting`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 hover:from-purple-600 hover:via-pink-600 hover:to-orange-600 text-white transition-all duration-200"
                  title="Share on Instagram"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </a>

                {/* Facebook */}
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`${window.location.origin}/apply/job-listings-${job.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')}-${job.experience?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'senior'}-${job.jobType?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'full-time'}-${job.company.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')}-${job.city?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'remote'}-${job.id}?utm_source=facebook&utm_medium=social&utm_campaign=job_posting`)}&quote=${encodeURIComponent(`Check out this ${job.title} position at ${job.company}! ${job.description.substring(0, 150)}... Apply now: ${window.location.origin}/apply/job-listings-${job.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')}-${job.experience?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'senior'}-${job.jobType?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'full-time'}-${job.company.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')}-${job.city?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'remote'}-${job.id}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-200"
                  title="Share on Facebook"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>

                {/* LinkedIn */}
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`${window.location.origin}/apply/job-listings-${job.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')}-${job.experience?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'senior'}-${job.jobType?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'full-time'}-${job.company.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')}-${job.city?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'remote'}-${job.id}?utm_source=linkedin&utm_medium=social&utm_campaign=job_posting`)}&title=${encodeURIComponent(`${job.title} at ${job.company}`)}&summary=${encodeURIComponent(job.description.substring(0, 200) + "...")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white transition-colors duration-200"
                  title="Share on LinkedIn"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </a>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditingJob(job)
                  setIsEditDialogOpen(true)
                }}
              >
                <Edit className="w-3 h-3 mr-1" />
                Edit
              </Button>
              {/* Delete button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDeleteJob(job.id)}
                disabled={isDeletingJob}
                className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
              >
                {isDeletingJob ? (
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-600 mr-1"></div>
                ) : (
                  <Trash2 className="w-3 h-3 mr-1" />
                )}
                Delete
              </Button>
            </div>
          </div>


        </CardContent>
      </Card>
    )
  }



  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Job Postings</h2>
          <p className="text-gray-600">Create and manage job postings with API integration</p>
          <div className="flex items-center space-x-2 mt-2">
            <Badge variant="outline" className="bg-blue-50 text-blue-700">
              {jobPostings.length} Total Jobs
            </Badge>
            <Badge variant="outline" className="bg-green-50 text-green-700">
              {filteredJobs.length} Filtered Results
            </Badge>
            <Badge variant="outline" className="bg-orange-50 text-orange-700">
              {jobPostings.filter((job) => job.status === "active").length} Active
            </Badge>
            
            {!apiAvailable && (
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                Demo Mode
              </Badge>
            )}

          </div>
          
          {/* Min Score Filter - Compact Design */}
          {/* <div className="mt-3 inline-flex items-center space-x-2 bg-gray-50 px-3 py-2 rounded-lg border">
            <Target className="w-4 h-4 text-gray-600" />
            <span className="text-sm text-gray-700">Min Score:</span>
            <input
              type="number"
              min="0"
              max="1"
              step="0.1"
              value={newJob.minScore}
              onChange={(e) => setNewJob({ ...newJob, minScore: e.target.value })}
              className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              placeholder="0.1"
            />
            <span className="text-xs text-gray-500">📊 Count on Internal</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinScoreDialogOpen(true)}
              className="h-6 w-6 p-0 hover:bg-blue-100"
            >
              <Eye className="w-3 h-3 text-gray-600" />
            </Button>
          </div> */}

        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={fetchJobs}
            disabled={isLoadingJobs}
            className="border-gray-300 hover:bg-gray-50"
          >
            {isLoadingJobs ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                Loading...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                 
                </svg>
                 Refresh
              </>
            )}
          </Button>
          <BulkJobPosting onJobsCreated={fetchJobs} />
          <div className="flex flex-col space-y-3">
            <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
              setIsAddDialogOpen(open);
              if (!open) {
                resetAIStates();
                clearForm();
              }
            }}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  {/* <Plus className="w-4 h-4 mr-2" /> */}
                  Add Job Posting
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <div>
                  <DialogTitle>Create New Job Posting</DialogTitle>
                  <DialogDescription>
                    Fill in the details for your new job posting
                  </DialogDescription>

                </div>
              </DialogHeader>

              <div className="grid gap-6 py-4">
                {/* AI Job Posting Generator */}
                <div className="space-y-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-blue-900">AI Job Posting Generator</h3>
                  </div>

                  {aiMessage && (
                    <div className={`p-4 rounded-xl border-l-4 shadow-lg ${
                      aiMessage.type === 'success'
                        ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-400 text-green-800'
                        : 'bg-gradient-to-r from-red-50 to-rose-50 border-red-400 text-red-800'
                    }`}>
                      <div className="flex items-center space-x-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          aiMessage.type === 'success' ? 'bg-green-500' : 'bg-red-500'
                        }`}>
                          {aiMessage.type === 'success' ? (
                            <CheckCircle className="w-4 h-4 text-white" />
                          ) : (
                            <XCircle className="w-4 h-4 text-white" />
                          )}
                        </div>
                        <span className="font-medium">{aiMessage.text}</span>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <Label htmlFor="aiPrompt" className="text-blue-900">
                      Describe the job you want to generate:
                    </Label>
                    <div className="relative">
                      <Textarea
                        id="aiPrompt"
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        placeholder="Generate a job posting for an AI Specialist position..."
                        rows={3}
                        className="border-blue-300 focus:border-blue-500 focus:ring-blue-500 pr-12"
                      />
                      <div className="absolute bottom-3 right-3 bg-white px-2 py-1 rounded text-xs text-gray-500 border border-gray-200">
                        {aiPrompt.length}/50
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        {aiPrompt.length}/50 characters minimum
                      </div>
                      {aiPrompt.length < 50 && aiPrompt.length > 0 && (
                        <div className="text-sm text-red-500 font-medium">
                          Need {50 - aiPrompt.length} more characters
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm text-blue-700">
                          💡 Be specific about role, location, requirements, and benefits for better results
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleClearPrompt}
                          className="text-gray-600 border-gray-300 hover:bg-gray-50 transition-colors duration-200"
                        >
                          Clear All
                        </Button>
                        <Button
                          onClick={generateJobPosting}
                          disabled={isAIGenerating || !aiPrompt.trim() || aiPrompt.length < 50}
                          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isAIGenerating ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Generating...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4 mr-2" />
                              Generate with AI
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Basic Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">
                        Job Title <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="title"
                        value={newJob.title || ""}
                        onChange={(e) => handleInputChange('title', e.target.value, (value) => setNewJob({ ...newJob, title: value }))}
                        placeholder="Senior Software Engineer"
                        required
                        maxLength={characterLimits.title}
                        className={`${newJob.title ? 'bg-green-50 border-green-300 text-green-900 placeholder-green-700' : ''}`}
                      />
                      {renderCharacterCount(newJob.title, 'title')}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company">
                        Company <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="company"
                        value={newJob.company || ""}
                        onChange={(e) => handleInputChange('company', e.target.value, (value) => setNewJob({ ...newJob, company: value }))}
                        placeholder="TechCorp Inc."
                        required
                        maxLength={characterLimits.company}
                        className={`${newJob.company ? 'bg-green-50 border-green-300 text-green-900 placeholder-green-700' : ''}`}
                      />
                      {renderCharacterCount(newJob.company, 'company')}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="department">Department <span className="text-red-500">*</span></Label>
                      <Input
                        id="department"
                        value={newJob.department || ""}
                        onChange={(e) => handleInputChange('department', e.target.value, (value) => setNewJob({ ...newJob, department: value }))}
                        placeholder="Engineering"
                        maxLength={characterLimits.department}
                        className={`${newJob.department ? 'bg-blue-50 border-blue-300 text-blue-900 placeholder-blue-700' : ''}`}
                      />
                      {renderCharacterCount(newJob.department, 'department')}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="internalSPOC">Internal SPOC <span className="text-red-500">*</span></Label>
                      <Input
                        id="internalSPOC"
                        value={newJob.internalSPOC || ""}
                        onChange={(e) => handleInputChange('internalSPOC', e.target.value, (value) => setNewJob({ ...newJob, internalSPOC: value }))}
                        placeholder="Sarah Wilson"
                        required
                        maxLength={characterLimits.internalSPOC}
                        className={`${newJob.internalSPOC ? 'bg-purple-50 border-purple-300 text-purple-900 placeholder-purple-700' : ''}`}
                      />
                      {renderCharacterCount(newJob.internalSPOC, 'internalSPOC')}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="recruiter">Recruiter <span className="text-red-500">*</span></Label>
                      <Input
                        id="recruiter"
                        value={newJob.recruiter || ""}
                        onChange={(e) => handleInputChange('recruiter', e.target.value, (value) => setNewJob({ ...newJob, recruiter: value }))}
                        placeholder="Sarah Wilson"
                        maxLength={characterLimits.recruiter}
                        className={`${newJob.recruiter ? 'bg-orange-50 border-orange-300 text-orange-900 placeholder-orange-700' : ''}`}
                      />
                      {renderCharacterCount(newJob.recruiter, 'recruiter')}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
                      <Input
                        id="email"
                        type="email"
                        value={newJob.email || ""}
                        onChange={(e) => handleInputChange('email', e.target.value, (value) => setNewJob({ ...newJob, email: value }))}
                        placeholder="hr@company.com"
                        required
                        maxLength={characterLimits.email}
                        className={`${newJob.email ? 'bg-indigo-50 border-indigo-300 text-indigo-900 placeholder-indigo-700' : ''}`}
                      />
                      {renderCharacterCount(newJob.email, 'email')}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Job Type & Location</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="jobType">
                        Job Type <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={newJob.jobType || ""}
                        onValueChange={(value) => setNewJob({ ...newJob, jobType: value as JobType | "" })}
                      >
                        <SelectTrigger className={`${newJob.jobType ? 'bg-rose-50 border-rose-300 text-rose-900' : ''}`}>
                          <SelectValue placeholder="Select job type" />
                        </SelectTrigger>
                        <SelectContent>
                          {JOB_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="experience">
                        Experience Level <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={newJob.experience || ""}
                        onValueChange={(value) => setNewJob({ ...newJob, experience: value })}
                      >
                        <SelectTrigger className={`${newJob.experience ? 'bg-violet-50 border-violet-300 text-violet-900' : ''}`}>
                          <SelectValue placeholder="Select experience level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Entry level">Entry Level (0-2 years)</SelectItem>
                          <SelectItem value="Mid level">Mid Level (3-5 years)</SelectItem>
                          <SelectItem value="Senior level">Senior Level (6-10 years)</SelectItem>
                          <SelectItem value="Lead/Principal">Lead/Principal (10+ years)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="country">Country <span className="text-red-500">*</span></Label>
                      <Input
                        id="country"
                        value={newJob.country || ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          setNewJob({ ...newJob, country: value, city: "", location: "" })
                        }}
                        placeholder="Enter country name"
                        required
                        className={`${newJob.country ? 'bg-blue-50 border-blue-300 text-blue-900' : ''}`}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city">City <span className="text-red-500">*</span></Label>
                      <Input
                        id="city"
                        value={newJob.city || ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          const fullLocation = `${value}, ${newJob.country || ""}`
                          setNewJob({
                            ...newJob,
                            city: value,
                            location: fullLocation,
                          })
                        }}
                        placeholder="Enter city name"
                        required
                        className={`${newJob.city ? 'bg-indigo-50 border-indigo-300 text-indigo-900' : ''}`}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location">Full Location <span className="text-red-500">*</span></Label>
                      <Input
                        id="location"
                        value={newJob.location || ""}
                        onChange={(e) => handleInputChange('location', e.target.value, (value) => setNewJob({ ...newJob, location: value }))}
                        placeholder="Enter complete location"
                        required
                        maxLength={characterLimits.location}
                        className={`${newJob.location ? 'bg-teal-50 border-teal-300 text-teal-900 placeholder-teal-700' : ''}`}
                      />
                      {renderCharacterCount(newJob.location, 'location')}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Work Type & Status</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="workType">Work Type <span className="text-red-500">*</span></Label>
                      <Select
                        value={newJob.workType || ""}
                        onValueChange={(value) => setNewJob({ ...newJob, workType: value as "ONSITE" | "REMOTE" | "HYBRID" | "" })}
                      >
                        <SelectTrigger className={`${newJob.workType ? 'bg-orange-50 border-orange-300 text-orange-900' : ''}`}>
                          <SelectValue placeholder="Select work type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ONSITE">On-site</SelectItem>
                          <SelectItem value="REMOTE">Remote</SelectItem>
                          <SelectItem value="HYBRID">Hybrid</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="jobStatus">Job Status <span className="text-red-500">*</span></Label>
                      <Select
                        value={newJob.jobStatus || ""}
                        onValueChange={(value) => setNewJob({ ...newJob, jobStatus: value as "ACTIVE" | "PAUSED" | "CLOSED" | "FILLED" | "" })}
                      >
                        <SelectTrigger className={`${newJob.jobStatus ? 'bg-purple-50 border-purple-300 text-purple-900' : ''}`}>
                          <SelectValue placeholder="Select job status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ACTIVE">Active</SelectItem>
                          <SelectItem value="PAUSED">Paused</SelectItem>
                          <SelectItem value="CLOSED">Closed</SelectItem>
                          <SelectItem value="FILLED">Filled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Salary Information</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="salaryMin">Minimum Salary <span className="text-red-500">*</span></Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                          {newJob.country ? getCurrencyByCountry(newJob.country).symbol : "₹"}
                        </span>
                        <Input
                          id="salaryMin"
                          type="number"
                          value={newJob.salaryMin || ""}
                          onChange={(e) => setNewJob({ ...newJob, salaryMin: e.target.value })}
                          placeholder="50000"
                          className={`${newJob.salaryMin ? 'bg-pink-50 border-pink-300 text-pink-900 placeholder-pink-700' : ''} pl-8`}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="salaryMax">Maximum Salary <span className="text-red-500">*</span></Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                          {newJob.country ? getCurrencyByCountry(newJob.country).symbol : "₹"}
                        </span>
                        <Input
                          id="salaryMax"
                          type="number"
                          value={newJob.salaryMax || ""}
                          onChange={(e) => setNewJob({ ...newJob, salaryMax: e.target.value })}
                          placeholder="120000"
                          className={`${newJob.salaryMax ? 'bg-pink-50 border-pink-300 text-pink-900 placeholder-pink-700' : ''} pl-8`}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="priority">Priority <span className="text-red-500">*</span></Label>
                      <Select
                        value={newJob.priority || ""}
                        onValueChange={(value) => setNewJob({ ...newJob, priority: value as "urgent" | "high" | "medium" | "low" | "" })}
                      >
                        <SelectTrigger className={`${newJob.priority ? 'bg-red-50 border-red-300 text-red-900' : ''}`}>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="urgent">Urgent</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Job Details</h3>
                  <div className="space-y-2">
                    <Label htmlFor="description">Job Description <span className="text-red-500">*</span></Label>
                    <Textarea
                      id="description"
                      value={newJob.description || ""}
                      onChange={(e) => handleInputChange('description', e.target.value, (value) => setNewJob({ ...newJob, description: value }))}
                      placeholder="Describe the role, responsibilities, and what makes this position exciting..."
                      rows={4}
                      required
                      maxLength={characterLimits.description}
                      className={`${newJob.description ? 'bg-emerald-50 border-emerald-300 text-emerald-900 placeholder-emerald-700' : ''}`}
                    />
                    {renderCharacterCount(newJob.description, 'description')}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="requirements">Requirements (one per line) <span className="text-red-500">*</span></Label>
                    <Textarea
                      id="requirements"
                      value={newJob.requirements || ""}
                      onChange={(e) => handleInputChange('requirements', e.target.value, (value) => setNewJob({ ...newJob, requirements: value }))}
                      placeholder="Bachelor's degree in Computer Science&#10;5+ years of experience&#10;Strong communication skills"
                      rows={4}
                      maxLength={characterLimits.requirements}
                      className={`${newJob.requirements ? 'bg-amber-50 border-amber-300 text-amber-900 placeholder-amber-700' : ''}`}
                    />
                    {renderCharacterCount(newJob.requirements, 'requirements')}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="skills">Required Skills (comma-separated) <span className="text-red-500">*</span></Label>
                      <Input
                        id="skills"
                        value={newJob.skills || ""}
                        onChange={(e) => handleInputChange('skills', e.target.value, (value) => setNewJob({ ...newJob, skills: value }))}
                        placeholder="React, Node.js, TypeScript, AWS"
                        maxLength={characterLimits.skills}
                        className={`${newJob.skills ? 'bg-cyan-50 border-cyan-300 text-cyan-900 placeholder-cyan-700' : ''}`}
                      />
                      {renderCharacterCount(newJob.skills, 'skills')}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="benefits">Benefits (comma-separated) <span className="text-red-500">*</span></Label>
                      <Input
                        id="benefits"
                        value={newJob.benefits || ""}
                        onChange={(e) => handleInputChange('benefits', e.target.value, (value) => setNewJob({ ...newJob, benefits: value }))}
                        placeholder="Health Insurance, 401k, Flexible PTO"
                        maxLength={characterLimits.benefits}
                        className={`${newJob.benefits ? 'bg-lime-50 border-lime-300 text-lime-900 placeholder-lime-700' : ''}`}
                      />
                      {renderCharacterCount(newJob.benefits, 'benefits')}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={clearForm} className="text-gray-600 border-gray-300 hover:bg-gray-50">
                  Clear Form
                </Button>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    setIsAddDialogOpen(false)
                    setIsViewDialogOpen(true)
                  }}
                  disabled={!isFormComplete()}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <Eye className="w-4 h-4" />
                  <span>View & Finalize</span>
                </Button>
              </div>
              
              {/* Form completion indicator */}
              <div className="mt-3 text-center">
                {!isFormComplete() ? (
                  <p className="text-sm text-amber-600 flex items-center justify-center space-x-2">
                    <AlertCircle className="w-4 h-4" />
                    <span>Complete all required fields to enable the View & Finalize button</span>
                  </p>
                ) : (
                  <p className="text-sm text-green-600 flex items-center justify-center space-x-2">
                    <CheckCircle className="w-4 h-4" />
                    <span>All required fields completed! You can now review and finalize your job posting.</span>
                  </p>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>

          {/* Edit Job Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Job Posting</DialogTitle>
                <DialogDescription>
                  Update the details for this job posting
                </DialogDescription>
              </DialogHeader>

              {editingJob && (
                <div className="grid gap-6 py-4">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Basic Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-title">Job Title <span className="text-red-500">*</span></Label>
                        <Input
                          id="edit-title"
                          value={editingJob.title}
                          onChange={(e) => handleInputChange('title', e.target.value, (value) => setEditingJob({ ...editingJob, title: value }))}
                          placeholder="Senior Software Engineer"
                          required
                          maxLength={characterLimits.title}
                        />
                        {renderCharacterCount(editingJob.title, 'title')}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-company">Company <span className="text-red-500">*</span></Label>
                        <Input
                          id="edit-company"
                          value={editingJob.company}
                          onChange={(e) => handleInputChange('company', e.target.value, (value) => setEditingJob({ ...editingJob, company: value }))}
                          placeholder="TechCorp Inc."
                          required
                          maxLength={characterLimits.company}
                        />
                        {renderCharacterCount(editingJob.company, 'company')}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-department">Department <span className="text-red-500">*</span></Label>
                        <Input
                          id="edit-department"
                          value={editingJob.department}
                          onChange={(e) => handleInputChange('department', e.target.value, (value) => setEditingJob({ ...editingJob, department: value }))}
                          placeholder="Engineering"
                          maxLength={characterLimits.department}
                        />
                        {renderCharacterCount(editingJob.department, 'department')}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-internalSPOC">Internal SPOC <span className="text-red-500">*</span></Label>
                        <Input
                          id="edit-internalSPOC"
                          value={editingJob.internalSPOC}
                          onChange={(e) => handleInputChange('internalSPOC', e.target.value, (value) => setEditingJob({ ...editingJob, internalSPOC: value }))}
                          placeholder="Sarah Wilson"
                          required
                          maxLength={characterLimits.internalSPOC}
                        />
                        {renderCharacterCount(editingJob.internalSPOC, 'internalSPOC')}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-recruiter">Recruiter <span className="text-red-500">*</span></Label>
                        <Input
                          id="edit-recruiter"
                          value={editingJob.recruiter}
                          onChange={(e) => handleInputChange('recruiter', e.target.value, (value) => setEditingJob({ ...editingJob, recruiter: value }))}
                          placeholder="Sarah Wilson"
                          maxLength={characterLimits.recruiter}
                        />
                        {renderCharacterCount(editingJob.recruiter, 'recruiter')}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-email">Email <span className="text-red-500">*</span></Label>
                        <Input
                          id="edit-email"
                          type="email"
                          value={editingJob.email}
                          onChange={(e) => handleInputChange('email', e.target.value, (value) => setEditingJob({ ...editingJob, email: value }))}
                          placeholder="hr@company.com"
                          required
                          maxLength={characterLimits.email}
                        />
                        {renderCharacterCount(editingJob.email, 'email')}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Job Type & Location</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-jobType">Job Type <span className="text-red-500">*</span></Label>
                        <Select
                          value={editingJob.jobType}
                          onValueChange={(value) => setEditingJob({ ...editingJob, jobType: value as JobType })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select job type" />
                          </SelectTrigger>
                          <SelectContent>
                            {JOB_TYPES.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-experience">Experience Level <span className="text-red-500">*</span></Label>
                        <Select
                          value={editingJob.experience}
                          onValueChange={(value) => setEditingJob({ ...editingJob, experience: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select experience level" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Entry level">Entry Level (0-2 years)</SelectItem>
                            <SelectItem value="Mid level">Mid Level (3-5 years)</SelectItem>
                            <SelectItem value="Senior level">Senior Level (6-10 years)</SelectItem>
                            <SelectItem value="Lead/Principal">Lead/Principal (10+ years)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-country">Country <span className="text-red-500">*</span></Label>
                        <Input
                          id="edit-country"
                          value={editingJob.country}
                          onChange={(e) => {
                            const value = e.target.value;
                            setEditingJob({ ...editingJob, country: value, city: "", location: "" })
                          }}
                          placeholder="Enter country name"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-city">City <span className="text-red-500">*</span></Label>
                        <Input
                          id="edit-city"
                          value={editingJob.city}
                          onChange={(e) => {
                            const value = e.target.value;
                            const fullLocation = `${value}, ${editingJob.country || ""}`
                            setEditingJob({
                              ...editingJob,
                              city: value,
                              location: fullLocation,
                            })
                          }}
                          placeholder="Enter city name"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-location">Full Location <span className="text-red-500">*</span></Label>
                        <Input
                          id="edit-location"
                          value={editingJob.location}
                          onChange={(e) => setEditingJob({ ...editingJob, location: e.target.value })}
                          placeholder="Enter complete location"
                          required
                        />
                        {renderCharacterCount(editingJob.location, 'location')}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Work Type & Status</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-workType">Work Type <span className="text-red-500">*</span></Label>
                        <Select
                          value={editingJob.workType}
                          onValueChange={(value) => setEditingJob({ ...editingJob, workType: value as "ONSITE" | "REMOTE" | "HYBRID" })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select work type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ONSITE">On-site</SelectItem>
                            <SelectItem value="REMOTE">Remote</SelectItem>
                            <SelectItem value="HYBRID">Hybrid</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-jobStatus">Job Status <span className="text-red-500">*</span></Label>
                        <Select
                          value={editingJob.jobStatus}
                          onValueChange={(value) => setEditingJob({ ...editingJob, jobStatus: value as "ACTIVE" | "PAUSED" | "CLOSED" | "FILLED" })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select job status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ACTIVE">Active</SelectItem>
                            <SelectItem value="PAUSED">Paused</SelectItem>
                            <SelectItem value="CLOSED">Closed</SelectItem>
                            <SelectItem value="FILLED">Filled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Salary Information</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-salaryMin">Minimum Salary <span className="text-red-500">*</span></Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                            {editingJob.country ? getCurrencyByCountry(editingJob.country).symbol : "₹"}
                          </span>
                          <Input
                            id="edit-salaryMin"
                            type="number"
                            value={editingJob.salaryMin}
                            onChange={(e) => setEditingJob({ ...editingJob, salaryMin: Number(e.target.value) })}
                            placeholder="50000"
                            className="pl-8"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-salaryMax">Maximum Salary <span className="text-red-500">*</span></Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                            {editingJob.country ? getCurrencyByCountry(editingJob.country).symbol : "₹"}
                          </span>
                          <Input
                            id="edit-salaryMax"
                            type="number"
                            value={editingJob.salaryMax}
                            onChange={(e) => setEditingJob({ ...editingJob, salaryMax: Number(e.target.value) })}
                            placeholder="120000"
                            className="pl-8"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-priority">Priority <span className="text-red-500">*</span></Label>
                        <Select
                          value={editingJob.priority}
                          onValueChange={(value) => setEditingJob({ ...editingJob, priority: value as "urgent" | "high" | "medium" | "low" })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="urgent">Urgent</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Job Details</h3>
                    <div className="space-y-2">
                      <Label htmlFor="edit-description">Job Description <span className="text-red-500">*</span></Label>
                      <Textarea
                        id="edit-description"
                        value={editingJob.description}
                        onChange={(e) => setEditingJob({ ...editingJob, description: e.target.value })}
                        placeholder="Describe the role, responsibilities, and what makes this position exciting..."
                        rows={4}
                        required
                      />
                      {renderCharacterCount(editingJob.description, 'description')}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-requirements">Requirements (one per line) <span className="text-red-500">*</span></Label>
                      <Textarea
                        id="edit-requirements"
                        value={editingJob.requirements.join('\n')}
                        onChange={(e) => setEditingJob({ ...editingJob, requirements: e.target.value.split('\n').filter(r => r.trim()) })}
                        placeholder="Bachelor's degree in Computer Science&#10;5+ years of experience&#10;Strong communication skills"
                        rows={4}
                      />
                      {renderCharacterCount(editingJob.requirements.join('\n'), 'requirements')}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-skills">Required Skills (comma-separated) <span className="text-red-500">*</span></Label>
                        <Input
                          id="edit-skills"
                          value={editingJob.skills.join(', ')}
                          onChange={(e) => setEditingJob({ ...editingJob, skills: e.target.value.split(',').map(s => s.trim()).filter(s => s) })}
                          placeholder="React, Node.js, TypeScript, AWS"
                        />
                        {renderCharacterCount(editingJob.skills.join(', '), 'skills')}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-benefits">Benefits (comma-separated) <span className="text-red-500">*</span></Label>
                        <Input
                          id="edit-benefits"
                          value={editingJob.benefits.join(', ')}
                          onChange={(e) => setEditingJob({ ...editingJob, benefits: e.target.value.split(',').map(b => b.trim()).filter(b => b) })}
                          placeholder="Health Insurance, 401k, Flexible PTO"
                        />
                        {renderCharacterCount(editingJob.benefits.join(', '), 'benefits')}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleEditJob}
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={!editingJob || !editingJob.title || !editingJob.company || !editingJob.country || !editingJob.city || !editingJob.description || isPostingJob}
                >
                  {isPostingJob ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Updating Job...
                    </>
                  ) : (
                    'Update Job Posting'
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* View & Finalize Job Posting Dialog */}
      <ViewFinalizeJobPosting
        isOpen={isViewDialogOpen}
        onClose={() => setIsViewDialogOpen(false)}
        onBack={handleBackFromView}
        onFinalize={handleFinalizeJob}
        jobData={newJob}
        isFinalizing={isPostingJob}
      />

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between"></div>
        </CardHeader>
        <CardContent>
          <Tabs value={viewMode} onValueChange={setViewMode} className="space-y-4">
            <TabsList className="grid w-full grid-cols-1">
              <TabsTrigger value="all">All Jobs</TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              {isLoadingJobs ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Loading jobs...</h3>
                  <p className="text-gray-500">Fetching job postings from the server</p>
                </div>
              ) : filteredJobs.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No job postings found</h3>
                  <p className="text-gray-500 mb-4">
                    {jobPostings.length === 0
                      ? "No job postings have been created yet."
                      : "Try adjusting your search filters to see more results."}
                  </p>
                  <Button onClick={() => { setIsAddDialogOpen(true); resetAIStates(); }} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Job Posting
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">{filteredJobs.map(renderJobCard)}</div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Custom Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <AlertCircle className="w-6 h-6 text-red-500" />
              <span>Confirm Deletion</span>
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this job posting? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          {jobToDelete && (
            <div className="space-y-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="font-semibold text-red-800">{jobToDelete.title}</h4>
                <p className="text-sm text-red-600">{jobToDelete.company}</p>
                <p className="text-sm text-red-600">{jobToDelete.location}</p>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDeleteConfirm(false)
                    setJobToDelete(null)
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={confirmDeleteJob}
                  disabled={isDeletingJob}
                >
                  {isDeletingJob ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Job
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Custom Copy Success Popup */}
      {showCopySuccess && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className="bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg border border-green-400 animate-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-green-100" />
              <div>
                <h4 className="font-semibold">Link Copied!</h4>
                <p className="text-sm text-green-100">Job application link copied to clipboard</p>
                <p className="text-xs text-green-200 mt-1 break-all max-w-xs">
                  {copiedLink}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCopySuccess(false)}
                className="text-green-100 hover:text-white hover:bg-green-600 ml-2"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Dropdown Change Notification Popup */}
      {showDropdownNotification && dropdownNotificationData && (
        <div className="fixed bottom-4 left-4 z-50">
          <div className="bg-blue-500 text-white px-6 py-4 rounded-lg shadow-lg border border-blue-400 animate-in slide-in-from-bottom-2 duration-300 max-w-md">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-400 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm">Field Updated!</h4>
                <p className="text-xs text-blue-100 mt-1">
                  <span className="font-medium">{dropdownNotificationData.field}</span> changed from{' '}
                  <span className="font-medium text-blue-200">{dropdownNotificationData.oldValue}</span> to{' '}
                  <span className="font-medium text-blue-200">{dropdownNotificationData.newValue}</span>
                </p>
                <p className="text-xs text-blue-200 mt-1 truncate">
                  Job: {dropdownNotificationData.jobTitle}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDropdownNotification(false)}
                className="text-blue-100 hover:text-white hover:bg-blue-600 ml-2 flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Min Score Details Dialog - Landscape View */}
      <Dialog open={isMinScoreDialogOpen} onOpenChange={setIsMinScoreDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-blue-600" />
              <span>Min Score Filter - How It Works</span>
            </DialogTitle>
            <DialogDescription>
              Understanding the minimum similarity score for candidate matching
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Current Setting - Full Width */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-blue-800 mb-2">Current Setting</h3>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-blue-700">Min Score:</span>
                <span className="text-lg font-bold text-blue-900">{newJob.minScore}</span>
                <span className="text-sm text-blue-600">({(parseFloat(newJob.minScore) * 100).toFixed(0)}% similarity)</span>
              </div>
            </div>

            {/* Main Content - 3 Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - How It Works */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-800">How Min Score Works</h3>
                
                <div className="space-y-3">
                  <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                    <h4 className="font-medium text-green-800 mb-1">🎯 Pure Embedding Similarity</h4>
                    <p className="text-xs text-green-700">
                      Uses AI embeddings to compare job requirements with candidate skills and experience. 
                      Higher scores mean better matches.
                    </p>
                  </div>
                  
                  <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                    <h4 className="font-medium text-orange-800 mb-1">📊 Score Range</h4>
                    <p className="text-xs text-orange-700">
                      Scores range from 0.0 (no match) to 1.0 (perfect match). 
                      Only candidates above your threshold will be shown.
                    </p>
                  </div>
                </div>
              </div>

              {/* Middle Column - Score Examples */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-800">Score Examples</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <span className="text-xs font-medium">0.9 - 1.0</span>
                    <span className="text-xs text-green-600">Excellent Match</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <span className="text-xs font-medium">0.7 - 0.9</span>
                    <span className="text-xs text-blue-600">Good Match</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <span className="text-xs font-medium">0.5 - 0.7</span>
                    <span className="text-xs text-yellow-600">Moderate Match</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <span className="text-xs font-medium">0.3 - 0.5</span>
                    <span className="text-xs text-orange-600">Weak Match</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <span className="text-xs font-medium">0.0 - 0.3</span>
                    <span className="text-xs text-red-600">Poor Match</span>
                  </div>
                </div>
              </div>

              {/* Right Column - Recommendations & Usage */}
              <div className="space-y-4">
                <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                  <h3 className="font-semibold text-purple-800 mb-2 text-sm">💡 Recommendations</h3>
                  <ul className="text-xs text-purple-700 space-y-1">
                    <li>• <strong>0.1-0.3:</strong> Cast a wide net, get many candidates</li>
                    <li>• <strong>0.4-0.6:</strong> Balanced approach, good quality candidates</li>
                    <li>• <strong>0.7-0.9:</strong> High quality, fewer but better matches</li>
                    <li>• <strong>0.9+:</strong> Very strict, only top-tier candidates</li>
                  </ul>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-2 text-sm">🚀 How to Use</h3>
                  <ol className="text-xs text-gray-700 space-y-1 list-decimal list-inside">
                    <li>Set your desired minimum score (0.0 - 1.0)</li>
                    <li>Click "Create Job Posting" to create the job</li>
                    <li>Click "Internal" button on job cards to see matching candidates</li>
                    <li>The candidate count will show on the Internal button</li>
                    <li>Adjust the score and create new jobs to see different results</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <Button onClick={() => setIsMinScoreDialogOpen(false)}>
              Got it!
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
