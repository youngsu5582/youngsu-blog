import { notFound } from "next/navigation";
import { getAllLibraryItems, getLibraryItemBySlug, getUrlSlug } from "@/lib/content";
import { Calendar, Star } from "lucide-react";
import Image from "next/image";
import type { Metadata } from "next";

interface LibraryItemPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const items = getAllLibraryItems();
  return items.map((item) => ({
    slug: getUrlSlug(item.slug),
  }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: LibraryItemPageProps): Promise<Metadata> {
  const { slug } = await params;
  const item = getLibraryItemBySlug(slug);

  if (!item) {
    return {
      title: "항목을 찾을 수 없습니다",
    };
  }

  return {
    title: item.title,
    description: item.description,
    openGraph: {
      title: item.title,
      description: item.description,
      type: "article",
      publishedTime: item.date,
      authors: [item.author],
      images: item.image ? [item.image] : undefined,
    },
  };
}

export default async function LibraryItemPage({ params }: LibraryItemPageProps) {
  const { slug } = await params;
  const item = getLibraryItemBySlug(slug);

  if (!item) {
    notFound();
  }

  return (
    <article className="max-w-3xl mx-auto">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-start gap-6 mb-6">
          {/* Cover Image */}
          {item.image && (
            <div className="flex-shrink-0 w-48 h-72 relative rounded-lg overflow-hidden shadow-lg">
              <Image
                src={item.image}
                alt={item.title}
                fill
                className="object-cover"
              />
            </div>
          )}

          <div className="flex-1 space-y-3">
            {/* Media Type Badge */}
            <div>
              <span className="inline-flex items-center text-sm px-3 py-1 rounded-full bg-primary/10 text-primary font-medium">
                {item.mediaType === "book" ? "📚 책" : "🎬 영화"}
              </span>
            </div>

            <h1 className="text-3xl font-bold tracking-tight">{item.title}</h1>

            {/* Rating */}
            {item.rating && (
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      i < item.rating!
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                ))}
                <span className="ml-2 text-sm text-muted-foreground">
                  {item.rating}.0 / 5.0
                </span>
              </div>
            )}

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {new Date(item.date).toLocaleDateString("ko-KR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>

            {/* Categories */}
            {item.categories.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {item.categories.map((cat) => (
                  <span
                    key={cat}
                    className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground"
                  >
                    {cat}
                  </span>
                ))}
              </div>
            )}

            {/* Tags */}
            {item.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {item.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2.5 py-1 rounded-full border border-border text-muted-foreground"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        {item.description && (
          <p className="text-lg text-muted-foreground border-l-4 border-primary pl-4">
            {item.description}
          </p>
        )}
      </header>

      {/* MDX Content */}
      <div
        className="prose prose-neutral dark:prose-invert max-w-none prose-headings:scroll-mt-20 prose-a:text-primary prose-a:no-underline hover:prose-a:underline"
        dangerouslySetInnerHTML={{ __html: item.body }}
      />
    </article>
  );
}
