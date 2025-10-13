export interface Job {
  id: string
  title: string
  clientName: string
  department: string
  location: string
  type: "full-time" | "part-time" | "contract" | "freelance" | "internship"
  status: "open" | "closed" | "filled" | "on-hold"
  priority: "urgent" | "high" | "medium" | "low"
  salary: {
    min: number
    max: number
    currency: string
  }
  description: string
  requirements: string[]
  tags: string[]
  datePosted: string
  applicationCount: number
  interviewCount: number
  offerCount: number
  recruiterId: string
  recruiterName: string
  createdAt: string
}

export interface Candidate {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  location: string
  jobId: string
  jobTitle: string
  status: "new" | "reviewed" | "screening" | "interviewed" | "offered" | "hired" | "rejected"
  source: "linkedin" | "website" | "referral" | "job-board" | "direct"
  applicationDate: string
  lastUpdated: string
  rating: number
  experience: string
  education: string
  skills: string[]
  expectedSalary?: number
  availability: string
  notes: string[]
  interviewDates: string[]
  recruiterId: string
  recruiterName: string
  coverLetter?: string
  name: string
  appliedAt: string
}

export interface Interview {
  id: string
  candidateId: string
  candidateName: string
  jobId: string
  jobTitle: string
  type: "video" | "phone" | "in-person" | "technical" | "panel"
  status: "scheduled" | "completed" | "cancelled" | "rescheduled"
  scheduledDate: string
  scheduledTime: string
  duration: number
  location?: string
  meetingLink?: string
  interviewerName: string
  notes: string
  feedback?: {
    rating: number
    recommendation: "hire" | "no-hire" | "maybe"
    comments: string
  }
  recruiterId: string
  recruiterName: string
  date: string
}

export interface Offer {
  id: string
  candidateId: string
  candidateName: string
  jobId: string
  jobTitle: string
  status: "pending" | "accepted" | "rejected" | "withdrawn" | "negotiating"
  salary: number
  startDate: string
  benefits: string[]
  offerDate: string
  responseDeadline: string
  recruiterId: string
  recruiterName: string
  offeredAt: string
}

export interface Hire {
  id: string
  candidateId: string
  candidateName: string
  jobId: string
  jobTitle: string
  hireDate: string
  startDate: string
  salary: number
  department: string
  manager: string
  recruiterId: string
  recruiterName: string
  placementFee: number
}

export interface ActivityLog {
  id: string
  userId: string
  userName: string
  type: "job" | "candidate" | "interview" | "offer" | "hire"
  action: string
  entityId: string
  entityName: string
  timestamp: string
  importance: "low" | "medium" | "high"
  details: Record<string, any>
}

// Mock Data
export const MOCK_JOBS: Job[] = [
  {
    id: "1",
    title: "Senior Software Engineer",
    clientName: "TechCorp Inc.",
    department: "Engineering",
    location: "San Francisco, CA",
    type: "full-time",
    status: "open",
    priority: "high",
    salary: { min: 120000, max: 180000, currency: "INR" },
    description: "We are looking for a Senior Software Engineer to join our growing team...",
    requirements: [
      "5+ years of software development experience",
      "Strong proficiency in React and Node.js",
      "Experience with cloud platforms (AWS, GCP, or Azure)",
      "Excellent problem-solving skills",
    ],
    tags: ["React", "Node.js", "AWS", "TypeScript"],
    datePosted: "2024-01-15",
    applicationCount: 24,
    interviewCount: 8,
    offerCount: 2,
    recruiterId: "2",
    recruiterName: "Sarah Wilson",
    createdAt: "2024-01-15",
  },
  {
    id: "2",
    title: "Marketing Manager",
    clientName: "StartupXYZ",
    department: "Marketing",
    location: "New York, NY",
    type: "full-time",
    status: "open",
    priority: "medium",
    salary: { min: 80000, max: 120000, currency: "INR" },
    description: "Join our dynamic marketing team as a Marketing Manager...",
    requirements: [
      "3+ years of marketing experience",
      "Experience with digital marketing platforms",
      "Strong analytical skills",
      "Creative thinking abilities",
    ],
    tags: ["Digital Marketing", "Analytics", "SEO", "Content Strategy"],
    datePosted: "2024-01-12",
    applicationCount: 18,
    interviewCount: 6,
    offerCount: 1,
    recruiterId: "2",
    recruiterName: "Sarah Wilson",
    createdAt: "2024-01-12",
  },
  {
    id: "3",
    title: "Data Scientist",
    clientName: "DataFlow Solutions",
    department: "Analytics",
    location: "Austin, TX",
    type: "full-time",
    status: "filled",
    priority: "urgent",
    salary: { min: 100000, max: 150000, currency: "INR" },
    description: "We're seeking a talented Data Scientist to join our analytics team...",
    requirements: [
      "PhD or Master's in Data Science, Statistics, or related field",
      "3+ years of experience in data analysis",
      "Proficiency in Python and R",
      "Experience with machine learning algorithms",
    ],
    tags: ["Python", "R", "Machine Learning", "Statistics"],
    datePosted: "2024-01-08",
    applicationCount: 32,
    interviewCount: 12,
    offerCount: 3,
    recruiterId: "3",
    recruiterName: "Emily Chen",
    createdAt: "2024-01-08",
  },
  {
    id: "4",
    title: "Frontend Engineer",
    clientName: "WebTech Solutions",
    department: "Engineering",
    location: "Seattle, WA",
    type: "full-time",
    status: "open",
    priority: "high",
    salary: { min: 90000, max: 140000, currency: "INR" },
    description: "Looking for a Frontend Engineer to build amazing user experiences...",
    requirements: [
      "3+ years of frontend development experience",
      "Expert knowledge of React, HTML5, CSS3",
      "Experience with modern build tools",
      "Strong eye for design and UX",
    ],
    tags: ["React", "JavaScript", "CSS3", "UX"],
    datePosted: "2024-01-20",
    applicationCount: 15,
    interviewCount: 4,
    offerCount: 1,
    recruiterId: "2",
    recruiterName: "Sarah Wilson",
    createdAt: "2024-01-20",
  },
  {
    id: "5",
    title: "Product Manager",
    clientName: "InnovateCorp",
    department: "Product",
    location: "Boston, MA",
    type: "full-time",
    status: "filled",
    priority: "medium",
    salary: { min: 110000, max: 160000, currency: "INR" },
    description: "Seeking an experienced Product Manager to drive product strategy...",
    requirements: [
      "5+ years of product management experience",
      "Strong analytical and strategic thinking",
      "Experience with agile methodologies",
      "Excellent communication skills",
    ],
    tags: ["Product Strategy", "Agile", "Analytics", "Leadership"],
    datePosted: "2024-01-05",
    applicationCount: 28,
    interviewCount: 10,
    offerCount: 2,
    recruiterId: "2",
    recruiterName: "Sarah Wilson",
    createdAt: "2024-01-05",
  },
]

export const MOCK_CANDIDATES: Candidate[] = [
  {
    id: "1",
    firstName: "John",
    lastName: "Smith",
    email: "john.smith@email.com",
    phone: "+1-555-0123",
    location: "San Francisco, CA",
    jobId: "1",
    jobTitle: "Senior Software Engineer",
    status: "interviewed",
    source: "linkedin",
    applicationDate: "2024-01-16",
    lastUpdated: "2024-01-18",
    rating: 4,
    experience: "6 years",
    education: "BS Computer Science, Stanford University",
    skills: ["React", "Node.js", "TypeScript", "AWS", "Docker"],
    expectedSalary: 150000,
    availability: "2 weeks notice",
    notes: ["Strong technical skills", "Good cultural fit", "Excellent communication"],
    interviewDates: ["2024-01-18"],
    recruiterId: "2",
    recruiterName: "Sarah Wilson",
    name: "John Smith",
    appliedAt: "2024-01-16",
  },
  {
    id: "2",
    firstName: "Sarah",
    lastName: "Johnson",
    email: "sarah.johnson@email.com",
    phone: "+1-555-0124",
    location: "New York, NY",
    jobId: "2",
    jobTitle: "Marketing Manager",
    status: "new",
    source: "website",
    applicationDate: "2024-01-17",
    lastUpdated: "2024-01-17",
    rating: 3,
    experience: "4 years",
    education: "MBA Marketing, NYU Stern",
    skills: ["Digital Marketing", "Analytics", "SEO", "Content Strategy", "Google Ads"],
    expectedSalary: 95000,
    availability: "1 month notice",
    notes: ["Excellent marketing background"],
    interviewDates: [],
    recruiterId: "2",
    recruiterName: "Sarah Wilson",
    name: "Sarah Johnson",
    appliedAt: "2024-01-17",
  },
  {
    id: "3",
    firstName: "Michael",
    lastName: "Chen",
    email: "michael.chen@email.com",
    phone: "+1-555-0125",
    location: "Austin, TX",
    jobId: "3",
    jobTitle: "Data Scientist",
    status: "offered",
    source: "referral",
    applicationDate: "2024-01-10",
    lastUpdated: "2024-01-19",
    rating: 5,
    experience: "5 years",
    education: "PhD Data Science, UT Austin",
    skills: ["Python", "R", "Machine Learning", "TensorFlow", "SQL"],
    expectedSalary: 130000,
    availability: "3 weeks notice",
    notes: ["Outstanding candidate", "PhD from top program", "Strong research background"],
    interviewDates: ["2024-01-12", "2024-01-15"],
    recruiterId: "3",
    recruiterName: "Emily Chen",
    name: "Michael Chen",
    appliedAt: "2024-01-10",
  },
  {
    id: "4",
    firstName: "Alice",
    lastName: "Johnson",
    email: "alice.johnson@email.com",
    phone: "+1-555-0126",
    location: "Seattle, WA",
    jobId: "4",
    jobTitle: "Frontend Engineer",
    status: "new",
    source: "job-board",
    applicationDate: "2024-01-21",
    lastUpdated: "2024-01-21",
    rating: 4,
    experience: "4 years",
    education: "BS Computer Science, University of Washington",
    skills: ["React", "JavaScript", "CSS3", "HTML5", "Vue.js"],
    expectedSalary: 115000,
    availability: "2 weeks notice",
    notes: ["Strong frontend skills", "Portfolio looks impressive"],
    interviewDates: [],
    recruiterId: "2",
    recruiterName: "Sarah Wilson",
    name: "Alice Johnson",
    appliedAt: "2024-01-21",
  },
  {
    id: "5",
    firstName: "Bob",
    lastName: "Smith",
    email: "bob.smith@email.com",
    phone: "+1-555-0127",
    location: "Boston, MA",
    jobId: "5",
    jobTitle: "Product Manager",
    status: "interviewed",
    source: "linkedin",
    applicationDate: "2024-01-08",
    lastUpdated: "2024-01-20",
    rating: 5,
    experience: "7 years",
    education: "MBA, Harvard Business School",
    skills: ["Product Strategy", "Agile", "Analytics", "Leadership", "SQL"],
    expectedSalary: 145000,
    availability: "1 month notice",
    notes: ["Excellent product sense", "Strong leadership experience", "Harvard MBA"],
    interviewDates: ["2024-01-15", "2024-01-20"],
    recruiterId: "2",
    recruiterName: "Sarah Wilson",
    name: "Bob Smith",
    appliedAt: "2024-01-08",
  },
]

export const MOCK_INTERVIEWS: Interview[] = [
  {
    id: "1",
    candidateId: "1",
    candidateName: "John Smith",
    jobId: "1",
    jobTitle: "Senior Software Engineer",
    type: "video",
    status: "completed",
    scheduledDate: "2024-01-18",
    scheduledTime: "14:00",
    duration: 60,
    meetingLink: "https://zoom.us/j/123456789",
    interviewerName: "Sarah Wilson",
    notes: "Technical interview focusing on React and system design",
    feedback: {
      rating: 4,
      recommendation: "hire",
      comments: "Strong technical skills, good problem-solving approach",
    },
    recruiterId: "2",
    recruiterName: "Sarah Wilson",
    date: "2024-01-18T14:00:00",
  },
  {
    id: "2",
    candidateId: "2",
    candidateName: "Sarah Johnson",
    jobId: "2",
    jobTitle: "Marketing Manager",
    type: "phone",
    status: "scheduled",
    scheduledDate: "2024-01-22",
    scheduledTime: "10:00",
    duration: 45,
    interviewerName: "Mike Johnson",
    notes: "Initial screening call",
    recruiterId: "2",
    recruiterName: "Sarah Wilson",
    date: "2024-01-22T10:00:00",
  },
  {
    id: "3",
    candidateId: "3",
    candidateName: "Michael Chen",
    jobId: "3",
    jobTitle: "Data Scientist",
    type: "panel",
    status: "completed",
    scheduledDate: "2024-01-15",
    scheduledTime: "15:30",
    duration: 90,
    location: "Conference Room A",
    interviewerName: "Emily Chen, David Brown",
    notes: "Final panel interview with team leads",
    feedback: {
      rating: 5,
      recommendation: "hire",
      comments: "Exceptional candidate, perfect fit for the role",
    },
    recruiterId: "3",
    recruiterName: "Emily Chen",
    date: "2024-01-15T15:30:00",
  },
  {
    id: "4",
    candidateId: "5",
    candidateName: "Bob Smith",
    jobId: "5",
    jobTitle: "Product Manager",
    type: "video",
    status: "scheduled",
    scheduledDate: "2024-01-25",
    scheduledTime: "14:00",
    duration: 60,
    meetingLink: "https://zoom.us/j/987654321",
    interviewerName: "Sarah Wilson",
    notes: "Product strategy and leadership discussion",
    recruiterId: "2",
    recruiterName: "Sarah Wilson",
    date: "2024-01-25T14:00:00",
  },
]

export const MOCK_OFFERS: Offer[] = [
  {
    id: "1",
    candidateId: "3",
    candidateName: "Michael Chen",
    jobId: "3",
    jobTitle: "Data Scientist",
    status: "pending",
    salary: 130000,
    startDate: "2024-02-15",
    benefits: ["Health Insurance", "401k", "Flexible PTO", "Stock Options"],
    offerDate: "2024-01-19",
    responseDeadline: "2024-01-26",
    recruiterId: "3",
    recruiterName: "Emily Chen",
    offeredAt: "2024-01-19",
  },
  {
    id: "2",
    candidateId: "5",
    candidateName: "Bob Smith",
    jobId: "5",
    jobTitle: "Product Manager",
    status: "pending",
    salary: 135000,
    startDate: "2024-02-20",
    benefits: ["Health Insurance", "401k", "Stock Options", "Remote Work"],
    offerDate: "2024-01-21",
    responseDeadline: "2024-01-28",
    recruiterId: "2",
    recruiterName: "Sarah Wilson",
    offeredAt: "2024-01-21",
  },
]

export const MOCK_HIRES: Hire[] = [
  {
    id: "1",
    candidateId: "4",
    candidateName: "Lisa Rodriguez",
    jobId: "4",
    jobTitle: "UX Designer",
    hireDate: "2024-01-10",
    startDate: "2024-01-24",
    salary: 95000,
    department: "Design",
    manager: "Alex Thompson",
    recruiterId: "2",
    recruiterName: "Sarah Wilson",
    placementFee: 19000,
  },
  {
    id: "2",
    candidateId: "6",
    candidateName: "Eve Parker",
    jobId: "6",
    jobTitle: "Backend Engineer",
    hireDate: "2024-01-05",
    startDate: "2024-01-19",
    salary: 125000,
    department: "Engineering",
    manager: "Sarah Chen",
    recruiterId: "2",
    recruiterName: "Sarah Wilson",
    placementFee: 25000,
  },
]

export const MOCK_ACTIVITY_LOG: ActivityLog[] = [
  {
    id: "1",
    userId: "2",
    userName: "Sarah Wilson",
    type: "candidate",
    action: "added_candidate",
    entityId: "1",
    entityName: "John Smith",
    timestamp: "2024-01-18T14:30:00Z",
    importance: "medium",
    details: { jobTitle: "Senior Software Engineer" },
  },
  {
    id: "2",
    userId: "2",
    userName: "Sarah Wilson",
    type: "interview",
    action: "scheduled_interview",
    entityId: "1",
    entityName: "John Smith Interview",
    timestamp: "2024-01-18T10:15:00Z",
    importance: "high",
    details: { interviewType: "video", date: "2024-01-22" },
  },
  {
    id: "3",
    userId: "3",
    userName: "Emily Chen",
    type: "offer",
    action: "extended_offer",
    entityId: "1",
    entityName: "Michael Chen Offer",
    timestamp: "2024-01-19T16:45:00Z",
    importance: "high",
    details: { salary: 130000, position: "Data Scientist" },
  },
  {
    id: "4",
    userId: "2",
    userName: "Sarah Wilson",
    type: "job",
    action: "created_job",
    entityId: "4",
    entityName: "Frontend Engineer Position",
    timestamp: "2024-01-20T09:00:00Z",
    importance: "medium",
    details: { department: "Engineering", location: "Seattle, WA" },
  },
  {
    id: "5",
    userId: "2",
    userName: "Sarah Wilson",
    type: "hire",
    action: "completed_hire",
    entityId: "1",
    entityName: "Lisa Rodriguez Hire",
    timestamp: "2024-01-10T16:00:00Z",
    importance: "high",
    details: { salary: 95000, position: "UX Designer", placementFee: 19000 },
  },
]

// Utility functions
export const formatJobStatus = (status: string) => {
  const statusMap = {
    open: { label: "Open", color: "bg-green-100 text-green-800" },
    closed: { label: "Closed", color: "bg-gray-100 text-gray-800" },
    filled: { label: "Filled", color: "bg-blue-100 text-blue-800" },
    "on-hold": { label: "On Hold", color: "bg-yellow-100 text-yellow-800" },
  }
  return statusMap[status as keyof typeof statusMap] || statusMap.open
}

export const formatCandidateStatus = (status: string) => {
  const statusMap = {
    new: { label: "New", color: "bg-blue-100 text-blue-800" },
    reviewed: { label: "Reviewed", color: "bg-purple-100 text-purple-800" },
    screening: { label: "Screening", color: "bg-yellow-100 text-yellow-800" },
    interviewed: { label: "Interviewed", color: "bg-orange-100 text-orange-800" },
    offered: { label: "Offered", color: "bg-green-100 text-green-800" },
    hired: { label: "Hired", color: "bg-emerald-100 text-emerald-800" },
    rejected: { label: "Rejected", color: "bg-red-100 text-red-800" },
  }
  return statusMap[status as keyof typeof statusMap] || statusMap.new
}

export const formatCurrency = (amount: number): string => {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0)
  } catch (error) {
    return `$${amount || 0}`
  }
}

// Data filtering functions
export const getJobsByRecruiter = (id: string) => MOCK_JOBS.filter((j) => j.recruiterId === id)
export const getCandidatesByRecruiter = (id: string) => MOCK_CANDIDATES.filter((c) => c.recruiterId === id)
export const getInterviewsByRecruiter = (id: string) => MOCK_INTERVIEWS.filter((i) => i.recruiterId === id)
export const getOffersByRecruiter = (id: string) => MOCK_OFFERS.filter((o) => o.recruiterId === id)
export const getHiresByRecruiter = (id: string) => MOCK_HIRES.filter((h) => h.recruiterId === id)

export const calculateRevenue = (hires: Hire[]) => hires.reduce((sum, h) => sum + (h.placementFee || h.salary * 0.2), 0)

export const getAverageTimeToHire = (hires: Hire[]) => {
  if (!hires.length) return 0
  const diffs = hires.map((h) => {
    const posted = MOCK_JOBS.find((j) => j.title === h.jobTitle)?.createdAt ?? h.hireDate
    return (new Date(h.hireDate).getTime() - new Date(posted).getTime()) / (1000 * 60 * 60 * 24)
  })
  return Math.round(diffs.reduce((a, b) => a + b, 0) / diffs.length)
}
