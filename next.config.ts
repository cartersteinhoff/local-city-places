import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    useTypeScriptCli: true,
  },
  images: {
    qualities: [60, 75, 82],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "gqqlgatxv66gmkyt.public.blob.vercel-storage.com",
      },
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
