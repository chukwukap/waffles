import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.blob.vercel-storage.com",
      },
    ],
  },
  rewrites: async () => {
    return [
      {
        source: "/parties/:path*",
        destination: "http://127.0.0.1:1999/parties/:path*",
      },
    ];
  },
};

export default nextConfig;
