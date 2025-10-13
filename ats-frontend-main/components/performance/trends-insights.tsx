"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs"
import { TrendingUp, TrendingDown, BarChart3, Calendar, Target, Award, AlertTriangle, CheckCircle } from "lucide-react"
import {
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
  Area,
  AreaChart,
  Bar,
  BarChart,
} from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "./chart"
import { type TrendData, MOCK_TREND_DATA, MOCK_PERFORMANCE_DATA, formatCurrency } from "../../lib/performance-data"

export default function TrendsInsights() {
  const [selectedRecruiter, setSelectedRecruiter] = useState("2")
  const [timeRange, setTimeRange] = useState("12months")
  const [selectedMetrics, setSelectedMetrics] = useState(["hiresCompleted", "revenue"])

  const trendData = MOCK_TREND_DATA[selectedRecruiter] || MOCK_TREND_DATA["2"]
  const recruiterData = MOCK_PERFORMANCE_DATA.find((r) => r.recruiterId === selectedRecruiter)

  // Calculate trend insights
  const calculateTrend = (data: TrendData[], metric: keyof TrendData) => {
    if (data.length < 2) return { trend: 0, direction: "stable" }

    const recent = data.slice(-3).reduce((sum, item) => sum + (item[metric] as number), 0) / 3
    const previous = data.slice(-6, -3).reduce((sum, item) => sum + (item[metric] as number), 0) / 3

    const trend = ((recent - previous) / previous) * 100
    const direction = trend > 5 ? "up" : trend < -5 ? "down" : "stable"

    return { trend: Math.abs(trend), direction }
  }

  const hiresTrend = calculateTrend(trendData, "hiresCompleted")
  const revenueTrend = calculateTrend(trendData, "revenue")
  const candidatesTrend = calculateTrend(trendData, "candidates")

  // Seasonal analysis
  const seasonalData = trendData.map((item, index) => ({
    ...item,
    quarter: Math.floor(index / 3) + 1,
    efficiency: item.hiresCompleted > 0 ? item.revenue / item.hiresCompleted : 0,
  }))

  // Performance predictions
  const predictNextMonth = () => {
    if (trendData.length < 3) return null

    const lastThree = trendData.slice(-3)
    const avgHires = lastThree.reduce((sum, item) => sum + item.hiresCompleted, 0) / 3
    const avgRevenue = lastThree.reduce((sum, item) => sum + item.revenue, 0) / 3

    return {
      predictedHires: Math.round(avgHires * 1.1), // 10% growth assumption
      predictedRevenue: Math.round(avgRevenue * 1.1),
    }
  }

  const prediction = predictNextMonth()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Trends & Insights</h2>
          <p className="text-gray-600">Performance trends and predictive analytics</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedRecruiter} onValueChange={setSelectedRecruiter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MOCK_PERFORMANCE_DATA.map((recruiter) => (
                <SelectItem key={recruiter.recruiterId} value={recruiter.recruiterId}>
                  {recruiter.recruiterName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="6months">6 Months</SelectItem>
              <SelectItem value="12months">12 Months</SelectItem>
              <SelectItem value="24months">24 Months</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Trend Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hires Trend</CardTitle>
            {hiresTrend.direction === "up" ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : hiresTrend.direction === "down" ? (
              <TrendingDown className="h-4 w-4 text-red-600" />
            ) : (
              <BarChart3 className="h-4 w-4 text-gray-600" />
            )}
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                hiresTrend.direction === "up"
                  ? "text-green-600"
                  : hiresTrend.direction === "down"
                    ? "text-red-600"
                    : "text-gray-600"
              }`}
            >
              {hiresTrend.direction === "up" ? "+" : hiresTrend.direction === "down" ? "-" : ""}
              {hiresTrend.trend.toFixed(1)}%
            </div>
            <p className="text-xs text-gray-600">Last 3 months vs previous 3</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue Trend</CardTitle>
            {revenueTrend.direction === "up" ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : revenueTrend.direction === "down" ? (
              <TrendingDown className="h-4 w-4 text-red-600" />
            ) : (
              <BarChart3 className="h-4 w-4 text-gray-600" />
            )}
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                revenueTrend.direction === "up"
                  ? "text-green-600"
                  : revenueTrend.direction === "down"
                    ? "text-red-600"
                    : "text-gray-600"
              }`}
            >
              {revenueTrend.direction === "up" ? "+" : revenueTrend.direction === "down" ? "-" : ""}
              {revenueTrend.trend.toFixed(1)}%
            </div>
            <p className="text-xs text-gray-600">Revenue growth trend</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Candidate Flow</CardTitle>
            {candidatesTrend.direction === "up" ? (
              <TrendingUp className="h-4 w-4 text-blue-600" />
            ) : candidatesTrend.direction === "down" ? (
              <TrendingDown className="h-4 w-4 text-red-600" />
            ) : (
              <BarChart3 className="h-4 w-4 text-gray-600" />
            )}
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                candidatesTrend.direction === "up"
                  ? "text-blue-600"
                  : candidatesTrend.direction === "down"
                    ? "text-red-600"
                    : "text-gray-600"
              }`}
            >
              {candidatesTrend.direction === "up" ? "+" : candidatesTrend.direction === "down" ? "-" : ""}
              {candidatesTrend.trend.toFixed(1)}%
            </div>
            <p className="text-xs text-gray-600">Candidate sourcing trend</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="trends" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="trends">Performance Trends</TabsTrigger>
          <TabsTrigger value="seasonal">Seasonal Analysis</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
          <TabsTrigger value="insights">Key Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-6">
          {/* Multi-Metric Trend Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Trends Over Time</CardTitle>
              <p className="text-sm text-gray-600">Track key metrics across multiple months</p>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  hiresCompleted: {
                    label: "Hires",
                    color: "hsl(var(--chart-1))",
                  },
                  revenue: {
                    label: "Revenue",
                    color: "hsl(var(--chart-2))",
                  },
                  candidates: {
                    label: "Candidates",
                    color: "hsl(var(--chart-3))",
                  },
                  interviews: {
                    label: "Interviews",
                    color: "hsl(var(--chart-4))",
                  },
                }}
                className="h-[400px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="hiresCompleted"
                      stroke="var(--color-hiresCompleted)"
                      strokeWidth={2}
                      name="Hires"
                    />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="candidates"
                      stroke="var(--color-candidates)"
                      strokeWidth={2}
                      name="Candidates"
                    />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="interviews"
                      stroke="var(--color-interviews)"
                      strokeWidth={2}
                      name="Interviews"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="revenue"
                      stroke="var(--color-revenue)"
                      strokeWidth={2}
                      name="Revenue ($)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Efficiency Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue per Hire Efficiency</CardTitle>
              <p className="text-sm text-gray-600">Track revenue efficiency over time</p>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  efficiency: {
                    label: "Revenue per Hire",
                    color: "hsl(var(--chart-1))",
                  },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={seasonalData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <ChartTooltip
                      content={<ChartTooltipContent />}
                      formatter={(value: any) => [formatCurrency(value), "Revenue per Hire"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="efficiency"
                      stroke="var(--color-efficiency)"
                      fill="var(--color-efficiency)"
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seasonal" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Seasonal Performance Patterns</CardTitle>
              <p className="text-sm text-gray-600">Identify seasonal trends and patterns</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-4">Monthly Performance Distribution</h4>
                  <ChartContainer
                    config={{
                      hiresCompleted: {
                        label: "Hires",
                        color: "hsl(var(--chart-1))",
                      },
                    }}
                    className="h-[300px]"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={trendData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="hiresCompleted" fill="var(--color-hiresCompleted)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </div>

                <div>
                  <h4 className="font-semibold mb-4">Seasonal Insights</h4>
                  <div className="space-y-4">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-blue-600" />
                        <span className="font-semibold text-blue-900">Peak Season</span>
                      </div>
                      <p className="text-sm text-blue-800 mt-1">
                        {trendData.reduce((max, item) => (item.hiresCompleted > max.hiresCompleted ? item : max)).month}{" "}
                        shows highest activity
                      </p>
                    </div>

                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="w-4 h-4 text-green-600" />
                        <span className="font-semibold text-green-900">Growth Pattern</span>
                      </div>
                      <p className="text-sm text-green-800 mt-1">
                        {hiresTrend.direction === "up"
                          ? "Upward"
                          : hiresTrend.direction === "down"
                            ? "Downward"
                            : "Stable"}{" "}
                        trend in recent months
                      </p>
                    </div>

                    <div className="p-3 bg-yellow-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Target className="w-4 h-4 text-yellow-600" />
                        <span className="font-semibold text-yellow-900">Consistency</span>
                      </div>
                      <p className="text-sm text-yellow-800 mt-1">
                        {trendData.filter((item) => item.hiresCompleted >= 2).length}/{trendData.length} months met
                        minimum targets
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="predictions" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Next Month Predictions</CardTitle>
                <p className="text-sm text-gray-600">Based on recent performance trends</p>
              </CardHeader>
              <CardContent>
                {prediction ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Predicted Hires</span>
                        <span className="text-2xl font-bold text-blue-600">{prediction.predictedHires}</span>
                      </div>
                      <p className="text-sm text-blue-700 mt-1">Based on {hiresTrend.trend.toFixed(1)}% trend</p>
                    </div>

                    <div className="p-4 bg-green-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Predicted Revenue</span>
                        <span className="text-2xl font-bold text-green-600">
                          {formatCurrency(prediction.predictedRevenue)}
                        </span>
                      </div>
                      <p className="text-sm text-green-700 mt-1">Based on {revenueTrend.trend.toFixed(1)}% trend</p>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-semibold mb-2">Confidence Level</h4>
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div className="bg-blue-600 h-2 rounded-full" style={{ width: "75%" }} />
                        </div>
                        <span className="text-sm font-medium">75%</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">Based on historical accuracy</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-600">Insufficient data for predictions</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Recommendations</CardTitle>
                <p className="text-sm text-gray-600">Actionable insights for improvement</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {hiresTrend.direction === "down" && (
                    <div className="p-3 bg-red-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                        <span className="font-semibold text-red-900">Action Required</span>
                      </div>
                      <p className="text-sm text-red-800 mt-1">
                        Hire rate declining. Consider increasing candidate sourcing efforts.
                      </p>
                    </div>
                  )}

                  {revenueTrend.direction === "up" && (
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="font-semibold text-green-900">Strong Performance</span>
                      </div>
                      <p className="text-sm text-green-800 mt-1">
                        Revenue trending upward. Maintain current strategies.
                      </p>
                    </div>
                  )}

                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Target className="w-4 h-4 text-blue-600" />
                      <span className="font-semibold text-blue-900">Optimization</span>
                    </div>
                    <p className="text-sm text-blue-800 mt-1">
                      Focus on months with historically high performance for maximum impact.
                    </p>
                  </div>

                  <div className="p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Award className="w-4 h-4 text-purple-600" />
                      <span className="font-semibold text-purple-900">Best Practice</span>
                    </div>
                    <p className="text-sm text-purple-800 mt-1">
                      Replicate successful patterns from high-performing months.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Strengths</h4>
                    <ul className="space-y-1 text-sm text-gray-700">
                      {recruiterData?.clientSatisfactionScore && recruiterData.clientSatisfactionScore >= 8.5 && (
                        <li>• Excellent client satisfaction scores</li>
                      )}
                      {recruiterData?.offerAcceptanceRate && recruiterData.offerAcceptanceRate >= 80 && (
                        <li>• High offer acceptance rate</li>
                      )}
                      {recruiterData?.averageTimeToHire && recruiterData.averageTimeToHire <= 18 && (
                        <li>• Fast time to hire</li>
                      )}
                      {hiresTrend.direction === "up" && <li>• Consistent hiring growth</li>}
                      {revenueTrend.direction === "up" && <li>• Strong revenue performance</li>}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Areas for Improvement</h4>
                    <ul className="space-y-1 text-sm text-gray-700">
                      {recruiterData?.responseTime && recruiterData.responseTime > 4 && (
                        <li>• Reduce candidate response time</li>
                      )}
                      {recruiterData?.candidateEngagementRate && recruiterData.candidateEngagementRate < 80 && (
                        <li>• Improve candidate engagement</li>
                      )}
                      {hiresTrend.direction === "down" && <li>• Address declining hire rate</li>}
                      {candidatesTrend.direction === "down" && <li>• Increase candidate sourcing</li>}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Trend Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-gray-50 rounded">
                      <div className="text-2xl font-bold text-blue-600">
                        {trendData.reduce((sum, item) => sum + item.hiresCompleted, 0)}
                      </div>
                      <div className="text-sm text-gray-600">Total Hires</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded">
                      <div className="text-2xl font-bold text-green-600">
                        {formatCurrency(trendData.reduce((sum, item) => sum + item.revenue, 0))}
                      </div>
                      <div className="text-sm text-gray-600">Total Revenue</div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Key Metrics</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Average Hires/Month:</span>
                        <span className="font-medium">
                          {(trendData.reduce((sum, item) => sum + item.hiresCompleted, 0) / trendData.length).toFixed(
                            1,
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Average Revenue/Month:</span>
                        <span className="font-medium">
                          {formatCurrency(trendData.reduce((sum, item) => sum + item.revenue, 0) / trendData.length)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Best Month:</span>
                        <span className="font-medium">
                          {
                            trendData.reduce((max, item) => (item.hiresCompleted > max.hiresCompleted ? item : max))
                              .month
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
