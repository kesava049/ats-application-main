"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Badge } from "../../components/ui/badge"
import { Button } from "../../components/ui/button"
import { Avatar, AvatarFallback } from "../../components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog"
import { Brain, Calendar, Clock, Zap, CheckCircle, AlertCircle, TrendingUp, Users, Award } from "lucide-react"

interface Candidate {
  id: string
  name: string
  position: string
  stage: string
  aiScore: number
  aiVerdict: "recommended" | "maybe" | "not-recommended"
  skills: string[]
  experience: number
}

interface InterviewIntegrationProps {
  candidates: Candidate[]
  onScheduleInterview: (candidateId: string) => void
}

export default function InterviewIntegration({ candidates, onScheduleInterview }: InterviewIntegrationProps) {
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([])

  // Filter candidates who need interviews
  const interviewCandidates = candidates.filter((candidate) =>
    ["screening", "phone-interview", "technical-interview", "final-interview"].includes(candidate.stage),
  )

  const aiRecommendedCandidates = interviewCandidates.filter((c) => c.aiVerdict === "recommended")

  const getAiVerdictIcon = (verdict: string) => {
    switch (verdict) {
      case "recommended":
        return <CheckCircle className="w-3 h-3 text-green-600" />
      case "maybe":
        return <AlertCircle className="w-3 h-3 text-yellow-600" />
      case "not-recommended":
        return <AlertCircle className="w-3 h-3 text-red-600" />
      default:
        return null
    }
  }

  const getStageColor = (stage: string) => {
    switch (stage) {
      case "screening":
        return "bg-yellow-100 text-yellow-800"
      case "phone-interview":
        return "bg-orange-100 text-orange-800"
      case "technical-interview":
        return "bg-purple-100 text-purple-800"
      case "final-interview":
        return "bg-indigo-100 text-indigo-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleBulkSchedule = () => {
    selectedCandidates.forEach((candidateId) => {
      onScheduleInterview(candidateId)
    })
    setSelectedCandidates([])
  }

  return (
    <div className="space-y-6">
      {/* AI Interview Insights */}
      <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="w-5 h-5 text-purple-600" />
            <span>AI Interview Insights</span>
            <Badge className="bg-purple-100 text-purple-700 border-purple-300">
              <Zap className="w-3 h-3 mr-1" />
              Smart
            </Badge>
          </CardTitle>
          <CardDescription>Intelligent recommendations for interview scheduling</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{interviewCandidates.length}</div>
              <p className="text-sm text-gray-600">Ready for Interviews</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{aiRecommendedCandidates.length}</div>
              <p className="text-sm text-gray-600">AI Recommended</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {(interviewCandidates.reduce((sum, c) => sum + c.aiScore, 0) / interviewCandidates.length || 0).toFixed(
                  1,
                )}
              </div>
              <p className="text-sm text-gray-600">Avg AI Score</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">94%</div>
              <p className="text-sm text-gray-600">Success Rate</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Interview Ready Candidates</h3>
        <div className="flex space-x-2">
          {selectedCandidates.length > 0 && (
            <Button onClick={handleBulkSchedule} className="bg-purple-600 hover:bg-purple-700">
              <Brain className="w-4 h-4 mr-2" />
              Bulk Schedule ({selectedCandidates.length})
            </Button>
          )}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                <TrendingUp className="w-4 h-4 mr-2" />
                View Analytics
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Interview Analytics</DialogTitle>
                <DialogDescription>Performance metrics and insights</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <Users className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                    <div className="text-2xl font-bold">156</div>
                    <p className="text-sm text-gray-600">Total Interviews</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <Award className="w-8 h-8 mx-auto mb-2 text-green-600" />
                    <div className="text-2xl font-bold">94%</div>
                    <p className="text-sm text-gray-600">Success Rate</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <Clock className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                    <div className="text-2xl font-bold">2.5h</div>
                    <p className="text-sm text-gray-600">Time Saved/Week</p>
                  </CardContent>
                </Card>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Candidate Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {interviewCandidates.map((candidate) => (
          <Card
            key={candidate.id}
            className={`hover:shadow-lg transition-all duration-200 cursor-pointer ${
              selectedCandidates.includes(candidate.id) ? "ring-2 ring-purple-500 bg-purple-50" : ""
            }`}
            onClick={() => {
              if (selectedCandidates.includes(candidate.id)) {
                setSelectedCandidates(selectedCandidates.filter((id) => id !== candidate.id))
              } else {
                setSelectedCandidates([...selectedCandidates, candidate.id])
              }
            }}
          >
            <CardContent className="p-4">
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                        {candidate.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-medium text-gray-900 text-sm">{candidate.name}</h4>
                      <p className="text-xs text-gray-600">{candidate.position}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    {getAiVerdictIcon(candidate.aiVerdict)}
                    <span className="text-xs font-medium">{candidate.aiScore}/10</span>
                  </div>
                </div>

                {/* Stage Badge */}
                <Badge className={`text-xs ${getStageColor(candidate.stage)}`}>
                  {candidate.stage.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                </Badge>

                {/* Skills */}
                <div className="flex flex-wrap gap-1">
                  {candidate.skills.slice(0, 3).map((skill) => (
                    <Badge key={skill} variant="secondary" className="text-xs px-2 py-0">
                      {skill}
                    </Badge>
                  ))}
                  {candidate.skills.length > 3 && (
                    <Badge variant="secondary" className="text-xs px-2 py-0">
                      +{candidate.skills.length - 3}
                    </Badge>
                  )}
                </div>

                {/* AI Recommendation */}
                {candidate.aiVerdict === "recommended" && (
                  <div className="p-2 bg-green-50 rounded border border-green-200">
                    <div className="flex items-center space-x-2">
                      <Brain className="w-3 h-3 text-green-600" />
                      <span className="text-xs font-medium text-green-700">AI Recommended</span>
                    </div>
                    <p className="text-xs text-green-600 mt-1">High potential candidate - prioritize for interview</p>
                  </div>
                )}

                {/* Action Button */}
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onScheduleInterview(candidate.id)
                  }}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  <Brain className="w-3 h-3 mr-2" />
                  AI Schedule Interview
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {interviewCandidates.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Interviews Needed</h3>
            <p className="text-gray-600">All candidates are either scheduled or not at interview stage yet.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
