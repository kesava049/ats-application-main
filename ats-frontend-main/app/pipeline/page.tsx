import PipelineAPI from "../components/pipeline-api"
import ProtectedRoute from "../components/protected-route"

export default function PipelinePage() {
  return (
    <ProtectedRoute>
      <PipelineAPI />
    </ProtectedRoute>
  )
}
