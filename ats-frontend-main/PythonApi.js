// Python backend API URL
// Use environment variable if available, fallback to hardcoded URL
const BASE_API_URL = process.env.NEXT_PUBLIC_PYTHON_API_URL ?
    `${process.env.NEXT_PUBLIC_PYTHON_API_URL}/api/v1` :
    "http://147.93.155.233:8000/api/v1"

// For production (uncomment when deploying)
// const BASE_API_URL = "https://pyats.workisy.in/api/v1"

export default BASE_API_URL;