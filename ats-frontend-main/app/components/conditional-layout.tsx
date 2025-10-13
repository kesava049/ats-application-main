"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import ClientLayout from "./client-layout"
import AuthLayout from "./auth-layout"

export default function ConditionalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [isClient, setIsClient] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Mark component as mounted on client
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Check authentication status
  useEffect(() => {
    if (isClient) {
      try {
        const authStatus = localStorage.getItem("authenticated") === "true"
        const userData = localStorage.getItem("ats_user")
        const adminAuthStatus = localStorage.getItem("admin_authenticated") === "true"
        const adminData = localStorage.getItem("admin_superadmin")
        
        // Check for either regular user or admin authentication
        if ((authStatus && userData) || (adminAuthStatus && adminData)) {
          setIsAuthenticated(true)
        } else {
          setIsAuthenticated(false)
        }
      } catch (error) {
        console.error("Error checking authentication:", error)
        setIsAuthenticated(false)
      } finally {
        setIsLoading(false)
      }
    }
  }, [isClient])

  // Show loading state
  if (!isClient || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Determine which layout to use based on path and authentication
  const isAuthPage = pathname === '/login' || pathname === '/auth' || pathname === '/unified-login'
  const isAdminPage = pathname.startsWith('/admin')
  const isPublicPage = pathname === '/' || pathname.startsWith('/apply/') || pathname.startsWith('/job/')

  // Check if user is on admin page
  if (isAdminPage) {
    // Admin pages handle their own layout, don't wrap with ClientLayout
    return <>{children}</>
  }

  // Use AuthLayout for login/auth pages
  if (isAuthPage) {
    return (
      <AuthLayout>
        {children}
      </AuthLayout>
    )
  }

  // For public pages, don't wrap with any layout
  if (isPublicPage) {
    return <>{children}</>
  }

  // Use ClientLayout for authenticated user pages
  if (isAuthenticated) {
    return (
      <ClientLayout>
        {children}
      </ClientLayout>
    )
  }

  // For unauthenticated users trying to access protected pages, redirect to unified login
  if (typeof window !== 'undefined') {
    window.location.href = '/unified-login'
  }
  
  return <>{children}</>
}
