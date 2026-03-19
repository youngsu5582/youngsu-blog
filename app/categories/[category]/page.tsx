import { notFound } from "next/navigation";
import { getAllCategories, getPostsByCategory, getUrlSlug, calcReadingTimeFromBody } from "@/lib/content";
import { PostCard } from "@/components/post/post-card";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LangToggle } from "@/components/common/lang-toggle";
import type { Metadata } from "next";

interface CategoryPageProps {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ lang?: string }>;
}

export async function generateStaticParams() {
  const categories = getAllCategories();
  return categories.map(({ name }) => ({
    category: encodeURIComponent(name),
  }));
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { category } = await params;
  const decoded = decodeURIComponent(category);
  return { title: `${decoded} 카테고리` };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { category } = await params;
  const sp = await searchParams;
  const decoded = decodeURIComponent(category);
  const lang = (sp.lang as "ko" | "en") || "ko";
  const posts = getPostsByCategory(decoded, lang);

  if (posts.length === 0) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href={`/categories?lang=${lang}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors mb-3">
            <ArrowLeft className="h-3.5 w-3.5" />
            전체 카테고리
          </Link>
          <h1 className="text-3xl font-bold tracking-tight theme-heading">{decoded}</h1>
          <p className="text-muted-foreground mt-3 text-sm">{posts.length}개의 포스트</p>
        </div>
        <LangToggle currentLang={lang} basePath={`/categories/${encodeURIComponent(decoded)}`} />
      </div>

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
    </div>
  );
}
