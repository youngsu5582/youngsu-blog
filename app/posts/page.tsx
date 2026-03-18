import { getAllPosts, getUrlSlug } from "@/lib/content";
import { PostList } from "@/components/post/post-list";
import Link from "next/link";

const POSTS_PER_PAGE = 10;

interface PostsPageProps {
  searchParams: Promise<{ page?: string; lang?: string }>;
}

export const metadata = {
  title: "포스트",
  description: "모든 포스트를 확인하세요.",
};

export default async function PostsPage({ searchParams }: PostsPageProps) {
  const params = await searchParams;
  const currentPage = Number(params.page) || 1;
  const lang = (params.lang as "ko" | "en") || "ko";

  const allPosts = getAllPosts(lang);
  const totalPages = Math.ceil(allPosts.length / POSTS_PER_PAGE);

  const posts = allPosts.slice(
    (currentPage - 1) * POSTS_PER_PAGE,
    currentPage * POSTS_PER_PAGE
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight theme-heading">포스트</h1>
          <p className="text-muted-foreground mt-3 text-sm">
            총 {allPosts.length}개의 포스트
          </p>
        </div>

        {/* Language toggle */}
        <div className="flex gap-1 border border-border rounded-lg p-0.5">
          <Link
            href="/posts"
            className={`text-xs px-3 py-1.5 rounded-md transition-colors ${
              lang === "ko"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            KO
          </Link>
          <Link
            href="/posts?lang=en"
            className={`text-xs px-3 py-1.5 rounded-md transition-colors ${
              lang === "en"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            EN
          </Link>
        </div>
      </div>

      <PostList
        posts={posts.map((p) => ({ ...p, slug: getUrlSlug(p.slug) }))}
        currentPage={currentPage}
        totalPages={totalPages}
        basePath={lang === "en" ? "/posts?lang=en" : "/posts"}
      />
    </div>
  );
}
