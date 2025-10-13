"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Badge } from "../../components/ui/badge"
import { Input } from "../../components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar"
import { Calendar, Clock, Video, Phone, Users, MapPin, Plus, Search, Edit, Trash2 } from "lucide-react"
import { getInterviewsByRecruiter, type Interview } from "../../lib/recruiter-data"

interface AddedInterviewsProps {
  recruiterId: string
}

export default function AddedInterviews({ recruiterId }: AddedInterviewsProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")

  // Get interviews for the recruiter with error handling
  let interviews: Interview[] = []
  try {
    interviews = getInterviewsByRecruiter(recruiterId) || []
  } catch (error) {
    console.error("Error fetching interviews:", error)
  }

  // Filter interviews with null-safe operations
  const filteredInterviews = interviews.filter((interview) => {
    if (!interview) return false

    const searchableText = [
      interview.candidateName || "",
      interview.jobTitle || "",
      interview.interviewerName || "",
      interview.type || "",
    ]
      .join(" ")
      .toLowerCase()

    const matchesSearch = !searchTerm || searchableText.includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || interview.status === statusFilter
    const matchesType = typeFilter === "all" || interview.type === typeFilter

    return matchesSearch && matchesStatus && matchesType
  })

  const formatDateTime = (dateString: string | undefined, timeString?: string) => {
    if (!dateString) return "Date not available"

    try {
      const date = new Date(dateString)
      const dateStr = date.toLocaleDateString()

      if (timeString) {
        return `${dateStr} at ${timeString}`
      }

      // If dateString includes time
      if (dateString.includes("T")) {
        const timeStr = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        return `${dateStr} at ${timeStr}`
      }

      return dateStr
    } catch (error) {
      return "Invalid date"
    }
  }

  const getStatusColor = (status: string | undefined) => {
    if (!status) return "bg-gray-100 text-gray-800"

    switch (status.toLowerCase()) {
      case "scheduled":
        return "bg-blue-100 text-blue-800"
      case "completed":
        return "bg-green-100 text-green-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      case "rescheduled":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getTypeIcon = (type: string | undefined) => {
    if (!type) return <Calendar className="w-4 h-4" />

    switch (type.toLowerCase()) {
      case "video":
        return <Video className="w-4 h-4 text-blue-600" />
      case "phone":
        return <Phone className="w-4 h-4 text-green-600" />
      case "in-person":
        return <MapPin className="w-4 h-4 text-purple-600" />
      case "panel":
        return <Users className="w-4 h-4 text-orange-600" />
      case "technical":
        return <Calendar className="w-4 h-4 text-red-600" />
      default:
        return <Calendar className="w-4 h-4" />
    }
  }

  const getInitials = (name: string | undefined) => {
    if (!name) return "?"
    const nameParts = name.split(" ")
    return nameParts.length > 1
      ? `${nameParts[0].charAt(0)}${nameParts[nameParts.length - 1].charAt(0)}`
      : name.charAt(0)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Interview Schedule</h2>
          <p className="text-gray-600">Manage and track candidate interviews</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Schedule Interview
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Interviews</CardTitle>
            <Calendar className="w-4 h-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{interviews.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
            <Clock className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {interviews.filter((i) => i?.status === "scheduled").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Calendar className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {interviews.filter((i) => i?.status === "completed").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <Calendar className="w-4 h-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {
                interviews.filter((i) => {
                  if (!i?.scheduledDate && !i?.date) return false
                  try {
                    const interviewDate = new Date(i.scheduledDate || i.date)
                    const now = new Date()
                    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
                    return interviewDate >= now && interviewDate <= weekFromNow
                  } catch {
                    return false
                  }
                }).length
              }
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Interviews</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search interviews..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="rescheduled">Rescheduled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="video">Video</SelectItem>
                <SelectItem value="phone">Phone</SelectItem>
                <SelectItem value="in-person">In-Person</SelectItem>
                <SelectItem value="panel">Panel</SelectItem>
                <SelectItem value="technical">Technical</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Interviews Table */}
      <Card>
        <CardHeader>
          <CardTitle>Interview Schedule ({filteredInterviews.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredInterviews.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No interviews found matching your criteria.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Candidate</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Interviewer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInterviews.map((interview) => {
                  if (!interview) return null

                  return (
                    <TableRow key={interview.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarImage
                              src={`/placeholder.svg?height=32&width=32&text=${getInitials(interview.candidateName)}`}
                            />
                            <AvatarFallback>{getInitials(interview.candidateName)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{interview.candidateName || "Unknown Candidate"}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{interview.jobTitle || "No position specified"}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getTypeIcon(interview.type)}
                          <span className="capitalize">{interview.type || "Standard"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {formatDateTime(interview.scheduledDate || interview.date, interview.scheduledTime)}
                        </div>
                      </TableCell>
                      <TableCell>{interview.interviewerName || "Not assigned"}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(interview.status)}>
                          {interview.status
                            ? interview.status.charAt(0).toUpperCase() + interview.status.slice(1)
                            : "Unknown"}
                        </Badge>
                      </TableCell>
                      <TableCell>{interview.duration ? `${interview.duration} min` : "Not specified"}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
