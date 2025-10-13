"use client"

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const checkAdminAuth = () => {
      if (typeof window !== 'undefined') {
        const adminAuth = localStorage.getItem('admin_authenticated') === 'true'
        const adminData = localStorage.getItem('admin_superadmin')
        
        if (adminAuth && adminData) {
          setIsAuthenticated(true)
        } else {
          // Not authenticated as admin, redirect to unified login
          router.replace('/unified-login')
        }
      }
      setIsLoading(false)
    }

    checkAdminAuth()
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Admin Panel</h2>
          <p className="text-gray-600">Please wait while we verify your admin credentials...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  )
}
