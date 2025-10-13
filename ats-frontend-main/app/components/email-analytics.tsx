"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Badge } from "../../components/ui/badge"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs"
import { Progress } from "../../components/ui/progress"
import {
  Mail,
  Send,
  Eye,
  TrendingUp,
  Users,
  Calendar,
  Clock,
  Target,
  BarChart3,
  Download,
  Search,
  RefreshCw,
  Brain,
  Globe,
  Briefcase,
  UserCheck,
  Clock3,
  PieChart,
  Activity,
  Building,
} from "lucide-react"
import BASE_API_URL from "../../BaseUrlApi.js"

// Chart.js components
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Line, Bar, Doughnut, Pie } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface EmailAnalyticsData {
  timestamp: string
  period: {
    current: {
      month: string
      year: string
    }
  }
  jobEmails: {
    totalEmails: number
    totalJobs: number
    emailCoverage: string
    emailsThisMonth: number
    emailsThisYear: number
    topEmailDomains: Array<{ email: string; count: number }>
    topCompaniesByEmail: Array<{ company: string; emailCount: number }>
  }
  candidateEmails: {
    totalEmails: number
    totalCandidates: number
    emailCoverage: string
    emailsThisMonth: number
    emailsThisYear: number
    topEmailDomains: Array<{ email: string; count: number }>
    emailByStatus: Array<{ status: string; count: number }>
  }
  customerEmails: {
    totalEmails: number
    totalCustomers: number
    emailCoverage: string
    topEmailDomains: Array<{ email: string; count: number }>
    emailByStatus: Array<{ status: string; count: number }>
    emailByPriority: Array<{ priority: string; count: number }>
  }
  interviewEmails: {
    totalEmails: number
    totalInterviews: number
    emailCoverage: string
    emailsThisMonth: number
    emailByStatus: Array<{ status: string; count: number }>
  }
  timesheetEmails: {
    totalEmails: number
    totalTimesheets: number
    emailCoverage: string
    emailsThisMonth: number
    emailsThisYear: number
    emailByStatus: Array<{ status: string; count: number }>
  }
  trends: {
    monthlyTrend: Array<{ date: string; emailCount: number }>
    topDomains: Array<{ domain: string; count: number }>
    insights: {
      totalUniqueDomains: number
      averageEmailsPerDomain: number
    }
  }
  summary: {
    totalEmailsSent: number
    totalEmailsThisMonth: number | null
    totalEmailsThisYear: number | null
  }
}

interface ApiResponse {
  success: boolean
  message: string
  data: EmailAnalyticsData
}

interface EmailAnalyticsProps {
  defaultTab?: string;
}

export default function EmailAnalytics({ defaultTab = "overview" }: EmailAnalyticsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState(defaultTab)
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [emailData, setEmailData] = useState<EmailAnalyticsData | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle tab changes and update URL
  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    // Update URL to reflect the current tab
    if (router && pathname) {
      const basePath = pathname.replace(/\/[^/]*$/, ''); // Remove the last segment
      router.push(`${basePath}/${newTab}`);
    }
  };

  // Fetch email analytics data
  const fetchEmailAnalytics = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Wait a bit for localStorage to be available
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Get JWT token and company ID from localStorage
      console.log('🔍 Checking localStorage...');
      console.log('🔍 localStorage keys:', Object.keys(localStorage));
      console.log('🔍 ats_token:', localStorage.getItem('ats_token'));
      console.log('🔍 ats_user:', localStorage.getItem('ats_user'));
      
      // Try multiple ways to get the token and user
      const token = localStorage.getItem('ats_token') || localStorage.getItem('token') || localStorage.getItem('auth_token');
      const userString = localStorage.getItem('ats_user') || localStorage.getItem('user') || localStorage.getItem('auth_user');
      const user = userString ? JSON.parse(userString) : null;
      
      // Check if token is in user object
      const tokenFromUser = user?.token;
      const finalToken = token || tokenFromUser;
      const companyId = user?.companyId;
      
      console.log('🔍 Token found:', token ? 'Yes' : 'No');
      console.log('🔍 User found:', user ? 'Yes' : 'No');
      console.log('🔍 Company ID found:', companyId ? 'Yes' : 'No');
      console.log('🔍 Token from user object:', tokenFromUser ? 'Yes' : 'No');
      console.log('🔍 Final token:', finalToken ? 'Yes' : 'No');
      
      console.log('🔍 Email Analytics Debug:', {
        token: token ? 'Present' : 'Missing',
        user: user,
        companyId: companyId,
        tokenFromUser: tokenFromUser ? 'Present' : 'Missing',
        finalToken: finalToken ? 'Present' : 'Missing',
        localStorageKeys: Object.keys(localStorage),
        allLocalStorage: {
          ats_token: localStorage.getItem('ats_token'),
          ats_user: localStorage.getItem('ats_user')
        }
      });
      
      if (!finalToken) {
        console.error('❌ No token found in localStorage');
        console.error('❌ Available localStorage keys:', Object.keys(localStorage));
        console.error('❌ ats_token value:', localStorage.getItem('ats_token'));
        console.error('❌ token from user:', tokenFromUser);
        throw new Error('Authentication required. Please login first.');
      }
      
      if (!companyId) {
        console.error('❌ No companyId found in user object');
        console.error('❌ User object:', user);
        throw new Error('Company ID not found. Please login again.');
      }
      
      // Build API URL
      const apiUrl = `${BASE_API_URL}/email-analytics/`;
      const url = new URL(apiUrl);
      if (companyId) {
        url.searchParams.set('companyId', companyId.toString());
      }
      
      console.log('🔍 Making API request to:', url.toString());
      console.log('🔍 BASE_API_URL:', BASE_API_URL);
      console.log('🔍 Final URL:', url.toString());
      console.log('🔍 Company ID being sent:', companyId);
      console.log('🔍 Token being sent:', finalToken ? 'Present' : 'Missing');
      console.log('🔍 Request headers:', {
        'Authorization': `Bearer ${finalToken}`,
        'Content-Type': 'application/json'
      });
      
      // Test if the URL is accessible
      console.log('🔍 Testing URL accessibility...');
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${finalToken}`,
          'Content-Type': 'application/json'
        }
      })
      
      console.log('🔍 API Response Status:', response.status);
      console.log('🔍 API Response Headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error Response:', errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }
      
      const data: ApiResponse = await response.json()
      console.log('🔍 API Response Data:', data);
      console.log('🔍 API Response Success:', data.success);
      console.log('🔍 API Response Message:', data.message);
      
      if (data.success) {
        setEmailData(data.data)
        console.log('✅ Email analytics data loaded successfully');
        console.log('✅ Data received:', data.data);
      } else {
        console.error('❌ API returned error:', data.message);
        setError(data.message || 'Failed to fetch email analytics data')
      }
    } catch (err) {
      console.error('❌ Error fetching email analytics:', err);
      console.error('❌ Error details:', {
        name: err.name,
        message: err.message,
        stack: err.stack
      });
      
      if (err.name === 'AbortError') {
        setError('Request timeout. Please check your connection and try again.')
      } else if (err.message.includes('Failed to fetch')) {
        setError('Network error. Please check if the backend server is running.')
      } else if (err.message.includes('HTTP error')) {
        setError(`Server error: ${err.message}`)
      } else {
        setError('Failed to connect to the server. Please check your connection.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Check if we're in browser environment
    if (typeof window !== 'undefined') {
      // Test localStorage access
      console.log('🔍 Testing localStorage access...');
      console.log('🔍 localStorage available:', typeof localStorage !== 'undefined');
      console.log('🔍 localStorage keys:', Object.keys(localStorage));
      
      try {
        const testToken = localStorage.getItem('ats_token') || localStorage.getItem('token') || localStorage.getItem('auth_token');
        const testUserString = localStorage.getItem('ats_user') || localStorage.getItem('user') || localStorage.getItem('auth_user');
        const testUser = testUserString ? JSON.parse(testUserString) : null;
        const tokenFromUser = testUser?.token;
        const finalTestToken = testToken || tokenFromUser;
        
        console.log('🔍 localStorage test:', {
          token: testToken ? 'Present' : 'Missing',
          user: testUser ? 'Present' : 'Missing',
          tokenFromUser: tokenFromUser ? 'Present' : 'Missing',
          finalToken: finalTestToken ? 'Present' : 'Missing',
          tokenValue: testToken,
          userValue: testUser,
          companyId: testUser?.companyId
        });
        
        if (finalTestToken && testUser && testUser.companyId) {
          console.log('✅ localStorage data available, calling fetchEmailAnalytics');
          fetchEmailAnalytics()
        } else {
          console.error('❌ localStorage data not available');
          console.error('❌ testToken:', testToken);
          console.error('❌ testUser:', testUser);
          console.error('❌ tokenFromUser:', tokenFromUser);
          console.error('❌ finalTestToken:', finalTestToken);
          setError('Please login to view email analytics');
          setIsLoading(false);
        }
      } catch (error) {
        console.error('❌ localStorage access error:', error);
        setError('Unable to access authentication data');
        setIsLoading(false);
      }
    }
  }, [])

  // Chart configurations
  const getEmailTypeDistributionData = () => {
    if (!emailData) return null

    return {
      labels: ['Job Emails', 'Candidate Emails', 'Customer Emails', 'Interview Emails', 'Timesheet Emails'],
      datasets: [
        {
          data: [
            emailData.jobEmails.totalEmails,
            emailData.candidateEmails.totalEmails,
            emailData.customerEmails.totalEmails,
            emailData.interviewEmails.totalEmails,
            emailData.timesheetEmails.totalEmails,
          ],
          backgroundColor: [
            '#3B82F6', // Blue
            '#10B981', // Green
            '#F59E0B', // Yellow
            '#8B5CF6', // Purple
            '#EF4444', // Red
          ],
          borderColor: [
            '#2563EB',
            '#059669',
            '#D97706',
            '#7C3AED',
            '#DC2626',
          ],
          borderWidth: 2,
        },
      ],
    }
  }

  const getMonthlyTrendData = () => {
    if (!emailData) return null

    const labels = emailData.trends.monthlyTrend.map(item => 
      new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    )
    const data = emailData.trends.monthlyTrend.map(item => item.emailCount)

    return {
      labels,
      datasets: [
        {
          label: 'Emails Sent',
          data,
          borderColor: '#3B82F6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4,
        },
      ],
    }
  }

  const getTopDomainsData = () => {
    if (!emailData) return null

    const labels = emailData.trends.topDomains.map(item => item.domain)
    const data = emailData.trends.topDomains.map(item => item.count)

    return {
      labels,
      datasets: [
        {
          label: 'Email Count',
          data,
          backgroundColor: [
            '#3B82F6',
            '#10B981',
            '#F59E0B',
            '#8B5CF6',
            '#EF4444',
            '#06B6D4',
            '#84CC16',
            '#F97316',
          ],
          borderWidth: 1,
        },
      ],
    }
  }

  const getCandidateStatusData = () => {
    if (!emailData) return null

    return {
      labels: emailData.candidateEmails.emailByStatus.map(item => item.status),
      datasets: [
        {
          data: emailData.candidateEmails.emailByStatus.map(item => item.count),
          backgroundColor: [
            '#10B981', // Green
            '#F59E0B', // Yellow
            '#EF4444', // Red
            '#8B5CF6', // Purple
            '#06B6D4', // Cyan
          ],
          borderWidth: 2,
        },
      ],
    }
  }

  const getCustomerPriorityData = () => {
    if (!emailData) return null

    return {
      labels: emailData.customerEmails.emailByPriority.map(item => item.priority),
      datasets: [
        {
          data: emailData.customerEmails.emailByPriority.map(item => item.count),
          backgroundColor: [
            '#EF4444', // High - Red
            '#F59E0B', // Medium - Yellow
            '#10B981', // Low - Green
          ],
          borderWidth: 2,
        },
      ],
    }
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
    },
  }

  const lineChartOptions = {
    ...chartOptions,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  }

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading Email Analytics...</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading email analytics...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <Mail className="w-12 h-12 mx-auto mb-2" />
            <p className="text-lg font-semibold">Error Loading Data</p>
            <p className="text-sm text-gray-600 mt-2">{error}</p>
          </div>
          <Button onClick={fetchEmailAnalytics} className="bg-blue-600 hover:bg-blue-700">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    )
  }

  if (!emailData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-600">No data available</p>
        </div>
      </div>
    )
  }

  const totalEmails = emailData.summary.totalEmailsSent
  const totalUniqueDomains = emailData.trends.insights.totalUniqueDomains
  const avgEmailsPerDomain = emailData.trends.insights.averageEmailsPerDomain

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Email Analytics Dashboard</h2>
          <p className="text-gray-600">Comprehensive email analytics and insights across all email types</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={fetchEmailAnalytics}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Send className="w-4 h-4 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-blue-600">{totalEmails.toLocaleString()}</p>
                <p className="text-xs text-gray-600">Total Emails</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Building className="w-4 h-4 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-green-600">{emailData.jobEmails.totalJobs}</p>
                <p className="text-xs text-gray-600">Job Emails</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <UserCheck className="w-4 h-4 text-purple-600" />
              <div>
                <p className="text-2xl font-bold text-purple-600">{emailData.candidateEmails.totalCandidates}</p>
                <p className="text-xs text-gray-600">Candidates</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-orange-600" />
              <div>
                <p className="text-2xl font-bold text-orange-600">{emailData.customerEmails.totalCustomers}</p>
                <p className="text-xs text-gray-600">Customers</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <div>
                <p className="text-2xl font-bold text-indigo-600">{emailData.interviewEmails.totalInterviews}</p>
                <p className="text-xs text-gray-600">Interviews</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock3 className="w-4 h-4 text-emerald-600" />
              <div>
                <p className="text-2xl font-bold text-emerald-600">{emailData.timesheetEmails.totalTimesheets}</p>
                <p className="text-xs text-gray-600">Timesheets</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Search analytics data..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Email Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <PieChart className="w-5 h-5 text-blue-600" />
                  <span>Email Distribution by Type</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  {getEmailTypeDistributionData() && (
                    <Pie data={getEmailTypeDistributionData()!} options={chartOptions} />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Monthly Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="w-5 h-5 text-green-600" />
                  <span>Monthly Email Trend</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  {getMonthlyTrendData() && (
                    <Line data={getMonthlyTrendData()!} options={lineChartOptions} />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Top Email Domains */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Globe className="w-5 h-5 text-purple-600" />
                  <span>Top Email Domains</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  {getTopDomainsData() && (
                    <Bar data={getTopDomainsData()!} options={chartOptions} />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Key Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Brain className="w-5 h-5 text-orange-600" />
                  <span>Key Insights</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-700">Total Emails Sent</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">{totalEmails}</p>
                  <p className="text-xs text-blue-500 mt-1">Across all email types</p>
                </div>

                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Globe className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-700">Unique Domains</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600">{totalUniqueDomains}</p>
                  <p className="text-xs text-green-500 mt-1">Email domains used</p>
                </div>

                <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Target className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-medium text-purple-700">Avg Emails/Domain</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-600">{avgEmailsPerDomain.toFixed(1)}</p>
                  <p className="text-xs text-purple-500 mt-1">Average per domain</p>
                </div>

                <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Clock className="w-4 h-4 text-orange-600" />
                    <span className="text-sm font-medium text-orange-700">Last Updated</span>
                  </div>
                  <p className="text-sm text-orange-600">
                    {new Date(emailData.timestamp).toLocaleString()}
                  </p>
                  <p className="text-xs text-orange-500 mt-1">Data freshness</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Trend Chart */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  <span>Email Activity Trend</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-96">
                  {getMonthlyTrendData() && (
                    <Line data={getMonthlyTrendData()!} options={lineChartOptions} />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Top Domains */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Globe className="w-5 h-5 text-green-600" />
                  <span>Top Email Domains</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  {getTopDomainsData() && (
                    <Bar data={getTopDomainsData()!} options={chartOptions} />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Domain Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Brain className="w-5 h-5 text-purple-600" />
                  <span>Domain Insights</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{totalUniqueDomains}</div>
                      <div className="text-sm text-blue-600">Unique Domains</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{avgEmailsPerDomain.toFixed(1)}</div>
                      <div className="text-sm text-green-600">Avg per Domain</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">Top Domains:</h4>
                    <div className="space-y-1">
                      {emailData.trends.topDomains.slice(0, 5).map((domain, index) => (
                        <div key={domain.domain} className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">{domain.domain}</span>
                          <Badge variant="outline">{domain.count} emails</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="breakdown" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Candidate Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <UserCheck className="w-5 h-5 text-green-600" />
                  <span>Candidate Email Status</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  {getCandidateStatusData() && (
                    <Doughnut data={getCandidateStatusData()!} options={chartOptions} />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Customer Priority Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-orange-600" />
                  <span>Customer Email Priority</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  {getCustomerPriorityData() && (
                    <Doughnut data={getCustomerPriorityData()!} options={chartOptions} />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Email Coverage Metrics */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="w-5 h-5 text-blue-600" />
                  <span>Email Coverage Metrics</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{emailData.jobEmails.emailCoverage}%</div>
                    <div className="text-sm text-blue-600">Job Emails</div>
                    <div className="text-xs text-gray-500">{emailData.jobEmails.totalEmails} emails</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{emailData.candidateEmails.emailCoverage}%</div>
                    <div className="text-sm text-green-600">Candidate Emails</div>
                    <div className="text-xs text-gray-500">{emailData.candidateEmails.totalEmails} emails</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">{emailData.customerEmails.emailCoverage}%</div>
                    <div className="text-sm text-orange-600">Customer Emails</div>
                    <div className="text-xs text-gray-500">{emailData.customerEmails.totalEmails} emails</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{emailData.interviewEmails.emailCoverage}%</div>
                    <div className="text-sm text-purple-600">Interview Emails</div>
                    <div className="text-xs text-gray-500">{emailData.interviewEmails.totalEmails} emails</div>
                  </div>
                  <div className="text-center p-4 bg-emerald-50 rounded-lg">
                    <div className="text-2xl font-bold text-emerald-600">{emailData.timesheetEmails.emailCoverage}%</div>
                    <div className="text-sm text-emerald-600">Timesheet Emails</div>
                    <div className="text-xs text-gray-500">{emailData.timesheetEmails.totalEmails} emails</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="details" className="mt-6">
          <div className="space-y-6">
            {/* Job Emails Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Briefcase className="w-5 h-5 text-blue-600" />
                  <span>Job Emails Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Top Email Domains</h4>
                    <div className="space-y-2">
                      {emailData.jobEmails.topEmailDomains.map((domain, index) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <span className="text-sm text-gray-600">{domain.email}</span>
                          <Badge variant="outline">{domain.count}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3">Top Companies</h4>
                    <div className="space-y-2">
                      {emailData.jobEmails.topCompaniesByEmail.map((company, index) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <span className="text-sm text-gray-600">{company.company}</span>
                          <Badge variant="outline">{company.emailCount}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Candidate Emails Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <UserCheck className="w-5 h-5 text-green-600" />
                  <span>Candidate Emails Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Top Email Domains</h4>
                    <div className="space-y-2">
                      {emailData.candidateEmails.topEmailDomains.map((domain, index) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <span className="text-sm text-gray-600">{domain.email}</span>
                          <Badge variant="outline">{domain.count}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3">Email by Status</h4>
                    <div className="space-y-2">
                      {emailData.candidateEmails.emailByStatus.map((status, index) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <span className="text-sm text-gray-600">{status.status}</span>
                          <Badge variant="outline">{status.count}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Customer Emails Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-orange-600" />
                  <span>Customer Emails Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Top Email Domains</h4>
                    <div className="space-y-2">
                      {emailData.customerEmails.topEmailDomains.map((domain, index) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <span className="text-sm text-gray-600">{domain.email}</span>
                          <Badge variant="outline">{domain.count}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3">Email by Status</h4>
                    <div className="space-y-2">
                      {emailData.customerEmails.emailByStatus.map((status, index) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <span className="text-sm text-gray-600">{status.status}</span>
                          <Badge variant="outline">{status.count}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3">Email by Priority</h4>
                    <div className="space-y-2">
                      {emailData.customerEmails.emailByPriority.map((priority, index) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <span className="text-sm text-gray-600">{priority.priority}</span>
                          <Badge variant="outline">{priority.count}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Interview & Timesheet Emails */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Calendar className="w-5 h-5 text-purple-600" />
                    <span>Interview Emails</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {emailData.interviewEmails.emailByStatus.map((status, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-sm text-gray-600">{status.status}</span>
                        <Badge variant="outline">{status.count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock3 className="w-5 h-5 text-emerald-600" />
                    <span>Timesheet Emails</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {emailData.timesheetEmails.emailByStatus.map((status, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-sm text-gray-600">{status.status}</span>
                        <Badge variant="outline">{status.count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
