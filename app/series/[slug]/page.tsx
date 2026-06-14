import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, CalendarDays } from "lucide-react";

import { LangToggle } from "@/components/common/lang-toggle";
import { getAllSeries, getSeriesBySlug, getUrlSlug } from "@/lib/content";
import {
  generateBreadcrumbSchema,
  generateItemListSchema,
  generateSeriesSchema,
  renderJsonLd,
} from "@/lib/json-ld";
import { siteConfig } from "@/config/site";

interface SeriesDetailPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lang?: string }>;
}

export function generateStaticParams() {
  const seen = new Set<string>();
  return getAllSeries()
    .filter((series) => {
      if (seen.has(series.slug)) return false;
      seen.add(series.slug);
      return true;
    })
    .map((series) => ({ slug: series.slug }));
}

export async function generateMetadata({
  params,
  searchParams,
}: SeriesDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const { lang: requestedLang } = await searchParams;
  const lang = requestedLang === "en" ? "en" : "ko";
  const series = getSeriesBySlug(slug, lang) ?? getSeriesBySlug(slug);

  if (!series) {
    return { title: "시리즈를 찾을 수 없습니다" };
  }

  const description =
    series.description ?? `${series.name} 연재 글 ${series.posts.length}편을 순서대로 모았습니다.`;

  return {
    title: `${series.name} 시리즈`,
    description,
    alternates: {
      canonical: `${siteConfig.url}/series/${slug}`,
      languages: {
        ko: `${siteConfig.url}/series/${slug}`,
        en: `${siteConfig.url}/series/${slug}?lang=en`,
        "x-default": `${siteConfig.url}/series/${slug}`,
      },
    },
    openGraph: {
      title: `${series.name} 시리즈`,
      description,
      type: "website",
      url: `${siteConfig.url}/series/${slug}`,
    },
  };
}

export default async function SeriesDetailPage({ params, searchParams }: SeriesDetailPageProps) {
  const { slug } = await params;
  const requestedParams = await searchParams;
  const lang = requestedParams.lang === "en" ? "en" : "ko";
  const series = getSeriesBySlug(slug, lang);

  if (!series) {
    notFound();
  }

  const seriesUrl = `${siteConfig.url}/series/${slug}${lang === "en" ? "?lang=en" : ""}`;
  const itemListSchema = generateItemListSchema({
    name: `${series.name} 시리즈`,
    description: series.description ?? `${series.name} 연재 글 ${series.posts.length}편`,
    url: seriesUrl,
    items: series.posts.map((post) => ({
      name: post.title,
      description: post.description,
      url: `${siteConfig.url}/posts/${getUrlSlug(post.slug)}`,
    })),
  });
  const seriesSchema = generateSeriesSchema({
    name: series.name,
    description: series.description ?? `${series.name} 연재 글 ${series.posts.length}편`,
    url: seriesUrl,
    inLanguage: lang === "en" ? "en-US" : "ko-KR",
    status: series.status,
    items: series.posts.map((post) => ({
      name: post.title,
      description: post.description,
      url: `${siteConfig.url}/posts/${getUrlSlug(post.slug)}`,
    })),
  });
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "홈", url: siteConfig.url },
    { name: "시리즈", url: `${siteConfig.url}/series` },
    { name: series.name, url: seriesUrl },
  ]);

  return (
    <>
      {renderJsonLd(itemListSchema)}
      {renderJsonLd(seriesSchema)}
      {renderJsonLd(breadcrumbSchema)}
      <div className="space-y-8">
        <div className="flex items-center justify-between gap-4">
          <Link
            href={`/series?lang=${lang}`}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            시리즈 목록
          </Link>
          <LangToggle currentLang={lang} basePath={`/series/${slug}`} />
        </div>

        <section className="rounded-2xl border border-border/70 bg-gradient-to-br from-muted/50 via-card to-background p-6 shadow-sm">
          <div className="inline-flex rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            {series.posts.length}편 연재 · {series.lang.toUpperCase()} ·{" "}
            {series.status === "completed" ? "완결" : "진행 중"}
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight theme-heading">{series.name}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            {series.description ??
              "시리즈로 묶인 글을 발행일 순서대로 정리했습니다. 처음부터 읽으면 맥락이 이어지고, 중간 글로 바로 이동해도 현재 위치를 확인할 수 있어요."}
          </p>
        </section>

        <ol className="relative space-y-4 before:absolute before:left-5 before:top-2 before:h-[calc(100%-1rem)] before:w-px before:bg-border">
          {series.posts.map((post, index) => (
            <li key={post.slug} className="relative pl-14">
              <div className="absolute left-0 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-primary/30 bg-background text-sm font-semibold text-primary shadow-sm">
                {index + 1}
              </div>
              <Link
                href={`/posts/${getUrlSlug(post.slug)}`}
                className="block rounded-2xl border border-border/70 bg-card p-5 transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
              >
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <CalendarDays className="h-3.5 w-3.5" />
                  <time dateTime={post.date}>
                    {new Date(post.date).toLocaleDateString(lang === "en" ? "en-US" : "ko-KR", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </time>
                  {post.categories.slice(0, 2).map((category) => (
                    <span key={category} className="rounded-full bg-muted px-2 py-0.5">
                      {category}
                    </span>
                  ))}
                </div>
                <h2 className="mt-3 text-lg font-semibold text-foreground">{post.title}</h2>
                {post.description && (
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
                    {post.description}
                  </p>
                )}
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </>
  );
}
