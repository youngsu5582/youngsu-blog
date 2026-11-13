import { notFound } from "next/navigation";
import { getAllArticles, getAllNotes, getAllPosts, getContentByCategory, getUrlSlug, calcReadingTimeFromBody, getAlternatePost, type Note } from "@/lib/content";
import { PostCard } from "@/components/post/post-card";
import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";
import { LangToggle } from "@/components/common/lang-toggle";
import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { locales, type Locale } from "@/lib/i18n";

/*
 * /categories/[category]/[lang] 과 /categories/[category]/[lang]/[parent] 가 함께 쓰는 본문.
 * 공개 주소는 /categories/{category}?lang=en&parent={parent} 그대로다. next.config 의 rewrite 가
 * 경로 파라미터로 옮겨 주므로, 페이지가 searchParams 를 읽지 않고 빌드 때 미리 만들어진다.
 */
export interface CategoryRouteParams {
  category: string;
  lang: string;
  parent?: string;
}

/** 경로의 lang 이 ko/en 이 아니면 404 — rewrite 를 거치지 않은 직접 접근만 해당된다 */
export function parseCategoryLang(lang: string): Locale {
  if (!locales.includes(lang as Locale)) {
    notFound();
  }
  return lang as Locale;
}

/** 카테고리 목록(/categories)이 만드는 부모 → 자식 링크 쌍. categories[0] 이 부모다 */
export function getCategoryParentPairs(): Array<{ category: string; parent: string }> {
  const pairs = new Map<string, { category: string; parent: string }>();
  for (const item of [...getAllPosts(), ...getAllArticles(), ...getAllNotes()]) {
    const [parent, ...children] = item.categories;
    for (const category of children) {
      pairs.set(`${parent}\u0000${category}`, { category, parent });
    }
  }
  return [...pairs.values()];
}

export function buildCategoryMetadata({ category, lang: langParam, parent: parentParam }: CategoryRouteParams): Metadata {
  const decoded = decodeURIComponent(category);
  const lang = langParam === "en" ? "en" : "ko";
  const parent = parentParam ? decodeURIComponent(parentParam) : undefined;
  const categoryUrl = `${siteConfig.url}/categories/${encodeURIComponent(decoded)}${lang === "en" ? "?lang=en" : ""}`;

  return {
    title: lang === "en" ? `${decoded} category` : `${decoded} 카테고리`,
    description:
      lang === "en" ? `Posts, articles, and notes in the ${decoded} category.` : `${decoded} 카테고리의 글과 아티클, 노트를 모아봅니다.`,
    alternates: { canonical: categoryUrl },
    ...(parent ? { robots: { index: false, follow: true } } : {}),
    openGraph: {
      title: lang === "en" ? `${decoded} category` : `${decoded} 카테고리`,
      description:
        lang === "en" ? `Posts, articles, and notes in the ${decoded} category.` : `${decoded} 카테고리의 글과 아티클, 노트를 모아봅니다.`,
      url: categoryUrl,
      type: "website",
    },
  };
}

export function CategoryView({ category, lang: langParam, parent }: CategoryRouteParams) {
  const lang = parseCategoryLang(langParam);
  const decoded = decodeURIComponent(category);
  const parentCategory = parent ? decodeURIComponent(parent) : undefined;

  let { posts, articles, notes } = getContentByCategory(decoded, lang);

  // 부모 카테고리가 지정되면, 해당 부모도 포함하는 콘텐츠만 필터링
  if (parentCategory) {
    posts = posts.filter((p) => p.categories.includes(parentCategory));
    articles = articles.filter((a) => a.categories.includes(parentCategory));
    notes = notes.filter((n: Note) => n.categories.includes(parentCategory));
  }

  const totalCount = posts.length + articles.length + notes.length;

  // Check if category exists in any language
  const allContent = getContentByCategory(decoded);
  if (allContent.posts.length + allContent.articles.length + allContent.notes.length === 0) {
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
          <h1 className="text-3xl font-bold tracking-tight theme-heading">
            {parentCategory && (
              <span className="text-muted-foreground/50 font-normal">{parentCategory} / </span>
            )}
            {decoded}
          </h1>
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
                {posts.map((post) => {
                  const alternatePost = getAlternatePost(post);
                  return (
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
                      alternatePost={alternatePost
                        ? { slug: getUrlSlug(alternatePost.slug), lang: alternatePost.lang as "ko" | "en" }
                        : undefined}
                    />
                  );
                })}
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

          {/* Notes */}
          {notes.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-muted-foreground mb-3">노트 ({notes.length})</h2>
              <div className="space-y-2">
                {notes.map((note: Note) => (
                  <Link
                    key={note.slug}
                    href={`/notes/${getUrlSlug(note.slug)}`}
                    className="block p-3 rounded-lg border border-border/40 hover:border-primary/30 hover:bg-primary/5 dark:hover:bg-primary/8 transition-all group"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5 text-muted-foreground/50" />
                      <p className="text-sm font-medium group-hover:text-primary transition-colors">{note.title}</p>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-muted-foreground">
                        {new Date(note.date).toLocaleDateString("ko-KR")}
                      </p>
                      {note.tags.length > 0 && (
                        <div className="flex gap-1">
                          {note.tags.slice(0, 2).map((tag: string) => (
                            <span key={tag} className="text-[10px] text-violet-500/70 dark:text-violet-400/70">#{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>
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
