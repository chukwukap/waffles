import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.blob.vercel-storage.com",
      },
      {
        protocol: "https",
        hostname: "imagedelivery.net",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
  rewrites: async () => {
    const partykitHost =
      process.env.NEXT_PUBLIC_PARTYKIT_HOST || "http://127.0.0.1:1999";
    return [
      {
        source: "/parties/:path*",
        destination: `${partykitHost}/parties/:path*`,
      },
    ];
  },
};

export default nextConfig;
