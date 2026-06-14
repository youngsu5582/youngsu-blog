import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { Github, Mail, Rss } from "lucide-react";
import { Avatar } from "@/components/common/avatar";
import { generateProfilePageSchema, renderJsonLd } from "@/lib/json-ld";

export const metadata: Metadata = {
  title: "소개",
  description: "백엔드 개발자 이영수의 기술 블로그 소개, 관심 분야, 연락처와 RSS 구독 정보입니다.",
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: "이영수 소개",
    description:
      "Java/Spring, 데이터베이스, 운영, 홈서버, AI-assisted development를 기록하는 백엔드 개발자 이영수의 소개 페이지입니다.",
    url: `${siteConfig.url}/about`,
    type: "profile",
    images: [siteConfig.author.avatar],
  },
  twitter: {
    card: "summary",
    title: "이영수 소개",
    description: "백엔드 개발자 이영수의 기술 블로그 소개와 연락처입니다.",
    images: [siteConfig.author.avatar],
  },
};

export default function AboutPage() {
  const profileSchema = generateProfilePageSchema();

  return (
    <>
      {renderJsonLd(profileSchema)}
      <div className="space-y-10 max-w-2xl">
        {/* Profile */}
        <section className="space-y-4">
          <div className="theme-avatar-ring inline-block">
            <Avatar
              src="/assets/img/avatar.jpg"
              alt={siteConfig.author.name}
              size={96}
              fallbackText="영"
            />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{siteConfig.author.name}</h1>
          <p className="text-lg text-muted-foreground leading-relaxed">{siteConfig.description}</p>
        </section>

        {/* About */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold theme-heading">소개</h2>
          <div className="space-y-4 text-muted-foreground leading-relaxed mt-4">
            <p>안녕하세요, 백엔드 개발자 이영수입니다.</p>
            <p>
              주로 Java/Spring 기반 백엔드 개발을 하고 있으며, 클린 코드, 테스트, 아키텍처에 관심이
              많습니다.
            </p>
            <p>이 블로그에서는 개발하며 배운 것들, 읽은 책, 그리고 다양한 활동들을 기록합니다.</p>
          </div>
        </section>

        {/* Links */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold theme-heading">연락처</h2>
          <div className="flex flex-col gap-3 mt-4">
            <a
              href={siteConfig.author.github}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <Github className="h-4 w-4" />
              GitHub
            </a>
            <a
              href={`mailto:${siteConfig.author.email}`}
              className="inline-flex items-center gap-3 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <Mail className="h-4 w-4" />
              {siteConfig.author.email}
            </a>
            <a
              href="/feed.xml"
              className="inline-flex items-center gap-3 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <Rss className="h-4 w-4" />
              RSS Feed
            </a>
          </div>
        </section>
      </div>
    </>
  );
}
