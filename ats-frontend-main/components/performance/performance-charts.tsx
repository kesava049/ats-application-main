"use client"

import { Card, CardContent, CardHeader, CardTitle } from "./card"
import { Badge } from "./badge"
import { Line, LineChart, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer, Bar, BarChart } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "./chart"
import type { PerformanceMetrics, TrendData } from "../../lib/performance-data"

interface TrendChartProps {
  data: TrendData[]
  title: string
  description: string
}

export function TrendChart({ data, title, description }: TrendChartProps) {
  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <p className="text-sm text-gray-600">{description}</p>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            hires: {
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
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="hires"
                stroke="var(--color-hires)"
                name="Hires"
                strokeWidth={2}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="candidates"
                stroke="var(--color-candidates)"
                name="Candidates"
                strokeWidth={2}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="interviews"
                stroke="var(--color-interviews)"
                name="Interviews"
                strokeWidth={2}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="revenue"
                stroke="var(--color-revenue)"
                name="Revenue ($)"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

interface ConversionFunnelProps {
  metrics: PerformanceMetrics
}

export function ConversionFunnel({ metrics }: ConversionFunnelProps) {
  const funnelData = [
    { name: "Candidates Sourced", value: metrics.candidatesSourced, color: "#3B82F6" },
    { name: "Interviews Scheduled", value: metrics.interviewsScheduled, color: "#8B5CF6" },
    { name: "Offers Extended", value: metrics.offersExtended, color: "#F59E0B" },
    { name: "Hires Completed", value: metrics.hiresCompleted, color: "#10B981" },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Conversion Funnel</CardTitle>
        <p className="text-sm text-gray-600">Candidate progression through hiring stages</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {funnelData.map((stage, index) => {
            const percentage = index === 0 ? 100 : (stage.value / funnelData[0].value) * 100
            const conversionRate = index > 0 ? (stage.value / funnelData[index - 1].value) * 100 : 100

            return (
              <div key={stage.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{stage.name}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-bold" style={{ color: stage.color }}>
                      {stage.value}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {percentage.toFixed(1)}%
                    </Badge>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="h-3 rounded-full transition-all duration-300"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: stage.color,
                    }}
                  />
                </div>
                {index > 0 && (
                  <p className="text-xs text-gray-600">{conversionRate.toFixed(1)}% conversion from previous stage</p>
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

interface PerformanceComparisonProps {
  currentMetrics: PerformanceMetrics
  teamAverage: {
    hiresCompleted: number
    totalRevenue: number
    averageTimeToHire: number
    offerAcceptanceRate: number
  }
}

export function PerformanceComparison({ currentMetrics, teamAverage }: PerformanceComparisonProps) {
  const comparisonData = [
    {
      metric: "Hires",
      current: currentMetrics.hiresCompleted,
      team: teamAverage.hiresCompleted,
      unit: "",
    },
    {
      metric: "Revenue",
      current: currentMetrics.totalRevenue / 1000,
      team: teamAverage.totalRevenue / 1000,
      unit: "k",
    },
    {
      metric: "Time to Hire",
      current: currentMetrics.averageTimeToHire,
      team: teamAverage.averageTimeToHire,
      unit: " days",
      inverse: true,
    },
    {
      metric: "Offer Accept Rate",
      current: currentMetrics.offerAcceptanceRate,
      team: teamAverage.offerAcceptanceRate,
      unit: "%",
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance vs Team Average</CardTitle>
        <p className="text-sm text-gray-600">Compare your metrics against team benchmarks</p>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            current: {
              label: "Your Performance",
              color: "hsl(var(--chart-1))",
            },
            team: {
              label: "Team Average",
              color: "hsl(var(--chart-2))",
            },
          }}
          className="h-[300px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={comparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="metric" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
              <Bar dataKey="current" fill="var(--color-current)" name="Your Performance" />
              <Bar dataKey="team" fill="var(--color-team)" name="Team Average" />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        <div className="mt-4 space-y-2">
          {comparisonData.map((item, index) => {
            const isAboveAverage = item.inverse ? item.current < item.team : item.current > item.team
            const difference = item.inverse
              ? ((item.team - item.current) / item.team) * 100
              : ((item.current - item.team) / item.team) * 100

            return (
              <div key={index} className="flex items-center justify-between text-sm">
                <span>{item.metric}:</span>
                <div className="flex items-center space-x-2">
                  <span className="font-medium">
                    {item.current}
                    {item.unit} vs {item.team}
                    {item.unit}
                  </span>
                  <Badge className={isAboveAverage ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                    {isAboveAverage ? "+" : ""}
                    {difference.toFixed(1)}%
                  </Badge>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
