"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { Textarea } from "../../../components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select"
import { Badge } from "../../../components/ui/badge"
import { Checkbox } from "../../../components/ui/checkbox"
import {
  Building2,
  MapPin,
  IndianRupee,
  Clock,
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Briefcase,
  Globe,
  X,
  Loader2,
  Sparkles,
} from "lucide-react"
import { formatSalary, JOB_TYPES, COUNTRIES } from "../../../lib/location-data"
import BASE_API_URL from '../../../BaseUrlApi';
import PYTHON_API_URL from '../../../PythonApi';
import { useToast } from "../../../components/ui/use-toast";

interface JobPosting {
  id: string
  title: string
  company: string
  companyName: string
  companyId?: number // ✅ Add companyId for resume parsing
  companyLogo?: string
  location: string
  country: string
  city: string
  jobType: string
  salaryMin: number
  salaryMax: number
  description: string
  requirements: string[]
  skills: string[]
  experience: string
  status: string
  priority: string
  postedDate: string
  lastUpdated: string
  applicants: number
  views: number
  internalSPOC: string
  recruiter: string
  department: string
  employmentType: string
  remote: boolean
  benefits: string[]
  customQuestions?: Array<{
    id: string
    question: string
    type: "text" | "select" | "number" | "boolean"
    required: boolean
    options?: string[]
  }>
}

interface ApplicationData {
  firstName: string
  lastName: string
  email: string
  phone: string
  currentLocation: string
  resumeFile: File | null
  coverLetter: string
  customAnswers: Record<string, any>
  source: string
  utmSource: string
  utmMedium: string
  utmCampaign: string
  applicationId?: number
  jobTitle?: string
  company?: string
  resumeFilePath?: string
}

interface ParsedResumeData {
  Name?: string
  Email?: string
  Phone?: string
  Address?: string
  GitHub?: string
  LinkedIn?: string
  Portfolio?: string
  Summary?: string
  TotalExperience?: string
  Experience?: Array<{
    Company: string
    Position: string
    Duration: string
    Description: string
  }>
  Education?: Array<{
    Institution: string
    Degree: string
    Field: string
    Year: string
  }>
  Skills?: string[]
  Certifications?: string[]
  Languages?: string[]
  Projects?: Array<{
    Name: string
    Description: string
    Technologies: string[]
  }>
}

export default function ApplyJobPage() {
  const params = useParams()
  const router = useRouter()
  const jobSlug = params.jobId as string
  
  // Extract job ID from slug (last part after splitting by '-')
  const jobId = jobSlug.split('-').pop()

  const [job, setJob] = useState<JobPosting | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [isParsing, setIsParsing] = useState(false)
  const [parsedData, setParsedData] = useState<ParsedResumeData | null>(null)
  const [autoFilledFields, setAutoFilledFields] = useState<Set<string>>(new Set())

  const [applicationData, setApplicationData] = useState<ApplicationData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    currentLocation: "",
    resumeFile: null,
    coverLetter: "",
    customAnswers: {},
    source: "social-media",
    utmSource: "",
    utmMedium: "",
    utmCampaign: "",
    applicationId: undefined,
    jobTitle: "",
    company: "",
    resumeFilePath: "",
  })

  const { toast } = useToast();

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

  useEffect(() => {
    // Extract UTM parameters from URL
    const urlParams = new URLSearchParams(window.location.search)
    const utmSource = urlParams.get("utm_source") || ""
    const utmMedium = urlParams.get("utm_medium") || ""
    const utmCampaign = urlParams.get("utm_campaign") || ""

    setApplicationData((prev) => ({
      ...prev,
      utmSource,
      utmMedium,
      utmCampaign,
    }))

    // Fetch job details from API (PUBLIC - no authentication required)
    const fetchJobDetails = async () => {
      try {
        setLoading(true)
        
        console.log('Fetching job details for slug:', jobSlug)
        console.log('Extracted job ID:', jobId)
        
        // Use public job endpoint with full slug - no authentication required
        const response = await fetch(`${BASE_API_URL}/job-listings/${jobSlug}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })
        
        if (!response.ok) {
          const errorText = await response.text()
          console.error('API Error Response:', errorText)
          throw new Error(`Failed to fetch jobs: ${response.status} ${response.statusText}`)
        }
        
        const data = await response.json()
        console.log('Fetched job from API:', data)
        
        // The public endpoint should return the job directly
        const foundJob = data.job || data
        
        if (foundJob) {
          console.log('Found job data:', foundJob);
          console.log('Company logo from API:', foundJob.companyLogo);
          
          // Transform API data to match our JobPosting interface
          const transformedJob: JobPosting = {
            id: foundJob.id || foundJob._id || jobId,
            title: foundJob.title || "Untitled Job",
            company: foundJob.company || "Unknown Company",
            companyName: foundJob.companyName || foundJob.company || "Unknown Company",
            companyId: foundJob.companyId, // ✅ Store companyId from API
            companyLogo: foundJob.companyLogo || null,
            location: foundJob.fullLocation || foundJob.location || "Unknown Location",
            country: foundJob.country || "Unknown",
            city: foundJob.city || "Unknown",
            jobType: (foundJob.jobType || "full-time").toLowerCase(),
            salaryMin: foundJob.salaryMin || 0,
            salaryMax: foundJob.salaryMax || 0,
            description: foundJob.description || "No description available",
            requirements: Array.isArray(foundJob.requirements) ? foundJob.requirements : 
                         typeof foundJob.requirements === 'string' ? foundJob.requirements.split('\n').filter((r: string) => r.trim()) : [],
            skills: Array.isArray(foundJob.requiredSkills) ? foundJob.requiredSkills : 
                    typeof foundJob.requiredSkills === 'string' ? foundJob.requiredSkills.split(',').map((s: string) => s.trim()) : [],
            experience: foundJob.experienceLevel || "Not specified",
            status: "active",
            priority: (foundJob.priority || "medium").toLowerCase() as "urgent" | "high" | "medium" | "low",
            postedDate: foundJob.createdAt ? new Date(foundJob.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            lastUpdated: foundJob.updatedAt ? new Date(foundJob.updatedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            applicants: foundJob.applicants || 0,
            views: foundJob.views || 0,
            internalSPOC: foundJob.internalSPOC || "Not specified",
            recruiter: foundJob.recruiter || "Not specified",
            department: foundJob.department || "Not specified",
            employmentType: foundJob.jobType || "Full-time",
            remote: foundJob.workType === "Remote",
            benefits: Array.isArray(foundJob.benefits) ? foundJob.benefits : 
                      typeof foundJob.benefits === 'string' ? foundJob.benefits.split(',').map((b: string) => b.trim()) : [],
            customQuestions: [
              {
                id: "keySkills",
                question: "Which skills do you possess that would help you excel in this position?",
                type: "text",
                required: true,
              },
              {
                id: "salaryExpectation",
                question: "What are your salary expectations?",
                type: "number",
                required: true,
              },
              {
                id: "noticePeriod",
                question: "How long is your notice period?",
                type: "select",
                required: true,
                options: ["Immediate", "2 weeks", "1 month", "2 months", "3 months"],
              },
                             {
                 id: "yearsOfExperience",
                 question: "How many years of relevant experience do you have?",
                 type: "select",
                 required: true,
                 options: ["0-1 years", "2-3 years", "4-5 years", "6-10 years", "10+ years"],
               },
              {
                id: "remoteWork",
                question: "Are you open to remote work?",
                type: "boolean",
                required: false,
              },
              {
                id: "startDate",
                question: "When can we expect you to start working with us?",
                type: "select",
                required: true,
                options: ["Immediately", "Within 2 weeks", "Within 1 month", "Within 2 months", "More than 2 months"],
              },
              {
                id: "portfolioUrl",
                question: "Please provide a link to your portfolio or GitHub profile",
                type: "text",
                required: false,
              },
            ]
          }
          
          setJob(transformedJob)
          
          // Initialize custom answers
          const initialAnswers: Record<string, any> = {}
          transformedJob.customQuestions?.forEach((q) => {
            initialAnswers[q.id] = q.type === "boolean" ? false : ""
          })
          setApplicationData((prev) => ({
            ...prev,
            customAnswers: initialAnswers,
          }))
        } else {
          toast({
            title: "Job Not Found",
            description: "The job you're looking for doesn't exist or has been removed.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Error fetching job details:', error)
        toast({
          title: "Failed to Load Job Details",
          description: "Failed to load job details. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false)
      }
    }

    fetchJobDetails()
  }, [jobId])

  const handleInputChange = (field: keyof ApplicationData, value: any) => {
    setApplicationData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleCustomAnswerChange = (questionId: string, value: any) => {
    setApplicationData((prev) => ({
      ...prev,
      customAnswers: {
        ...prev.customAnswers,
        [questionId]: value,
      },
    }))
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
             // Validate file type and size
       const allowedTypes = [
         "application/pdf",
         "application/msword",
         "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
         "text/plain",
         "application/rtf",
         "image/png",
         "image/jpeg",
         "image/jpg"
       ]
      const maxSize = 5 * 1024 * 1024 // 5MB

      if (!allowedTypes.includes(file.type)) {
                 toast({
           title: "Invalid File Type",
           description: "Please upload a supported file format: PDF, DOCX, DOC, TXT, RTF, PNG, JPG, or JPEG.",
           variant: "destructive",
         });
        return
      }

      if (file.size > maxSize) {
        toast({
          title: "File Too Large",
          description: "File size must be less than 5MB.",
          variant: "destructive",
        });
        return
      }

      // Start upload progress simulation
      setIsUploading(true)
      setUploadProgress(0)
      
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval)
            setIsUploading(false)
            return 100
          }
          return prev + 10
        })
      }, 100)
      
      // Complete upload after 1 second
      setTimeout(async () => {
        setUploadProgress(100)
        setIsUploading(false)
        setApplicationData((prev) => ({
          ...prev,
          resumeFile: file,
        }))
        setError("")
        
        // Start parsing the resume
        await parseResume(file)
        
        toast({
          title: "Resume Uploaded Successfully",
          description: `${file.name} has been uploaded successfully.`,
        });
      }, 1000)
    }
  }

  const parseResume = async (file: File) => {
    try {
      setIsParsing(true)
      
      console.log('🔍 Resume Parse Debug - Starting parseResume function')
      console.log('🔍 Resume Parse Debug - File:', file.name, file.size, file.type)
      console.log('🔍 Resume Parse Debug - Job data:', job)
      
      const formData = new FormData()
      formData.append('file', file)
      
      // Add companyId as query parameter for company isolation
      const companyId = job?.companyId
      const url = companyId ? `${PYTHON_API_URL}/parse-resume?company_id=${companyId}` : `${PYTHON_API_URL}/parse-resume`
      
      console.log('🔍 Resume Parse Debug - Company ID:', companyId)
      console.log('🔍 Resume Parse Debug - Parse URL:', url)
      console.log('🔍 Resume Parse Debug - Python API URL:', PYTHON_API_URL)
      
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      })
      
      console.log('🔍 Resume Parse Debug - Response status:', response.status)
      console.log('🔍 Resume Parse Debug - Response headers:', Object.fromEntries(response.headers.entries()))
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Resume parsing API Error:', errorText)
        throw new Error(`Failed to parse resume: ${response.status} ${response.statusText}`)
      }
      
      const result = await response.json()
      console.log('🔍 Resume Parse Debug - Full response:', result)
      
      if (result.successful_files > 0 && result.results && result.results.length > 0) {
        const firstResult = result.results[0]
        if (firstResult.status === 'success' && firstResult.parsed_data) {
          setParsedData(firstResult.parsed_data)
          
          // Auto-fill form fields with parsed data
          autoFillFormFields(firstResult.parsed_data)
          
          toast({
            title: "Resume Parsed Successfully! ✨",
            description: "Form fields have been automatically filled with information from your resume.",
          });
        } else {
          throw new Error(firstResult.error || 'Failed to parse resume')
        }
      } else {
        throw new Error('No successful parsing results')
      }
      
    } catch (error) {
      console.error('Error parsing resume:', error)
      toast({
        title: "Resume Parsing Failed",
        description: "Could not extract information from your resume. Please fill the form manually.",
        variant: "destructive",
      });
    } finally {
      setIsParsing(false)
    }
  }

  const autoFillFormFields = (data: ParsedResumeData) => {
    const newAutoFilledFields = new Set<string>()
    
    // Auto-fill basic information
    if (data.Name) {
      const nameParts = data.Name.trim().split(' ')
      if (nameParts.length >= 2) {
        setApplicationData(prev => ({
          ...prev,
          firstName: nameParts[0],
          lastName: nameParts.slice(1).join(' ')
        }))
        newAutoFilledFields.add('firstName')
        newAutoFilledFields.add('lastName')
      } else if (nameParts.length === 1) {
        setApplicationData(prev => ({
          ...prev,
          firstName: nameParts[0]
        }))
        newAutoFilledFields.add('firstName')
      }
    }
    
    if (data.Email) {
      setApplicationData(prev => ({
        ...prev,
        email: data.Email || ''
      }))
      newAutoFilledFields.add('email')
    }
    
    if (data.Phone) {
      setApplicationData(prev => ({
        ...prev,
        phone: data.Phone || ''
      }))
      newAutoFilledFields.add('phone')
    }
    
    if (data.Address) {
      setApplicationData(prev => ({
        ...prev,
        currentLocation: data.Address || ''
      }))
      newAutoFilledFields.add('currentLocation')
    }
    
         // Auto-fill cover letter with comprehensive parsed data in professional format
     let coverLetterContent = ""
     
     // Add summary if available
     if (data.Summary) {
       coverLetterContent += `${data.Summary}\n\n`
     }
     
     // Add experience details in professional format
     if (data.Experience && data.Experience.length > 0) {
       coverLetterContent += `I have ${data.Experience.length} year${data.Experience.length > 1 ? 's' : ''} of professional experience in software development. `
       
       data.Experience.forEach((exp, index) => {
         if (index === 0) {
           coverLetterContent += `Currently, I work as a ${exp.Position} at ${exp.Company}, where I ${exp.Description.toLowerCase().replace(/^./, exp.Description.charAt(0).toLowerCase())}`
         } else {
           coverLetterContent += ` Previously, I worked as a ${exp.Position} at ${exp.Company}, where I ${exp.Description.toLowerCase().replace(/^./, exp.Description.charAt(0).toLowerCase())}`
         }
       })
       coverLetterContent += "\n\n"
     }
     
     // Add education in professional format
     if (data.Education && data.Education.length > 0) {
       data.Education.forEach((edu, index) => {
         coverLetterContent += `I hold a ${edu.Degree} in ${edu.Field} from ${edu.Institution}, graduating in ${edu.Year}. `
       })
       coverLetterContent += "\n\n"
     }
     
     // Add skills in professional format
     if (data.Skills && data.Skills.length > 0) {
       const topSkills = data.Skills.slice(0, 6) // Show top 6 skills
       coverLetterContent += `My technical expertise includes ${topSkills.slice(0, -1).join(', ')}, and ${topSkills.slice(-1)[0]}. `
       if (data.Skills.length > 6) {
         coverLetterContent += `I also have experience with ${data.Skills.slice(6, 9).join(', ')} and other technologies.`
       }
       coverLetterContent += "\n\n"
     }
     
     // Add projects in professional format
     if (data.Projects && data.Projects.length > 0) {
       coverLetterContent += `Throughout my career, I have successfully delivered several projects including `
       data.Projects.forEach((project, index) => {
         if (index === 0) {
           coverLetterContent += `${project.Name}, a ${project.Description.toLowerCase().replace(/^./, project.Description.charAt(0).toLowerCase())}`
         } else if (index === data.Projects!.length - 1) {
           coverLetterContent += `, and ${project.Name}, where I ${project.Description.toLowerCase().replace(/^./, project.Description.charAt(0).toLowerCase())}`
         } else {
           coverLetterContent += `, ${project.Name}, which involved ${project.Description.toLowerCase().replace(/^./, project.Description.charAt(0).toLowerCase())}`
         }
       })
       coverLetterContent += "\n\n"
     }
     
     // Add languages in professional format
     if (data.Languages && data.Languages.length > 0) {
       coverLetterContent += `I am proficient in ${data.Languages.slice(0, -1).join(', ')}, and ${data.Languages.slice(-1)[0]}, which enables me to communicate effectively in diverse environments.\n\n`
     }
     
     // Add professional statement
     coverLetterContent += `I am passionate about creating innovative solutions and continuously learning new technologies. I believe my technical skills, project experience, and collaborative approach make me an excellent fit for this position. I am excited about the opportunity to contribute to your team and help drive the success of your projects.\n\n`
     
     // Add contact information
     if (data.GitHub || data.LinkedIn || data.Portfolio) {
       coverLetterContent += `You can review my work and professional background through my online profiles: `
       const links = []
       if (data.GitHub) links.push(`GitHub (${data.GitHub})`)
       if (data.LinkedIn) links.push(`LinkedIn (${data.LinkedIn})`)
       if (data.Portfolio) links.push(`Portfolio (${data.Portfolio})`)
       coverLetterContent += links.join(', ') + "."
     }
     
     // Set the cover letter content
     if (coverLetterContent.trim()) {
       setApplicationData(prev => ({
         ...prev,
         coverLetter: coverLetterContent.trim()
       }))
       newAutoFilledFields.add('coverLetter')
     }
    
    // Auto-fill custom answers
    if (data.Skills && data.Skills.length > 0) {
      setApplicationData(prev => ({
        ...prev,
        customAnswers: {
          ...prev.customAnswers,
          keySkills: data.Skills!.join(', ')
        }
      }))
      newAutoFilledFields.add('keySkills')
    }
    
    // Auto-fill portfolio URL with GitHub if available
    if (data.GitHub && !applicationData.customAnswers.portfolioUrl) {
      setApplicationData(prev => ({
        ...prev,
        customAnswers: {
          ...prev.customAnswers,
          portfolioUrl: data.GitHub
        }
      }))
      newAutoFilledFields.add('portfolioUrl')
    }
    
              // Auto-fill experience with better parsing
     if (data.TotalExperience) {
       const experienceText = data.TotalExperience.toLowerCase()
       
       // Parse years from experience text
       let years = "0-1 years"
       
       // First check for months only (like "11 months")
       if (experienceText.includes("month") && !experienceText.includes("year")) {
         const monthMatch = experienceText.match(/(\d+)\s*month/)
         if (monthMatch) {
           const monthNum = parseInt(monthMatch[1])
           if (monthNum >= 1 && monthNum <= 11) {
             years = "0-1 years" // If only months, set years to 0-1
           }
         }
       }
       // Check for years
       else if (experienceText.includes("year") || experienceText.includes("yr")) {
         const yearMatch = experienceText.match(/(\d+)\s*year/)
         if (yearMatch) {
           const yearNum = parseInt(yearMatch[1])
           if (yearNum === 1) {
             years = "0-1 years"
           } else if (yearNum >= 2 && yearNum <= 3) {
             years = "2-3 years"
           } else if (yearNum >= 4 && yearNum <= 5) {
             years = "4-5 years"
           } else if (yearNum >= 6 && yearNum <= 10) {
             years = "6-10 years"
           } else if (yearNum > 10) {
             years = "10+ years"
           }
         }
       }
       
       setApplicationData(prev => ({
         ...prev,
         customAnswers: {
           ...prev.customAnswers,
           yearsOfExperience: years
         }
       }))
       newAutoFilledFields.add('yearsOfExperience')
     }
    
    setAutoFilledFields(newAutoFilledFields)
  }

  const isFieldAutoFilled = (fieldName: string) => {
    return autoFilledFields.has(fieldName)
  }

  const getInputClassName = (fieldName: string, baseClassName: string) => {
    if (isFieldAutoFilled(fieldName)) {
      return `${baseClassName} border-green-500 bg-green-50 focus:border-green-600 focus:ring-green-600`
    }
    return baseClassName
  }

  const validateForm = () => {
    const missingFields = []
    
    if (!applicationData.firstName.trim()) missingFields.push("First Name")
    if (!applicationData.lastName.trim()) missingFields.push("Last Name")
    if (!applicationData.email.trim()) missingFields.push("Email")
    if (!applicationData.phone.trim()) missingFields.push("Phone Number")
    if (!applicationData.resumeFile) missingFields.push("Resume")
    
    if (missingFields.length > 0) {
      return `Missing required fields: ${missingFields.join(", ")}. Please fill in all required information.`
    }

    // Validate custom questions
    if (job?.customQuestions) {
      for (const question of job.customQuestions) {
        if (question.required) {
          const answer = applicationData.customAnswers[question.id]
          if (!answer || (typeof answer === "string" && !answer.trim())) {
            return `Missing required answer: ${question.question}. Please provide your response.`
          }
        }
      }
    }

    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      toast({
        title: "Validation Error",
        description: validationError,
        variant: "destructive",
      });
      return
    }

    setSubmitting(true)
    setError("")

    try {
      // Validate that we have a job before proceeding
      if (!job) {
        throw new Error("Job information is not available. Please refresh the page and try again.")
      }
      
      // Prepare the application data according to the API format
      const applicationPayload = {
         firstName: applicationData.firstName,
         lastName: applicationData.lastName,
         email: applicationData.email,
         phone: applicationData.phone,
         currentLocation: applicationData.currentLocation,
         coverLetter: applicationData.coverLetter,
         keySkills: applicationData.customAnswers.keySkills || "",
         salaryExpectation: applicationData.customAnswers.salaryExpectation || "",
         noticePeriod: applicationData.customAnswers.noticePeriod || "",
         yearsOfExperience: applicationData.customAnswers.yearsOfExperience || "",
         remoteWork: applicationData.customAnswers.remoteWork || false,
         startDate: applicationData.customAnswers.startDate || "",
         portfolioUrl: applicationData.customAnswers.portfolioUrl || "",
       }

      // Use the same slug format for application submission
      const applyUrl = `${BASE_API_URL}/job-listings/${jobSlug}/apply`
      
      console.log('Submitting application to:', applyUrl)
      console.log('Application payload:', applicationPayload)
      
      let response
      
      // Check if we have a resume file to upload
      if (applicationData.resumeFile) {
        // Use FormData for file upload
        const formData = new FormData()
        formData.append('resume', applicationData.resumeFile)
        
        // Add other fields to FormData
        Object.entries(applicationPayload).forEach(([key, value]) => {
          formData.append(key, value.toString())
        })
        
        console.log('Using FormData for file upload')
        response = await fetch(applyUrl, {
          method: 'POST',
          body: formData, // Don't set Content-Type header for FormData
        })
      } else {
        // Use JSON for text-only data
        console.log('Using JSON for text-only data')
        response = await fetch(applyUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(applicationPayload),
        })
      }

      if (!response.ok) {
        const errorText = await response.text()
        console.error('API Error Response:', errorText)
        
        // Handle error response
        if (response.status === 400 || response.status === 404) {
          console.log('Job not found or invalid URL')
          
          if (applicationData.resumeFile) {
            const formData = new FormData()
            formData.append('resume', applicationData.resumeFile)
            Object.entries(applicationPayload).forEach(([key, value]) => {
              formData.append(key, value.toString())
            })
            
            response = await fetch(applyUrl, {
              method: 'POST',
              body: formData,
            })
          } else {
            response = await fetch(applyUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(applicationPayload),
            })
          }
          
          if (!response.ok) {
            const fallbackErrorText = await response.text()
            console.error('Fallback API Error Response:', fallbackErrorText)
            let errorMessage = "Application submission failed. Please try again."
            try {
              const errorData = JSON.parse(fallbackErrorText)
              errorMessage = errorData.message || errorMessage
            } catch (e) {
              // If not JSON, use the text as is
              errorMessage = fallbackErrorText
            }
            toast({
              title: "Application Submission Failed",
              description: errorMessage,
              variant: "destructive",
            });
            throw new Error(errorMessage)
          }
        } else {
          const errorText = await response.text()
          console.error('API Error Response:', errorText)
          let errorMessage = "Application submission failed. Please try again."
          try {
            const errorData = JSON.parse(errorText)
            errorMessage = errorData.message || errorMessage
          } catch (e) {
            // If not JSON, use the text as is
            errorMessage = errorText
          }
          toast({
            title: "Application Submission Failed",
            description: errorMessage,
            variant: "destructive",
          });
          throw new Error(errorMessage)
        }
      }

      const result = await response.json()
      console.log("Application submitted successfully:", result)
      
      // Store the application result for display
      setApplicationData((prev) => ({
        ...prev,
        applicationId: result.applicationId,
        jobTitle: result.jobTitle,
        company: result.company,
        resumeFilePath: result.resumeFile,
      }))
      
      setSubmitted(true)
      toast({
        title: "Application Submitted",
        description: `Thank you for applying to ${applicationData.jobTitle || job?.title} at ${applicationData.company || job?.company}. We'll review your application and get back to you soon.`,
      });
    } catch (err) {
      console.error('Error submitting application:', err)
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred'
      setError(errorMessage)
      toast({
        title: "Application Submission Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading job details...</p>
        </div>
      </div>
    )
  }

  if (error && !job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Job Not Found</h2>
            <p className="text-gray-600 mb-4">The job you're looking for doesn't exist or has been removed.</p>
            <Button onClick={() => router.push("/")} className="bg-blue-600 hover:bg-blue-700">
              Back to Jobs
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Application Submitted!</h2>
            <p className="text-gray-600 mb-4">
              Thank you for applying to {applicationData.jobTitle || job?.title} at {applicationData.company || job?.company}. We'll review your application and get back to
              you soon.
            </p>
            <div className="space-y-2 text-sm text-gray-500">
              <p>Application ID: {applicationData.applicationId || `APP-${Date.now()}`}</p>
              <p>Job Title: {applicationData.jobTitle || job?.title}</p>
              <p>Company: {applicationData.company || job?.company}</p>
              {applicationData.resumeFilePath && (
                <p>Resume: {applicationData.resumeFilePath}</p>
              )}
              <p>Submitted: {new Date().toLocaleDateString()}</p>
            </div>
            <Button onClick={() => router.push("/")} className="bg-blue-600 hover:bg-blue-700 mt-4">
              View More Jobs
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!job) return null

  const jobTypeInfo = JOB_TYPES.find((type) => type.value === job.jobType)
  const countryInfo = COUNTRIES.find((country) => country.code === job.country)

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-4xl mx-auto px-3 md:px-4">
        {/* Simple Professional Job Description */}
        <div className="bg-transparent md:bg-white border-0 md:border border-gray-200 p-4 md:p-6 mb-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-4 md:mb-6">
            <div className="flex-1 pr-4">
              <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-1">{job.title}</h1>
              <div className="flex items-center text-gray-600 mb-1">
                <Building2 className="w-4 h-4 mr-2" />
                <span>{job.companyName || job.company}</span>
              </div>
              <div className="flex items-center text-gray-500">
                <MapPin className="w-4 h-4 mr-2" />
                <span>{job.location}</span>
              </div>
            </div>
            <div className="flex-shrink-0">
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-lg overflow-hidden border border-gray-200">
                <img 
                  src={job.companyLogo ? `${BASE_API_URL.replace('/api', '')}/${job.companyLogo}` : `${BASE_API_URL.replace('/api', '')}/public/default-company-logo.jpg`} 
                  alt={`${job.companyName} logo`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    console.log('Logo failed to load:', job.companyLogo);
                    // Fallback to Building2 icon if image fails to load
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = '<div class="w-full h-full bg-gray-200 flex items-center justify-center"><svg class="w-6 h-6 md:w-8 md:h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg></div>';
                    }
                  }}
                />
              </div>
            </div>
          </div>

          {/* Job Details */}
          <div className="border-b border-gray-200 pb-3 md:pb-4 mb-3 md:mb-4">
            <div className="flex flex-col md:flex-row md:flex-wrap gap-2 md:gap-6 text-sm">
              <div className="flex items-center">
                <IndianRupee className="w-4 h-4 text-gray-500 mr-2" />
                <span className="font-medium">
                  {job.salaryMin.toLocaleString()} - {job.salaryMax.toLocaleString()}/year
                </span>
              </div>
              <div className="flex items-center">
                <Briefcase className="w-4 h-4 text-gray-500 mr-2" />
                <span className="font-medium">{jobTypeInfo?.label}</span>
              </div>
              <div className="flex items-center">
                <Clock className="w-4 h-4 text-gray-500 mr-2" />
                <span className="font-medium">{job.experience}</span>
              </div>
            </div>
          </div>

          {/* Job Description */}
          <div className="mb-4 md:mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">Job Description</h3>
            <p className="text-gray-700 text-sm leading-relaxed">{job.description}</p>
          </div>

          {/* Requirements */}
          <div className="mb-4 md:mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">Requirements</h3>
            <ul className="text-sm text-gray-700 space-y-1">
              {job.requirements.map((req, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-gray-400 mr-2 mt-1">•</span>
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Skills */}
          <div className="mb-4 md:mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">Required Skills</h3>
            <div className="flex flex-wrap gap-2">
              {job.skills.map((skill, index) => (
                <span key={index} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">{skill}</span>
              ))}
            </div>
          </div>

          {/* Benefits */}
          {job.benefits.length > 0 && (
            <div className="mb-4 md:mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">Benefits</h3>
              <div className="flex flex-wrap gap-2">
                {job.benefits.map((benefit, index) => (
                  <span key={index} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">{benefit}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Application Form */}
        <div className="bg-transparent md:bg-white rounded-lg border-0 md:border border-gray-200 p-4 md:p-6">
          <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-4">Apply for this position</h2>
          
          <div className="bg-blue-50 border border-blue-200 p-3 md:p-4 rounded-lg mb-4 md:mb-6">
            <p className="text-sm text-blue-800">
              <strong>AI-Powered Resume Parsing:</strong> Upload your resume and we'll automatically fill in your information using AI. You can still edit any field after auto-filling.
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
            {/* Resume Upload */}
            <div>
              <Label htmlFor="resume" className="block text-sm font-medium mb-3">Resume</Label>
              {applicationData.resumeFile ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 md:p-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0">
                    <div className="flex items-center space-x-3">
                      <div className="bg-green-100 p-2 rounded-full flex-shrink-0">
                        <FileText className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">{applicationData.resumeFile.name}</p>
                        <p className="text-xs text-gray-500">{(applicationData.resumeFile.size / 1024 / 1024).toFixed(2)} MB</p>
                        {isParsing && <p className="text-xs text-blue-600 mt-1">🔄 Processing with AI...</p>}
                        {parsedData && !isParsing && <p className="text-xs text-green-600 mt-1">✅ Form auto-filled from resume</p>}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setParsedData(null)
                        setAutoFilledFields(new Set())
                        setApplicationData(prev => ({
                          ...prev,
                          resumeFile: null,
                          firstName: "",
                          lastName: "",
                          email: "",
                          phone: "",
                          currentLocation: "",
                          coverLetter: "",
                          customAnswers: {
                            keySkills: "",
                            salaryExpectation: "",
                            noticePeriod: "",
                            yearsOfExperience: "",
                            remoteWork: false,
                            startDate: "",
                            portfolioUrl: ""
                          }
                        }))
                      }}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 w-full md:w-auto"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <div 
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 md:p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
                  onClick={() => document.getElementById("resume")?.click()}
                >
                  <div className="space-y-3">
                    <div className="mx-auto w-10 h-10 md:w-12 md:h-12 bg-gray-100 rounded-full flex items-center justify-center">
                      <FileText className="w-5 h-5 md:w-6 md:h-6 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Upload your resume</p>
                      <p className="text-xs text-gray-500 mt-1 px-2">PDF, DOCX, DOC, TXT, RTF, PNG, JPG, JPEG (max 5MB)</p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isUploading || isParsing}
                      className="mt-2 w-full md:w-auto"
                    >
                      {isUploading ? "Uploading..." : isParsing ? "Parsing..." : "Choose File"}
                    </Button>
                  </div>
                  <input
                    type="file"
                    id="resume"
                    accept=".pdf,.doc,.docx,.txt,.rtf,.png,.jpg,.jpeg"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              )}
              <p className={`text-xs mt-2 ${applicationData.resumeFile ? 'text-green-600' : 'text-red-500'}`}>
                {applicationData.resumeFile ? '✓ Filled' : 'Required'}
              </p>
            </div>

            {/* Personal Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 md:mb-4">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div>
                  <Label htmlFor="firstName" className="block text-sm font-medium mb-1">First Name</Label>
                  <Input
                    id="firstName"
                    value={applicationData.firstName}
                    onChange={(e) => handleInputChange("firstName", e.target.value)}
                    placeholder="John"
                    required
                    className={getInputClassName('firstName', '')}
                  />
                                {isFieldAutoFilled('firstName') ? (
                <p className="text-xs text-green-600 mt-1">✓ Auto-filled from resume</p>
              ) : (
                <p className={`text-xs mt-1 ${applicationData.firstName.trim() ? 'text-green-600' : 'text-red-500'}`}>
                  {applicationData.firstName.trim() ? '✓ Filled' : 'Required'}
                </p>
              )}
                </div>
                <div>
                  <Label htmlFor="lastName" className="block text-sm font-medium mb-1">Last Name</Label>
                  <Input
                    id="lastName"
                    value={applicationData.lastName}
                    onChange={(e) => handleInputChange("lastName", e.target.value)}
                    placeholder="Smith"
                    required
                    className={getInputClassName('lastName', '')}
                  />
                                {isFieldAutoFilled('lastName') ? (
                <p className="text-xs text-green-600 mt-1">✓ Auto-filled from resume</p>
              ) : (
                <p className={`text-xs mt-1 ${applicationData.lastName.trim() ? 'text-green-600' : 'text-red-500'}`}>
                  {applicationData.lastName.trim() ? '✓ Filled' : 'Required'}
                </p>
              )}
                </div>
                <div>
                  <Label htmlFor="email" className="block text-sm font-medium mb-1">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={applicationData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="john.smith@email.com"
                    required
                    className={getInputClassName('email', '')}
                  />
                                {isFieldAutoFilled('email') ? (
                <p className="text-xs text-green-600 mt-1">✓ Auto-filled from resume</p>
              ) : (
                <p className={`text-xs mt-1 ${applicationData.email.trim() ? 'text-green-600' : 'text-red-500'}`}>
                  {applicationData.email.trim() ? '✓ Filled' : 'Required'}
                </p>
              )}
                </div>
                <div>
                  <Label htmlFor="phone" className="block text-sm font-medium mb-1">Phone Number</Label>
                  <Input
                    id="phone"
                    value={applicationData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    required
                    className={getInputClassName('phone', '')}
                  />
                                {isFieldAutoFilled('phone') ? (
                <p className="text-xs text-green-600 mt-1">✓ Auto-filled from resume</p>
              ) : (
                <p className={`text-xs mt-1 ${applicationData.phone.trim() ? 'text-green-600' : 'text-red-500'}`}>
                  {applicationData.phone.trim() ? '✓ Filled' : 'Required'}
                </p>
              )}
                </div>
              </div>
              <div className="mt-4">
                <Label htmlFor="currentLocation" className="block text-sm font-medium mb-1">Current Location</Label>
                <Input
                  id="currentLocation"
                  value={applicationData.currentLocation}
                  onChange={(e) => handleInputChange("currentLocation", e.target.value)}
                  placeholder="San Francisco, CA"
                  className={getInputClassName('currentLocation', '')}
                />
                              {isFieldAutoFilled('currentLocation') ? (
                <p className="text-xs text-green-600 mt-1">✓ Auto-filled from resume</p>
              ) : (
                <p className={`text-xs mt-1 ${applicationData.currentLocation.trim() ? 'text-green-600' : 'text-red-500'}`}>
                  {applicationData.currentLocation.trim() ? '✓ Filled' : 'Required'}
                </p>
              )}
              </div>
            </div>

            {/* Cover Letter */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Cover Letter</h3>
              <div>
                <Label htmlFor="coverLetter" className="block text-sm font-medium mb-1">Cover Letter Template (In professional format)</Label>
                <Textarea
                  id="coverLetter"
                  value={applicationData.coverLetter}
                  onChange={(e) => handleInputChange("coverLetter", e.target.value)}
                  placeholder="Could You Please Tell us why you are interested in this position."
                  rows={4}
                  className={getInputClassName('coverLetter', '')}
                />
                              {isFieldAutoFilled('coverLetter') ? (
                <p className="text-xs text-green-600 mt-1">✓ Auto-filled from resume</p>
              ) : (
                <p className={`text-xs mt-1 ${applicationData.coverLetter.trim() ? 'text-green-600' : 'text-red-500'}`}>
                  {applicationData.coverLetter.trim() ? '✓ Filled' : 'Required'}
                </p>
              )}
              </div>
            </div>

            {/* Custom Questions */}
            {job.customQuestions && job.customQuestions.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 md:mb-4">Additional Questions</h3>
                <div className="space-y-4 md:space-y-6">
                  {/* Group small fields (select, number, boolean) in rows */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                    {job.customQuestions
                      .filter(q => q.type === "select" || q.type === "number" || q.type === "boolean")
                      .sort((a, b) => job.customQuestions!.indexOf(a) - job.customQuestions!.indexOf(b))
                      .map((question, index) => (
                        <div key={question.id}>
                          <Label htmlFor={question.id} className="block text-sm font-medium mb-2">
                            Q{index + 1}. {question.question}
                          </Label>

                          {question.type === "number" && (
                            <div>
                              <Input
                                id={question.id}
                                type="number"
                                value={applicationData.customAnswers[question.id] || ""}
                                onChange={(e) => handleCustomAnswerChange(question.id, e.target.value)}
                                placeholder="Enter amount..."
                                required={question.required}
                                className={getInputClassName(question.id, '')}
                              />
                              {isFieldAutoFilled(question.id) ? (
                                <p className="text-xs text-green-600 mt-1">✓ Auto-filled from resume</p>
                              ) : (
                                <p className={`text-xs mt-1 ${applicationData.customAnswers[question.id] ? 'text-green-600' : 'text-red-500'}`}>
                                  {applicationData.customAnswers[question.id] ? '✓ Filled' : 'Required'}
                                </p>
                              )}
                            </div>
                          )}

                          {question.type === "select" && question.options && (
                            <div>
                              <Select
                                value={applicationData.customAnswers[question.id] || ""}
                                onValueChange={(value) => handleCustomAnswerChange(question.id, value)}
                              >
                                <SelectTrigger className={getInputClassName(question.id, '')}>
                                  <SelectValue placeholder="Select an option..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {question.options.map((option) => (
                                    <SelectItem key={option} value={option}>
                                      {option}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              {isFieldAutoFilled(question.id) ? (
                                <p className="text-xs text-green-600 mt-1">✓ Auto-filled from resume</p>
                              ) : (
                                <p className={`text-xs mt-1 ${applicationData.customAnswers[question.id] ? 'text-green-600' : 'text-red-500'}`}>
                                  {applicationData.customAnswers[question.id] ? '✓ Filled' : 'Required'}
                                </p>
                              )}
                            </div>
                          )}

                          {question.type === "boolean" && (
                            <div>
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id={question.id}
                                  checked={applicationData.customAnswers[question.id] || false}
                                  onCheckedChange={(checked) => handleCustomAnswerChange(question.id, checked)}
                                />
                                <Label htmlFor={question.id} className="text-sm">
                                  Yes
                                </Label>
                              </div>
                              {isFieldAutoFilled(question.id) ? (
                                <p className="text-xs text-green-600 mt-1">✓ Auto-filled from resume</p>
                              ) : (
                                <p className={`text-xs mt-1 ${applicationData.customAnswers[question.id] ? 'text-green-600' : (question.required ? 'text-red-500' : 'text-gray-500')}`}>
                                  {applicationData.customAnswers[question.id] ? '✓ Filled' : (question.required ? 'Required' : 'Optional')}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                    ))}
                  </div>

                  {/* Full-width text fields */}
                  {job.customQuestions
                    .filter(q => q.type === "text")
                    .sort((a, b) => job.customQuestions!.indexOf(a) - job.customQuestions!.indexOf(b))
                    .map((question, index) => {
                      const smallFieldsCount = job.customQuestions!.filter(q => q.type === "select" || q.type === "number" || q.type === "boolean").length;
                      return (
                        <div key={question.id}>
                          <Label htmlFor={question.id} className="block text-sm font-medium mb-2">
                            Q{smallFieldsCount + index + 1}. {question.question}
                          </Label>
                          <div>
                            <Input
                              id={question.id}
                              value={applicationData.customAnswers[question.id] || ""}
                              onChange={(e) => handleCustomAnswerChange(question.id, e.target.value)}
                              placeholder="Your answer..."
                              required={question.required}
                              className={getInputClassName(question.id, '')}
                            />
                            {isFieldAutoFilled(question.id) ? (
                              <p className="text-xs text-green-600 mt-1">✓ Auto-filled from resume</p>
                            ) : (
                              <p className={`text-xs mt-1 ${applicationData.customAnswers[question.id]?.toString().trim() ? 'text-green-600' : 'text-red-500'}`}>
                                {applicationData.customAnswers[question.id]?.toString().trim() ? '✓ Filled' : 'Required'}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 p-4 rounded-lg mb-4">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="text-red-800 font-semibold text-sm mb-1">
                      {error.includes("Missing required fields") ? "Missing Required Fields" : "Application Submission Failed"}
                    </h3>
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="bg-blue-600 hover:bg-blue-700">
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  "Submit Application"
                )}
              </Button>
            </div>

            {/* Validation Message at Bottom */}
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-amber-800 text-sm font-medium">Important:</p>
                  <p className="text-amber-700 text-sm">Please ensure all required fields are filled before submitting your application.</p>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Source Tracking Info */}
        {applicationData.utmSource && (
          <div className="mt-4 text-xs text-gray-500">
            <p>Application source: {applicationData.utmSource}</p>
            {applicationData.utmMedium && <p>Medium: {applicationData.utmMedium}</p>}
            {applicationData.utmCampaign && <p>Campaign: {applicationData.utmCampaign}</p>}
          </div>
        )}
      </div>
    </div>
  )
}
