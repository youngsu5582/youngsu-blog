import { notFound } from "next/navigation";
import { getAllArticles, getArticleBySlug, getUrlSlug } from "@/lib/content";
import { PostHeader } from "@/components/post/post-header";
import { TableOfContents } from "@/components/post/toc";
import type { Metadata } from "next";

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const articles = getAllArticles();
  return articles.map((article) => ({
    slug: getUrlSlug(article.slug),
  }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);

  if (!article) {
    return {
      title: "아티클을 찾을 수 없습니다",
    };
  }

  return {
    title: article.title,
    description: article.description,
    openGraph: {
      title: article.title,
      description: article.description,
      type: "article",
      publishedTime: article.date,
      authors: [article.author],
      images: article.image ? [article.image] : undefined,
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

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  // Extract headings for TOC
  const headings = extractHeadings(article.body);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_250px] gap-8">
      <article className="min-w-0">
        {/* Status badge */}
        <div className="mb-4">
          <span
            className={`inline-flex items-center text-xs px-2.5 py-1 rounded-full font-medium ${
              article.status === "evergreen"
                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                : article.status === "seed"
                  ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                  : "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
            }`}
          >
            {article.status === "evergreen" ? "🌲 Evergreen" : article.status === "seed" ? "🌱 Seed" : "📝 Draft"}
          </span>
          {article.moc && (
            <span className="ml-2 text-sm text-muted-foreground">
              MOC: {article.moc}
            </span>
          )}
        </div>

        <PostHeader
          title={article.title}
          date={article.date}
          author={article.author}
          categories={article.categories}
          tags={article.tags}
          readingTime={article.metadata.readingTime}
        />

        {/* MDX Content */}
        <div
          className="prose prose-neutral dark:prose-invert max-w-none prose-headings:scroll-mt-20 prose-a:text-primary prose-a:no-underline hover:prose-a:underline"
          dangerouslySetInnerHTML={{ __html: article.body }}
        />
      </article>

      {/* Table of Contents */}
      {headings.length > 0 && (
        <aside className="hidden xl:block">
          <TableOfContents headings={headings} />
        </aside>
      )}
    </div>
  );
}
