/** @type {import('next').NextConfig} */
// Proxy /api → Express so the browser stays same-origin (no CORS issues in dev).
// Set BACKEND_URL in .env.local if API is not on 127.0.0.1:5000
const backendUrl = (process.env.BACKEND_URL || 'http://127.0.0.1:5000').replace(
  /\/$/,
  ''
)

const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ]
  },
}

export default nextConfig
