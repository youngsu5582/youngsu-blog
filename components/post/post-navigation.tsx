import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface NavPost {
  title: string;
  slug: string;
}

interface PostNavigationProps {
  prev?: NavPost;
  next?: NavPost;
}

export function PostNavigation({ prev, next }: PostNavigationProps) {
  if (!prev && !next) return null;

  return (
    <nav className="grid grid-cols-2 gap-4 pt-8 mt-8 border-t border-border">
      {prev ? (
        <Link
          href={`/posts/${prev.slug}`}
          className="group flex items-start gap-2 p-3 rounded-lg hover:bg-muted/50 transition-colors"
        >
          <ChevronLeft className="h-4 w-4 mt-0.5 text-muted-foreground group-hover:text-primary flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-[10px] text-muted-foreground mb-0.5">이전 글</p>
            <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{prev.title}</p>
          </div>
        </Link>
      ) : <div />}

      {next ? (
        <Link
          href={`/posts/${next.slug}`}
          className="group flex items-start gap-2 p-3 rounded-lg hover:bg-muted/50 transition-colors text-right justify-end"
        >
          <div className="min-w-0">
            <p className="text-[10px] text-muted-foreground mb-0.5">다음 글</p>
            <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{next.title}</p>
          </div>
          <ChevronRight className="h-4 w-4 mt-0.5 text-muted-foreground group-hover:text-primary flex-shrink-0" />
        </Link>
      ) : <div />}
    </nav>
  );
}
