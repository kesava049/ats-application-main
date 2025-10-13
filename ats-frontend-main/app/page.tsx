"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function HomePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuthAndRedirect = () => {
      if (typeof window !== 'undefined') {
        const userAuth = localStorage.getItem('authenticated') === 'true'
        const userData = localStorage.getItem('ats_user')
        const adminAuth = localStorage.getItem('admin_authenticated') === 'true'
        const adminData = localStorage.getItem('admin_superadmin')

        if (userAuth && userData) {
          // User is logged in, redirect to dashboard
          router.replace('/dashboard')
        } else if (adminAuth && adminData) {
          // Admin is logged in, redirect to admin panel
          router.replace('/admin')
        } else {
          // No valid session, redirect to unified login
          router.replace('/unified-login')
        }
      }
      setIsLoading(false)
    }

    checkAuthAndRedirect()
  }, [router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Checking authentication...</p>
        </div>
      </div>
    )
  }

  return null
}