"use client"

import React, { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs"
import { Badge } from "../../components/ui/badge"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { 
  Brain, 
  Target, 
  Users, 
  Briefcase, 
  TrendingUp, 
  Zap,
  CheckCircle,
  Building,
  MapPin,
  Calendar,
  Clock,
  XCircle,
  Eye
} from "lucide-react"


import CandidateMatching from "@/app/components/ai-recruitment/CandidateMatching"

interface JobPost {
  id: string
  title: string
  company: string
  location: string
  status: "active" | "paused" | "closed"
  applicants: number
  matchRate: number
  priority: "high" | "medium" | "low"
  lastUpdated: string
  aiScore: number
  matchedCandidates: number
}

interface Candidate {
  id: string
  name: string
  jobTitle: string
  matchScore: number
  reviewStatus?: string
  failureReason?: string
}

export default function AIRecruitmentPlanning() {
  const [activeTab, setActiveTab] = useState("overview")
  const [selectedFailedCandidates, setSelectedFailedCandidates] = useState<Set<string>>(new Set())
  const [selectedCardType, setSelectedCardType] = useState<"matched" | "review" | "failed" | null>("failed")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  // Mock data for demonstration with stable values
  const mockJobs: JobPost[] = Array.from({ length: 1000 }, (_, i) => {
    // Use deterministic values to prevent hydration mismatch
    const getStableRandom = (seed: number, min: number, max: number) => {
      const x = Math.sin(seed) * 10000
      return Math.floor((x - Math.floor(x)) * (max - min + 1)) + min
    }
    
    return {
      id: `job-${i + 1}`,
      title: `Senior ${["Developer", "Designer", "Manager", "Analyst", "Engineer"][i % 5]} - ${["React", "Python", "UX", "Product", "Data"][i % 5]}`,
      company: `Company ${Math.floor(i / 10) + 1}`,
      location: ["Remote", "New York", "San Francisco", "London", "Berlin", "Toronto", "Sydney", "Singapore", "Dubai", "Mumbai", "Tokyo", "Paris", "Amsterdam", "Stockholm", "Melbourne"][i % 15],
      status: ["active", "paused", "closed"][i % 3] as JobPost["status"],
      applicants: getStableRandom(i + 1000, 100, 2100),
      matchRate: getStableRandom(i + 2000, 60, 100),
      priority: ["high", "medium", "low"][i % 3] as JobPost["priority"],
      lastUpdated: new Date(Date.now() - getStableRandom(i + 3000, 0, 30) * 24 * 60 * 60 * 1000).toISOString(),
      aiScore: getStableRandom(i + 4000, 60, 100),
      matchedCandidates: getStableRandom(i + 5000, 50, 550)
    }
  })

  // Mock candidate data
  const mockMatchedCandidates: Candidate[] = [
    { id: "1", name: "Sarah Johnson", jobTitle: "Senior React Developer", matchScore: 95 },
    { id: "2", name: "Michael Chen", jobTitle: "UX Designer", matchScore: 92 },
    { id: "3", name: "Emily Rodriguez", jobTitle: "Product Manager", matchScore: 89 },
    { id: "4", name: "David Kim", jobTitle: "Data Analyst", matchScore: 87 },
    { id: "5", name: "Lisa Wang", jobTitle: "Backend Engineer", matchScore: 85 }
  ]

  const mockReviewCandidates: Candidate[] = [
    { id: "6", name: "Alex Thompson", jobTitle: "Frontend Developer", matchScore: 78, reviewStatus: "Technical Review" },
    { id: "7", name: "Maria Garcia", jobTitle: "DevOps Engineer", matchScore: 75, reviewStatus: "Background Check" },
    { id: "8", name: "James Wilson", jobTitle: "QA Engineer", matchScore: 72, reviewStatus: "Reference Check" },
    { id: "9", name: "Sophie Brown", jobTitle: "UI Designer", matchScore: 70, reviewStatus: "Portfolio Review" },
    { id: "10", name: "Ryan Davis", jobTitle: "Full Stack Developer", matchScore: 68, reviewStatus: "Code Review" }
  ]

  const mockFailedCandidates: Candidate[] = [
    { id: "11", name: "Tom Anderson", jobTitle: "Software Engineer", matchScore: 45, failureReason: "Skills mismatch" },
    { id: "12", name: "Jessica Lee", jobTitle: "Designer", matchScore: 42, failureReason: "Experience gap" },
    { id: "13", name: "Kevin Zhang", jobTitle: "Analyst", matchScore: 38, failureReason: "Location constraint" },
    { id: "14", name: "Amanda White", jobTitle: "Developer", matchScore: 35, failureReason: "Salary expectation" },
    { id: "15", name: "Chris Martin", jobTitle: "Manager", matchScore: 32, failureReason: "Cultural fit" }
  ]

  const [jobs] = useState<JobPost[]>(mockJobs)

  // Handler functions
  const handleSelectAllFailed = () => {
    if (selectedFailedCandidates.size === mockFailedCandidates.length) {
      setSelectedFailedCandidates(new Set())
    } else {
      setSelectedFailedCandidates(new Set(mockFailedCandidates.map(c => c.id)))
    }
  }

  const handleFailedCandidateSelection = (candidateId: string) => {
    const newSelected = new Set(selectedFailedCandidates)
    if (newSelected.has(candidateId)) {
      newSelected.delete(candidateId)
    } else {
      newSelected.add(candidateId)
    }
    setSelectedFailedCandidates(newSelected)
  }

  const handleSubmitProcess = () => {
    // Handle reprocessing of selected failed candidates
    console.log("Reprocessing candidates:", Array.from(selectedFailedCandidates))
    // Reset selection after processing
    setSelectedFailedCandidates(new Set())
  }

  const handleCardClick = (cardType: "matched" | "review" | "failed") => {
    setSelectedCardType(cardType)
    setCurrentPage(1) // Reset to first page when switching card types
  }

  const getCurrentData = () => {
    switch (selectedCardType) {
      case "matched":
        return mockMatchedCandidates
      case "review":
        return mockReviewCandidates
      case "failed":
        return mockFailedCandidates
      default:
        return mockFailedCandidates
    }
  }

  const getTotalPages = () => {
    const data = getCurrentData()
    return Math.ceil(data.length / itemsPerPage)
  }

  const getPaginatedData = () => {
    const data = getCurrentData()
    const startIndex = (currentPage - 1) * itemsPerPage
    return data.slice(startIndex, startIndex + itemsPerPage)
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Brain className="h-8 w-8 text-blue-600" />
              AI Recruitment
            </h1>
            <p className="text-gray-600 mt-2">
              Intelligent candidate matching for active jobs
            </p>
          </div>
        </div>

        {/* Main Content Tabs */}
        <Card className="bg-white shadow-sm border-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <CardHeader className="pb-0">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="overview" className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="matched" className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Matched Candidates
                </TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent className="pt-6">
                             {/* Overview Tab */}
               <TabsContent value="overview" className="space-y-6">
                                   {/* Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Total Jobs Card */}
                    <Card className="bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-50 border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="space-y-2">
                            <p className="text-sm font-semibold text-blue-700 uppercase tracking-wide">Total Jobs</p>
                            <p className="text-3xl font-bold text-blue-900">{jobs.length.toLocaleString()}</p>
                            <p className="text-xs text-blue-600">Available positions</p>
                          </div>
                          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                            <Briefcase className="h-8 w-8 text-white" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Active Positions Card */}
                    <Card className="bg-gradient-to-br from-green-50 via-emerald-100 to-teal-50 border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="space-y-2">
                            <p className="text-sm font-semibold text-green-700 uppercase tracking-wide">Active Positions</p>
                            <p className="text-3xl font-bold text-green-900">
                              {jobs.filter(j => j.status === "active").length.toLocaleString()}
                            </p>
                            <p className="text-xs text-green-600">Currently hiring</p>
                          </div>
                          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
                            <Target className="h-8 w-8 text-white" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Total Applicants Card */}
                    <Card className="bg-gradient-to-br from-purple-50 via-violet-100 to-fuchsia-50 border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="space-y-2">
                            <p className="text-sm font-semibold text-purple-700 uppercase tracking-wide">Total Applicants</p>
                            <p className="text-3xl font-bold text-purple-900">
                              {jobs.reduce((sum, job) => sum + job.applicants, 0).toLocaleString()}
                            </p>
                            <p className="text-xs text-purple-600">Active candidates</p>
                          </div>
                          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-violet-600 rounded-full flex items-center justify-center shadow-lg">
                            <Users className="h-8 w-8 text-white" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                                   {/* Candidate Processing Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Proceed Matched Card */}
                    <Card className={`bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer ${selectedCardType === "matched" ? "ring-4 ring-green-300" : ""}`} onClick={() => handleCardClick("matched")}>
                      <CardContent className="p-6">
                        <div className="text-center space-y-4">
                          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                            <CheckCircle className="h-8 w-8 text-green-600" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-green-800">Proceed Matched</h3>
                            <p className="text-3xl font-bold text-green-700">
                              {jobs.reduce((sum, job) => sum + job.matchedCandidates, 0).toLocaleString()}
                            </p>
                            <p className="text-sm text-green-600 mt-1">Ready for next stage</p>
                          </div>
                          <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Processing Under Review Card */}
                    <Card className={`bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer ${selectedCardType === "review" ? "ring-4 ring-blue-300" : ""}`} onClick={() => handleCardClick("review")}>
                      <CardContent className="p-6">
                        <div className="text-center space-y-4">
                          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                            <Clock className="h-8 w-8 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-blue-800">Under Review</h3>
                            <p className="text-3xl font-bold text-blue-700">
                              {Math.floor(jobs.reduce((sum, job) => sum + job.matchedCandidates, 0) * 0.3).toLocaleString()}
                            </p>
                            <p className="text-sm text-blue-600 mt-1">Currently being evaluated</p>
                          </div>
                          <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Failed Candidates Card */}
                    <Card className={`bg-gradient-to-br from-red-50 to-pink-50 border-red-200 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer ${selectedCardType === "failed" ? "ring-4 ring-red-300" : ""}`} onClick={() => handleCardClick("failed")}>
                      <CardContent className="p-6">
                        <div className="text-center space-y-4">
                          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                            <XCircle className="h-8 w-8 text-red-600" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-red-800">Failed</h3>
                            <p className="text-3xl font-bold text-red-700">
                              {Math.floor(jobs.reduce((sum, job) => sum + job.matchedCandidates, 0) * 0.15).toLocaleString()}
                            </p>
                            <p className="text-sm text-red-600 mt-1">Need reprocessing</p>
                          </div>
                          <Button className="w-full bg-red-600 hover:bg-red-700 text-white">
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Dynamic Candidate Details Section */}
                  <Card className="bg-white shadow-sm border-0">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          {selectedCardType === "matched" && (
                            <>
                              <CardTitle className="flex items-center gap-2 text-green-700">
                                <CheckCircle className="h-5 w-5" />
                                Proceed Matched Candidates - Ready for Next Stage
                              </CardTitle>
                              <CardDescription>
                                Candidates that are ready to proceed to the next recruitment stage
                              </CardDescription>
                            </>
                          )}
                          {selectedCardType === "review" && (
                            <>
                              <CardTitle className="flex items-center gap-2 text-blue-700">
                                <Clock className="h-5 w-5" />
                                Under Review Candidates - Currently Being Evaluated
                              </CardTitle>
                              <CardDescription>
                                Candidates currently under review and assessment
                              </CardDescription>
                            </>
                          )}
                          {selectedCardType === "failed" && (
                            <>
                              <CardTitle className="flex items-center gap-2 text-red-700">
                                <XCircle className="h-5 w-5" />
                                Failed Candidates - Resume Review Required
                              </CardTitle>
                              <CardDescription>
                                Candidates that failed initial processing and need manual review
                              </CardDescription>
                            </>
                          )}
                        </div>
                        {selectedCardType === "failed" && (
                          <div className="flex items-center gap-3">
                            <Button 
                              variant="outline" 
                              onClick={handleSelectAllFailed}
                              className="border-red-200 text-red-700 hover:bg-red-50"
                            >
                              {selectedFailedCandidates.size === mockFailedCandidates.length ? "Deselect All" : "Select All"}
                            </Button>
                            {selectedFailedCandidates.size > 0 && (
                              <Button 
                                onClick={handleSubmitProcess}
                                className="bg-red-600 hover:bg-red-700 text-white"
                              >
                                <Zap className="h-4 w-4 mr-2" />
                                Reprocess ({selectedFailedCandidates.size})
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {getPaginatedData().map((candidate) => {
                          const isMatched = selectedCardType === "matched"
                          const isReview = selectedCardType === "review"
                          const isFailed = selectedCardType === "failed"
                          
                          return (
                            <div key={candidate.id} className={`flex items-center justify-between p-4 rounded-lg border ${
                              isMatched ? "bg-green-50 border-green-200" :
                              isReview ? "bg-blue-50 border-blue-200" :
                              "bg-red-50 border-red-200"
                            }`}>
                              <div className="flex items-center gap-4">
                                {isFailed && (
                                  <input
                                    type="checkbox"
                                    checked={selectedFailedCandidates.has(candidate.id)}
                                    onChange={() => handleFailedCandidateSelection(candidate.id)}
                                    className="rounded border-red-300 text-red-600 focus:ring-red-500"
                                  />
                                )}
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                                  isMatched ? "bg-green-100" :
                                  isReview ? "bg-blue-100" :
                                  "bg-red-100"
                                }`}>
                                  <span className={`text-sm font-semibold ${
                                    isMatched ? "text-green-600" :
                                    isReview ? "text-blue-600" :
                                    "text-red-600"
                                  }`}>
                                    {candidate.name.charAt(0)}
                                  </span>
                                </div>
                                <div>
                                  <h4 className="font-medium text-gray-900">{candidate.name}</h4>
                                  <p className="text-sm text-gray-600">{candidate.jobTitle}</p>
                                  {isMatched && (
                                    <p className="text-xs text-green-600">{candidate.matchScore}% Match</p>
                                  )}
                                  {isReview && (
                                    <p className="text-xs text-blue-600">Status: {candidate.reviewStatus}</p>
                                  )}
                                  {isFailed && (
                                    <p className="text-xs text-red-600">Failed: {candidate.failureReason}</p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" className={`${
                                  isMatched ? "border-green-200 text-green-700 hover:bg-green-50" :
                                  isReview ? "border-blue-200 text-blue-700 hover:bg-blue-50" :
                                  "border-red-200 text-red-700 hover:bg-red-50"
                                }`}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  {isMatched ? "View Profile" : isReview ? "View Profile" : "View Resume"}
                                </Button>
                                <Button size="sm" className={`${
                                  isMatched ? "bg-green-600 hover:bg-green-700" :
                                  isReview ? "bg-blue-600 hover:bg-blue-700" :
                                  "bg-red-600 hover:bg-red-700"
                                } text-white`}>
                                  {isMatched ? (
                                    <>
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Proceed
                                    </>
                                  ) : isReview ? (
                                    <>
                                      <Clock className="h-4 w-4 mr-2" />
                                      Continue Review
                                    </>
                                  ) : (
                                    <>
                                      <Zap className="h-4 w-4 mr-2" />
                                      Reprocess
                                    </>
                                  )}
                                </Button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                      
                      {/* Pagination */}
                      {getTotalPages() > 1 && (
                        <div className="flex items-center justify-between mt-6">
                          <div className="text-sm text-gray-600">
                            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, getCurrentData().length)} of {getCurrentData().length} candidates
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                              disabled={currentPage === 1}
                              className="px-3 py-1"
                            >
                              Previous
                            </Button>
                            <div className="flex items-center gap-1">
                              {Array.from({ length: getTotalPages() }, (_, i) => i + 1).map((page) => (
                                                                 <Button
                                   key={page}
                                   variant={currentPage === page ? "default" : "outline"}
                                   size="sm"
                                   onClick={() => setCurrentPage(page)}
                                   className="px-3 py-1 min-w-[40px]"
                                 >
                                   {page}
                                 </Button>
                              ))}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentPage(prev => Math.min(prev + 1, getTotalPages()))}
                              disabled={currentPage === getTotalPages()}
                              className="px-3 py-1"
                            >
                              Next
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>



                
              </TabsContent>

                             {/* Matched Candidates Tab */}
               <TabsContent value="matched" className="space-y-6">
                 <CandidateMatching jobs={jobs} />
               </TabsContent>


            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  )
}
