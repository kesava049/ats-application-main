"use client"

import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "../../components/ui/dropdown-menu"
import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Badge } from "../../components/ui/badge"
import { Button } from "../../components/ui/button"
import { Label } from "../../components/ui/label"
import { Textarea } from "../../components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { Avatar, AvatarFallback } from "../../components/ui/avatar"
import { Calendar } from "../../components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "../../components/ui/popover"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs"
import { Switch } from "../../components/ui/switch"
import { Progress } from "../../components/ui/progress"
import {
  Brain,
  CalendarIcon,
  Clock,
  Video,
  Phone,
  MapPin,
  Star,
  Zap,
  CheckCircle,
  Lightbulb,
  Edit,
  Trash2,
  Copy,
  ExternalLink,
  Mail,
  Settings,
  Filter,
  RefreshCw,
  Download,
  Plus,
  AlertCircle,
  Eye,
} from "lucide-react"
import { format, addDays, parseISO } from "date-fns"
import { cn } from "../../lib/utils"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../components/ui/dialog"
import { Input } from "../../components/ui/input"

interface Candidate {
  id: string
  name: string
  email: string
  phone: string
  position: string
  stage: string
  skills: string[]
  experience: number
  aiScore: number
  aiVerdict: "recommended" | "maybe" | "not-recommended"
  timezone: string
  availability: string[]
  preferredInterviewType: "video" | "phone" | "in-person"
  previousInterviews: Interview[]
}

interface Interviewer {
  id: string
  name: string
  email: string
  role: string
  department: string
  expertise: string[]
  availability: TimeSlot[]
  timezone: string
  rating: number
  interviewsCompleted: number
  successRate: number
}

interface TimeSlot {
  start: string
  end: string
  available: boolean
  type: "available" | "busy" | "tentative"
}

interface Interview {
  id: string
  candidateId: string
  interviewerId: string
  type: "screening" | "technical" | "behavioral" | "final" | "panel"
  format: "video" | "phone" | "in-person"
  scheduledDate: string
  duration: number
  status: "scheduled" | "completed" | "cancelled" | "rescheduled"
  meetingLink?: string
  location?: string
  notes?: string
  feedback?: string
  rating?: number
  aiInsights?: string
}

interface AIRecommendation {
  type: "time" | "interviewer" | "format" | "preparation"
  title: string
  description: string
  confidence: number
  reasoning: string
  action?: string
}

interface EmailRecord {
  id: string
  interviewId: string
  recipientEmail: string
  recipientName: string
  type: "confirmation" | "reminder" | "cancellation" | "reschedule"
  subject: string
  sentAt: string
  status: "sent" | "delivered" | "opened" | "failed"
  platform: string
}

interface VideoPlatformConfig {
  name: string
  apiKey?: string
  enabled: boolean
  features: string[]
}

export default function AIInterviewScheduler() {
  const [selectedCandidate, setSelectedCandidate] = useState<string>("")
  const [selectedInterviewer, setSelectedInterviewer] = useState<string>("")
  const [interviewType, setInterviewType] = useState<string>("")
  const [interviewFormat, setInterviewFormat] = useState<string>("")
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [selectedTime, setSelectedTime] = useState<string>("")
  const [duration, setDuration] = useState<string>("60")
  const [notes, setNotes] = useState("")
  const [isAIMode, setIsAIMode] = useState(true)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [isScheduling, setIsScheduling] = useState(false)
  const [activeTab, setActiveTab] = useState("schedule")

  const [showInterviewerDialog, setShowInterviewerDialog] = useState(false)
  const [editingInterviewer, setEditingInterviewer] = useState<Interviewer | null>(null)
  const [newInterviewer, setNewInterviewer] = useState({
    name: "",
    email: "",
    role: "",
    department: "",
    expertise: [] as string[],
    timezone: "PST",
    rating: 0,
    interviewsCompleted: 0,
    successRate: 0,
  })

  const [videoPlatform, setVideoPlatform] = useState<string>("zoom")
  const [emailSettings, setEmailSettings] = useState({
    sendConfirmation: true,
    sendReminder: true,
    reminderTime: "24", // hours before
  })
  const [emailHistory, setEmailHistory] = useState<EmailRecord[]>([])
  const [isGeneratingMeetingLink, setIsGeneratingMeetingLink] = useState(false)

  // Mock data
  const candidates: Candidate[] = [
    {
      id: "1",
      name: "John Smith",
      email: "john.smith@email.com",
      phone: "+1-555-0123",
      position: "Senior Software Engineer",
      stage: "technical-interview",
      skills: ["React", "Node.js", "TypeScript", "AWS"],
      experience: 5,
      aiScore: 8.5,
      aiVerdict: "recommended",
      timezone: "PST",
      availability: ["weekdays-morning", "weekdays-afternoon"],
      preferredInterviewType: "video",
      previousInterviews: [],
    },
    {
      id: "2",
      name: "Sarah Johnson",
      email: "sarah.johnson@email.com",
      phone: "+1-555-0124",
      position: "Marketing Manager",
      stage: "phone-interview",
      skills: ["Digital Marketing", "SEO", "Analytics"],
      experience: 4,
      aiScore: 7.2,
      aiVerdict: "maybe",
      timezone: "EST",
      availability: ["weekdays-afternoon", "weekdays-evening"],
      preferredInterviewType: "phone",
      previousInterviews: [],
    },
  ]

  const [interviewers, setInterviewers] = useState<Interviewer[]>([
    {
      id: "1",
      name: "Alice Chen",
      email: "alice.chen@company.com",
      role: "Senior Engineering Manager",
      department: "Engineering",
      expertise: ["React", "Node.js", "System Design", "Leadership"],
      availability: [
        { start: "09:00", end: "12:00", available: true, type: "available" },
        { start: "14:00", end: "17:00", available: true, type: "available" },
      ],
      timezone: "PST",
      rating: 4.8,
      interviewsCompleted: 127,
      successRate: 0.85,
    },
    {
      id: "2",
      name: "Bob Wilson",
      email: "bob.wilson@company.com",
      role: "Technical Lead",
      department: "Engineering",
      expertise: ["JavaScript", "Python", "AWS", "Microservices"],
      availability: [
        { start: "10:00", end: "12:00", available: true, type: "available" },
        { start: "15:00", end: "18:00", available: true, type: "available" },
      ],
      timezone: "PST",
      rating: 4.6,
      interviewsCompleted: 89,
      successRate: 0.78,
    },
    {
      id: "3",
      name: "Carol Davis",
      email: "carol.davis@company.com",
      role: "Marketing Director",
      department: "Marketing",
      expertise: ["Digital Marketing", "Brand Strategy", "Analytics", "Team Management"],
      availability: [
        { start: "11:00", end: "13:00", available: true, type: "available" },
        { start: "14:00", end: "16:00", available: true, type: "available" },
      ],
      timezone: "EST",
      rating: 4.9,
      interviewsCompleted: 156,
      successRate: 0.92,
    },
  ])

  const [interviews, setInterviews] = useState<Interview[]>([
    {
      id: "1",
      candidateId: "1",
      interviewerId: "1",
      type: "technical",
      format: "video",
      scheduledDate: "2024-01-20T14:00:00Z",
      duration: 60,
      status: "scheduled",
      meetingLink: "https://meet.google.com/abc-defg-hij",
      aiInsights: "High technical match. Focus on system design and React expertise.",
    },
    {
      id: "2",
      candidateId: "2",
      interviewerId: "3",
      type: "screening",
      format: "phone",
      scheduledDate: "2024-01-19T16:00:00Z",
      duration: 30,
      status: "completed",
      rating: 4,
      feedback: "Strong marketing background, good communication skills.",
    },
  ])

  const [videoPlatformConfigs, setVideoPlatformConfigs] = useState<VideoPlatformConfig[]>([
    {
      name: "zoom",
      apiKey: process.env.ZOOM_API_KEY || "",
      enabled: true,
      features: ["Screen Share", "Recording", "Breakout Rooms", "Waiting Room"],
    },
    {
      name: "teams",
      apiKey: process.env.TEAMS_API_KEY || "",
      enabled: true,
      features: ["Screen Share", "Recording", "Chat", "File Sharing"],
    },
    {
      name: "meet",
      apiKey: process.env.GOOGLE_MEET_API_KEY || "",
      enabled: true,
      features: ["Screen Share", "Recording", "Live Captions", "Polls"],
    },
    {
      name: "webex",
      apiKey: process.env.WEBEX_API_KEY || "",
      enabled: false,
      features: ["Screen Share", "Recording", "Whiteboard", "Breakout Sessions"],
    },
  ])

  const handleAddInterviewer = () => {
    const interviewer: Interviewer = {
      id: Date.now().toString(),
      name: newInterviewer.name,
      email: newInterviewer.email,
      role: newInterviewer.role,
      department: newInterviewer.department,
      expertise: newInterviewer.expertise,
      availability: [
        { start: "09:00", end: "12:00", available: true, type: "available" },
        { start: "14:00", end: "17:00", available: true, type: "available" },
      ],
      timezone: newInterviewer.timezone,
      rating: 4.5,
      interviewsCompleted: 0,
      successRate: 0,
    }

    setInterviewers([...interviewers, interviewer])
    setNewInterviewer({
      name: "",
      email: "",
      role: "",
      department: "",
      expertise: [],
      timezone: "PST",
      rating: 0,
      interviewsCompleted: 0,
      successRate: 0,
    })
    setShowInterviewerDialog(false)
  }

  const handleEditInterviewer = () => {
    if (!editingInterviewer) return

    setInterviewers(interviewers.map((i) => (i.id === editingInterviewer.id ? editingInterviewer : i)))
    setEditingInterviewer(null)
    setShowInterviewerDialog(false)
  }

  const handleDeleteInterviewer = (id: string) => {
    setInterviewers(interviewers.filter((i) => i.id !== id))
  }

  const generateMeetingLink = async (platform: string, interviewData: any): Promise<string> => {
    setIsGeneratingMeetingLink(true)

    try {
      // Simulate API call to video platform
      await new Promise((resolve) => setTimeout(resolve, 1500))

      const meetingLinks = {
        zoom: `https://zoom.us/j/${Math.random().toString().substr(2, 10)}?pwd=${Math.random().toString(36).substr(2, 8)}`,
        teams: `https://teams.microsoft.com/l/meetup-join/${Math.random().toString(36).substr(2, 20)}`,
        meet: `https://meet.google.com/${Math.random().toString(36).substr(2, 10)}-${Math.random().toString(36).substr(2, 4)}-${Math.random().toString(36).substr(2, 3)}`,
        webex: `https://company.webex.com/meet/${Math.random().toString(36).substr(2, 15)}`,
      }

      return meetingLinks[platform as keyof typeof meetingLinks] || meetingLinks.zoom
    } finally {
      setIsGeneratingMeetingLink(false)
    }
  }

  const sendInterviewEmail = async (
    type: EmailRecord["type"],
    interview: Interview,
    candidate: Candidate,
    interviewer: Interviewer,
  ): Promise<EmailRecord> => {
    const emailTemplates = {
      confirmation: {
        subject: `Interview Scheduled - ${candidate.position}`,
        body: `Your interview has been scheduled for ${format(parseISO(interview.scheduledDate), "PPP 'at' p")}`,
      },
      reminder: {
        subject: `Interview Reminder - Tomorrow at ${format(parseISO(interview.scheduledDate), "p")}`,
        body: `This is a reminder about your upcoming interview scheduled for tomorrow.`,
      },
      cancellation: {
        subject: `Interview Cancelled - ${candidate.position}`,
        body: `Your interview scheduled for ${format(parseISO(interview.scheduledDate), "PPP")} has been cancelled.`,
      },
      reschedule: {
        subject: `Interview Rescheduled - ${candidate.position}`,
        body: `Your interview has been rescheduled to ${format(parseISO(interview.scheduledDate), "PPP 'at' p")}`,
      },
    }

    const template = emailTemplates[type]

    // Simulate email sending
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const emailRecord: EmailRecord = {
      id: Date.now().toString(),
      interviewId: interview.id,
      recipientEmail: candidate.email,
      recipientName: candidate.name,
      type,
      subject: template.subject,
      sentAt: new Date().toISOString(),
      status: Math.random() > 0.1 ? "delivered" : "failed",
      platform: videoPlatform,
    }

    setEmailHistory((prev) => [emailRecord, ...prev])
    return emailRecord
  }

  // AI Recommendations
  const aiRecommendations: AIRecommendation[] = useMemo(() => {
    if (!selectedCandidate) return []

    const candidate = candidates.find((c) => c.id === selectedCandidate)
    if (!candidate) return []

    return [
      {
        type: "interviewer",
        title: "Best Interviewer Match",
        description: "Alice Chen (95% match)",
        confidence: 95,
        reasoning: "Expertise overlap in React and Node.js. High success rate with similar candidates.",
        action: "Select Alice Chen",
      },
      {
        type: "time",
        title: "Optimal Time Slot",
        description: "Tomorrow 2:00 PM PST",
        confidence: 88,
        reasoning: "Both parties available. Historically high success rate for afternoon technical interviews.",
        action: "Schedule for 2:00 PM",
      },
      {
        type: "format",
        title: "Recommended Format",
        description: "Video Interview",
        confidence: 92,
        reasoning: "Candidate prefers video. Technical role benefits from screen sharing capabilities.",
        action: "Set to Video",
      },
      {
        type: "preparation",
        title: "Interview Focus",
        description: "System Design & React",
        confidence: 87,
        reasoning: "Based on job requirements and candidate's background. Include coding exercise.",
        action: "Add to Notes",
      },
    ]
  }, [selectedCandidate])

  const handleAISchedule = async () => {
    setIsScheduling(true)

    // Simulate AI scheduling process
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Apply AI recommendations
    const topInterviewer = interviewers.find((i) => i.name === "Alice Chen")
    if (topInterviewer) {
      setSelectedInterviewer(topInterviewer.id)
    }

    setInterviewFormat("video")
    setSelectedDate(addDays(new Date(), 1))
    setSelectedTime("14:00")
    setDuration("60")
    setNotes("Focus on system design and React expertise. Include coding exercise.")

    setIsScheduling(false)
  }

  const handleScheduleInterview = async () => {
    let meetingLink = ""

    if (interviewFormat === "video") {
      meetingLink = await generateMeetingLink(videoPlatform, {
        candidateId: selectedCandidate,
        interviewerId: selectedInterviewer,
        scheduledDate: selectedDate,
        duration: duration,
      })
    }

    const newInterview: Interview = {
      id: Date.now().toString(),
      candidateId: selectedCandidate,
      interviewerId: selectedInterviewer,
      type: interviewType as any,
      format: interviewFormat as any,
      scheduledDate: selectedDate ? format(selectedDate, "yyyy-MM-dd") + "T" + selectedTime + ":00Z" : "",
      duration: Number.parseInt(duration),
      status: "scheduled",
      meetingLink: meetingLink || undefined,
      notes,
    }

    setInterviews([...interviews, newInterview])

    // Send confirmation emails if enabled
    if (emailSettings.sendConfirmation) {
      const candidate = candidates.find((c) => c.id === selectedCandidate)
      const interviewer = interviewers.find((i) => i.id === selectedInterviewer)

      if (candidate && interviewer) {
        await sendInterviewEmail("confirmation", newInterview, candidate, interviewer)
      }
    }

    // Reset form
    setSelectedCandidate("")
    setSelectedInterviewer("")
    setInterviewType("")
    setInterviewFormat("")
    setSelectedDate(undefined)
    setSelectedTime("")
    setNotes("")
  }

  const getInterviewTypeColor = (type: string) => {
    switch (type) {
      case "screening":
        return "bg-blue-100 text-blue-800"
      case "technical":
        return "bg-purple-100 text-purple-800"
      case "behavioral":
        return "bg-green-100 text-green-800"
      case "final":
        return "bg-orange-100 text-orange-800"
      case "panel":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
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

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl shadow-lg">
            <Brain className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">AI Interview Scheduler</h1>
            <p className="text-gray-600 mt-1">Intelligent scheduling with 94% success rate</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="bg-purple-100 text-purple-700 border-purple-300 px-3 py-1">
            <Zap className="w-4 h-4 mr-1" />
            AI Powered
          </Badge>
          <div className="flex items-center space-x-2 bg-white rounded-lg border px-3 py-2">
            <Label htmlFor="ai-mode" className="text-sm font-medium">
              AI Mode
            </Label>
            <Switch id="ai-mode" checked={isAIMode} onCheckedChange={setIsAIMode} />
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-green-700">94%</p>
                <p className="text-sm text-green-600">Success Rate</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-blue-700">2.5h</p>
                <p className="text-sm text-blue-600">Time Saved/Week</p>
              </div>
              <Clock className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-yellow-700">4.8</p>
                <p className="text-sm text-yellow-600">Avg Rating</p>
              </div>
              <Star className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-purple-700">156</p>
                <p className="text-sm text-purple-600">Scheduled</p>
              </div>
              <CalendarIcon className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 h-12">
          <TabsTrigger value="schedule" className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Schedule</span>
          </TabsTrigger>
          <TabsTrigger value="interviews" className="flex items-center gap-2">
            <Video className="w-4 h-4" />
            <span className="hidden sm:inline">Interviews</span>
          </TabsTrigger>
          <TabsTrigger value="emails" className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            <span className="hidden sm:inline">Emails</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <Star className="w-4 h-4" />
            <span className="hidden sm:inline">Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Settings</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="schedule" className="mt-6">
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            {/* Main Scheduling Form */}
            <div className="xl:col-span-3">
              <Card className="shadow-lg">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-lg">
                  <CardTitle className="flex items-center space-x-2">
                    <CalendarIcon className="w-5 h-5 text-blue-600" />
                    <span>Schedule New Interview</span>
                  </CardTitle>
                  <CardDescription>
                    {isAIMode ? "AI will optimize your scheduling decisions" : "Manual scheduling mode"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {/* Candidate Selection */}
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">Select Candidate</Label>
                    <Select value={selectedCandidate} onValueChange={setSelectedCandidate}>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Choose a candidate to interview" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[200px]">
                        {candidates.map((candidate) => (
                          <SelectItem key={candidate.id} value={candidate.id} className="p-4">
                            <div className="flex items-center space-x-3 w-full">
                              <Avatar className="w-8 h-8">
                                <AvatarFallback className="text-sm bg-blue-100 text-blue-700">
                                  {candidate.name.split(" ").map((n) => n[0])}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <p className="font-medium">{candidate.name}</p>
                                <p className="text-sm text-gray-500">{candidate.position}</p>
                                <div className="flex items-center space-x-2 mt-1">
                                  <Badge variant="outline" className="text-xs">
                                    AI Score: {candidate.aiScore}
                                  </Badge>
                                  <Badge
                                    variant="outline"
                                    className={`text-xs ${
                                      candidate.aiVerdict === "recommended"
                                        ? "bg-green-100 text-green-700 border-green-300"
                                        : candidate.aiVerdict === "maybe"
                                          ? "bg-yellow-100 text-yellow-700 border-yellow-300"
                                          : "bg-red-100 text-red-700 border-red-300"
                                    }`}
                                  >
                                    {candidate.aiVerdict}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Interview Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label className="text-base font-semibold">Interview Type</Label>
                      <Select value={interviewType} onValueChange={setInterviewType}>
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Select interview type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="screening">
                            <div className="flex items-center space-x-2">
                              <span className="text-lg">📞</span>
                              <span>Phone Screening</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="technical">
                            <div className="flex items-center space-x-2">
                              <span className="text-lg">💻</span>
                              <span>Technical Interview</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="behavioral">
                            <div className="flex items-center space-x-2">
                              <span className="text-lg">🤝</span>
                              <span>Behavioral Interview</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="final">
                            <div className="flex items-center space-x-2">
                              <span className="text-lg">🎯</span>
                              <span>Final Interview</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="panel">
                            <div className="flex items-center space-x-2">
                              <span className="text-lg">👥</span>
                              <span>Panel Interview</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-base font-semibold">Interview Format</Label>
                      <Select value={interviewFormat} onValueChange={setInterviewFormat}>
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Choose format" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="video">
                            <div className="flex items-center space-x-2">
                              <Video className="w-4 h-4 text-blue-500" />
                              <span>Video Call</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="phone">
                            <div className="flex items-center space-x-2">
                              <Phone className="w-4 h-4 text-green-500" />
                              <span>Phone Call</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="in-person">
                            <div className="flex items-center space-x-2">
                              <MapPin className="w-4 h-4 text-purple-500" />
                              <span>In Person</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Interviewer Selection */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-semibold">Select Interviewer</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingInterviewer(null)
                          setShowInterviewerDialog(true)
                        }}
                        className="text-xs"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add Interviewer
                      </Button>
                    </div>
                    <Select value={selectedInterviewer} onValueChange={setSelectedInterviewer}>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Choose an interviewer" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[200px]">
                        {interviewers.map((interviewer) => (
                          <SelectItem key={interviewer.id} value={interviewer.id} className="p-4">
                            <div className="flex items-center justify-between w-full">
                              <div className="flex items-center space-x-3">
                                <Avatar className="w-8 h-8">
                                  <AvatarFallback className="text-sm bg-green-100 text-green-700">
                                    {interviewer.name.split(" ").map((n) => n[0])}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">{interviewer.name}</p>
                                  <p className="text-sm text-gray-500">{interviewer.email}</p>
                                  <p className="text-xs text-gray-400">
                                    {interviewer.role} • {interviewer.department}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <div className="flex items-center space-x-1">
                                  <Star className="w-3 h-3 text-yellow-500" />
                                  <span className="text-sm font-medium">{interviewer.rating}</span>
                                </div>
                                <Badge variant="outline" className="text-xs">
                                  {Math.round(interviewer.successRate * 100)}% success
                                </Badge>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Interviewer Management Table */}
                    <Card className="mt-4">
                      <CardHeader>
                        <CardTitle className="text-sm">Manage Interviewers</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {interviewers.map((interviewer) => (
                            <div
                              key={interviewer.id}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                            >
                              <div className="flex items-center space-x-3">
                                <Avatar className="w-8 h-8">
                                  <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
                                    {interviewer.name.split(" ").map((n) => n[0])}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium text-sm">{interviewer.name}</p>
                                  <p className="text-xs text-gray-500">{interviewer.email}</p>
                                  <p className="text-xs text-gray-400">{interviewer.role}</p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setEditingInterviewer(interviewer)
                                    setShowInterviewerDialog(true)
                                  }}
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteInterviewer(interviewer.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Date and Time Selection */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-3">
                      <Label className="text-base font-semibold">Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "h-12 w-full justify-start text-left font-normal",
                              !selectedDate && "text-muted-foreground",
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={setSelectedDate}
                            disabled={(date) => date < new Date() || date.getDay() === 0 || date.getDay() === 6}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-base font-semibold">Time</Label>
                      <Select value={selectedTime} onValueChange={setSelectedTime}>
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Select time" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="09:00">9:00 AM</SelectItem>
                          <SelectItem value="10:00">10:00 AM</SelectItem>
                          <SelectItem value="11:00">11:00 AM</SelectItem>
                          <SelectItem value="12:00">12:00 PM</SelectItem>
                          <SelectItem value="13:00">1:00 PM</SelectItem>
                          <SelectItem value="14:00">2:00 PM</SelectItem>
                          <SelectItem value="15:00">3:00 PM</SelectItem>
                          <SelectItem value="16:00">4:00 PM</SelectItem>
                          <SelectItem value="17:00">5:00 PM</SelectItem>
                          <SelectItem value="18:00">6:00 PM</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-base font-semibold">Duration</Label>
                      <Select value={duration} onValueChange={setDuration}>
                        <SelectTrigger className="h-12">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="30">30 minutes</SelectItem>
                          <SelectItem value="45">45 minutes</SelectItem>
                          <SelectItem value="60">1 hour</SelectItem>
                          <SelectItem value="90">1.5 hours</SelectItem>
                          <SelectItem value="120">2 hours</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">Interview Notes & Focus Areas</Label>
                    <Textarea
                      placeholder="Add interview focus areas, specific questions, or special instructions..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={4}
                      className="resize-none"
                    />
                  </div>

                  {/* Video Platform Selection */}
                  {interviewFormat === "video" && (
                    <div className="space-y-3 p-4 bg-purple-50 rounded-lg border border-purple-200">
                      <Label className="text-base font-semibold flex items-center space-x-2">
                        <Video className="w-4 h-4 text-purple-600" />
                        <span>Video Platform</span>
                      </Label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {videoPlatformConfigs
                          .filter((config) => config.enabled)
                          .map((config) => (
                            <div
                              key={config.name}
                              className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                videoPlatform === config.name
                                  ? "border-purple-500 bg-purple-100"
                                  : "border-gray-200 bg-white hover:border-gray-300"
                              }`}
                              onClick={() => setVideoPlatform(config.name)}
                            >
                              <div className="flex items-center space-x-2 mb-2">
                                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
                                  <span className="text-white text-xs font-bold">
                                    {config.name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <span className="font-medium capitalize">{config.name}</span>
                              </div>
                              <div className="text-xs text-gray-600">
                                {config.features.slice(0, 2).join(", ")}
                                {config.features.length > 2 && ` +${config.features.length - 2} more`}
                              </div>
                            </div>
                          ))}
                      </div>

                      {!videoPlatformConfigs.find((c) => c.name === videoPlatform)?.apiKey && (
                        <div className="flex items-center space-x-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <AlertCircle className="w-4 h-4 text-yellow-600" />
                          <span className="text-sm text-yellow-700">
                            API key not configured for {videoPlatform}. Meeting links will be generated as placeholders.
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Email Settings */}
                  <div className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <Label className="text-base font-semibold flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-blue-600" />
                      <span>Email Notifications</span>
                    </Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-sm font-medium">Send Confirmation</span>
                          <p className="text-xs text-gray-600">Email interview details to candidate</p>
                        </div>
                        <Switch
                          checked={emailSettings.sendConfirmation}
                          onCheckedChange={(checked) =>
                            setEmailSettings((prev) => ({ ...prev, sendConfirmation: checked }))
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-sm font-medium">Send Reminder</span>
                          <p className="text-xs text-gray-600">Remind candidate before interview</p>
                        </div>
                        <Switch
                          checked={emailSettings.sendReminder}
                          onCheckedChange={(checked) =>
                            setEmailSettings((prev) => ({ ...prev, sendReminder: checked }))
                          }
                        />
                      </div>
                    </div>
                    {emailSettings.sendReminder && (
                      <div className="space-y-2">
                        <Label className="text-sm">Reminder Time</Label>
                        <Select
                          value={emailSettings.reminderTime}
                          onValueChange={(value) => setEmailSettings((prev) => ({ ...prev, reminderTime: value }))}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 hour before</SelectItem>
                            <SelectItem value="2">2 hours before</SelectItem>
                            <SelectItem value="4">4 hours before</SelectItem>
                            <SelectItem value="24">24 hours before</SelectItem>
                            <SelectItem value="48">48 hours before</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                    {isAIMode && (
                      <Button
                        onClick={handleAISchedule}
                        disabled={!selectedCandidate || isScheduling}
                        className="flex-1 h-12 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                      >
                        {isScheduling ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            AI Optimizing...
                          </>
                        ) : (
                          <>
                            <Brain className="w-4 h-4 mr-2" />
                            AI Smart Schedule
                          </>
                        )}
                      </Button>
                    )}
                    <Button
                      onClick={handleScheduleInterview}
                      disabled={
                        !selectedCandidate ||
                        !selectedInterviewer ||
                        !selectedDate ||
                        !selectedTime ||
                        (interviewFormat === "video" && isGeneratingMeetingLink)
                      }
                      variant={isAIMode ? "outline" : "default"}
                      className="flex-1 h-12"
                    >
                      {isGeneratingMeetingLink ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Generating Meeting Link...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Schedule Interview
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* AI Recommendations Sidebar */}
            <div className="xl:col-span-1">
              {isAIMode && selectedCandidate && (
                <Card className="shadow-lg sticky top-6">
                  <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-t-lg">
                    <CardTitle className="flex items-center space-x-2">
                      <Brain className="w-5 h-5 text-purple-600" />
                      <span>AI Insights</span>
                    </CardTitle>
                    <CardDescription>Smart recommendations based on data analysis</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    {aiRecommendations.map((rec, index) => (
                      <div
                        key={index}
                        className="p-3 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border border-purple-200"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <Lightbulb className="w-4 h-4 text-purple-600" />
                            <h4 className="font-medium text-sm">{rec.title}</h4>
                          </div>
                          <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700">
                            {rec.confidence}%
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-700 mb-2">{rec.description}</p>
                        <p className="text-xs text-gray-600 mb-3">{rec.reasoning}</p>
                        {rec.action && (
                          <Button size="sm" variant="outline" className="text-xs h-7 bg-white hover:bg-purple-50">
                            {rec.action}
                          </Button>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Quick Stats Card */}
              <Card className="shadow-lg mt-6">
                <CardHeader>
                  <CardTitle className="text-lg">Today's Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Interviews Today</span>
                    <span className="font-semibold text-blue-600">5</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">This Week</span>
                    <span className="font-semibold text-green-600">12</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Success Rate</span>
                    <span className="font-semibold text-purple-600">94%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Avg Duration</span>
                    <span className="font-semibold text-orange-600">52 min</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="interviews" className="mt-6">
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h3 className="text-xl font-semibold">Scheduled Interviews</h3>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>

            <div className="grid gap-4">
              {interviews.map((interview) => {
                const candidate = candidates.find((c) => c.id === interview.candidateId)
                const interviewer = interviewers.find((i) => i.id === interview.interviewerId)

                return (
                  <Card key={interview.id} className="hover:shadow-lg transition-all duration-200">
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex items-center space-x-4">
                          <div className="flex -space-x-2">
                            <Avatar className="w-10 h-10 border-2 border-white shadow-md">
                              <AvatarFallback className="text-sm bg-blue-100 text-blue-700">
                                {candidate?.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <Avatar className="w-10 h-10 border-2 border-white shadow-md">
                              <AvatarFallback className="text-sm bg-green-100 text-green-700">
                                {interviewer?.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                          <div>
                            <h4 className="font-semibold text-lg">{candidate?.name}</h4>
                            <p className="text-gray-600">{candidate?.position}</p>
                            <div className="flex items-center space-x-2 mt-2">
                              <Badge className={`text-xs ${getInterviewTypeColor(interview.type)}`}>
                                {interview.type}
                              </Badge>
                              <Badge className={`text-xs ${getStatusColor(interview.status)}`}>
                                {interview.status}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                          <div className="text-sm text-gray-600 space-y-1">
                            <div className="flex items-center space-x-2">
                              <CalendarIcon className="w-4 h-4" />
                              <span>{format(parseISO(interview.scheduledDate), "MMM d, h:mm a")}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Clock className="w-4 h-4" />
                              <span>{interview.duration} min</span>
                              {interview.format === "video" && <Video className="w-4 h-4 text-blue-500" />}
                              {interview.format === "phone" && <Phone className="w-4 h-4 text-green-500" />}
                              {interview.format === "in-person" && <MapPin className="w-4 h-4 text-purple-500" />}
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            {interview.meetingLink && (
                              <Button size="sm" variant="outline" className="bg-blue-50 hover:bg-blue-100">
                                <ExternalLink className="w-4 h-4 mr-2" />
                                Join
                              </Button>
                            )}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Settings className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Copy className="w-4 h-4 mr-2" />
                                  Copy Link
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Mail className="w-4 h-4 mr-2" />
                                  Send Reminder
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600">
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Cancel
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>

                      {interview.aiInsights && (
                        <div className="mt-4 p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                          <div className="flex items-center space-x-2 mb-2">
                            <Brain className="w-4 h-4 text-purple-600" />
                            <span className="text-sm font-medium text-purple-700">AI Insights</span>
                          </div>
                          <p className="text-sm text-purple-600">{interview.aiInsights}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="emails" className="mt-6">
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h3 className="text-xl font-semibold">Email History & Tracking</h3>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>

            {/* Email Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-blue-700">{emailHistory.length}</p>
                      <p className="text-sm text-blue-600">Total Sent</p>
                    </div>
                    <Mail className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-green-700">
                        {emailHistory.filter((e) => e.status === "delivered").length}
                      </p>
                      <p className="text-sm text-green-600">Delivered</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-yellow-700">
                        {emailHistory.filter((e) => e.status === "opened").length}
                      </p>
                      <p className="text-sm text-yellow-600">Opened</p>
                    </div>
                    <Eye className="w-8 h-8 text-yellow-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-red-700">
                        {emailHistory.filter((e) => e.status === "failed").length}
                      </p>
                      <p className="text-sm text-red-600">Failed</p>
                    </div>
                    <AlertCircle className="w-8 h-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Email History Table */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Email Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {emailHistory.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Mail className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No emails sent yet</p>
                      <p className="text-sm">Email history will appear here once you start scheduling interviews</p>
                    </div>
                  ) : (
                    emailHistory.map((email) => (
                      <div key={email.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div
                            className={`w-3 h-3 rounded-full ${
                              email.status === "delivered"
                                ? "bg-green-500"
                                : email.status === "opened"
                                  ? "bg-blue-500"
                                  : email.status === "failed"
                                    ? "bg-red-500"
                                    : "bg-yellow-500"
                            }`}
                          />
                          <div>
                            <p className="font-medium">{email.subject}</p>
                            <p className="text-sm text-gray-600">
                              To: {email.recipientName} ({email.recipientEmail})
                            </p>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {email.type}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {email.platform}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                {format(parseISO(email.sentAt), "MMM d, h:mm a")}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge
                            variant={
                              email.status === "delivered"
                                ? "default"
                                : email.status === "failed"
                                  ? "destructive"
                                  : "secondary"
                            }
                            className="text-xs"
                          >
                            {email.status}
                          </Badge>
                          <Button variant="ghost" size="sm">
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>Success Rates</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Overall Success</span>
                    <span className="font-semibold text-green-600">94%</span>
                  </div>
                  <Progress value={94} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Technical Interviews</span>
                    <span className="font-semibold">91%</span>
                  </div>
                  <Progress value={91} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Behavioral Interviews</span>
                    <span className="font-semibold">97%</span>
                  </div>
                  <Progress value={97} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <span>Time Efficiency</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-4">
                  <div>
                    <div className="text-3xl font-bold text-green-600">2.5h</div>
                    <p className="text-sm text-gray-600">Saved per week</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Manual Scheduling</span>
                      <span className="font-medium">4.2h</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">AI Scheduling</span>
                      <span className="font-medium text-green-600">1.7h</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Star className="w-5 h-5 text-yellow-600" />
                  <span>Top Performers</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {interviewers.slice(0, 3).map((interviewer) => (
                    <div key={interviewer.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
                            {interviewer.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <span className="text-sm font-medium">{interviewer.name}</span>
                          <p className="text-xs text-gray-500">{interviewer.interviewsCompleted} interviews</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span className="text-sm font-semibold">{interviewer.rating}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Brain className="w-5 h-5 text-purple-600" />
                  <span>AI Configuration</span>
                </CardTitle>
                <CardDescription>Configure AI behavior and preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <Label className="font-medium">Auto-scheduling</Label>
                    <p className="text-sm text-gray-600 mt-1">Automatically schedule when optimal slots are found</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <Label className="font-medium">Smart recommendations</Label>
                    <p className="text-sm text-gray-600 mt-1">Show AI-powered interviewer and time suggestions</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <Label className="font-medium">Learning mode</Label>
                    <p className="text-sm text-gray-600 mt-1">Allow AI to learn from scheduling patterns</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Mail className="w-5 h-5 text-blue-600" />
                  <span>Notification Settings</span>
                </CardTitle>
                <CardDescription>Manage email and reminder preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <Label className="font-medium">Interview reminders</Label>
                    <p className="text-sm text-gray-600 mt-1">Send reminders to candidates and interviewers</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <Label className="font-medium">Schedule confirmations</Label>
                    <p className="text-sm text-gray-600 mt-1">Send confirmation emails when interviews are scheduled</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <Label className="font-medium">Calendar integration</Label>
                    <p className="text-sm text-gray-600 mt-1">Sync with Google Calendar and Outlook</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Interviewer Management Dialog */}
      <Dialog open={showInterviewerDialog} onOpenChange={setShowInterviewerDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingInterviewer ? "Edit Interviewer" : "Add New Interviewer"}</DialogTitle>
            <DialogDescription>
              {editingInterviewer
                ? "Update interviewer information and availability"
                : "Add a new interviewer to the scheduling system"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="interviewer-name">Full Name *</Label>
                <Input
                  id="interviewer-name"
                  value={editingInterviewer ? editingInterviewer.name : newInterviewer.name}
                  onChange={(e) => {
                    if (editingInterviewer) {
                      setEditingInterviewer({ ...editingInterviewer, name: e.target.value })
                    } else {
                      setNewInterviewer({ ...newInterviewer, name: e.target.value })
                    }
                  }}
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="interviewer-email">Email Address *</Label>
                <Input
                  id="interviewer-email"
                  type="email"
                  value={editingInterviewer ? editingInterviewer.email : newInterviewer.email}
                  onChange={(e) => {
                    if (editingInterviewer) {
                      setEditingInterviewer({ ...editingInterviewer, email: e.target.value })
                    } else {
                      setNewInterviewer({ ...newInterviewer, email: e.target.value })
                    }
                  }}
                  placeholder="john.doe@company.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="interviewer-role">Job Title *</Label>
                <Input
                  id="interviewer-role"
                  value={editingInterviewer ? editingInterviewer.role : newInterviewer.role}
                  onChange={(e) => {
                    if (editingInterviewer) {
                      setEditingInterviewer({ ...editingInterviewer, role: e.target.value })
                    } else {
                      setNewInterviewer({ ...newInterviewer, role: e.target.value })
                    }
                  }}
                  placeholder="Senior Software Engineer"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="interviewer-department">Department *</Label>
                <Select
                  value={editingInterviewer ? editingInterviewer.department : newInterviewer.department}
                  onValueChange={(value) => {
                    if (editingInterviewer) {
                      setEditingInterviewer({ ...editingInterviewer, department: value })
                    } else {
                      setNewInterviewer({ ...newInterviewer, department: value })
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Engineering">Engineering</SelectItem>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                    <SelectItem value="Sales">Sales</SelectItem>
                    <SelectItem value="HR">Human Resources</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
                    <SelectItem value="Operations">Operations</SelectItem>
                    <SelectItem value="Product">Product</SelectItem>
                    <SelectItem value="Design">Design</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="interviewer-timezone">Timezone</Label>
              <Select
                value={editingInterviewer ? editingInterviewer.timezone : newInterviewer.timezone}
                onValueChange={(value) => {
                  if (editingInterviewer) {
                    setEditingInterviewer({ ...editingInterviewer, timezone: value })
                  } else {
                    setNewInterviewer({ ...newInterviewer, timezone: value })
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PST">Pacific Standard Time (PST)</SelectItem>
                  <SelectItem value="MST">Mountain Standard Time (MST)</SelectItem>
                  <SelectItem value="CST">Central Standard Time (CST)</SelectItem>
                  <SelectItem value="EST">Eastern Standard Time (EST)</SelectItem>
                  <SelectItem value="GMT">Greenwich Mean Time (GMT)</SelectItem>
                  <SelectItem value="CET">Central European Time (CET)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Areas of Expertise</Label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  "React",
                  "Node.js",
                  "Python",
                  "Java",
                  "JavaScript",
                  "TypeScript",
                  "AWS",
                  "Docker",
                  "Kubernetes",
                  "System Design",
                  "Leadership",
                  "Digital Marketing",
                  "SEO",
                  "Analytics",
                  "Brand Strategy",
                  "Sales Strategy",
                  "Customer Success",
                  "Project Management",
                ].map((skill) => (
                  <label key={skill} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={
                        editingInterviewer
                          ? editingInterviewer.expertise.includes(skill)
                          : newInterviewer.expertise.includes(skill)
                      }
                      onChange={(e) => {
                        const currentExpertise = editingInterviewer
                          ? editingInterviewer.expertise
                          : newInterviewer.expertise

                        const newExpertise = e.target.checked
                          ? [...currentExpertise, skill]
                          : currentExpertise.filter((s) => s !== skill)

                        if (editingInterviewer) {
                          setEditingInterviewer({ ...editingInterviewer, expertise: newExpertise })
                        } else {
                          setNewInterviewer({ ...newInterviewer, expertise: newExpertise })
                        }
                      }}
                      className="rounded"
                    />
                    <span className="text-sm">{skill}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Weekly Availability</Label>
              <div className="grid grid-cols-1 gap-2 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  Default availability: Monday-Friday, 9:00 AM - 12:00 PM and 2:00 PM - 5:00 PM
                </p>
                <p className="text-xs text-gray-500">Advanced scheduling options can be configured after creation.</p>
              </div>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowInterviewerDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={editingInterviewer ? handleEditInterviewer : handleAddInterviewer}
              disabled={
                editingInterviewer
                  ? !editingInterviewer.name || !editingInterviewer.email || !editingInterviewer.role
                  : !newInterviewer.name || !newInterviewer.email || !newInterviewer.role
              }
              className="bg-purple-600 hover:bg-purple-700"
            >
              {editingInterviewer ? "Update Interviewer" : "Add Interviewer"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
