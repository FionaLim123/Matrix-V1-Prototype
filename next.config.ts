import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/emery-passive-lessons-overview",
        destination: "/v1-prototype",
        permanent: false,
      },
      {
        source: "/matrix-v1/lessons",
        destination: "/matrix-v1/student",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
