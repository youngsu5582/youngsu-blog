import { notFound } from "next/navigation";
import {
  getAllPosts,
  getAlternatePost,
  getPostBySlug,
  getPostsBySeries,
  getSeriesSlug,
  getUrlSlug,
} from "@/lib/content";
import type { Post } from "@/lib/content";
import { PostHeader } from "@/components/post/post-header";
import { TableOfContents } from "@/components/post/toc";
import { MobileToc } from "@/components/post/mobile-toc";
import { MDXContent } from "@/components/mdx/mdx-content";
import type { Metadata } from "next";
import { GiscusComments } from "@/components/common/giscus-comments";
import { ReadingProgress } from "@/components/post/reading-progress";
import { ReadingPosition } from "@/components/post/reading-position";
import { ShareButtons } from "@/components/post/share-buttons";
import { PostNavigation } from "@/components/post/post-navigation";
import { RelatedPosts } from "@/components/post/related-posts";
import { ScrollToTop } from "@/components/common/scroll-to-top";
import { SeriesNav } from "@/components/post/series-nav";
import { TranslationNotice } from "@/components/post/translation-notice";
import { Breadcrumbs } from "@/components/common/breadcrumbs";
import { generateArticleSchema, generateBreadcrumbSchema, renderJsonLd } from "@/lib/json-ld";
import { siteConfig } from "@/config/site";
import { absoluteSiteUrl, buildTranslatedPostAlternates, contentUrl } from "@/lib/seo";
import fs from "fs";
import path from "path";

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({
    slug: getUrlSlug(post.slug),
  }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    return {
      title: "포스트를 찾을 수 없습니다",
    };
  }

  const alternatePost = getAlternatePost(post);
  const postUrl = contentUrl("posts", slug);
  const languageAlternates = alternatePost
    ? buildTranslatedPostAlternates({
        currentLang: post.lang as "ko" | "en",
        currentSlug: slug,
        alternateLang: alternatePost.lang as "ko" | "en",
        alternateSlug: getUrlSlug(alternatePost.slug),
      })
    : undefined;

  return {
    title: post.title,
    description: post.description,
    alternates: {
      canonical: postUrl,
      ...(languageAlternates ? { languages: languageAlternates } : {}),
    },
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      url: postUrl,
      locale: post.lang === "en" ? "en_US" : "ko_KR",
      publishedTime: post.date,
      modifiedTime: post.updated ?? post.date,
      authors: [post.author],
      images: post.image ? [absoluteSiteUrl(post.image)] : undefined,
    },
  };
}

// Extract headings from raw MDX source for TOC
function extractHeadings(rawContent: string): Array<{ id: string; text: string; level: number }> {
  const headingRegex = /^(#{2,4})\s+(.+)$/gm;
  const headings: Array<{ id: string; text: string; level: number }> = [];
  const slugCounts = new Map<string, number>();
  let match;

  while ((match = headingRegex.exec(rawContent)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    let id = text
      .toLowerCase()
      .replace(/[^a-z0-9가-힣\s-]/g, "")
      .replace(/\s+/g, "-");

    const count = slugCounts.get(id) ?? 0;
    slugCounts.set(id, count + 1);
    if (count > 0) {
      id = `${id}-${count}`;
    }

    headings.push({ id, text, level });
  }

  return headings;
}

// Read raw .mdx file content for heading extraction
function getRawContent(slug: string): string {
  const filePath = path.join(process.cwd(), "content", "posts", `${slug}.mdx`);
  try {
    return fs.readFileSync(filePath, "utf-8");
  } catch {
    return "";
  }
}

// Calculate reading time from raw content (한글 기준 ~500자/분, 영문 ~200단어/분)
function calcReadingTime(rawContent: string): number {
  // Remove frontmatter
  const body = rawContent.replace(/^---[\s\S]*?---/, "").trim();
  // Remove code blocks
  const noCode = body.replace(/```[\s\S]*?```/g, "");
  // Count characters (한글) + words (영문)
  const koreanChars = (noCode.match(/[가-힣]/g) || []).length;
  const englishWords = (noCode.match(/[a-zA-Z]+/g) || []).length;
  const minutes = Math.ceil(koreanChars / 500 + englishWords / 200);
  return Math.max(1, minutes);
}

function calcWordCount(rawContent: string): number {
  const body = rawContent.replace(/^---[\s\S]*?---/, "").trim();
  const noCode = body.replace(/```[\s\S]*?```/g, "");
  const koreanWords = noCode.match(/[가-힣]+/g) || [];
  const englishWords = noCode.match(/[a-zA-Z0-9]+/g) || [];
  return koreanWords.length + englishWords.length;
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  // Extract headings + reading time from raw file
  const rawContent = getRawContent(slug);
  const headings = post.toc ? extractHeadings(rawContent) : [];
  const readingTime = calcReadingTime(rawContent);
  const wordCount = calcWordCount(rawContent);
  const alternatePost = getAlternatePost(post);

  // Prev/Next navigation
  const allPosts = getAllPosts(post.lang as "ko" | "en");
  const currentIdx = allPosts.findIndex((p) => getUrlSlug(p.slug) === slug);
  const prevPost = currentIdx < allPosts.length - 1 ? allPosts[currentIdx + 1] : undefined;
  const nextPost = currentIdx > 0 ? allPosts[currentIdx - 1] : undefined;

  // Related posts — manual (frontmatter) first, then auto (same category)
  const relatedSlugs =
    "related" in post && Array.isArray(post.related) ? (post.related as string[]) : [];
  const manualRelated = relatedSlugs
    .map((relSlug: string) => {
      // Try language-matched version first
      const langSuffix = post.lang === "en" ? "-en" : "";
      return getPostBySlug(relSlug + langSuffix) || getPostBySlug(relSlug);
    })
    .filter((p): p is Post => Boolean(p));

  const autoRelated =
    manualRelated.length >= 4
      ? []
      : allPosts
          .filter(
            (p) =>
              p.slug !== post.slug &&
              !manualRelated.some((m) => m.slug === p.slug) &&
              p.categories.some((c) => post.categories.includes(c)),
          )
          .slice(0, 4 - manualRelated.length);

  const related = [...manualRelated, ...autoRelated].slice(0, 4);

  // Series navigation — keep language variants separate so ko/en translations
  // of the same article do not appear as two different steps in one series.
  const seriesPosts = post.series ? getPostsBySeries(post.series, post.lang as "ko" | "en") : [];

  // JSON-LD structured data
  const postUrl = contentUrl("posts", slug);
  const articleSchema = generateArticleSchema({
    title: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.updated,
    author: post.author,
    image: post.image,
    url: postUrl,
    inLanguage: post.lang === "en" ? "en-US" : "ko-KR",
    keywords: post.tags,
    articleSection: post.categories,
    wordCount,
    timeRequired: `PT${readingTime}M`,
    isPartOf: post.series
      ? {
          name: post.series,
          url: `${siteConfig.url}/series/${getSeriesSlug(post.series)}`,
        }
      : undefined,
  });

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "홈", url: siteConfig.url },
    { name: "포스트", url: `${siteConfig.url}/posts` },
    { name: post.title, url: postUrl },
  ]);

  return (
    <>
      {renderJsonLd(articleSchema)}
      {renderJsonLd(breadcrumbSchema)}
      <ReadingProgress />
      <ReadingPosition slug={slug} />
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_220px] gap-10">
        <article className="min-w-0" lang={post.lang === "en" ? "en" : undefined}>
          <Breadcrumbs
            items={[
              { label: "포스트", href: "/posts" },
              ...(post.categories.length > 0
                ? [{ label: post.categories[0], href: `/categories/${post.categories[0]}` }]
                : []),
              { label: post.title, href: `/posts/${slug}`, current: true },
            ]}
          />
          <PostHeader
            title={post.title}
            date={post.date}
            author={post.author}
            categories={post.categories}
            tags={post.tags}
            readingTime={readingTime}
          />

          {alternatePost && (
            <TranslationNotice
              currentLang={post.lang as "ko" | "en"}
              alternate={{
                title: alternatePost.title,
                slug: getUrlSlug(alternatePost.slug),
                lang: alternatePost.lang as "ko" | "en",
              }}
            />
          )}

          {/* Series Navigation */}
          {post.series && seriesPosts.length > 1 && (
            <SeriesNav
              seriesName={post.series}
              seriesSlug={getSeriesSlug(post.series)}
              posts={seriesPosts}
              currentSlug={slug}
            />
          )}

          {/* MDX Content */}
          <div className="prose prose-neutral dark:prose-invert max-w-none prose-headings:scroll-mt-20 prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-p:leading-relaxed prose-pre:max-w-full prose-pre:overflow-x-auto">
            <MDXContent code={post.body} />
          </div>

          {/* Post End Mark */}
          <div className="flex justify-center py-8">
            <span className="text-2xl text-muted-foreground/30 select-none">空</span>
          </div>

          <ShareButtons title={post.title} slug={slug} />

          <PostNavigation
            prev={prevPost ? { title: prevPost.title, slug: getUrlSlug(prevPost.slug) } : undefined}
            next={nextPost ? { title: nextPost.title, slug: getUrlSlug(nextPost.slug) } : undefined}
          />

          <RelatedPosts posts={related} />

          {post.comments && <GiscusComments />}
        </article>

        {/* Table of Contents */}
        {post.toc && headings.length > 0 && (
          <aside className="hidden xl:block self-start sticky top-20">
            <TableOfContents headings={headings} />
          </aside>
        )}
      </div>

      {/* Mobile TOC */}
      {post.toc && headings.length > 0 && <MobileToc headings={headings} />}

      <ScrollToTop />
    </>
  );
}
