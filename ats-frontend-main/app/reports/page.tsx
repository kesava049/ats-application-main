import Reports from "../components/reports"
import ProtectedRoute from "../components/protected-route"

export default function ReportsPage() {
  return (
    <ProtectedRoute>
      <Reports />
    </ProtectedRoute>
  )
}
