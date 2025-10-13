"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Badge } from "../../components/ui/badge"
import { Button } from "../../components/ui/button"
import {
  Users,
  Briefcase,
  Building2,
  TrendingUp,
  IndianRupee,
  Clock,
  Shield,
  Activity,
  AlertTriangle,
  CheckCircle,
  Rocket,
} from "lucide-react"

interface AdminDashboardProps {
  currentUser: any
}

export default function AdminDashboard({ currentUser }: AdminDashboardProps) {
  return (
    <div className="flex items-center justify-center min-h-[600px]">
      <div className="text-center">
        <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <Rocket className="w-12 h-12 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Coming Soon</h1>
        <p className="text-xl text-gray-600 mb-8">Admin Dashboard features are under development</p>
        <div className="flex items-center justify-center space-x-4">
          <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse"></div>
          <span className="text-sm text-gray-500">We're working hard to bring you amazing admin features</span>
        </div>
      </div>
    </div>
  )
}
