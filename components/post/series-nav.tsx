"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp, BookOpen } from "lucide-react";
import { getUrlSlug } from "@/lib/content";
import type { Post } from "@/lib/content";

interface SeriesNavProps {
  seriesName: string;
  posts: Post[];
  currentSlug: string;
}

export function SeriesNav({ seriesName, posts, currentSlug }: SeriesNavProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="mb-8 rounded-lg border border-border bg-muted/30 overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-2 font-semibold">
          <BookOpen className="h-5 w-5 text-primary" />
          <span>시리즈: {seriesName}</span>
          <span className="text-sm text-muted-foreground font-normal">
            ({posts.length}편)
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        )}
      </button>

      {isExpanded && (
        <div className="border-t border-border">
          <ol className="divide-y divide-border">
            {posts.map((post, index) => {
              const slug = getUrlSlug(post.slug);
              const isCurrent = slug === currentSlug;

              return (
                <li key={post.slug}>
                  {isCurrent ? (
                    <div className="flex items-start gap-3 p-4 bg-primary/10">
                      <span className="flex-shrink-0 text-sm font-medium text-primary mt-0.5">
                        {index + 1}.
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-foreground">
                          {post.title}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          현재 글
                        </div>
                      </div>
                    </div>
                  ) : (
                    <Link
                      href={`/posts/${slug}`}
                      className="flex items-start gap-3 p-4 hover:bg-muted/50 transition-colors"
                    >
                      <span className="flex-shrink-0 text-sm font-medium text-muted-foreground mt-0.5">
                        {index + 1}.
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-foreground hover:text-primary transition-colors">
                          {post.title}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {new Date(post.date).toLocaleDateString("ko-KR", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </div>
                      </div>
                    </Link>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </div>
  );
}
