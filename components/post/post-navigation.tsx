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
    <nav className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-8 mt-8 border-t border-border">
      {prev ? (
        <Link
          href={`/posts/${prev.slug}`}
          className="group relative flex items-center gap-3 p-5 rounded-xl border border-border/50 bg-gradient-to-br from-muted/40 to-muted/20 hover:from-muted/60 hover:to-muted/30 hover:border-primary/30 transition-all duration-300 overflow-hidden shadow-sm hover:shadow-md"
        >
          {/* Glassmorphism Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-background/40 to-background/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          <div className="relative z-10 flex items-center justify-center w-10 h-10 rounded-lg bg-muted/50 group-hover:bg-primary/10 border border-border/40 group-hover:border-primary/20 transition-all duration-300 flex-shrink-0">
            <ChevronLeft className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:-translate-x-0.5 transition-all duration-300" />
          </div>

          <div className="relative z-10 min-w-0 flex-1">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 font-medium">이전 글</p>
            <p className="text-sm font-semibold line-clamp-2 leading-relaxed group-hover:text-primary transition-colors duration-200">
              {prev.title}
            </p>
          </div>

          {/* Decorative Gradient */}
          <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </Link>
      ) : (
        <div className="hidden sm:block" />
      )}

      {next ? (
        <Link
          href={`/posts/${next.slug}`}
          className="group relative flex items-center gap-3 p-5 rounded-xl border border-border/50 bg-gradient-to-br from-muted/40 to-muted/20 hover:from-muted/60 hover:to-muted/30 hover:border-primary/30 transition-all duration-300 overflow-hidden shadow-sm hover:shadow-md"
        >
          {/* Glassmorphism Overlay */}
          <div className="absolute inset-0 bg-gradient-to-bl from-background/40 to-background/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          <div className="relative z-10 min-w-0 flex-1 text-right">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 font-medium">다음 글</p>
            <p className="text-sm font-semibold line-clamp-2 leading-relaxed group-hover:text-primary transition-colors duration-200">
              {next.title}
            </p>
          </div>

          <div className="relative z-10 flex items-center justify-center w-10 h-10 rounded-lg bg-muted/50 group-hover:bg-primary/10 border border-border/40 group-hover:border-primary/20 transition-all duration-300 flex-shrink-0">
            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-300" />
          </div>

          {/* Decorative Gradient */}
          <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </Link>
      ) : (
        <div className="hidden sm:block" />
      )}
    </nav>
  );
}
