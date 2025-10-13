export const formatDate = (date: string | Date): string => {
  try {
    // Handle both Date objects and string inputs
    const dateObj = typeof date === "string" ? new Date(date) : date

    // Check if the date is valid
    if (isNaN(dateObj.getTime())) {
      return "Invalid Date"
    }

    return dateObj.toISOString().split("T")[0]
  } catch (error) {
    console.error("Error formatting date:", error)
    return "Invalid Date"
  }
}

export const isDateInRange = (date: string | Date, dateFilter: string): boolean => {
  try {
    const dateObj = typeof date === "string" ? new Date(date) : date

    // Handle custom date range format: "custom:startDate:endDate"
    if (dateFilter.startsWith('custom:')) {
      const [, startDateStr, endDateStr] = dateFilter.split(':')
      const startDate = new Date(startDateStr)
      const endDate = new Date(endDateStr)
      
      return dateObj >= startDate && dateObj <= endDate
    }

    // Handle predefined date ranges
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    switch (dateFilter) {
      case "all":
        return true
      case "today":
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)
        return dateObj >= today && dateObj < tomorrow
      case "week":
        const weekRange = getWeekRange(today)
        return dateObj >= weekRange.start && dateObj <= weekRange.end
      case "month":
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
        const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0)
        return dateObj >= monthStart && dateObj <= monthEnd
      case "quarter":
        const quarter = Math.floor(today.getMonth() / 3)
        const quarterStart = new Date(today.getFullYear(), quarter * 3, 1)
        const quarterEnd = new Date(today.getFullYear(), (quarter + 1) * 3, 0)
        return dateObj >= quarterStart && dateObj <= quarterEnd
      case "year":
        const yearStart = new Date(today.getFullYear(), 0, 1)
        const yearEnd = new Date(today.getFullYear(), 11, 31)
        return dateObj >= yearStart && dateObj <= yearEnd
      default:
        return true
    }
  } catch (error) {
    console.error("Error checking date range:", error)
    return false
  }
}

export const parseCustomDateRange = (dateFilter: string): { startDate: Date; endDate: Date } | null => {
  if (dateFilter.startsWith('custom:')) {
    const [, startDateStr, endDateStr] = dateFilter.split(':')
    return {
      startDate: new Date(startDateStr),
      endDate: new Date(endDateStr)
    }
  }
  return null
}

export const getWeekRange = (date: Date): { start: Date; end: Date } => {
  const start = new Date(date)
  const day = start.getDay()
  const diff = start.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is Sunday
  start.setDate(diff)
  start.setHours(0, 0, 0, 0)

  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  end.setHours(23, 59, 59, 999)

  return { start, end }
}

export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

export const addWeeks = (date: Date, weeks: number): Date => {
  return addDays(date, weeks * 7)
}

export const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  )
}

export const formatDateRange = (start: Date, end: Date): string => {
  const startStr = formatDate(start)
  const endStr = formatDate(end)
  return `${startStr} - ${endStr}`
}
