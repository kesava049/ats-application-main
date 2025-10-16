// Python API Base URL (for job-posting and other root-level routes)
// Use environment variable if available, fallback to hardcoded URL
const PYTHON_BASE_URL = process.env.NEXT_PUBLIC_PYTHON_API_URL || "http://147.93.155.233:8000"

// For production (uncomment when deploying)
// const PYTHON_BASE_URL = "https://pyats.workisy.in"

export default PYTHON_BASE_URL;