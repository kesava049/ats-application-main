"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./card"
import { Button } from "./button"
import { Badge } from "./badge"
import { Avatar, AvatarFallback, AvatarImage } from "./avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs"
import { ArrowLeft, Mail, Award, TrendingUp, Target, Clock, Users, Star } from "lucide-react"
import {
  MOCK_PERFORMANCE_DATA,
  calculatePerformanceScore,
  getPerformanceRating,
  formatCurrency,
  formatPercentage,
} from "../../lib/performance-data"
import { KPIGrid, QualityMetrics } from "./performance-metrics"
import { TrendChart, ConversionFunnel } from "./performance-charts"
import { MOCK_TREND_DATA } from "../../lib/performance-data"

interface IndividualPerformanceProps {
  recruiterId: string
  onBack: () => void
}

export default function IndividualPerformance({ recruiterId, onBack }: IndividualPerformanceProps) {
  const [selectedPeriod, setSelectedPeriod] = useState("Q1 2024")

  // Get performance data for the specific recruiter
  const performanceData = MOCK_PERFORMANCE_DATA.find((data) => data.recruiterId === recruiterId)

  if (!performanceData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center space-y-4 p-6">
            <Users className="w-12 h-12 text-gray-400" />
            <h3 className="text-lg font-semibold">Recruiter Not Found</h3>
            <p className="text-gray-600 text-center">The requested recruiter's performance data is not available.</p>
            <Button onClick={onBack} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Overview
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const performanceScore = calculatePerformanceScore(performanceData)
  const performanceRating = getPerformanceRating(performanceScore)

  // Calculate some additional insights
  const conversionRate = (performanceData.hiresCompleted / performanceData.applicationsReceived) * 100
  const interviewToOfferRate = (performanceData.offersExtended / performanceData.interviewsConducted) * 100
  const revenuePerApplication = performanceData.totalRevenue / performanceData.applicationsReceived

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center space-x-4">
        <Button onClick={onBack} variant="outline" size="sm">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Individual Performance</h2>
          <p className="text-gray-600">Detailed performance analysis</p>
        </div>
      </div>

      {/* Recruiter Profile Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
            <Avatar className="w-20 h-20">
              <AvatarImage
                src={`/placeholder.svg?height=80&width=80&text=${performanceData.recruiterName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}`}
              />
              <AvatarFallback className="text-lg">
                {performanceData.recruiterName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{performanceData.recruiterName}</h3>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Mail className="w-4 h-4" />
                      <span>{performanceData.recruiterEmail}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Users className="w-4 h-4" />
                      <span>{performanceData.department}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 md:mt-0 text-right">
                  <div className="text-3xl font-bold text-blue-600">{performanceScore.toFixed(1)}</div>
                  <Badge
                    className={`${performanceRating.color.replace("text-", "bg-").replace("-600", "-100")} ${performanceRating.color.replace("-600", "-800")} border-current mt-1`}
                  >
                    {performanceRating.rating}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <Award className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(performanceData.totalRevenue)}</div>
            <p className="text-xs text-gray-600">
              {formatPercentage((performanceData.totalRevenue / performanceData.targetRevenue) * 100)} of target
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatPercentage(conversionRate)}</div>
            <p className="text-xs text-gray-600">Applications to hires</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Time to Hire</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{performanceData.averageTimeToHire} days</div>
            <p className="text-xs text-gray-600">
              {performanceData.previousPeriodComparison.averageTimeToHire > 0 ? "+" : ""}
              {performanceData.previousPeriodComparison.averageTimeToHire} from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Client Satisfaction</CardTitle>
            <Star className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {performanceData.clientSatisfactionScore.toFixed(1)}
            </div>
            <p className="text-xs text-gray-600">Out of 10.0</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analysis Tabs */}
      <Tabs defaultValue="metrics" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="metrics">Key Metrics</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="quality">Quality</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="metrics" className="space-y-6">
          <KPIGrid metrics={performanceData} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ConversionFunnel metrics={performanceData} />

            <Card>
              <CardHeader>
                <CardTitle>Activity Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Jobs Posted</span>
                  <span className="font-semibold">{performanceData.jobsPosted}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Candidates Sourced</span>
                  <span className="font-semibold">{performanceData.candidatesSourced}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Client Meetings</span>
                  <span className="font-semibold">{performanceData.clientMeetings}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Revenue per Hire</span>
                  <span className="font-semibold">{formatCurrency(performanceData.averageRevenuePerHire)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Revenue per Application</span>
                  <span className="font-semibold">{formatCurrency(revenuePerApplication)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <TrendChart
            data={MOCK_TREND_DATA[recruiterId] || MOCK_TREND_DATA["2"]}
            title="12-Month Performance Trends"
            description="Track performance evolution over time"
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Peak Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">March 2024</div>
                <p className="text-sm text-gray-600">Best month for hires</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Growth Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">+18%</div>
                <p className="text-sm text-gray-600">Quarter over quarter</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Consistency</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">High</div>
                <p className="text-sm text-gray-600">Performance stability</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="quality" className="space-y-6">
          <QualityMetrics metrics={performanceData} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Quality Metrics Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Candidate Quality Score</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${performanceData.candidateQualityScore * 10}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold">{performanceData.candidateQualityScore}/10</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm">Client Satisfaction</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${performanceData.clientSatisfactionScore * 10}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold">{performanceData.clientSatisfactionScore}/10</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm">Offer Acceptance Rate</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-purple-600 h-2 rounded-full"
                          style={{ width: `${performanceData.offerAcceptanceRate}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold">{performanceData.offerAcceptanceRate}%</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm">Interview to Offer Rate</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div className="bg-orange-600 h-2 rounded-full" style={{ width: `${interviewToOfferRate}%` }} />
                      </div>
                      <span className="text-sm font-semibold">{interviewToOfferRate.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Strengths</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {performanceData.clientSatisfactionScore >= 8.5 && (
                    <div className="flex items-center space-x-2 p-2 bg-green-50 rounded">
                      <Star className="w-4 h-4 text-green-600" />
                      <span className="text-sm">Excellent client relationships</span>
                    </div>
                  )}
                  {performanceData.offerAcceptanceRate >= 80 && (
                    <div className="flex items-center space-x-2 p-2 bg-blue-50 rounded">
                      <Target className="w-4 h-4 text-blue-600" />
                      <span className="text-sm">High offer acceptance rate</span>
                    </div>
                  )}
                  {performanceData.averageTimeToHire <= 16 && (
                    <div className="flex items-center space-x-2 p-2 bg-purple-50 rounded">
                      <Clock className="w-4 h-4 text-purple-600" />
                      <span className="text-sm">Fast time to hire</span>
                    </div>
                  )}
                  {performanceData.candidateQualityScore >= 8.0 && (
                    <div className="flex items-center space-x-2 p-2 bg-yellow-50 rounded">
                      <Award className="w-4 h-4 text-yellow-600" />
                      <span className="text-sm">High-quality candidate sourcing</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Insights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">Key Strengths</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Consistently exceeds revenue targets</li>
                    <li>• Strong client satisfaction scores</li>
                    <li>• Efficient interview-to-offer conversion</li>
                  </ul>
                </div>

                <div className="p-3 bg-orange-50 rounded-lg">
                  <h4 className="font-semibold text-orange-900 mb-2">Areas for Improvement</h4>
                  <ul className="text-sm text-orange-800 space-y-1">
                    {performanceData.responseTime > 3 && <li>• Reduce candidate response time</li>}
                    {performanceData.candidateEngagementRate < 80 && <li>• Improve candidate engagement strategies</li>}
                    {conversionRate < 6 && <li>• Focus on application quality over quantity</li>}
                  </ul>
                </div>

                <div className="p-3 bg-green-50 rounded-lg">
                  <h4 className="font-semibold text-green-900 mb-2">Recommendations</h4>
                  <ul className="text-sm text-green-800 space-y-1">
                    <li>• Continue leveraging client relationship strengths</li>
                    <li>• Share best practices with team members</li>
                    <li>• Consider mentoring junior recruiters</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Goal Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium">Revenue Target</span>
                      <span className="text-sm">
                        {formatCurrency(performanceData.totalRevenue)} / {formatCurrency(performanceData.targetRevenue)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{
                          width: `${Math.min((performanceData.totalRevenue / performanceData.targetRevenue) * 100, 100)}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium">Hires Target (15)</span>
                      <span className="text-sm">{performanceData.hiresCompleted} / 15</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${Math.min((performanceData.hiresCompleted / 15) * 100, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium">Quality Score Target (8.5)</span>
                      <span className="text-sm">{performanceData.candidateQualityScore} / 8.5</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full"
                        style={{ width: `${Math.min((performanceData.candidateQualityScore / 8.5) * 100, 100)}%` }}
                      />
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
