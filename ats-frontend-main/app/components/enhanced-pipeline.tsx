"use client"
import { Button } from "../../components/ui/button"
import { Avatar, AvatarFallback } from "../../components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "../../components/ui/dropdown-menu"
import {
  Mail,
  ChevronDown,
  Star,
  Eye,
  Edit,
  Phone,
  AlertCircle,
  CheckCircle,
  XCircle,
  Calendar,
  Video,
} from "lucide-react"
import InterviewIntegration from "./interview-integration"

// Helper functions
const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "High":
      return "border-blue-500"
    case "Medium":
      return "border-yellow-500"
    case "Low":
      return "border-green-500"
    default:
      return "border-gray-500"
  }
}

const getInitials = (name: string) => {
  const names = name.split(" ")
  return names
    .map((n) => n.charAt(0))
    .join("")
    .toUpperCase()
}

const getAiVerdictIcon = (verdict: string) => {
  switch (verdict) {
    case "Pass":
      return <CheckCircle className="w-3 h-3" />
    case "Fail":
      return <XCircle className="w-3 h-3" />
    case "Pending":
      return <AlertCircle className="w-3 h-3" />
    default:
      return <Star className="w-3 h-3" />
  }
}

// ... (keeping all the existing interfaces and data)

export default function EnhancedPipeline() {
  // ... (keeping all existing state and logic)

  const renderCandidateCard = (candidate: any) => {
    return (
      <div
        key={candidate.id}
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData("text/plain", candidate.id)
          e.currentTarget.classList.add("opacity-50", "scale-95")
        }}
        onDragEnd={(e) => {
          e.currentTarget.classList.remove("opacity-50", "scale-95")
        }}
        className={`bg-white rounded-lg p-3 shadow-sm border-l-4 ${getPriorityColor(candidate.priority)} hover:shadow-md transition-all cursor-move group`}
      >
        {/* Existing card content */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2 flex-1 min-w-0">
            <Avatar className="w-8 h-8 flex-shrink-0">
              <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
                {getInitials(candidate.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{candidate.name}</p>
              <p className="text-xs text-gray-500 truncate">{candidate.position}</p>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <div className="flex items-center space-x-1">
              {getAiVerdictIcon(candidate.aiVerdict)}
              <span className="text-xs font-medium">{candidate.aiScore}</span>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem className="text-xs">
                  <Calendar className="w-3 h-3 mr-2" />
                  AI Schedule Interview
                </DropdownMenuItem>
                <DropdownMenuItem className="text-xs">
                  <Eye className="w-3 h-3 mr-2" />
                  View Full Profile
                </DropdownMenuItem>
                <DropdownMenuItem className="text-xs">
                  <Edit className="w-3 h-3 mr-2" />
                  Edit Candidate Details
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-xs">
                  <Phone className="w-3 h-3 mr-2" />
                  Schedule Call
                </DropdownMenuItem>
                <DropdownMenuItem className="text-xs">
                  <Video className="w-3 h-3 mr-2" />
                  Schedule Video Interview
                </DropdownMenuItem>
                <DropdownMenuItem className="text-xs">
                  <Mail className="w-3 h-3 mr-2" />
                  Send Email
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* AI Interview Integration */}
        <div className="mt-3 pt-3 border-t border-gray-100">
          <InterviewIntegration 
            candidates={[candidate]} 
            onScheduleInterview={(candidateId) => {
              // Handle interview scheduling for this specific candidate
              console.log('Schedule interview for candidate:', candidateId)
            }} 
          />
        </div>

        {/* Rest of existing card content */}
        {/* ... */}
      </div>
    )
  }

  // ... (rest of existing component logic)
}
