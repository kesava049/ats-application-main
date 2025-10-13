"use client"

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import UnifiedLoginForm from '../components/unified-login-form'

export default function UnifiedLoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  // Check for existing sessions on page load
  useEffect(() => {
    const checkExistingSessions = () => {
      if (typeof window !== 'undefined') {
        const userAuth = localStorage.getItem('authenticated') === 'true'
        const userData = localStorage.getItem('ats_user')
        const adminAuth = localStorage.getItem('admin_authenticated') === 'true'
        const adminData = localStorage.getItem('admin_superadmin')

        if (userAuth && userData) {
          // User is logged in, redirect to dashboard
          router.replace('/')
          return
        }

        if (adminAuth && adminData) {
          // Admin is logged in, redirect to admin panel
          router.replace('/admin')
          return
        }
      }
      setIsLoading(false)
    }

    checkExistingSessions()
  }, [router])

  // Handle successful user login
  const handleUserLogin = (userData: any) => {
    router.replace('/')
  }

  // Handle successful admin login
  const handleAdminLogin = (adminData: any) => {
    router.replace('/admin')
  }

  // Show loading state while checking sessions
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Checking Sessions</h2>
          <p className="text-gray-600">Please wait while we check your login status...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-white">A</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">APPIT ATS</h1>
          <p className="text-gray-600">Recruitment Platform</p>
        </div>

        {/* Login Form */}
        <UnifiedLoginForm 
          onUserLogin={handleUserLogin}
          onAdminLogin={handleAdminLogin}
        />

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            Choose your login type to access the appropriate dashboard
          </p>
        </div>
      </div>
    </div>
  )
}
