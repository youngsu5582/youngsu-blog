"use client";

import Link from "next/link";
import { Home, Search, TrendingUp } from "lucide-react";
import { useState, useEffect } from "react";
import { SearchDialog } from "@/components/search/search-dialog";
import { buildSearchIndex, type SearchItem } from "@/lib/search";
import { getAllPosts, getUrlSlug } from "@/lib/content";
import { PostCard } from "@/components/post/post-card";

export default function NotFound() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchIndex, setSearchIndex] = useState<SearchItem[]>([]);

  // 검색 인덱스 빌드
  useEffect(() => {
    setSearchIndex(buildSearchIndex());
  }, []);

  // 최근 포스트 5개 가져오기
  const recentPosts = getAllPosts("ko").slice(0, 5);

  return (
    <div className="min-h-[60vh] px-4 py-12">
      <div className="max-w-3xl mx-auto space-y-12">
        {/* 404 Header */}
        <div className="text-center space-y-6">
          <div className="space-y-3">
            <h1 className="text-8xl font-bold text-muted-foreground/30">404</h1>
            <h2 className="text-2xl font-semibold">페이지를 찾을 수 없습니다</h2>
            <p className="text-sm text-muted-foreground">
              요청하신 페이지가 존재하지 않거나 이동되었습니다.
            </p>
          </div>

          {/* Search Input */}
          <div className="max-w-md mx-auto pt-2">
            <button
              onClick={() => setSearchOpen(true)}
              className="w-full relative flex items-center gap-3 px-4 py-3 rounded-lg border border-border bg-background hover:bg-muted/50 transition-colors text-left group"
            >
              <Search className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                찾으시는 콘텐츠를 검색해보세요...
              </span>
              <kbd className="ml-auto pointer-events-none select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 hidden sm:flex">
                <span className="text-xs">⌘</span>K
              </kbd>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-3 pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <Home className="h-4 w-4" />
              홈으로
            </Link>
            <Link
              href="/posts"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
            >
              <TrendingUp className="h-4 w-4" />
              포스트 둘러보기
            </Link>
          </div>
        </div>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              또는 최근 포스트를 둘러보세요
            </span>
          </div>
        </div>

        {/* Recent Posts */}
        {recentPosts.length > 0 && (
          <section>
            <h3 className="text-base font-semibold tracking-tight mb-4 theme-heading flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              최근 포스트
            </h3>
            <div className="space-y-0">
              {recentPosts.map((post) => (
                <PostCard
                  key={post.slug}
                  title={post.title}
                  slug={getUrlSlug(post.slug)}
                  description={post.description}
                  date={post.date}
                  categories={post.categories}
                  tags={post.tags}
                  image={post.image}
                  readingTime={post.metadata.readingTime}
                />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Search Dialog */}
      <SearchDialog
        searchIndex={searchIndex}
        open={searchOpen}
        onOpenChange={setSearchOpen}
      />
    </div>
  );
}
