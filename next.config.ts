import type { NextConfig } from "next";
import { siteConfig } from "./config/site";

const tagPath = (tag: string) => `/tags/${encodeURIComponent(tag)}`;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: siteConfig.imageDomains.map((hostname) => ({ hostname })),
  },
  async redirects() {
    return [
      // Preserve links from the previous English-prefixed route structure.
      { source: "/en", destination: "/posts?lang=en", permanent: true },
      { source: "/en/page4", destination: "/posts?lang=en&page=4", permanent: true },
      {
        source: "/en/posts/cli-tool-introduction-zshrc",
        destination: "/posts/cli-tool-introduction-zshrc",
        permanent: true,
      },
      {
        source: "/en/posts/writing-atdd",
        destination: "/posts/writing-atdd",
        permanent: true,
      },
      {
        source: "/en/posts/springbootapplication-deep-dive-why-springbootapplication-and-entityscan-should-be-specified-separately",
        destination: "/posts/springbootapplication-deep-dive-why-springbootapplication-and-entityscan-should-be-specified-separately",
        permanent: true,
      },
      { source: "/en/tags/selenium", destination: "/tags/selenium?lang=en", permanent: true },
      { source: "/en/tags/project", destination: "/tags/project?lang=en", permanent: true },
      { source: "/en/tags/github", destination: "/tags/github?lang=en", permanent: true },
      { source: "/en/categories/spring", destination: "/categories/Spring?lang=en", permanent: true },
      {
        source: `/en/library/${encodeURIComponent("하프-마라톤을-뛰고")}`,
        destination: "/library/life-half-marathon",
        permanent: true,
      },

      // Redirect routes that moved to a different content collection or taxonomy slug.
      { source: "/popular", destination: "/posts", permanent: true },
      { source: "/posts/cloudfront", destination: "/notes/cloudfront", permanent: true },
      { source: `/articles/tags/${encodeURIComponent("클린코드")}`, destination: tagPath("클린코드"), permanent: true },
      { source: "/tags/batch-insert", destination: tagPath("Batch Insert"), permanent: true },
      { source: `/tags/${encodeURIComponent("쉘-스크립트")}`, destination: tagPath("쉘 스크립트"), permanent: true },
    ];
  },
  experimental: {
    // Keep homelab builds within the small admin container's memory budget.
    cpus: 1,
    staticGenerationMaxConcurrency: 2,
  },
};

export default nextConfig;
