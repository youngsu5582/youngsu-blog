import Link from "next/link";
import Image from "next/image";
import { Calendar, Clock, ArrowUpRight } from "lucide-react";

interface PostCardProps {
  title: string;
  slug: string;
  description: string;
  date: string;
  categories: string[];
  tags: string[];
  image?: string;
  readingTime?: number;
}

export function PostCard({
  title,
  slug,
  description,
  date,
  categories,
  tags,
  image,
  readingTime,
}: PostCardProps) {
  return (
    <article className="group sora-card py-6 first:pt-0">
      <div className="flex gap-5">
        {/* Content */}
        <div className="flex-1 min-w-0 space-y-2.5">
          {/* Categories */}
          {categories.length > 0 && (
            <div className="flex gap-2">
              {categories.map((cat) => (
                <Link key={cat} href={`/categories/${encodeURIComponent(cat)}`}>
                  <span className="sora-category text-xs hover:opacity-70 transition-opacity">
                    {cat}
                  </span>
                </Link>
              ))}
            </div>
          )}

          {/* Title */}
          <h2 className="text-lg font-semibold tracking-tight leading-snug">
            <Link
              href={`/posts/${slug}`}
              className="group-hover:text-primary transition-colors duration-200 inline-flex items-center gap-1"
            >
              {title}
              <ArrowUpRight className="h-3.5 w-3.5 opacity-0 -translate-y-0.5 translate-x-0.5 group-hover:opacity-60 group-hover:translate-y-0 group-hover:translate-x-0 transition-all duration-200" />
            </Link>
          </h2>

          {/* Description */}
          {description && (
            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
              {description}
            </p>
          )}

          {/* Meta + Tags */}
          <div className="flex items-center gap-4 pt-1">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(date).toLocaleDateString("ko-KR", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </span>
              {readingTime && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {readingTime}분
                </span>
              )}
            </div>

            {tags.length > 0 && (
              <>
                <span className="text-border">|</span>
                <div className="flex flex-wrap gap-1.5">
                  {tags.slice(0, 3).map((tag) => (
                    <Link key={tag} href={`/tags/${encodeURIComponent(tag)}`}>
                      <span className="sora-tag text-[11px] px-2 py-0.5 rounded-full">
                        {tag}
                      </span>
                    </Link>
                  ))}
                  {tags.length > 3 && (
                    <span className="text-xs text-muted-foreground/50">
                      +{tags.length - 3}
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Thumbnail */}
        {image && (
          <Link href={`/posts/${slug}`} className="flex-shrink-0">
            <div className="w-28 h-28 rounded-lg overflow-hidden bg-muted">
              <Image
                src={image}
                alt={title}
                width={112}
                height={112}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
          </Link>
        )}
      </div>
    </article>
  );
}
