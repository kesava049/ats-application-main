"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { getUserInitials } from "../../lib/utils"
import { useCandidateContext } from "../contexts/candidate-context"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Badge } from "../../components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar"
import { Popover, PopoverContent, PopoverTrigger } from "../../components/ui/popover"
import { Input } from "../../components/ui/input"
import { ScrollArea } from "../../components/ui/scroll-area"
import {
  Users,
  Building2,
  Calendar,
  FileText,
  BarChart3,
  Settings,
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
  LogOut,
  Menu,
  X,
  ChevronDown,
  User,
  HelpCircle,
  Sun,
  Moon,
  Monitor
} from "lucide-react"

interface NavigationItem {
  id: string
  label: string
  icon: any
  component?: React.ComponentType<any>
  badge?: string
}

interface NavigationCategory {
  id: string
  label: string
  items: NavigationItem[]
}

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { totalCandidates } = useCandidateContext()
  const [searchTerm, setSearchTerm] = useState("")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [showQuickActions, setShowQuickActions] = useState(true)
  const [userEmail, setUserEmail] = useState("")
  const [userData, setUserData] = useState<any>(null)
  const [isClient, setIsClient] = useState(false)
  const [companyId, setCompanyId] = useState<number | null>(null)
  const [companyName, setCompanyName] = useState<string>("")

  // Mark component as mounted on client
  useEffect(() => {
    setIsClient(true)
    
    // Load user and company data from localStorage
    const user = JSON.parse(localStorage.getItem('ats_user') || 'null');
    if (user) {
      setUserData(user);
      setUserEmail(user.email || '');
      setCompanyId(user.companyId || null);
      setCompanyName(user.company?.name || '');
    }
  }, [])

  // Auth guard - only redirect if not on admin page
  useEffect(() => {
    if (isClient) {
      try {
        const isAuthenticated = localStorage.getItem("authenticated") === "true"
        const isAdminAuthenticated = localStorage.getItem("admin_authenticated") === "true"
        const isAdminPage = pathname === '/admin'
        const isUnifiedLoginPage = pathname === '/unified-login'
        
        // Allow access if user is authenticated OR if it's admin page (admin handles its own auth) OR unified login page
        if (!isAuthenticated && !isAdminAuthenticated && !isAdminPage && !isUnifiedLoginPage) {
          router.replace("/unified-login")
        }
      } catch (error) {
        // Handle localStorage access errors gracefully
      }
    }
  }, [isClient, router, pathname])

  const handleLogout = () => {
    // Clear all authentication data
    localStorage.removeItem("authenticated")
    localStorage.removeItem("auth_email")
    localStorage.removeItem("ats_user")
    
    // Reset component state
    setUserData(null)
    setUserEmail("")
    setCompanyId(null)
    setCompanyName("")
    
    // Redirect to login
    router.replace("/login")
  }

  // Navigation structure
  const navigationCategories: NavigationCategory[] = [
    {
      id: "overview",
      label: "Overview",
      items: [
        { id: "dashboard", label: "Dashboard", icon: Home },
        { id: "analytics", label: "Analytics", icon: BarChart3 },
        { id: "reports", label: "Reports", icon: FileText },
      ],
    },
    {
      id: "recruitment",
      label: "Recruitment",
      items: [
        { id: "candidates", label: "Candidates", icon: Users },
        { id: "jobs", label: "Job Postings", icon: Briefcase },
        { id: "interviews", label: "Interviews", icon: Calendar },
        { id: "pipeline", label: "Pipeline", icon: Target },
      ],
    },
    {
      id: "management",
      label: "Management",
      items: [
        { id: "customers", label: "Customers", icon: Building2 },
        { id: "email-analytics", label: "Email Analytics", icon: Mail },
        { id: "bulk-import", label: "Bulk Import", icon: Upload },
      ],
    },
    {
      id: "recruiter",
      label: "Recruiter Tools",
      items: [
        { id: "ai-analysis", label: "AI Analysis", icon: Brain },
      ],
    },
  ]

  // Color mapping for different navigation items
  const getItemColor = (itemId: string) => {
    const colorMap: { [key: string]: string } = {
      'dashboard': 'blue',
      'analytics': 'purple',
      'reports': 'indigo',
      'candidates': 'green',
      'jobs': 'blue',
      'interviews': 'purple',
      'pipeline': 'orange',
      'customers': 'teal',
      'email-analytics': 'pink',
      'bulk-import': 'amber',
      'ai-analysis': 'violet',
    }
    return colorMap[itemId] || 'gray'
  }

  // Get active tab based on current pathname
  const getActiveTab = () => {
    if (pathname.startsWith('/analytics')) return 'analytics'
    if (pathname === '/dashboard') return 'dashboard'
    if (pathname === '/reports') return 'reports'
    if (pathname === '/candidates') return 'candidates'
    if (pathname === '/jobs') return 'jobs'
    if (pathname === '/interviews') return 'interviews'
    if (pathname === '/pipeline') return 'pipeline'
    if (pathname === '/customers') return 'customers'
    if (pathname.startsWith('/email-analytics')) return 'email-analytics'
    if (pathname === '/bulk-import') return 'bulk-import'
    if (pathname === '/ai-analysis') return 'ai-analysis'
    return 'dashboard'
  }

  const activeTab = getActiveTab()

  if (!isClient) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Check if user is authenticated
  const isAuthenticated = localStorage.getItem("authenticated") === "true"
  const isAdminPage = pathname.startsWith('/admin')
  const isUnifiedLoginPage = pathname === '/unified-login'
  const isPublicPage = pathname === '/' || pathname.startsWith('/apply/') || pathname.startsWith('/job/')

  // If user is on admin page, don't render the sidebar (admin handles its own layout)
  if (isAdminPage) {
    return <>{children}</>
  }

  // If user is on unified login page, don't render the sidebar
  if (isUnifiedLoginPage) {
    return <>{children}</>
  }

  // If user is on public pages, don't render the sidebar
  if (isPublicPage) {
    return <>{children}</>
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar - only show for authenticated users */}
      {isAuthenticated && (
        <div className={`${sidebarCollapsed ? 'w-20' : 'w-64'} bg-white border-r border-gray-200 flex flex-col transition-all duration-300`}>
        {/* Logo */}
        <div className={`${sidebarCollapsed ? 'p-2' : 'p-4'} border-b border-gray-200`}>
          <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'space-x-3'}`}>
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            {!sidebarCollapsed && (
              <div className="min-w-0">
                <h1 className="text-lg font-semibold text-gray-900">APPIT ATS</h1>
                <p className="text-xs text-gray-500">Recruitment Platform</p>
              </div>
            )}
          </div>
        </div>

        {/* Search */}
        {!sidebarCollapsed && (
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        )}

        {/* Navigation */}
        <ScrollArea className={`flex-1 ${sidebarCollapsed ? 'p-2' : 'p-4'}`}>
          <div className="space-y-6">
            {navigationCategories.map((category) => (
              <div key={category.id}>
                {!sidebarCollapsed && (
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    {category.label}
                  </h3>
                )}
                <div className="space-y-1">
                  {category.items.map((item) => {
                    const Icon = item.icon
                    const isActive = activeTab === item.id
                    const color = getItemColor(item.id)
                    
                    const getColorClasses = (color: string, isActive: boolean) => {
                      const colorMap: { [key: string]: { active: string, inactive: string, icon: string } } = {
                        'blue': {
                          active: 'bg-blue-50 text-blue-700 border-r-2 border-blue-700',
                          inactive: 'text-gray-600 hover:bg-blue-50 hover:text-blue-700',
                          icon: 'text-blue-600'
                        },
                        'purple': {
                          active: 'bg-purple-50 text-purple-700 border-r-2 border-purple-700',
                          inactive: 'text-gray-600 hover:bg-purple-50 hover:text-purple-700',
                          icon: 'text-purple-600'
                        },
                        'indigo': {
                          active: 'bg-indigo-50 text-indigo-700 border-r-2 border-indigo-700',
                          inactive: 'text-gray-600 hover:bg-indigo-50 hover:text-indigo-700',
                          icon: 'text-indigo-600'
                        },
                        'green': {
                          active: 'bg-green-50 text-green-700 border-r-2 border-green-700',
                          inactive: 'text-gray-600 hover:bg-green-50 hover:text-green-700',
                          icon: 'text-green-600'
                        },
                        'orange': {
                          active: 'bg-orange-50 text-orange-700 border-r-2 border-orange-700',
                          inactive: 'text-gray-600 hover:bg-orange-50 hover:text-orange-700',
                          icon: 'text-orange-600'
                        },
                        'teal': {
                          active: 'bg-teal-50 text-teal-700 border-r-2 border-teal-700',
                          inactive: 'text-gray-600 hover:bg-teal-50 hover:text-teal-700',
                          icon: 'text-teal-600'
                        },
                        'pink': {
                          active: 'bg-pink-50 text-pink-700 border-r-2 border-pink-700',
                          inactive: 'text-gray-600 hover:bg-pink-50 hover:text-pink-700',
                          icon: 'text-pink-600'
                        },
                        'amber': {
                          active: 'bg-amber-50 text-amber-700 border-r-2 border-amber-700',
                          inactive: 'text-gray-600 hover:bg-amber-50 hover:text-amber-700',
                          icon: 'text-amber-600'
                        },
                        'violet': {
                          active: 'bg-violet-50 text-violet-700 border-r-2 border-violet-700',
                          inactive: 'text-gray-600 hover:bg-violet-50 hover:text-violet-700',
                          icon: 'text-violet-600'
                        },
                        'gray': {
                          active: 'bg-gray-50 text-gray-700 border-r-2 border-gray-700',
                          inactive: 'text-gray-600 hover:bg-gray-50 hover:text-gray-700',
                          icon: 'text-gray-600'
                        }
                      }
                      return colorMap[color] || colorMap['gray']
                    }
                    
                    const colorClasses = getColorClasses(color, isActive)
                    
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          if (item.id === "analytics") {
                            router.push("/analytics")
                          } else if (item.id === "email-analytics") {
                            router.push("/analytics/email")
                          } else {
                            router.push(`/${item.id}`)
                          }
                        }}
                        className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center px-1' : 'space-x-3 px-3'} py-3 text-sm font-semibold rounded-xl transition-all duration-200 hover:scale-105 ${
                          isActive ? colorClasses.active : colorClasses.inactive
                        }`}
                      >
                        <div className={`${sidebarCollapsed ? 'px-2 py-1' : 'p-2'} rounded-lg flex items-center justify-center ${isActive ? 'bg-white shadow-sm' : ''}`}>
                          <Icon className={`${sidebarCollapsed ? 'w-4 h-4' : 'w-5 h-5'} flex-shrink-0 ${isActive ? colorClasses.icon : ''}`} />
                        </div>
                        {!sidebarCollapsed && (
                          <>
                            <span className="flex-1 text-left">{item.label}</span>
                            {item.badge && (
                              <Badge variant="secondary" className="text-xs">
                                {item.badge}
                              </Badge>
                            )}
                          </>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* User Profile */}
        <div className={`${sidebarCollapsed ? 'p-2' : 'p-4'} border-t border-gray-200`}>
          <Popover>
            <PopoverTrigger asChild>
              <button className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center p-2' : 'space-x-3 p-3'} rounded-xl hover:bg-gray-50 transition-all duration-200 hover:shadow-sm group`}>
                <div className="relative">
                  <Avatar className="w-10 h-10 ring-2 ring-gray-200 group-hover:ring-blue-300 transition-all duration-200">
                    <AvatarImage src="/placeholder-user.jpg" />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-semibold">
                      {getUserInitials(userData?.name || "", userEmail || "")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                </div>
                {!sidebarCollapsed && (
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {userData?.name || "User"}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{userEmail}</p>
                  </div>
                )}
                {!sidebarCollapsed && (
                  <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent className="min-w-72 max-w-80 p-0" align="end">
              {/* User Info Section */}
              <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-b border-gray-100">
                <div className="flex items-start space-x-4">
                  <div className="relative">
                    <Avatar className="w-14 h-14 ring-4 ring-white shadow-lg">
                      <AvatarImage src="/placeholder-user.jpg" />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-semibold text-lg">
                        {getUserInitials(userData?.name || "", userEmail || "")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {userData?.name || "User"}
                    </h3>
                    <p className="text-sm text-gray-600 break-all leading-relaxed">
                      {userEmail}
                    </p>
                    <div className="mt-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {companyName || "No Company"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Menu Section */}
              <div className="p-2">
                <div className="space-y-1">
                  <button className="w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-xl transition-all duration-200 hover:shadow-sm">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                      <User className="w-4 h-4 text-gray-600" />
                    </div>
                    <span>Profile Settings</span>
                  </button>
                  
                  <button className="w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-xl transition-all duration-200 hover:shadow-sm">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Settings className="w-4 h-4 text-gray-600" />
                    </div>
                    <span>Preferences</span>
                  </button>
                  
                  <button className="w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-xl transition-all duration-200 hover:shadow-sm">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                      <HelpCircle className="w-4 h-4 text-gray-600" />
                    </div>
                    <span>Help & Support</span>
                  </button>
                </div>

                {/* Divider */}
                <div className="my-3">
                  <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
                </div>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 hover:shadow-sm"
                >
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                    <LogOut className="w-4 h-4 text-red-600" />
                  </div>
                  <span>Sign out</span>
                </button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        </div>
      )}

      {/* Main Content */}
      <div className={`flex-1 flex flex-col overflow-hidden ${!(isAuthenticated || isAdminPage) ? 'ml-0' : ''}`}>
        {/* Header - only show for authenticated users or admin page */}
        {(isAuthenticated || isAdminPage) && (
          <header className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  {sidebarCollapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
                </button>
                <h1 className="text-xl font-semibold text-gray-900">
                  {activeTab === 'dashboard' && 'Dashboard'}
                  {activeTab === 'analytics' && 'Analytics Dashboard'}
                  {activeTab === 'reports' && 'Reports'}
                  {activeTab === 'candidates' && 'Candidates'}
                  {activeTab === 'jobs' && 'Job Postings'}
                  {activeTab === 'interviews' && 'Interviews'}
                  {activeTab === 'pipeline' && 'Pipeline'}
                  {activeTab === 'customers' && 'Customers'}
                  {activeTab === 'email-analytics' && 'Email Analytics'}
                  {activeTab === 'bulk-import' && 'Bulk Import'}
                  {activeTab === 'ai-analysis' && 'AI Analysis'}
                </h1>
              </div>
              <div className="flex items-center space-x-4">
                <Button variant="outline" size="sm">
                  <Bell className="w-4 h-4 mr-2" />
                  Notifications
                </Button>
              </div>
            </div>
          </header>
        )}

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
