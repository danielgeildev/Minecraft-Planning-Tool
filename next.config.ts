import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // Goals page was merged into Spielplan; Timeline became a widget on Progress
      { source: "/goals", destination: "/spielplan", permanent: false },
      { source: "/timeline", destination: "/progress", permanent: false },
    ];
  },
};

export default nextConfig;
