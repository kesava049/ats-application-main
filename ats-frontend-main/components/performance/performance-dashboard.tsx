"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./card"
import { Badge } from "./badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs"
import { Avatar, AvatarFallback, AvatarImage } from "./avatar"
import { Users, TrendingUp, Award, Target, IndianRupee, Clock, ArrowUp } from "lucide-react"

import IndividualPerformance from "./individual-performance"
import ComparativeAnalysis from "./comparative-analysis"
import TrendsInsights from "./trends-insights"
import { TrendChart } from "./performance-charts"
import {
  MOCK_PERFORMANCE_DATA,
  MOCK_TREND_DATA,
  calculatePerformanceScore,
  getPerformanceRating,
  formatCurrency,
  formatPercentage,
} from "../../lib/performance-data"

interface PerformanceDashboardProps {
  recruiterId?: string
}

export default function PerformanceDashboard({ recruiterId }: PerformanceDashboardProps) {
  const [selectedView, setSelectedView] = useState<"overview" | "individual" | "comparative" | "trends">("overview")
  const [selectedRecruiter, setSelectedRecruiter] = useState(recruiterId || "2")
  const [selectedPeriod, setSelectedPeriod] = useState("Q1 2024")
  const [individualRecruiter, setIndividualRecruiter] = useState<string | null>(null)

  // Get performance data
  const performanceData = MOCK_PERFORMANCE_DATA || []
  const currentRecruiterData = performanceData.find((data) => data.recruiterId === selectedRecruiter)

  // Calculate team averages
  const teamAverages = {
    hiresCompleted: Math.round(
      performanceData.reduce((sum, data) => sum + (data.hiresCompleted || 0), 0) / performanceData.length,
    ),
    totalRevenue: Math.round(
      performanceData.reduce((sum, data) => sum + (data.totalRevenue || 0), 0) / performanceData.length,
    ),
    averageTimeToHire: Math.round(
      performanceData.reduce((sum, data) => sum + (data.averageTimeToHire || 0), 0) / performanceData.length,
    ),
    offerAcceptanceRate: Math.round(
      performanceData.reduce((sum, data) => sum + (data.offerAcceptanceRate || 0), 0) / performanceData.length,
    ),
  }

  // Get trend data
  const trendData = MOCK_TREND_DATA[selectedRecruiter] || MOCK_TREND_DATA["2"] || []

  // Calculate performance insights
  const topPerformers = performanceData
    .map((data) => ({
      ...data,
      score: calculatePerformanceScore(data),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)

  const handleViewIndividual = (recruiterId: string) => {
    setIndividualRecruiter(recruiterId)
    setSelectedView("individual")
  }

  const handleBackToOverview = () => {
    setIndividualRecruiter(null)
    setSelectedView("overview")
  }

  // If viewing individual performance
  if (selectedView === "individual" && individualRecruiter) {
    return <IndividualPerformance recruiterId={individualRecruiter} onBack={handleBackToOverview} />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Performance Dashboard</h2>
          <p className="text-gray-600">Comprehensive performance analytics and insights</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Q1 2024">Q1 2024</SelectItem>
              <SelectItem value="Q4 2023">Q4 2023</SelectItem>
              <SelectItem value="Q3 2023">Q3 2023</SelectItem>
              <SelectItem value="2023">Full Year 2023</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Navigation Tabs */}
      <Tabs value={selectedView} onValueChange={(value) => setSelectedView(value as any)} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="individual">Individual</TabsTrigger>
          <TabsTrigger value="comparative">Comparative</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Hires</CardTitle>
                <Users className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {performanceData.reduce((sum, data) => sum + (data.hiresCompleted || 0), 0)}
                </div>
                <p className="text-xs text-gray-600">Across all recruiters</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <IndianRupee className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(performanceData.reduce((sum, data) => sum + (data.totalRevenue || 0), 0))}
                </div>
                <p className="text-xs text-gray-600">Generated this period</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Time to Hire</CardTitle>
                <Clock className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{teamAverages.averageTimeToHire} days</div>
                <p className="text-xs text-gray-600">Team average</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Acceptance Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{teamAverages.offerAcceptanceRate}%</div>
                <p className="text-xs text-gray-600">Offer acceptance rate</p>
              </CardContent>
            </Card>
          </div>

          {/* Top Performers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Award className="w-5 h-5 text-yellow-600" />
                <span>Top Performers</span>
              </CardTitle>
              <p className="text-sm text-gray-600">Highest performing recruiters this period</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {topPerformers.map((performer, index) => {
                  const rating = getPerformanceRating(performer.score)
                  return (
                    <div
                      key={performer.recruiterId}
                      className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => handleViewIndividual(performer.recruiterId)}
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            index === 0
                              ? "bg-yellow-100 text-yellow-800"
                              : index === 1
                                ? "bg-gray-100 text-gray-800"
                                : "bg-orange-100 text-orange-800"
                          }`}
                        >
                          {index + 1}
                        </div>
                        <Avatar className="w-10 h-10">
                          <AvatarImage
                            src={`/placeholder.svg?height=40&width=40&text=${performer.recruiterName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}`}
                          />
                          <AvatarFallback>
                            {performer.recruiterName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h4 className="font-semibold">{performer.recruiterName}</h4>
                          <div className="flex items-center space-x-2">
                            <Badge
                              className={`${rating.color.replace("text-", "bg-").replace("-600", "-100")} ${rating.color.replace("-600", "-800")}`}
                            >
                              {performer.score.toFixed(1)}
                            </Badge>
                            <span className="text-sm text-gray-600">{rating.rating}</span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-600">Hires:</span>
                          <span className="font-semibold ml-1">{performer.hiresCompleted}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Revenue:</span>
                          <span className="font-semibold ml-1">{formatCurrency(performer.totalRevenue)}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Team Performance Chart */}
          {trendData.length > 0 && (
            <TrendChart
              data={trendData}
              title="Team Performance Trends"
              description="Monthly performance trends across key metrics"
            />
          )}

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {performanceData.map((data) => {
                    const score = calculatePerformanceScore(data)
                    const rating = getPerformanceRating(score)
                    return (
                      <div key={data.recruiterId} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="text-xs">
                              {data.recruiterName
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{data.recruiterName}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${(score / 10) * 100}%` }} />
                          </div>
                          <span className="text-sm font-semibold w-8">{score.toFixed(1)}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Key Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <ArrowUp className="w-4 h-4 text-green-600" />
                      <span className="font-semibold text-green-900">Strong Performance</span>
                    </div>
                    <p className="text-sm text-green-800 mt-1">
                      {topPerformers[0]?.recruiterName} leads with {topPerformers[0]?.hiresCompleted} hires
                    </p>
                  </div>

                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Target className="w-4 h-4 text-blue-600" />
                      <span className="font-semibold text-blue-900">Revenue Target</span>
                    </div>
                    <p className="text-sm text-blue-800 mt-1">
                      Team is{" "}
                      {formatPercentage(
                        (performanceData.reduce((sum, data) => sum + (data.totalRevenue || 0), 0) /
                          performanceData.reduce((sum, data) => sum + (data.targetRevenue || 0), 0)) *
                          100,
                      )}{" "}
                      of target
                    </p>
                  </div>

                  <div className="p-3 bg-orange-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-orange-600" />
                      <span className="font-semibold text-orange-900">Time to Hire</span>
                    </div>
                    <p className="text-sm text-orange-800 mt-1">
                      Average {teamAverages.averageTimeToHire} days across team
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="individual" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Individual Performance Analysis</CardTitle>
              <p className="text-gray-600">Select a recruiter to view detailed performance metrics</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {performanceData.map((recruiter) => {
                  const score = calculatePerformanceScore(recruiter)
                  const rating = getPerformanceRating(score)
                  return (
                    <div
                      key={recruiter.recruiterId}
                      className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => handleViewIndividual(recruiter.recruiterId)}
                    >
                      <div className="flex items-center space-x-3 mb-3">
                        <Avatar className="w-12 h-12">
                          <AvatarImage
                            src={`/placeholder.svg?height=48&width=48&text=${recruiter.recruiterName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}`}
                          />
                          <AvatarFallback>
                            {recruiter.recruiterName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-semibold">{recruiter.recruiterName}</h4>
                          <Badge
                            className={`${rating.color.replace("text-", "bg-").replace("-600", "-100")} ${rating.color.replace("-600", "-800")}`}
                          >
                            {rating.rating}
                          </Badge>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-600">Score:</span>
                          <span className="font-semibold ml-1">{score.toFixed(1)}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Hires:</span>
                          <span className="font-semibold ml-1">{recruiter.hiresCompleted}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Revenue:</span>
                          <span className="font-semibold ml-1">{formatCurrency(recruiter.totalRevenue)}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Time:</span>
                          <span className="font-semibold ml-1">{recruiter.averageTimeToHire}d</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comparative">
          <ComparativeAnalysis />
        </TabsContent>

        <TabsContent value="trends">
          <TrendsInsights />
        </TabsContent>
      </Tabs>
    </div>
  )
}
