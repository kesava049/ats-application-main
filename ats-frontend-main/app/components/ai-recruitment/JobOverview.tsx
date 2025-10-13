"use client"

import React, { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Badge } from "../../components/ui/badge"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { ScrollArea } from "../../components/ui/scroll-area"
import { 
  Briefcase, 
  Building2, 
  MapPin, 
  Users, 
  TrendingUp, 
  Clock,
  Star,
  Zap,
  Eye,
  Edit,
  MoreHorizontal,
  Filter,
  SortAsc,
  SortDesc
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu"

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
}

interface JobOverviewProps {
  jobs: JobPost[]
}

export default function JobOverview({ jobs }: JobOverviewProps) {
  const [sortBy, setSortBy] = useState<"title" | "company" | "applicants" | "matchRate" | "aiScore">("aiScore")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  const sortedJobs = [...jobs].sort((a, b) => {
    const aValue = a[sortBy]
    const bValue = b[sortBy]
    
    if (sortOrder === "asc") {
      return aValue > bValue ? 1 : -1
    } else {
      return aValue < bValue ? 1 : -1
    }
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800"
      case "paused": return "bg-yellow-100 text-yellow-800"
      case "closed": return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-800"
      case "medium": return "bg-yellow-100 text-yellow-800"
      case "low": return "bg-green-100 text-green-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getMatchRateColor = (rate: number) => {
    if (rate >= 90) return "text-green-600"
    if (rate >= 80) return "text-blue-600"
    if (rate >= 70) return "text-yellow-600"
    return "text-red-600"
  }

  const getAIScoreColor = (score: number) => {
    if (score >= 90) return "text-purple-600"
    if (score >= 80) return "text-blue-600"
    if (score >= 70) return "text-green-600"
    return "text-orange-600"
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) return "1 day ago"
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    return `${Math.floor(diffDays / 30)} months ago`
  }

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Job Overview</h2>
          <p className="text-gray-600">AI-powered insights for {jobs.length.toLocaleString()} positions</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("grid")}
            >
              <div className="grid grid-cols-2 gap-1 w-4 h-4">
                <div className="w-1 h-1 bg-current rounded-sm"></div>
                <div className="w-1 h-1 bg-current rounded-sm"></div>
                <div className="w-1 h-1 bg-current rounded-sm"></div>
                <div className="w-1 h-1 bg-current rounded-sm"></div>
              </div>
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("list")}
            >
              <div className="flex flex-col gap-1 w-4 h-4">
                <div className="w-full h-0.5 bg-current rounded-sm"></div>
                <div className="w-full h-0.5 bg-current rounded-sm"></div>
                <div className="w-full h-0.5 bg-current rounded-sm"></div>
              </div>
            </Button>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <SortAsc className="h-4 w-4" />
                Sort by {sortBy}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setSortBy("aiScore")}>
                AI Score
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("matchRate")}>
                Match Rate
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("applicants")}>
                Applicants
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("title")}>
                Job Title
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("company")}>
                Company
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
          >
            {sortOrder === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sortedJobs.slice(0, 24).map((job) => (
            <Card key={job.id} className="hover:shadow-lg transition-shadow duration-200 cursor-pointer group">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-sm font-semibold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {job.title}
                    </CardTitle>
                    <CardDescription className="text-xs text-gray-600 mt-1 flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      {job.company}
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Job
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>

              <CardContent className="pt-0 space-y-3">
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <MapPin className="h-3 w-3" />
                  {job.location}
                </div>

                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className={getStatusColor(job.status)}>
                    {job.status}
                  </Badge>
                  <Badge variant="secondary" className={getPriorityColor(job.priority)}>
                    {job.priority}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="text-center p-2 bg-gray-50 rounded-lg">
                    <div className="font-semibold text-gray-900">{job.applicants.toLocaleString()}</div>
                    <div className="text-gray-600">Applicants</div>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded-lg">
                    <div className={`font-semibold ${getMatchRateColor(job.matchRate)}`}>
                      {job.matchRate}%
                    </div>
                    <div className="text-gray-600">Match Rate</div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1">
                    <Zap className="h-3 w-3 text-purple-500" />
                    <span className={getAIScoreColor(job.aiScore)}>
                      AI: {job.aiScore}%
                    </span>
                  </div>
                  <div className="text-gray-500">
                    {formatDate(job.lastUpdated)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* List View */}
      {viewMode === "list" && (
        <div className="space-y-3">
          {sortedJobs.slice(0, 50).map((job) => (
            <Card key={job.id} className="hover:shadow-md transition-shadow duration-200 cursor-pointer group">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {job.title}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                          <span className="flex items-center gap-1">
                            <Building2 className="h-4 w-4" />
                            {job.company}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {job.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {job.applicants.toLocaleString()} applicants
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className={`text-lg font-bold ${getMatchRateColor(job.matchRate)}`}>
                        {job.matchRate}%
                      </div>
                      <div className="text-xs text-gray-600">Match</div>
                    </div>
                    
                    <div className="text-center">
                      <div className={`text-lg font-bold ${getAIScoreColor(job.aiScore)}`}>
                        {job.aiScore}%
                      </div>
                      <div className="text-xs text-gray-600">AI Score</div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className={getStatusColor(job.status)}>
                        {job.status}
                      </Badge>
                      <Badge variant="secondary" className={getPriorityColor(job.priority)}>
                        {job.priority}
                      </Badge>
                    </div>

                    <div className="text-xs text-gray-500">
                      {formatDate(job.lastUpdated)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Load More */}
      {jobs.length > 50 && (
        <div className="text-center">
          <Button variant="outline" size="lg">
            Load More Jobs ({jobs.length - 50} remaining)
          </Button>
        </div>
      )}
    </div>
  )
}
