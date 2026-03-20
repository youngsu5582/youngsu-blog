import type { NextConfig } from "next";
import { siteConfig } from "./config/site";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: siteConfig.imageDomains.map((hostname) => ({ hostname })),
  },
};

export default nextConfig;
