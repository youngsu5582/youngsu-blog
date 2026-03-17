import { notFound } from "next/navigation";
import { getAllPosts, getPostBySlug, getUrlSlug } from "@/lib/content";
import { PostHeader } from "@/components/post/post-header";
import { TableOfContents } from "@/components/post/toc";
import { MDXContent } from "@/components/mdx/mdx-content";
import type { Metadata } from "next";

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

// Extract headings from MDX content for TOC
function extractHeadings(content: string): Array<{ id: string; text: string; level: number }> {
  const headingRegex = /^(#{2,3})\s+(.+)$/gm;
  const headings: Array<{ id: string; text: string; level: number }> = [];
  let match;

  while ((match = headingRegex.exec(content)) !== null) {
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

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  // Extract headings for TOC
  const headings = post.toc ? extractHeadings(post.body) : [];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_250px] gap-8">
      <article className="min-w-0">
        <PostHeader
          title={post.title}
          date={post.date}
          author={post.author}
          categories={post.categories}
          tags={post.tags}
          readingTime={post.metadata.readingTime}
        />

        {/* MDX Content */}
        <div className="prose prose-neutral dark:prose-invert max-w-none prose-headings:scroll-mt-20 prose-a:text-primary prose-a:no-underline hover:prose-a:underline">
          <MDXContent code={post.body} />
        </div>
      </article>

      {/* Table of Contents */}
      {post.toc && headings.length > 0 && (
        <aside className="hidden xl:block">
          <TableOfContents headings={headings} />
        </aside>
      )}
    </div>
  );
}
