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
      "Java · Kotlin/Spring, 데이터베이스, 운영, 홈서버, AI-assisted development를 기록하는 백엔드 개발자 이영수의 소개 페이지입니다.",
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
            <p>안녕하세요, 백엔드 개발자 이영수예요.</p>
            <p>
              AI 로 빨라질수록, 코드를 판단하는 눈이 더 중요해진다고 생각해요. 그래서 규칙은 테스트와
              훅이 지키게 두고, “왜 안 되지” 는 원인을 바닥까지 파 봐요.
            </p>
            <p>
              Java · Kotlin 과 Spring 으로 서버를 만들고, 미니 PC 홈서버에서 self-hosted 서비스와 Hermes
              에이전트를 직접 운영해요.
            </p>
            <p>
              이 블로그에는 겪은 문제와 해결, 인상 깊게 본 아티클의 정리, 그리고 발견하고 배운 짧은 학습
              메모를 남겨요.
            </p>
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
