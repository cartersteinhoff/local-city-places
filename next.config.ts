import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
