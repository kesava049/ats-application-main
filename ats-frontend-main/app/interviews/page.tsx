import InterviewManagement from "../components/interview-management"
import ProtectedRoute from "../components/protected-route"

export default function InterviewsPage() {
  return (
    <ProtectedRoute>
      <InterviewManagement />
    </ProtectedRoute>
  )
}
