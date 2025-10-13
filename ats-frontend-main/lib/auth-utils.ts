export interface User {
  id: string
  username: string
  email: string
  firstName: string
  lastName: string
  role: "admin" | "manager" | "user"
  status: "active" | "inactive" | "suspended"
  createdDate: string
  lastLogin: string
  permissions: Permission[]
  recruiterId?: string
  department?: string
  phoneNumber?: string
  profileImage?: string
  managerId?: string
  subordinates?: string[]
  position?: string
  level?: number
  teams?: string[]
  teamIds?: string[] // IDs of teams the user manages or belongs to
  reportingManagerId?: string // For clearer hierarchy
}

export interface Team {
  id: string
  name: string
  managerId: string
  managerName: string
  memberIds: string[]
  department: string
  description?: string
}

export interface UserActivity {
  id: string
  userId: string
  userName: string
  action: string
  entityType: "job" | "candidate" | "customer" | "interview" | "offer" | "hire" | "login" | "logout"
  entityId?: string
  entityName?: string
  timestamp: string
  ipAddress: string
  location?: string
  userAgent: string
  duration?: number // for login sessions
  metadata?: Record<string, any>
}

export interface AIAnalysis {
  id: string
  candidateId: string
  overallScore: number // 0-100
  strengths: string[]
  weaknesses: string[]
  verdict: "highly_recommended" | "recommended" | "consider" | "not_recommended"
  skillsMatch: number // 0-100
  experienceMatch: number // 0-100
  culturalFit: number // 0-100
  analysisDate: string
  jobId: string
  confidence: number // 0-100
  reasoning: string
}

export interface Permission {
  id: string
  name: string
  description: string
  category: "candidates" | "jobs" | "customers" | "reports" | "admin"
  actions: ("create" | "read" | "update" | "delete")[]
}

export interface AuditLog {
  id: string
  userId: string
  userName: string
  action: string
  targetType: "user" | "role" | "permission"
  targetId: string
  targetName: string
  details: string
  timestamp: string
  ipAddress: string
  userAgent: string
}

// Add role hierarchy constants
export const ROLE_HIERARCHY = {
  admin: 3,
  manager: 2,
  user: 1,
} as const

// Enhanced permissions with team-based access
export const TEAM_PERMISSIONS: Permission[] = [
  {
    id: "team-view",
    name: "View Team Data",
    description: "View data for team members",
    category: "admin",
    actions: ["read"],
  },
  {
    id: "team-manage",
    name: "Manage Team",
    description: "Manage team members and assignments",
    category: "admin",
    actions: ["create", "read", "update", "delete"],
  },
  {
    id: "analytics-view",
    name: "View Analytics",
    description: "Access analytics and activity tracking",
    category: "reports",
    actions: ["read"],
  },
  {
    id: "ai-features",
    name: "AI Features",
    description: "Access AI-powered analysis and recommendations",
    category: "candidates",
    actions: ["read"],
  },
]

// Update DEFAULT_PERMISSIONS to include new permissions
export const DEFAULT_PERMISSIONS: Permission[] = [
  {
    id: "candidates-read",
    name: "View Candidates",
    description: "View candidate profiles and information",
    category: "candidates",
    actions: ["read"],
  },
  {
    id: "candidates-manage",
    name: "Manage Candidates",
    description: "Create, edit, and delete candidate profiles",
    category: "candidates",
    actions: ["create", "read", "update", "delete"],
  },
  {
    id: "jobs-read",
    name: "View Jobs",
    description: "View job postings and details",
    category: "jobs",
    actions: ["read"],
  },
  {
    id: "jobs-manage",
    name: "Manage Jobs",
    description: "Create, edit, and delete job postings",
    category: "jobs",
    actions: ["create", "read", "update", "delete"],
  },
  {
    id: "customers-read",
    name: "View Customers",
    description: "View customer profiles and information",
    category: "customers",
    actions: ["read"],
  },
  {
    id: "customers-manage",
    name: "Manage Customers",
    description: "Create, edit, and delete customer profiles",
    category: "customers",
    actions: ["create", "read", "update", "delete"],
  },
  {
    id: "reports-read",
    name: "View Reports",
    description: "Access reports and analytics",
    category: "reports",
    actions: ["read"],
  },
  {
    id: "admin-users",
    name: "User Management",
    description: "Manage user accounts and permissions",
    category: "admin",
    actions: ["create", "read", "update", "delete"],
  },
  {
    id: "admin-system",
    name: "System Administration",
    description: "Access system settings and configurations",
    category: "admin",
    actions: ["create", "read", "update", "delete"],
  },
  ...TEAM_PERMISSIONS,
]

// Enhanced role permissions
export const ROLE_PERMISSIONS = {
  admin: DEFAULT_PERMISSIONS.map((p) => p.id),
  manager: [
    "candidates-manage",
    "jobs-manage",
    "customers-read",
    "reports-read",
    "team-view",
    "team-manage",
    "analytics-view",
    "ai-features",
  ],
  user: ["candidates-read", "jobs-read", "customers-read", "ai-features"],
}

// Role hierarchy helper functions
export const hasHigherRole = (userRole: string, targetRole: string): boolean => {
  return (
    ROLE_HIERARCHY[userRole as keyof typeof ROLE_HIERARCHY] > ROLE_HIERARCHY[targetRole as keyof typeof ROLE_HIERARCHY]
  )
}

export const canAccessUserData = (currentUser: User, targetUserId: string, users: User[]): boolean => {
  // Admin can access all data
  if (currentUser.role === "admin") return true

  // Users can only access their own data
  if (currentUser.role === "user") return currentUser.id === targetUserId

  // Managers can access their team members' data
  if (currentUser.role === "manager") {
    if (currentUser.id === targetUserId) return true

    const targetUser = users.find((u) => u.id === targetUserId)
    if (!targetUser) return false

    // Check if target user is in manager's team
    return (
      targetUser.managerId === currentUser.id ||
      (currentUser.teamIds || []).some((teamId) => (targetUser.teamIds || []).includes(teamId))
    )
  }

  return false
}

export const getAccessibleUserIds = (currentUser: User, users: User[]): string[] => {
  if (currentUser.role === "admin") {
    return users.map((u) => u.id)
  }

  if (currentUser.role === "user") {
    return [currentUser.id]
  }

  if (currentUser.role === "manager") {
    const accessibleIds = [currentUser.id]

    // Add direct reports
    users.forEach((user) => {
      if (user.managerId === currentUser.id) {
        accessibleIds.push(user.id)
      }
    })

    // Add team members
    const teamIds = currentUser.teamIds || []
    users.forEach((user) => {
      if ((user.teamIds || []).some((teamId) => teamIds.includes(teamId))) {
        if (!accessibleIds.includes(user.id)) {
          accessibleIds.push(user.id)
        }
      }
    })

    return accessibleIds
  }

  return []
}

// AI analysis helpers
export const generateAIAnalysis = async (candidate: any, jobPosting: any): Promise<AIAnalysis> => {
  // Simulate AI analysis (in real app, this would call an AI service)
  const skillsMatch = calculateSkillsMatch(candidate.skills, jobPosting.skills)
  const experienceMatch = calculateExperienceMatch(candidate.experience, jobPosting.experience)
  const culturalFit = Math.floor(Math.random() * 40) + 60 // Random between 60-100

  const overallScore = Math.round(skillsMatch * 0.4 + experienceMatch * 0.3 + culturalFit * 0.3)

  const strengths = generateStrengths(candidate, skillsMatch, experienceMatch)
  const weaknesses = generateWeaknesses(candidate, skillsMatch, experienceMatch)
  const verdict = determineVerdict(overallScore)
  const reasoning = generateReasoning(overallScore, skillsMatch, experienceMatch, culturalFit)

  return {
    id: Date.now().toString(),
    candidateId: candidate.id,
    overallScore,
    strengths,
    weaknesses,
    verdict,
    skillsMatch,
    experienceMatch,
    culturalFit,
    analysisDate: new Date().toISOString().split("T")[0],
    jobId: jobPosting.id,
    confidence: Math.floor(Math.random() * 20) + 80, // 80-100%
    reasoning,
  }
}

const calculateSkillsMatch = (candidateSkills: string[], jobSkills: string[]): number => {
  if (!jobSkills.length) return 100

  const matches = candidateSkills.filter((skill) =>
    jobSkills.some(
      (jobSkill) =>
        skill.toLowerCase().includes(jobSkill.toLowerCase()) || jobSkill.toLowerCase().includes(skill.toLowerCase()),
    ),
  ).length

  return Math.round((matches / jobSkills.length) * 100)
}

const calculateExperienceMatch = (candidateExp: string, requiredExp: string): number => {
  const candidateYears = Number.parseInt(candidateExp.match(/\d+/)?.[0] || "0")
  const requiredYears = Number.parseInt(requiredExp.match(/\d+/)?.[0] || "0")

  if (candidateYears >= requiredYears) return 100
  if (candidateYears === 0) return 20

  return Math.round((candidateYears / requiredYears) * 100)
}

const generateStrengths = (candidate: any, skillsMatch: number, experienceMatch: number): string[] => {
  const strengths = []

  if (skillsMatch >= 80) strengths.push("Excellent technical skills match")
  if (experienceMatch >= 90) strengths.push("Exceeds experience requirements")
  if (candidate.education?.includes("PhD") || candidate.education?.includes("Master")) {
    strengths.push("Advanced educational background")
  }
  if (candidate.skills.length >= 5) strengths.push("Diverse skill set")
  if (candidate.rating >= 4) strengths.push("Strong interview performance")

  return strengths.length ? strengths : ["Meets basic requirements"]
}

const generateWeaknesses = (candidate: any, skillsMatch: number, experienceMatch: number): string[] => {
  const weaknesses = []

  if (skillsMatch < 60) weaknesses.push("Limited relevant technical skills")
  if (experienceMatch < 70) weaknesses.push("Below preferred experience level")
  if (!candidate.expectedSalary || candidate.expectedSalary > 200000) {
    weaknesses.push("Salary expectations may be high")
  }
  if (candidate.noticePeriod && candidate.noticePeriod.includes("month")) {
    weaknesses.push("Extended notice period")
  }

  return weaknesses
}

const determineVerdict = (overallScore: number): AIAnalysis["verdict"] => {
  if (overallScore >= 85) return "highly_recommended"
  if (overallScore >= 70) return "recommended"
  if (overallScore >= 55) return "consider"
  return "not_recommended"
}

const generateReasoning = (overall: number, skills: number, experience: number, culture: number): string => {
  return `Based on comprehensive analysis: Skills match ${skills}%, Experience match ${experience}%, Cultural fit ${culture}%. Overall score of ${overall}% indicates ${overall >= 70 ? "strong alignment" : "partial alignment"} with job requirements.`
}

// Activity tracking
export const trackUserActivity = (
  userId: string,
  action: string,
  entityType: UserActivity["entityType"],
  entityId?: string,
  entityName?: string,
  metadata?: Record<string, any>,
): UserActivity => {
  const activity: UserActivity = {
    id: Date.now().toString(),
    userId,
    userName: getCurrentUser().firstName + " " + getCurrentUser().lastName,
    action,
    entityType,
    entityId,
    entityName,
    timestamp: new Date().toISOString(),
    ipAddress: "192.168.1." + Math.floor(Math.random() * 255), // Mock IP
    location: getRandomLocation(),
    userAgent: navigator.userAgent,
    metadata,
  }

  // In real app, send to analytics service
  console.log("Activity tracked:", activity)

  return activity
}

const getRandomLocation = (): string => {
  const locations = [
    "New York, NY",
    "San Francisco, CA",
    "Los Angeles, CA",
    "Chicago, IL",
    "Boston, MA",
    "Seattle, WA",
    "Austin, TX",
    "Denver, CO",
  ]
  return locations[Math.floor(Math.random() * locations.length)]
}

export const getCurrentUser = (): User => {
  // In a real app, this would come from authentication context
  return {
    id: "1",
    username: "admin",
    email: "admin@company.com",
    firstName: "System",
    lastName: "Administrator",
    role: "admin",
    status: "active",
    createdDate: "2023-01-01",
    lastLogin: "2024-01-20",
    permissions: DEFAULT_PERMISSIONS,
    department: "IT",
  }
}

export const hasPermission = (user: User, permissionId: string): boolean => {
  return user.permissions.some((p) => p.id === permissionId)
}

export const canPerformAction = (
  user: User,
  permissionId: string,
  action: "create" | "read" | "update" | "delete",
): boolean => {
  const permission = user.permissions.find((p) => p.id === permissionId)
  return permission ? permission.actions.includes(action) : false
}

export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = []

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long")
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter")
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter")
  }

  if (!/\d/.test(password)) {
    errors.push("Password must contain at least one number")
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push("Password must contain at least one special character")
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

export const generateSecurePassword = (): string => {
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
  const lowercase = "abcdefghijklmnopqrstuvwxyz"
  const numbers = "0123456789"
  const symbols = '!@#$%^&*(),.?":{}|<>'

  const allChars = uppercase + lowercase + numbers + symbols
  let password = ""

  // Ensure at least one character from each category
  password += uppercase[Math.floor(Math.random() * uppercase.length)]
  password += lowercase[Math.floor(Math.random() * lowercase.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]
  password += symbols[Math.floor(Math.random() * symbols.length)]

  // Fill the rest randomly
  for (let i = 4; i < 12; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)]
  }

  // Shuffle the password
  return password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("")
}

export const logAuditAction = (
  action: string,
  targetType: "user" | "role" | "permission",
  targetId: string,
  targetName: string,
  details: string,
): AuditLog => {
  const currentUser = getCurrentUser()

  const auditLog: AuditLog = {
    id: Date.now().toString(),
    userId: currentUser.id,
    userName: `${currentUser.firstName} ${currentUser.lastName}`,
    action,
    targetType,
    targetId,
    targetName,
    details,
    timestamp: new Date().toISOString(),
    ipAddress: "192.168.1.1", // In real app, get from request
    userAgent: navigator.userAgent,
  }

  // In a real app, this would be sent to a logging service
  console.log("Audit Log:", auditLog)

  return auditLog
}
