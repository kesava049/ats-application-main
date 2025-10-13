"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'

interface CandidateContextType {
  totalCandidates: number
  updateCandidateCount: (count: number) => void
  incrementCandidateCount: () => void
  decrementCandidateCount: () => void
}

const CandidateContext = createContext<CandidateContextType | undefined>(undefined)

export function CandidateProvider({ children }: { children: React.ReactNode }) {
  const [totalCandidates, setTotalCandidates] = useState(0)

  const updateCandidateCount = (count: number) => {
    setTotalCandidates(count)
  }

  const incrementCandidateCount = () => {
    setTotalCandidates(prev => prev + 1)
  }

  const decrementCandidateCount = () => {
    setTotalCandidates(prev => Math.max(0, prev - 1))
  }

  // Fetch initial candidate count on mount
  useEffect(() => {
    const fetchInitialCount = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('ats_user') || 'null')
        const token = user?.token
        const companyId = user?.companyId

        if (!token || !companyId) return

        const response = await fetch(`http://localhost:5000/api/candidates?limit=1`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          const data = await response.json()
          if (data.success && data.data) {
            setTotalCandidates(data.data.total || 0)
          }
        }
      } catch (error) {
        console.error('Error fetching initial candidate count:', error)
      }
    }

    fetchInitialCount()
  }, [])

  return (
    <CandidateContext.Provider value={{
      totalCandidates,
      updateCandidateCount,
      incrementCandidateCount,
      decrementCandidateCount
    }}>
      {children}
    </CandidateContext.Provider>
  )
}

export function useCandidateContext() {
  const context = useContext(CandidateContext)
  if (context === undefined) {
    throw new Error('useCandidateContext must be used within a CandidateProvider')
  }
  return context
}
