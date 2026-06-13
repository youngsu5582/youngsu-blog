import type { NextConfig } from "next";
import { siteConfig } from "./config/site";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: siteConfig.imageDomains.map((hostname) => ({ hostname })),
  },
  experimental: {
    // Keep homelab builds within the small admin container's memory budget.
    cpus: 1,
    staticGenerationMaxConcurrency: 2,
  },
};

export default nextConfig;
