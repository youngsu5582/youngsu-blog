"use client";

import { ArticleCard } from "./article-card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

interface Article {
  title: string;
  slug: string;
  description: string;
  date: string;
  categories: string[];
  tags: string[];
  image?: string;
  status: "evergreen" | "seed" | "draft";
  moc?: string;
  metadata?: { readingTime: number };
}

interface ArticleListProps {
  articles: Article[];
  currentPage: number;
  totalPages: number;
  basePath?: string;
}

export function ArticleList({ articles, currentPage, totalPages, basePath = "/articles" }: ArticleListProps) {
  if (articles.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">아티클이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-4">
        {articles.map((article) => (
          <ArticleCard
            key={article.slug}
            title={article.title}
            slug={article.slug}
            description={article.description}
            date={article.date}
            categories={article.categories}
            tags={article.tags}
            image={article.image}
            status={article.status}
            moc={article.moc}
            readingTime={article.metadata?.readingTime}
          />
        ))}
      </div>

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
