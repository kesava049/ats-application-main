"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Badge } from "../../components/ui/badge"
import { Button } from "../../components/ui/button"
import { Progress } from "../../components/ui/progress"
import { ScrollArea } from "../../components/ui/scroll-area"
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Target, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  Zap,
  Brain,
  Award,
  Briefcase,
  MapPin,
  Calendar,
  Star,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Settings
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

interface AnalyticsData {
  timeToHire: number
  costPerHire: number
  qualityOfHire: number
  candidateSatisfaction: number
  aiAccuracy: number
  automationEfficiency: number
  diversityMetrics: {
    gender: { male: number; female: number; other: number }
    age: { under25: number; "25-35": number; "36-45": number; over45: number }
    location: { local: number; national: number; international: number }
  }
  skillGaps: Array<{ skill: string; demand: number; supply: number; gap: number }>
  marketTrends: Array<{ month: string; applications: number; hires: number; aiScore: number }>
}

interface RecruitmentAnalyticsProps {
  jobs: JobPost[]
}

export default function RecruitmentAnalytics({ jobs }: RecruitmentAnalyticsProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>("30d")
  const [selectedMetric, setSelectedMetric] = useState<string>("overall")
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)

  // Generate mock analytics data with stable values for SSR
  const generateAnalyticsData = (): AnalyticsData => {
    const skills = ["React", "Python", "JavaScript", "Java", "SQL", "AWS", "Docker", "Machine Learning", "UI/UX", "Data Analysis"]
    
    // Use deterministic values based on skill index to prevent hydration mismatch
    const getStableRandom = (seed: number, min: number, max: number) => {
      const x = Math.sin(seed) * 10000
      return Math.floor((x - Math.floor(x)) * (max - min + 1)) + min
    }
    
    return {
      timeToHire: getStableRandom(1, 15, 35), // 15-35 days
      costPerHire: getStableRandom(2, 3000, 8000), // $3000-$8000
      qualityOfHire: getStableRandom(3, 70, 100), // 70-100%
      candidateSatisfaction: getStableRandom(4, 80, 100), // 80-100%
      aiAccuracy: getStableRandom(5, 85, 100), // 85-100%
      automationEfficiency: getStableRandom(6, 80, 100), // 80-100%
      diversityMetrics: {
        gender: {
          male: getStableRandom(7, 50, 70),
          female: getStableRandom(8, 40, 60),
          other: getStableRandom(9, 5, 10)
        },
        age: {
          under25: getStableRandom(10, 20, 35),
          "25-35": getStableRandom(11, 45, 65),
          "36-45": getStableRandom(12, 25, 40),
          over45: getStableRandom(13, 10, 20)
        },
        location: {
          local: getStableRandom(14, 60, 80),
          national: getStableRandom(15, 30, 50),
          international: getStableRandom(16, 10, 20)
        }
      },
      skillGaps: skills.map((skill, index) => ({
        skill,
        demand: getStableRandom(index + 20, 60, 100),
        supply: getStableRandom(index + 30, 40, 80),
        gap: getStableRandom(index + 40, 10, 40)
      })),
      marketTrends: Array.from({ length: 12 }, (_, i) => ({
        month: new Date(2024, i, 1).toLocaleDateString('en-US', { month: 'short' }),
        applications: getStableRandom(i + 50, 1000, 1500),
        hires: getStableRandom(i + 60, 20, 70),
        aiScore: getStableRandom(i + 70, 80, 100)
      }))
    }
  }

  useEffect(() => {
    setAnalyticsData(generateAnalyticsData())
  }, [])

  const getMetricColor = (value: number, threshold: number) => {
    if (value >= threshold) return "text-green-600"
    if (value >= threshold * 0.8) return "text-yellow-600"
    return "text-red-600"
  }

  const getMetricStatus = (value: number, threshold: number) => {
    if (value >= threshold) return "Excellent"
    if (value >= threshold * 0.8) return "Good"
    if (value >= threshold * 0.6) return "Fair"
    return "Poor"
  }

  if (!analyticsData) return <div>Loading analytics...</div>

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">AI Recruitment Analytics</h2>
          <p className="text-gray-600">Comprehensive insights and performance metrics</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export Report
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Timeframe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="1y">Last year</SelectItem>
          </SelectContent>
        </Select>
        <Select value={selectedMetric} onValueChange={setSelectedMetric}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Focus metric" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="overall">Overall Performance</SelectItem>
            <SelectItem value="ai">AI Performance</SelectItem>
            <SelectItem value="diversity">Diversity Metrics</SelectItem>
            <SelectItem value="skills">Skill Analysis</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white shadow-sm border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Time to Hire</p>
                <p className={`text-2xl font-bold ${getMetricColor(analyticsData.timeToHire, 20)}`}>
                  {analyticsData.timeToHire} days
                </p>
                <p className="text-xs text-gray-500">{getMetricStatus(analyticsData.timeToHire, 20)}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Cost per Hire</p>
                <p className={`text-2xl font-bold ${getMetricColor(analyticsData.costPerHire, 5000)}`}>
                  ${analyticsData.costPerHire.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">{getMetricStatus(analyticsData.costPerHire, 5000)}</p>
              </div>
              <Award className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">AI Accuracy</p>
                <p className={`text-2xl font-bold ${getMetricColor(analyticsData.aiAccuracy, 90)}`}>
                  {analyticsData.aiAccuracy}%
                </p>
                <p className="text-xs text-gray-500">{getMetricStatus(analyticsData.aiAccuracy, 90)}</p>
              </div>
              <Brain className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Automation Efficiency</p>
                <p className={`text-2xl font-bold ${getMetricColor(analyticsData.automationEfficiency, 85)}`}>
                  {analyticsData.automationEfficiency}%
                </p>
                <p className="text-xs text-gray-500">{getMetricStatus(analyticsData.automationEfficiency, 85)}</p>
              </div>
              <Zap className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Performance Metrics */}
      <Card className="bg-white shadow-sm border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            AI Performance Metrics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">AI Accuracy by Function</h4>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span>Resume Parsing</span>
                    <span className="font-semibold text-green-600">94%</span>
                  </div>
                  <Progress value={94} className="h-2" />
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span>Skill Matching</span>
                    <span className="font-semibold text-blue-600">89%</span>
                  </div>
                  <Progress value={89} className="h-2" />
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span>Interview Scoring</span>
                    <span className="font-semibold text-purple-600">92%</span>
                  </div>
                  <Progress value={92} className="h-2" />
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span>Culture Fit</span>
                    <span className="font-semibold text-orange-600">87%</span>
                  </div>
                  <Progress value={87} className="h-2" />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Automation Impact</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Time Saved</span>
                  <span className="font-semibold text-green-600">65%</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Cost Reduction</span>
                  <span className="font-semibold text-blue-600">42%</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Quality Improvement</span>
                  <span className="font-semibold text-purple-600">28%</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Candidate Experience</span>
                  <span className="font-semibold text-orange-600">+35%</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Diversity Analytics */}
      <Card className="bg-white shadow-sm border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            Diversity & Inclusion Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <h4 className="font-semibold text-gray-900 mb-4">Gender Distribution</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Male</span>
                  <span className="font-semibold">{analyticsData.diversityMetrics.gender.male}%</span>
                </div>
                <Progress value={analyticsData.diversityMetrics.gender.male} className="h-2" />
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Female</span>
                  <span className="font-semibold">{analyticsData.diversityMetrics.gender.female}%</span>
                </div>
                <Progress value={analyticsData.diversityMetrics.gender.female} className="h-2" />
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Other</span>
                  <span className="font-semibold">{analyticsData.diversityMetrics.gender.other}%</span>
                </div>
                <Progress value={analyticsData.diversityMetrics.gender.other} className="h-2" />
              </div>
            </div>

            <div className="text-center">
              <h4 className="font-semibold text-gray-900 mb-4">Age Distribution</h4>
              <div className="space-y-2">
                {Object.entries(analyticsData.diversityMetrics.age).map(([range, percentage]) => (
                  <div key={range}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{range}</span>
                      <span className="font-semibold">{percentage}%</span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                ))}
              </div>
            </div>

            <div className="text-center">
              <h4 className="font-semibold text-gray-900 mb-4">Geographic Distribution</h4>
              <div className="space-y-2">
                {Object.entries(analyticsData.diversityMetrics.location).map(([type, percentage]) => (
                  <div key={type}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{type}</span>
                      <span className="font-semibold">{percentage}%</span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Skill Gap Analysis */}
      <Card className="bg-white shadow-sm border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-green-600" />
            AI Skill Gap Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analyticsData.skillGaps.slice(0, 8).map((skillGap, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="w-32 text-sm font-medium text-gray-900">{skillGap.skill}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-gray-500">Demand: {skillGap.demand}%</span>
                    <span className="text-xs text-gray-500">Supply: {skillGap.supply}%</span>
                    <span className="text-xs font-semibold text-red-600">Gap: {skillGap.gap}%</span>
                  </div>
                  <div className="flex gap-1">
                    <div 
                      className="h-2 bg-blue-200 rounded-l"
                      style={{ width: `${skillGap.supply}%` }}
                    ></div>
                    <div 
                      className="h-2 bg-red-200 rounded-r"
                      style={{ width: `${skillGap.gap}%` }}
                    ></div>
                  </div>
                </div>
                <Badge variant="secondary" className="w-16 text-center">
                  {skillGap.gap > 20 ? "Critical" : skillGap.gap > 10 ? "High" : "Low"}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Market Trends */}
      <Card className="bg-white shadow-sm border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-orange-600" />
            Market Trends & AI Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {analyticsData.marketTrends.slice(-4).map((trend, index) => (
              <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-lg font-semibold text-gray-900">{trend.month}</div>
                <div className="text-2xl font-bold text-blue-600">{trend.applications.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Applications</div>
                <div className="text-lg font-semibold text-green-600 mt-2">{trend.hires}</div>
                <div className="text-sm text-gray-600">Hires</div>
                <div className={`text-sm font-semibold mt-2 ${getMetricColor(trend.aiScore, 85)}`}>
                  AI: {trend.aiScore}%
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
