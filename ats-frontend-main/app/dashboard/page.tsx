"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Badge } from "../../components/ui/badge"
import ProtectedRoute from "../components/protected-route"
import {
  Users,
  Building2,
  Calendar,
  FileText,
  BarChart3,
  Search,
  Bell,
  Plus,
  TrendingUp,
  Clock,
  Mail,
  Video,
  Brain,
  Target,
  Upload,
  ChevronRight,
  Home,
  Briefcase,
  UserCheck,
  Shield,
  Database,
  Rocket,
  Activity,
  IndianRupee,
} from "lucide-react"

function DashboardPageContent() {
  const router = useRouter()
  const [userName, setUserName] = useState("")
  const [userEmail, setUserEmail] = useState("")
  const [userData, setUserData] = useState<any>(null)
  const [currentTime, setCurrentTime] = useState("")
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [greeting, setGreeting] = useState("")
  const [isClient, setIsClient] = useState(false)
  const isFetchingRef = useRef(false)
  const lastDataHashRef = useRef<string | null>(null)
  const hasLoadedRef = useRef(false)

  useEffect(() => {
    // Mark component as mounted on client with a small delay for production
    const timer = setTimeout(() => {
      setIsClient(true)
    }, 0)
    
    // Get user data from localStorage
    if (isClient) {
      try {
        // Load user data from localStorage
        const storedUserData = localStorage.getItem("ats_user")
        if (storedUserData) {
          const user = JSON.parse(storedUserData)
          setUserData(user)
          setUserName(user.name || "User")
          setUserEmail(user.email || "")
        } else {
          // Fallback to email-based name extraction
          const email = localStorage.getItem("auth_email") || ""
          setUserEmail(email)
          const nameFromEmail = email.split("@")[0]
          const formattedName = nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1)
          setUserName(formattedName || "User")
        }
        
        // Time will be set by the live time effect
        
        // Set greeting
        const now = new Date()
        const hour = now.getHours()
        if (hour < 12) setGreeting("Good Morning")
        else if (hour < 17) setGreeting("Good Afternoon")
        else setGreeting("Good Evening")
      } catch (error) {
        // Handle localStorage access errors gracefully
        console.warn("Error accessing localStorage in DashboardOverview:", error)
        setUserName("User")
        setGreeting("Welcome")
      }
    }

    return () => clearTimeout(timer)
  }, [isClient])

  // Live time update effect
  useEffect(() => {
    if (!isClient) return

    // Update time immediately
    const updateTime = () => {
      const now = new Date()
      const timeString = now.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })
      setCurrentTime(timeString)
    }

    // Update time immediately
    updateTime()

    // Set up interval to update time every second
    const timeInterval = setInterval(updateTime, 1000)

    // Cleanup interval on unmount
    return () => clearInterval(timeInterval)
  }, [isClient])

  // Fetch dashboard data with timeout and retry
  const fetchDashboardData = useCallback(async (retryCount = 0) => {
    try {
      if (isFetchingRef.current) return
      isFetchingRef.current = true
      // Only show loader on very first load
      if (!hasLoadedRef.current) {
        setLoading(true)
      }
      setError(null)
        
      // Create AbortController for timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 50000) // 10 second timeout
      
      // Get JWT token from localStorage
      const user = JSON.parse(localStorage.getItem('ats_user') || 'null');
      const token = user?.token;
      
      if (!token) {
        // Clear invalid auth data
        localStorage.removeItem("authenticated")
        localStorage.removeItem("ats_user")
        localStorage.removeItem("auth_email")
        
        // Redirect to login page
        router.push("/unified-login")
        return
      }
      
      const response = await fetch('http://147.93.155.233:5000/api/dashboard', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        if (response.status === 401) {
          // Clear invalid auth data
          localStorage.removeItem("authenticated")
          localStorage.removeItem("ats_user")
          localStorage.removeItem("auth_email")
          
          // Redirect to login page
          router.push("/unified-login")
          return
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json()
      if (data.success) {
        // Compute a stable hash of the payload to avoid unnecessary re-renders
        const payload = data.data
        const nextHash = JSON.stringify(payload)
        if (lastDataHashRef.current !== nextHash) {
          setDashboardData(payload)
          lastDataHashRef.current = nextHash
        }
        if (!hasLoadedRef.current) {
          hasLoadedRef.current = true
          setIsInitialLoad(false)
        }
      } else {
        throw new Error(data.message || 'Failed to fetch dashboard data')
      }
    } catch (err) {
      console.error('Dashboard fetch error:', err)
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          setError('Request timeout. Please check your connection and try again.')
        } else {
          setError(err.message)
        }
      } else {
        setError('An unexpected error occurred')
      }
      
      // Retry logic
      if (retryCount < 2) {
        console.log(`Retrying dashboard fetch... (${retryCount + 1}/2)`)
        setTimeout(() => fetchDashboardData(retryCount + 1), 2000)
      }
    } finally {
      setLoading(false)
      isFetchingRef.current = false
    }
  }, [isClient])

  // Fetch dashboard data on component mount
  useEffect(() => {
    if (isClient) {
      fetchDashboardData()
    }
  }, [isClient, fetchDashboardData])

  // Silent background refetch with jitter
  useEffect(() => {
    if (!isClient) return
    const makeIntervalMs = () => {
      const base = 15000 // 15s
      const jitter = Math.floor(Math.random() * 7000) // +0-7s
      return base + jitter
    }
    let timer: any
    const start = () => {
      clearInterval(timer)
      timer = setInterval(() => {
        fetchDashboardData()
      }, makeIntervalMs())
    }
    start()
    return () => clearInterval(timer)
  }, [isClient, fetchDashboardData])

  if (!isClient) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading Dashboard...</p>
        </div>
      </div>
    )
  }

  if (isInitialLoad && loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-lg">Loading dashboard data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <div>
              <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
              <p className="text-xl text-blue-100">{greeting}, {userName}!</p>
              <p className="text-blue-200 mt-1">Welcome back to your recruitment hub</p>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
              <div className="text-left sm:text-right bg-white/10 backdrop-blur-sm rounded-xl p-4 w-full sm:w-auto">
                <p className="text-sm text-blue-200">Current Time</p>
                <p className="text-2xl font-bold">{currentTime}</p>
              </div>
              <div className="text-left sm:text-right bg-white/10 backdrop-blur-sm rounded-xl p-4 w-full sm:w-auto">
                <p className="text-sm text-blue-200">Email</p>
                <p className="text-sm font-medium truncate max-w-48">{userEmail}</p>
              </div>
              <div className="text-left sm:text-right bg-white/10 backdrop-blur-sm rounded-xl p-4 w-full sm:w-auto">
                <p className="text-sm text-blue-200">Status</p>
                <Badge className="bg-green-500 hover:bg-green-600 text-white border-0 mt-1">
                  <div className="w-2 h-2 bg-green-300 rounded-full mr-2 animate-pulse"></div>
                  Active
                </Badge>
              </div>
            </div>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Jobs Card */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
          <div className="absolute inset-0 bg-white/10"></div>
          <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Total Jobs</CardTitle>
            <div className="p-2 bg-white/20 rounded-lg">
              <Briefcase className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-white mb-1">{dashboardData?.summary?.totalJobs || 0}</div>
            <p className="text-xs text-blue-100">
              {dashboardData?.summary?.activeJobs || 0} active, {dashboardData?.summary?.filledJobs || 0} filled
            </p>
            <div className="mt-3 w-full bg-white/20 rounded-full h-2">
              <div className="bg-white h-2 rounded-full w-0 transition-all duration-1000"></div>
            </div>
          </CardContent>
        </Card>

        {/* Candidates Card */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-green-500 to-emerald-600 border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
          <div className="absolute inset-0 bg-white/10"></div>
          <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Total Candidates</CardTitle>
            <div className="p-2 bg-white/20 rounded-lg">
              <Users className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-white mb-1">{dashboardData?.summary?.totalCandidates || 0}</div>
            <p className="text-xs text-green-100">
              {dashboardData?.summary?.shortlistedCandidates || 0} shortlisted, {dashboardData?.summary?.hiredCandidates || 0} hired
            </p>
            <div className="mt-3 w-full bg-white/20 rounded-full h-2">
              <div className="bg-white h-2 rounded-full w-0 transition-all duration-1000"></div>
            </div>
          </CardContent>
        </Card>

        {/* Interviews Card */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-purple-500 to-violet-600 border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
          <div className="absolute inset-0 bg-white/10"></div>
          <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Total Interviews</CardTitle>
            <div className="p-2 bg-white/20 rounded-lg">
              <Calendar className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-white mb-1">{dashboardData?.summary?.totalInterviews || 0}</div>
            <p className="text-xs text-purple-100">
              {dashboardData?.summary?.scheduledInterviews || 0} scheduled, {dashboardData?.summary?.completedInterviews || 0} completed
            </p>
            <div className="mt-3 w-full bg-white/20 rounded-full h-2">
              <div className="bg-white h-2 rounded-full w-0 transition-all duration-1000"></div>
            </div>
          </CardContent>
        </Card>

        {/* Customers Card */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-orange-500 to-amber-600 border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
          <div className="absolute inset-0 bg-white/10"></div>
          <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Total Customers</CardTitle>
            <div className="p-2 bg-white/20 rounded-lg">
              <Building2 className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-white mb-1">{dashboardData?.summary?.totalCustomers || 0}</div>
            <p className="text-xs text-orange-100">
              {dashboardData?.summary?.activeCustomers || 0} active, {(dashboardData?.summary?.totalCustomers || 0) - (dashboardData?.summary?.activeCustomers || 0)} inactive
            </p>
            <div className="mt-3 w-full bg-white/20 rounded-full h-2">
              <div className="bg-white h-2 rounded-full w-0 transition-all duration-1000"></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-gradient-to-r from-gray-50 to-blue-50 border-0 shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl font-bold text-gray-800">Quick Actions</CardTitle>
          <CardDescription className="text-gray-600">Common tasks and shortcuts to boost your productivity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Button 
              variant="outline" 
              className="h-24 flex flex-col items-center justify-center space-y-3 bg-white hover:bg-blue-50 border-2 hover:border-blue-300 transition-all duration-300 hover:scale-105 hover:shadow-lg group"
              onClick={() => router.push('/candidates')}
            >
              <div className="p-3 bg-blue-100 group-hover:bg-blue-200 rounded-xl transition-colors">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <span className="font-semibold text-gray-700">View Candidates</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-24 flex flex-col items-center justify-center space-y-3 bg-white hover:bg-green-50 border-2 hover:border-green-300 transition-all duration-300 hover:scale-105 hover:shadow-lg group"
              onClick={() => router.push('/jobs')}
            >
              <div className="p-3 bg-green-100 group-hover:bg-green-200 rounded-xl transition-colors">
                <Briefcase className="h-6 w-6 text-green-600" />
              </div>
              <span className="font-semibold text-gray-700">Manage Jobs</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-24 flex flex-col items-center justify-center space-y-3 bg-white hover:bg-purple-50 border-2 hover:border-purple-300 transition-all duration-300 hover:scale-105 hover:shadow-lg group"
              onClick={() => router.push('/interviews')}
            >
              <div className="p-3 bg-purple-100 group-hover:bg-purple-200 rounded-xl transition-colors">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
              <span className="font-semibold text-gray-700">Schedule Interview</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-24 flex flex-col items-center justify-center space-y-3 bg-white hover:bg-orange-50 border-2 hover:border-orange-300 transition-all duration-300 hover:scale-105 hover:shadow-lg group"
              onClick={() => router.push('/analytics')}
            >
              <div className="p-3 bg-orange-100 group-hover:bg-orange-200 rounded-xl transition-colors">
                <BarChart3 className="h-6 w-6 text-orange-600" />
              </div>
              <span className="font-semibold text-gray-700">View Analytics</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        {/* Recent Jobs Card */}
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-0 shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Briefcase className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-gray-800">Recent Jobs</CardTitle>
                <CardDescription className="text-gray-600">Latest job postings and updates</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData?.recent?.jobs?.slice(0, 3).map((job: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-4 bg-white rounded-xl border border-blue-100 hover:shadow-md transition-all duration-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Briefcase className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{job.title}</p>
                      <p className="text-sm text-gray-500">{job.companyName}</p>
                    </div>
                  </div>
                  <Badge 
                    className={`${
                      job.jobStatus === 'ACTIVE' 
                        ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    {job.jobStatus}
                  </Badge>
                </div>
              )) || (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Briefcase className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 font-medium">No recent jobs found</p>
                  <p className="text-sm text-gray-400">Start by creating your first job posting</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Candidates Card */}
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-0 shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-gray-800">Recent Candidates</CardTitle>
                <CardDescription className="text-gray-600">Latest candidate applications</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData?.recent?.applications?.slice(0, 3).map((candidate: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-4 bg-white rounded-xl border border-green-100 hover:shadow-md transition-all duration-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 font-semibold text-sm">
                        {(candidate.firstName + ' ' + candidate.lastName)?.charAt(0) || 'C'}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{candidate.firstName} {candidate.lastName}</p>
                      <p className="text-sm text-gray-500">{candidate.job?.title || 'No job specified'}</p>
                    </div>
                  </div>
                  <Badge 
                    className={`${
                      candidate.status === 'shortlisted' 
                        ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                        : candidate.status === 'hired'
                        ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    {candidate.status}
                  </Badge>
                </div>
              )) || (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 font-medium">No recent candidates found</p>
                  <p className="text-sm text-gray-400">Candidates will appear here as they apply</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardPageContent />
    </ProtectedRoute>
  )
}
