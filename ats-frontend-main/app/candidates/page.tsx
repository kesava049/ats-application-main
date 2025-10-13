import EnhancedCandidateManagement from "../components/enhanced-candidate-management"
import ProtectedRoute from "../components/protected-route"

export default function CandidatesPage() {
  return (
    <ProtectedRoute>
      <EnhancedCandidateManagement />
    </ProtectedRoute>
  )
}
