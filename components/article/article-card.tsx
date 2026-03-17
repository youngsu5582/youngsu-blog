import Link from "next/link";
import Image from "next/image";
import { Calendar, Clock, Tag } from "lucide-react";

interface ArticleCardProps {
  title: string;
  slug: string;
  description: string;
  date: string;
  categories: string[];
  tags: string[];
  image?: string;
  status: "evergreen" | "seed" | "draft";
  moc?: string;
  readingTime?: number;
}

export function ArticleCard({
  title,
  slug,
  description,
  date,
  categories,
  tags,
  image,
  status,
  moc,
  readingTime,
}: ArticleCardProps) {
  return (
    <article className="group border border-border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
      {image && (
        <Link href={`/articles/${slug}`}>
          <div className="aspect-[2/1] relative overflow-hidden">
            <Image
              src={image}
              alt={title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        </Link>
      )}
      <div className="p-4 space-y-2">
        {/* Status Badge */}
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full font-medium ${
              status === "evergreen"
                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                : status === "seed"
                  ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                  : "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
            }`}
          >
            {status === "evergreen" ? "🌲" : status === "seed" ? "🌱" : "📝"}
          </span>
          {moc && (
            <span className="text-xs text-muted-foreground">
              {moc}
            </span>
          )}
        </div>

        {/* Categories */}
        {categories.length > 0 && (
          <div className="flex gap-1.5">
            {categories.map((cat) => (
              <Link key={cat} href={`/categories/${encodeURIComponent(cat)}`}>
                <span className="text-xs font-medium text-primary hover:underline">{cat}</span>
              </Link>
            ))}
          </div>
        )}

        {/* Title */}
        <h2 className="text-lg font-semibold">
          <Link href={`/articles/${slug}`} className="hover:text-primary transition-colors">
            {title}
          </Link>
        </h2>

        {/* Description */}
        {description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
        )}

        {/* Meta */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {new Date(date).toLocaleDateString("ko-KR")}
          </span>
          {readingTime && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {readingTime}분
            </span>
          )}
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {tags.slice(0, 3).map((tag) => (
              <Link key={tag} href={`/tags/${encodeURIComponent(tag)}`}>
                <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground hover:bg-accent transition-colors">
                  <Tag className="h-2.5 w-2.5 mr-1" />
                  {tag}
                </span>
              </Link>
            ))}
            {tags.length > 3 && (
              <span className="text-xs text-muted-foreground">+{tags.length - 3}</span>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
