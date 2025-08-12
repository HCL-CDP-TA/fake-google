import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.google.com",
      },
      {
        protocol: "https",
        hostname: "*.wikipedia.org",
      },
      {
        protocol: "https",
        hostname: "*.com",
      },
      {
        protocol: "https",
        hostname: "*.org",
      },
      {
        protocol: "https",
        hostname: "*.net",
      },
      {
        protocol: "https",
        hostname: "*.edu",
      },
      {
        protocol: "https",
        hostname: "*.gov",
      },
      {
        protocol: "http",
        hostname: "*.com",
      },
      {
        protocol: "http",
        hostname: "*.org",
      },
    ],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
}

export default nextConfig
