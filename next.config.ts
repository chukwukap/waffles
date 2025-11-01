import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
        port: "",
        pathname: "**",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "**.supabase.co", // For Supabase storage
      },
    ],
  },
  // Allow development requests from these origins due to Next.js CORS requirements
  // See: https://nextjs.org/docs/app/api-reference/config/next-config-js/allowedDevOrigins
  allowedDevOrigins: [
    "https://brochure-decent-personalized-drug.trycloudflare.com",
  ],
};

export default nextConfig;
