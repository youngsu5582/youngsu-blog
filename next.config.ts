import type { NextConfig } from "next";
import { siteConfig } from "./config/site";

const tagPath = (tag: string) => `/tags/${encodeURIComponent(tag)}`;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: siteConfig.imageDomains.map((hostname) => ({ hostname })),
    // Limit responsive candidates to the largest width used by the blog layout.
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    // Published blog images are effectively immutable; reuse optimized results for 31 days.
    minimumCacheTTL: 60 * 60 * 24 * 31,
    // Keep one quality variant for now to avoid unnecessary image transformations.
    qualities: [75],
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
      { source: "/posts/good-code-throws-exception", destination: "/notes/good-code-throws-exception", permanent: true },
      { source: "/posts/cloudfront", destination: "/notes/cloudfront", permanent: true },
      { source: "/posts/optimistic-lock-retry", destination: "/notes/optimistic-lock-retry", permanent: true },
      { source: `/articles/tags/${encodeURIComponent("클린코드")}`, destination: tagPath("클린코드"), permanent: true },
      { source: "/tags/batch-insert", destination: tagPath("Batch Insert"), permanent: true },
      { source: `/tags/${encodeURIComponent("쉘-스크립트")}`, destination: tagPath("쉘 스크립트"), permanent: true },
    ];
  },
  async rewrites() {
    /*
     * 태그·카테고리 페이지는 빌드 때 언어(·부모 카테고리)별로 미리 만들어 둔다.
     * 공개 주소의 ?lang= · ?parent= 를 여기서 경로 파라미터로 옮겨, 페이지가 searchParams 를 읽지 않게 한다
     * (읽는 순간 요청마다 서버 렌더링 → Vercel Active CPU 대부분이 여기서 나왔다).
     * 같은 source 는 위에서부터 첫 규칙이 적용되므로 조건이 구체적인 것을 먼저 둔다.
     */
    const isEn = { type: "query" as const, key: "lang", value: "en" };
    const hasParent = { type: "query" as const, key: "parent", value: "(?<parent>.+)" };
    return {
      beforeFiles: [
        { source: "/tags/:tag", has: [isEn], destination: "/tags/:tag/en" },
        { source: "/tags/:tag", destination: "/tags/:tag/ko" },
        { source: "/categories/:category", has: [isEn, hasParent], destination: "/categories/:category/en/:parent" },
        { source: "/categories/:category", has: [hasParent], destination: "/categories/:category/ko/:parent" },
        { source: "/categories/:category", has: [isEn], destination: "/categories/:category/en" },
        { source: "/categories/:category", destination: "/categories/:category/ko" },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
  experimental: {
    // Keep homelab builds within the small admin container's memory budget.
    cpus: 1,
    staticGenerationMaxConcurrency: 2,
  },
};

export default nextConfig;
