import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { hostname: "velog.velcdn.com" },
      { hostname: "i.imgur.com" },
      { hostname: "i.pinimg.com" },
      { hostname: "github.com" },
      { hostname: "raw.githubusercontent.com" },
      { hostname: "user-images.githubusercontent.com" },
      { hostname: "www.notion.so" },
      { hostname: "www.aladin.co.kr" },
    ],
  },
};

export default nextConfig;
