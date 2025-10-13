import BulkImport from "../components/bulk-import"
import ProtectedRoute from "../components/protected-route"

export default function BulkImportPage() {
  return (
    <ProtectedRoute>
      <BulkImport />
    </ProtectedRoute>
  )
}
