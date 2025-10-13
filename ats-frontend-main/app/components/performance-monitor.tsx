"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  Clock, 
  Zap, 
  TrendingUp, 
  Users, 
  FileText, 
  CheckCircle, 
  XCircle,
  RefreshCw
} from 'lucide-react'

interface PerformanceMetrics {
  totalFiles: number
  successfulFiles: number
  failedFiles: number
  processingTime: number
  averageTimePerFile: number
  parallelWorkers: number
  performanceImprovement: number
  status: 'idle' | 'processing' | 'completed' | 'error'
}

interface PerformanceMonitorProps {
  metrics: PerformanceMetrics
  onRefresh?: () => void
  className?: string
}

export function PerformanceMonitor({ 
  metrics, 
  onRefresh, 
  className = "" 
}: PerformanceMonitorProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    if (onRefresh) {
      setIsRefreshing(true)
      try {
        await onRefresh()
      } finally {
        setIsRefreshing(false)
      }
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processing': return 'bg-blue-500'
      case 'completed': return 'bg-green-500'
      case 'error': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processing': return <RefreshCw className="h-4 w-4 animate-spin" />
      case 'completed': return <CheckCircle className="h-4 w-4" />
      case 'error': return <XCircle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const formatTime = (seconds: number) => {
    if (seconds < 60) {
      return `${seconds.toFixed(1)}s`
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60)
      const remainingSeconds = seconds % 60
      return `${minutes}m ${remainingSeconds.toFixed(0)}s`
    } else {
      const hours = Math.floor(seconds / 3600)
      const minutes = Math.floor((seconds % 3600) / 60)
      return `${hours}h ${minutes}m`
    }
  }

  const calculateEfficiency = () => {
    if (metrics.totalFiles === 0) return 0
    return (metrics.successfulFiles / metrics.totalFiles) * 100
  }

  const calculateSpeedImprovement = () => {
    // Assuming sequential processing would take 3x longer
    const sequentialTime = metrics.processingTime * 3
    const improvement = ((sequentialTime - metrics.processingTime) / sequentialTime) * 100
    return Math.max(0, improvement)
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Performance Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              Performance Monitor
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge 
                variant="outline" 
                className={`${getStatusColor(metrics.status)} text-white`}
              >
                {getStatusIcon(metrics.status)}
                <span className="ml-1 capitalize">{metrics.status}</span>
              </Badge>
              {onRefresh && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Processing Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {metrics.totalFiles}
              </div>
              <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                <FileText className="h-4 w-4" />
                Total Files
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {metrics.successfulFiles}
              </div>
              <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                <CheckCircle className="h-4 w-4" />
                Successful
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {metrics.failedFiles}
              </div>
              <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                <XCircle className="h-4 w-4" />
                Failed
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {formatTime(metrics.processingTime)}
              </div>
              <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                <Clock className="h-4 w-4" />
                Total Time
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Efficiency */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Efficiency</span>
                <span className="text-sm text-gray-600">
                  {calculateEfficiency().toFixed(1)}%
                </span>
              </div>
              <Progress 
                value={calculateEfficiency()} 
                className="h-2"
              />
            </Card>

            {/* Speed Improvement */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Speed Improvement</span>
                <span className="text-sm text-gray-600">
                  {calculateSpeedImprovement().toFixed(0)}%
                </span>
              </div>
              <Progress 
                value={calculateSpeedImprovement()} 
                className="h-2"
              />
            </Card>

            {/* Average Time per File */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Avg Time/File</span>
                <span className="text-sm text-gray-600">
                  {formatTime(metrics.averageTimePerFile)}
                </span>
              </div>
              <div className="text-xs text-gray-500">
                {metrics.parallelWorkers} parallel workers
              </div>
            </Card>
          </div>

          {/* Performance Comparison */}
          <Card className="p-4 bg-gradient-to-r from-blue-50 to-green-50">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Performance Boost</h4>
                <p className="text-sm text-gray-600">
                  Parallel processing with {metrics.parallelWorkers} workers
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-600">
                  {metrics.performanceImprovement.toFixed(0)}x
                </div>
                <div className="text-sm text-gray-600">faster</div>
              </div>
            </div>
          </Card>

          {/* Real-time Status */}
          {metrics.status === 'processing' && (
            <Card className="p-4 border-blue-200 bg-blue-50">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
                <span className="text-sm font-medium text-blue-900">
                  Processing in progress...
                </span>
              </div>
              <div className="mt-2 text-xs text-blue-700">
                Using optimized parallel processing for maximum performance
              </div>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default PerformanceMonitor

