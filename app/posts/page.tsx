import { getAllPosts, getUrlSlug, calcReadingTimeFromBody, getAlternatePost } from "@/lib/content";
import { PostList } from "@/components/post/post-list";
import { BrowserLanguageHint } from "@/components/post/browser-language-hint";
import { LangToggle } from "@/components/common/lang-toggle";
import { siteConfig } from "@/config/site";
import type { Metadata } from "next";

const POSTS_PER_PAGE = 10;

interface PostsPageProps {
  searchParams: Promise<{ page?: string; lang?: string }>;
}

export async function generateMetadata({ searchParams }: PostsPageProps): Promise<Metadata> {
  const params = await searchParams;
  const lang = params.lang === "en" ? "en" : "ko";
  const page = Math.max(1, Number(params.page) || 1);

  // 페이지네이션 페이지는 self-canonical (2페이지가 1페이지의 사본으로 처리되는 것 방지)
  const query = new URLSearchParams();
  if (lang === "en") query.set("lang", "en");
  if (page > 1) query.set("page", String(page));
  const queryString = query.toString();
  const canonical = `${siteConfig.url}/posts${queryString ? `?${queryString}` : ""}`;

  const baseTitle = lang === "en" ? "Posts" : "포스트";
  const title = page > 1 ? `${baseTitle} - ${page}` : baseTitle;
  const description =
    lang === "en"
      ? "English posts from Youngsu Lee's backend engineering blog."
      : "백엔드 개발자 이영수의 기술 블로그 포스트 모음입니다.";

  return {
    title,
    description,
    alternates: {
      canonical,
      // hreflang은 언어 간 등가 페이지에만 — 페이지네이션 페이지는 언어별 개수가 달라 등가가 아님
      ...(page === 1
        ? {
            languages: {
              ko: `${siteConfig.url}/posts`,
              en: `${siteConfig.url}/posts?lang=en`,
              "x-default": `${siteConfig.url}/posts`,
            },
          }
        : {}),
    },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "website",
    },
  };
}

export default async function PostsPage({ searchParams }: PostsPageProps) {
  const params = await searchParams;
  const currentPage = Number(params.page) || 1;
  const lang = (params.lang as "ko" | "en") || "ko";

  const allPosts = getAllPosts(lang);
  const totalPages = Math.ceil(allPosts.length / POSTS_PER_PAGE);
  const isEnglish = lang === "en";

  const posts = allPosts.slice(
    (currentPage - 1) * POSTS_PER_PAGE,
    currentPage * POSTS_PER_PAGE
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight theme-heading">
            {isEnglish ? "Posts" : "포스트"}
          </h1>
          <p className="text-muted-foreground mt-3 text-sm">
            {isEnglish ? `${allPosts.length} English posts` : `총 ${allPosts.length}개의 포스트`}
          </p>
        </div>

        <LangToggle currentLang={lang} />
      </div>

      <BrowserLanguageHint currentLang={lang} />

      <PostList
        posts={posts.map((p) => {
          const alternatePost = getAlternatePost(p);
          return {
            ...p,
            slug: getUrlSlug(p.slug),
            metadata: { readingTime: calcReadingTimeFromBody(p.body) },
            alternatePost: alternatePost
              ? { slug: getUrlSlug(alternatePost.slug), lang: alternatePost.lang as "ko" | "en" }
              : undefined,
          };
        })}
        currentPage={currentPage}
        totalPages={totalPages}
        basePath={lang === "en" ? "/posts?lang=en" : "/posts"}
        emptyLabel={isEnglish ? "No posts found." : "포스트가 없습니다."}
        previousLabel={isEnglish ? "Previous" : "이전"}
        nextLabel={isEnglish ? "Next" : "다음"}
      />
    </div>
  );
}
