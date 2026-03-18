import { siteConfig } from "@/config/site";
import { getAllPosts, getUrlSlug } from "@/lib/content";
import { PostCard } from "@/components/post/post-card";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function Home() {
  const recentPosts = getAllPosts().slice(0, 5);

  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="pt-4 pb-2">
        <p className="text-sm text-muted-foreground mb-2 tracking-wide">
          Welcome
        </p>
        <h1 className="text-4xl font-bold tracking-tight leading-tight">
          <span className="sora-gradient-text">{siteConfig.author.name}</span>
          <span className="text-foreground">의 블로그</span>
        </h1>
        <p className="text-muted-foreground mt-3 text-base leading-relaxed max-w-lg">
          {siteConfig.description}
        </p>
        <div className="mt-4 w-16 h-0.5 rounded-full bg-gradient-to-r from-primary to-transparent" />
      </section>

      {/* Recent Posts */}
      {recentPosts.length > 0 ? (
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold tracking-tight sora-heading">
              최근 포스트
            </h2>
            <Link
              href="/posts"
              className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200 flex items-center gap-1"
            >
              전체 보기
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div>
            {recentPosts.map((post) => (
              <PostCard
                key={post.slug}
                title={post.title}
                slug={getUrlSlug(post.slug)}
                description={post.description}
                date={post.date}
                categories={post.categories}
                tags={post.tags}
                image={post.image}
                readingTime={post.metadata.readingTime}
              />
            ))}
          </div>
        </section>
      ) : (
        <section>
          <h2 className="text-lg font-semibold tracking-tight sora-heading">
            최근 포스트
          </h2>
          <p className="text-muted-foreground mt-6 text-sm">
            아직 포스트가 없습니다.
          </p>
        </section>
      )}
    </div>
  );
}
