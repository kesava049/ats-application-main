"use client"

import { useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Calendar as CalendarIcon, X } from "lucide-react"
import { format } from "date-fns"

interface DateFilterProps {
  value: string
  onValueChange: (value: string) => void
}

export function DateFilter({ value, onValueChange }: DateFilterProps) {
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  const handleCustomDateApply = () => {
    if (startDate && endDate) {
      onValueChange(`custom:${startDate}:${endDate}`)
    }
  }

  const clearCustomDate = () => {
    setStartDate("")
    setEndDate("")
    onValueChange("all")
  }

  const handleSelectChange = (newValue: string) => {
    if (newValue !== "custom") {
      onValueChange(newValue)
    }
  }

  return (
    <div className="flex items-center space-x-2">
      <Select value={value === "custom" ? "all" : value} onValueChange={handleSelectChange}>
        <SelectTrigger className="w-[140px] bg-white/80 border-purple-200">
          <CalendarIcon className="w-4 h-4 mr-2" />
          <SelectValue placeholder="Date range" />
        </SelectTrigger>
        <SelectContent side="bottom" className="w-[280px] p-4">
          <SelectItem value="all">All Time</SelectItem>
          <SelectItem value="today">Today</SelectItem>
          <SelectItem value="week">This Week</SelectItem>
          <SelectItem value="month">This Month</SelectItem>
          <SelectItem value="quarter">This Quarter</SelectItem>
          <SelectItem value="year">This Year</SelectItem>
          
          {/* Simple Date Inputs */}
          <div className="border-t pt-4 mt-4">
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={handleCustomDateApply}
                disabled={!startDate || !endDate}
                className="w-full px-3 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Apply Date Range
              </button>
            </div>
          </div>
        </SelectContent>
      </Select>

      {/* Clear Custom Date Button */}
      {value.startsWith('custom:') && (
        <button
          onClick={clearCustomDate}
          className="h-9 px-2 text-red-600 hover:text-red-700"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
