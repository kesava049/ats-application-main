"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function EmailAnalyticsPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to email overview as the default view
    router.replace('/analytics/email/overview')
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading Email Analytics...</p>
      </div>
    </div>
  )
}
