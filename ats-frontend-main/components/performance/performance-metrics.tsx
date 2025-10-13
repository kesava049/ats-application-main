"use client"

import { Card, CardContent, CardHeader, CardTitle } from "./card"
import { Badge } from "./badge"
import { Progress } from "./progress"
import {
  Users,
  Calendar,
  CheckCircle,
  IndianRupee,
  Clock,
  TrendingUp,
  Star,
  Target,
  MessageSquare,
  Zap,
} from "lucide-react"
import { type PerformanceMetrics, formatCurrency } from "../../lib/performance-data"

interface KPIGridProps {
  metrics: PerformanceMetrics
}

export function KPIGrid({ metrics }: KPIGridProps) {
  const kpis = [
    {
      title: "Jobs Posted",
      value: metrics.jobsPosted,
      icon: <Users className="w-4 h-4 text-blue-600" />,
      color: "text-blue-600",
      target: 15,
      unit: "",
    },
    {
      title: "Candidates Sourced",
      value: metrics.candidatesSourced,
      icon: <Users className="w-4 h-4 text-green-600" />,
      color: "text-green-600",
      target: 100,
      unit: "",
    },
    {
      title: "Interviews Scheduled",
      value: metrics.interviewsScheduled,
      icon: <Calendar className="w-4 h-4 text-purple-600" />,
      color: "text-purple-600",
      target: 50,
      unit: "",
    },
    {
      title: "Offers Extended",
      value: metrics.offersExtended,
      icon: <CheckCircle className="w-4 h-4 text-orange-600" />,
      color: "text-orange-600",
      target: 10,
      unit: "",
    },
    {
      title: "Successful Hires",
      value: metrics.hiresCompleted,
      icon: <CheckCircle className="w-4 h-4 text-emerald-600" />,
      color: "text-emerald-600",
      target: 8,
      unit: "",
    },
    {
      title: "Revenue Generated",
      value: metrics.totalRevenue,
      icon: <IndianRupee className="w-4 h-4 text-green-600" />,
      color: "text-green-600",
      target: metrics.targetRevenue,
      unit: "$",
      format: "currency",
    },
    {
      title: "Avg. Time to Hire",
      value: metrics.averageTimeToHire,
      icon: <Clock className="w-4 h-4 text-orange-600" />,
      color: "text-orange-600",
      target: 18,
      unit: " days",
      inverse: true,
    },
    {
      title: "Offer Acceptance Rate",
      value: metrics.offerAcceptanceRate,
      icon: <TrendingUp className="w-4 h-4 text-blue-600" />,
      color: "text-blue-600",
      target: 80,
      unit: "%",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {kpis.map((kpi, index) => {
        const progress = kpi.inverse
          ? Math.max(0, ((kpi.target - kpi.value) / kpi.target) * 100)
          : (kpi.value / kpi.target) * 100

        const displayValue = kpi.format === "currency" ? formatCurrency(kpi.value) : `${kpi.value}${kpi.unit}`

        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
              {kpi.icon}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${kpi.color}`}>{displayValue}</div>
              <div className="mt-2">
                <Progress value={Math.min(progress, 100)} className="h-2" />
                <p className="text-xs text-gray-600 mt-1">
                  Target: {kpi.format === "currency" ? formatCurrency(kpi.target) : `${kpi.target}${kpi.unit}`}
                </p>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

interface QualityMetricsProps {
  metrics: PerformanceMetrics
}

export function QualityMetrics({ metrics }: QualityMetricsProps) {
  const qualityMetrics = [
    {
      title: "Candidate Quality Score",
      value: metrics.candidateQualityScore,
      icon: <Star className="w-5 h-5 text-yellow-600" />,
      description: "Average quality rating of sourced candidates",
      max: 10,
    },
    {
      title: "Client Satisfaction Score",
      value: metrics.clientSatisfactionScore,
      icon: <Target className="w-5 h-5 text-green-600" />,
      description: "Client feedback and satisfaction ratings",
      max: 10,
    },
    {
      title: "Response Time",
      value: metrics.responseTime,
      icon: <Zap className="w-5 h-5 text-blue-600" />,
      description: "Average response time to candidates (hours)",
      max: 24,
      unit: "h",
      inverse: true,
    },
    {
      title: "Candidate Engagement",
      value: metrics.candidateEngagementRate,
      icon: <MessageSquare className="w-5 h-5 text-purple-600" />,
      description: "Percentage of engaged candidates in pipeline",
      max: 100,
      unit: "%",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {qualityMetrics.map((metric, index) => {
        const percentage = metric.inverse
          ? Math.max(0, ((metric.max - metric.value) / metric.max) * 100)
          : (metric.value / metric.max) * 100

        const getScoreColor = (value: number, max: number, inverse = false) => {
          const ratio = inverse ? (max - value) / max : value / max
          if (ratio >= 0.8) return "text-green-600"
          if (ratio >= 0.6) return "text-yellow-600"
          return "text-red-600"
        }

        return (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                {metric.icon}
                <span>{metric.title}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div className={`text-3xl font-bold ${getScoreColor(metric.value, metric.max, metric.inverse)}`}>
                  {metric.value}
                  {metric.unit || ""}
                  <span className="text-lg text-gray-500">
                    /{metric.max}
                    {metric.unit || ""}
                  </span>
                </div>
                <Badge
                  className={
                    percentage >= 80
                      ? "bg-green-100 text-green-800"
                      : percentage >= 60
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                  }
                >
                  {percentage.toFixed(0)}%
                </Badge>
              </div>
              <Progress value={percentage} className="h-2 mb-2" />
              <p className="text-sm text-gray-600">{metric.description}</p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
