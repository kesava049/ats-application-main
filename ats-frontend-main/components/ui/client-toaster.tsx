"use client"

import { useEffect, useState } from "react"
import { Toaster } from "./toaster"

export function ClientToaster() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Use requestAnimationFrame to ensure proper hydration timing in production
    const timer = requestAnimationFrame(() => {
      setMounted(true)
    })

    return () => cancelAnimationFrame(timer)
  }, [])

  // Don't render anything during SSR to prevent hydration mismatch
  if (!mounted) {
    return null
  }

  return <Toaster />
}
