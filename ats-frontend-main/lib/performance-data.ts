export interface PerformanceMetrics {
  recruiterId: string
  recruiterName: string
  recruiterEmail: string
  department: string
  period: string
  jobsPosted: number
  candidatesSourced: number
  interviewsScheduled: number
  interviewsConducted: number
  offersExtended: number
  hiresCompleted: number
  totalRevenue: number
  targetRevenue: number
  averageTimeToHire: number
  offerAcceptanceRate: number
  candidateQualityScore: number
  clientSatisfactionScore: number
  responseTime: number
  candidateEngagementRate: number
  pipelineVelocity: number
  pipelineConversionRate: number
  conversionRate: number
  averageRevenuePerHire: number
  clientMeetings: number
  previousPeriodComparison: {
    hiresCompleted: number
    totalRevenue: number
    averageTimeToHire: number
    offerAcceptanceRate: number
  }
}

export interface TrendData {
  month: string
  hiresCompleted: number
  revenue: number
  candidates: number
  interviews: number
  offers: number
}

export const MOCK_PERFORMANCE_DATA: PerformanceMetrics[] = [
  {
    recruiterId: "1",
    recruiterName: "John Doe",
    recruiterEmail: "john.doe@company.com",
    department: "Technology",
    period: "Q1 2024",
    jobsPosted: 12,
    candidatesSourced: 85,
    interviewsScheduled: 45,
    interviewsConducted: 42,
    offersExtended: 8,
    hiresCompleted: 6,
    totalRevenue: 180000,
    targetRevenue: 200000,
    averageTimeToHire: 22,
    offerAcceptanceRate: 75,
    candidateQualityScore: 7.8,
    clientSatisfactionScore: 8.2,
    responseTime: 4.2,
    candidateEngagementRate: 78,
    pipelineVelocity: 85,
    pipelineConversionRate: 14.1,
    conversionRate: 7.1,
    averageRevenuePerHire: 30000,
    clientMeetings: 24,
    previousPeriodComparison: {
      hiresCompleted: 1,
      totalRevenue: 15000,
      averageTimeToHire: -2,
      offerAcceptanceRate: 5,
    },
  },
  {
    recruiterId: "2",
    recruiterName: "Sarah Wilson",
    recruiterEmail: "sarah.wilson@company.com",
    department: "Technology",
    period: "Q1 2024",
    jobsPosted: 15,
    candidatesSourced: 120,
    interviewsScheduled: 68,
    interviewsConducted: 65,
    offersExtended: 12,
    hiresCompleted: 9,
    totalRevenue: 270000,
    targetRevenue: 250000,
    averageTimeToHire: 18,
    offerAcceptanceRate: 83,
    candidateQualityScore: 8.5,
    clientSatisfactionScore: 9.1,
    responseTime: 2.8,
    candidateEngagementRate: 85,
    pipelineVelocity: 92,
    pipelineConversionRate: 13.2,
    conversionRate: 7.5,
    averageRevenuePerHire: 30000,
    clientMeetings: 32,
    previousPeriodComparison: {
      hiresCompleted: 2,
      totalRevenue: 45000,
      averageTimeToHire: -3,
      offerAcceptanceRate: 8,
    },
  },
  {
    recruiterId: "3",
    recruiterName: "Emily Chen",
    recruiterEmail: "emily.chen@company.com",
    department: "Marketing",
    period: "Q1 2024",
    jobsPosted: 18,
    candidatesSourced: 95,
    interviewsScheduled: 52,
    interviewsConducted: 50,
    offersExtended: 10,
    hiresCompleted: 8,
    totalRevenue: 240000,
    targetRevenue: 220000,
    averageTimeToHire: 16,
    offerAcceptanceRate: 80,
    candidateQualityScore: 8.8,
    clientSatisfactionScore: 8.7,
    responseTime: 3.1,
    candidateEngagementRate: 82,
    pipelineVelocity: 88,
    pipelineConversionRate: 15.8,
    conversionRate: 8.4,
    averageRevenuePerHire: 30000,
    clientMeetings: 28,
    previousPeriodComparison: {
      hiresCompleted: 1,
      totalRevenue: 30000,
      averageTimeToHire: -1,
      offerAcceptanceRate: 3,
    },
  },
  {
    recruiterId: "4",
    recruiterName: "David Brown",
    recruiterEmail: "david.brown@company.com",
    department: "Sales",
    period: "Q1 2024",
    jobsPosted: 10,
    candidatesSourced: 65,
    interviewsScheduled: 35,
    interviewsConducted: 32,
    offersExtended: 6,
    hiresCompleted: 4,
    totalRevenue: 120000,
    targetRevenue: 150000,
    averageTimeToHire: 25,
    offerAcceptanceRate: 67,
    candidateQualityScore: 7.2,
    clientSatisfactionScore: 7.8,
    responseTime: 5.5,
    candidateEngagementRate: 72,
    pipelineVelocity: 78,
    pipelineConversionRate: 12.3,
    conversionRate: 6.2,
    averageRevenuePerHire: 30000,
    clientMeetings: 18,
    previousPeriodComparison: {
      hiresCompleted: -1,
      totalRevenue: -15000,
      averageTimeToHire: 3,
      offerAcceptanceRate: -5,
    },
  },
]

export const MOCK_TREND_DATA: Record<string, TrendData[]> = {
  "1": [
    { month: "Jan", hiresCompleted: 2, revenue: 60000, candidates: 28, interviews: 15, offers: 3 },
    { month: "Feb", hiresCompleted: 2, revenue: 60000, candidates: 30, interviews: 16, offers: 2 },
    { month: "Mar", hiresCompleted: 2, revenue: 60000, candidates: 27, interviews: 14, offers: 3 },
    { month: "Apr", hiresCompleted: 3, revenue: 90000, candidates: 32, interviews: 18, offers: 4 },
    { month: "May", hiresCompleted: 1, revenue: 30000, candidates: 25, interviews: 12, offers: 2 },
    { month: "Jun", hiresCompleted: 2, revenue: 60000, candidates: 29, interviews: 15, offers: 3 },
  ],
  "2": [
    { month: "Jan", hiresCompleted: 3, revenue: 90000, candidates: 40, interviews: 22, offers: 4 },
    { month: "Feb", hiresCompleted: 3, revenue: 90000, candidates: 42, interviews: 24, offers: 4 },
    { month: "Mar", hiresCompleted: 3, revenue: 90000, candidates: 38, interviews: 22, offers: 4 },
    { month: "Apr", hiresCompleted: 4, revenue: 120000, candidates: 45, interviews: 26, offers: 5 },
    { month: "May", hiresCompleted: 2, revenue: 60000, candidates: 35, interviews: 18, offers: 3 },
    { month: "Jun", hiresCompleted: 3, revenue: 90000, candidates: 40, interviews: 23, offers: 4 },
  ],
  "3": [
    { month: "Jan", hiresCompleted: 3, revenue: 90000, candidates: 32, interviews: 18, offers: 4 },
    { month: "Feb", hiresCompleted: 2, revenue: 60000, candidates: 30, interviews: 16, offers: 3 },
    { month: "Mar", hiresCompleted: 3, revenue: 90000, candidates: 33, interviews: 18, offers: 3 },
    { month: "Apr", hiresCompleted: 4, revenue: 120000, candidates: 38, interviews: 22, offers: 5 },
    { month: "May", hiresCompleted: 3, revenue: 90000, candidates: 35, interviews: 20, offers: 4 },
    { month: "Jun", hiresCompleted: 2, revenue: 60000, candidates: 28, interviews: 15, offers: 2 },
  ],
  "4": [
    { month: "Jan", hiresCompleted: 1, revenue: 30000, candidates: 22, interviews: 12, offers: 2 },
    { month: "Feb", hiresCompleted: 1, revenue: 30000, candidates: 20, interviews: 11, offers: 2 },
    { month: "Mar", hiresCompleted: 2, revenue: 60000, candidates: 23, interviews: 12, offers: 2 },
    { month: "Apr", hiresCompleted: 2, revenue: 60000, candidates: 25, interviews: 14, offers: 3 },
    { month: "May", hiresCompleted: 1, revenue: 30000, candidates: 18, interviews: 10, offers: 1 },
    { month: "Jun", hiresCompleted: 1, revenue: 30000, candidates: 20, interviews: 11, offers: 2 },
  ],
}

export const calculatePerformanceScore = (metrics: PerformanceMetrics): number => {
  try {
    const weights = {
      hiresCompleted: 0.25,
      offerAcceptanceRate: 0.15,
      candidateQualityScore: 0.15,
      clientSatisfactionScore: 0.15,
      averageTimeToHire: 0.1,
      candidateEngagementRate: 0.1,
      conversionRate: 0.1,
    }

    const normalizedMetrics = {
      hiresCompleted: Math.min((metrics.hiresCompleted || 0) / 10, 1) * 10,
      offerAcceptanceRate: ((metrics.offerAcceptanceRate || 0) / 100) * 10,
      candidateQualityScore: metrics.candidateQualityScore || 0,
      clientSatisfactionScore: metrics.clientSatisfactionScore || 0,
      averageTimeToHire: Math.max(0, (30 - (metrics.averageTimeToHire || 30)) / 30) * 10,
      candidateEngagementRate: ((metrics.candidateEngagementRate || 0) / 100) * 10,
      conversionRate: Math.min((metrics.conversionRate || 0) / 10, 1) * 10,
    }

    return Object.entries(weights).reduce((score, [key, weight]) => {
      const value = normalizedMetrics[key as keyof typeof normalizedMetrics] || 0
      return score + value * weight
    }, 0)
  } catch (error) {
    console.error("Error calculating performance score:", error)
    return 0
  }
}

export const getPerformanceRating = (score: number) => {
  if (score >= 9) return { rating: "Exceptional", color: "text-green-600" }
  if (score >= 8) return { rating: "Excellent", color: "text-blue-600" }
  if (score >= 7) return { rating: "Good", color: "text-purple-600" }
  if (score >= 6) return { rating: "Average", color: "text-yellow-600" }
  return { rating: "Needs Improvement", color: "text-red-600" }
}

export const formatCurrency = (amount: number): string => {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0)
  } catch (error) {
    return `$${amount || 0}`
  }
}

export const formatPercentage = (value: number): string => {
  try {
    return `${(value || 0).toFixed(1)}%`
  } catch (error) {
    return `${value || 0}%`
  }
}
