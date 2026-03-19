import { notFound } from "next/navigation";
import { getAllTags, getPostsByTag, getUrlSlug, calcReadingTimeFromBody } from "@/lib/content";
import { PostCard } from "@/components/post/post-card";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LangToggle } from "@/components/common/lang-toggle";
import type { Metadata } from "next";

interface TagPageProps {
  params: Promise<{ tag: string }>;
  searchParams: Promise<{ lang?: string }>;
}

export async function generateStaticParams() {
  const tags = getAllTags();
  return tags.map(({ name }) => ({
    tag: encodeURIComponent(name),
  }));
}

export async function generateMetadata({ params }: TagPageProps): Promise<Metadata> {
  const { tag } = await params;
  const decoded = decodeURIComponent(tag);
  return { title: `#${decoded}` };
}

export default async function TagPage({ params, searchParams }: TagPageProps) {
  const { tag } = await params;
  const sp = await searchParams;
  const decoded = decodeURIComponent(tag);
  const lang = (sp.lang as "ko" | "en") || "ko";
  const posts = getPostsByTag(decoded, lang);
  // Check if tag exists in any language (for 404 vs empty state)
  const existsInAnyLang = getPostsByTag(decoded).length > 0;
  if (!existsInAnyLang) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href={`/tags?lang=${lang}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors mb-3">
            <ArrowLeft className="h-3.5 w-3.5" />
            전체 태그
          </Link>
          <h1 className="text-3xl font-bold tracking-tight theme-heading">#{decoded}</h1>
          <p className="text-muted-foreground mt-3 text-sm">{posts.length}개의 포스트</p>
        </div>
        <LangToggle currentLang={lang} basePath={`/tags/${encodeURIComponent(decoded)}`} />
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-12 text-sm text-muted-foreground">
          이 태그에 {lang === "en" ? "영어" : "한국어"} 포스트가 없습니다.
        </div>
      ) : (
      <div>
        {posts.map((post) => (
          <PostCard
            key={post.slug}
            title={post.title}
            slug={getUrlSlug(post.slug)}
            description={post.description}
            date={post.date}
            categories={post.categories}
            tags={post.tags}
            image={post.image}
            readingTime={calcReadingTimeFromBody(post.body)}
          />
        ))}
      </div>
      )}
    </div>
  );
}
