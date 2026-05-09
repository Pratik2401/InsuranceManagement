import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const backendApiUrl = (process.env.BACKEND_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');
    const backendUploadsUrl = (process.env.BACKEND_UPLOADS_URL || 'http://localhost:5000/uploads').replace(/\/$/, '');

    return [
      {
        source: '/api/:path*',
        destination: `${backendApiUrl}/:path*`,
      },
      {
        source: '/uploads/:path*',
        destination: `${backendUploadsUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
