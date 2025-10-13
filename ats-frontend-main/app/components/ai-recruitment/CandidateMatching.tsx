"use client"

import React, { useState, useEffect, useMemo, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Badge } from "../../components/ui/badge"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Progress } from "../../components/ui/progress"
import { ScrollArea } from "../../components/ui/scroll-area"
import { 
  Target, 
  Users, 
  Star, 
  CheckCircle, 
  XCircle, 
  Clock,
  Zap,
  Filter,
  Search,
  Eye,
  MessageSquare,
  TrendingUp,
  Award,
  Briefcase,
  MapPin,
  GraduationCap,
  Brain,
  CheckSquare,
  Square
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table"


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
  email: string
  avatar?: string
  skills: string[]
  experience: number
  education: string
  location: string
  matchScore: number
  status: "screening" | "interview" | "offer" | "hired" | "rejected"
  appliedDate: string
  lastContact: string
  jobTitle: string
  company: string
  aiInsights: {
    skillMatch: number
    experienceMatch: number
    cultureFit: number
    growthPotential: number
  }
}

interface CandidateMatchingProps {
  jobs: JobPost[]
}

export default function CandidateMatching({ jobs }: CandidateMatchingProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedJobFilter, setSelectedJobFilter] = useState<string>("all")
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState<string>("all")
  const [matchScoreFilter, setMatchScoreFilter] = useState<string>("all")
  const [selectedCandidates, setSelectedCandidates] = useState<Set<string>>(new Set())
  const [bulkPipelineStatus, setBulkPipelineStatus] = useState<string>("")
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Mock candidates data - simulating 2000 candidates per job (optimized)
  const generateMockCandidates = (): Candidate[] => {
    const skills = ["React", "Python", "JavaScript", "Java", "SQL", "AWS", "Docker", "Kubernetes", "Machine Learning", "UI/UX"]
    const locations = ["Remote", "New York", "San Francisco", "London", "Berlin", "Toronto", "Sydney", "Singapore", "Dubai", "Mumbai", "Tokyo", "Paris", "Amsterdam", "Stockholm", "Melbourne"]
    const education = ["Bachelor's", "Master's", "PhD", "Bootcamp", "Self-taught"]
    const pipelineStatuses = ["screening", "interview", "offer", "hired", "rejected"]
    
    const allCandidates: Candidate[] = []
    
    // Limit to first 10 jobs for better performance
    const limitedJobs = jobs.slice(0, 10)
    
    // Use deterministic values to prevent hydration mismatch
    const getStableRandom = (seed: number, min: number, max: number) => {
      const x = Math.sin(seed) * 10000
      return Math.floor((x - Math.floor(x)) * (max - min + 1)) + min
    }
    
    limitedJobs.forEach((job, jobIndex) => {
      // Reduce candidates per job from 2000 to 200 for better performance
      const candidateCount = getStableRandom(jobIndex + 100, 50, 200)
      const candidatesForJob = Array.from({ length: candidateCount }, (_, i) => {
        const candidateSeed = jobIndex * 200 + i + 1000
        return {
          id: `candidate-${job.id}-${i + 1}`,
          name: `Candidate ${jobIndex * 200 + i + 1}`,
          email: `candidate${jobIndex * 200 + i + 1}@example.com`,
          skills: skills.slice(0, getStableRandom(candidateSeed + 1, 2, 8)),
          experience: getStableRandom(candidateSeed + 2, 1, 16),
          education: education[getStableRandom(candidateSeed + 3, 0, education.length - 1)],
          location: locations[getStableRandom(candidateSeed + 4, 0, locations.length - 1)],
          matchScore: getStableRandom(candidateSeed + 5, 50, 100), // 50-100% match
          status: pipelineStatuses[getStableRandom(candidateSeed + 6, 0, pipelineStatuses.length - 1)] as Candidate["status"],
          appliedDate: new Date(Date.now() - getStableRandom(candidateSeed + 7, 0, 30) * 24 * 60 * 60 * 1000).toISOString(),
          lastContact: new Date(Date.now() - getStableRandom(candidateSeed + 8, 0, 7) * 24 * 60 * 60 * 1000).toISOString(),
          jobTitle: job.title,
          company: job.company,
          aiInsights: {
            skillMatch: getStableRandom(candidateSeed + 9, 60, 100),
            experienceMatch: getStableRandom(candidateSeed + 10, 60, 100),
            cultureFit: getStableRandom(candidateSeed + 11, 60, 100),
            growthPotential: getStableRandom(candidateSeed + 12, 60, 100)
          }
        }
      })
      allCandidates.push(...candidatesForJob)
    })
    
    return allCandidates
  }

  const [candidates, setCandidates] = useState<Candidate[]>([])

  useEffect(() => {
    setIsLoading(true)
    // Use setTimeout to prevent blocking the UI
    setTimeout(() => {
      const allCandidates = generateMockCandidates()
      setCandidates(allCandidates)
      setIsLoading(false)
    }, 100)
  }, [jobs])

  // Optimized filtering using useMemo
  const filteredCandidates = useMemo(() => {
    let filtered = candidates

    // AI Search filter
    if (searchTerm) {
      filtered = filtered.filter(candidate => 
        candidate.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        candidate.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        candidate.matchScore >= 100 // Show only 100% matches when searching
      )
    }

    // Job title filter
    if (selectedJobFilter !== "all") {
      filtered = filtered.filter(candidate => candidate.jobTitle === selectedJobFilter)
    }

    // Company filter
    if (selectedCompanyFilter !== "all") {
      filtered = filtered.filter(candidate => candidate.company === selectedCompanyFilter)
    }

    // Match score filter
    if (matchScoreFilter !== "all") {
      const [min, max] = matchScoreFilter.split("-").map(Number)
      filtered = filtered.filter(candidate => 
        candidate.matchScore >= min && candidate.matchScore <= max
      )
    }



    return filtered
  }, [searchTerm, selectedJobFilter, selectedCompanyFilter, matchScoreFilter, candidates])

  const uniqueJobTitles = useMemo(() => Array.from(new Set(candidates.map(c => c.jobTitle))), [candidates])
  const uniqueCompanies = useMemo(() => Array.from(new Set(candidates.map(c => c.company))), [candidates])

  const handlePipelineChange = useCallback((candidateId: string, newStatus: string) => {
    setCandidates(prev => prev.map(c => 
      c.id === candidateId ? { ...c, status: newStatus as Candidate["status"] } : c
    ))
    const candidateName = candidates.find(c => c.id === candidateId)?.name || "Unknown"
    showToastMessage(`Pipeline status updated for ${candidateName}`)
  }, [candidates])

  const handleBulkPipelineChange = useCallback(() => {
    if (selectedCandidates.size === 0 || !bulkPipelineStatus) return

    setCandidates(prev => prev.map(c => 
      selectedCandidates.has(c.id) ? { ...c, status: bulkPipelineStatus as Candidate["status"] } : c
    ))
    
    showToastMessage(`${selectedCandidates.size} candidates moved to ${bulkPipelineStatus}`)
    setSelectedCandidates(new Set())
    setBulkPipelineStatus("")
  }, [selectedCandidates.size, bulkPipelineStatus])

  const showToastMessage = useCallback((message: string) => {
    setToastMessage(message)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 3000)
  }, [])

  const toggleCandidateSelection = useCallback((candidateId: string) => {
    setSelectedCandidates(prev => {
      const newSelected = new Set(prev)
      if (newSelected.has(candidateId)) {
        newSelected.delete(candidateId)
      } else {
        newSelected.add(candidateId)
      }
      return newSelected
    })
  }, [])

  const toggleSelectAll = useCallback(() => {
    setSelectedCandidates(prev => {
      if (prev.size === filteredCandidates.length) {
        return new Set()
      } else {
        return new Set(filteredCandidates.map(c => c.id))
      }
    })
  }, [filteredCandidates.length])

  const getPipelineColor = (status: string) => {
    switch (status) {
      case "screening": return "bg-blue-100 text-blue-800"
      case "interview": return "bg-yellow-100 text-yellow-800"
      case "offer": return "bg-purple-100 text-purple-800"
      case "hired": return "bg-green-100 text-green-800"
      case "rejected": return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getMatchScoreColor = (score: number) => {
    if (score >= 90) return "bg-green-100 text-green-800"
    if (score >= 80) return "bg-blue-100 text-blue-800"
    if (score >= 70) return "bg-yellow-100 text-yellow-800"
    return "bg-red-100 text-red-800"
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Target className="h-6 w-6 text-blue-600" />
            Matched Candidates
          </h2>
          <p className="text-gray-600 mt-1">
            {filteredCandidates.length.toLocaleString()} candidates found
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-sm">
            {selectedCandidates.size} selected
          </Badge>
          {selectedCandidates.size > 0 && (
            <div className="flex items-center gap-2">
              <Select value={bulkPipelineStatus} onValueChange={setBulkPipelineStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Change pipeline..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="screening">Screening</SelectItem>
                  <SelectItem value="interview">Interview</SelectItem>
                  <SelectItem value="offer">Offer</SelectItem>
                  <SelectItem value="hired">Hired</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleBulkPipelineChange} size="sm">
                Apply to {selectedCandidates.size}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* AI Search and Filters */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
        <div className="flex items-center gap-3 mb-4">
          <Brain className="h-6 w-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">AI-Powered Search & Filters</h3>
        </div>
        
        {/* Search Bar */}
        <div className="flex gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 h-4 w-4" />
            <Input
              placeholder="Search candidates, job titles, or companies with AI..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12 text-lg border-blue-200 focus:border-blue-400"
            />
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700 px-6">
            <Brain className="h-4 w-4 mr-2" />
            AI Search
          </Button>
        </div>

        {/* Filters Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Job Title Filter */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Job Title</label>
            <Select value={selectedJobFilter} onValueChange={setSelectedJobFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Job Titles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Job Titles</SelectItem>
                {uniqueJobTitles.map(title => (
                  <SelectItem key={title} value={title}>
                    {title} ({candidates.filter(c => c.jobTitle === title).length})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Company Filter */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Company</label>
            <Select value={selectedCompanyFilter} onValueChange={setSelectedCompanyFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Companies" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Companies</SelectItem>
                {uniqueCompanies.map(company => (
                  <SelectItem key={company} value={company}>
                    {company} ({candidates.filter(c => c.company === company).length})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Match Score Filter */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Match Score</label>
            <Select value={matchScoreFilter} onValueChange={setMatchScoreFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Scores" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Scores</SelectItem>
                <SelectItem value="90-100">90-100% (Excellent)</SelectItem>
                <SelectItem value="80-89">80-89% (Very Good)</SelectItem>
                <SelectItem value="70-79">70-79% (Good)</SelectItem>
                <SelectItem value="50-69">50-69% (Fair)</SelectItem>
              </SelectContent>
            </Select>
          </div>


        </div>
      </div>

      {/* Candidates Table */}
      <Card className="bg-white shadow-sm border-0">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Candidates</CardTitle>
              <CardDescription>
                {isLoading ? "Loading candidates..." : `${filteredCandidates.length.toLocaleString()} candidates found`}
              </CardDescription>
            </div>
            {!isLoading && (
              <Button
                variant="outline"
                onClick={toggleSelectAll}
                className="flex items-center gap-2"
              >
                {selectedCandidates.size === filteredCandidates.length ? (
                  <CheckSquare className="h-4 w-4" />
                ) : (
                  <Square className="h-4 w-4" />
                )}
                {selectedCandidates.size === filteredCandidates.length ? "Deselect All" : "Select All"}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading candidates...</span>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <input
                          type="checkbox"
                          checked={selectedCandidates.size === filteredCandidates.length}
                          onChange={toggleSelectAll}
                          className="rounded border-gray-300"
                        />
                      </TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Job Title</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Match Score</TableHead>
                      <TableHead>Pipeline Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCandidates.slice(0, 50).map((candidate) => (
                      <TableRow key={candidate.id}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedCandidates.has(candidate.id)}
                            onChange={() => toggleCandidateSelection(candidate.id)}
                            className="rounded border-gray-300"
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-semibold text-blue-600">
                                {candidate.name.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium">{candidate.name}</div>
                              <div className="text-sm text-gray-500">{candidate.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">{candidate.jobTitle}</TableCell>
                        <TableCell className="whitespace-nowrap">{candidate.company}</TableCell>
                        <TableCell>
                          <Badge className={getMatchScoreColor(candidate.matchScore)}>
                            {candidate.matchScore}%
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={candidate.status}
                            onValueChange={(value) => handlePipelineChange(candidate.id, value)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="screening">Screening</SelectItem>
                              <SelectItem value="interview">Interview</SelectItem>
                              <SelectItem value="offer">Offer</SelectItem>
                              <SelectItem value="hired">Hired</SelectItem>
                              <SelectItem value="rejected">Rejected</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => showToastMessage(`Viewing details for ${candidate.name}`)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {filteredCandidates.length > 50 && (
                <div className="mt-4 text-center text-gray-600">
                  Showing 50 of {filteredCandidates.length} candidates. Use filters to narrow down results.
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-in slide-in-from-bottom-2">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            {toastMessage}
          </div>
        </div>
      )}
    </div>
  )
}
