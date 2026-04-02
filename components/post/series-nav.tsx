"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp, BookOpen, CheckCircle2, Circle, Clock } from "lucide-react";
import { getUrlSlug } from "@/lib/content";
import type { Post } from "@/lib/content";

interface SeriesNavProps {
  seriesName: string;
  posts: Post[];
  currentSlug: string;
}

export function SeriesNav({ seriesName, posts, currentSlug }: SeriesNavProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const currentIndex = posts.findIndex((post) => getUrlSlug(post.slug) === currentSlug);
  const progress = currentIndex !== -1 ? currentIndex + 1 : 0;

  return (
    <div className="mb-8 rounded-xl border border-border/50 bg-gradient-to-br from-muted/40 via-muted/30 to-muted/20 backdrop-blur-sm overflow-hidden shadow-sm">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-all duration-200"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 border border-primary/20">
            <BookOpen className="h-4 w-4 text-primary" />
          </div>
          <div className="flex flex-col items-start">
            <span className="font-semibold text-sm">시리즈: {seriesName}</span>
            <span className="text-xs text-muted-foreground">
              {progress}/{posts.length}편 진행 중
            </span>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-muted-foreground transition-transform" />
        ) : (
          <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform" />
        )}
      </button>

      {isExpanded && (
        <div className="border-t border-border/50 bg-background/30 backdrop-blur-sm">
          {/* Progress Bar */}
          <div className="px-4 pt-3 pb-2">
            <div className="w-full h-1.5 bg-muted/50 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary/80 to-primary transition-all duration-500"
                style={{ width: `${(progress / posts.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Timeline */}
          <ol className="px-4 py-4 space-y-1">
            {posts.map((post, index) => {
              const slug = getUrlSlug(post.slug);
              const isCurrent = slug === currentSlug;
              const isPast = index < currentIndex;
              const isFuture = index > currentIndex;

              const ItemContent = (
                <>
                  {/* Timeline Dot & Line */}
                  <div className="relative flex flex-col items-center flex-shrink-0 w-8">
                    {/* Line Above */}
                    {index > 0 && (
                      <div
                        className={`absolute top-0 w-0.5 h-3 -translate-y-full transition-colors ${
                          isPast ? "bg-primary/60" : "bg-border/50"
                        }`}
                      />
                    )}

                    {/* Dot/Icon */}
                    <div
                      className={`relative z-10 flex items-center justify-center rounded-full transition-all duration-300 ${
                        isCurrent
                          ? "w-7 h-7 bg-primary shadow-lg shadow-primary/30 ring-4 ring-primary/20"
                          : isPast
                            ? "w-6 h-6 bg-primary/60"
                            : "w-5 h-5 bg-muted border-2 border-border/50"
                      }`}
                    >
                      {isCurrent ? (
                        <Circle className="h-3 w-3 text-primary-foreground fill-primary-foreground animate-pulse" />
                      ) : isPast ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary-foreground" />
                      ) : (
                        <Clock className="h-2.5 w-2.5 text-muted-foreground" />
                      )}
                    </div>

                    {/* Line Below */}
                    {index < posts.length - 1 && (
                      <div
                        className={`absolute bottom-0 w-0.5 h-full translate-y-3 transition-colors ${
                          isPast ? "bg-primary/60" : "bg-border/50"
                        }`}
                      />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pb-5">
                    <div
                      className={`transition-all duration-200 ${
                        isCurrent
                          ? "font-semibold text-foreground"
                          : isPast
                            ? "font-medium text-foreground/70"
                            : "font-normal text-muted-foreground"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-xs font-mono opacity-60 mt-0.5">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span className="flex-1 text-sm leading-relaxed line-clamp-2">
                          {post.title}
                        </span>
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="flex items-center gap-2 mt-1.5 ml-7">
                      {isCurrent && (
                        <span className="text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                          현재 글
                        </span>
                      )}
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(post.date).toLocaleDateString("ko-KR", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                </>
              );

              return (
                <li key={post.slug} className="relative">
                  {isCurrent ? (
                    <div className="flex items-start gap-3 px-3 py-2 rounded-lg bg-primary/5 border border-primary/10">
                      {ItemContent}
                    </div>
                  ) : (
                    <Link
                      href={`/posts/${slug}`}
                      className={`group flex items-start gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                        isPast
                          ? "hover:bg-primary/5 hover:border-primary/10 border border-transparent"
                          : "hover:bg-muted/40 hover:border-border/50 border border-transparent"
                      }`}
                    >
                      {ItemContent}
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
