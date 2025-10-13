"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./card"
import { Button } from "./button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select"
import { Badge } from "./badge"
import { Checkbox } from "./checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./table"
import { TrendingUp, TrendingDown, Users, BarChart3, Download } from "lucide-react"
import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "./chart"
import {
  type PerformanceMetrics,
  MOCK_PERFORMANCE_DATA,
  calculatePerformanceScore,
  formatCurrency,
  formatPercentage,
} from "../../lib/performance-data"

export default function ComparativeAnalysis() {
  const [selectedMetric, setSelectedMetric] = useState("hiresCompleted")
  const [selectedRecruiters, setSelectedRecruiters] = useState<string[]>(["2", "3", "4"])
  const [comparisonPeriod, setComparisonPeriod] = useState("Q1 2024")

  const metrics = [
    { value: "hiresCompleted", label: "Hires Completed", format: "number" },
    { value: "totalRevenue", label: "Total Revenue", format: "currency" },
    { value: "applicationsReceived", label: "Applications Received", format: "number" },
    { value: "offerAcceptanceRate", label: "Offer Acceptance Rate", format: "percentage" },
    { value: "averageTimeToHire", label: "Average Time to Hire", format: "number" },
    { value: "candidateQualityScore", label: "Candidate Quality Score", format: "number" },
    { value: "clientSatisfactionScore", label: "Client Satisfaction", format: "number" },
    { value: "pipelineConversionRate", label: "Pipeline Conversion Rate", format: "percentage" },
  ]

  const filteredData = MOCK_PERFORMANCE_DATA.filter((data) => selectedRecruiters.includes(data.recruiterId))

  const formatValue = (value: number, format: string) => {
    switch (format) {
      case "currency":
        return formatCurrency(value)
      case "percentage":
        return formatPercentage(value)
      default:
        return value.toString()
    }
  }

  const getMetricColor = (recruiterId: string) => {
    const colors = {
      "2": "hsl(var(--chart-1))",
      "3": "hsl(var(--chart-2))",
      "4": "hsl(var(--chart-3))",
    }
    return colors[recruiterId as keyof typeof colors] || "hsl(var(--chart-1))"
  }

  const chartData = filteredData.map((data) => ({
    name: data.recruiterName.split(" ")[0],
    [selectedMetric]: data[selectedMetric as keyof PerformanceMetrics] as number,
    recruiterId: data.recruiterId,
  }))

  // Radar chart data for multi-metric comparison
  const radarData = [
    "hiresCompleted",
    "candidateQualityScore",
    "clientSatisfactionScore",
    "offerAcceptanceRate",
    "pipelineConversionRate",
  ].map((metric) => {
    const dataPoint: any = { metric: metric.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase()) }

    filteredData.forEach((recruiter) => {
      let value = recruiter[metric as keyof PerformanceMetrics] as number

      // Normalize values to 0-100 scale for radar chart
      if (metric === "hiresCompleted") value = (value / 20) * 100
      else if (metric === "candidateQualityScore" || metric === "clientSatisfactionScore") value = value * 10

      dataPoint[recruiter.recruiterName.split(" ")[0]] = Math.min(value, 100)
    })

    return dataPoint
  })

  const handleRecruiterToggle = (recruiterId: string) => {
    setSelectedRecruiters((prev) =>
      prev.includes(recruiterId) ? prev.filter((id) => id !== recruiterId) : [...prev, recruiterId],
    )
  }

  const exportComparison = () => {
    const comparisonData = {
      period: comparisonPeriod,
      metric: selectedMetric,
      recruiters: filteredData.map((data) => ({
        name: data.recruiterName,
        value: data[selectedMetric as keyof PerformanceMetrics],
        score: calculatePerformanceScore(data),
      })),
    }

    console.log("Exporting comparison data:", comparisonData)
    alert("Comparison report exported successfully!")
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Comparative Analysis</h2>
          <p className="text-gray-600">Compare recruiter performance across key metrics</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={comparisonPeriod} onValueChange={setComparisonPeriod}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Q1 2024">Q1 2024</SelectItem>
              <SelectItem value="Q4 2023">Q4 2023</SelectItem>
              <SelectItem value="Q3 2023">Q3 2023</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportComparison} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Recruiter Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>Select Recruiters to Compare</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {MOCK_PERFORMANCE_DATA.map((recruiter) => (
              <div key={recruiter.recruiterId} className="flex items-center space-x-3 p-3 border rounded-lg">
                <Checkbox
                  id={recruiter.recruiterId}
                  checked={selectedRecruiters.includes(recruiter.recruiterId)}
                  onCheckedChange={() => handleRecruiterToggle(recruiter.recruiterId)}
                />
                <div className="flex-1">
                  <label htmlFor={recruiter.recruiterId} className="font-medium cursor-pointer">
                    {recruiter.recruiterName}
                  </label>
                  <p className="text-sm text-gray-600">{recruiter.department}</p>
                </div>
                <Badge variant="outline">Score: {calculatePerformanceScore(recruiter).toFixed(1)}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Metric Selection and Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5" />
                <span>Performance Comparison</span>
              </CardTitle>
              <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {metrics.map((metric) => (
                    <SelectItem key={metric.value} value={metric.value}>
                      {metric.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                value: {
                  label: metrics.find((m) => m.value === selectedMetric)?.label || "Value",
                  color: "hsl(var(--chart-1))",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <ChartTooltip
                    content={<ChartTooltipContent />}
                    formatter={(value: any) => [
                      formatValue(value, metrics.find((m) => m.value === selectedMetric)?.format || "number"),
                      metrics.find((m) => m.value === selectedMetric)?.label || "Value",
                    ]}
                  />
                  <Bar dataKey={selectedMetric} fill="var(--color-value)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rankings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredData
                .sort((a, b) => {
                  const aValue = a[selectedMetric as keyof PerformanceMetrics] as number
                  const bValue = b[selectedMetric as keyof PerformanceMetrics] as number

                  // For time to hire, lower is better
                  if (selectedMetric === "averageTimeToHire") {
                    return aValue - bValue
                  }
                  return bValue - aValue
                })
                .map((recruiter, index) => (
                  <div key={recruiter.recruiterId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          index === 0
                            ? "bg-yellow-100 text-yellow-800"
                            : index === 1
                              ? "bg-gray-100 text-gray-800"
                              : "bg-orange-100 text-orange-800"
                        }`}
                      >
                        {index + 1}
                      </div>
                      <span className="font-medium text-sm">{recruiter.recruiterName}</span>
                    </div>
                    <span className="text-sm font-semibold">
                      {formatValue(
                        recruiter[selectedMetric as keyof PerformanceMetrics] as number,
                        metrics.find((m) => m.value === selectedMetric)?.format || "number",
                      )}
                    </span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Multi-Metric Radar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Multi-Metric Performance Radar</CardTitle>
          <p className="text-sm text-gray-600">Compare multiple performance dimensions simultaneously</p>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              Sarah: {
                label: "Sarah Wilson",
                color: "hsl(var(--chart-1))",
              },
              Mike: {
                label: "Mike Johnson",
                color: "hsl(var(--chart-2))",
              },
              Emily: {
                label: "Emily Chen",
                color: "hsl(var(--chart-3))",
              },
            }}
            className="h-[400px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="metric" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                {filteredData.map((recruiter) => (
                  <Radar
                    key={recruiter.recruiterId}
                    name={recruiter.recruiterName.split(" ")[0]}
                    dataKey={recruiter.recruiterName.split(" ")[0]}
                    stroke={getMetricColor(recruiter.recruiterId)}
                    fill={getMetricColor(recruiter.recruiterId)}
                    fillOpacity={0.1}
                    strokeWidth={2}
                  />
                ))}
              </RadarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Detailed Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Metrics Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Recruiter</TableHead>
                <TableHead>Hires</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Conversion Rate</TableHead>
                <TableHead>Time to Hire</TableHead>
                <TableHead>Quality Score</TableHead>
                <TableHead>Client Satisfaction</TableHead>
                <TableHead>Overall Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData
                .sort((a, b) => calculatePerformanceScore(b) - calculatePerformanceScore(a))
                .map((recruiter, index) => {
                  const conversionRate = (recruiter.hiresCompleted / recruiter.applicationsReceived) * 100
                  const overallScore = calculatePerformanceScore(recruiter)

                  return (
                    <TableRow key={recruiter.recruiterId}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div
                            className={`w-4 h-4 rounded-full ${
                              index === 0 ? "bg-yellow-400" : index === 1 ? "bg-gray-400" : "bg-orange-400"
                            }`}
                          />
                          <span className="font-medium">{recruiter.recruiterName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <span>{recruiter.hiresCompleted}</span>
                          {recruiter.previousPeriodComparison.hiresCompleted > 0 && (
                            <TrendingUp className="w-3 h-3 text-green-500" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{formatCurrency(recruiter.totalRevenue)}</TableCell>
                      <TableCell>{formatPercentage(conversionRate)}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <span>{recruiter.averageTimeToHire} days</span>
                          {recruiter.previousPeriodComparison.averageTimeToHire < 0 && (
                            <TrendingDown className="w-3 h-3 text-green-500" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{recruiter.candidateQualityScore.toFixed(1)}</TableCell>
                      <TableCell>{recruiter.clientSatisfactionScore.toFixed(1)}</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            overallScore >= 8.5
                              ? "bg-green-100 text-green-800"
                              : overallScore >= 7.5
                                ? "bg-blue-100 text-blue-800"
                                : overallScore >= 6.5
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                          }
                        >
                          {overallScore.toFixed(1)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )
                })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
