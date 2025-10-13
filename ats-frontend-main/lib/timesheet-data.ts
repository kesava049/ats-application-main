export interface TimesheetEntry {
  id: string
  recruiterId: string
  date: string
  hours: number
  entityType: "customer" | "job" | "candidate"
  entityId: string
  taskType: string
  comments: string
  createdAt: string
  updatedAt: string
}

export interface TimesheetWeek {
  recruiterId: string
  weekStart: string
  weekEnd: string
  status: "draft" | "submitted" | "approved" | "rejected"
  entries: TimesheetEntry[]
  approvedAt?: string
  approvedBy?: string
  rejectedAt?: string
  rejectedBy?: string
  rejectionReason?: string
}

export interface Customer {
  id: string
  companyName: string
}

export interface Job {
  id: string
  title: string
}

export interface Candidate {
  id: string
  name: string
}

// Mock data
export const MOCK_CUSTOMERS: Customer[] = [
  { id: "1", companyName: "TechCorp Inc." },
  { id: "2", companyName: "StartupXYZ" },
  { id: "3", companyName: "DataFlow Solutions" },
  { id: "4", companyName: "Innovation Labs" },
  { id: "5", companyName: "Global Systems" },
]

export const MOCK_JOBS: Job[] = [
  { id: "1", title: "Senior Software Engineer" },
  { id: "2", title: "Marketing Manager" },
  { id: "3", title: "Data Scientist" },
  { id: "4", title: "UX Designer" },
  { id: "5", title: "Product Manager" },
]

export const MOCK_CANDIDATES: Candidate[] = [
  { id: "1", name: "John Smith" },
  { id: "2", name: "Sarah Johnson" },
  { id: "3", name: "Michael Chen" },
  { id: "4", name: "Lisa Rodriguez" },
  { id: "5", name: "David Wilson" },
]

export const MOCK_TIMESHEET_DATA: TimesheetEntry[] = [
  {
    id: "1",
    recruiterId: "2",
    date: "2024-01-15",
    hours: 2.5,
    entityType: "customer",
    entityId: "1",
    taskType: "Client Meeting",
    comments: "Initial requirements discussion for new positions",
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-01-15T10:00:00Z",
  },
  {
    id: "2",
    recruiterId: "2",
    date: "2024-01-15",
    hours: 3.0,
    entityType: "job",
    entityId: "1",
    taskType: "Candidate Sourcing",
    comments: "LinkedIn search and outreach for senior engineer role",
    createdAt: "2024-01-15T14:00:00Z",
    updatedAt: "2024-01-15T14:00:00Z",
  },
  {
    id: "3",
    recruiterId: "2",
    date: "2024-01-16",
    hours: 1.5,
    entityType: "candidate",
    entityId: "1",
    taskType: "Screening Call",
    comments: "Phone screening with John Smith - strong technical background",
    createdAt: "2024-01-16T09:00:00Z",
    updatedAt: "2024-01-16T09:00:00Z",
  },
]

// Utility functions
export const getTimesheetByWeek = (recruiterId: string, weekStart: Date, weekEnd: Date): TimesheetWeek => {
  const entries = MOCK_TIMESHEET_DATA.filter((entry) => {
    if (entry.recruiterId !== recruiterId) return false
    const entryDate = new Date(entry.date)
    return entryDate >= weekStart && entryDate <= weekEnd
  })

  return {
    recruiterId,
    weekStart: weekStart.toISOString().split("T")[0],
    weekEnd: weekEnd.toISOString().split("T")[0],
    status: "draft",
    entries,
  }
}

export const calculateWeeklyHours = (entries: TimesheetEntry[]): number => {
  return entries.reduce((total, entry) => total + entry.hours, 0)
}

export const getTimesheetStatus = (timesheet: TimesheetWeek): string => {
  if (timesheet.entries.length === 0) return "draft"
  return timesheet.status
}

export const getTimesheetsByRecruiter = (recruiterId: string): TimesheetWeek[] => {
  // This would typically fetch from an API
  // For now, return mock data
  return []
}

export const submitTimesheet = (timesheet: TimesheetWeek): Promise<TimesheetWeek> => {
  // This would typically make an API call
  return Promise.resolve({
    ...timesheet,
    status: "submitted",
  })
}

export const approveTimesheet = (timesheetId: string, approverId: string): Promise<TimesheetWeek> => {
  // This would typically make an API call
  return Promise.resolve({} as TimesheetWeek)
}

export const rejectTimesheet = (timesheetId: string, rejectorId: string, reason: string): Promise<TimesheetWeek> => {
  // This would typically make an API call
  return Promise.resolve({} as TimesheetWeek)
}
