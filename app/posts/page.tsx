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
  const canonical = lang === "en" ? `${siteConfig.url}/posts?lang=en` : `${siteConfig.url}/posts`;

  return {
    title: lang === "en" ? "Posts" : "포스트",
    description:
      lang === "en"
        ? "English posts from Youngsu Lee's backend engineering blog."
        : "백엔드 개발자 이영수의 기술 블로그 포스트 모음입니다.",
    alternates: {
      canonical,
      languages: {
        ko: `${siteConfig.url}/posts`,
        en: `${siteConfig.url}/posts?lang=en`,
        "x-default": `${siteConfig.url}/posts`,
      },
    },
    openGraph: {
      title: lang === "en" ? "Posts" : "포스트",
      description:
        lang === "en"
          ? "English posts from Youngsu Lee's backend engineering blog."
          : "백엔드 개발자 이영수의 기술 블로그 포스트 모음입니다.",
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
