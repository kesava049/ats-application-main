import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Utility function to format email for display
export function formatEmailForDisplay(email: string, maxLength: number = 30): string {
  if (!email) return ""
  
  if (email.length <= maxLength) return email
  
  const [localPart, domain] = email.split('@')
  if (!domain) return email
  
  // If local part is too long, truncate it
  if (localPart.length > maxLength - domain.length - 1) {
    const truncatedLocal = localPart.substring(0, maxLength - domain.length - 4) + "..."
    return `${truncatedLocal}@${domain}`
  }
  
  return email
}

// Utility function to get user initials
export function getUserInitials(name: string, email: string): string {
  if (name && name.trim()) {
    return name.trim().split(' ').map(n => n.charAt(0)).join('').toUpperCase().substring(0, 2)
  }
  if (email && email.trim()) {
    return email.charAt(0).toUpperCase()
  }
  return "U"
}
