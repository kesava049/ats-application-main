"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Slider } from "../../components/ui/slider"
import { Label } from "../../components/ui/label"
import { Textarea } from "../../components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog"
import {
  Upload,
  Sparkles,
  CheckCircle,
  AlertCircle,
  X,
  XCircle,
  Loader2,
  FileText,
  Trash2,
  Edit,
  Save,
  Send,
    Plus
} from "lucide-react"
import { useToast } from "../../components/ui/use-toast"
import BASE_API_URL from '../../BaseUrlApi'

interface BulkJobData {
  title: string
  company: string
  department: string
  internalSPOC: string
  recruiter: string
  email: string
  jobType: string
  experienceLevel: string
  country: string
  city: string
  fullLocation: string
  workType: string
  jobStatus: string
  salaryMin: string
  salaryMax: string
  priority: string
  description: string
  requirements: string
  requiredSkills: string
  benefits: string
}

interface BulkJobPostingProps {
  onJobsCreated?: () => void
}

export default function BulkJobPosting({ onJobsCreated }: BulkJobPostingProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isPosting, setIsPosting] = useState(false)
  const [prompt, setPrompt] = useState("")
  const [count, setCount] = useState(5)
  const [generatedJobs, setGeneratedJobs] = useState<BulkJobData[]>([])
  const [editingJobIndex, setEditingJobIndex] = useState<number | null>(null)
  const [editingJob, setEditingJob] = useState<BulkJobData | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [generationTime, setGenerationTime] = useState<number | null>(null)
  const [startTime, setStartTime] = useState<number | null>(null)
  const [currentTime, setCurrentTime] = useState<number | null>(null)
  const [abortController, setAbortController] = useState<AbortController | null>(null)

  // Dynamic slider color based on count
  const sliderColor = count <= 5 ? '#10b981' : '#ef4444' // green-500 or red-500

  const { toast } = useToast()

  // Helper function to format Indian Rupees
  const formatIndianRupees = (amount: string | number) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
    if (isNaN(numAmount)) return '₹0'
    return `₹${numAmount.toLocaleString('en-IN')}`
  }

  // Real-time timer update during generation
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    
    if (isGenerating && startTime) {
      interval = setInterval(() => {
        setCurrentTime(Date.now())
      }, 100) // Update every 100ms for smooth timer
    } else {
      setCurrentTime(null)
    }
    
    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [isGenerating, startTime])

  // Cleanup effect to cancel ongoing requests when component unmounts
  useEffect(() => {
    return () => {
      if (abortController) {
        try {
          abortController.abort()
        } catch (error) {
          // AbortError is expected when aborting a request during cleanup
          if (error instanceof Error && error.name !== 'AbortError') {
            console.error('Unexpected error aborting API call during cleanup:', error)
          }
        }
      }
    }
  }, [abortController])

  // Character limits
  const characterLimits = {
    title: 150,
    company: 100,
    department: 80,
    internalSPOC: 100,
    recruiter: 100,
    email: 150,
    fullLocation: 200,
    description: 5000,
    requirements: 2000,
    requiredSkills: 1000,
    benefits: 1000
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
    const isOverLimit = count > limit
    const isNearLimit = count > limit * 0.8 && count <= limit

    let messageColor = 'text-gray-500'
    let messageText = `${count}/${limit} characters`

    if (count === 0) {
      messageColor = 'text-gray-400'
    } else if (isOverLimit) {
      messageColor = 'text-red-500'
      messageText = `${count}/${limit} characters (${Math.abs(remaining)} over limit)`
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


  // Generate bulk jobs
  const generateBulkJobs = async () => {
    if (!prompt.trim()) {
      setMessage({ type: 'error', text: 'Please enter a prompt for job generation' })
      return
    }


    if (count < 1 || count > 10) {
      setMessage({ type: 'error', text: 'Count must be between 1 and 10' })
      return
    }

    try {
      setIsGenerating(true)
      setMessage(null)
      setStartTime(Date.now())

      // Get JWT token and company ID from localStorage
      const user = JSON.parse(localStorage.getItem('ats_user') || 'null');
      const token = user?.token;
      const companyId = user?.companyId;

      if (!token || !companyId) {
        throw new Error('Authentication required. Please login again.');
      }

      // Create new AbortController for this request
      const controller = new AbortController()
      setAbortController(controller)

      const response = await fetch(`http://localhost:8002/job-posting/bulk-generate`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Company-ID': companyId.toString()
        },
        body: JSON.stringify({ 
          prompt: prompt.trim(),
          count: count,
          company_id: companyId
        }),
        signal: controller.signal
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
          throw new Error('Access denied. You do not have permission to generate bulk job postings.');
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
        const endTime = Date.now()
        const totalTime = startTime ? (endTime - startTime) / 1000 : 0
        const apiTime = data.time || totalTime
        
        setGeneratedJobs(data.data)
        setGenerationTime(apiTime)
        setMessage({ 
          type: 'success', 
          text: `Successfully generated ${data.jobCount} job postings in ${apiTime.toFixed(2)} seconds!` 
        })
        
        toast({
          title: "Success!",
          description: `Generated ${data.jobCount} job postings in ${apiTime.toFixed(2)} seconds.`,
          variant: "default",
        })
      } else {
        throw new Error(data.message || 'Failed to generate job postings')
      }
    } catch (error) {
      console.error('Error generating bulk jobs:', error)

      let errorMessage = 'Failed to generate job postings'
      let errorTitle = 'Error'
      let isValidationError = false

      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        errorMessage = 'API server is not available. Please start your backend server to use this feature.'
      } else if (error instanceof Error) {
        if (error.name === 'AbortError') {
          console.log('API call was aborted')
          errorMessage = 'Job generation was cancelled'
          // Don't show error message for cancelled requests
          setMessage({ type: 'error', text: errorMessage })
          toast({
            title: "Cancelled",
            description: errorMessage,
            variant: "default",
          })
          return // Exit early for aborted requests
        } else {
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
      }

      setMessage({ type: 'error', text: errorMessage })
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: isValidationError ? "default" : "destructive",
      })
    } finally {
      setIsGenerating(false)
      setStartTime(null)
      setCurrentTime(null)
      setAbortController(null)
    }
  }

  // Post bulk jobs
  const postBulkJobs = async () => {
    if (generatedJobs.length === 0) {
      setMessage({ type: 'error', text: 'No jobs to post. Please generate jobs first.' })
      return
    }

    try {
      setIsPosting(true)
      setMessage(null)

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

      // Add companyId to each job
      const jobsWithCompanyId = generatedJobs.map(job => ({
        ...job,
        companyId: companyId
      }))


      const response = await fetch(`${BASE_API_URL}/jobs/post-job`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(jobsWithCompanyId)
      })

      if (!response.ok) {
        // Try to get error details from response
        let errorMessage = `HTTP error! status: ${response.status}`
        let errorDetails = []
        
        try {
          const errorData = await response.json()
          console.error('❌ Backend error details:', errorData)
          
          if (errorData.message) {
            errorMessage += ` - ${errorData.message}`
          }
          
          // Handle different error formats
          if (errorData.errors && Array.isArray(errorData.errors)) {
            errorDetails = errorData.errors
            errorMessage += ` - Errors: ${errorData.errors.join(', ')}`
          } else if (errorData.error) {
            errorDetails = [errorData.error]
            errorMessage += ` - Error: ${errorData.error}`
          } else if (errorData.details) {
            errorDetails = [errorData.details]
            errorMessage += ` - Details: ${errorData.details}`
          }
          
          // Handle field-specific validation errors
          if (errorData.validationErrors) {
            const fieldErrors = Object.entries(errorData.validationErrors)
              .map(([field, message]) => `${field}: ${message}`)
            errorDetails.push(...fieldErrors)
            errorMessage += ` - Validation: ${fieldErrors.join(', ')}`
          }
          
          // Handle missing fields
          if (errorData.missingFields) {
            errorDetails.push(`Missing fields: ${errorData.missingFields.join(', ')}`)
            errorMessage += ` - Missing: ${errorData.missingFields.join(', ')}`
          }
          
        } catch (parseError) {
          console.error('❌ Could not parse error response:', parseError)
          errorDetails = ['Unable to parse error details']
        }
        
        // Create a more detailed error object
        const detailedError = new Error(errorMessage)
        ;(detailedError as any).details = errorDetails
        ;(detailedError as any).status = response.status
        throw detailedError
      }

      const result = await response.json()

      if (result.success) {
        setMessage({ 
          type: 'success', 
          text: `Successfully posted ${result.successfulJobs} out of ${result.totalJobs} jobs!` 
        })
        
        toast({
          title: "Bulk Jobs Posted!",
          description: `Successfully posted ${result.successfulJobs} job postings.`,
          variant: "default",
        })

        // Reset form
        setGeneratedJobs([])
        setPrompt("")
        setCount(5)
        
        // Refresh jobs list if callback provided
        if (onJobsCreated) {
          onJobsCreated()
        }
      } else {
        throw new Error(result.message || 'Failed to post jobs')
      }
    } catch (error) {
      console.error('Error posting bulk jobs:', error)

      let errorMessage = 'Failed to post jobs'
      let errorDetails = []
      
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        errorMessage = 'API server is not available. Please start your backend server to use this feature.'
      } else if (error instanceof Error) {
        errorMessage = error.message
        
        // Extract detailed error information
        if ((error as any).details && Array.isArray((error as any).details)) {
          errorDetails = (error as any).details
        }
      }

      // Create a more detailed error message
      let fullErrorMessage = errorMessage;
      if (errorDetails.length > 0) {
        fullErrorMessage +=
          "\n\nDetails:\n" +
          (errorDetails as string[]).map((detail: string) => `• ${detail}`).join("\n");
      }

      setMessage({ type: "error", text: fullErrorMessage });
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsPosting(false)
    }
  }

  // Start editing a job
  const startEditingJob = (index: number) => {
    setEditingJobIndex(index)
    setEditingJob({ ...generatedJobs[index] })
  }

  // Save edited job
  const saveEditedJob = () => {
    if (editingJobIndex !== null && editingJob) {
      const updatedJobs = [...generatedJobs]
      updatedJobs[editingJobIndex] = editingJob
      setGeneratedJobs(updatedJobs)
      setEditingJobIndex(null)
      setEditingJob(null)
      
      toast({
        title: "Job Updated",
        description: "Job posting updated successfully!",
        variant: "default",
      })
    }
  }

  // Cancel editing
  const cancelEditing = () => {
    setEditingJobIndex(null)
    setEditingJob(null)
  }

  // Delete a job
  const deleteJob = (index: number) => {
    const updatedJobs = generatedJobs.filter((_, i) => i !== index)
    setGeneratedJobs(updatedJobs)
    
    toast({
      title: "Job Deleted",
      description: "Job posting removed from bulk list.",
      variant: "default",
    })
  }

  // Clear all jobs
  const clearAllJobs = () => {
    // Cancel ongoing API call if generating
    if (isGenerating && abortController) {
      console.log('Aborting API call...')
      try {
        abortController.abort()
        console.log('API call aborted successfully')
      } catch (error) {
        // AbortError is expected when aborting a request, so we don't need to log it as an error
        if (error instanceof Error && error.name === 'AbortError') {
          console.log('API call was successfully aborted')
        } else {
          console.error('Unexpected error aborting API call:', error)
        }
      }
      
      setMessage({ type: 'error', text: 'Job generation was cancelled' })
      toast({
        title: "Cancelled",
        description: "Job generation was cancelled.",
        variant: "default",
      })
    }
    
    // Always clear the form and reset states
    setGeneratedJobs([])
    setPrompt("")
    setCount(5)
    setMessage(null)
    setGenerationTime(null)
    setCurrentTime(null)
    setStartTime(null)
    setIsGenerating(false)
    setAbortController(null)
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
          {/* <Plus className="w-4 h-4 mr-2" /> */}
           Add Jobs in Bulk
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto bg-gradient-to-br from-slate-50 to-blue-50 border-0 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-800 text-center">
           Job Posting with AI
          </DialogTitle>
          <DialogDescription className="text-center text-gray-600">
            Generate multiple job postings using AI based on your requirements
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Generation Form */}
          <Card className="bg-white border border-gray-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
              <CardTitle className="flex items-center space-x-3 text-xl">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="text-gray-800 font-bold">Job Posting using AI</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              {message && (
                <div className={`p-4 rounded-xl border-l-4 shadow-lg ${
                  message.type === 'success'
                    ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-400 text-green-800'
                    : 'bg-gradient-to-r from-red-50 to-rose-50 border-red-400 text-red-800'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        message.type === 'success' ? 'bg-green-500' : 'bg-red-500'
                      }`}>
                        {message.type === 'success' ? (
                          <CheckCircle className="w-4 h-4 text-white" />
                        ) : (
                          <XCircle className="w-4 h-4 text-white" />
                        )}
                      </div>
                      <span className="font-medium">{message.text}</span>
                    </div>
                    {generationTime && message.type === 'success' && (
                      <div className="flex items-center space-x-2 text-sm bg-white/50 px-3 py-1 rounded-full">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="font-medium">{generationTime.toFixed(2)}s</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-4">
                  <div className="space-y-4">
                    <Label htmlFor="prompt" className="text-lg font-semibold text-gray-700 flex items-center space-x-2">
                      <FileText className="w-5 h-5 text-purple-600" />
                      <span>Job Description Prompt <span className="text-red-500">*</span></span>
                    </Label>
                    <div className="relative">
                      <Textarea
                        id="prompt"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Generate job postings for Java developers with different experience levels..."
                        rows={8}
                        className="border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-lg text-base p-4 transition-all duration-200 min-h-[200px] resize-none"
                        disabled={isGenerating}
                      />
                      <div className="absolute bottom-3 right-3 bg-white px-2 py-1 rounded text-xs text-gray-500 border border-gray-200">
                        {prompt.length}/50
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        {prompt.length}/50 characters minimum
                      </div>
                      {prompt.length < 50 && prompt.length > 0 && (
                        <div className="text-sm text-red-500 font-medium">
                          Need {50 - prompt.length} more characters
                        </div>
                      )}
                    </div>
                    <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-blue-700">Be specific about role, location, requirements, and benefits for better results</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                    <div className="space-y-3">
                      <div className="text-center">
                        <Label htmlFor="count" className="text-sm font-medium text-gray-600 mb-1 block">
                          Job Count Selection
                        </Label>
                        <div className="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full shadow-sm">
                          <span className="text-white font-bold text-sm">{count}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="px-1">
                          <Slider
                            id="count"
                            min={1}
                            max={10}
                            step={1}
                            value={[count]}
                            onValueChange={(value) => setCount(value[0])}
                            className="w-full"
                            style={{
                              '--slider-track': '#e5e7eb',
                              '--slider-range': count <= 5 ? '#3b82f6' : '#ef4444',
                              '--slider-thumb': count <= 5 ? '#3b82f6' : '#ef4444',
                            } as React.CSSProperties}
                          />
                        </div>
                        
                        <div className="flex justify-between text-xs text-gray-400">
                          <span>Min: 1</span>
                          <span>Max: 10</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Action buttons */}
                  <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                    <div className="space-y-3">
                      <div className="flex justify-center">
                        <div className="flex space-x-1">
                          {Array.from({ length: 10 }, (_, i) => (
                            <div
                              key={i}
                              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                                i < count
                                  ? i < 5
                                    ? 'bg-blue-500 scale-110'
                                    : 'bg-red-500 scale-110'
                                  : 'bg-gray-200'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      
                      <div className="text-center">
                        <p className={`text-sm font-medium mb-3 ${
                          count <= 5 ? 'text-blue-600' : 'text-red-600'
                        }`}>
                          {count === 1 
                            ? "Creating 1 job posting" 
                            : `Creating ${count} job postings`
                          }
                        </p>
                        
                        {count > 5 && (
                          <div className="flex items-center justify-center space-x-1 text-xs text-red-600 bg-red-50 px-2 py-1 rounded mb-3">
                            <AlertCircle className="w-3 h-3" />
                            <span>Extended processing time</span>
                          </div>
                        )}
                        {count <= 5 && (
                          <div className="flex items-center justify-center space-x-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded mb-3">
                            <CheckCircle className="w-3 h-3" />
                            <span>Fast processing</span>
                          </div>
                        )}
                        
                        <div className="flex flex-col space-y-2">
                          <Button
                            variant="outline"
                            onClick={clearAllJobs}
                            className="w-full flex items-center justify-center space-x-2 border border-gray-300 hover:bg-gray-50 hover:border-gray-400 text-gray-700 py-2 text-sm"
                          >
                            {isGenerating ? (
                              <>
                                <X className="w-4 h-4" />
                                <span>Cancel & Clear</span>
                              </>
                            ) : (
                              <>
                                <Trash2 className="w-4 h-4" />
                                <span>Clear All</span>
                              </>
                            )}
                          </Button>
                          <Button
                            onClick={generateBulkJobs}
                            disabled={isGenerating || !prompt.trim() || prompt.length < 50}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 text-sm font-semibold shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isGenerating ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                <span>Generating...</span>
                                {startTime && currentTime && (
                                  <span className="ml-2 text-xs opacity-75">
                                    ({(currentTime - startTime) / 1000}s)
                                  </span>
                                )}
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-4 h-4 mr-2" />
                                Generate Jobs
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-200">
                <div className="text-center text-sm text-gray-600">
                  ⚡ AI will generate unique job variations based on your prompt
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Generated Jobs List */}
          {generatedJobs.length > 0 && (
            <Card className="bg-white border border-gray-200 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-3 text-xl">
                    <div className="w-10 h-10 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg flex items-center justify-center shadow-sm">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-gray-800 font-bold">
                      Generated Jobs ({generatedJobs.length})
                    </span>
                    {generationTime && (
                      <div className="flex items-center space-x-2 text-sm text-white bg-green-600 px-3 py-1 rounded-lg shadow-sm">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                        <span className="font-medium">{generationTime.toFixed(2)}s</span>
                      </div>
                    )}
                  </CardTitle>
                  <div className="flex space-x-3">
                    <Button
                      variant="outline"
                      onClick={clearAllJobs}
                      className="flex items-center space-x-2 border border-gray-300 hover:bg-gray-50 hover:border-gray-400 text-gray-700 px-4 py-2 font-medium"
                    >
                      {isGenerating ? (
                        <>
                          <X className="w-4 h-4" />
                          <span>Cancel & Clear</span>
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4" />
                          <span>Clear All</span>
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={postBulkJobs}
                      disabled={isPosting}
                      className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 font-semibold shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isPosting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          <span>Posting Jobs...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          <span>Post All Jobs</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  {generatedJobs.map((job, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm hover:shadow-md transition-all duration-200">
                      {editingJobIndex === index ? (
                        // Edit Mode
                        <div className="space-y-6">
                          <div className="flex items-center justify-between bg-blue-50 p-4 rounded-lg border border-blue-200">
                            <h4 className="font-bold text-xl text-gray-800 flex items-center space-x-2">
                              <Edit className="w-5 h-5 text-blue-600" />
                              <span>Editing Job {index + 1}</span>
                            </h4>
                            <div className="flex space-x-3">
                              <Button
                                onClick={saveEditedJob}
                                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 font-semibold shadow-sm hover:shadow-md transition-all duration-200"
                              >
                                <Save className="w-4 h-4 mr-2" />
                                Save
                              </Button>
                              <Button
                                variant="outline"
                                onClick={cancelEditing}
                                className="border border-gray-300 hover:bg-gray-50 px-4 py-2 font-semibold"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                          
                          {/* Basic Information */}
                          <div className="space-y-4">
                            <h5 className="font-medium text-gray-900 border-b pb-2">Basic Information</h5>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Job Title</Label>
                                <Input
                                  value={editingJob?.title || ""}
                                  onChange={(e) => setEditingJob({ ...editingJob!, title: e.target.value })}
                                  maxLength={characterLimits.title}
                                />
                                {renderCharacterCount(editingJob?.title || "", 'title')}
                              </div>
                              <div className="space-y-2">
                                <Label>Company</Label>
                                <Input
                                  value={editingJob?.company || ""}
                                  onChange={(e) => setEditingJob({ ...editingJob!, company: e.target.value })}
                                  maxLength={characterLimits.company}
                                />
                                {renderCharacterCount(editingJob?.company || "", 'company')}
                              </div>
                              <div className="space-y-2">
                                <Label>Department</Label>
                                <Input
                                  value={editingJob?.department || ""}
                                  onChange={(e) => setEditingJob({ ...editingJob!, department: e.target.value })}
                                  maxLength={characterLimits.department}
                                />
                                {renderCharacterCount(editingJob?.department || "", 'department')}
                              </div>
                              <div className="space-y-2">
                                <Label>Internal SPOC</Label>
                                <Input
                                  value={editingJob?.internalSPOC || ""}
                                  onChange={(e) => setEditingJob({ ...editingJob!, internalSPOC: e.target.value })}
                                  maxLength={characterLimits.internalSPOC}
                                />
                                {renderCharacterCount(editingJob?.internalSPOC || "", 'internalSPOC')}
                              </div>
                              <div className="space-y-2">
                                <Label>Recruiter</Label>
                                <Input
                                  value={editingJob?.recruiter || ""}
                                  onChange={(e) => setEditingJob({ ...editingJob!, recruiter: e.target.value })}
                                  maxLength={characterLimits.recruiter}
                                />
                                {renderCharacterCount(editingJob?.recruiter || "", 'recruiter')}
                              </div>
                              <div className="space-y-2">
                                <Label>Email</Label>
                                <Input
                                  type="email"
                                  value={editingJob?.email || ""}
                                  onChange={(e) => setEditingJob({ ...editingJob!, email: e.target.value })}
                                  maxLength={characterLimits.email}
                                />
                                {renderCharacterCount(editingJob?.email || "", 'email')}
                              </div>
                            </div>
                          </div>

                          {/* Job Details */}
                          <div className="space-y-4">
                            <h5 className="font-medium text-gray-900 border-b pb-2">Job Details</h5>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Job Type</Label>
                                <Input
                                  value={editingJob?.jobType || ""}
                                  onChange={(e) => setEditingJob({ ...editingJob!, jobType: e.target.value })}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Experience Level</Label>
                                <Input
                                  value={editingJob?.experienceLevel || ""}
                                  onChange={(e) => setEditingJob({ ...editingJob!, experienceLevel: e.target.value })}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Country</Label>
                                <Input
                                  value={editingJob?.country || ""}
                                  onChange={(e) => setEditingJob({ ...editingJob!, country: e.target.value })}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>City</Label>
                                <Input
                                  value={editingJob?.city || ""}
                                  onChange={(e) => setEditingJob({ ...editingJob!, city: e.target.value })}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Full Location</Label>
                                <Input
                                  value={editingJob?.fullLocation || ""}
                                  onChange={(e) => setEditingJob({ ...editingJob!, fullLocation: e.target.value })}
                                  maxLength={characterLimits.fullLocation}
                                />
                                {renderCharacterCount(editingJob?.fullLocation || "", 'fullLocation')}
                              </div>
                              <div className="space-y-2">
                                <Label>Work Type</Label>
                                <Input
                                  value={editingJob?.workType || ""}
                                  onChange={(e) => setEditingJob({ ...editingJob!, workType: e.target.value })}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Job Status</Label>
                                <Input
                                  value={editingJob?.jobStatus || ""}
                                  onChange={(e) => setEditingJob({ ...editingJob!, jobStatus: e.target.value })}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Priority</Label>
                                <Input
                                  value={editingJob?.priority || ""}
                                  onChange={(e) => setEditingJob({ ...editingJob!, priority: e.target.value })}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Salary Information */}
                          <div className="space-y-4">
                            <h5 className="font-medium text-gray-900 border-b pb-2">Salary Information</h5>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Salary Min (₹)</Label>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                                    ₹
                                  </span>
                                  <Input
                                    type="number"
                                    value={editingJob?.salaryMin || ""}
                                    onChange={(e) => setEditingJob({ ...editingJob!, salaryMin: e.target.value })}
                                    className="pl-8"
                                    placeholder="70000"
                                  />
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Label>Salary Max (₹)</Label>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                                    ₹
                                  </span>
                                  <Input
                                    type="number"
                                    value={editingJob?.salaryMax || ""}
                                    onChange={(e) => setEditingJob({ ...editingJob!, salaryMax: e.target.value })}
                                    className="pl-8"
                                    placeholder="90000"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Job Content */}
                          <div className="space-y-4">
                            <h5 className="font-medium text-gray-900 border-b pb-2">Job Content</h5>
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label>Description</Label>
                                <Textarea
                                  value={editingJob?.description || ""}
                                  onChange={(e) => setEditingJob({ ...editingJob!, description: e.target.value })}
                                  rows={4}
                                  maxLength={characterLimits.description}
                                />
                                {renderCharacterCount(editingJob?.description || "", 'description')}
                              </div>
                              <div className="space-y-2">
                                <Label>Requirements</Label>
                                <Textarea
                                  value={editingJob?.requirements || ""}
                                  onChange={(e) => setEditingJob({ ...editingJob!, requirements: e.target.value })}
                                  rows={3}
                                  maxLength={characterLimits.requirements}
                                />
                                {renderCharacterCount(editingJob?.requirements || "", 'requirements')}
                              </div>
                              <div className="space-y-2">
                                <Label>Required Skills</Label>
                                <Textarea
                                  value={editingJob?.requiredSkills || ""}
                                  onChange={(e) => setEditingJob({ ...editingJob!, requiredSkills: e.target.value })}
                                  rows={2}
                                  maxLength={characterLimits.requiredSkills}
                                />
                                {renderCharacterCount(editingJob?.requiredSkills || "", 'requiredSkills')}
                              </div>
                              <div className="space-y-2">
                                <Label>Benefits</Label>
                                <Textarea
                                  value={editingJob?.benefits || ""}
                                  onChange={(e) => setEditingJob({ ...editingJob!, benefits: e.target.value })}
                                  rows={2}
                                  maxLength={characterLimits.benefits}
                                />
                                {renderCharacterCount(editingJob?.benefits || "", 'benefits')}
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        // View Mode
                        <div className="space-y-6">
                          <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <h4 className="font-bold text-xl text-gray-800 flex items-center space-x-2">
                              <FileText className="w-5 h-5 text-blue-600" />
                              <span>{job.title}</span>
                            </h4>
                            <div className="flex space-x-3">
                              <Button
                                variant="outline"
                                onClick={() => startEditingJob(index)}
                                className="flex items-center space-x-2 border border-gray-300 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-all duration-200"
                              >
                                <Edit className="w-4 h-4" />
                                <span>Edit</span>
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => deleteJob(index)}
                                className="flex items-center space-x-2 border border-gray-300 text-red-600 hover:bg-red-50 hover:border-red-300 transition-all duration-200"
                              >
                                <Trash2 className="w-4 h-4" />
                                <span>Delete</span>
                              </Button>
                            </div>
                          </div>
                          
                          {/* Basic Information */}
                          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <h5 className="font-semibold text-gray-800 mb-3 text-lg">Job Details</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div className="space-y-1">
                                <span className="font-medium text-gray-600">Company:</span>
                                <p className="text-gray-900 font-medium">{job.company}</p>
                              </div>
                              <div className="space-y-1">
                                <span className="font-medium text-gray-600">Department:</span>
                                <p className="text-gray-900 font-medium">{job.department}</p>
                              </div>
                              <div className="space-y-1">
                                <span className="font-medium text-gray-600">Internal SPOC:</span>
                                <p className="text-gray-900 font-medium">{job.internalSPOC}</p>
                              </div>
                              <div className="space-y-1">
                                <span className="font-medium text-gray-600">Recruiter:</span>
                                <p className="text-gray-900 font-medium">{job.recruiter}</p>
                              </div>
                              <div className="space-y-1">
                                <span className="font-medium text-gray-600">Email:</span>
                                <p className="text-gray-900 font-medium">{job.email}</p>
                              </div>
                              <div className="space-y-1">
                                <span className="font-medium text-gray-600">Job Type:</span>
                                <p className="text-gray-900 font-medium">{job.jobType}</p>
                              </div>
                            </div>
                          </div>

                          {/* Location & Experience */}
                          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <h5 className="font-semibold text-gray-800 mb-3 text-lg">Location & Experience</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div className="space-y-1">
                                <span className="font-medium text-gray-600">Experience Level:</span>
                                <p className="text-gray-900 font-medium">{job.experienceLevel}</p>
                              </div>
                              <div className="space-y-1">
                                <span className="font-medium text-gray-600">Country:</span>
                                <p className="text-gray-900 font-medium">{job.country}</p>
                              </div>
                              <div className="space-y-1">
                                <span className="font-medium text-gray-600">City:</span>
                                <p className="text-gray-900 font-medium">{job.city}</p>
                              </div>
                              <div className="space-y-1">
                                <span className="font-medium text-gray-600">Full Location:</span>
                                <p className="text-gray-900 font-medium">{job.fullLocation}</p>
                              </div>
                            </div>
                          </div>
                          
                          {/* Work Type & Status */}
                          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <h5 className="font-semibold text-gray-800 mb-3 text-lg">Work Details</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div className="space-y-1">
                                <span className="font-medium text-gray-600">Work Type:</span>
                                <p className="text-gray-900 font-medium">{job.workType}</p>
                              </div>
                              <div className="space-y-1">
                                <span className="font-medium text-gray-600">Job Status:</span>
                                <p className="text-gray-900 font-medium">{job.jobStatus}</p>
                              </div>
                            </div>
                          </div>

                          {/* Salary & Priority */}
                          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <h5 className="font-semibold text-gray-800 mb-3 text-lg">Compensation & Priority</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div className="space-y-1">
                                <span className="font-medium text-gray-600">Salary Min:</span>
                                <div className="flex items-center space-x-2">
                                  <p className="text-gray-900 font-medium">{formatIndianRupees(job.salaryMin)}</p>
                                  {!job.salaryMin || Number(job.salaryMin) === 0 ? (
                                    <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">Missing</span>
                                  ) : (
                                    <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded">✓</span>
                                  )}
                                </div>
                              </div>
                              <div className="space-y-1">
                                <span className="font-medium text-gray-600">Salary Max:</span>
                                <div className="flex items-center space-x-2">
                                  <p className="text-gray-900 font-medium">{formatIndianRupees(job.salaryMax)}</p>
                                  {!job.salaryMax || Number(job.salaryMax) === 0 ? (
                                    <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">Missing</span>
                                  ) : (
                                    <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded">✓</span>
                                  )}
                                </div>
                              </div>
                              <div className="space-y-1">
                                <span className="font-medium text-gray-600">Priority:</span>
                                <p className="text-gray-900 font-medium">{job.priority}</p>
                              </div>
                              <div className="space-y-1">
                                <span className="font-medium text-gray-600">Salary Range:</span>
                                <p className="text-gray-900 font-medium">
                                  {job.salaryMin && job.salaryMax && Number(job.salaryMin) > 0 && Number(job.salaryMax) > 0
                                    ? `${formatIndianRupees(job.salaryMin)} - ${formatIndianRupees(job.salaryMax)}`
                                    : <span className="text-red-600">Not specified</span>
                                  }
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Description */}
                          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <h5 className="font-semibold text-gray-800 mb-3 text-lg">Job Description</h5>
                            <p className="text-sm text-gray-700 leading-relaxed">
                              {job.description}
                            </p>
                          </div>

                          {/* Requirements */}
                          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <h5 className="font-semibold text-gray-800 mb-3 text-lg">Requirements</h5>
                            <p className="text-sm text-gray-700 leading-relaxed">
                              {job.requirements}
                            </p>
                          </div>

                          {/* Skills */}
                          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <h5 className="font-semibold text-gray-800 mb-3 text-lg">Required Skills</h5>
                            <p className="text-sm text-gray-700 leading-relaxed">
                              {job.requiredSkills}
                            </p>
                          </div>

                          {/* Benefits */}
                          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <h5 className="font-semibold text-gray-800 mb-3 text-lg">Benefits</h5>
                            <p className="text-sm text-gray-700 leading-relaxed">
                              {job.benefits}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

