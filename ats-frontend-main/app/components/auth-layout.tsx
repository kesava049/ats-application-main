"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [isClient, setIsClient] = useState(false)

  // Mark component as mounted on client
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Check if user is already authenticated
  useEffect(() => {
    if (isClient) {
      try {
        const isAuthenticated = localStorage.getItem("authenticated") === "true"
        if (isAuthenticated) {
          router.replace("/dashboard")
        }
      } catch (error) {
        // Handle localStorage access errors gracefully
      }
    }
  }, [isClient, router])

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="w-full">
        {children}
      </div>
    </div>
  )
}
