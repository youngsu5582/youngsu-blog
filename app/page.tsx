import { siteConfig } from "@/config/site";
import { getAllPosts, getAllArticles, getAllNotes, getUrlSlug, calcReadingTimeFromBody, getAlternatePost, type Note, type Article } from "@/lib/content";
import { PostCard } from "@/components/post/post-card";
import { FeaturedPostCard } from "@/components/post/featured-post-card";
import { ArticleCard } from "@/components/article/article-card";
import { NoteCard } from "@/components/note/note-card";
import { AnimateIn } from "@/components/common/animate-in";
import { SectionDivider } from "@/components/common/section-divider";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: siteConfig.name,
  description: siteConfig.description,
  alternates: {
    canonical: "/",
  },
};

export default function Home() {
  const recentPosts = getAllPosts("ko").slice(0, 5);
  const recentArticles = getAllArticles().slice(0, 3);
  const recentNotes = getAllNotes().slice(0, 3);

  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="relative pt-4 pb-2">
        {/* Gradient glow background */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-primary/5 via-[oklch(0.65_0.12_195)/0.05] to-transparent rounded-full blur-3xl" />
          <div className="absolute -top-20 right-1/4 w-80 h-80 bg-gradient-to-bl from-[oklch(0.70_0.10_185)/0.04] to-transparent rounded-full blur-3xl" />
        </div>

        <p className="text-sm text-muted-foreground mb-2 tracking-wide">
          Welcome
        </p>
        <h1 className="text-4xl font-bold tracking-tight leading-tight">
          <span className="theme-gradient-text">{siteConfig.author.name}</span>
          <span className="text-foreground">의 블로그</span>
        </h1>
        <p className="text-muted-foreground mt-3 text-base leading-relaxed max-w-lg">
          {siteConfig.description}
        </p>

        {/* Decorative dots */}
        <div className="mt-4 flex items-center gap-2">
          <div className="w-16 h-0.5 rounded-full bg-gradient-to-r from-primary to-transparent" />
          <div className="flex gap-1">
            <div className="w-1 h-1 rounded-full bg-primary/40" />
            <div className="w-1 h-1 rounded-full bg-primary/25" />
            <div className="w-1 h-1 rounded-full bg-primary/15" />
          </div>
        </div>
      </section>

      {/* Recent Posts */}
      {recentPosts.length > 0 ? (
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold tracking-tight theme-heading">
              최근 포스트
            </h2>
            <Link
              href="/posts"
              className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200 flex items-center gap-1"
            >
              더 보기
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div>
            {recentPosts.map((post, index) => {
              const alternatePost = getAlternatePost(post);
              const alternate = alternatePost
                ? { slug: getUrlSlug(alternatePost.slug), lang: alternatePost.lang as "ko" | "en" }
                : undefined;

              return (
                <AnimateIn key={post.slug} delay={index * 100}>
                  {index === 0 ? (
                    <FeaturedPostCard
                      title={post.title}
                      slug={getUrlSlug(post.slug)}
                      description={post.description}
                      date={post.date}
                      categories={post.categories}
                      tags={post.tags}
                      image={post.image}
                      readingTime={calcReadingTimeFromBody(post.body)}
                      alternatePost={alternate}
                    />
                  ) : (
                    <PostCard
                      title={post.title}
                      slug={getUrlSlug(post.slug)}
                      description={post.description}
                      date={post.date}
                      categories={post.categories}
                      tags={post.tags}
                      image={post.image}
                      readingTime={calcReadingTimeFromBody(post.body)}
                      alternatePost={alternate}
                    />
                  )}
                </AnimateIn>
              );
            })}
          </div>
        </section>
      ) : (
        <section>
          <h2 className="text-lg font-semibold tracking-tight theme-heading">
            최근 포스트
          </h2>
          <p className="text-muted-foreground mt-6 text-sm">
            아직 포스트가 없습니다.
          </p>
        </section>
      )}

      <SectionDivider variant="ornament" />

      {/* Recent Articles */}
      {recentArticles.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold tracking-tight theme-heading">
              최근 아티클
            </h2>
            <Link
              href="/articles"
              className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200 flex items-center gap-1"
            >
              더 보기
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div>
            {recentArticles.map((article: Article, index) => (
              <AnimateIn key={article.slug} delay={index * 100}>
                <ArticleCard
                  title={article.title}
                  slug={getUrlSlug(article.slug)}
                  description={article.description}
                  date={article.date}
                  categories={article.categories}
                  tags={article.tags}
                  image={article.image}
                  status={article.status}
                  moc={article.moc}
                  readingTime={calcReadingTimeFromBody(article.body)}
                />
              </AnimateIn>
            ))}
          </div>
        </section>
      )}

      <SectionDivider variant="ornament" />

      {/* Recent Notes */}
      {recentNotes.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold tracking-tight theme-heading">
              최근 학습 노트
            </h2>
            <Link
              href="/notes"
              className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200 flex items-center gap-1"
            >
              더 보기
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div>
            {recentNotes.map((note: Note, index: number) => (
              <AnimateIn key={note.slug} delay={index * 100}>
                <NoteCard
                  title={note.title}
                  slug={getUrlSlug(note.slug)}
                  date={note.date}
                  categories={note.categories}
                  tags={note.tags}
                  readingTime={calcReadingTimeFromBody(note.body)}
                />
              </AnimateIn>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
