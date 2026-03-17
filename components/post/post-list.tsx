"use client";

import { PostCard } from "./post-card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

interface Post {
  title: string;
  slug: string;
  description: string;
  date: string;
  categories: string[];
  tags: string[];
  image?: string;
  metadata?: { readingTime: number };
}

interface PostListProps {
  posts: Post[];
  currentPage: number;
  totalPages: number;
  basePath?: string;
}

export function PostList({ posts, currentPage, totalPages, basePath = "/posts" }: PostListProps) {
  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">포스트가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-4">
        {posts.map((post) => (
          <PostCard
            key={post.slug}
            title={post.title}
            slug={post.slug}
            description={post.description}
            date={post.date}
            categories={post.categories}
            tags={post.tags}
            image={post.image}
            readingTime={post.metadata?.readingTime}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {currentPage > 1 ? (
            <Button variant="outline" size="sm" render={<Link href={`${basePath}?page=${currentPage - 1}`} />}>
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
            <Button variant="outline" size="sm" render={<Link href={`${basePath}?page=${currentPage + 1}`} />}>
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
