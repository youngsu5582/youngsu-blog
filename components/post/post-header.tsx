import { Calendar, Clock, User } from "lucide-react";
import Link from "next/link";

interface PostHeaderProps {
  title: string;
  date: string;
  author: string;
  categories: string[];
  tags: string[];
  readingTime?: number;
}

export function PostHeader({ title, date, author, categories, tags, readingTime }: PostHeaderProps) {
  return (
    <header className="mb-10 pb-8">
      {/* Categories */}
      {categories.length > 0 && (
        <div className="flex gap-2 mb-4">
          {categories.map((cat) => (
            <Link
              key={cat}
              href={`/categories/${encodeURIComponent(cat)}`}
              className="theme-category text-sm hover:opacity-70 transition-opacity"
            >
              {cat}
            </Link>
          ))}
        </div>
      )}

      <h1 className="text-3xl font-bold tracking-tight lg:text-4xl mb-5 leading-tight">{title}</h1>

      {/* Meta */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <User className="h-3.5 w-3.5" />
          {author}
        </span>
        <span className="text-border">|</span>
        <span className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5" />
          {new Date(date).toLocaleDateString("ko-KR", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </span>
        {readingTime && (
          <>
            <span className="text-border">|</span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {readingTime}분 읽기
            </span>
          </>
        )}
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-4">
          {tags.map((tag) => (
            <Link
              key={tag}
              href={`/tags/${encodeURIComponent(tag)}`}
              className="theme-tag text-xs px-2.5 py-1 rounded-full"
            >
              #{tag}
            </Link>
          ))}
        </div>
      )}

      {/* Decorative divider */}
      <div className="mt-8 w-12 h-0.5 rounded-full bg-gradient-to-r from-primary to-transparent" />
    </header>
  );
}
