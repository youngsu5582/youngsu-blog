import { notFound } from "next/navigation";
import { getAllCategories, getContentByCategory, getUrlSlug, calcReadingTimeFromBody } from "@/lib/content";
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

  const { posts, articles } = getContentByCategory(decoded, lang);
  const totalCount = posts.length + articles.length;

  // Check if category exists in any language
  const allContent = getContentByCategory(decoded);
  if (allContent.posts.length + allContent.articles.length === 0) {
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
          <p className="text-muted-foreground mt-3 text-sm">{totalCount}개의 콘텐츠</p>
        </div>
        <LangToggle currentLang={lang} basePath={`/categories/${encodeURIComponent(decoded)}`} />
      </div>

      {totalCount === 0 ? (
        <div className="text-center py-12 text-sm text-muted-foreground">
          이 카테고리에 {lang === "en" ? "영어" : "한국어"} 콘텐츠가 없습니다.
        </div>
      ) : (
        <div className="space-y-8">
          {/* Posts */}
          {posts.length > 0 && (
            <section>
              {articles.length > 0 && (
                <h2 className="text-sm font-semibold text-muted-foreground mb-3">포스트 ({posts.length})</h2>
              )}
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
            </section>
          )}

          {/* Articles */}
          {articles.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-muted-foreground mb-3">아티클 ({articles.length})</h2>
              <div className="space-y-2">
                {articles.map((article) => (
                  <Link
                    key={article.slug}
                    href={`/articles/${getUrlSlug(article.slug)}`}
                    className="block p-3 rounded-lg border border-border/40 hover:border-primary/30 hover:bg-primary/5 dark:hover:bg-primary/8 transition-all"
                  >
                    <p className="text-sm font-medium hover:text-primary transition-colors">{article.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(article.date).toLocaleDateString("ko-KR")}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
