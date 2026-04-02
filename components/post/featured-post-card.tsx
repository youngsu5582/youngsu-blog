import Link from "next/link";
import Image from "next/image";
import { Calendar, Clock, ArrowUpRight, Star } from "lucide-react";
import { getTagColorClass } from "@/lib/category-colors";

interface FeaturedPostCardProps {
  title: string;
  slug: string;
  description: string;
  date: string;
  categories: string[];
  tags: string[];
  image?: string;
  readingTime?: number;
}

export function FeaturedPostCard({
  title,
  slug,
  description,
  date,
  categories,
  tags,
  image,
  readingTime,
}: FeaturedPostCardProps) {
  return (
    <article className="group relative mb-8 overflow-hidden rounded-2xl">
      {/* Gradient border effect */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[var(--color-posts)] via-primary/40 to-[var(--color-posts)]/60 opacity-30 group-hover:opacity-50 transition-opacity duration-500" />

      {/* Glass card */}
      <div className="relative m-[1px] rounded-2xl bg-[var(--theme-glass)] backdrop-blur-md border border-[var(--theme-glass-border)]">
        <div className="p-6 md:p-8">
          {/* Featured badge */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-[var(--color-posts)]/10 to-primary/10 border border-[var(--color-posts)]/20">
              <Star className="h-3.5 w-3.5 text-[var(--color-posts)] fill-[var(--color-posts)]" />
              <span className="text-xs font-medium text-[var(--color-posts)]">Featured</span>
            </div>

            {/* Categories */}
            {categories.length > 0 && (
              <div className="flex gap-2">
                {categories.map((cat) => (
                  <Link key={cat} href={`/categories/${encodeURIComponent(cat)}`}>
                    <span className="theme-category text-xs hover:opacity-70 transition-opacity">
                      {cat}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Content layout: responsive flex */}
          <div className="flex flex-col md:flex-row gap-6">
            {/* Text content */}
            <div className="flex-1 min-w-0 space-y-4">
              {/* Title */}
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight leading-tight">
                <Link
                  href={`/posts/${slug}`}
                  className="group-hover:text-primary transition-colors duration-200 inline-flex items-center gap-2"
                >
                  {title}
                  <ArrowUpRight className="h-5 w-5 opacity-0 -translate-y-1 translate-x-1 group-hover:opacity-60 group-hover:translate-y-0 group-hover:translate-x-0 transition-all duration-200" />
                </Link>
              </h2>

              {/* Description - full visible */}
              {description && (
                <p className="text-base text-muted-foreground leading-relaxed">
                  {description}
                </p>
              )}

              {/* Meta + Tags */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-2">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(date).toLocaleDateString("ko-KR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                  {readingTime && (
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      {readingTime}분
                    </span>
                  )}
                </div>

                {tags.length > 0 && (
                  <>
                    <span className="hidden sm:block text-border">|</span>
                    <div className="flex flex-wrap gap-2">
                      {tags.slice(0, 4).map((tag) => {
                        const colorClass = getTagColorClass(tag);
                        return (
                          <Link key={tag} href={`/tags/${encodeURIComponent(tag)}`}>
                            <span className={`${colorClass || "theme-tag"} text-xs px-2.5 py-1 rounded-full ${colorClass ? "border backdrop-filter backdrop-blur-sm" : ""}`}>
                              {tag}
                            </span>
                          </Link>
                        );
                      })}
                      {tags.length > 4 && (
                        <span className="text-xs text-muted-foreground/50">
                          +{tags.length - 4}
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Thumbnail - larger and prominent */}
            {image && (
              <Link href={`/posts/${slug}`} className="flex-shrink-0">
                <div className="w-full md:w-80 h-56 md:h-64 rounded-xl overflow-hidden bg-muted ring-1 ring-border/50 group-hover:ring-primary/30 transition-all duration-300">
                  <Image
                    src={image}
                    alt={title}
                    width={640}
                    height={512}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                    priority
                    sizes="(max-width: 768px) 100vw, 320px"
                    quality={95}
                  />
                </div>
              </Link>
            )}
          </div>
        </div>

        {/* Subtle glow effect on hover */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[var(--color-posts)]/0 via-primary/0 to-[var(--color-posts)]/0 group-hover:from-[var(--color-posts)]/5 group-hover:via-primary/5 group-hover:to-[var(--color-posts)]/5 transition-all duration-500 pointer-events-none" />
      </div>
    </article>
  );
}
