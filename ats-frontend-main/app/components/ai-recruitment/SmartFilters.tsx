"use client"

import React from "react"
import { Button } from "../../components/ui/button"
import { Badge } from "../../components/ui/badge"
import { 
  Filter, 
  X, 
  Target, 
  Star, 
  TrendingUp, 
  MapPin,
  Building2,
  Clock,
  Users,
  Zap
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select"

interface FilterOptions {
  status: string
  priority: string
  matchRate: string
  location: string
  company: string
  experience: string
  skills: string[]
  aiScore: string
}

interface SmartFiltersProps {
  filters: FilterOptions
  onFiltersChange: (filters: FilterOptions) => void
}

export default function SmartFilters({ filters, onFiltersChange }: SmartFiltersProps) {
  const updateFilter = (key: keyof FilterOptions, value: string | string[]) => {
    onFiltersChange({
      ...filters,
      [key]: value
    })
  }

  const clearAllFilters = () => {
    onFiltersChange({
      status: "all",
      priority: "all",
      matchRate: "all",
      location: "all",
      company: "all",
      experience: "all",
      skills: [],
      aiScore: "all"
    })
  }

  const hasActiveFilters = () => {
    return Object.values(filters).some(value => 
      value !== "all" && (Array.isArray(value) ? value.length > 0 : true)
    )
  }

  const getActiveFilterCount = () => {
    let count = 0
    Object.values(filters).forEach(value => {
      if (value !== "all" && (Array.isArray(value) ? value.length > 0 : true)) {
        count++
      }
    })
    return count
  }

  return (
    <div className="flex items-center gap-3">
      {/* Status Filter */}
      <Select value={filters.status} onValueChange={(value) => updateFilter("status", value)}>
        <SelectTrigger className="w-32">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            <SelectValue placeholder="Status" />
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="paused">Paused</SelectItem>
          <SelectItem value="closed">Closed</SelectItem>
        </SelectContent>
      </Select>

      {/* Priority Filter */}
      <Select value={filters.priority} onValueChange={(value) => updateFilter("priority", value)}>
        <SelectTrigger className="w-32">
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            <SelectValue placeholder="Priority" />
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Priority</SelectItem>
          <SelectItem value="high">High</SelectItem>
          <SelectItem value="medium">Medium</SelectItem>
          <SelectItem value="low">Low</SelectItem>
        </SelectContent>
      </Select>

      {/* Match Rate Filter */}
      <Select value={filters.matchRate} onValueChange={(value) => updateFilter("matchRate", value)}>
        <SelectTrigger className="w-36">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <SelectValue placeholder="Match Rate" />
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Match Rates</SelectItem>
          <SelectItem value="95">95%+ (Excellent)</SelectItem>
          <SelectItem value="90">90%+ (Very Good)</SelectItem>
          <SelectItem value="80">80%+ (Good)</SelectItem>
          <SelectItem value="70">70%+ (Fair)</SelectItem>
        </SelectContent>
      </Select>

      {/* Location Filter */}
      <Select value={filters.location} onValueChange={(value) => updateFilter("location", value)}>
        <SelectTrigger className="w-36">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <SelectValue placeholder="Location" />
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Locations</SelectItem>
          <SelectItem value="remote">Remote</SelectItem>
          <SelectItem value="new-york">New York</SelectItem>
          <SelectItem value="san-francisco">San Francisco</SelectItem>
          <SelectItem value="london">London</SelectItem>
          <SelectItem value="berlin">Berlin</SelectItem>
        </SelectContent>
      </Select>

      {/* Company Filter */}
      <Select value={filters.company} onValueChange={(value) => updateFilter("company", value)}>
        <SelectTrigger className="w-40">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <SelectValue placeholder="Company" />
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Companies</SelectItem>
          <SelectItem value="tech-giants">Tech Giants</SelectItem>
          <SelectItem value="startups">Startups</SelectItem>
          <SelectItem value="enterprise">Enterprise</SelectItem>
          <SelectItem value="consulting">Consulting</SelectItem>
        </SelectContent>
      </Select>

      {/* Experience Filter */}
      <Select value={filters.experience} onValueChange={(value) => updateFilter("experience", value)}>
        <SelectTrigger className="w-36">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <SelectValue placeholder="Experience" />
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Experience</SelectItem>
          <SelectItem value="entry">Entry Level (0-2)</SelectItem>
          <SelectItem value="mid">Mid Level (3-5)</SelectItem>
          <SelectItem value="senior">Senior (6-10)</SelectItem>
          <SelectItem value="lead">Lead (10+)</SelectItem>
        </SelectContent>
      </Select>

      {/* AI Score Filter */}
      <Select value={filters.aiScore} onValueChange={(value) => updateFilter("aiScore", value)}>
        <SelectTrigger className="w-32">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            <SelectValue placeholder="AI Score" />
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All AI Scores</SelectItem>
          <SelectItem value="95">95%+ (Excellent)</SelectItem>
          <SelectItem value="90">90%+ (Very Good)</SelectItem>
          <SelectItem value="80">80%+ (Good)</SelectItem>
          <SelectItem value="70">70%+ (Fair)</SelectItem>
        </SelectContent>
      </Select>

      {/* Active Filters Display */}
      {hasActiveFilters() && (
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            {getActiveFilterCount()} active
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="h-6 w-6 p-0 hover:bg-gray-100"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Clear All Button */}
      {hasActiveFilters() && (
        <Button
          variant="outline"
          size="sm"
          onClick={clearAllFilters}
          className="text-xs"
        >
          Clear All
        </Button>
      )}
    </div>
  )
}
