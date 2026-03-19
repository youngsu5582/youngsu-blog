import { notFound } from "next/navigation";
import { getAllPosts, getPostBySlug, getPostsBySeries, getUrlSlug } from "@/lib/content";
import { PostHeader } from "@/components/post/post-header";
import { TableOfContents } from "@/components/post/toc";
import { MDXContent } from "@/components/mdx/mdx-content";
import type { Metadata } from "next";
import { GiscusComments } from "@/components/common/giscus-comments";
import { ReadingProgress } from "@/components/post/reading-progress";
import { ShareButtons } from "@/components/post/share-buttons";
import { PostNavigation } from "@/components/post/post-navigation";
import { RelatedPosts } from "@/components/post/related-posts";
import { ScrollToTop } from "@/components/common/scroll-to-top";
import { SeriesNav } from "@/components/post/series-nav";
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

  return {
    title: post.title,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.date,
      authors: [post.author],
      images: post.image ? [post.image] : undefined,
    },
  };
}

// Extract headings from raw MDX source for TOC
function extractHeadings(rawContent: string): Array<{ id: string; text: string; level: number }> {
  const headingRegex = /^(#{2,4})\s+(.+)$/gm;
  const headings: Array<{ id: string; text: string; level: number }> = [];
  let match;

  while ((match = headingRegex.exec(rawContent)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    const id = text
      .toLowerCase()
      .replace(/[^a-z0-9가-힣\s-]/g, "")
      .replace(/\s+/g, "-");

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

  // Prev/Next navigation
  const allPosts = getAllPosts(post.lang as "ko" | "en");
  const currentIdx = allPosts.findIndex((p) => getUrlSlug(p.slug) === slug);
  const prevPost = currentIdx < allPosts.length - 1 ? allPosts[currentIdx + 1] : undefined;
  const nextPost = currentIdx > 0 ? allPosts[currentIdx - 1] : undefined;

  // Related posts — manual (frontmatter) first, then auto (same category)
  const manualRelated = ((post as any).related || [])
    .map((relSlug: string) => {
      // Try language-matched version first
      const langSuffix = post.lang === "en" ? "-en" : "";
      return getPostBySlug(relSlug + langSuffix) || getPostBySlug(relSlug);
    })
    .filter(Boolean);

  const autoRelated = manualRelated.length >= 4 ? [] : allPosts
    .filter((p) => p.slug !== post.slug && !manualRelated.some((m: any) => m?.slug === p.slug) && p.categories.some((c) => post.categories.includes(c)))
    .slice(0, 4 - manualRelated.length);

  const related = [...manualRelated, ...autoRelated].slice(0, 4);

  // Series navigation
  const seriesPosts = post.series ? getPostsBySeries(post.series) : [];

  return (
    <>
      <ReadingProgress />
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_220px] gap-10">
        <article className="min-w-0">
          <PostHeader
            title={post.title}
            date={post.date}
            author={post.author}
            categories={post.categories}
            tags={post.tags}
            readingTime={readingTime}
          />

          {/* Series Navigation */}
          {post.series && seriesPosts.length > 1 && (
            <SeriesNav
              seriesName={post.series}
              posts={seriesPosts}
              currentSlug={slug}
            />
          )}

          {/* MDX Content */}
          <div className="prose prose-neutral dark:prose-invert max-w-none prose-headings:scroll-mt-20 prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-p:leading-relaxed prose-pre:max-w-full prose-pre:overflow-x-auto">
            <MDXContent code={post.body} />
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
    <ScrollToTop />
    </>
  );
}
