// Centralized API base URL
// Use environment variable if available, fallback to hardcoded URL
const BASE_API_URL = process.env.NEXT_PUBLIC_NODE_API_URL ?
    `${process.env.NEXT_PUBLIC_NODE_API_URL}/api` :
    "http://147.93.155.233:5000/api"

// For production (uncomment when deploying)
// const BASE_API_URL = "https://atsapi.workisy.in/api"

export default BASE_API_URL;