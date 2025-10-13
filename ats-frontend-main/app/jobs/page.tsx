import JobPostings from "../components/job-postings"
import ProtectedRoute from "../components/protected-route"

export default function JobsPage() {
  return (
    <ProtectedRoute>
      <JobPostings />
    </ProtectedRoute>
  )
}
