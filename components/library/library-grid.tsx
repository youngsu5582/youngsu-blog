"use client";

import { LibraryCard } from "./library-card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
}

export function LibraryGrid({ items, currentPage, totalPages, basePath = "/library" }: LibraryGridProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">항목이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {currentPage > 1 ? (
            <Button variant="outline" size="sm" render={<Link href={`${basePath}${basePath.includes('?') ? '&' : '?'}page=${currentPage - 1}`} />}>
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
            <Button variant="outline" size="sm" render={<Link href={`${basePath}${basePath.includes('?') ? '&' : '?'}page=${currentPage + 1}`} />}>
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
