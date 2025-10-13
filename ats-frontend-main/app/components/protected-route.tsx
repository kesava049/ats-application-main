"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { isTokenValid } from "../../lib/auth-error-handler"

interface ProtectedRouteProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export default function ProtectedRoute({ 
  children, 
  fallback 
}: ProtectedRouteProps) {
  const router = useRouter()
  const [isClient, setIsClient] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (isClient) {
      try {
        const authStatus = localStorage.getItem("authenticated") === "true"
        const userData = localStorage.getItem("ats_user")
        
        if (authStatus && userData) {
          // Parse user data to check token validity
          try {
            const user = JSON.parse(userData)
            
            // Check if token exists and is valid (not expired)
            if (user.token && isTokenValid(user.token)) {
              setIsAuthenticated(true)
            } else {
              // Token is expired or invalid
              console.warn("Token expired or invalid, redirecting to login")
              setIsAuthenticated(false)
              // Clear stale data
              localStorage.removeItem("authenticated")
              localStorage.removeItem("ats_user")
              localStorage.removeItem("auth_email")
              // Redirect to login
              router.replace("/login")
            }
          } catch (parseError) {
            console.error("Error parsing user data:", parseError)
            setIsAuthenticated(false)
            // Clear invalid data
            localStorage.removeItem("authenticated")
            localStorage.removeItem("ats_user")
            localStorage.removeItem("auth_email")
          }
        } else {
          setIsAuthenticated(false)
          // Clear any stale data
          localStorage.removeItem("authenticated")
          localStorage.removeItem("ats_user")
          localStorage.removeItem("auth_email")
        }
      } catch (error) {
        console.error("Error checking authentication:", error)
        setIsAuthenticated(false)
      } finally {
        setIsLoading(false)
      }
    }
  }, [isClient, router])

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

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    if (fallback) {
      return <>{fallback}</>
    }
    router.replace("/login")
    return null
  }

  // Render protected content
  return <>{children}</>
}
