import CustomerManagement from "../components/customer-management"
import ProtectedRoute from "../components/protected-route"

export default function CustomersPage() {
  return (
    <ProtectedRoute>
      <CustomerManagement />
    </ProtectedRoute>
  )
}
