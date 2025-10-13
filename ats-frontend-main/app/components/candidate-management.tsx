"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Label } from "../../components/ui/label"
import { Textarea } from "../../components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { Badge } from "../../components/ui/badge"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table"
import {
  Plus,
  Upload,
  MapPin,
  IndianRupee,
  Phone,
  Mail,
  Calendar,
  Briefcase,
  Building2,
  User as UserIcon,
  Edit,
  MessageSquare,
  Globe,
  AlertCircle,
  Brain,
  Search,
  X,
  RefreshCw,
  ChevronDown,
  Eye,
  Trash2,
} from "lucide-react"
import { isDateInRange } from "../../lib/date-utils"
import { DateFilter } from "../../components/date-filter"
import { AdvancedSearch, type SearchFilters } from "../../components/advanced-search"
import {
  JOB_TYPES,
  formatSalary,
  type JobType,
  COUNTRIES,
  getCitiesByCountry,
  getSalaryPlaceholder,
} from "../../lib/location-data"
// import AICandidateAnalysis from "./ai-candidate-analysis"
import type { AIAnalysis, User } from "../../lib/auth-utils"
// Import the auth utilities
import { getAccessibleUserIds } from "../../lib/auth-utils"
import BASE_API_URL from "../../BaseUrlApi"
import { useToast } from "../../hooks/use-toast"

// Industry-standard pipeline statuses
const PIPELINE_STATUSES = [
  { key: "new", label: "New Application", color: "bg-blue-100 text-blue-800 border-blue-200" },
  { key: "screening", label: "Initial Screening", color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  { key: "phone-screen", label: "Phone Screening", color: "bg-orange-100 text-orange-800 border-orange-200" },
  { key: "assessment", label: "Skills Assessment", color: "bg-purple-100 text-purple-800 border-purple-200" },
  { key: "interview-1", label: "First Interview", color: "bg-indigo-100 text-indigo-800 border-indigo-200" },
  { key: "interview-2", label: "Second Interview", color: "bg-violet-100 text-violet-800 border-violet-200" },
  { key: "final-interview", label: "Final Interview", color: "bg-pink-100 text-pink-800 border-pink-200" },
  { key: "reference-check", label: "Reference Check", color: "bg-cyan-100 text-cyan-800 border-cyan-200" },
  { key: "offer-preparation", label: "Offer Preparation", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  { key: "offer-sent", label: "Offer Sent", color: "bg-green-100 text-green-800 border-green-200" },
  { key: "offer-negotiation", label: "Offer Negotiation", color: "bg-lime-100 text-lime-800 border-lime-200" },
  { key: "offer-accepted", label: "Offer Accepted", color: "bg-teal-100 text-teal-800 border-teal-200" },
  { key: "background-check", label: "Background Check", color: "bg-sky-100 text-sky-800 border-sky-200" },
  { key: "hired", label: "Hired", color: "bg-green-200 text-green-900 border-green-300" },
  { key: "rejected", label: "Rejected", color: "bg-red-100 text-red-800 border-red-200" },
  { key: "withdrawn", label: "Withdrawn", color: "bg-gray-100 text-gray-800 border-gray-200" },
  { key: "on-hold", label: "On Hold", color: "bg-amber-100 text-amber-800 border-amber-200" },
]

interface AppliedJob {
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
}



interface Candidate {
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
  resumeDownloadUrl: string
  totalApplications: number
  appliedJobs: AppliedJob[]
  recruiterId: string
  recruiterName: string
  source: string
  jobId?: string
}

interface ApiResponse {
  success: boolean
  totalCandidates: number
  totalApplications: number
  candidates: Candidate[]
  timestamp: string
}

const formatDateDDMMMYYYY = (dateString: string) => {
  const date = new Date(dateString)
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const day = date.getDate().toString().padStart(2, "0")
  const month = months[date.getMonth()]
  const year = date.getFullYear()
  return `${day}-${month}-${year}`
}



export default function CandidateManagement({ setActiveTab, showQuickActions, setShowQuickActions }: {
  setActiveTab: (tab: string) => void;
  showQuickActions: boolean;
  setShowQuickActions: (show: boolean) => void;
}) {
  const { toast } = useToast()
  const [statusFilter, setStatusFilter] = useState("all")

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [viewingCandidate, setViewingCandidate] = useState<Candidate | null>(null)
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
  const [expandedCandidateId, setExpandedCandidateId] = useState<number | null>(null)
  const [dateFilter, setDateFilter] = useState("all")
  const [viewMode, setViewMode] = useState("all")
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false)
  const [aiAnalysis, setAiAnalysis] = useState<Record<string, AIAnalysis>>({})
  const [showAiAnalysis, setShowAiAnalysis] = useState<string | null>(null)
  const [fullDataModal, setFullDataModal] = useState<{isOpen: boolean, data: string, title: string}>({
    isOpen: false,
    data: '',
    title: ''
  })
  const [selectedJobForStatus, setSelectedJobForStatus] = useState<AppliedJob | null>(null)
  const [showStatusUpdateDialog, setShowStatusUpdateDialog] = useState(false)
  const [selectedCandidateForJobs, setSelectedCandidateForJobs] = useState<Candidate | null>(null)
  const [showJobsModal, setShowJobsModal] = useState(false)
  const [jobFilterSearch, setJobFilterSearch] = useState("")
  const [jobFilterStatus, setJobFilterStatus] = useState("all")
  const [jobFilterPriority, setJobFilterPriority] = useState("all")
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalCandidates, setTotalCandidates] = useState(0)
  const [totalApplications, setTotalApplications] = useState(0)
  
  // Delete candidate states
  const [candidateToDelete, setCandidateToDelete] = useState<Candidate | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Search states for dropdowns
  const [jobTypeSearch, setJobTypeSearch] = useState("")
  const [experienceSearch, setExperienceSearch] = useState("")
  const [locationSearch, setLocationSearch] = useState("")
  const [statusSearch, setStatusSearch] = useState("")

  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    searchTerm: "",
    jobType: "",
    experience: "",
    country: "",
    city: "",
    salaryMin: "",
    salaryMax: "",
    skills: [],
    status: "",
    priority: "",
    source: "",
  })

  const [lastUpdated, setLastUpdated] = useState("")
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    setLastUpdated(new Date().toLocaleString())
  }, [])

  // Filter functions for dropdowns
  const getFilteredJobTypes = () => {
    if (!jobTypeSearch) return JOB_TYPES
    return JOB_TYPES.filter(type => 
      type.label.toLowerCase().includes(jobTypeSearch.toLowerCase())
    )
  }

  const getFilteredExperienceLevels = () => {
    const levels = [
      { value: "entry", label: "Entry Level" },
      { value: "mid", label: "Mid Level" },
      { value: "senior", label: "Senior Level" },
      { value: "lead", label: "Lead/Principal" }
    ]
    if (!experienceSearch) return levels
    return levels.filter(level => 
      level.label.toLowerCase().includes(experienceSearch.toLowerCase())
    )
  }

  const getFilteredLocations = () => {
    if (!locationSearch) return COUNTRIES
    return COUNTRIES.filter(country => 
      country.name.toLowerCase().includes(locationSearch.toLowerCase()) ||
      country.cities.some(city => 
        city.toLowerCase().includes(locationSearch.toLowerCase())
      )
    )
  }

  const getFilteredStatuses = () => {
    if (!statusSearch) return PIPELINE_STATUSES
    return PIPELINE_STATUSES.filter(status => 
      status.label.toLowerCase().includes(statusSearch.toLowerCase())
    )
  }

  // Clear search terms when dropdowns are closed
  const clearSearchTerms = () => {
    setJobTypeSearch("")
    setExperienceSearch("")
    setLocationSearch("")
    setStatusSearch("")
  }

  // Update candidate status API function
  const updateCandidateStatus = async (candidateId: number, jobId: number, newStatus: string) => {
    try {
      // Convert status key to label for backend
      const statusLabel = getStatusInfo(newStatus).label

      // Optimistically update the UI first
      setCandidates(prevCandidates => 
        prevCandidates.map(candidate => 
          candidate.id === candidateId 
            ? { 
                ...candidate, 
                status: newStatus,
                appliedJobs: candidate.appliedJobs.map(job => 
                  job.job.id === jobId 
                    ? { ...job, applicationStatus: newStatus }
                    : job
                )
              }
            : candidate
        )
      )

      // Get token from localStorage
      const user = JSON.parse(localStorage.getItem('ats_user') || 'null');
      const token = user?.token;
      
      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }

      const response = await fetch(`${BASE_API_URL}/pipeline/update-status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          candidateId,
          jobId,
          status: statusLabel // Send the label to backend
        })
      })

      const data = await response.json()

      if (data.success) {
        // Success - the optimistic update was correct
        toast({
          title: "✅ Status Updated Successfully",
          description: `Candidate status changed to "${statusLabel}"`,
          variant: "success",
        })
        
        // Refresh the data to ensure consistency
        await fetchCandidates()
      } else {
        // Revert the optimistic update on error
        setCandidates(prevCandidates => 
          prevCandidates.map(candidate => 
            candidate.id === candidateId 
              ? { ...candidate, status: candidate.status } // Revert to original status
              : candidate
          )
        )
        toast({
          title: "❌ Update Failed",
          description: data.message || "Failed to update candidate status",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error updating candidate status:', error)
      // Revert the optimistic update on error
      setCandidates(prevCandidates => 
        prevCandidates.map(candidate => 
          candidate.id === candidateId 
            ? { ...candidate, status: candidate.status } // Revert to original status
            : candidate
        )
      )
      toast({
        title: "⚠️ Network Error",
        description: "Failed to update candidate status. Please try again.",
        variant: "warning",
      })
    }
  }

  // Component for truncated text with view functionality
  const TruncatedText = ({ text, maxLength = 20, title = "Full Data" }: { text: string, maxLength?: number, title?: string }) => {
    const isTruncated = text.length > maxLength
    
    const handleViewFull = () => {
      setFullDataModal({
        isOpen: true,
        data: text,
        title: title
      })
    }

    return (
      <div className="flex items-center space-x-1">
        <span className="truncate">{isTruncated ? text.substring(0, maxLength) + '...' : text}</span>
        {isTruncated && (
          <button
            onClick={handleViewFull}
            className="flex-shrink-0 p-1 hover:bg-gray-100 rounded transition-colors"
            title="View full data"
          >
            <Eye className="w-3 h-3 text-blue-600" />
          </button>
        )}
      </div>
    )
  }

  // Fetch candidates from API
  const fetchCandidates = async () => {
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
      
      const url = new URL(`${BASE_API_URL}/candidates/all`);
      if (companyId) {
        url.searchParams.set('companyId', companyId.toString());
      }
      
      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      })
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data: ApiResponse = await response.json()
      
      if (data.success) {
        setCandidates(data.candidates)
        setTotalCandidates(data.totalCandidates)
        setTotalApplications(data.totalApplications)
      } else {
        throw new Error('Failed to fetch candidates')
      }
    } catch (err) {
      console.error('Error fetching candidates:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch candidates')
      
      // Add mock candidate "Amir Khan" with multiple applications when API fails
      const mockAmirKhan: Candidate = {
        id: 999,
        fullName: "FaizUrRahmanKhanFaizurRahmanhe",
        firstName: "FaizUrRahman",
        lastName: "KhanFaizurRahmanhe",
        email: "workspacefaizurrahmankhanfaizurrahmanhe@appitsoftware.com",
        phone: "+1-555-0199",
        currentLocation: "Mumbai, India",
        keySkills: "Oracle, PL/SQL, React, JavaScript, NodeScript, AWS, Docker",
        salaryExpectation: 95000,
        noticePeriod: "1 month",
        yearsOfExperience: "6 years",
        remoteWork: true,
        startDate: "2024-02-15",
        portfolioUrl: "https://amirkhan.dev",
        status: "screening",
        appliedAt: "2024-01-20",
        updatedAt: "2024-01-22",
        resumeDownloadUrl: "https://example.com/resumes/amir-khan-resume.pdf",
        totalApplications: 2,
        recruiterId: "1",
        recruiterName: "Sarah Wilson",
        source: "website",
        appliedJobs: [
          {
            applicationId: 1001,
            applicationStatus: "active",
            appliedAt: "2024-01-20",
            job: {
              id: 101,
              title: "Senior Oracle Developer with Advanced Database Management",
              company: "TechCorp International Solutions Ltd.",
              city: "San Francisco",
              jobType: "full-time",
              experienceLevel: "senior",
              workType: "hybrid",
              jobStatus: "active",
              salaryMin: 90000,
              salaryMax: 130000,
              priority: "high",
              createdAt: "2024-01-15"
            }
          },
          {
            applicationId: 1002,
            applicationStatus: "active",
            appliedAt: "2024-01-22",
            job: {
              id: 102,
              title: "React Frontend Developer with TypeScript",
              company: "StartupXYZ Technologies",
              city: "New York",
              jobType: "full-time",
              experienceLevel: "senior",
              workType: "remote",
              jobStatus: "active",
              salaryMin: 85000,
              salaryMax: 120000,
              priority: "medium",
              createdAt: "2024-01-10"
            }
          }
        ]
      }
      
      // Add more mock candidates for better testing
      const mockSarahWilson: Candidate = {
        id: 998,
        fullName: "Sarah Wilson",
        firstName: "Sarah",
        lastName: "Wilson",
        email: "sarah.wilson@techcompany.com",
        phone: "+1-555-0123",
        currentLocation: "New York, NY, United States",
        keySkills: "React, TypeScript, Node.js, AWS, Docker, Kubernetes, GraphQL",
        salaryExpectation: 120000,
        noticePeriod: "2 weeks",
        yearsOfExperience: "8 years",
        remoteWork: true,
        startDate: "2024-03-01",
        portfolioUrl: "https://sarahwilson.dev",
        status: "interview-1",
        appliedAt: "2024-01-15",
        updatedAt: "2024-01-18",
        resumeDownloadUrl: "https://example.com/resumes/sarah-wilson-resume.pdf",
        totalApplications: 1,
        recruiterId: "2",
        recruiterName: "Mike Johnson",
        source: "linkedin",
        appliedJobs: [
          {
            applicationId: 1003,
            applicationStatus: "active",
            appliedAt: "2024-01-15",
            job: {
              id: 103,
              title: "Senior Full Stack Developer",
              company: "Innovation Labs",
              city: "New York",
              jobType: "full-time",
              experienceLevel: "senior",
              workType: "remote",
              jobStatus: "active",
              salaryMin: 110000,
              salaryMax: 150000,
              priority: "high",
              createdAt: "2024-01-10"
            }
          }
        ]
      }

      const mockDavidChen: Candidate = {
        id: 997,
        fullName: "David Chen",
        firstName: "David",
        lastName: "Chen",
        email: "david.chen@startup.io",
        phone: "+1-555-0456",
        currentLocation: "San Francisco, CA, United States",
        keySkills: "Python, Django, Flask, PostgreSQL, Redis, Celery, AWS, Docker",
        salaryExpectation: 140000,
        noticePeriod: "1 month",
        yearsOfExperience: "10 years",
        remoteWork: false,
        startDate: "2024-02-01",
        portfolioUrl: "https://davidchen.tech",
        status: "hired",
        appliedAt: "2024-01-10",
        updatedAt: "2024-01-25",
        resumeDownloadUrl: "https://example.com/resumes/david-chen-resume.pdf",
        totalApplications: 1,
        recruiterId: "3",
        recruiterName: "Emily Chen",
        source: "referral",
        appliedJobs: [
          {
            applicationId: 1004,
            applicationStatus: "active",
            appliedAt: "2024-01-10",
            job: {
              id: 104,
              title: "Lead Backend Engineer",
              company: "DataFlow Solutions",
              city: "San Francisco",
              jobType: "full-time",
              experienceLevel: "lead",
              workType: "hybrid",
              jobStatus: "active",
              salaryMin: 130000,
              salaryMax: 180000,
              priority: "high",
              createdAt: "2024-01-05"
            }
          }
        ]
      }

      // Add a candidate with Hyderabad location to test location filter
      const mockHyderabadCandidate: Candidate = {
        id: 996,
        fullName: "Priya Sharma",
        firstName: "Priya",
        lastName: "Sharma",
        email: "priya.sharma@techcompany.in",
        phone: "+91-98765-43210",
        currentLocation: "Hyderabad, Telangana, India",
        keySkills: "React, TypeScript, Node.js, MongoDB, Express, AWS, Docker, Kubernetes",
        salaryExpectation: 85000,
        noticePeriod: "1 month",
        yearsOfExperience: "5 years",
        remoteWork: true,
        startDate: "2024-03-15",
        portfolioUrl: "https://priyasharma.dev",
        status: "new",
        appliedAt: "2024-01-25",
        updatedAt: "2024-01-25",
        resumeDownloadUrl: "https://example.com/resumes/priya-sharma-resume.pdf",
        totalApplications: 1,
        recruiterId: "4",
        recruiterName: "David Brown",
        source: "recruiter",
        appliedJobs: [
          {
            applicationId: 1005,
            applicationStatus: "active",
            appliedAt: "2024-01-25",
            job: {
              id: 105,
              title: "Full Stack Developer",
              company: "TechCorp India",
              city: "Hyderabad",
              jobType: "full-time",
              experienceLevel: "mid",
              workType: "hybrid",
              jobStatus: "active",
              salaryMin: 70000,
              salaryMax: 100000,
              priority: "medium",
              createdAt: "2024-01-20"
            }
          }
        ]
      }
      
      setCandidates([mockAmirKhan, mockSarahWilson, mockDavidChen, mockHyderabadCandidate])
      setTotalCandidates(4)
      setTotalApplications(5)
    } finally {
      setLoading(false)
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
      setTotalCandidates(prev => prev - 1);

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

  // Fetch candidates on component mount
  useEffect(() => {
    fetchCandidates()
  }, [])

  // Check URL parameters on component mount to pre-fill filters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const jobId = urlParams.get("jobId")
    const jobTitle = urlParams.get("jobTitle")
    const skills = urlParams.get("skills")
    const searchTerm = urlParams.get("searchTerm")

    if (jobId || jobTitle || skills || searchTerm) {
      setSearchFilters((prev) => ({
        ...prev,
        searchTerm: searchTerm || jobTitle || "",
        skills: skills ? skills.split(",").map((s) => s.trim()) : prev.skills,
      }))

      // If we have job-specific filters, show a notification
      if (jobTitle) {
        // You could show a toast notification here
        console.log(`Filtering candidates for job: ${jobTitle}`)
      }
    }
  }, [])

  // Mock job postings data with job types and locations
  const jobPostings = [
    {
      id: "1",
      title: "Senior Software Engineer",
      customerName: "TechCorp Inc.",
      spoc: "Sarah Wilson",
      jobType: "full-time" as JobType,
      country: "US",
      city: "San Francisco",
    },
    {
      id: "2",
      title: "Marketing Manager",
      customerName: "StartupXYZ",
      spoc: "Mike Johnson",
      jobType: "full-time" as JobType,
      country: "US",
      city: "New York",
    },
    {
      id: "3",
      title: "Freelance Web Designer",
      customerName: "DataFlow Solutions",
      spoc: "Emily Chen",
      jobType: "freelance" as JobType,
      country: "US",
      city: "Austin",
    },
    {
      id: "4",
      title: "Part-time Data Analyst",
      customerName: "GlobalTech Ltd",
      spoc: "James Smith",
      jobType: "part-time" as JobType,
      country: "CA",
      city: "Toronto",
    },
  ]

  const recruiters = [
    { id: "1", name: "Sarah Wilson" },
    { id: "2", name: "Mike Johnson" },
    { id: "3", name: "Emily Chen" },
    { id: "4", name: "David Brown" },
  ]





  // Mock user data for role-based access control
  const currentUser: User = {
    id: "1",
    username: "manager1",
    email: "manager@company.com",
    firstName: "John",
    lastName: "Manager",
    role: "manager",
    status: "active",
    createdDate: "2024-01-01",
    lastLogin: "2024-01-15",
    permissions: [],
    teamIds: ["team1"]
  }

  // Add role-based filtering for candidates
  const getFilteredCandidates = () => {
    if (currentUser.role === "admin") {
      return candidates // Admin sees all candidates
    }

    if (currentUser.role === "manager") {
      // Manager sees candidates assigned to their team members
      const accessibleUserIds = getAccessibleUserIds(currentUser, [
        // Mock users data - in real app this would come from props or context
        {
          id: "1",
          username: "user1",
          email: "user1@company.com",
          firstName: "User",
          lastName: "One",
          role: "user",
          status: "active",
          createdDate: "2024-01-01",
          lastLogin: "2024-01-15",
          permissions: [],
          managerId: currentUser.id,
          teamIds: ["team1"]
        },
        {
          id: "2",
          username: "user2",
          email: "user2@company.com",
          firstName: "User",
          lastName: "Two",
          role: "user",
          status: "active",
          createdDate: "2024-01-01",
          lastLogin: "2024-01-15",
          permissions: [],
          managerId: currentUser.id,
          teamIds: ["team1"]
        },
        {
          id: "3",
          username: "user3",
          email: "user3@company.com",
          firstName: "User",
          lastName: "Three",
          role: "user",
          status: "active",
          createdDate: "2024-01-01",
          lastLogin: "2024-01-15",
          permissions: [],
          managerId: "other",
          teamIds: ["team2"]
        },
      ])
      return candidates.filter((candidate) => accessibleUserIds.includes(candidate.recruiterId))
    }

    if (currentUser.role === "user") {
      // Users see only their own candidates
      return candidates.filter((candidate) => candidate.recruiterId === currentUser.id)
    }

    return candidates
  }

  // Update the filteredCandidates to work with API data
  const filteredCandidates = candidates.filter((candidate) => {
    console.debug(`[filter] checking candidate: ${candidate.fullName}`)

    const matchesSearch =
      !searchFilters.searchTerm ||
      candidate.fullName.toLowerCase().includes(searchFilters.searchTerm.toLowerCase()) ||
      candidate.email.toLowerCase().includes(searchFilters.searchTerm.toLowerCase()) ||
      candidate.keySkills.toLowerCase().includes(searchFilters.searchTerm.toLowerCase()) ||
      candidate.appliedJobs.some(job => 
        job.job.title.toLowerCase().includes(searchFilters.searchTerm.toLowerCase()) ||
        job.job.company.toLowerCase().includes(searchFilters.searchTerm.toLowerCase())
      )

    // Fix status filter to work with API data format
    // API returns status labels like "New Application", "Initial Screening", etc.
    // We need to convert status filter keys to labels for comparison
    const getStatusLabel = (statusKey: string) => {
      const statusInfo = PIPELINE_STATUSES.find(s => s.key === statusKey)
      return statusInfo ? statusInfo.label : statusKey
    }
    
    const matchesStatus = statusFilter === "all" || 
      candidate.status === getStatusLabel(statusFilter) ||
      candidate.status === statusFilter // Also check direct match in case API returns keys
    console.debug(`[filter] ${candidate.fullName} - status: ${candidate.status}, filter: ${statusFilter}, matchesStatus: ${matchesStatus}`)
    
    const matchesDate = dateFilter === "all" || isDateInRange(candidate.appliedAt, dateFilter)
    
    // Check if any applied job matches the job type filter
    const matchesJobType =
      !searchFilters.jobType || 
      searchFilters.jobType === "any" || 
      candidate.appliedJobs.some(job => job.job.jobType.toLowerCase() === searchFilters.jobType.toLowerCase())
    
    // Check if any applied job matches the location filter
    const matchesCountry = true // Always true since we're only showing cities
    
    // Fix location filter to handle API data format and typos
    const matchesCity = 
      !searchFilters.city || 
      searchFilters.city === "all" || 
      candidate.currentLocation.toLowerCase().includes(searchFilters.city.toLowerCase()) ||
      candidate.currentLocation.toLowerCase().includes(searchFilters.city.toLowerCase().replace('hyderabad', 'hyderbad')) || // Handle typo
      candidate.appliedJobs.some(job => 
        job.job.city.toLowerCase().includes(searchFilters.city.toLowerCase()) ||
        job.job.city.toLowerCase().includes(searchFilters.city.toLowerCase().replace('hyderabad', 'hyderbad')) // Handle typo in job city too
      )
    
    console.debug(`[filter] ${candidate.fullName} - location: ${candidate.currentLocation}, filter: ${searchFilters.city}, matchesCity: ${matchesCity}`)
    
    const matchesExperience =
      !searchFilters.experience ||
      searchFilters.experience === "any" ||
      candidate.yearsOfExperience.toLowerCase().includes(searchFilters.experience.toLowerCase())
    
    const matchesSkills =
      searchFilters.skills.length === 0 ||
      searchFilters.skills.some((skill) =>
        candidate.keySkills.toLowerCase().includes(skill.toLowerCase())
      )

    const salaryMin = searchFilters.salaryMin ? Number.parseFloat(searchFilters.salaryMin) : 0
    const salaryMax = searchFilters.salaryMax ? Number.parseFloat(searchFilters.salaryMax) : Number.POSITIVE_INFINITY
    const matchesSalary = candidate.salaryExpectation >= salaryMin && candidate.salaryExpectation <= salaryMax

    const passes =
      matchesSearch &&
      matchesStatus &&
      matchesDate &&
      matchesJobType &&
      matchesCountry &&
      matchesCity &&
      matchesExperience &&
      matchesSkills &&
      matchesSalary

    console.debug(`[filter] ${candidate.fullName} passes: ${passes}`)
    return passes
  })

  const handleAiAnalysisComplete = (candidateId: string, analysis: AIAnalysis) => {
    setAiAnalysis((prev) => ({
      ...prev,
      [candidateId]: analysis,
    }))
  }



  const getStatusInfo = (status: string) => {
    // First try to find by key (for filter dropdowns)
    let statusInfo = PIPELINE_STATUSES.find((s) => s.key === status)
    
    // If not found by key, try to find by label (for API data)
    if (!statusInfo) {
      statusInfo = PIPELINE_STATUSES.find((s) => s.label === status)
    }
    
    // If still not found, return a default status
    return statusInfo || PIPELINE_STATUSES[0]
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



  const handleEditCandidate = () => {
    if (!editingCandidate) return

    setCandidates(
      candidates.map((candidate) =>
        candidate.id === editingCandidate.id
          ? { ...editingCandidate, lastUpdated: new Date().toISOString().split("T")[0] }
          : candidate,
      ),
    )
    setIsEditDialogOpen(false)
    setEditingCandidate(null)
  }

  const renderCandidateCard = (candidate: Candidate) => {
    const statusInfo = getStatusInfo(candidate.status)
    const primaryJob = candidate.appliedJobs[0] // Get the first applied job
    const jobTypeInfo = JOB_TYPES.find((type) => type.value === primaryJob?.job.jobType.toLowerCase())

    return (
      <Card key={candidate.id} className={`mb-4 hover:shadow-lg transition-shadow ${
        candidate.appliedJobs.length > 1 ? 'border-2 border-blue-300 bg-gradient-to-r from-blue-50 to-indigo-50' : ''
      }`}>
        <CardContent className="p-4">

          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="font-semibold text-lg">{candidate.fullName}</h3>
              <div className="flex items-center space-x-2 text-sm text-gray-600 mt-1">
                <Briefcase className="w-4 h-4" />
                <span>{primaryJob?.job.title || 'Multiple Jobs'}</span>
                <span>•</span>
                <Building2 className="w-4 h-4" />
                <span>{primaryJob?.job.company || 'Various Companies'}</span>
              </div>

            </div>
            <div className="flex space-x-2">
              <Badge className={getJobTypeColor(primaryJob?.job.jobType.toLowerCase() || 'full-time')}>
                {jobTypeInfo?.label || primaryJob?.job.jobType || 'Full-time'}
              </Badge>
              <Badge className={getStatusInfo(candidate.status).color} variant="outline">
                {getStatusInfo(candidate.status).label}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {candidate.totalApplications}
              </Badge>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <Mail className="w-4 h-4 text-gray-400" />
              <span>{candidate.email}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Phone className="w-4 h-4 text-gray-400" />
              <span>{candidate.phone}</span>
            </div>
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span>{candidate.currentLocation}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span>₹{candidate.salaryExpectation.toLocaleString()}</span>
            </div>
          </div>
          
          <div className="mt-3 pt-3 border-t">
            <div className="flex flex-wrap gap-1">
              {candidate.keySkills.split(',').slice(0, 4).map((skill, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {skill.trim()}
                </Badge>
              ))}
              {candidate.keySkills.split(',').length > 4 && (
                <Badge variant="outline" className="text-xs">
                  +{candidate.keySkills.split(',').length - 4} more
                </Badge>
              )}
            </div>
          </div>
          
          <div className="mt-3 pt-3 border-t">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span>Applied: {formatDateDDMMMYYYY(candidate.appliedAt)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-gray-500">Experience: {candidate.yearsOfExperience}</span>
              </div>
            </div>
          </div>

          {/* Resume Download Button */}
          <div className="mt-3 pt-3 border-t">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700">Resume</span>
                <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                  Available
                </Badge>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Open resume download URL in new tab
                  window.open(candidate.resumeDownloadUrl, '_blank')
                }}
                className="text-blue-600 border-blue-200 hover:bg-blue-50 text-xs"
              >
                <Upload className="w-3 h-3 mr-1" />
                Download Resume
              </Button>
            </div>
          </div>

          {/* Quick Action Dropdowns Section */}
          <div className="mt-3 pt-3 border-t space-y-3">
            <h4 className="text-sm font-medium text-gray-700 flex items-center space-x-2">
              <Edit className="w-4 h-4" />
              <span>Quick Actions</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Application Status Badge */}
              <div className="space-y-1">
                <Label className="text-xs text-gray-600">Application Status</Label>
                <Badge className={getStatusInfo(candidate.status).color} variant="outline">
                  {getStatusInfo(candidate.status).label}
                </Badge>
              </div>

              {/* Recruiter Assignment Dropdown */}
              <div className="space-y-1">
                <Label className="text-xs text-gray-600">Assigned Recruiter</Label>
                <Select
                  value={candidate.recruiterId}
                  onValueChange={(value) => {
                    const selectedRecruiter = recruiters.find((r) => r.id === value)
                    if (selectedRecruiter) {
                      setCandidates(
                        candidates.map((c) =>
                          c.id === candidate.id
                            ? {
                                ...c,
                                recruiterId: value,
                                recruiterName: selectedRecruiter.name,
                                lastUpdated: new Date().toISOString().split("T")[0],
                              }
                            : c,
                        ),
                      )
                    }
                  }}
                >
                  <SelectTrigger className="w-full h-8 text-xs">
                    <SelectValue>
                      <div className="flex items-center space-x-2">
                        <UserIcon className="w-3 h-3 text-gray-400" />
                        <span className="truncate">{candidate.recruiterName}</span>
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent searchable searchPlaceholder="Search recruiters..." onSearchChange={(value) => {}} side="bottom">
                    {recruiters.map((recruiter) => (
                      <SelectItem key={recruiter.id} value={recruiter.id}>
                        <div className="flex items-center space-x-2">
                          <UserIcon className="w-3 h-3" />
                          <span>{recruiter.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Application Source Dropdown */}
              <div className="space-y-1">
                <Label className="text-xs text-gray-600">Application Source</Label>
                <Select
                  value={candidate.source}
                  onValueChange={(value) => {
                    setCandidates(
                      candidates.map((c) =>
                        c.id === candidate.id
                          ? {
                              ...c,
                              source: value as "website" | "referral" | "linkedin" | "recruiter" | "other",
                              lastUpdated: new Date().toISOString().split("T")[0],
                            }
                          : c,
                      ),
                    )
                  }}
                >
                  <SelectTrigger className="w-full h-8 text-xs">
                    <SelectValue>
                      <div className="flex items-center space-x-2">
                        <Globe className="w-3 h-3 text-gray-400" />
                        <span className="capitalize truncate">{candidate.source}</span>
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent searchable searchPlaceholder="Search sources..." onSearchChange={(value) => {}} side="bottom">
                    <SelectItem value="website">
                      <div className="flex items-center space-x-2">
                        <Globe className="w-3 h-3" />
                        <span>Website</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="linkedin">
                      <div className="flex items-center space-x-2">
                        <UserIcon className="w-3 h-3" />
                        <span>LinkedIn</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="referral">
                      <div className="flex items-center space-x-2">
                        <UserIcon className="w-3 h-3" />
                        <span>Referral</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="recruiter">
                      <div className="flex items-center space-x-2">
                        <Briefcase className="w-3 h-3" />
                        <span>Recruiter</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="other">
                      <div className="flex items-center space-x-2">
                        <MessageSquare className="w-3 h-3" />
                        <span>Other</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Job Assignment Dropdown */}
              <div className="space-y-1">
                <Label className="text-xs text-gray-600">Job Assignment</Label>
                <Select
                  value={candidate.jobId}
                  onValueChange={(value) => {
                    const selectedJob = jobPostings.find((job) => job.id === value)
                    if (selectedJob) {
                      setCandidates(
                        candidates.map((c) =>
                          c.id === candidate.id
                            ? {
                                ...c,
                                jobId: value,
                                jobTitle: selectedJob.title,
                                jobType: selectedJob.jobType,
                                customerName: selectedJob.customerName,
                                internalSPOC: selectedJob.spoc,
                                lastUpdated: new Date().toISOString().split("T")[0],
                              }
                            : c,
                        ),
                      )
                    }
                  }}
                >
                  <SelectTrigger className="w-full h-8 text-xs">
                    <SelectValue>
                      <div className="flex items-center space-x-2">
                        <Briefcase className="w-3 h-3 text-gray-400" />
                        <span className="truncate">{candidate.appliedJobs[0]?.job.title || 'No Job'}</span>
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent searchable searchPlaceholder="Search job postings..." onSearchChange={(value) => {}} side="bottom">
                    {jobPostings.map((job) => (
                      <SelectItem key={job.id} value={job.id}>
                        <div className="flex items-center space-x-2">
                          <Briefcase className="w-3 h-3" />
                          <div className="flex flex-col">
                            <span className="text-sm">{job.title}</span>
                            <span className="text-xs text-gray-500">{job.customerName}</span>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Comments section removed as it's not part of the Candidate interface */}

          {/* AI Analysis Section */}
          {aiAnalysis[candidate.id] && (
            <div className="mt-3 pt-3 border-t">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Brain className="w-4 h-4 text-purple-400" />
                  <span className="text-sm font-medium">AI Score: </span>
                  <Badge
                    className={`${
                      aiAnalysis[candidate.id].overallScore >= 85
                        ? "bg-green-100 text-green-800"
                        : aiAnalysis[candidate.id].overallScore >= 70
                          ? "bg-blue-100 text-blue-800"
                          : aiAnalysis[candidate.id].overallScore >= 55
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                    }`}
                  >
                    {aiAnalysis[candidate.id].overallScore}/100
                  </Badge>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowAiAnalysis(candidate.id.toString())
                  }}
                  className="text-purple-600 border-purple-200 hover:bg-purple-50"
                >
                  <Brain className="w-3 h-3 mr-1" />
                  View AI Analysis
                </Button>
              </div>
              <div className="text-xs text-gray-600 mt-1">
                Verdict: {aiAnalysis[candidate.id].verdict.replace("_", " ")}
              </div>
            </div>
          )}

          <div className="mt-3 pt-3 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditingCandidate(candidate)
                setIsEditDialogOpen(true)
              }}
              className="w-full"
            >
              <Edit className="w-3 h-3 mr-1" />
              Advanced Edit
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }




  return (
    <div className="space-y-6">
      {/* AI-Powered Candidate Search Header */}
      <div className="bg-gradient-to-r from-purple-50 via-blue-50 to-indigo-50 border border-purple-200 rounded-xl p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Brain className="w-6 h-6 text-purple-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">AI Candidate Intelligence</h2>
            </div>
            <p className="text-gray-600 mb-3">
              Smart candidate discovery with AI-powered matching and intelligent filtering
            </p>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                {totalCandidates} Total Candidates
              </Badge>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                {totalApplications} Total Applications
              </Badge>
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                {filteredCandidates.length} Filtered Results
              </Badge>
            </div>
          </div>

        </div>

        {/* AI-Powered Smart Search */}
        <div className="space-y-4">
          <div className="relative">
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
              <Brain className="text-purple-600 w-5 h-5 animate-pulse" />
              <Search className="text-gray-400 w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Ask AI to find candidates... (e.g., 'Find React developers with 5+ years experience' or 'Show me candidates available immediately')"
              value={searchFilters.searchTerm}
              onChange={(e) => setSearchFilters({ ...searchFilters, searchTerm: e.target.value })}
              className="w-full pl-16 pr-6 py-4 text-lg border-2 border-purple-300 rounded-xl focus:border-purple-500 focus:ring-purple-200 bg-white/80 backdrop-blur-sm placeholder-gray-500"
            />
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
              {searchFilters.searchTerm && (
                <button
                  onClick={() => setSearchFilters({ ...searchFilters, searchTerm: "" })}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Smart Filter Suggestions */}
          {searchFilters.searchTerm && (
            <div className="bg-white/60 backdrop-blur-sm border border-purple-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <Brain className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-900">AI Search Intelligence</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs mb-3">
                <div className="flex items-center space-x-2 text-purple-700">
                  <Briefcase className="w-3 h-3" />
                  <span>Analyzing skills & experience match</span>
                </div>
                <div className="flex items-center space-x-2 text-purple-700">
                  <MapPin className="w-3 h-3" />
                  <span>Location & availability preferences</span>
                </div>
                <div className="flex items-center space-x-2 text-purple-700">
                  <IndianRupee className="w-3 h-3" />
                  <span>Salary expectations & job type fit</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs text-purple-600 font-medium">Quick Searches: </span>
                {[
                  "senior developers available now",
                                        "marketing experts under ₹90k",
                  "remote candidates with React",
                  "entry level designers",
                  "contract workers in tech",
                  "Amir Khan multiple applications",
                  "candidates with Oracle and React skills",
                ].map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => setSearchFilters({ ...searchFilters, searchTerm: suggestion })}
                    className="text-xs px-3 py-1 bg-white/80 border border-purple-200 rounded-full hover:bg-purple-50 text-purple-700 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Smart Filters Row */}
          <div className="flex flex-wrap gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px] bg-white/80 border-purple-200">
                <SelectValue placeholder="Pipeline Status" />
              </SelectTrigger>
              <SelectContent searchable searchPlaceholder="Search status types..." onSearchChange={(value) => {}} side="bottom">
                <SelectItem value="all">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                    <span>All Status</span>
                  </div>
                </SelectItem>
                {PIPELINE_STATUSES.map((status) => (
                  <SelectItem key={status.key} value={status.key}>
                    <div className="flex items-center space-x-2">
                      <div
                        className={`w-2 h-2 rounded-full ${status.color.includes("blue") ? "bg-blue-500" : status.color.includes("yellow") ? "bg-yellow-500" : status.color.includes("orange") ? "bg-orange-500" : status.color.includes("purple") ? "bg-purple-500" : status.color.includes("indigo") ? "bg-indigo-500" : status.color.includes("violet") ? "bg-violet-500" : status.color.includes("pink") ? "bg-pink-500" : status.color.includes("cyan") ? "bg-cyan-500" : status.color.includes("emerald") ? "bg-emerald-500" : status.color.includes("green") ? "bg-green-500" : status.color.includes("lime") ? "bg-lime-500" : status.color.includes("teal") ? "bg-teal-500" : status.color.includes("sky") ? "bg-sky-500" : status.color.includes("red") ? "bg-red-500" : status.color.includes("gray") ? "bg-gray-500" : "bg-amber-500"}`}
                      ></div>
                      <span>{status.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <DateFilter value={dateFilter} onValueChange={setDateFilter} />

            <Select
              value={searchFilters.jobType}
              onValueChange={(value) => setSearchFilters({ ...searchFilters, jobType: value })}
            >
              <SelectTrigger className="w-[160px] bg-white/80 border-purple-200">
                <SelectValue placeholder="Job Type" />
              </SelectTrigger>
              <SelectContent searchable searchPlaceholder="Search job types..." onSearchChange={setJobTypeSearch} side="bottom">
                <SelectItem value="">All Types</SelectItem>
                {getFilteredJobTypes().map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={searchFilters.experience}
              onValueChange={(value) => setSearchFilters({ ...searchFilters, experience: value })}
            >
              <SelectTrigger className="w-[160px] bg-white/80 border-purple-200">
                <SelectValue placeholder="Experience" />
              </SelectTrigger>
              <SelectContent searchable searchPlaceholder="Search experience levels..." onSearchChange={setExperienceSearch} side="bottom">
                <SelectItem value="">Any Level</SelectItem>
                {getFilteredExperienceLevels().map((level) => (
                  <SelectItem key={level.value} value={level.value}>
                    {level.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={searchFilters.city}
              onValueChange={(value) => {
                setSearchFilters({ ...searchFilters, country: "IN", city: value })
              }}
            >
              <SelectTrigger className="w-[200px] bg-white/80 border-purple-200">
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent searchable searchPlaceholder="Search cities..." onSearchChange={setLocationSearch} side="bottom">
                <SelectItem value="">All Cities</SelectItem>
                {/* Show proper case in UI but filter handles lowercase */}
                <SelectItem value="hyderbad">🏙️ Hyderabad</SelectItem>
                {COUNTRIES.find(country => country.code === "IN")?.cities
                  .filter(city => city.toLowerCase() !== 'hyderabad') // Remove Hyderabad from list since we have hyderbad
                  .map(city => (
                    <SelectItem key={`IN-${city}`} value={city}>
                      🏙️ {city}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Additional Quick Filters */}

          {/* Active Filters Display */}
          {(searchFilters.searchTerm ||
            searchFilters.jobType ||
            searchFilters.experience ||
            searchFilters.country ||
            statusFilter !== "all" ||
            dateFilter !== "all") && (
            <div className="flex flex-wrap gap-2">
              {searchFilters.searchTerm && (
                <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                  Search: {searchFilters.searchTerm}
                  <button
                    onClick={() => setSearchFilters({ ...searchFilters, searchTerm: "" })}
                    className="ml-1 hover:text-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              {searchFilters.jobType && (
                <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                  <Briefcase className="w-3 h-3 mr-1" />
                  {JOB_TYPES.find((t) => t.value === searchFilters.jobType)?.label}
                  <button
                    onClick={() => setSearchFilters({ ...searchFilters, jobType: "" })}
                    className="ml-1 hover:text-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              {searchFilters.experience && (
                <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200">
                  {searchFilters.experience === "entry" && "Entry Level"}
                  {searchFilters.experience === "mid" && "Mid Level"}
                  {searchFilters.experience === "senior" && "Senior Level"}
                  {searchFilters.experience === "lead" && "Lead/Principal"}
                  <button
                    onClick={() => setSearchFilters({ ...searchFilters, experience: "" })}
                    className="ml-1 hover:text-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              {searchFilters.city && (
                <Badge className="bg-green-100 text-green-800 border-green-200">
                  <MapPin className="w-3 h-3 mr-1" />
                  {searchFilters.city}
                  <button
                    onClick={() => setSearchFilters({ ...searchFilters, country: "", city: "" })}
                    className="ml-1 hover:text-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              {statusFilter !== "all" && (
                <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                  Status: {PIPELINE_STATUSES.find((s) => s.key === statusFilter)?.label}
                  <button onClick={() => setStatusFilter("all")} className="ml-1 hover:text-red-600">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              {dateFilter !== "all" && (
                <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                  Date: {dateFilter}
                  <button onClick={() => setDateFilter("all")} className="ml-1 hover:text-red-600">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Advanced Search */}
      <AdvancedSearch
        filters={searchFilters}
        onFiltersChange={setSearchFilters}
        statusOptions={PIPELINE_STATUSES}
        showJobTypeFilter={true}
        showSalaryFilter={true}
        showExperienceFilter={true}
        showSkillsFilter={true}
        showStatusFilter={true}
        showSourceFilter={true}
        className="mb-6"
      />

      <Card>
        <CardContent>
          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Loading Candidates</h3>
              <p className="text-gray-500">Fetching candidate data from the server...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Candidates</h3>
              <p className="text-gray-500 mb-4">{error}</p>
              <Button onClick={fetchCandidates} className="bg-purple-600 hover:bg-purple-700">
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </div>
          )}

                      {/* Content */}
            {!loading && !error && (
              <div>
                {filteredCandidates.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                      <AlertCircle className="w-12 h-12 text-blue-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">No candidates found</h3>
                    <p className="text-gray-600 mb-6 max-w-md mx-auto">
                      {candidates.length === 0
                        ? "Start building your talent pipeline by adding your first candidate."
                        : "Try adjusting your search filters to see more results."}
                    </p>

                  </div>
                ) : (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    {/* Table Header with Stats */}
                    <div className="bg-gradient-to-r from-slate-50 via-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-6">
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                            <span className="text-sm font-medium text-gray-700">
                              {filteredCandidates.length} candidates
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            <span className="text-sm font-medium text-gray-700">
                              {filteredCandidates.filter(c => c.status === 'hired').length} hired
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                            <span className="text-sm font-medium text-gray-700">
                              {filteredCandidates.filter(c => c.status === 'interview-1' || c.status === 'interview-2').length} in interviews
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={fetchCandidates}
                            className="text-xs border-gray-300 hover:border-blue-300 hover:bg-blue-50"
                          >
                            <RefreshCw className="w-3 h-3 mr-1" />
                            Refresh
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Beautiful Table */}
                    <div className="overflow-x-auto">
                      <Table className="w-full">
                        <TableHeader>
                          <TableRow className="bg-gradient-to-r from-gray-50 to-slate-50 border-b border-gray-200">
                            <TableHead className="px-6 py-4 text-left">
                              <div className="flex items-center space-x-2">
                                <UserIcon className="w-4 h-4 text-blue-500" />
                                <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Candidate</span>
                              </div>
                            </TableHead>
                            <TableHead className="px-6 py-4 text-left">
                              <div className="flex items-center space-x-2">
                                <Briefcase className="w-4 h-4 text-indigo-500" />
                                <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Position</span>
                              </div>
                            </TableHead>
                            <TableHead className="px-6 py-4 text-left">
                              <div className="flex items-center space-x-2">
                                <Building2 className="w-4 h-4 text-teal-500" />
                                <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Company</span>
                              </div>
                            </TableHead>
                            <TableHead className="px-6 py-4 text-left">
                              <div className="flex items-center space-x-2">
                                <MapPin className="w-4 h-4 text-orange-500" />
                                <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Location</span>
                              </div>
                            </TableHead>
                            <TableHead className="px-6 py-4 text-left">
                              <div className="flex items-center space-x-2">
                                <IndianRupee className="w-4 h-4 text-green-500" />
                                <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Salary</span>
                              </div>
                            </TableHead>
                            <TableHead className="px-6 py-4 text-left">
                              <div className="flex items-center space-x-2">
                                <Calendar className="w-4 h-4 text-purple-500" />
                                <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Experience</span>
                              </div>
                            </TableHead>
                            <TableHead className="px-6 py-4 text-left">
                              <div className="flex items-center space-x-2">
                                <Calendar className="w-4 h-4 text-indigo-500" />
                                <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">Applied At & Job Type</span>
                              </div>
                            </TableHead>
                            <TableHead className="px-6 py-4 text-left">
                              <div className="flex items-center space-x-2">
                                <AlertCircle className="w-4 h-4 text-amber-500" />
                                <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</span>
                              </div>
                            </TableHead>
                            <TableHead className="px-6 py-4 text-left">
                              <div className="flex items-center space-x-2">
                                <Edit className="w-4 h-4 text-gray-500" />
                                <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</span>
                              </div>
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredCandidates.map((candidate, index) => {
                            const statusInfo = getStatusInfo(candidate.status)
                            const primaryJob = candidate.appliedJobs[0]
                            const jobTypeInfo = JOB_TYPES.find((type) => type.value === primaryJob?.job.jobType.toLowerCase())
                            
                            return (
                              <TableRow 
                                key={candidate.id} 
                                className={`
                                  hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 
                                  transition-all duration-300 border-b border-gray-100 group
                                  ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}
                                `}
                              >
                                                                 {/* Candidate Column */}
                                 <TableCell className="px-6 py-4">
                                   <div className="flex items-center space-x-3">
                                     <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                       {candidate.fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
                                     </div>
                                     <div className="flex-1 min-w-0">
                                       <div className="flex items-center space-x-1">
                                         <div className="relative max-w-[120px]">
                                           <span className="font-semibold text-gray-900 truncate block">
                                             {candidate.fullName}
                                           </span>
                                           {candidate.fullName.length > 15 && (
                                             <button
                                               onClick={() => setFullDataModal({
                                                 isOpen: true,
                                                 data: candidate.fullName,
                                                 title: "Full Name"
                                               })}
                                               className="absolute -right-6 top-0 flex-shrink-0 p-1 hover:bg-gray-100 rounded transition-colors"
                                               title="View full name"
                                             >
                                               <Eye className="w-3 h-3 text-blue-600" />
                                             </button>
                                           )}
                                         </div>
                                       </div>
                                       <div className="flex items-center space-x-1">
                                         <div className="relative max-w-[140px]">
                                           <span className="text-sm text-gray-500 truncate block">
                                             {candidate.email}
                                           </span>
                                           {candidate.email.length > 20 && (
                                             <button
                                               onClick={() => setFullDataModal({
                                                 isOpen: true,
                                                 data: candidate.email,
                                                 title: "Email Address"
                                               })}
                                               className="absolute -right-6 top-0 flex-shrink-0 p-1 hover:bg-gray-100 rounded transition-colors"
                                               title="View full email"
                                             >
                                               <Eye className="w-3 h-3 text-blue-600" />
                                             </button>
                                           )}
                                         </div>
                                       </div>
                                       <div className="flex items-center space-x-1">
                                         <span className="text-xs text-gray-400 truncate">
                                           {candidate.phone}
                                         </span>
                                         {candidate.phone.length > 15 && (
                                           <button
                                             onClick={() => setFullDataModal({
                                               isOpen: true,
                                               data: candidate.phone,
                                               title: "Phone Number"
                                             })}
                                             className="flex-shrink-0 p-1 hover:bg-gray-100 rounded transition-colors"
                                             title="View full phone"
                                           >
                                             <Eye className="w-3 h-3 text-blue-600" />
                                           </button>
                                         )}
                                       </div>

                                     </div>
                                   </div>
                                 </TableCell>

                                                                 {/* Position Column */}
                                 <TableCell className="px-6 py-4">
                                   <div className="space-y-1">
                                     <div className="relative max-w-[150px]">
                                       <span className="font-medium text-gray-900 truncate block">
                                         {primaryJob?.job.title || 'Multiple Positions'}
                                       </span>
                                       {(primaryJob?.job.title && primaryJob.job.title.length > 20) && (
                                         <button
                                           onClick={() => setFullDataModal({
                                             isOpen: true,
                                             data: primaryJob.job.title,
                                             title: "Job Title"
                                           })}
                                           className="absolute -right-6 top-0 flex-shrink-0 p-1 hover:bg-gray-100 rounded transition-colors"
                                           title="View full job title"
                                         >
                                           <Eye className="w-3 h-3 text-blue-600" />
                                         </button>
                                       )}
                                     </div>
                                                                           {candidate.appliedJobs.length > 1 && (
                                        <Badge 
                                          className="bg-blue-100 text-blue-800 text-xs cursor-pointer hover:bg-blue-200 transition-colors"
                                          onClick={() => {
                                            setSelectedCandidateForJobs(candidate)
                                            setShowJobsModal(true)
                                          }}
                                        >
                                          {getApplicationsBadgeText(candidate)}
                                        </Badge>
                                      )}
                                   </div>
                                 </TableCell>

                                                                 {/* Company Column */}
                                 <TableCell className="px-6 py-4">
                                   <div className="space-y-1">
                                     <div className="relative max-w-[130px]">
                                       <span className="font-medium text-gray-900 truncate block">
                                         {primaryJob?.job.company || 'Various Companies'}
                                       </span>
                                       {(primaryJob?.job.company && primaryJob.job.company.length > 15) && (
                                         <button
                                           onClick={() => setFullDataModal({
                                             isOpen: true,
                                             data: primaryJob.job.company,
                                             title: "Company Name"
                                           })}
                                           className="absolute -right-6 top-0 flex-shrink-0 p-1 hover:bg-gray-100 rounded transition-colors"
                                           title="View full company name"
                                         >
                                           <Eye className="w-3 h-3 text-blue-600" />
                                         </button>
                                       )}
                                     </div>
                                     <div className="text-sm text-gray-500">
                                       Client: {primaryJob?.job.company || 'N/A'}
                                     </div>
                                   </div>
                                 </TableCell>

                                                                 {/* Location Column */}
                                 <TableCell className="px-6 py-4">
                                   <div className="flex items-center space-x-2">
                                     <MapPin className="w-4 h-4 text-gray-400" />
                                     <div className="relative max-w-[120px]">
                                       <span className="text-sm text-gray-900 truncate block">
                                         {candidate.currentLocation}
                                       </span>
                                       {candidate.currentLocation.length > 15 && (
                                         <button
                                           onClick={() => setFullDataModal({
                                             isOpen: true,
                                             data: candidate.currentLocation,
                                             title: "Location"
                                           })}
                                           className="absolute -right-6 top-0 flex-shrink-0 p-1 hover:bg-gray-100 rounded transition-colors"
                                           title="View full location"
                                         >
                                           <Eye className="w-3 h-3 text-blue-600" />
                                         </button>
                                       )}
                                     </div>
                                   </div>
                                 </TableCell>

                                {/* Salary Column */}
                                <TableCell className="px-6 py-4">
                                  <div className="space-y-1">
                                    <div className="font-semibold text-gray-900">
                                      ₹{candidate.salaryExpectation.toLocaleString()}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      Expected
                                    </div>
                                  </div>
                                </TableCell>

                                {/* Experience Column */}
                                <TableCell className="px-6 py-4">
                                  <div className="text-sm text-gray-900">
                                    {candidate.yearsOfExperience}
                                  </div>
                                </TableCell>

                                {/* Applied At & Job Type Column */}
                                <TableCell className="px-6 py-4">
                                  <div className="text-sm text-gray-900">
                                    <div className="flex flex-col space-y-1">
                                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 whitespace-nowrap">
                                        {formatDateDDMMMYYYY(candidate.appliedAt)}
                                      </Badge>
                                      {candidate.appliedJobs.length > 1 ? (
                                        <div className="flex items-center space-x-2">
                                          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 whitespace-nowrap">
                                            {primaryJob?.job.jobType}
                                          </Badge>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => {
                                              setSelectedCandidateForJobs(candidate)
                                              setShowJobsModal(true)
                                            }}
                                            className="text-xs h-6 px-2"
                                          >
                                            View More
                                          </Button>
                                        </div>
                                      ) : (
                                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 whitespace-nowrap">
                                          {primaryJob?.job.jobType}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </TableCell>

                                {/* Status Column */}
                                <TableCell className="px-6 py-4">
                                  <div className="space-y-2">
                                    <Badge 
                                      variant="outline" 
                                      className={`whitespace-nowrap text-xs ${
                                        candidate.status === 'New Application' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                        candidate.status === 'Initial Screening' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                        candidate.status === 'Final Interview' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                        candidate.status === 'Hired' ? 'bg-green-50 text-green-700 border-green-200' :
                                        candidate.status === 'Rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                                        'bg-gray-50 text-gray-700 border-gray-200'
                                      }`}
                                    >
                                      {candidate.status || 'New Application'}
                                    </Badge>
                                  </div>
                                </TableCell>

                                {/* Actions Column */}
                                <TableCell className="px-6 py-4">
                                  <div className="flex items-center space-x-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setViewingCandidate(candidate)
                                        setSelectedJobId(null)
                                        setIsViewDialogOpen(true)
                                      }}
                                      className="h-8 px-3 text-green-600 border-green-200 hover:bg-green-50 hover:border-green-300 transition-all duration-200 hover:shadow-md"
                                    >
                                      <UserIcon className="w-3 h-3 mr-1" />
                                      View
                                    </Button>

                                    {candidate.resumeDownloadUrl && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          if (candidate.resumeDownloadUrl) {
                                            window.open(candidate.resumeDownloadUrl, '_blank')
                                          }
                                        }}
                                        className="h-8 px-3 text-blue-600 border-blue-200 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 hover:shadow-md"
                                      >
                                        <Upload className="w-3 h-3 mr-1" />
                                        Resume
                                      </Button>
                                    )}

                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleDeleteCandidate(candidate)}
                                      className="h-8 px-3 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 transition-all duration-200 hover:shadow-md"
                                    >
                                      <Trash2 className="w-3 h-3 mr-1" />
                                      Delete
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Table Footer */}
                    <div className="bg-gradient-to-r from-gray-50 to-slate-50 px-6 py-3 border-t border-gray-200">
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <div className="flex items-center space-x-4">
                          <span>Showing {filteredCandidates.length} of {totalCandidates} candidates</span>
                          <span>•</span>
                          <span>{totalApplications} total applications</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500">Last updated: {isClient ? lastUpdated : ""}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
        </CardContent>
      </Card>
      {/* AI Analysis Dialog */}
      {showAiAnalysis && (
        <Dialog open={!!showAiAnalysis} onOpenChange={() => setShowAiAnalysis(null)}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>AI Candidate Analysis</DialogTitle>
              <DialogDescription>Comprehensive AI-powered evaluation and recommendations</DialogDescription>
            </DialogHeader>
            {/* <AICandidateAnalysis
              candidate={candidates.find((c) => c.id === Number.parseInt(showAiAnalysis || '0'))}
              jobPosting={jobPostings.find((j) => j.id === candidates.find((c) => c.id === Number.parseInt(showAiAnalysis || '0'))?.appliedJobs[0]?.job.id.toString())}
              onAnalysisComplete={(analysis) => handleAiAnalysisComplete(showAiAnalysis, analysis)}
            /> */}
          </DialogContent>
        </Dialog>
      )}

      {/* Full Data Modal */}
      <Dialog open={fullDataModal.isOpen} onOpenChange={(open) => setFullDataModal({...fullDataModal, isOpen: open})}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Eye className="w-5 h-5 text-blue-600" />
              <span>{fullDataModal.title}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-900 break-words">{fullDataModal.data}</p>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setFullDataModal({...fullDataModal, isOpen: false})}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Professional Status Update Dialog */}
      <Dialog open={showStatusUpdateDialog} onOpenChange={setShowStatusUpdateDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Briefcase className="w-5 h-5 text-blue-600" />
              <span>Select Job to Update Status</span>
            </DialogTitle>
            <DialogDescription>
              Choose a job application to update its status
            </DialogDescription>
          </DialogHeader>
          {selectedCandidateForJobs && (
            <div className="space-y-4 py-4">
              {/* Search Filters */}
              <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="col-span-3 flex justify-end mb-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setJobFilterSearch("")
                      setJobFilterStatus("all")
                      setJobFilterPriority("all")
                    }}
                    className="text-xs"
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Reset Filters
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Search by Title</Label>
                  <input
                    type="text"
                    placeholder="Search job titles..."
                    value={jobFilterSearch}
                    onChange={(e) => setJobFilterSearch(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Filter by Status</Label>
                  <Select value={jobFilterStatus} onValueChange={setJobFilterStatus}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      {PIPELINE_STATUSES.map((status) => (
                        <SelectItem key={status.key} value={status.key}>
                          <div className="flex items-center space-x-2">
                            <div
                              className={`w-2 h-2 rounded-full ${
                                status.color.includes("blue")
                                  ? "bg-blue-500"
                                  : status.color.includes("yellow")
                                    ? "bg-yellow-500"
                                    : status.color.includes("orange")
                                      ? "bg-orange-500"
                                      : status.color.includes("purple")
                                        ? "bg-purple-500"
                                        : status.color.includes("indigo")
                                          ? "bg-indigo-500"
                                          : status.color.includes("violet")
                                            ? "bg-violet-500"
                                            : status.color.includes("pink")
                                              ? "bg-pink-500"
                                              : status.color.includes("cyan")
                                                ? "bg-cyan-500"
                                                : status.color.includes("emerald")
                                                  ? "bg-emerald-500"
                                                  : status.color.includes("green")
                                                    ? "bg-green-500"
                                                    : status.color.includes("lime")
                                                      ? "bg-lime-500"
                                                      : status.color.includes("teal")
                                                        ? "bg-teal-500"
                                                        : status.color.includes("sky")
                                                          ? "bg-sky-500"
                                                          : status.color.includes("red")
                                                            ? "bg-red-500"
                                                            : status.color.includes("gray")
                                                              ? "bg-gray-500"
                                                              : "bg-amber-500"
                              }`}
                            ></div>
                            <span>{status.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Filter by Priority</Label>
                  <Select value={jobFilterPriority} onValueChange={setJobFilterPriority}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All priorities" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All priorities</SelectItem>
                      <SelectItem value="high">High priority</SelectItem>
                      <SelectItem value="medium">Medium priority</SelectItem>
                      <SelectItem value="low">Low priority</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Jobs List */}
              <div className="space-y-3">
                {selectedCandidateForJobs.appliedJobs
                  .filter((appliedJob) => {
                    // Filter by search term
                    const matchesSearch = !jobFilterSearch || 
                      appliedJob.job.title.toLowerCase().includes(jobFilterSearch.toLowerCase()) ||
                      appliedJob.job.company.toLowerCase().includes(jobFilterSearch.toLowerCase())
                    
                    // Filter by status
                    const matchesStatus = jobFilterStatus === "all" || 
                      appliedJob.applicationStatus === jobFilterStatus
                    
                    // Filter by priority
                    const matchesPriority = jobFilterPriority === "all" || 
                      appliedJob.job.priority === jobFilterPriority
                    
                    return matchesSearch && matchesStatus && matchesPriority
                  })
                  .map((appliedJob, index) => {
                  const jobStatusInfo = getStatusInfo(appliedJob.applicationStatus)
                  return (
                    <div key={appliedJob.applicationId} className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg border border-gray-200 hover:border-blue-300 transition-all duration-200 hover:shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 flex-1">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Briefcase className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900">{appliedJob.job.title}</div>
                            <div className="text-sm text-gray-600">{appliedJob.job.company}</div>
                            <div className="text-xs text-gray-500">Applied: {formatDateDDMMMYYYY(appliedJob.appliedAt)}</div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${
                              appliedJob.job.priority === 'high' ? 'bg-red-50 text-red-700 border-red-200' :
                              appliedJob.job.priority === 'medium' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                              'bg-green-50 text-green-700 border-green-200'
                            }`}
                          >
                            {appliedJob.job.priority}
                          </Badge>
                          <Badge className="bg-gray-100 text-gray-800 border-gray-200" variant="outline">
                            {appliedJob.applicationStatus}
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedJobForStatus(appliedJob)
                              setShowStatusUpdateDialog(false)
                              // Open status update dialog for this specific job
                              setTimeout(() => {
                                setShowStatusUpdateDialog(true)
                              }, 100)
                            }}
                            className="text-xs"
                          >
                            Update Status
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
          <div className="flex justify-end">
            <Button onClick={() => setShowStatusUpdateDialog(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* All Jobs Modal */}
      <Dialog open={showJobsModal} onOpenChange={setShowJobsModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Briefcase className="w-5 h-5 text-blue-600" />
              <span>All Job Applications</span>
            </DialogTitle>
            <DialogDescription>
              {selectedCandidateForJobs?.fullName} - {selectedCandidateForJobs?.appliedJobs.length} applications
            </DialogDescription>
          </DialogHeader>
          {selectedCandidateForJobs && (
            <div className="py-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="px-4 py-3 text-left">
                        <div className="flex items-center space-x-2">
                          <Briefcase className="w-4 h-4 text-blue-500" />
                          <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Job Title</span>
                        </div>
                      </TableHead>
                      <TableHead className="px-4 py-3 text-left">
                        <div className="flex items-center space-x-2">
                          <Building2 className="w-4 h-4 text-teal-500" />
                          <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Company</span>
                        </div>
                      </TableHead>
                      <TableHead className="px-4 py-3 text-left">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-indigo-500" />
                          <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">Applied At & Job Type</span>
                        </div>
                      </TableHead>
                      <TableHead className="px-4 py-3 text-left">
                        <div className="flex items-center space-x-2">
                          <AlertCircle className="w-4 h-4 text-amber-500" />
                          <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</span>
                        </div>
                      </TableHead>
                      <TableHead className="px-4 py-3 text-left">
                        <div className="flex items-center space-x-2">
                          <IndianRupee className="w-4 h-4 text-green-500" />
                          <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Priority</span>
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedCandidateForJobs.appliedJobs.map((appliedJob, index) => (
                      <TableRow key={appliedJob.applicationId} className="hover:bg-gray-50">
                        <TableCell className="px-4 py-3">
                          <div className="font-medium text-gray-900">{appliedJob.job.title}</div>
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <div className="text-sm text-gray-600">{appliedJob.job.company}</div>
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <div className="flex flex-col space-y-1">
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                              {formatDateDDMMMYYYY(appliedJob.appliedAt)}
                            </Badge>
                            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-xs">
                              {appliedJob.job.jobType}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <Badge className="bg-gray-100 text-gray-800 border-gray-200" variant="outline">
                            {appliedJob.applicationStatus}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${
                              appliedJob.job.priority === 'high' ? 'bg-red-50 text-red-700 border-red-200' :
                              appliedJob.job.priority === 'medium' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                              'bg-green-50 text-green-700 border-green-200'
                            }`}
                          >
                            {appliedJob.job.priority}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
          <div className="flex justify-end">
            <Button onClick={() => setShowJobsModal(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Individual Job Status Update Dialog */}
      <Dialog open={selectedJobForStatus !== null} onOpenChange={(open) => {
        if (!open) setSelectedJobForStatus(null)
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Briefcase className="w-5 h-5 text-blue-600" />
              <span>Update Application Status</span>
            </DialogTitle>
            <DialogDescription>
              Update the status for the selected job application
            </DialogDescription>
          </DialogHeader>
          {selectedJobForStatus && (
            <div className="space-y-4 py-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Briefcase className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-blue-900">{selectedJobForStatus.job.title}</span>
                </div>
                <div className="text-sm text-blue-700">
                  Company: {selectedJobForStatus.job.company}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Current Status</Label>
                <div className="flex items-center space-x-2">
                  <Badge className={getStatusInfo(selectedJobForStatus.applicationStatus).color} variant="outline">
                    {getStatusInfo(selectedJobForStatus.applicationStatus).label}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <Label>New Status</Label>
                <Select
                  value={selectedJobForStatus.applicationStatus}
                  onValueChange={(value) => {
                    setCandidates(
                      candidates.map((c) =>
                        c.appliedJobs.some(job => job.applicationId === selectedJobForStatus.applicationId)
                          ? {
                              ...c,
                              appliedJobs: c.appliedJobs.map((job) =>
                                job.applicationId === selectedJobForStatus.applicationId
                                  ? { ...job, applicationStatus: value }
                                  : job
                              ),
                              updatedAt: new Date().toISOString().split("T")[0]
                            }
                          : c,
                      ),
                    )
                    setSelectedJobForStatus(null)
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select new status" />
                  </SelectTrigger>
                  <SelectContent searchable searchPlaceholder="Search status types..." onSearchChange={setStatusSearch} side="bottom">
                    {getFilteredStatuses().map((status) => (
                      <SelectItem key={status.key} value={status.key}>
                        <div className="flex items-center space-x-2">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              status.color.includes("blue")
                                ? "bg-blue-500"
                                : status.color.includes("yellow")
                                  ? "bg-yellow-500"
                                  : status.color.includes("orange")
                                    ? "bg-orange-500"
                                    : status.color.includes("purple")
                                      ? "bg-purple-500"
                                      : status.color.includes("indigo")
                                        ? "bg-indigo-500"
                                        : status.color.includes("violet")
                                          ? "bg-violet-500"
                                          : status.color.includes("pink")
                                            ? "bg-pink-500"
                                            : status.color.includes("cyan")
                                              ? "bg-cyan-500"
                                              : status.color.includes("emerald")
                                                ? "bg-emerald-500"
                                                : status.color.includes("green")
                                                  ? "bg-green-500"
                                                  : status.color.includes("lime")
                                                    ? "bg-lime-500"
                                                    : status.color.includes("teal")
                                                      ? "bg-teal-500"
                                                      : status.color.includes("sky")
                                                        ? "bg-sky-500"
                                                        : status.color.includes("red")
                                                          ? "bg-red-500"
                                                          : status.color.includes("gray")
                                                            ? "bg-gray-500"
                                                            : "bg-amber-500"
                            }`}
                          ></div>
                          <span>{status.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setSelectedJobForStatus(null)}>
              Cancel
            </Button>
            <Button onClick={() => setSelectedJobForStatus(null)}>
              Update Status
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Edit className="w-5 h-5 text-blue-600" />
              <span>Edit Candidate Profile</span>
            </DialogTitle>
            <DialogDescription>Update candidate information, pipeline status, and add notes</DialogDescription>
          </DialogHeader>

          {editingCandidate && (
            <div className="space-y-6 py-4">
              {/* Personal Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center space-x-2">
                  <UserIcon className="w-5 h-5 text-blue-600" />
                  <span>Personal Information</span>
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <input
                      type="text"
                      value={editingCandidate.fullName}
                      onChange={(e) => setEditingCandidate({ ...editingCandidate, fullName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email Address</Label>
                    <input
                      type="email"
                      value={editingCandidate.email}
                      onChange={(e) => setEditingCandidate({ ...editingCandidate, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone Number</Label>
                    <input
                      type="tel"
                      value={editingCandidate.phone}
                      onChange={(e) => setEditingCandidate({ ...editingCandidate, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  {/* Experience Level Dropdown */}
                  <div className="space-y-2">
                    <Label>Experience Level</Label>
                    <Select
                      value={editingCandidate.yearsOfExperience}
                      onValueChange={(value) => setEditingCandidate({ ...editingCandidate, yearsOfExperience: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select experience level" />
                      </SelectTrigger>
                      <SelectContent searchable searchPlaceholder="Search experience levels..." onSearchChange={(value) => {}} side="bottom">
                        <SelectItem value="0-1 years">0-1 years</SelectItem>
                        <SelectItem value="1-2 years">1-2 years</SelectItem>
                        <SelectItem value="2-3 years">2-3 years</SelectItem>
                        <SelectItem value="3-5 years">3-5 years</SelectItem>
                        <SelectItem value="5-7 years">5-7 years</SelectItem>
                        <SelectItem value="7-10 years">7-10 years</SelectItem>
                        <SelectItem value="10+ years">10+ years</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {/* Notice Period Dropdown */}
                  <div className="space-y-2">
                    <Label>Notice Period</Label>
                    <Select
                      value={editingCandidate.noticePeriod}
                      onValueChange={(value) => setEditingCandidate({ ...editingCandidate, noticePeriod: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select notice period" />
                      </SelectTrigger>
                      <SelectContent searchable searchPlaceholder="Search notice periods..." onSearchChange={(value) => {}} side="bottom">
                        <SelectItem value="Immediate">Immediate</SelectItem>
                        <SelectItem value="1 week">1 week</SelectItem>
                        <SelectItem value="2 weeks">2 weeks</SelectItem>
                        <SelectItem value="1 month">1 month</SelectItem>
                        <SelectItem value="2 months">2 months</SelectItem>
                        <SelectItem value="3 months">3 months</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {/* Current Location Dropdown */}
                  <div className="space-y-2">
                    <Label>Current Location</Label>
                    <Select
                      value={editingCandidate.currentLocation}
                      onValueChange={(value) => setEditingCandidate({ ...editingCandidate, currentLocation: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select location" />
                      </SelectTrigger>
                      <SelectContent searchable searchPlaceholder="Search locations..." onSearchChange={(value) => {}} side="bottom">
                        <SelectItem value="Remote">Remote</SelectItem>
                        {COUNTRIES.map((country) => 
                          country.cities.map((city) => (
                            <SelectItem key={`${country.code}-${city}`} value={`${city}, ${country.name}`}>
                              {city}, {country.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Pipeline Status Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center space-x-2">
                  <Briefcase className="w-5 h-5 text-purple-600" />
                  <span>Pipeline Status</span>
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label>Current Status</Label>
                    <Select
                      value={editingCandidate.status}
                      onValueChange={(value) => setEditingCandidate({ ...editingCandidate, status: value })}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent searchable searchPlaceholder="Search status types..." onSearchChange={setStatusSearch} side="bottom">
                        {getFilteredStatuses().map((status) => (
                          <SelectItem key={status.key} value={status.key}>
                            <div className="flex items-center space-x-2">
                              <div
                                className={`w-2 h-2 rounded-full ${status.color.includes("blue") ? "bg-blue-500" : status.color.includes("yellow") ? "bg-yellow-500" : status.color.includes("orange") ? "bg-orange-500" : status.color.includes("purple") ? "bg-purple-500" : status.color.includes("indigo") ? "bg-indigo-500" : status.color.includes("violet") ? "bg-violet-500" : status.color.includes("pink") ? "bg-pink-500" : status.color.includes("cyan") ? "bg-cyan-500" : status.color.includes("emerald") ? "bg-emerald-500" : status.color.includes("green") ? "bg-green-500" : status.color.includes("lime") ? "bg-lime-500" : status.color.includes("teal") ? "bg-teal-500" : status.color.includes("sky") ? "bg-sky-500" : status.color.includes("red") ? "bg-red-500" : status.color.includes("gray") ? "bg-gray-500" : "bg-amber-500"}`}
                              ></div>
                              <span>{status.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Salary Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center space-x-2">
                  <IndianRupee className="w-5 h-5 text-green-600" />
                  <span>Salary Information</span>
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Current Salary</Label>
                    <input
                      type="number"
                      value={editingCandidate.salaryExpectation}
                      onChange={(e) =>
                        setEditingCandidate({ ...editingCandidate, salaryExpectation: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Expected Salary</Label>
                    <input
                      type="number"
                      value={editingCandidate.salaryExpectation}
                      onChange={(e) =>
                        setEditingCandidate({ ...editingCandidate, salaryExpectation: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
              </div>




            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditCandidate} className="bg-blue-600 hover:bg-blue-700">
              <Edit className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Candidate Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto bg-gradient-to-br from-gray-50 to-white">
          <DialogHeader className="pb-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg">
                  <UserIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-bold text-gray-900">
                    {viewingCandidate?.fullName}
                  </DialogTitle>
                  <DialogDescription className="text-gray-600 mt-1">
                    {viewingCandidate?.email} • {viewingCandidate?.phone}
                  </DialogDescription>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge className={getStatusInfo(viewingCandidate?.status || '').color} variant="outline">
                  {getStatusInfo(viewingCandidate?.status || '').label}
                </Badge>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  {viewingCandidate?.totalApplications} Applications
                </Badge>
              </div>
            </div>
          </DialogHeader>

          {viewingCandidate && (
            <div className="py-6 space-y-8">
              {/* Header Stats */}
              <div className="grid grid-cols-4 gap-6">
                <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <MapPin className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Location</p>
                      <p className="text-lg font-semibold text-gray-900">{viewingCandidate.currentLocation}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Briefcase className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Experience</p>
                      <p className="text-lg font-semibold text-gray-900">{viewingCandidate.yearsOfExperience}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <IndianRupee className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Expected Salary</p>
                      <p className="text-lg font-semibold text-gray-900">₹{viewingCandidate.salaryExpectation.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Calendar className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Notice Period</p>
                      <p className="text-lg font-semibold text-gray-900">{viewingCandidate.noticePeriod}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-3 gap-8">
                {/* Left Column - Personal Info & Skills */}
                <div className="space-y-6">
                  {/* Personal Information */}
                  <Card className="border-0 shadow-lg bg-white">
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-2 mb-4">
                        <UserIcon className="w-5 h-5 text-blue-600" />
                        <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
                      </div>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <span className="text-sm font-medium text-gray-600">Full Name</span>
                          <span className="text-sm font-semibold text-gray-900">{viewingCandidate.fullName}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <span className="text-sm font-medium text-gray-600">Email</span>
                          <span className="text-sm text-blue-600">{viewingCandidate.email}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <span className="text-sm font-medium text-gray-600">Phone</span>
                          <span className="text-sm text-gray-900">{viewingCandidate.phone}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <span className="text-sm font-medium text-gray-600">Remote Work</span>
                          <Badge variant="outline" className={viewingCandidate.remoteWork ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-50 text-gray-700 border-gray-200"}>
                            {viewingCandidate.remoteWork ? 'Yes' : 'No'}
                          </Badge>
                        </div>
                        {viewingCandidate.portfolioUrl && (
                          <div className="flex justify-between items-center py-2">
                            <span className="text-sm font-medium text-gray-600">Portfolio</span>
                            <span className="text-sm text-blue-600 hover:underline cursor-pointer" 
                                   onClick={() => window.open(viewingCandidate.portfolioUrl, '_blank')}>
                              View Portfolio
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Skills */}
                  <Card className="border-0 shadow-lg bg-white">
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-2 mb-4">
                        <Brain className="w-5 h-5 text-purple-600" />
                        <h3 className="text-lg font-semibold text-gray-900">Skills & Expertise</h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {viewingCandidate.keySkills.split(',').map((skill, index) => (
                          <Badge key={index} variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                            {skill.trim()}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Resume */}
                  {viewingCandidate.resumeDownloadUrl && (
                    <Card className="border-0 shadow-lg bg-white">
                      <CardContent className="p-6">
                        <div className="flex items-center space-x-2 mb-4">
                          <Upload className="w-5 h-5 text-blue-600" />
                          <h3 className="text-lg font-semibold text-gray-900">Resume</h3>
                        </div>
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            Available
                          </Badge>
                          <Button
                            variant="outline"
                            onClick={() => {
                              if (viewingCandidate.resumeDownloadUrl) {
                                window.open(viewingCandidate.resumeDownloadUrl, '_blank')
                              }
                            }}
                            className="text-blue-600 border-blue-200 hover:bg-blue-50"
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Center Column - Application History */}
                <div className="col-span-2">
                  <Card className="border-0 shadow-lg bg-white">
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-2 mb-6">
                        <Briefcase className="w-5 h-5 text-indigo-600" />
                        <h3 className="text-lg font-semibold text-gray-900">Application History</h3>
                        <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                          {viewingCandidate.totalApplications} applications
                        </Badge>
                      </div>
                                             <div className="space-y-4">
                         {viewingCandidate.appliedJobs
                           .filter(appliedJob => !selectedJobId || appliedJob.applicationId.toString() === selectedJobId)
                           .map((appliedJob, index) => (
                           <div key={appliedJob.applicationId} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex-1">
                                <h4 className="font-semibold text-lg text-gray-900">{appliedJob.job.title}</h4>
                                <p className="text-gray-600 font-medium">{appliedJob.job.company}</p>
                                <p className="text-sm text-gray-500">{appliedJob.job.city}</p>
                              </div>
                              <div className="flex space-x-2">
                                <Badge className={getJobTypeColor(appliedJob.job.jobType.toLowerCase())}>
                                  {appliedJob.job.jobType}
                                </Badge>
                                <Badge 
                                  variant="outline" 
                                  className={`${
                                    appliedJob.job.priority === 'high' ? 'bg-red-50 text-red-700 border-red-200' :
                                    appliedJob.job.priority === 'medium' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                    'bg-green-50 text-green-700 border-green-200'
                                  }`}
                                >
                                  {appliedJob.job.priority}
                                </Badge>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                              <div>
                                <span className="font-medium text-gray-600">Salary Range:</span>
                                <p className="text-gray-900">₹{appliedJob.job.salaryMin.toLocaleString()} - ₹{appliedJob.job.salaryMax.toLocaleString()}</p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-600">Experience Level:</span>
                                <p className="text-gray-900">{appliedJob.job.experienceLevel}</p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-600">Work Type:</span>
                                <p className="text-gray-900">{appliedJob.job.workType}</p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-600">Job Status:</span>
                                <p className="text-gray-900">{appliedJob.job.jobStatus}</p>
                              </div>
                            </div>
                            
                            {/* Status Pipeline Section */}
                            <div className="mb-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                              <div className="flex items-center space-x-2 mb-3">
                                <AlertCircle className="w-4 h-4 text-blue-600" />
                                <h5 className="font-semibold text-blue-900">Application Status Pipeline</h5>
                              </div>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <Select
                                    value={appliedJob.applicationStatus}
                                    onValueChange={(value) => {
                                      // Call the updateCandidateStatus function
                                      updateCandidateStatus(viewingCandidate.id, appliedJob.job.id, value)
                                    }}
                                  >
                                    <SelectTrigger className="w-[200px] h-8 border-blue-200 hover:border-blue-300 transition-colors bg-white shadow-sm">
                                      <SelectValue>
                                        <div className="flex items-center space-x-2">
                                          <div
                                            className={`w-2 h-2 rounded-full ${
                                              getStatusInfo(appliedJob.applicationStatus).color.includes("blue")
                                                ? "bg-blue-500"
                                                : getStatusInfo(appliedJob.applicationStatus).color.includes("yellow")
                                                  ? "bg-yellow-500"
                                                  : getStatusInfo(appliedJob.applicationStatus).color.includes("orange")
                                                    ? "bg-orange-500"
                                                    : getStatusInfo(appliedJob.applicationStatus).color.includes("purple")
                                                      ? "bg-purple-500"
                                                      : getStatusInfo(appliedJob.applicationStatus).color.includes("indigo")
                                                        ? "bg-indigo-500"
                                                        : getStatusInfo(appliedJob.applicationStatus).color.includes("violet")
                                                          ? "bg-violet-500"
                                                          : getStatusInfo(appliedJob.applicationStatus).color.includes("pink")
                                                            ? "bg-pink-500"
                                                            : getStatusInfo(appliedJob.applicationStatus).color.includes("cyan")
                                                              ? "bg-cyan-500"
                                                              : getStatusInfo(appliedJob.applicationStatus).color.includes("emerald")
                                                                ? "bg-emerald-500"
                                                                : getStatusInfo(appliedJob.applicationStatus).color.includes("green")
                                                                  ? "bg-green-500"
                                                                  : getStatusInfo(appliedJob.applicationStatus).color.includes("lime")
                                                                    ? "bg-lime-500"
                                                                    : getStatusInfo(appliedJob.applicationStatus).color.includes("teal")
                                                                      ? "bg-teal-500"
                                                                      : getStatusInfo(appliedJob.applicationStatus).color.includes("sky")
                                                                        ? "bg-sky-500"
                                                                        : getStatusInfo(appliedJob.applicationStatus).color.includes("red")
                                                                          ? "bg-red-500"
                                                                          : getStatusInfo(appliedJob.applicationStatus).color.includes("gray")
                                                                            ? "bg-gray-500"
                                                                            : "bg-amber-500"
                                            }`}
                                          ></div>
                                          <span className="text-sm font-medium">{getStatusInfo(appliedJob.applicationStatus).label}</span>
                                        </div>
                                      </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                      {PIPELINE_STATUSES.map((status) => (
                                        <SelectItem key={status.key} value={status.key}>
                                          <div className="flex items-center space-x-2">
                                            <div
                                              className={`w-2 h-2 rounded-full ${
                                                status.color.includes("blue")
                                                  ? "bg-blue-500"
                                                  : status.color.includes("yellow")
                                                    ? "bg-yellow-500"
                                                    : status.color.includes("orange")
                                                      ? "bg-orange-500"
                                                      : status.color.includes("purple")
                                                        ? "bg-purple-500"
                                                        : status.color.includes("indigo")
                                                          ? "bg-indigo-500"
                                                          : status.color.includes("violet")
                                                            ? "bg-violet-500"
                                                            : status.color.includes("pink")
                                                              ? "bg-pink-500"
                                                              : status.color.includes("cyan")
                                                                ? "bg-cyan-500"
                                                                : status.color.includes("emerald")
                                                                  ? "bg-emerald-500"
                                                                  : status.color.includes("green")
                                                                    ? "bg-green-500"
                                                                    : status.color.includes("lime")
                                                                      ? "bg-lime-500"
                                                                      : status.color.includes("teal")
                                                                        ? "bg-teal-500"
                                                                        : status.color.includes("sky")
                                                                          ? "bg-sky-500"
                                                                          : status.color.includes("red")
                                                                            ? "bg-red-500"
                                                                            : status.color.includes("gray")
                                                                              ? "bg-gray-500"
                                                                              : "bg-amber-500"
                                                }`}
                                              ></div>
                                              <span>{status.label}</span>
                                            </div>
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                </div>
                                <Badge 
                                  variant="outline" 
                                  className={`${
                                    appliedJob.applicationStatus === 'active' ? 'bg-green-50 text-green-700 border-green-200' :
                                    appliedJob.applicationStatus === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                                    appliedJob.applicationStatus === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                    'bg-gray-50 text-gray-700 border-gray-200'
                                  }`}
                                >
                                  {appliedJob.applicationStatus}
                                </Badge>
                              </div>
                            </div>
                            
                            <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                              <div className="flex items-center space-x-2">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-600">Applied: {formatDateDDMMMYYYY(appliedJob.appliedAt)}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 bg-gray-50 -mx-6 -mb-6 px-6 py-4">
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
            <Button 
              onClick={() => {
                setEditingCandidate(viewingCandidate)
                setIsViewDialogOpen(false)
                setIsEditDialogOpen(true)
              }} 
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Candidate
            </Button>
          </div>
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
                <h4 className="font-medium text-gray-900">{candidateToDelete.fullName}</h4>
                <p className="text-sm text-gray-600">{candidateToDelete.email}</p>
                <p className="text-sm text-gray-500 mt-1">
                  Applied for {candidateToDelete.appliedJobs.length} job(s)
                </p>
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
    </div>
  )
}

const getApplicationsBadgeText = (candidate: Candidate) => {
  if (candidate.appliedJobs.length <= 1) return ""
  
  return `${candidate.appliedJobs.length - 1} more applications`
}

