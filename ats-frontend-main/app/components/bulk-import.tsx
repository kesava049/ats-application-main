"use client"

import type React from "react"
import { useState, useCallback, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Badge } from "../../components/ui/badge"
import { Progress } from "../../components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs"
import { Input } from "../../components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table"
import { Checkbox } from "../../components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../../components/ui/dialog"
import { Label } from "../../components/ui/label"
import { Separator } from "../../components/ui/separator"
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  X,
  Eye,
  RefreshCw,
  FileSpreadsheet,
  Clock,
  XCircle,
  User,
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  Briefcase,
  Code,
  Globe,
  Award,
  Search,
  Filter,
  Download,
  Plus,
  Trash2,
  Settings,
} from "lucide-react"
import BASE_API_URL from "../../PythonApi"
import NODE_API_URL from "../../NodeApi"
import { useToast } from "../../hooks/use-toast"
import { Switch } from "../../components/ui/switch"
import { handleAuthError } from "../../lib/auth-error-handler"

interface ParsedResumeData {
  Name: string
  Email: string
  Phone: string
  Address: string
  Summary: string
  Experience: Array<{
    Company: string
    Position: string
    Duration: string
    Description: string
  }>
  Education: Array<{
    Institution: string
    Degree: string
    Field: string
    Year: string
  }>
  Skills: string[]
  Languages: string[]
  Projects: Array<{
    Name: string
    Description: string
    Technologies?: string[]
  }>
  TotalExperience: string
  Certifications?: string[]
}

interface ResumeData {
  id: number
  filename: string
  file_type: string
  candidate_name: string
  candidate_email: string
  total_experience: string
  parsed_data?: string | null // JSON string that needs to be parsed, can be undefined
  created_at: string
  updated_at?: string
  candidate_created?: boolean // Whether a candidate was created from this resume
  candidate_id?: number // ID of the created candidate if available
}

interface ResumeParseResponse {
  total_files: number
  successful_files: number
  failed_files: number
  duplicate_files: number
  total_processing_time: number
  candidates_created?: number
  candidates_failed?: number
  candidates_duplicates?: number
  results: Array<{
    filename: string
    status: "success" | "failed" | "duplicate"
    error?: string | null
    parsed_data?: ParsedResumeData | null
    file_type?: string | null
    processing_time?: number
    embedding_status?: string
    embedding_generated?: boolean
    candidate_created?: boolean
    candidate_creation_error?: string | null
    candidate_id?: number | null
    resume_id?: number | null
  }>
}

// Unified job interface for all processing jobs
interface UnifiedJob {
  id: string
  jobId: string
  type: 'bulk_import' | 're_upload'
  status: 'pending' | 'processing' | 'completed' | 'failed'
  total_files: number
  successful_files: number
  failed_files: number
  duplicate_files?: number
  created_at: string
  updated_at: string
  results: ProcessedFile[]
  source: 'python' | 'nodejs'
  progress_percentage?: number
}

interface ProcessedFile {
  resume_id: string
  filename: string
  status: 'success' | 'failed'
  processing_time?: number
  parsed_data?: any
  candidate_id?: number
  candidate_created?: boolean
  candidate_creation_error?: string | null
  error?: string
}

// JobCard component for displaying unified processing jobs
const JobCard = ({ job }: { job: UnifiedJob }) => {
  const [showDetails, setShowDetails] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'bulk_import':
        return 'bg-blue-100 text-blue-800';
      case 're_upload':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <h4 className="font-medium text-gray-900">Job ID: {job.jobId}</h4>
          <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(job.type)}`}>
            {job.type === 'bulk_import' ? 'Bulk Import' : 'Re-upload'}
          </span>
          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(job.status)}`}>
            {job.status?.charAt(0).toUpperCase() + job.status?.slice(1) || 'Unknown'}
          </span>
        </div>
        <div className="text-sm text-gray-500">
          {new Date(job.created_at).toLocaleString()}
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
        <div>
          <span className="text-gray-600">Total Files:</span>
          <span className="ml-1 font-medium">{job.total_files}</span>
        </div>
        <div>
          <span className="text-gray-600">Successful:</span>
          <span className="ml-1 font-medium text-green-600">{job.successful_files}</span>
        </div>
        <div>
          <span className="text-gray-600">Failed:</span>
          <span className="ml-1 font-medium text-red-600">{job.failed_files}</span>
        </div>
        <div>
          <span className="text-gray-600">Duplicates:</span>
          <span className="ml-1 font-medium text-yellow-600">{job.duplicate_files || 0}</span>
        </div>
      </div>
      
      {/* Candidate Creation Summary */}
      {job.results && job.results.length > 0 && (
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Candidate Creation Summary</span>
            </div>
            <div className="flex items-center space-x-4 text-sm">
              {(() => {
                const hasCandidateCreationData = job.results.some((r: any) => r.candidate_created !== undefined)
                if (!hasCandidateCreationData) {
                  return <span className="text-gray-500">Candidate creation not executed</span>
                }
                const created = job.results.filter((r: any) => r.candidate_created).length
                const failed = job.results.filter((r: any) => r.status === 'success' && r.candidate_created === false).length
                return (
                  <>
                    <span className="text-green-600">
                      ✓ {created} Created
                    </span>
                    <span className="text-red-600">
                      ✗ {failed} Failed
                    </span>
                  </>
                )
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Candidate Creation Status Display */}
      {(job as any).candidate_creation_error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
            <div className="flex-1">
              <h6 className="font-medium text-red-800">Candidate Creation Failed</h6>
              <p className="text-sm text-red-700 mt-1">{(job as any).candidate_creation_error}</p>
              {(job as any).candidate_creation_suggestion && (
                <p className="text-sm text-red-600 mt-1">
                  <strong>Suggestion:</strong> {(job as any).candidate_creation_suggestion}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {job.results && job.results.length > 0 && (
        <div className="mt-3">
          <div className="flex items-center justify-between mb-2">
            <h5 className="font-medium text-gray-700">File Results ({job.results.length} files)</h5>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? 'Hide Details' : 'Show Details'}
            </Button>
          </div>
          
          {showDetails && (
            <div className="bg-gray-50 rounded p-3 max-h-60 overflow-y-auto">
              <div className="space-y-2">
                {job.results.map((file, index) => (
                  <div key={file.resume_id || index} className="flex items-center justify-between p-2 bg-white rounded border">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{file.filename}</div>
                      {file.parsed_data?.name && (
                        <div className="text-xs text-gray-600">
                          Candidate: {file.parsed_data.name}
                        </div>
                      )}
                      {file.parsed_data?.Email && (
                        <div className="text-xs text-gray-500">
                          Email: {file.parsed_data.Email}
                        </div>
                      )}
                      {file.candidate_creation_error && (
                        <div className="text-xs text-red-500 mt-1">
                          Error: {file.candidate_creation_error}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        file.status === 'success' 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {file.status}
                      </span>
                      {file.processing_time && (
                        <span className="text-xs text-gray-500">
                          {file.processing_time}s
                        </span>
                      )}
                      {/* Show green check for successful processing (both parsing AND candidate creation) */}
                      {file.status === 'success' && file.candidate_created && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                      {/* Show red X for failed processing (parsing OR candidate creation failed) */}
                      {file.status === 'failed' && (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface ProcessingResult {
  filename: string
  status: "success" | "failed" | "duplicate"
  error?: string | null
  parsed_data?: ParsedResumeData | null
  file_type?: string | null
  processing_time?: number
  embedding_status?: string
  embedding_generated?: boolean
  resume_id?: number | null
  candidate_created?: boolean
  candidate_creation_error?: string | null
  candidate_id?: number | null
  failure_reason?: string
  failure_type?: string
}

interface BulkProcessingStatus {
  total_jobs?: number
  active_jobs?: number
  completed_jobs?: number
  failed_jobs?: number
  duplicate_jobs?: number
  total_users?: number
  active_users?: number
  progress_percentage?: number
  file_results?: Array<{
    filename: string
    status: "success" | "failed" | "duplicate"
    error?: string | null
    parsed_data?: ParsedResumeData | null
    file_type?: string | null
    processing_time?: number
    embedding_status?: string
    embedding_generated?: boolean
  }>
  summary?: {
    total_files?: number
    successful_files?: number
    failed_files?: number
    duplicate_files?: number
  }
}

interface FailedResume {
  resume_id: string
  filename: string
  file_size: number
  file_type: string
  created_at: number
  file_path: string
  failure_reason: string
  failure_type: string
  can_reupload: boolean
}

// Resume Files List Component
function ResumeFilesList() {
  const { toast } = useToast()
  const [resumeFiles, setResumeFiles] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeFileTypeTab, setActiveFileTypeTab] = useState<string>("all")
  const [dateFilter, setDateFilter] = useState<string>("all")
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")
  const [selectedFiles, setSelectedFiles] = useState<Set<number>>(new Set())

  const fetchResumeFiles = async () => {
    setLoading(true)
    try {
      // Get company ID from localStorage
      const user = JSON.parse(localStorage.getItem('ats_user') || 'null');
      const companyId = user?.companyId;
      
      const url = new URL(`${BASE_API_URL}/download/resumes/with-files`);
      if (companyId) {
        url.searchParams.set('company_id', companyId.toString());
      }
      
      const response = await fetch(url.toString())
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setResumeFiles(data.resumes || [])
    } catch (error) {
      console.error('Error fetching resume files:', error)
      toast({
        title: "Error",
        description: "Failed to fetch resume files. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (downloadUrl: string, filename: string) => {
    try {
      // Get JWT token and company ID from localStorage
      const user = JSON.parse(localStorage.getItem('ats_user') || 'null');
      const token = user?.token;
      const companyId = user?.companyId;

      if (!token || !companyId) {
        throw new Error('Authentication required. Please login again.');
      }

      const response = await fetch(`${BASE_API_URL.replace('/api/v1', '')}${downloadUrl}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Company-ID': companyId.toString()
        }
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
          throw new Error('Access denied. You do not have permission to download this file.');
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast({
        title: "Download Started",
        description: `${filename} is being downloaded.`,
      })
    } catch (error) {
      console.error('Error downloading file:', error)
      toast({
        title: "Download Failed",
        description: "Failed to download the file. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleFileSelection = (fileId: number, checked: boolean) => {
    const newSelectedFiles = new Set(selectedFiles)
    if (checked) {
      newSelectedFiles.add(fileId)
    } else {
      newSelectedFiles.delete(fileId)
    }
    setSelectedFiles(newSelectedFiles)
  }

  const handleSelectAll = () => {
    if (selectedFiles.size === filteredFiles.length) {
      // If all are selected, deselect all
      setSelectedFiles(new Set())
    } else {
      // Select all filtered files
      const allFileIds = new Set(filteredFiles.map(file => file.id))
      setSelectedFiles(allFileIds)
    }
  }

  const handleBulkDownload = async () => {
    if (selectedFiles.size === 0) {
      toast({
        title: "No Files Selected",
        description: "Please select at least one file to download.",
        variant: "destructive",
      })
      return
    }

    const selectedFileData = filteredFiles.filter(file => selectedFiles.has(file.id))
    
    try {
      // Download each selected file
      for (const file of selectedFileData) {
        await handleDownload(file.download_url, file.filename)
        // Add a small delay between downloads to avoid overwhelming the browser
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      
      toast({
        title: "Bulk Download Complete",
        description: `Successfully downloaded ${selectedFiles.size} file(s).`,
      })
      
      // Clear selection after successful download
      setSelectedFiles(new Set())
    } catch (error) {
      console.error('Error during bulk download:', error)
      toast({
        title: "Bulk Download Failed",
        description: "Some files failed to download. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Clear selection when filters change
  useEffect(() => {
    setSelectedFiles(new Set())
  }, [searchTerm, activeFileTypeTab, dateFilter, startDate, endDate])

  useEffect(() => {
    fetchResumeFiles()
  }, [])

  // Filter files by search term, file type, and date
  const filteredFiles = resumeFiles.filter(file => {
    const matchesSearch = file.candidate_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         file.candidate_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         file.filename.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFileType = activeFileTypeTab === "all" || file.file_type.toLowerCase() === activeFileTypeTab.toLowerCase()
    
    // Date filtering logic
    let matchesDate = true
    if (dateFilter !== "all") {
      const fileDate = new Date(file.upload_date)
      const today = new Date()
      
      switch (dateFilter) {
        case "today":
          matchesDate = fileDate.toDateString() === today.toDateString()
          break
        case "yesterday":
          const yesterday = new Date(today)
          yesterday.setDate(yesterday.getDate() - 1)
          matchesDate = fileDate.toDateString() === yesterday.toDateString()
          break
        case "this_week":
          const startOfWeek = new Date(today)
          startOfWeek.setDate(today.getDate() - today.getDay())
          startOfWeek.setHours(0, 0, 0, 0)
          matchesDate = fileDate >= startOfWeek
          break
        case "this_month":
          matchesDate = fileDate.getMonth() === today.getMonth() && fileDate.getFullYear() === today.getFullYear()
          break
        case "last_month":
          const lastMonth = new Date(today)
          lastMonth.setMonth(lastMonth.getMonth() - 1)
          matchesDate = fileDate.getMonth() === lastMonth.getMonth() && fileDate.getFullYear() === lastMonth.getFullYear()
          break
        case "custom":
          if (startDate && endDate) {
            const start = new Date(startDate)
            const end = new Date(endDate)
            end.setHours(23, 59, 59, 999) // Include end date
            matchesDate = fileDate >= start && fileDate <= end
          }
          break
      }
    }
    
    return matchesSearch && matchesFileType && matchesDate
  })



  // Get file type count
  const getFileTypeCount = (fileType: string) => {
    if (fileType === "all") {
      return resumeFiles.length
    }
    return resumeFiles.filter(file => file.file_type.toLowerCase() === fileType.toLowerCase()).length
  }

  // File types for tabs
  const fileTypes = ["all", "pdf", "docx", "doc", "txt"]

  // Get file type icon for tabs
  const getFileTypeIcon = (fileType: string) => {
    switch (fileType.toLowerCase()) {
      case 'all':
        return <FileText className="w-4 h-4" />
      case 'pdf':
        return <FileText className="w-4 h-4 text-red-500" />
      case 'doc':
      case 'docx':
        return <FileText className="w-4 h-4 text-blue-500" />
      case 'txt':
        return <FileText className="w-4 h-4 text-gray-500" />
      default:
        return <FileText className="w-4 h-4" />
    }
  }

  // Get file icon for results
  const getFileIcon = (fileType: string) => {
    switch (fileType.toLowerCase()) {
      case 'pdf':
        return <FileText className="w-4 h-4 text-red-500" />
      case 'doc':
      case 'docx':
        return <FileText className="w-4 h-4 text-blue-500" />
      case 'txt':
        return <FileText className="w-4 h-4 text-gray-500" />
      case 'rtf':
        return <FileText className="w-4 h-4 text-orange-500" />
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'webp':
        return <FileText className="w-4 h-4 text-green-500" />
      default:
        return <FileText className="w-4 h-4 text-gray-400" />
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Search className="w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search by name, email, or filename..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
        </div>
        <Button 
          onClick={() => {
            fetchResumeFiles()
            setSelectedFiles(new Set())
          }} 
          disabled={loading} 
          variant="outline"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Date Filters */}
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-700">Date Filters</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setDateFilter("all")
              setStartDate("")
              setEndDate("")
              setSelectedFiles(new Set())
            }}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            Clear Filters
          </Button>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          {/* Quick Date Filters */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-600">Quick:</span>
            <div className="flex space-x-1">
              {[
                { value: "all", label: "All" },
                { value: "today", label: "Today" },
                { value: "yesterday", label: "Yesterday" },
                { value: "this_week", label: "This Week" },
                { value: "this_month", label: "This Month" },
                { value: "last_month", label: "Last Month" }
              ].map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => {
                    setDateFilter(filter.value)
                    setSelectedFiles(new Set())
                  }}
                  className={`px-2 py-1 text-xs rounded-md transition-colors ${
                    dateFilter === filter.value
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Date Range */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-600">Custom:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value)
                setDateFilter("custom")
              }}
              className="px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <span className="text-xs text-gray-500">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value)
                setDateFilter("custom")
              }}
              className="px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              onClick={() => setDateFilter("custom")}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                dateFilter === "custom" && (startDate || endDate)
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              Apply
            </button>
          </div>
        </div>

        {/* Active Filter Display */}
        {dateFilter !== "all" && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500">Active filter:</span>
              <Badge variant="outline" className="text-xs">
                {dateFilter === "custom" 
                  ? `Custom: ${startDate} to ${endDate}`
                  : dateFilter.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
                }
              </Badge>
              <span className="text-xs text-gray-500">
                ({filteredFiles.length} of {resumeFiles.length} files)
              </span>
            </div>
          </div>
        )}
      </div>

      {/* File Type Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {fileTypes.map((fileType) => (
            <button
              key={fileType}
              onClick={() => {
                setActiveFileTypeTab(fileType)
                setSelectedFiles(new Set())
              }}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeFileTypeTab === fileType
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {getFileTypeIcon(fileType)}
              <span className="capitalize">{fileType === "all" ? "All Files" : fileType}</span>
              <Badge variant="secondary" className="text-xs">
                {getFileTypeCount(fileType)}
              </Badge>
            </button>
          ))}
        </nav>
      </div>

      {/* Selection Controls */}
      {filteredFiles.length > 0 && (
        <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="select-all"
                checked={selectedFiles.size === filteredFiles.length && filteredFiles.length > 0}
                onCheckedChange={handleSelectAll}
                className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
              />
              <Label htmlFor="select-all" className="text-sm font-medium text-gray-700">
                Select All ({selectedFiles.size} of {filteredFiles.length})
              </Label>
            </div>
          </div>
          {selectedFiles.size > 0 && (
            <Button
              onClick={handleBulkDownload}
              className="bg-green-600 hover:bg-green-700 text-white"
              size="sm"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Selected ({selectedFiles.size})
            </Button>
          )}
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
          <p className="text-gray-600">Loading resume files...</p>
        </div>
      ) : filteredFiles.length > 0 ? (
        <div className="space-y-3">
          {/* Active Filters Summary */}
          {(searchTerm || activeFileTypeTab !== "all" || dateFilter !== "all") && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Filter className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">Active Filters:</span>
                </div>
                <span className="text-sm text-blue-600">
                  Showing {filteredFiles.length} of {resumeFiles.length} files
                </span>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {searchTerm && (
                  <Badge variant="secondary" className="text-xs">
                    Search: "{searchTerm}"
                  </Badge>
                )}
                {activeFileTypeTab !== "all" && (
                  <Badge variant="secondary" className="text-xs">
                    File Type: {activeFileTypeTab.toUpperCase()}
                  </Badge>
                )}
                {dateFilter !== "all" && (
                  <Badge variant="secondary" className="text-xs">
                    Date: {dateFilter === "custom" 
                      ? `Custom (${startDate} to ${endDate})`
                      : dateFilter.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
                    }
                  </Badge>
                )}
              </div>
            </div>
          )}
          
          {filteredFiles.map((file) => (
            <div key={file.id} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id={`file-${file.id}`}
                  checked={selectedFiles.has(file.id)}
                  onCheckedChange={(checked) => handleFileSelection(file.id, checked as boolean)}
                  className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                />
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  {getFileTypeIcon(file.file_type)}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{file.candidate_name}</h4>
                  <p className="text-sm text-gray-600">{file.candidate_email}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {file.file_type.toUpperCase()}
                    </Badge>
                    <span className="text-xs text-gray-500">{file.filename}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500">
                  {new Date(file.upload_date).toLocaleDateString()}
                </span>
                <Button
                  onClick={() => handleDownload(file.download_url, file.filename)}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">
            {(() => {
              const filters = []
              if (searchTerm) filters.push('search term')
              if (activeFileTypeTab !== "all") filters.push(`${activeFileTypeTab.toUpperCase()} file type`)
              if (dateFilter !== "all") {
                if (dateFilter === "custom") {
                  filters.push(`date range (${startDate} to ${endDate})`)
                } else {
                  filters.push(dateFilter.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()))
                }
              }
              
              if (filters.length > 0) {
                return `No files found matching your ${filters.join(', ')} criteria.`
              }
              return 'No resume files available for download.'
            })()}
          </p>
          {(searchTerm || activeFileTypeTab !== "all" || dateFilter !== "all") && (
            <p className="text-sm text-gray-500 mt-2">
              Try adjusting your filters or search terms.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export default function BulkImport() {
  const { toast } = useToast()

  // Data validation function to ensure safe numeric values
  const validateParseResults = (data: ResumeParseResponse | null): ResumeParseResponse => {
    console.log('🔍 validateParseResults input:', data)
    
    if (!data) {
      console.log('🔍 validateParseResults: No data provided')
      return {
        total_files: 0,
        successful_files: 0,
        failed_files: 0,
        duplicate_files: 0,
        total_processing_time: 0,
        results: []
      }
    }
    
    const validated = {
      total_files: Number(data.total_files) || 0,
      successful_files: Number(data.successful_files) || 0,
      failed_files: Number(data.failed_files) || 0,
      duplicate_files: Number(data.duplicate_files) || 0,
      total_processing_time: Number(data.total_processing_time) || 0,
      candidates_created: Number(data.candidates_created) || 0,
      candidates_failed: Number(data.candidates_failed) || 0,
      candidates_duplicates: Number(data.candidates_duplicates) || 0,
      results: Array.isArray(data.results) ? data.results.map(result => ({
        ...result,
        // Map candidate creation status from backend
        candidate_created: result.candidate_created || false,
        candidate_creation_error: result.candidate_creation_error || null,
        candidate_id: result.candidate_id || null,
        resume_id: result.resume_id || null,
        // Update status based on parsing success (candidate creation is optional)
        status: (result.status === 'success' || result.status === 'duplicate') ? result.status : 'failed' as "success" | "failed" | "duplicate"
      })) : []
    }
    
    console.log('🔍 validateParseResults output:', validated)
    return validated
  }

  // Safe number display component for better error handling
  const SafeNumberDisplay = ({ value, fallback = 0, decimals = 1, className = "" }: {
    value: number | undefined | null,
    fallback?: number,
    decimals?: number,
    className?: string
  }) => {
    try {
      const numValue = Number(value) || fallback
      return <span className={className}>{numValue.toFixed(decimals)}</span>
    } catch (error) {
      console.error('Error formatting number:', error)
      return <span className={className}>{fallback.toFixed(decimals)}</span>
    }
  }

  // Consolidated refresh function for all bulk data
  const refreshAllBulkData = async () => {
    setIsCheckingStatus(true)
    try {
      await Promise.all([
        fetchBulkProcessingStatus(),
        fetchUnifiedJobs()
      ])
    } catch (error) {
      console.error('Error refreshing bulk data:', error)
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh bulk processing data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsCheckingStatus(false)
    }
  }

  // Job polling function for background processing
  const pollJobStatus = async (jobId: string) => {
    const maxAttempts = 300 // 10 minutes max (300 * 2 seconds)
    let attempts = 0
    
    const poll = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('ats_user') || 'null')
        const token = user?.token
        const companyId = user?.companyId

        if (!token || !companyId) {
          throw new Error('Authentication required')
        }

        const response = await fetch(`${BASE_API_URL}/bulk-processing-status/${jobId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          const jobData = await response.json()
          
          if (jobData.error) {
            throw new Error(jobData.error)
          }

          // Update progress
          const progress = parseFloat(jobData.progress || '0')
          setProcessingProgress(progress)
          setProgressMessage(`Processing resumes... Please wait`)
          
          // Update browser tab title with live percentage
          const originalTitle = document.title
          if (progress > 0 && progress < 100) {
            document.title = `Processing Resumes... ${progress.toFixed(1)}% - ${originalTitle}`
          } else if (progress >= 100) {
            document.title = `✅ Completed - ${originalTitle}`
          }

          // Check if job is completed
          if (jobData.status === 'completed') {
            setProcessingProgress(100)
            setProgressMessage(`Successfully processed ${jobData.successful_files || 0} resumes!`)
            setProcessingStatus("completed")
            
            // Reset tab title after completion
            setTimeout(() => {
              document.title = document.title.replace(/^✅ Completed - /, '')
            }, 3000)
            
            // Update parse results with job data
            const validatedData = validateParseResults({
              total_files: jobData.total_files || 0,
              successful_files: jobData.successful_files || 0,
              failed_files: jobData.failed_files || 0,
              duplicate_files: jobData.duplicate_files || 0,
              total_processing_time: jobData.total_processing_time || 0,
              results: jobData.results || []
            })
            
            setParseResults(validatedData)
            setParsedResumes(validatedData.results)
            setProcessingResults(validatedData.results)
            
            // Clear uploaded files
            setUploadedFiles([])
            
            // Close progress modal and show results
            setShowProgressModal(false)
            setShowResultsModal(true)
            
            // Refresh all data
            await Promise.all([
              fetchResumes(),
              fetchBulkProcessingStatus(),
              fetchFailedResumes()
            ])

            toast({
              title: "✅ Success",
              description: `Successfully processed ${jobData.successful_files || 0} resumes!`,
              duration: 5000,
            })
            
            return // Stop polling
          } else if (jobData.status === 'failed') {
            // Reset tab title on failure
            document.title = document.title.replace(/^Processing Resumes\.\.\. \d+\.\d+% - /, '')
            throw new Error(jobData.error || 'Job failed')
          } else if (jobData.status === 'cancelled') {
            setProcessingStatus("cancelled")
            setProgressMessage('Processing cancelled')
            setShowProgressModal(false)
            // Reset tab title on cancellation
            document.title = document.title.replace(/^Processing Resumes\.\.\. \d+\.\d+% - /, '')
            return
          }

          // Continue polling if not completed
          attempts++
          if (attempts < maxAttempts) {
            setTimeout(poll, 2000) // Poll every 2 seconds
          } else {
            throw new Error('Processing timeout - please check the Bulk Status tab for updates')
          }
        } else {
          throw new Error(`Failed to get job status: ${response.status}`)
        }
      } catch (error) {
        console.error('Error polling job status:', error)
        setProcessingStatus("error")
        setProgressMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
        setShowProgressModal(false)
        
        // Reset tab title on error
        document.title = document.title.replace(/^Processing Resumes\.\.\. \d+\.\d+% - /, '')
        
        toast({
          title: "Processing Error",
          description: error instanceof Error ? error.message : 'Unknown error',
          variant: "destructive",
        })
      }
    }

    // Start polling
    poll()
  }
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [parsedResumes, setParsedResumes] = useState<any[]>([])
  const [resumeData, setResumeData] = useState<ResumeData[]>([])
  const [selectedResumes, setSelectedResumes] = useState<number[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [parseResults, setParseResults] = useState<ResumeParseResponse | null>(null)
  const [activeTab, setActiveTab] = useState("upload")
  const [loading, setLoading] = useState(false)
  const [processingResults, setProcessingResults] = useState<ProcessingResult[]>([])
  
  
  // Add state for bulk processing and failed resumes
  const [bulkProcessingStatus, setBulkProcessingStatus] = useState<BulkProcessingStatus | null>(null)
  const [unifiedJobs, setUnifiedJobs] = useState<UnifiedJob[]>([])
  const [failedResumes, setFailedResumes] = useState<FailedResume[]>([])
  const [selectedFailedResumes, setSelectedFailedResumes] = useState<Set<string>>(new Set())
  const [isCheckingStatus, setIsCheckingStatus] = useState(false)
  
  // Add state for drag & drop
  const [isDragOver, setIsDragOver] = useState(false)
  
  // Add AbortController for API cancellation
  const abortControllerRef = useRef<AbortController | null>(null)
  
  // Add state for progress tracking and cancellation
  const [currentJobId, setCurrentJobId] = useState<string | null>(null)
  const [processingStatus, setProcessingStatus] = useState<string>("idle") // idle, processing, completed, cancelled
  const [showProgressModal, setShowProgressModal] = useState(false)
  const [progressMessage, setProgressMessage] = useState("")
  
  // Job selection for candidate creation
  const [availableJobs, setAvailableJobs] = useState<any[]>([])
  const [selectedJobForCandidate, setSelectedJobForCandidate] = useState<number | null>(null)
  const [showJobSelectionModal, setShowJobSelectionModal] = useState(false)
  const [pendingResumeId, setPendingResumeId] = useState<number | null>(null)
  const [userClosedModal, setUserClosedModal] = useState(false) // Track if user manually closed modal
  
  // Add state for confirmation dialogs
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [showCancelAllConfirm, setShowCancelAllConfirm] = useState(false)
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false)
  const [showDeleteSingleConfirm, setShowDeleteSingleConfirm] = useState(false)
  const [resumeToDelete, setResumeToDelete] = useState<string | null>(null)
  const [showDeleteParsedConfirm, setShowDeleteParsedConfirm] = useState(false)
  const [parsedDataToDelete, setParsedDataToDelete] = useState<number | null>(null)
  const [showDeleteAllSuccessfulConfirm, setShowDeleteAllSuccessfulConfirm] = useState(false)
  const [showReuploadConfirm, setShowReuploadConfirm] = useState(false)
  const [resumeToReupload, setResumeToReupload] = useState<string | null>(null)
  
  // Add state for results modal
  const [showResultsModal, setShowResultsModal] = useState(false)
  
  // Add state for client-side rendering
  const [isClient, setIsClient] = useState(false)
  
  // Core data fetching functions - defined early to avoid hoisting issues
  async function fetchResumes() {
    setLoading(true)
    try {
      // Get JWT token and company ID from localStorage
      const user = JSON.parse(localStorage.getItem('ats_user') || 'null');
      const token = user?.token;
      const companyId = user?.companyId;

      if (!token || !companyId) {
        throw new Error('Authentication required. Please login first.');
      }

      // Use Python backend for fetching resumes
      const response = await fetch(`${BASE_API_URL}/resumes?company_id=${companyId}&dedupe_by=email`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      })

      if (!response.ok) {
        console.error('Error fetching resumes:', response.status)
        setResumeData([])
        return
      }

      const data = await response.json()
      
      // Debug logging
      console.log('fetchResumes response:', {
        data,
        resumes: data.resumes,
        total: data.total,
        total_unique: data.total_unique
      })
      
      // Ensure we have valid data and handle potential undefined parsed_data
      const resumes = data.resumes || data || []
      const validatedResumes = resumes.map((resume: any) => ({
        ...resume,
        parsed_data: resume.parsed_data || null, // Ensure parsed_data is never undefined
        candidate_name: resume.candidate_name || 'N/A',
        candidate_email: resume.candidate_email || 'N/A',
        total_experience: resume.total_experience || 'N/A'
      }))
      
      console.log('Validated resumes:', validatedResumes.length, 'resumes')
      setResumeData(validatedResumes)
    } catch (error) {
      console.error('Error fetching resumes:', error)
      setResumeData([])
    } finally {
      setLoading(false)
    }
  }

  async function fetchFailedResumes() {
    try {
      // Get JWT token and company ID from localStorage
      const user = JSON.parse(localStorage.getItem('ats_user') || 'null');
      const token = user?.token;
      const companyId = user?.companyId;

      if (!token || !companyId) {
        throw new Error('Authentication required. Please login first.');
      }

      // Use Python backend for fetching failed resumes
      const response = await fetch(`${BASE_API_URL}/failed-resumes?company_id=${companyId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      // Handle authentication errors
      if (response.status === 401 || response.status === 403) {
        handleAuthError(response);
        return;
      }
      
      if (response.ok) {
        const data = await response.json()
        setFailedResumes(data.failed_resumes || [])
      } else {
        throw new Error(`Failed to fetch failed resumes: ${response.status}`)
      }
    } catch (error) {
      console.error('Error fetching failed resumes:', error)
      setFailedResumes([])
    }
  }

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

  async function fetchUnifiedJobs() {
    setIsCheckingStatus(true)
    try {
      // Get JWT token and company ID from localStorage
      const user = JSON.parse(localStorage.getItem('ats_user') || 'null');
      const token = user?.token;
      const companyId = user?.companyId;

      if (!token || !companyId) {
        throw new Error('Authentication required. Please login first.');
      }

      // Fetch from Python backend; Node reupload routes are currently removed, so skip to avoid 404s
      const [pythonResponse] = await Promise.allSettled([
        // Python backend for regular bulk processing
        fetch(`${BASE_API_URL}/bulk-processing-status?company_id=${companyId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const unifiedJobs: UnifiedJob[] = [];

      // Process Python backend data (bulk imports)
      if (pythonResponse.status === 'fulfilled' && pythonResponse.value.ok) {
        const pythonData = await pythonResponse.value.json();
        
        // Convert Python bulk processing jobs to unified format
        if (pythonData.jobs && Array.isArray(pythonData.jobs)) {
          pythonData.jobs.forEach((job: any) => {
            unifiedJobs.push({
              id: job.job_id || `bulk_${Date.now()}`,
              jobId: job.job_id || `bulk_${Date.now()}`,
              type: 'bulk_import',
              status: job.status || 'completed',
              total_files: job.total_files || 0,
              successful_files: job.successful_files || 0,
              failed_files: job.failed_files || 0,
              duplicate_files: job.duplicate_files || 0,
              created_at: new Date(job.created_at * 1000).toISOString(),
              updated_at: new Date(job.updated_at * 1000).toISOString(),
              results: job.results || [],
              source: 'python',
              progress_percentage: job.progress_percentage || 100
            });
          });
        }
      } else if (pythonResponse.status === 'fulfilled') {
        console.error('Python backend error:', pythonResponse.value.status)
      }

      // Node.js reupload jobs are disabled because routes are removed; re-enable when routes return

      // Filter out empty jobs (no files and no results)
      const nonEmptyJobs = unifiedJobs.filter(j => (j.total_files || 0) > 0 || (j.results && j.results.length > 0));

      // Sort jobs by creation date (newest first)
      nonEmptyJobs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setUnifiedJobs(nonEmptyJobs);
    } catch (error) {
      console.error('Error fetching unified jobs:', error)
    } finally {
      setIsCheckingStatus(false)
    }
  }
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("")
  const [fileTypeFilter, setFileTypeFilter] = useState<string>("all")
  const [dateFilter, setDateFilter] = useState<string>("all")
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")
  
  // Resume files state
  const [resumeFiles, setResumeFiles] = useState<any[]>([])
  const [selectedFiles, setSelectedFiles] = useState<Set<number>>(new Set())
  const [activeFileTypeTab, setActiveFileTypeTab] = useState<string>("all")
  
  // File types for filtering
  const fileTypes = ["all", "pdf", "doc", "docx", "txt", "rtf", "png", "jpg", "jpeg", "webp"]

  // Helper function to parse JSON string safely
  const parseResumeData = (jsonString: string | undefined | null): ParsedResumeData | null => {
    try {
      // Handle undefined, null, or empty string cases
      if (!jsonString || jsonString === 'undefined' || jsonString === 'null') {
        return null
      }
      
      // If it's already an object, return it directly
      if (typeof jsonString === 'object') {
        return jsonString as ParsedResumeData
      }
      
      // Parse JSON string
      return JSON.parse(jsonString)
    } catch (error) {
      console.error('Error parsing resume data:', error)
      return null
    }
  }

  // Manual candidate creation for failed cases
  const createCandidatesManually = async (resumeDataIds: number[]) => {
    try {
      const user = JSON.parse(localStorage.getItem('ats_user') || 'null');
      const token = user?.token;
      const companyId = user?.companyId;

      if (!token || !companyId) {
        throw new Error('Authentication required. Please login first.');
      }

      const response = await fetch(`${NODE_API_URL}/api/candidates/create-from-resume-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Company-ID': companyId.toString()
        },
        body: JSON.stringify({
          resumeDataIds: resumeDataIds
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      toast({
        title: "Candidates Created",
        description: `Successfully created ${result.summary?.success || 0} candidates. ${result.summary?.failed || 0} failed.`,
      });

      // Refresh data
      await Promise.all([
        fetchResumes(),
        fetchBulkProcessingStatus()
      ]);

      return result;
    } catch (error) {
      console.error('Error creating candidates:', error);
      toast({
        title: "Error",
        description: `Failed to create candidates: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
      throw error;
    }
  };

  // Expose createCandidatesManually to window after it's defined
  useEffect(() => {
    (window as any).createCandidatesManually = createCandidatesManually;
    
    return () => {
      delete (window as any).createCandidatesManually;
    };
  }, []);

  useEffect(() => {
    fetchResumes()
    fetchUnifiedJobs()
    fetchFailedResumes()
    fetchAvailableJobs()
    
    // Note: createCandidatesManually will be exposed later when it's defined
  }, [])

  // Real-time polling for live updates
  useEffect(() => {
    if (!isClient) return

    // Set up polling interval for real-time updates
    const pollInterval = setInterval(async () => {
      try {
        await Promise.all([
          fetchResumes(),
          fetchUnifiedJobs(),
          fetchFailedResumes()
        ])
      } catch (error) {
        console.error('Error during polling:', error)
      }
    }, 5000) // Poll every 5 seconds

    // Cleanup interval on unmount
    return () => clearInterval(pollInterval)
  }, [isClient])

  // Add global drag & drop prevention
  useEffect(() => {
    const handleGlobalDragOver = (e: DragEvent) => {
      e.preventDefault()
    }
    
    const handleGlobalDrop = (e: DragEvent) => {
      e.preventDefault()
    }

    document.addEventListener('dragover', handleGlobalDragOver)
    document.addEventListener('drop', handleGlobalDrop)

    return () => {
      document.removeEventListener('dragover', handleGlobalDragOver)
      document.removeEventListener('drop', handleGlobalDrop)
    }
  }, [])

  // Fetch bulk processing status (legacy - keeping for compatibility)
  const fetchBulkProcessingStatus = async () => {
    await fetchUnifiedJobs();
  }

  // Start status polling for a specific job
  const startStatusPolling = (jobId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const user = JSON.parse(localStorage.getItem('ats_user') || 'null');
        const token = user?.token;

        if (!token) {
          return;
        }

        // Check job status from Python backend
        const response = await fetch(`${BASE_API_URL}/bulk-processing-status/${jobId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const jobData = await response.json();
          
          // Update processing status
          if (jobData.status === 'completed' || jobData.status === 'failed') {
            setProcessingStatus(jobData.status);
            clearInterval(pollInterval);
            
            // Update parseResults state for modal display
            if (jobData.status === 'completed' && jobData.results) {
              console.log('🔍 Job completed, updating parseResults:', jobData)
              const validatedData = validateParseResults(jobData)
              setParseResults(validatedData)
              
              // Update progress to 100%
              setProcessingProgress(100)
              setProgressMessage(`Successfully processed ${validatedData.successful_files || 0} resumes!`)
            }
            
            // Show completion toast
            if (jobData.status === 'completed') {
              const successfulCount = jobData.successful_files || 0;
              const failedCount = jobData.failed_files || 0;
              
              toast({
                title: "Processing Complete",
                description: `Successfully processed ${successfulCount} resume(s). ${failedCount > 0 ? `${failedCount} failed.` : ''}`,
              });
            } else {
              toast({
                title: "Processing Failed",
                description: "Failed to process some resumes. Check the Bulk Status tab for details.",
                variant: "destructive",
              });
            }
            
            // Refresh all relevant data including Successful Resumes
            await Promise.all([
              fetchBulkProcessingStatus(),
              fetchResumes(),  // This refreshes the "Successful Resumes" tab
              fetchFailedResumes()  // This will now show updated list without successfully re-parsed resumes
            ]);
          } else {
            // Update progress during processing
            const progress = parseFloat(jobData.progress || '0')
            setProcessingProgress(progress)
            setProgressMessage(`Processing ${jobData.processed_files || 0}/${jobData.total_files || 0} resumes...`)
          }
        } else {
          console.error('Polling error:', response.status)
        }
      } catch (error) {
        console.error('Error polling job status:', error);
      }
    }, 2000); // Poll every 2 seconds

    // Store interval ID for cleanup
    return pollInterval;
  }

  // Fetch failed resumes


  // Cleanup failed resumes that have been successfully re-parsed
  const cleanupFailedResumes = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('ats_user') || 'null');
      const token = user?.token;
      const companyId = user?.companyId;

      if (!token || !companyId) {
        throw new Error('Authentication required. Please login first.');
      }

      // Show loading state
      toast({
        title: "Cleaning up...",
        description: "Removing successfully re-parsed failed resumes",
      });

      const response = await fetch(`${BASE_API_URL}/cleanup-failed-resumes?company_id=${companyId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Cleanup Complete",
          description: `Removed ${data.cleanup_count} duplicate failed resumes`,
        });
        
        // Refresh the failed resumes list
        await fetchFailedResumes();
      } else if (response.status === 401) {
        throw new Error('Authentication failed. Please login again.');
      } else if (response.status === 500) {
        throw new Error('Server error. Please try again later.');
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error cleaning up failed resumes:', error);
      
      let errorMessage = 'Unknown error';
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          errorMessage = 'Python backend is not running. Please start the backend service.';
        } else if (error.message.includes('Authentication')) {
          errorMessage = 'Authentication failed. Please login again.';
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Cleanup Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }

  // Delete specific failed resume
  const deleteFailedResume = async (resumeId: string) => {
    try {
      // Get JWT token and company ID from localStorage
      const user = JSON.parse(localStorage.getItem('ats_user') || 'null');
      const token = user?.token;
      const companyId = user?.companyId;

      if (!token || !companyId) {
        throw new Error('Authentication required. Please login first.');
      }

      // Use Python backend for deleting failed resume
      const response = await fetch(`${BASE_API_URL}/failed-resumes/${resumeId}?company_id=${companyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        setFailedResumes(prev => prev.filter(resume => resume.resume_id !== resumeId))
        setSelectedFailedResumes(prev => {
          const newSet = new Set(prev)
          newSet.delete(resumeId)
          return newSet
        })
        toast({
          title: "Failed Resume Deleted",
          description: "Failed resume has been deleted successfully.",
        })
      } else {
        toast({
          title: "Delete Failed",
          description: "Failed to delete the resume. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error deleting failed resume:', error)
      toast({
        title: "Delete Failed",
        description: "Failed to connect to the server. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Delete all failed resumes
  const deleteAllFailedResumes = async () => {
    try {
      // Get JWT token and company ID from localStorage
      const user = JSON.parse(localStorage.getItem('ats_user') || 'null');
      const token = user?.token;
      const companyId = user?.companyId;

      if (!token || !companyId) {
        throw new Error('Authentication required. Please login first.');
      }

      // Use Python backend for deleting all failed resumes
      const response = await fetch(`${BASE_API_URL}/failed-resumes?company_id=${companyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        setFailedResumes([])
        setSelectedFailedResumes(new Set())
        toast({
          title: "All Failed Resumes Deleted",
          description: "All failed resumes have been deleted successfully.",
        })
      } else {
        toast({
          title: "Delete Failed",
          description: "Failed to delete all resumes. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error deleting all failed resumes:', error)
      toast({
        title: "Delete Failed",
        description: "Failed to connect to the server. Please try again.",
        variant: "destructive",
      })
    }
  }


  const handleFileUpload = useCallback((files: FileList | null) => {
    if (!files) return

    // No file limit - allow unlimited resume uploads

    const newFiles = Array.from(files).filter(
      (file) => {
        const validTypes = [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/plain',
          'text/rtf',
          'image/png',
          'image/jpeg',
          'image/jpg',
          'image/webp'
        ]
        return validTypes.includes(file.type) || 
               file.name.toLowerCase().endsWith('.pdf') ||
               file.name.toLowerCase().endsWith('.doc') ||
               file.name.toLowerCase().endsWith('.docx') ||
               file.name.toLowerCase().endsWith('.txt') ||
               file.name.toLowerCase().endsWith('.rtf') ||
               file.name.toLowerCase().endsWith('.png') ||
               file.name.toLowerCase().endsWith('.jpg') ||
               file.name.toLowerCase().endsWith('.jpeg') ||
               file.name.toLowerCase().endsWith('.webp')
      }
    )

    setUploadedFiles((prev) => [...prev, ...newFiles])
  }, [toast])

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // Only set to false if we're leaving the drop zone entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false)
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragOver(false)
      
      const files = e.dataTransfer.files
      if (files && files.length > 0) {
        handleFileUpload(files)
      }
    },
    [handleFileUpload],
  )

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const processResumes = async () => {
    if (uploadedFiles.length === 0) return

    // Reset modal state for new processing
    resetModalState()
    
    setIsProcessing(true)
    setProcessingProgress(0)
    setProcessingStatus("processing")
    setProgressMessage(`Starting processing of ${uploadedFiles.length} resumes...`)
    
    // Show modal for new processing
    setShowProgressModal(true)
    
    // Create new AbortController for this request
    abortControllerRef.current = new AbortController()

    try {
      const formData = new FormData()
      uploadedFiles.forEach((file) => {
        formData.append('files', file)
      })

      setProgressMessage(`Uploading ${uploadedFiles.length} files to server...`)
      setProcessingProgress(10) // Start with 10% for upload

      // Get JWT token and company ID from localStorage
      const user = JSON.parse(localStorage.getItem('ats_user') || 'null')
      const token = user?.token
      const companyId = user?.companyId

      if (!token || !companyId) {
        throw new Error('Authentication required. Please login first.')
      }

      // Use original Python backend for bulk resume parsing
      const response = await fetch(`${BASE_API_URL}/bulk-parse-resumes?company_id=${companyId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
        signal: abortControllerRef.current.signal, // Add abort signal
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      setProgressMessage(`Uploading ${uploadedFiles.length} resumes...`)
      setProcessingProgress(10) // Set to 10% after upload
      
      // Simulate progress during upload
      const progressInterval = setInterval(() => {
        setProcessingProgress(prev => Math.min(prev + 5, 30))
      }, 200)
      
      // Clear interval after upload completes
      setTimeout(() => {
        clearInterval(progressInterval)
        setProcessingProgress(30)
        setProgressMessage(`Processing ${uploadedFiles.length} resumes...`)
      }, 1000)

      const data = await response.json()
      
      // Debug logging to identify data issues
      console.log('Raw API response:', {
        total_processing_time: data.total_processing_time,
        type: typeof data.total_processing_time,
        fullData: data
      })
      
      // Check if we got a job ID for tracking (job-based response)
      if (data.job_id) {
        console.log('🔍 Job-based response received:', data)
        setCurrentJobId(data.job_id)
        setProcessingStatus('processing')
        
        // Start polling for status updates
        startStatusPolling(data.job_id)
        
        // Show progress modal with job tracking
        setProgressMessage(`Processing ${uploadedFiles.length} resumes in background...`)
        setProcessingProgress(50)
        
        return // Exit early for job-based processing
      }
      
      // Handle immediate response format (no job_id)
      console.log('🔍 Processing immediate endpoint results:', data)
      console.log('🔍 Backend response structure:', {
        total_files: data.total_files,
        successful_files: data.successful_files,
        failed_files: data.failed_files,
        duplicate_files: data.duplicate_files,
        results_count: data.results?.length || 0,
        has_results: !!data.results
      })
      
      // Update progress during processing
      setProcessingProgress(50)
      setProgressMessage(`Parsing ${uploadedFiles.length} resumes...`)
      
      // The immediate endpoint returns results directly (no job_id)
      const validatedData = validateParseResults(data)
      console.log('🔍 Validated data after processing:', {
        total_files: validatedData.total_files,
        successful_files: validatedData.successful_files,
        failed_files: validatedData.failed_files,
        duplicate_files: validatedData.duplicate_files,
        results_count: validatedData.results?.length || 0,
        candidate_created_counts: validatedData.results?.map(r => r.candidate_created) || []
      })
      
      // CRITICAL: Update parseResults state immediately for modal display
      console.log('🔍 Setting parseResults state immediately:', validatedData)
      setParseResults(validatedData)
      
      // Update progress after parsing
      setProcessingProgress(75)
      setProgressMessage(`Creating candidates from ${uploadedFiles.length} resumes...`)
      
      console.log('🔍 Setting other state variables:', validatedData)
      setParsedResumes(validatedData.results)
      setProcessingResults(validatedData.results)
      console.log('🔍 Other state variables updated')
      
      // Update resume data state with the results
      if (validatedData.results && validatedData.results.length > 0) {
        // Convert results to ResumeData format for display
        const resumeData = validatedData.results.map((result: any) => ({
          id: result.resume_id || Math.random() * 10000, // Generate ID if not available
          filename: result.filename,
          file_type: result.file_type || 'unknown',
          candidate_name: result.parsed_data?.Name || result.parsed_data?.name || 'Unknown',
          candidate_email: result.parsed_data?.Email || result.parsed_data?.email || '',
          total_experience: result.parsed_data?.TotalExperience || result.parsed_data?.experience_years || '0',
          parsed_data: result.parsed_data,
          created_at: new Date().toISOString(),
          candidate_created: true, // Original endpoint creates candidates automatically
          candidate_id: result.candidate_id || null
        }))
        
        console.log('Setting resume data:', resumeData)
        setResumeData(resumeData)
        
        // Update counts for display - use the validated data counts, not individual file status
        const successfulCount = validatedData.successful_files || 0
        const failedCount = validatedData.failed_files || 0
        const totalCount = validatedData.total_files || 0
        
        console.log(`📊 Results from validated data: ${successfulCount} successful, ${failedCount} failed out of ${totalCount} total`)
        console.log(`📊 Individual file status counts: ${validatedData.results.filter((r: any) => r.status === 'success').length} success, ${validatedData.results.filter((r: any) => r.status === 'failed').length} failed`)
      }
      
      // Clear uploaded files after processing
      setUploadedFiles([])
      
      setProcessingProgress(100)
      setProgressMessage(`Successfully processed ${validatedData.successful_files || 0} resumes!`)
      setProcessingStatus("completed")
      
      // Switch to results tab
      setActiveTab("upload")

      // Refresh all data immediately after processing
      console.log('🔍 Refreshing all data after processing...')
      try {
        await Promise.all([
          fetchResumes(),
          fetchBulkProcessingStatus(),
          fetchFailedResumes()
        ])
        console.log('🔍 Data refresh completed successfully')
      } catch (error) {
        console.error('🔍 Error during data refresh:', error)
      }

      // Immediately close progress modal and show results modal
      setShowProgressModal(false)
      setShowResultsModal(true)

    } catch (error) {
      // Check if it's an abort error
      if (error instanceof Error && error.name === 'AbortError') {
        setProgressMessage(`Processing of ${uploadedFiles.length} resumes cancelled by user`)
        setProcessingStatus("cancelled")
        toast({
          title: "Processing Cancelled",
          description: "Resume processing has been cancelled.",
        })
        return
      }
      
      console.error('Error processing resumes:', error)
      
      // Reset parseResults to prevent display issues
      setParseResults(null)
      setParsedResumes([])
      setProcessingResults([])
      
      // Show the actual error instead of mock data
      setProcessingStatus("error")
      setProgressMessage(`Error processing resumes: ${error instanceof Error ? error.message : 'Unknown error'}`)
      
      toast({
        title: "Processing Failed",
        description: `Failed to process resumes: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      })
      
      // Don't fall back to mock data - show the real error
      return
    } finally {
      setIsProcessing(false)
      // Clear the AbortController reference
      abortControllerRef.current = null
    }
  }

  const cancelProcessing = async () => {
    if (abortControllerRef.current) {
      try {
        abortControllerRef.current.abort()
      } catch (error) {
        // AbortError is expected when aborting a request
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Unexpected error aborting API call:', error)
        }
      }
    }
    
    // Also try to cancel backend jobs if we have a job ID
    if (currentJobId) {
      try {
        await fetch(`${BASE_API_URL}/cancel-job/${currentJobId}`, {
          method: 'POST',
        })
      } catch (error) {
        console.error('Error cancelling backend job:', error)
      }
    }
    
    setProcessingStatus("cancelled")
    setProgressMessage("Cancelling processing...")
    setShowCancelConfirm(false) // Close confirmation dialog
    setShowProgressModal(false) // Close progress modal
    setUserClosedModal(true) // Mark that user manually closed the modal
  }

  const confirmCancelProcessing = () => {
    setShowCancelConfirm(true)
  }

  const confirmCancelAllProcessing = () => {
    setShowCancelAllConfirm(true)
  }

  const closeProgressModal = () => {
    setShowProgressModal(false)
    setUserClosedModal(true) // Mark that user manually closed the modal
    // Don't cancel processing when just closing the modal
  }

  const resetModalState = () => {
    setUserClosedModal(false) // Reset modal state for new uploads
    setProcessingStatus("idle")
    setShowProgressModal(false)
  }

  // Confirmation functions for delete operations
  const confirmDeleteAllFailedResumes = () => {
    setShowDeleteAllConfirm(true)
  }

  const confirmDeleteSingleFailedResume = (resumeId: string) => {
    setResumeToDelete(resumeId)
    setShowDeleteSingleConfirm(true)
  }

  const confirmDeleteParsedData = (resumeId: number) => {
    setParsedDataToDelete(resumeId)
    setShowDeleteParsedConfirm(true)
  }

  // Show job selection modal before creating candidate
  const initiateCreateCandidate = (resumeDataId: number) => {
    setPendingResumeId(resumeDataId)
    setSelectedJobForCandidate(null)
    setShowJobSelectionModal(true)
  }

  // Create candidate from parsed resume data with selected job
  const createCandidateFromResume = async () => {
    if (!pendingResumeId) return

    try {
      const user = JSON.parse(localStorage.getItem('ats_user') || 'null')
      const token = user?.token

      if (!token) {
        throw new Error('Authentication required')
      }

      // Close modal
      setShowJobSelectionModal(false)

      // Use Node backend for creating candidates from parsed resumes
      const response = await fetch(`${NODE_API_URL}/api/candidates/create-from-resume`, {
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
        title: "Success",
        description: `Candidate added to ${jobName}`,
      })

      // Reset state
      setPendingResumeId(null)
      setSelectedJobForCandidate(null)

      // Refresh all data after candidate creation
      await Promise.all([
        fetchResumes(),
        fetchBulkProcessingStatus(),
        fetchFailedResumes()
      ])

    } catch (error) {
      console.error('Error creating candidate:', error)
      toast({
        title: "Error",
        description: "Failed to create candidate from resume data",
        variant: "destructive"
      })
    }
  }

  const confirmDeleteAllSuccessfulResumes = () => {
    setShowDeleteAllSuccessfulConfirm(true)
  }

  const downloadResume = async (resumeId: number) => {
    try {
      const token = localStorage.getItem('ats_token')
      if (!token) {
        throw new Error('Authentication required. Please login first.')
      }

      const response = await fetch(`${BASE_API_URL}/resumes/${resumeId}/download`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        
        // Get filename from response headers or use default
        const contentDisposition = response.headers.get('content-disposition')
        let filename = 'resume.pdf'
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="(.+)"/)
          if (filenameMatch) {
            filename = filenameMatch[1]
          }
        }
        
        a.download = filename
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        
        toast({
          title: "Download Started",
          description: "Resume file download has started.",
        })
      } else {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
    } catch (error) {
      console.error('Error downloading resume:', error)
      toast({
        title: "Download Failed",
        description: "Failed to download the resume file. Please try again.",
        variant: "destructive",
      })
    }
  }

  const deleteAllSuccessfulResumes = async () => {
    try {
      // Get JWT token and company ID from localStorage
      const user = JSON.parse(localStorage.getItem('ats_user') || 'null');
      const token = user?.token;
      const companyId = user?.companyId;

      if (!token || !companyId) {
        throw new Error('Authentication required. Please login first.');
      }

      const response = await fetch(`${BASE_API_URL}/resumes`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        setResumeData([])
        setSelectedResumes([])
        toast({
          title: "All Resumes Deleted",
          description: "All successful resumes have been deleted successfully.",
        })
      } else {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
    } catch (error) {
      console.error('Error deleting all resumes:', error)
      toast({
        title: "Delete Failed",
        description: "Failed to delete all resumes. Please try again.",
        variant: "destructive",
      })
    }
  }

  const toggleResumeSelection = (id: number) => {
    setSelectedResumes((prev) => 
      prev.includes(id) 
        ? prev.filter((resumeId) => resumeId !== id) 
        : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    const allResumeIds = resumeData.map(resume => resume.id)
    
    if (selectedResumes.length === allResumeIds.length) {
      setSelectedResumes([])
    } else {
      setSelectedResumes(allResumeIds)
    }
  }

  const importSelectedResumes = () => {
    setSelectedResumes([])
    setParsedResumes([])
    setUploadedFiles([])
    setParseResults(null)
  }

  const exportToExcel = () => {
    const selectedData = resumeData.filter(resume => selectedResumes.includes(resume.id))
    
    // Create CSV content
    const headers = ['Name', 'Email', 'Phone', 'Address', 'Total Experience', 'Skills', 'File Type', 'Created Date']
    const csvContent = [
      headers.join(','),
      ...selectedData.map(resume => {
          // Ensure resume has all required fields with fallbacks
          const safeResume = {
            id: resume.id || 0,
            filename: resume.filename || 'Unknown',
            file_type: resume.file_type || 'unknown',
            candidate_name: resume.candidate_name || 'N/A',
            candidate_email: resume.candidate_email || 'N/A',
            total_experience: resume.total_experience || 'N/A',
            created_at: resume.created_at || new Date().toISOString(),
            parsed_data: resume.parsed_data || null
          }
          
          const parsedData = parseResumeData(safeResume.parsed_data)
        return [
            parsedData?.Name || safeResume.candidate_name || '',
            parsedData?.Email || safeResume.candidate_email || '',
          parsedData?.Phone || '',
          parsedData?.Address || '',
            parsedData?.TotalExperience || safeResume.total_experience || '',
          parsedData?.Skills?.join('; ') || '',
            safeResume.file_type,
            new Date(safeResume.created_at).toLocaleDateString()
        ].join(',')
      })
    ].join('\n')

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `resume_data_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const deleteResume = async (id: number) => {
    try {
      const token = localStorage.getItem('ats_token')
      if (!token) {
        throw new Error('Authentication required. Please login first.')
      }

      const response = await fetch(`${BASE_API_URL}/resumes/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        setResumeData(prev => prev.filter(resume => resume.id !== id))
        setSelectedResumes(prev => prev.filter(resumeId => resumeId !== id))
        // Show success message
        toast({
          title: "Resume Deleted",
          description: "Resume has been deleted successfully.",
        })
      } else {
        // Handle API error response
        const errorData = await response.json().catch(() => ({}))
        toast({
          title: "Error Deleting Resume",
          description: errorData.message || `Failed to delete resume. Status: ${response.status}`,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error deleting resume:', error)
      toast({
        title: "Error Deleting Resume",
        description: "Failed to connect to the server. Please try again.",
        variant: "destructive",
      })
    }
  }

  const getFileIcon = (fileType: string) => {
    switch (fileType.toLowerCase()) {
      case 'pdf':
        return <FileText className="w-4 h-4 text-red-500" />
      case 'doc':
      case 'docx':
        return <FileText className="w-4 h-4 text-blue-500" />
      case 'txt':
        return <FileText className="w-4 h-4 text-gray-500" />
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'webp':
        return <FileText className="w-4 h-4 text-green-500" />
      default:
        return <FileText className="w-4 h-4 text-gray-400" />
    }
  }

  // Filter resumes based on search, file type, and date
  const filteredResumes = resumeData.filter(resume => {
    const matchesSearch = searchTerm === "" || 
      resume.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resume.candidate_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resume.candidate_email.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFileType = fileTypeFilter === "all" || resume.file_type === fileTypeFilter
    
    // Date filtering logic
    let matchesDate = true
    if (dateFilter !== "all") {
      const fileDate = new Date(resume.created_at)
      const today = new Date()
      
      switch (dateFilter) {
        case "today":
          matchesDate = fileDate.toDateString() === today.toDateString()
          break
        case "yesterday":
          const yesterday = new Date(today)
          yesterday.setDate(yesterday.getDate() - 1)
          matchesDate = fileDate.toDateString() === yesterday.toDateString()
          break
        case "this_week":
          const startOfWeek = new Date(today)
          startOfWeek.setDate(today.getDate() - today.getDay())
          startOfWeek.setHours(0, 0, 0, 0)
          matchesDate = fileDate >= startOfWeek
          break
        case "this_month":
          matchesDate = fileDate.getMonth() === today.getMonth() && fileDate.getFullYear() === today.getFullYear()
          break
        case "last_month":
          const lastMonth = new Date(today)
          lastMonth.setMonth(lastMonth.getMonth() - 1)
          matchesDate = fileDate.getMonth() === lastMonth.getMonth() && fileDate.getFullYear() === lastMonth.getFullYear()
          break
        case "custom":
          if (startDate && endDate) {
            const start = new Date(startDate)
            const end = new Date(endDate)
            end.setHours(23, 59, 59, 999) // Include end date
            matchesDate = fileDate >= start && fileDate <= end
          }
          break
      }
    }
    
    return matchesSearch && matchesFileType && matchesDate
  })



  // Function to re-upload failed resumes from the database
  const reUploadFailedResumes = async () => {
    if (selectedFailedResumes.size === 0) {
      toast({
        title: "No Resumes Selected",
        description: "Please select at least one failed resume to re-upload.",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    setProcessingProgress(0)
    
    try {
      // Get the selected failed resume IDs
      const failedResumeIds = Array.from(selectedFailedResumes)

      // Get JWT token and company ID from localStorage
      const user = JSON.parse(localStorage.getItem('ats_user') || 'null')
      const token = user?.token
      const companyId = user?.companyId

      if (!token || !companyId) {
        throw new Error('Authentication required. Please login first.')
      }

      // Use the dedicated re-upload API
      const response = await fetch(`${NODE_API_URL}/api/re-upload-failed-resumes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          failed_resume_ids: failedResumeIds
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('API Error Response:', errorText)
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      
      // Check if we got a job ID for tracking
      if (data.job_id) {
        // Store job ID for status tracking
        setCurrentJobId(data.job_id)
        setProcessingStatus('processing')
        
        // Show success toast with job ID
        toast({
          title: "Re-upload Started",
          description: `Re-upload job created successfully. Job ID: ${data.job_id}. Check the Bulk Status tab for progress.`,
        })
        
        // Switch to Bulk Status tab to show progress
        setActiveTab('bulk-status')
        
        // Start polling for status updates
        startStatusPolling(data.job_id)
        
        // Clear selection
        setSelectedFailedResumes(new Set())
        
        // Refresh all data to show updated status
        await Promise.all([
          fetchBulkProcessingStatus(),
          fetchResumes(),
          fetchFailedResumes()
        ])
        
      } else {
        // Fallback to old behavior if no job ID
        setProcessingProgress(100)
        
        // Show result toast with detailed information
        const successful = data.successful_files || 0
        const failed = data.failed_files || 0
        const duplicates = data.duplicate_files || 0
        
        if (successful > 0) {
          toast({
            title: "Re-upload Complete",
            description: `Successfully processed ${successful} resume(s). ${failed > 0 ? `${failed} failed, ` : ''}${duplicates > 0 ? `${duplicates} duplicates.` : ''}`,
          })
        } else {
          toast({
            title: "Re-upload Complete",
            description: `No resumes were successfully processed. ${failed > 0 ? `${failed} failed, ` : ''}${duplicates > 0 ? `${duplicates} duplicates.` : ''}`,
            variant: "destructive",
          })
        }

        // Clear selection
        setSelectedFailedResumes(new Set())
        
        // Refresh the failed resumes list
        await fetchFailedResumes()
        
        // Refresh the parsed data tab
        await fetchResumes()
      }

    } catch (error) {
      console.error('❌ Error re-processing failed resumes:', error)
      const err = error as Error
      console.error('❌ Error details:', {
        message: err.message,
        stack: err.stack,
        name: err.name
      })
      
      // Check if it's a network error or API error
      if (err.message.includes('Failed to fetch')) {
        toast({
          title: "Network Error",
          description: "Cannot connect to the server. Please check your internet connection and try again.",
          variant: "destructive",
        })
      } else if (err.message.includes('401')) {
        toast({
          title: "Authentication Error",
          description: "Your session has expired. Please refresh the page and login again.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Re-upload Failed",
          description: `Failed to re-process the selected resumes: ${err.message}`,
          variant: "destructive",
        })
      }
    } finally {
      setIsProcessing(false)
      setProcessingProgress(0)
    }
  }

  // Function to re-upload a single failed resume (for individual reupload button)
  const reUploadSingleFailedResume = async (resumeId: string) => {
    // First select the resume
    setSelectedFailedResumes(new Set([resumeId]))
    
    // Show confirmation dialog
    setResumeToReupload(resumeId)
    setShowReuploadConfirm(true)
  }

  // Function to confirm and execute reupload
  const confirmReupload = async () => {
    setShowReuploadConfirm(false)
    
    // Then call the bulk reupload function
    await reUploadFailedResumes()
  }

  // Function to cancel all processing jobs
  const cancelAllProcessing = async () => {
    try {
      // First, cancel any ongoing API requests
      if (abortControllerRef.current) {
        try {
          abortControllerRef.current.abort()
        } catch (error) {
          // AbortError is expected when aborting a request
          if (error instanceof Error && error.name !== 'AbortError') {
            console.error('Unexpected error aborting API call:', error)
          }
        }
        abortControllerRef.current = null
      }

      // Reset processing state
      setIsProcessing(false)
      setProcessingProgress(0)
      setProcessingStatus("cancelled")
      setProgressMessage("Processing cancelled by user")
      setShowProgressModal(false)
      setUserClosedModal(false)

      // Call backend to cancel jobs
      const response = await fetch(`${BASE_API_URL}/cancel-all-jobs`, {
        method: 'POST',
      })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: "Processing Cancelled",
          description: `Successfully cancelled ${data.cancelled_count || 0} processing jobs.`,
        })
        
        // Refresh the bulk status
        await fetchBulkProcessingStatus()
      } else {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
    } catch (error) {
      console.error('Error cancelling all jobs:', error)
      toast({
        title: "Cancel Failed",
        description: "Failed to cancel processing jobs. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Function to cancel individual processing job
  const cancelIndividualProcessing = async (jobId: string) => {
    try {
      const response = await fetch(`${BASE_API_URL}/cancel-job/${jobId}`, {
        method: 'POST',
      })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: "Job Cancelled",
          description: `Successfully cancelled job ${jobId}.`,
        })
        
        // Refresh the bulk status
        await fetchBulkProcessingStatus()
      } else {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
    } catch (error) {
      console.error('Error cancelling job:', error)
      toast({
        title: "Cancel Failed",
        description: "Failed to cancel the processing job. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-8">

      {/* Progress Modal */}
      {showProgressModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <RefreshCw className={`w-5 h-5 ${processingStatus === "processing" ? "animate-spin" : ""}`} />
                <span>Processing Resumes</span>
              </h3>
            </div>
            
            <div className="space-y-4">
              {/* Progress Bar */}
              <div className="space-y-3">
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-blue-600 h-3 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${processingProgress}%` }}
                  ></div>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    Processing resumes... {processingProgress.toFixed(2)}% complete
                  </p>
                </div>
              </div>
              
              {/* Status Message */}
              <div className="text-center">
                <p className="text-sm text-gray-500">{progressMessage}</p>
                {parseResults && (
                  <div className="mt-2 text-xs text-gray-500">
                    {(() => {
                      console.log('🔍 Processing Results modal - parseResults:', parseResults)
                      console.log('🔍 Processing Results modal - processingStatus:', processingStatus)
                      return null
                    })()}
                    <div>Successful: {parseResults.successful_files || 0} | Failed: {parseResults.failed_files || 0} | Total: {parseResults.total_files || 0}</div>
                    <div>Processing time: {parseResults.total_processing_time?.toFixed(2)}s</div>
                    <div>Duplicates: {parseResults.duplicate_files || 0}</div>
                    {(parseResults.candidates_created !== undefined || parseResults.candidates_failed !== undefined) && (
                      <div className="text-green-600 font-medium">
                        Candidates Created: {parseResults.candidates_created || 0} | 
                        Failed: {parseResults.candidates_failed || 0} | 
                        Duplicates: {parseResults.candidates_duplicates || 0}
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              
              {/* Action Buttons */}
              <div className="flex justify-center space-x-3">
                {processingStatus === "processing" && (
                  <Button
                    variant="outline"
                    onClick={confirmCancelProcessing}
                    className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  onClick={closeProgressModal}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Removed redundant refresh button - each tab has its own refresh functionality */}

      {/* Job Selection Modal */}
      <Dialog open={showJobSelectionModal} onOpenChange={setShowJobSelectionModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Select Job for Candidate</DialogTitle>
            <DialogDescription>
              Choose which job this candidate is applying for, or select "General Pool" to add without a specific job.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="job-select">Job Position</Label>
              <Select 
                value={selectedJobForCandidate?.toString() || "none"} 
                onValueChange={(value) => setSelectedJobForCandidate(value === "none" ? null : parseInt(value))}
              >
                <SelectTrigger id="job-select">
                  <SelectValue placeholder="Select a job or choose General Pool" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4" />
                      <span>General Pool (No specific job)</span>
                    </div>
                  </SelectItem>
                  <Separator className="my-2" />
                  {availableJobs.length > 0 ? (
                    availableJobs.map((job) => (
                      <SelectItem key={job.id} value={job.id.toString()}>
                        <div className="flex flex-col">
                          <span className="font-medium">{job.title}</span>
                          <span className="text-xs text-gray-500">{job.city} • {job.jobType}</span>
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-jobs" disabled>
                      No jobs available - Create a job first
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            {selectedJobForCandidate && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Selected:</strong> {availableJobs.find(j => j.id === selectedJobForCandidate)?.title}
                </p>
              </div>
            )}
            {!selectedJobForCandidate && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600">
                  Candidate will be added to general pool. You can assign a job later from the Candidates page.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowJobSelectionModal(false)}>
              Cancel
            </Button>
            <Button onClick={createCandidateFromResume}>
              Add Candidate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="upload">Bulk Import Files</TabsTrigger>
          <TabsTrigger value="bulk-status">Bulk Status</TabsTrigger>
          <TabsTrigger value="failed">Failed Resumes</TabsTrigger>
          <TabsTrigger value="successful">Successful Resumes</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6">
          {/* Status Cards - Moved to top */}
          {(parseResults || unifiedJobs.length > 0) && (
            <div className="space-y-6">
              {(() => {
                // Use parseResults if available (immediate processing), otherwise use unifiedJobs (bulk status)
                const dataSource = parseResults || {
                  total_files: unifiedJobs.reduce((sum, job) => sum + job.total_files, 0),
                  successful_files: unifiedJobs.reduce((sum, job) => sum + job.successful_files, 0),
                  failed_files: unifiedJobs.reduce((sum, job) => sum + job.failed_files, 0),
                  duplicate_files: unifiedJobs.reduce((sum, job) => sum + (job.duplicate_files ?? 0), 0),
                  total_processing_time: 0,
                  results: []
                }
                const safeResults = validateParseResults(dataSource)
                console.log('🔍 Summary cards - dataSource:', dataSource)
                console.log('🔍 Summary cards - safeResults:', safeResults)
                console.log('🔍 Summary cards - parseResults available:', !!parseResults)
                console.log('🔍 Summary cards - unifiedJobs length:', unifiedJobs.length)
                return (
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                          <FileText className="w-5 h-5 text-blue-600" />
                          <div>
                            <p className="text-2xl font-bold">{safeResults.total_files}</p>
                            <p className="text-sm text-gray-600">Total Files</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <div>
                            <p className="text-2xl font-bold">{safeResults.successful_files}</p>
                            <p className="text-sm text-gray-600">Successful</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                          <XCircle className="w-5 h-5 text-red-600" />
                          <div>
                            <p className="text-2xl font-bold">{safeResults.failed_files}</p>
                            <p className="text-sm text-gray-600">Failed</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                          <AlertCircle className="w-5 h-5 text-yellow-600" />
                          <div>
                            <p className="text-2xl font-bold">{safeResults.duplicate_files}</p>
                            <p className="text-sm text-gray-600">Duplicate</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                          <Clock className="w-5 h-5 text-orange-600" />
                          <div>
                            <p className="text-3xl font-bold">
                              <SafeNumberDisplay 
                                value={safeResults.total_processing_time} 
                                fallback={0} 
                                decimals={1} 
                              />s
                            </p>
                            <p className="text-sm text-gray-600">Processing Time</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )
              })()}
            </div>
          )}


          {/* Upload Section - Always show */}
          <div className="w-full">
              <Card className="bg-gradient-to-br from-blue-50 to-white border-2 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="text-center pb-3">
                  <CardTitle className="flex items-center justify-center space-x-2 text-xl text-blue-800">
                    <Upload className="w-5 h-5 text-blue-600" />
                    <span>Resume Upload</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div
                    className={`border-2 border-dashed rounded-lg p-4 text-center transition-all duration-200 ${
                      isDragOver 
                        ? 'border-green-400 bg-green-50 scale-105 shadow-lg' 
                        : 'border-blue-300 hover:border-blue-400 bg-white/50 hover:bg-white/70'
                    }`}
                    onDragEnter={handleDragEnter}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <Upload className={`w-8 h-8 mx-auto mb-2 ${isDragOver ? 'text-green-500' : 'text-blue-400'}`} />
                    <p className={`text-base font-medium mb-1 ${isDragOver ? 'text-green-800' : 'text-blue-900'}`}>
                      {isDragOver ? 'Drop files here to upload' : 'Drag and drop resume files here, or click to browse'}
                    </p>
                    <p className="text-xs text-blue-600 mb-3">Supports PDF, DOC, DOCX, TXT, RTF, PNG, JPG, JPEG, WEBP files</p>
                    <p className="text-xs text-green-600 mb-3 font-medium">Unlimited file uploads supported - Individual files or ZIP folders</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.txt,.rtf,.png,.jpg,.jpeg,.webp,.zip"
                      onChange={(e) => handleFileUpload(e.target.files)}
                      className="hidden"
                      id="file-upload"
                    />
                    <Button 
                      variant="outline" 
                      className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white border-blue-600 hover:border-blue-700"
                      onClick={() => {
                        if (fileInputRef.current) {
                          fileInputRef.current.click();
                        }
                      }}
                    >
                      Browse Files
                    </Button>
                  </div>

                  {uploadedFiles.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-medium text-blue-900 mb-2 text-center">
                        Files Ready for Processing ({uploadedFiles.length} files)
                      </h4>
                      
                      <div className="space-y-1 max-h-20 overflow-y-auto">
                        {uploadedFiles.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-200">
                            <div className="flex items-center space-x-2">
                              {getFileIcon(file.name.split('.').pop() || '')}
                              <span className="text-xs text-blue-900 truncate">{file.name}</span>
                              <span className="text-xs text-blue-600">({(file.size / 1024).toFixed(1)} KB)</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFile(index)}
                              className="text-red-600 hover:text-red-700 h-6 w-6 p-0"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {uploadedFiles.length > 0 && (
                    <div className="mt-4 text-center space-y-2">
                      <Button onClick={processResumes} disabled={isProcessing} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2">
                        {isProcessing ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Processing Resumes...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 mr-2" />
                            Parse Resumes ({uploadedFiles.length} files)
                          </>
                        )}
                      </Button>
                      
                      {/* Show progress button if processing and modal is closed */}
                      {isProcessing && userClosedModal && (
                        <div>
                          <Button 
                            onClick={() => setShowProgressModal(true)} 
                            variant="outline" 
                            size="sm"
                            className="text-blue-600 border-blue-300 hover:bg-blue-50"
                          >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Show Progress
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>


        </TabsContent>


        <TabsContent value="bulk-status" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Bulk Processing Status</CardTitle>
                <div className="flex items-center space-x-2">
                  {(bulkProcessingStatus?.active_jobs || 0) > 0 && (
                    <Button
                      variant="destructive"
                      onClick={confirmCancelAllProcessing}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel All Processing
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={refreshAllBulkData}
                    disabled={isCheckingStatus}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className={`w-4 h-4 ${isCheckingStatus ? 'animate-spin' : ''}`} />
                    {isCheckingStatus ? 'Refreshing...' : 'Refresh Status'}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {unifiedJobs.length > 0 ? (
                <div className="space-y-6">
                  {/* Overall Progress Summary */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Processing Summary</CardTitle>
                        {/* Removed redundant refresh button - main header has the refresh functionality */}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {unifiedJobs.reduce((sum, job) => sum + job.total_files, 0)}
                          </div>
                          <div className="text-sm text-gray-600">Total Files</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {unifiedJobs.reduce((sum, job) => sum + job.successful_files, 0)}
                          </div>
                          <div className="text-sm text-gray-600">Successful</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-red-600">
                            {unifiedJobs.reduce((sum, job) => sum + job.failed_files, 0)}
                          </div>
                          <div className="text-sm text-gray-600">Failed</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-yellow-600">
                            {unifiedJobs.reduce((sum, job) => sum + (job.duplicate_files || 0), 0)}
                          </div>
                          <div className="text-sm text-gray-600">Duplicates</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* File Processing Details - Unified Jobs */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">File Processing Details</CardTitle>
                      <p className="text-sm text-gray-600">
                        All processing jobs (bulk imports and re-uploads)
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {unifiedJobs.map((job) => (
                          <JobCard key={job.id} job={job} />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="text-center py-8">
                  <RefreshCw className="w-8 h-8 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No file processing data available</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Upload files or re-upload failed resumes to see processing details
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="failed" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Failed Resumes Management</CardTitle>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    onClick={fetchFailedResumes}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                  <Button
                    variant="outline"
                    onClick={cleanupFailedResumes}
                    className="text-green-600 hover:text-green-700 border-green-300 hover:border-green-400"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Cleanup Processed
                  </Button>
                  {failedResumes.length > 0 && (
                    <Button
                      variant="destructive"
                      onClick={confirmDeleteAllFailedResumes}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete All
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {failedResumes.length > 0 ? (
                <div className="space-y-4">
                  {/* Selection Controls */}
                  <div className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="select-all-failed-resumes"
                        checked={selectedFailedResumes.size === failedResumes.length && failedResumes.length > 0}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedFailedResumes(new Set(failedResumes.map(r => r.resume_id)))
                          } else {
                            setSelectedFailedResumes(new Set())
                          }
                        }}
                        className="data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                      />
                      <Label htmlFor="select-all-failed-resumes" className="text-sm font-medium text-red-700">
                        Select All ({selectedFailedResumes.size} of {failedResumes.length})
                      </Label>
                    </div>
                    {selectedFailedResumes.size > 0 && (
                      <div className="flex items-center space-x-2">
                        <Button
                          onClick={reUploadFailedResumes}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                          size="sm"
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Re-upload Selected ({selectedFailedResumes.size})
                        </Button>
                      </div>
                    )}
                    {(bulkProcessingStatus?.active_jobs || 0) > 0 && (
                      <div className="flex items-center space-x-2">
                        <Button
                          onClick={confirmCancelAllProcessing}
                          variant="destructive"
                          size="sm"
                          className="bg-red-600 hover:bg-red-700"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Cancel All Processing
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Failed Resumes List */}
                  <div className="space-y-2">
                    {failedResumes.map((resume) => (
                      <div key={resume.resume_id} className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            id={`failed-resume-${resume.resume_id}`}
                            checked={selectedFailedResumes.has(resume.resume_id)}
                            onCheckedChange={(checked) => {
                              const newSet = new Set(selectedFailedResumes)
                              if (checked) {
                                newSet.add(resume.resume_id)
                              } else {
                                newSet.delete(resume.resume_id)
                              }
                              setSelectedFailedResumes(newSet)
                            }}
                            className="data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                          />
                          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                            {getFileIcon(resume.file_type)}
                          </div>
                          <div>
                            <h4 className="font-medium text-red-900">{resume.filename}</h4>
                            <p className="text-sm text-red-600">
                              <strong>Reason:</strong> {resume.failure_reason}
                            </p>
                            <p className="text-xs text-red-500">
                              <strong>Type:</strong> {resume.failure_type} | 
                              <strong> Size:</strong> {(resume.file_size / 1024).toFixed(1)} KB | 
                              <strong> Date:</strong> {new Date(resume.created_at * 1000).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => reUploadSingleFailedResume(resume.resume_id)}
                            className="border-blue-300 text-blue-600 hover:bg-blue-50 hover:border-blue-400"
                          >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Re-upload
                          </Button>
                          {(bulkProcessingStatus?.active_jobs || 0) > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={confirmCancelAllProcessing}
                              className="border-orange-300 text-orange-600 hover:bg-orange-50 hover:border-orange-400"
                            >
                              <X className="w-4 h-4 mr-2" />
                              Cancel Processing
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => confirmDeleteSingleFailedResume(resume.resume_id)}
                            className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Failed Resumes</h3>
                  <p className="text-gray-600">All resumes have been processed successfully!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="successful" className="space-y-6">
          {/* Filters and Actions */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Successful Resumes ({resumeData.length})</CardTitle>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    onClick={fetchResumes}
                    disabled={loading}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                  <Button
                    variant="outline"
                    onClick={async () => {
                      console.log('Testing API endpoints...')
                      try {
                        const user = JSON.parse(localStorage.getItem('ats_user') || 'null')
                        const token = user?.token
                        const companyId = user?.companyId
                        
                        // Test resumes endpoint
                        const response = await fetch(`${BASE_API_URL}/resumes?company_id=${companyId}`, {
                          headers: { 'Authorization': `Bearer ${token}` }
                        })
                        const data = await response.json()
                        console.log('Resumes API response:', data)
                        
                        // Test bulk status endpoint (this will likely fail with test job ID)
                        try {
                          const statusResponse = await fetch(`${BASE_API_URL}/bulk-processing-status/test`, {
                            headers: { 'Authorization': `Bearer ${token}` }
                          })
                          const statusData = await statusResponse.json()
                          console.log('Bulk status API response:', statusData)
                        } catch (statusError) {
                          console.log('Bulk status API error (expected):', statusError)
                        }
                        
                        toast({
                          title: "API Test Complete",
                          description: "Check console for results",
                        })
                      } catch (error) {
                        console.error('API test error:', error)
                        toast({
                          title: "API Test Failed",
                          description: error instanceof Error ? error.message : 'Unknown error',
                          variant: "destructive",
                        })
                      }
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Test APIs
                  </Button>
                  <Button
                    variant="outline"
                    onClick={toggleSelectAll}
                    disabled={filteredResumes.length === 0}
                  >
                    {selectedResumes.length === filteredResumes.length
                      ? "Deselect All"
                      : "Select All"}
                  </Button>
                  <Button
                    onClick={exportToExcel}
                    disabled={selectedResumes.length === 0}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export to Excel ({selectedResumes.length})
                  </Button>
                  {filteredResumes.length > 0 && (
                    <Button
                      variant="destructive"
                      onClick={confirmDeleteAllSuccessfulResumes}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete All
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* File Type Statistics */}
              {filteredResumes.length > 0 && (
                <div className="mb-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {/* Total Count */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-blue-600">{filteredResumes.length}</div>
                      <div className="text-sm text-blue-700">Total</div>
                    </div>
                    
                    {/* PDF Count */}
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {filteredResumes.filter(r => r.file_type?.toLowerCase() === 'pdf').length}
                      </div>
                      <div className="text-sm text-red-700">PDF</div>
                    </div>
                    
                    {/* DOCX Count */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {filteredResumes.filter(r => r.file_type?.toLowerCase() === 'docx').length}
                      </div>
                      <div className="text-sm text-blue-700">DOCX</div>
                    </div>
                    
                    {/* DOC Count */}
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {filteredResumes.filter(r => r.file_type?.toLowerCase() === 'doc').length}
                      </div>
                      <div className="text-sm text-green-700">DOC</div>
                    </div>
                    
                    {/* Image Count (JPG, PNG, etc.) */}
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {filteredResumes.filter(r => ['jpg', 'jpeg', 'png', 'webp'].includes(r.file_type?.toLowerCase())).length}
                      </div>
                      <div className="text-sm text-purple-700">Images</div>
                    </div>
                    
                    {/* Other Count */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-gray-600">
                        {filteredResumes.filter(r => !['pdf', 'docx', 'doc', 'jpg', 'jpeg', 'png', 'webp'].includes(r.file_type?.toLowerCase())).length}
                      </div>
                      <div className="text-sm text-gray-700">Other</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Filters */}
              <div className="space-y-4 mb-6">
                {/* Search and File Type Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search resumes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={fileTypeFilter} onValueChange={setFileTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by file type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="docx">DOCX</SelectItem>
                    <SelectItem value="doc">DOC</SelectItem>
                    <SelectItem value="txt">TXT</SelectItem>
                    <SelectItem value="jpg">JPG</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("")
                    setFileTypeFilter("all")
                      setDateFilter("all")
                      setStartDate("")
                      setEndDate("")
                  }}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Clear Filters
                </Button>
              </div>

                {/* Date Filters */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-gray-700">Date Filters</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setDateFilter("all")
                        setStartDate("")
                        setEndDate("")
                      }}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      Clear Date Filters
                    </Button>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4">
                    {/* Quick Date Filters */}
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-600">Quick:</span>
                      <div className="flex space-x-1">
                        {[
                          { value: "all", label: "All" },
                          { value: "today", label: "Today" },
                          { value: "yesterday", label: "Yesterday" },
                          { value: "this_week", label: "This Week" },
                          { value: "this_month", label: "This Month" },
                          { value: "last_month", label: "Last Month" }
                        ].map((filter) => (
                          <button
                            key={filter.value}
                            onClick={() => setDateFilter(filter.value)}
                            className={`px-2 py-1 text-xs rounded-md transition-colors ${
                              dateFilter === filter.value
                                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                            }`}
                          >
                            {filter.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Custom Date Range */}
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-600">Custom:</span>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => {
                          setStartDate(e.target.value)
                          setDateFilter("custom")
                        }}
                        className="px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <span className="text-xs text-gray-500">to</span>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => {
                          setEndDate(e.target.value)
                          setDateFilter("custom")
                        }}
                        className="px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <button
                        onClick={() => setDateFilter("custom")}
                        className={`px-3 py-1 text-xs rounded-md transition-colors ${
                          dateFilter === "custom" && (startDate || endDate)
                            ? 'bg-blue-100 text-blue-700 border border-blue-200'
                            : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        Apply
                      </button>
                    </div>
                  </div>

                  {/* Active Filter Display */}
                  {dateFilter !== "all" && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">Active filter:</span>
                        <Badge variant="outline" className="text-xs">
                          {dateFilter === "custom" 
                            ? `Custom: ${startDate} to ${endDate}`
                            : dateFilter.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
                          }
                        </Badge>
                        <span className="text-xs text-gray-500">
                          ({filteredResumes.length} of {resumeData.length} resumes)
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Active Filters Summary */}
              {(searchTerm || fileTypeFilter !== "all" || dateFilter !== "all") && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Filter className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">Active Filters:</span>
                    </div>
                    <span className="text-sm text-blue-600">
                      Showing {filteredResumes.length} of {resumeData.length} resumes
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {searchTerm && (
                      <Badge variant="secondary" className="text-xs">
                        Search: "{searchTerm}"
                      </Badge>
                    )}
                    {fileTypeFilter !== "all" && (
                      <Badge variant="secondary" className="text-xs">
                        File Type: {fileTypeFilter.toUpperCase()}
                      </Badge>
                    )}
                    {dateFilter !== "all" && (
                      <Badge variant="secondary" className="text-xs">
                        Date: {dateFilter === "custom" 
                          ? `Custom (${startDate} to ${endDate})`
                          : dateFilter.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
                        }
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Results Table */}
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                  <span>Loading resumes...</span>
                </div>
              ) : (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={selectedResumes.length === filteredResumes.length && filteredResumes.length > 0}
                            onCheckedChange={toggleSelectAll}
                          />
                        </TableHead>
                        <TableHead>File</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Experience</TableHead>
                        <TableHead>Candidate Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="w-20">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredResumes.map((resume) => {
                        // Ensure resume has all required fields with fallbacks
                        const safeResume = {
                          id: resume.id || 0,
                          filename: resume.filename || 'Unknown',
                          file_type: resume.file_type || 'unknown',
                          candidate_name: resume.candidate_name || 'N/A',
                          candidate_email: resume.candidate_email || 'N/A',
                          total_experience: resume.total_experience || 'N/A',
                          created_at: resume.created_at || new Date().toISOString(),
                          parsed_data: resume.parsed_data || null
                        }
                        
                        const parsedData = parseResumeData(safeResume.parsed_data)
                        return (
                          <TableRow key={resume.id}>
                            <TableCell>
                              <Checkbox
                                checked={selectedResumes.includes(safeResume.id)}
                                onCheckedChange={() => toggleResumeSelection(safeResume.id)}
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                {getFileIcon(safeResume.file_type)}
                                <span className="text-sm font-medium">{safeResume.filename}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="font-medium">{parsedData?.Name || safeResume.candidate_name || 'N/A'}</span>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm">{parsedData?.Email || safeResume.candidate_email || 'N/A'}</span>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm">{parsedData?.Phone || 'N/A'}</span>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm">{parsedData?.TotalExperience || safeResume.total_experience || 'N/A'}</span>
                            </TableCell>
                            <TableCell>
                              {resume.candidate_created ? (
                                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Candidate Created
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-600">
                                  <Clock className="w-3 h-3 mr-1" />
                                  Not Created
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              <span className="text-sm">
                                {new Date(safeResume.created_at).toLocaleDateString()}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => downloadResume(resume.id)}
                                  className="text-blue-600 hover:text-blue-700"
                                  title="Download Resume"
                                >
                                  <Download className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => initiateCreateCandidate(resume.id)}
                                  className="text-green-600 hover:text-green-700"
                                  title="Add to Candidates"
                                >
                                  <Plus className="w-4 h-4" />
                                </Button>
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                                    <DialogHeader>
                                      <DialogTitle className="flex items-center space-x-2">
                                        <User className="w-5 h-5" />
                                        <span>{parsedData?.Name || safeResume.candidate_name || 'Resume Details'}</span>
                                      </DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-6">
                                      {/* Contact Information */}
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="flex items-center space-x-2">
                                          <Mail className="w-4 h-4 text-gray-500" />
                                          <span className="text-sm">{parsedData?.Email || safeResume.candidate_email || 'N/A'}</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                          <Phone className="w-4 h-4 text-gray-500" />
                                          <span className="text-sm">{parsedData?.Phone || 'N/A'}</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                          <MapPin className="w-4 h-4 text-gray-500" />
                                          <span className="text-sm">{parsedData?.Address || 'N/A'}</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                          <Briefcase className="w-4 h-4 text-gray-500" />
                                          <span className="text-sm">{parsedData?.TotalExperience || safeResume.total_experience || 'N/A'}</span>
                                        </div>
                                      </div>

                                      <Separator />

                                      {/* Summary */}
                                      {parsedData?.Summary && (
                                        <div>
                                          <h4 className="font-medium mb-2">Professional Summary</h4>
                                          <p className="text-sm text-gray-700">{parsedData.Summary}</p>
                                        </div>
                                      )}

                                      {/* Experience */}
                                      {parsedData?.Experience && parsedData.Experience.length > 0 && (
                                        <div>
                                          <h4 className="font-medium mb-3 flex items-center space-x-2">
                                            <Briefcase className="w-4 h-4" />
                                            <span>Work Experience</span>
                                          </h4>
                                          <div className="space-y-3">
                                            {parsedData.Experience.map((exp, idx) => (
                                              <div key={idx} className="border-l-2 border-blue-200 pl-4">
                                                <div className="flex items-center justify-between mb-1">
                                                  <h5 className="font-medium">{exp.Position}</h5>
                                                  <Badge variant="outline" className="text-xs">
                                                    {exp.Duration}
                                                  </Badge>
                                                </div>
                                                <p className="text-sm text-blue-600 mb-1">{exp.Company}</p>
                                                <p className="text-sm text-gray-600">{exp.Description}</p>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}

                                      {/* Education */}
                                      {parsedData?.Education && parsedData.Education.length > 0 && (
                                        <div>
                                          <h4 className="font-medium mb-3 flex items-center space-x-2">
                                            <GraduationCap className="w-4 h-4" />
                                            <span>Education</span>
                                          </h4>
                                          <div className="space-y-3">
                                            {parsedData.Education.map((edu, idx) => (
                                              <div key={idx} className="border-l-2 border-green-200 pl-4">
                                                <div className="flex items-center justify-between mb-1">
                                                  <h5 className="font-medium">{edu.Degree} in {edu.Field}</h5>
                                                  <Badge variant="outline" className="text-xs">
                                                    {edu.Year}
                                                  </Badge>
                                                </div>
                                                <p className="text-sm text-green-600">{edu.Institution}</p>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}

                                      {/* Skills */}
                                      {parsedData?.Skills && parsedData.Skills.length > 0 && (
                                        <div>
                                          <h4 className="font-medium mb-3 flex items-center space-x-2">
                                            <Code className="w-4 h-4" />
                                            <span>Skills</span>
                                          </h4>
                                          <div className="flex flex-wrap gap-2">
                                            {parsedData.Skills.map((skill, idx) => (
                                              <Badge key={idx} variant="secondary">
                                                {skill}
                                              </Badge>
                                            ))}
                                          </div>
                                        </div>
                                      )}

                                      {/* Languages */}
                                      {parsedData?.Languages && parsedData.Languages.length > 0 && (
                                        <div>
                                          <h4 className="font-medium mb-3 flex items-center space-x-2">
                                            <Globe className="w-4 h-4" />
                                            <span>Languages</span>
                                          </h4>
                                          <div className="flex flex-wrap gap-2">
                                            {parsedData.Languages.map((lang, idx) => (
                                              <Badge key={idx} variant="outline">
                                                {lang}
                                              </Badge>
                                            ))}
                                          </div>
                                        </div>
                                      )}

                                      {/* Projects */}
                                      {parsedData?.Projects && parsedData.Projects.length > 0 && (
                                        <div>
                                          <h4 className="font-medium mb-3 flex items-center space-x-2">
                                            <Award className="w-4 h-4" />
                                            <span>Projects</span>
                                          </h4>
                                          <div className="space-y-3">
                                            {parsedData.Projects.map((project, idx) => (
                                              <div key={idx} className="border-l-2 border-purple-200 pl-4">
                                                <h5 className="font-medium mb-1">{project.Name}</h5>
                                                <p className="text-sm text-gray-600 mb-2">{project.Description}</p>
                                                {project.Technologies && project.Technologies.length > 0 && (
                                                  <div className="flex flex-wrap gap-1">
                                                    {project.Technologies.map((tech, techIdx) => (
                                                      <Badge key={techIdx} variant="outline" className="text-xs">
                                                        {tech}
                                                      </Badge>
                                                    ))}
                                                  </div>
                                                )}
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}

                                      {/* Certifications */}
                                      {parsedData?.Certifications && parsedData.Certifications.length > 0 && (
                                        <div>
                                          <h4 className="font-medium mb-3 flex items-center space-x-2">
                                            <Award className="w-4 h-4" />
                                            <span>Certifications</span>
                                          </h4>
                                          <div className="space-y-2">
                                            {parsedData.Certifications.map((cert, idx) => (
                                              <div key={idx} className="border-l-2 border-orange-200 pl-4">
                                                <p className="text-sm text-gray-700">{cert}</p>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </DialogContent>
                                </Dialog>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => confirmDeleteParsedData(resume.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}

              {filteredResumes.length === 0 && !loading && (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                    {(() => {
                      const filters = []
                      if (searchTerm) filters.push('search term')
                      if (fileTypeFilter !== "all") filters.push(`${fileTypeFilter.toUpperCase()} file type`)
                      if (dateFilter !== "all") {
                        if (dateFilter === "custom") {
                          filters.push(`date range (${startDate} to ${endDate})`)
                        } else {
                          filters.push(dateFilter.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()))
                        }
                      }
                      
                      if (filters.length > 0) {
                        return `No resumes found matching your ${filters.join(', ')} criteria.`
                      }
                      return 'No resumes found matching your filters.'
                    })()}
                  </p>
                  {(searchTerm || fileTypeFilter !== "all" || dateFilter !== "all") && (
                    <p className="text-sm text-gray-500 mt-2">
                      Try adjusting your filters or search terms.
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    Tips: Ensure you are in the correct company context and uploads have completed. Resumes without an email may be deduped; switch backend dedupe to ID or none if needed.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>



      </Tabs>

      {/* Confirmation Dialogs */}
      
      {/* Cancel Processing Confirmation */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <XCircle className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Cancel Processing</h3>
                <p className="text-sm text-gray-600">Are you sure you want to cancel the resume processing?</p>
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowCancelConfirm(false)}
              >
                Keep Processing
              </Button>
              <Button
                variant="destructive"
                onClick={cancelProcessing}
              >
                Yes, Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel All Processing Confirmation */}
      {showCancelAllConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <X className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Cancel All Processing</h3>
                <p className="text-sm text-gray-600">Are you sure you want to cancel all processing jobs? This will stop all resume processing activities.</p>
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowCancelAllConfirm(false)}
              >
                Keep Processing
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  cancelAllProcessing()
                  setShowCancelAllConfirm(false)
                }}
              >
                Yes, Cancel All
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete All Failed Resumes Confirmation */}
      {showDeleteAllConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete All Failed Resumes</h3>
                <p className="text-sm text-gray-600">Are you sure you want to delete all {failedResumes.length} failed resumes? This action cannot be undone.</p>
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowDeleteAllConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  deleteAllFailedResumes()
                  setShowDeleteAllConfirm(false)
                }}
              >
                Yes, Delete All
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Single Failed Resume Confirmation */}
      {showDeleteSingleConfirm && resumeToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Failed Resume</h3>
                <p className="text-sm text-gray-600">Are you sure you want to delete this failed resume? This action cannot be undone.</p>
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteSingleConfirm(false)
                  setResumeToDelete(null)
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  deleteFailedResume(resumeToDelete)
                  setShowDeleteSingleConfirm(false)
                  setResumeToDelete(null)
                }}
              >
                Yes, Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Parsed Data Confirmation */}
      {showDeleteParsedConfirm && parsedDataToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Resume Data</h3>
                <p className="text-sm text-gray-600">Are you sure you want to delete this parsed resume data? This action cannot be undone.</p>
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteParsedConfirm(false)
                  setParsedDataToDelete(null)
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  deleteResume(parsedDataToDelete)
                  setShowDeleteParsedConfirm(false)
                  setParsedDataToDelete(null)
                }}
              >
                Yes, Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete All Successful Resumes Confirmation */}
      {showDeleteAllSuccessfulConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete All Successful Resumes</h3>
                <p className="text-sm text-gray-600">Are you sure you want to delete all {filteredResumes.length} successful resumes? This action cannot be undone.</p>
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowDeleteAllSuccessfulConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  deleteAllSuccessfulResumes()
                  setShowDeleteAllSuccessfulConfirm(false)
                }}
              >
                Yes, Delete All
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Reupload Confirmation */}
      {showReuploadConfirm && resumeToReupload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <RefreshCw className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Re-upload Failed Resume</h3>
                <p className="text-sm text-gray-600">Are you sure you want to re-upload this failed resume? You can check the processing status in the Bulk Status tab.</p>
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowReuploadConfirm(false)
                  setResumeToReupload(null)
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  confirmReupload()
                  setResumeToReupload(null)
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Yes, Re-upload
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Results Modal */}
      {showResultsModal && parseResults && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 w-full max-w-3xl mx-4 max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <span>Processing Results</span>
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowResultsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Simple Summary Text */}
            <div className="text-center mb-4 text-sm text-gray-600">
              <div>Successful: <span className="font-semibold text-green-600">{parseResults.successful_files || 0}</span> | 
                   Failed: <span className="font-semibold text-red-600">{parseResults.failed_files || 0}</span> | 
                   Total: <span className="font-semibold text-blue-600">{parseResults.total_files || 0}</span>
              </div>
              <div>Processing time: <span className="font-semibold">{parseResults.total_processing_time?.toFixed(2)}s</span></div>
              <div>Duplicates: <span className="font-semibold text-orange-600">{parseResults.duplicate_files || 0}</span></div>
            </div>

            {/* Detailed Results Table */}
            {parseResults.results && parseResults.results.length > 0 && (
              <div className="border rounded-lg overflow-hidden flex-1 flex flex-col">
                <div className="bg-gray-50 px-4 py-2 border-b">
                  <h4 className="text-sm font-semibold text-gray-900">Detailed Results</h4>
                </div>
                <div className="overflow-auto flex-1">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium text-gray-500 uppercase">File Name</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-500 uppercase">Type</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-500 uppercase">Time</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-500 uppercase">Details</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {parseResults.results.map((result, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-3 py-2">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-6 w-6">
                                {getFileIcon(result.file_type || '')}
                              </div>
                              <div className="ml-2">
                                <div className="font-medium text-gray-900 truncate max-w-32">{result.filename}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            {result.status === 'success' ? (
                              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Success
                              </span>
                            ) : result.status === 'duplicate' ? (
                              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                Duplicate
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
                                <XCircle className="w-3 h-3 mr-1" />
                                Failed
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-gray-900">
                            {result.file_type?.toUpperCase() || 'Unknown'}
                          </td>
                          <td className="px-3 py-2 text-gray-900">
                            {result.processing_time ? `${result.processing_time.toFixed(2)}s` : 'N/A'}
                          </td>
                          <td className="px-3 py-2">
                            {result.status === 'success' ? (
                              <div>
                                <div className="font-medium text-green-700 text-xs">
                                  {result.parsed_data?.Name || 'Name extracted'}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {result.parsed_data?.Email || 'Email extracted'}
                                </div>
                                <div className="mt-1">
                                  <span className={`inline-flex items-center px-1 py-0.5 rounded text-xs font-medium ${
                                    result.embedding_status === 'completed' 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-red-100 text-red-800'
                                  }`}>
                                    {result.embedding_status === 'completed' ? '✅' : '❌'}
                                  </span>
                                </div>
                              </div>
                            ) : result.status === 'duplicate' ? (
                              <div className="text-yellow-600 text-xs">
                                <div className="font-medium">Duplicate Found</div>
                                <div className="text-gray-500">
                                  {result.error || 'Resume already exists'}
                                </div>
                              </div>
                            ) : (
                              <div className="text-red-600 text-xs">
                                <div className="font-medium">Processing Failed</div>
                                <div className="text-gray-500">
                                  {result.error || 'Failed to process'}
                                </div>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Close Button */}
            <div className="mt-4 text-center">
              <Button
                onClick={() => setShowResultsModal(false)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 text-sm"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

