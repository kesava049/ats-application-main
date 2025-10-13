"use client"

export interface SearchFilters {
  searchTerm: string
  country: string
  city: string
  salaryMin: string
  salaryMax: string
  experience: string
  skills: string[]
  status: string
  priority: string
  source: string
  jobType: string
}

interface AdvancedSearchProps {
  filters: SearchFilters
  onFiltersChange: (filters: SearchFilters) => void
  showSalaryFilter?: boolean
  showExperienceFilter?: boolean
  showSkillsFilter?: boolean
  showStatusFilter?: boolean
  showPriorityFilter?: boolean
  showSourceFilter?: boolean
  showJobTypeFilter?: boolean
  statusOptions?: Array<{ key: string; label: string }>
  className?: string
}

export function AdvancedSearch({ filters, onFiltersChange, className = "" }: AdvancedSearchProps) {
  return null
}

export default AdvancedSearch
