import Link from "next/link";
import { getUrlSlug } from "@/lib/content";

interface RelatedPost {
  title: string;
  slug: string;
  date: string;
  categories: string[];
}

interface RelatedPostsProps {
  posts: RelatedPost[];
}

export function RelatedPosts({ posts }: RelatedPostsProps) {
  if (posts.length === 0) return null;

  return (
    <section className="pt-8 mt-8 border-t border-border">
      <h3 className="text-sm font-semibold mb-4">관련 포스트</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={`/posts/${getUrlSlug(post.slug)}`}
            className="group p-3 rounded-lg border border-border/40 hover:border-primary/30 hover:bg-primary/5 dark:hover:bg-primary/8 transition-all"
          >
            <p className="text-sm font-medium group-hover:text-primary transition-colors line-clamp-2">
              {post.title}
            </p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-[10px] text-muted-foreground">
                {new Date(post.date).toLocaleDateString("ko-KR")}
              </span>
              {post.categories[0] && (
                <span className="text-[10px] text-primary/60">{post.categories[0]}</span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
