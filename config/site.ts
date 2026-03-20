export const siteConfig = {
  name: "이영수 개발 블로그",
  description: "백엔드 개발자 이영수의 기술 블로그",
  url: "https://youngsu5582.today",
  repo: "youngsu5582/youngsu-blog",

  author: {
    name: "이영수",
    email: "youngsu5582@gmail.com",
    github: "https://github.com/youngsu5582",
    linkedin: "https://linkedin.com/in/youngsu5582",
    avatar: "/assets/img/avatar.jpg",
  },

  locale: "ko" as const,

  giscus: {
    repo: "youngsu5582/blog" as `${string}/${string}`,
    repoId: "R_kgDOOI2eig",
    category: "Post",
    categoryId: "DIC_kwDOOI2eis4Cob3Y",
  },

  analytics: {
    googleAnalyticsId: "G-GDSPGC31HX",
  },

  /** 외부 이미지 허용 도메인 — next.config.ts에서 참조 */
  imageDomains: [
    "velog.velcdn.com",
    "i.imgur.com",
    "i.pinimg.com",
    "github.com",
    "raw.githubusercontent.com",
    "user-images.githubusercontent.com",
    "www.notion.so",
    "www.aladin.co.kr",
    "image.yes24.com",
    "d1apvpgu6ekv4q.cloudfront.net",
  ],
};

export type SiteConfig = typeof siteConfig;
