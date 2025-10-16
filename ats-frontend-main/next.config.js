/** @type {import('next').NextConfig} */
const nextConfig = {
    // Environment variables
    env: {
        NEXT_PUBLIC_API_URL: 'http://147.93.155.233:5000/api',
        NEXT_PUBLIC_NODE_API_URL: 'http://147.93.155.233:5000',
        NEXT_PUBLIC_PYTHON_API_URL: 'http://147.93.155.233:8000',
        NEXT_PUBLIC_PYTHON_BASE_URL: 'http://147.93.155.233:8000',
        NEXT_PUBLIC_BASE_API_URL: 'http://147.93.155.233:5000/api',
        PORT: '3001'
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    },
    images: {
        unoptimized: true,
    },
    devIndicators: {
        position: 'bottom-right',
    },
    experimental: {
        // Reduce hydration warnings in development
        optimizePackageImports: ['@radix-ui/react-toast'],
    },
    // Suppress hydration warnings for specific patterns
    onDemandEntries: {
        // period (in ms) where the server will keep pages in the buffer
        maxInactiveAge: 25 * 1000,
        // number of pages that should be kept simultaneously without being disposed
        pagesBufferLength: 2,
    },
    // Production-specific configurations
    compiler: {
        // Remove console logs in production
        removeConsole: process.env.NODE_ENV === 'production',
    },
    // Ensure consistent rendering between server and client
    reactStrictMode: true,
    // Disable x-powered-by header
    poweredByHeader: false,
    // Proxy API calls to backend server
    async rewrites() {
        return [{
            source: '/api/:path*',
            destination: 'http://147.93.155.233:5000/api/:path*',
        }, ];
    },
}

module.exports = nextConfig