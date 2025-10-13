"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Textarea } from "../../components/ui/textarea"
import { Badge } from "../../components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog"
import {
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Edit3,
  Save,
  X,
} from "lucide-react"
import { JOB_TYPES, getCurrencyByCountry } from "../../lib/location-data"

interface JobPostingData {
  title: string
  company: string
  location: string
  country: string
  city: string
  jobType: string
  salaryMin: string
  salaryMax: string
  description: string
  requirements: string
  skills: string
  experience: string
  priority: string
  internalSPOC: string
  recruiter: string
  email: string
  department: string
  remote: boolean
  benefits: string
  workType: string
  jobStatus: string
}

interface ViewFinalizeJobPostingProps {
  isOpen: boolean
  onClose: () => void
  onBack: (updatedData: JobPostingData) => void
  onFinalize: (finalizedData: JobPostingData) => void
  jobData: JobPostingData
  isFinalizing: boolean
}

export default function ViewFinalizeJobPosting({
  isOpen,
  onClose,
  onBack,
  onFinalize,
  jobData,
  isFinalizing,
}: ViewFinalizeJobPostingProps) {
  const [editableData, setEditableData] = useState<JobPostingData>(jobData)
  const [editingField, setEditingField] = useState<string | null>(null)
  const [editValue, setEditValue] = useState("")
  const [hasChanges, setHasChanges] = useState(false)
  const [jobPosted, setJobPosted] = useState(false)

  // Update editable data when jobData changes
  useEffect(() => {
    setEditableData(jobData)
    setHasChanges(false)
    setEditingField(null)
    setEditValue("")
    setJobPosted(false)
  }, [jobData])

  // Auto-close dialog when job posting is complete
  useEffect(() => {
    if (!isFinalizing && jobPosted) {
      // Job posting completed, close the dialog immediately
      onClose()
    }
  }, [isFinalizing, jobPosted, onClose])

  // Reset jobPosted state when dialog opens/closes
  useEffect(() => {
    if (!isOpen) {
      setJobPosted(false)
      setEditingField(null)
      setEditValue("")
      setHasChanges(false)
    }
  }, [isOpen])

  // Check if all required fields are filled
  const isFormComplete = () => {
    const requiredFields = [
      'title', 'company', 'department', 'internalSPOC', 'recruiter', 'email',
      'jobType', 'experience', 'country', 'city', 'location', 'workType',
      'jobStatus', 'salaryMin', 'salaryMax', 'priority', 'description',
      'requirements', 'skills', 'benefits', 'remote'
    ]
    
    return requiredFields.every(field => {
      const value = editableData[field as keyof JobPostingData]
      if (field === 'remote') {
        return typeof value === 'boolean'
      }
      return value && value.toString().trim().length > 0
    })
  }

  // Start editing a field
  const startEditing = (field: string, value: any) => {
    setEditingField(field)
    setEditValue(value?.toString() || "")
  }

  // Save the edited value
  const saveEdit = () => {
    if (editingField) {
      let finalValue: any = editValue
      
      // Handle special cases
      if (editingField === 'remote') {
        finalValue = editValue.toLowerCase() === 'true' || editValue.toLowerCase() === 'yes' || editValue === '1'
      }
      
      setEditableData(prev => ({ 
        ...prev, 
        [editingField]: finalValue
      }))
      setHasChanges(true)
      setEditingField(null)
      setEditValue("")
    }
  }

  // Cancel editing
  const cancelEdit = () => {
    setEditingField(null)
    setEditValue("")
  }

  // Handle field click to make editable
  const handleFieldClick = (field: string, value: any) => {
    if (editingField !== field) {
      startEditing(field, value)
    }
  }

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-100 text-red-800 border-red-200"
      case "high": return "bg-orange-100 text-orange-800 border-orange-200"
      case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "low": return "bg-green-100 text-green-800 border-green-200"
      default: return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  // Get job type color
  const getJobTypeColor = (jobType: string) => {
    switch (jobType) {
      case "full-time": return "bg-blue-100 text-blue-800 border-blue-200"
      case "part-time": return "bg-purple-100 text-purple-800 border-purple-200"
      case "contract": return "bg-orange-100 text-orange-800 border-orange-200"
      case "freelance": return "bg-green-100 text-green-800 border-green-200"
      case "internship": return "bg-pink-100 text-pink-800 border-pink-200"
      case "temporary": return "bg-gray-100 text-gray-800 border-gray-200"
      default: return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  // Get work type color
  const getWorkTypeColor = (workType: string) => {
    switch (workType) {
      case "ONSITE": return "bg-blue-100 text-blue-800 border-blue-200"
      case "REMOTE": return "bg-green-100 text-green-800 border-green-200"
      case "HYBRID": return "bg-purple-100 text-purple-800 border-purple-200"
      default: return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE": return "bg-green-100 text-green-800 border-green-200"
      case "PAUSED": return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "CLOSED": return "bg-red-100 text-red-800 border-red-200"
      case "FILLED": return "bg-blue-100 text-blue-800 border-blue-200"
      default: return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  // Format currency
  const formatCurrency = (amount: string, country: string) => {
    const currency = getCurrencyByCountry(country)
    return `${currency.symbol}${parseInt(amount).toLocaleString()}`
  }

  // Render field value with edit functionality
  const renderField = (label: string, field: keyof JobPostingData, value: any, isRequired: boolean = false) => {
    const isEditing = editingField === field
    
    return (
      <div className="flex items-start space-x-3 py-3 border-b border-gray-100">
        <div className="w-32 flex-shrink-0">
          <span className="text-sm font-medium text-gray-600">
            {label} {isRequired && <span className="text-red-500">*</span>}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="flex items-center space-x-2">
              <Textarea
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="min-h-[60px] resize-none"
                autoFocus
              />
              <div className="flex flex-col space-y-1">
                <Button
                  size="sm"
                  onClick={saveEdit}
                  className="h-8 w-8 p-0 bg-green-600 hover:bg-green-700"
                >
                  <Save className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={cancelEdit}
                  className="h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div 
              className="group cursor-pointer hover:bg-gray-50 p-2 rounded-md transition-colors"
              onClick={() => handleFieldClick(field, value)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  {field === 'remote' ? (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {value ? 'Yes' : 'No'}
                    </span>
                  ) : field === 'priority' ? (
                    <Badge className={getPriorityColor(value)} variant="outline">
                      {value}
                    </Badge>
                  ) : field === 'jobType' ? (
                    <Badge className={getJobTypeColor(value)} variant="outline">
                      {JOB_TYPES.find(t => t.value === value)?.label || value}
                    </Badge>
                  ) : field === 'workType' ? (
                    <Badge className={getWorkTypeColor(value)} variant="outline">
                      {value}
                    </Badge>
                  ) : field === 'jobStatus' ? (
                    <Badge className={getStatusColor(value)} variant="outline">
                      {value}
                    </Badge>
                  ) : field === 'salaryMin' || field === 'salaryMax' ? (
                    <span className="text-gray-900">
                      {formatCurrency(value, editableData.country)}
                    </span>
                  ) : (
                    <span className="text-gray-900 break-words">
                      {value?.toString() || '-'}
                    </span>
                  )}
                </div>
                <Edit3 className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold text-gray-900">
                Review & Finalize Job Posting
              </DialogTitle>
              <DialogDescription className="text-gray-600 mt-2">
                Click on any field to edit. All fields must be completed before posting.
              </DialogDescription>
            </div>
            <div className="flex items-center space-x-2">
              {isFormComplete() && (
                <div className="flex items-center space-x-2 text-green-600">
                  <CheckCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">Ready to Post</span>
                </div>
              )}
              {!isFormComplete() && (
                <div className="flex items-center space-x-2 text-amber-600">
                  <AlertCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">Complete Required Fields</span>
                </div>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="py-4">
          {/* Single Card with All Data */}
          <Card className="w-full">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200">
              <CardTitle className="text-lg text-blue-900">
                Job Posting Details
              </CardTitle>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    {Object.keys(editableData).filter(key => {
                      const value = editableData[key as keyof JobPostingData];
                      if (key === 'remote') {
                        return typeof value === 'boolean';
                      }
                      return value && value.toString().trim().length > 0;
                    }).length} / {Object.keys(editableData).length} Fields Filled
                  </Badge>
                  {hasChanges && (
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                      Unsaved Changes
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-1">
                {/* Basic Information */}
                <div className="mb-6">
                  <h3 className="text-md font-semibold text-gray-800 mb-3 pb-2 border-b border-gray-200">
                    Basic Information
                  </h3>
                  {renderField("Job Title", "title", editableData.title, true)}
                  {renderField("Company", "company", editableData.company, true)}
                  {renderField("Department", "department", editableData.department, true)}
                  {renderField("Job Type", "jobType", editableData.jobType, true)}
                  {renderField("Work Type", "workType", editableData.workType, true)}
                  {renderField("Remote", "remote", editableData.remote, true)}
                  {renderField("Job Status", "jobStatus", editableData.jobStatus, true)}
                  {renderField("Priority", "priority", editableData.priority, true)}
                </div>

                {/* Location Information */}
                <div className="mb-6">
                  <h3 className="text-md font-semibold text-gray-800 mb-3 pb-2 border-b border-gray-200">
                    Location Information
                  </h3>
                  {renderField("Country", "country", editableData.country, true)}
                  {renderField("City", "city", editableData.city, true)}
                  {renderField("Location", "location", editableData.location, true)}
                </div>

                {/* Contact Information */}
                <div className="mb-6">
                  <h3 className="text-md font-semibold text-gray-800 mb-3 pb-2 border-b border-gray-200">
                    Contact Information
                  </h3>
                  {renderField("Email", "email", editableData.email, true)}
                  {renderField("Internal SPOC", "internalSPOC", editableData.internalSPOC, true)}
                  {renderField("Recruiter", "recruiter", editableData.recruiter, true)}
                </div>

                {/* Job Details */}
                <div className="mb-6">
                  <h3 className="text-md font-semibold text-gray-800 mb-3 pb-2 border-b border-gray-200">
                    Job Details
                  </h3>
                  {renderField("Experience", "experience", editableData.experience, true)}
                  {renderField("Description", "description", editableData.description, true)}
                  {renderField("Requirements", "requirements", editableData.requirements, true)}
                  {renderField("Skills", "skills", editableData.skills, true)}
                  {renderField("Benefits", "benefits", editableData.benefits, true)}
                </div>

                {/* Salary Information */}
                <div className="mb-6">
                  <h3 className="text-md font-semibold text-gray-800 mb-3 pb-2 border-b border-gray-200">
                    Salary Information
                  </h3>
                  {renderField("Min Salary", "salaryMin", editableData.salaryMin, true)}
                  {renderField("Max Salary", "salaryMax", editableData.salaryMax, true)}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={() => onBack(editableData)}
            className="flex items-center space-x-2 text-gray-600 border-gray-300 hover:bg-gray-50"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Form</span>
          </Button>

          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="text-gray-600 border-gray-300 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setJobPosted(true)
                onFinalize(editableData)
              }}
              disabled={!isFormComplete() || isFinalizing}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isFinalizing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating Job...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Create Job Posting
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
