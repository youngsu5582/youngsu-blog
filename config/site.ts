export const siteConfig = {
  name: "이영수 개발 블로그",
  description: "백엔드 개발자 이영수의 기술 블로그",
  url: "https://youngsu5582.today",
  author: {
    name: "이영수",
    email: "youngsu5582@gmail.com",
    github: "https://github.com/youngsu5582",
    linkedin: "https://linkedin.com/in/youngsu5582",
  },
  locale: "ko" as const,
  giscus: {
    repo: "youngsu5582/youngsu-blog" as `${string}/${string}`,
    repoId: "",
    category: "Post",
    categoryId: "",
  },
  analytics: {
    googleAnalyticsId: "G-GDSPGC31HX",
  },
};

export type SiteConfig = typeof siteConfig;
