"use client";

import { LibraryCard } from "./library-card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar, Star } from "lucide-react";
import Link from "next/link";

interface LibraryItem {
  title: string;
  slug: string;
  description: string;
  date: string;
  categories: string[];
  tags: string[];
  image?: string;
  mediaType: "book" | "movie";
  rating?: number;
  metadata?: { readingTime: number };
}

interface LibraryGridProps {
  items: LibraryItem[];
  currentPage: number;
  totalPages: number;
  basePath?: string;
  viewMode?: "grid" | "list";
}

export function LibraryGrid({ items, currentPage, totalPages, basePath = "/library", viewMode = "grid" }: LibraryGridProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">항목이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {items.map((item) => (
            <LibraryCard
              key={item.slug}
              title={item.title}
              slug={item.slug}
              description={item.description}
              date={item.date}
              image={item.image}
              mediaType={item.mediaType}
              rating={item.rating}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Link key={item.slug} href={`/library/${item.slug}`}>
              <article className="group flex gap-4 p-4 border border-border rounded-lg hover:shadow-md transition-all">
                {/* 미디어 타입 아이콘 */}
                <div className="flex-shrink-0 w-12 h-12 rounded-md bg-muted flex items-center justify-center text-2xl">
                  {item.mediaType === "book" ? "📚" : "🎬"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                      {item.mediaType === "book" ? "책" : "영화"}
                    </span>
                    {item.rating && (
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3 w-3 ${
                              i < item.rating!
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  <h3 className="font-semibold group-hover:text-primary transition-colors truncate">
                    {item.title}
                  </h3>
                  {item.description && (
                    <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                      {item.description}
                    </p>
                  )}
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(item.date).toLocaleDateString("ko-KR")}
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {currentPage > 1 ? (
            <Button variant="outline" size="sm" nativeButton={false} render={<Link href={`${basePath}${basePath.includes('?') ? '&' : '?'}page=${currentPage - 1}`} />}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              이전
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled>
              <ChevronLeft className="h-4 w-4 mr-1" />
              이전
            </Button>
          )}

          <span className="text-sm text-muted-foreground px-3">
            {currentPage} / {totalPages}
          </span>

          {currentPage < totalPages ? (
            <Button variant="outline" size="sm" nativeButton={false} render={<Link href={`${basePath}${basePath.includes('?') ? '&' : '?'}page=${currentPage + 1}`} />}>
              다음
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled>
              다음
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
