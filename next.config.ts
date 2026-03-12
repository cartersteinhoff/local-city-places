import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "gqqlgatxv66gmkyt.public.blob.vercel-storage.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  async redirects() {
    return [
      {
        source: "/status",
        destination: "https://stats.uptimerobot.com/KCYsEKSJuO",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
