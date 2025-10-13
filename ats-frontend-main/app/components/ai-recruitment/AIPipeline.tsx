"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Badge } from "../../components/ui/badge"
import { Button } from "../../components/ui/button"
import { Progress } from "../../components/ui/progress"
import { ScrollArea } from "../../components/ui/scroll-area"
import { 
  TrendingUp, 
  Users, 
  Target, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  Zap,
  Play,
  Pause,
  Settings,
  BarChart3,
  ArrowRight,
  Filter,
  Search,
  Eye,
  MessageSquare,
  Calendar,
  Star,
  Award,
  Briefcase
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select"

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

interface PipelineStage {
  id: string
  name: string
  description: string
  candidates: number
  color: string
  icon: any
  automation: {
    enabled: boolean
    rules: string[]
    efficiency: number
  }
}

interface AIPipelineProps {
  jobs: JobPost[]
}

export default function AIPipeline({ jobs }: AIPipelineProps) {
  const [selectedJob, setSelectedJob] = useState<string>("")
  const [pipelineStages, setPipelineStages] = useState<PipelineStage[]>([])
  const [automationEnabled, setAutomationEnabled] = useState(true)

  // Generate pipeline stages for a job
  const generatePipelineStages = (jobId: string): PipelineStage[] => {
    const stages = [
      {
        id: "sourcing",
        name: "AI Sourcing",
        description: "AI-powered candidate discovery and outreach",
        candidates: Math.floor(Math.random() * 500) + 100,
        color: "from-blue-500 to-blue-600",
        icon: Target,
        automation: {
          enabled: true,
          rules: ["Auto-email qualified candidates", "LinkedIn outreach automation", "Job board optimization"],
          efficiency: Math.floor(Math.random() * 30) + 70
        }
      },
      {
        id: "screening",
        name: "AI Screening",
        description: "Automated resume and skill assessment",
        candidates: Math.floor(Math.random() * 300) + 50,
        color: "from-green-500 to-green-600",
        icon: CheckCircle,
        automation: {
          enabled: true,
          rules: ["Resume parsing", "Skill matching", "Experience validation"],
          efficiency: Math.floor(Math.random() * 25) + 75
        }
      },
      {
        id: "assessment",
        name: "AI Assessment",
        description: "Technical and behavioral evaluation",
        candidates: Math.floor(Math.random() * 200) + 30,
        color: "from-purple-500 to-purple-600",
        icon: Star,
        automation: {
          enabled: true,
          rules: ["Technical tests", "Personality assessment", "Video interviews"],
          efficiency: Math.floor(Math.random() * 20) + 80
        }
      },
      {
        id: "interview",
        name: "AI Interview",
        description: "Intelligent interview scheduling and scoring",
        candidates: Math.floor(Math.random() * 100) + 20,
        color: "from-orange-500 to-orange-600",
        icon: Users,
        automation: {
          enabled: true,
          rules: ["Auto-scheduling", "Interview scoring", "Feedback analysis"],
          efficiency: Math.floor(Math.random() * 15) + 85
        }
      },
      {
        id: "offer",
        name: "AI Offer",
        description: "Automated offer generation and negotiation",
        candidates: Math.floor(Math.random() * 50) + 10,
        color: "from-red-500 to-red-600",
        icon: Award,
        automation: {
          enabled: true,
          rules: ["Offer generation", "Compensation analysis", "Contract automation"],
          efficiency: Math.floor(Math.random() * 10) + 90
        }
      }
    ]

    return stages.map(stage => ({
      ...stage,
      candidates: Math.floor(Math.random() * stage.candidates) + Math.floor(stage.candidates * 0.3)
    }))
  }

  useEffect(() => {
    if (selectedJob) {
      const stages = generatePipelineStages(selectedJob)
      setPipelineStages(stages)
    }
  }, [selectedJob])

  const getTotalCandidates = () => {
    return pipelineStages.reduce((sum, stage) => sum + stage.candidates, 0)
  }

  const getConversionRate = (stageIndex: number) => {
    if (stageIndex === 0) return 100
    const currentStage = pipelineStages[stageIndex]
    const previousStage = pipelineStages[stageIndex - 1]
    if (!currentStage || !previousStage) return 0
    return Math.round((currentStage.candidates / previousStage.candidates) * 100)
  }

  const getStageEfficiency = (stage: PipelineStage) => {
    if (stage.automation.efficiency >= 90) return "Excellent"
    if (stage.automation.efficiency >= 80) return "Good"
    if (stage.automation.efficiency >= 70) return "Fair"
    return "Poor"
  }

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 90) return "text-green-600"
    if (efficiency >= 80) return "text-blue-600"
    if (efficiency >= 70) return "text-yellow-600"
    return "text-red-600"
  }

  const selectedJobData = jobs.find(job => job.id === selectedJob)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">AI Recruitment Pipeline</h2>
          <p className="text-gray-600">
            Intelligent automation for {selectedJob ? "selected job" : "choose a job to view pipeline"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant={automationEnabled ? "default" : "outline"}
            onClick={() => setAutomationEnabled(!automationEnabled)}
            className="flex items-center gap-2"
          >
            {automationEnabled ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {automationEnabled ? "Pause AI" : "Enable AI"}
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Pipeline Settings
          </Button>
        </div>
      </div>

      {/* Job Selection */}
      <Card className="bg-white shadow-sm border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Select Job for Pipeline Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedJob} onValueChange={setSelectedJob}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose a job to analyze pipeline..." />
            </SelectTrigger>
            <SelectContent>
              {jobs.filter(job => job.status === "active").map((job) => (
                <SelectItem key={job.id} value={job.id}>
                  <div className="flex items-center justify-between w-full">
                    <span>{job.title}</span>
                    <Badge variant="secondary" className="ml-2">
                      {job.applicants} applicants
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedJob && selectedJobData && (
        <>
          {/* Pipeline Overview */}
          <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-0">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900">{selectedJobData.title}</h3>
                  <p className="text-sm text-gray-600">{selectedJobData.company}</p>
                  <p className="text-sm text-gray-600">{selectedJobData.location}</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{getTotalCandidates().toLocaleString()}</div>
                  <div className="text-sm text-gray-600">Pipeline Candidates</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {Math.round(pipelineStages.reduce((sum, stage) => sum + stage.automation.efficiency, 0) / pipelineStages.length)}%
                  </div>
                  <div className="text-sm text-gray-600">Avg AI Efficiency</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {pipelineStages.filter(stage => stage.automation.enabled).length}/{pipelineStages.length}
                  </div>
                  <div className="text-sm text-gray-600">Stages Automated</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pipeline Stages */}
          <div className="space-y-6">
            {pipelineStages.map((stage, index) => (
              <Card key={stage.id} className="bg-white shadow-sm border-0 hover:shadow-md transition-shadow duration-200">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 bg-gradient-to-br ${stage.color} rounded-lg flex items-center justify-center text-white`}>
                        <stage.icon className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-semibold text-gray-900">{stage.name}</CardTitle>
                        <CardDescription className="text-gray-600">{stage.description}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className={getEfficiencyColor(stage.automation.efficiency)}>
                        {getStageEfficiency(stage)}
                      </Badge>
                      <Button
                        variant={stage.automation.enabled ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          setPipelineStages(prev => prev.map(s => 
                            s.id === stage.id 
                              ? { ...s, automation: { ...s.automation, enabled: !s.automation.enabled } }
                              : s
                          ))
                        }}
                      >
                        {stage.automation.enabled ? "Enabled" : "Disabled"}
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-0 space-y-4">
                  {/* Stage Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900">{stage.candidates.toLocaleString()}</div>
                      <div className="text-sm text-gray-600">Candidates</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{getConversionRate(index)}%</div>
                      <div className="text-sm text-gray-600">Conversion Rate</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{stage.automation.efficiency}%</div>
                      <div className="text-sm text-gray-600">AI Efficiency</div>
                    </div>
                  </div>

                  {/* AI Efficiency Bar */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">AI Automation Efficiency</span>
                      <span className={`font-semibold ${getEfficiencyColor(stage.automation.efficiency)}`}>
                        {stage.automation.efficiency}%
                      </span>
                    </div>
                    <Progress value={stage.automation.efficiency} className="h-3" />
                  </div>

                  {/* Automation Rules */}
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Automation Rules</p>
                    <div className="space-y-2">
                      {stage.automation.rules.map((rule, ruleIndex) => (
                        <div key={ruleIndex} className="flex items-center gap-2 text-sm">
                          <Zap className="h-3 w-3 text-yellow-500" />
                          <span className="text-gray-600">{rule}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Stage Actions */}
                  <div className="flex items-center gap-3 pt-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Eye className="h-3 w-3 mr-1" />
                      View Candidates
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      <BarChart3 className="h-3 w-3 mr-1" />
                      Analytics
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      <Settings className="h-3 w-3 mr-1" />
                      Configure
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pipeline Flow Visualization */}
          <Card className="bg-white shadow-sm border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Pipeline Flow Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center space-x-4 overflow-x-auto py-6">
                {pipelineStages.map((stage, index) => (
                  <div key={stage.id} className="flex items-center">
                    <div className={`w-16 h-16 bg-gradient-to-br ${stage.color} rounded-full flex items-center justify-center text-white font-semibold text-sm text-center`}>
                      {stage.candidates.toLocaleString()}
                    </div>
                    {index < pipelineStages.length - 1 && (
                      <div className="mx-4 flex items-center">
                        <ArrowRight className="h-6 w-6 text-gray-400" />
                        <div className="text-xs text-gray-500 ml-2">
                          {getConversionRate(index + 1)}%
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* AI Insights */}
          <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-green-600" />
                AI Pipeline Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                  <div className="text-2xl font-bold text-green-600">
                    {Math.round((pipelineStages[0]?.candidates || 0) / getTotalCandidates() * 100)}%
                  </div>
                  <div className="text-sm text-gray-600">Sourcing Success Rate</div>
                </div>
                <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                  <div className="text-2xl font-bold text-blue-600">
                    {Math.round(pipelineStages.reduce((sum, stage) => sum + stage.automation.efficiency, 0) / pipelineStages.length)}%
                  </div>
                  <div className="text-sm text-gray-600">Overall AI Efficiency</div>
                </div>
                <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                  <div className="text-2xl font-bold text-purple-600">
                    {Math.round((pipelineStages[pipelineStages.length - 1]?.candidates || 0) / (pipelineStages[0]?.candidates || 1) * 100)}%
                  </div>
                  <div className="text-sm text-gray-600">End-to-End Conversion</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
