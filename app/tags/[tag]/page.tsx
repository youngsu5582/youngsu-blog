import { notFound } from "next/navigation";
import { getAllTags, getPostsByTag, getUrlSlug } from "@/lib/content";
import { PostCard } from "@/components/post/post-card";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

interface TagPageProps {
  params: Promise<{ tag: string }>;
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
  return {
    title: `#${decoded}`,
    description: `#${decoded} 태그의 모든 글`,
  };
}

export default async function TagPage({ params }: TagPageProps) {
  const { tag } = await params;
  const decoded = decodeURIComponent(tag);
  const posts = getPostsByTag(decoded);

  if (posts.length === 0) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/tags"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          전체 태그
        </Link>
        <h1 className="text-3xl font-bold tracking-tight theme-heading">#{decoded}</h1>
        <p className="text-muted-foreground mt-3 text-sm">
          {posts.length}개의 포스트
        </p>
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
            readingTime={post.metadata.readingTime}
          />
        ))}
      </div>
    </div>
  );
}
