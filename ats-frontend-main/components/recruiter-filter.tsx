"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Users } from "lucide-react"

interface Recruiter {
  id: string
  name: string
  loginName: string
}

interface RecruiterFilterProps {
  value: string
  onValueChange: (value: string) => void
  recruiters: Recruiter[]
}

export function RecruiterFilter({ value, onValueChange, recruiters }: RecruiterFilterProps) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-[160px]">
        <Users className="w-4 h-4 mr-2" />
        <SelectValue placeholder="All Recruiters" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Recruiters</SelectItem>
        {recruiters.map((recruiter) => (
          <SelectItem key={recruiter.id} value={recruiter.id}>
            {recruiter.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
