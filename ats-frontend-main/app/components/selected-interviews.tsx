"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Badge } from "../../components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar"
import {
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Mail,
  Building,
  IndianRupee,
  Briefcase,
  GraduationCap,
  Phone as PhoneIcon,
  Mail as MailIcon,
  MapPin as MapPinIcon,
} from "lucide-react"
import BASE_API_URL from "../../BaseUrlApi"

interface Candidate {
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
}

interface SelectedInterviewsData {
  success: boolean
  totalCandidates: number
  candidates: Candidate[]
  stageCounts: {
    [key: string]: number
  }
}

export default function SelectedInterviews() {
  const [data, setData] = useState<SelectedInterviewsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const response = await fetch(`${BASE_API_URL}/interviews/selected`)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const result = await response.json()
        setData(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch data")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const getStageColor = (stage: string) => {
    switch (stage) {
      case "First Interview":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "Second Interview":
        return "bg-purple-100 text-purple-800 border-purple-200"
      case "Final Interview":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getExperienceColor = (experience: string) => {
    if (experience.includes("0-1")) return "bg-red-100 text-red-800"
    if (experience.includes("2-3")) return "bg-yellow-100 text-yellow-800"
    if (experience.includes("4-5")) return "bg-blue-100 text-blue-800"
    if (experience.includes("5+")) return "bg-green-100 text-green-800"
    return "bg-gray-100 text-gray-800"
  }

  const formatSalary = (salary: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
              currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(salary)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Loading selected interviews...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Data</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button onClick={() => window.location.reload()} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            <RefreshCw className="w-4 h-4 mr-2 inline" />
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Data Available</h3>
          <p className="text-gray-600">No selected interviews data found.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Simple Header */}
      <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 rounded-xl p-6 border border-blue-100">
        <div className="text-center">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Selected Interviews
          </h2>
          <p className="text-gray-600 mt-2">Overview of candidates selected for interviews</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-all duration-200 hover:scale-105">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Total Candidates</p>
                <p className="text-3xl font-bold text-blue-900">{data.totalCandidates}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-all duration-200 hover:scale-105">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700">First Interview</p>
                <p className="text-3xl font-bold text-purple-900">{data.stageCounts["First Interview"] || 0}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <CheckCircle className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-all duration-200 hover:scale-105">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Second Interview</p>
                <p className="text-3xl font-bold text-green-900">{data.stageCounts["Second Interview"] || 0}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-lg transition-all duration-200 hover:scale-105">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700">Final Interview</p>
                <p className="text-3xl font-bold text-orange-900">{data.stageCounts["Final Interview"] || 0}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <CheckCircle className="w-8 h-8 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200 hover:shadow-lg transition-all duration-200 hover:scale-105">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-indigo-700">Avg Salary</p>
                <p className="text-3xl font-bold text-indigo-900">
                  {formatSalary(
                    data.candidates.reduce((sum, candidate) => sum + candidate.expectedSalary, 0) / data.candidates.length
                  )}
                </p>
              </div>
              <div className="p-3 bg-indigo-100 rounded-full">
                <IndianRupee className="w-8 h-8 text-indigo-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Candidates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.candidates.map((candidate) => (
          <Card key={candidate.id} className="hover:shadow-xl transition-all duration-300 hover:scale-105 bg-gradient-to-br from-white to-gray-50 border-gray-200">
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-3">
                <Avatar className="w-14 h-14 ring-2 ring-blue-100">
                  <AvatarImage src={`/placeholder-user.jpg`} />
                  <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold">
                    {candidate.name.split(" ").map(n => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-xl font-bold text-gray-900">{candidate.name}</CardTitle>
                  <div className="flex items-center space-x-2 mt-2">
                    <Badge className={`${getStageColor(candidate.interviewStage)} font-medium`}>
                      {candidate.interviewStage}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Contact Info */}
              <div className="space-y-3 p-4 bg-blue-50/50 rounded-lg">
                <div className="flex items-center space-x-2 text-sm text-gray-700">
                  <MailIcon className="w-4 h-4 text-blue-600" />
                  <span className="font-medium">{candidate.email}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-700">
                  <PhoneIcon className="w-4 h-4 text-blue-600" />
                  <span className="font-medium">{candidate.phone}</span>
                </div>
              </div>

              {/* Job Info */}
              <div className="space-y-3 p-4 bg-green-50/50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Briefcase className="w-4 h-4 text-green-600" />
                  <span className="font-semibold text-gray-900">{candidate.job.title}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-700">
                  <Building className="w-4 h-4 text-green-600" />
                  <span className="font-medium">{candidate.job.company}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-700">
                  <MapPinIcon className="w-4 h-4 text-green-600" />
                  <span className="font-medium">{candidate.job.location}</span>
                </div>
              </div>

              {/* Skills */}
              <div className="space-y-3 p-4 bg-purple-50/50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <GraduationCap className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-semibold text-gray-900">Skills</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {candidate.skills.split(" ").map((skill, index) => (
                    <Badge key={index} variant="outline" className="text-xs bg-white/80 border-purple-200 text-purple-700">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Experience and Salary */}
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50/50 to-yellow-50/50 rounded-lg">
                <Badge className={`${getExperienceColor(candidate.experience)} font-medium`}>
                  {candidate.experience}
                </Badge>
                <div className="text-right">
                  <div className="text-sm text-gray-600 font-medium">Expected Salary</div>
                  <div className="font-bold text-lg text-green-600">{formatSalary(candidate.expectedSalary)}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {data.candidates.length === 0 && (
        <Card className="bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="p-4 bg-blue-100 rounded-full mb-4">
              <Users className="w-12 h-12 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No candidates found</h3>
            <p className="text-gray-600 text-center max-w-md">
              No candidates are currently selected for interviews.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 