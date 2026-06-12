import Link from "next/link";
import type { Metadata } from "next";
import { BookOpen, ChevronRight } from "lucide-react";

import { LangToggle } from "@/components/common/lang-toggle";
import { FadeOnScroll } from "@/components/common/fade-on-scroll";
import { getAllSeries } from "@/lib/content";
import { siteConfig } from "@/config/site";

interface SeriesPageProps {
  searchParams: Promise<{ lang?: string }>;
}

export const metadata: Metadata = {
  title: "시리즈",
  description: "연재 중인 블로그 시리즈를 모아봅니다.",
  alternates: {
    canonical: `${siteConfig.url}/series`,
  },
};

export default async function SeriesPage({ searchParams }: SeriesPageProps) {
  const params = await searchParams;
  const lang = params.lang === "en" ? "en" : "ko";
  const series = getAllSeries(lang);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight theme-heading">시리즈</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            {series.length}개의 연재 묶음 · 글이 여러 편 이어지는 흐름을 한 번에 볼 수 있어요.
          </p>
        </div>
        <LangToggle currentLang={lang} basePath="/series" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {series.map((item, index) => {
          const firstPost = item.posts[0];
          const latestPost = item.posts[item.posts.length - 1];

          return (
            <FadeOnScroll key={`${item.lang}:${item.slug}`} delay={index * 50}>
              <Link
                href={`/series/${item.slug}?lang=${lang}`}
                className="group block h-full rounded-2xl border border-border/70 bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                      <BookOpen className="h-4 w-4" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-foreground group-hover:text-primary">
                        {item.name}
                      </h2>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {item.posts.length}편 · {item.lang.toUpperCase()}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="mt-2 h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
                </div>

                <div className="mt-5 space-y-2 text-sm">
                  <p className="text-muted-foreground">
                    시작: <span className="text-foreground">{firstPost.title}</span>
                  </p>
                  <p className="text-muted-foreground">
                    최근: <span className="text-foreground">{latestPost.title}</span>
                  </p>
                </div>

                <ol className="mt-5 space-y-1.5 border-t border-border/60 pt-4">
                  {item.posts.slice(0, 3).map((post, postIndex) => (
                    <li key={post.slug} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-mono text-[11px] text-primary/80">
                        {String(postIndex + 1).padStart(2, "0")}
                      </span>
                      <span className="line-clamp-1">{post.title}</span>
                    </li>
                  ))}
                  {item.posts.length > 3 && (
                    <li className="text-xs text-muted-foreground/80">
                      + {item.posts.length - 3}편 더 보기
                    </li>
                  )}
                </ol>
              </Link>
            </FadeOnScroll>
          );
        })}
      </div>

      {series.length === 0 && (
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          아직 {lang.toUpperCase()} 시리즈가 없습니다.
        </div>
      )}
    </div>
  );
}
