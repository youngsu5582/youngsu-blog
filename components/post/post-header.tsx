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
    <header className="mb-8 pb-6 border-b border-border">
      {/* Categories */}
      {categories.length > 0 && (
        <div className="flex gap-2 mb-3">
          {categories.map((cat) => (
            <Link
              key={cat}
              href={`/categories/${encodeURIComponent(cat)}`}
              className="text-sm font-medium text-primary hover:underline"
            >
              {cat}
            </Link>
          ))}
        </div>
      )}

      <h1 className="text-3xl font-bold tracking-tight lg:text-4xl mb-4">{title}</h1>

      {/* Meta */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <User className="h-4 w-4" />
          {author}
        </span>
        <span className="flex items-center gap-1.5">
          <Calendar className="h-4 w-4" />
          {new Date(date).toLocaleDateString("ko-KR", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </span>
        {readingTime && (
          <span className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            {readingTime}분 읽기
          </span>
        )}
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {tags.map((tag) => (
            <Link
              key={tag}
              href={`/tags/${encodeURIComponent(tag)}`}
              className="inline-flex items-center text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground hover:bg-accent transition-colors"
            >
              #{tag}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
