"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";

export interface RelatedPostOption {
  slug: string;
  title: string;
  collection: string;
}

interface RelatedPostsFieldProps {
  posts: RelatedPostOption[];
  selectedSlugs: string[];
  search: string;
  onSearchChange: (value: string) => void;
  onChange: (slugs: string[]) => void;
}

export function RelatedPostsField({
  posts,
  selectedSlugs,
  search,
  onSearchChange,
  onChange,
}: RelatedPostsFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selected = new Set(selectedSlugs);
  const filteredPosts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return posts
      .filter((post) => !selected.has(post.slug))
      .filter(
        (post) =>
          !query ||
          post.title.toLowerCase().includes(query) ||
          post.slug.toLowerCase().includes(query),
      )
      .slice(0, 8);
  }, [posts, search, selectedSlugs]);

  const addPost = (slug: string) => {
    if (selected.has(slug)) return;
    onChange([...selectedSlugs, slug]);
    onSearchChange("");
  };

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground">관련 포스트</label>
      {selectedSlugs.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {selectedSlugs.map((slug) => {
            const post = posts.find((item) => item.slug === slug);
            return (
              <span
                key={slug}
                className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2 py-1 text-xs text-primary"
              >
                {post?.title || slug}
                <button
                  type="button"
                  aria-label={`${post?.title || slug} 관련 포스트 제거`}
                  onClick={() => onChange(selectedSlugs.filter((item) => item !== slug))}
                  className="hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            );
          })}
        </div>
      )}
      <div className="relative">
        <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
        <input
          value={search}
          onChange={(event) => {
            onSearchChange(event.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          placeholder="포스트 검색하여 추가..."
          className="w-full rounded-md border border-border bg-background px-3 py-1.5 pl-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
        {isOpen && filteredPosts.length > 0 && (
          <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-48 overflow-y-auto rounded-md border border-border bg-popover shadow-md">
            {filteredPosts.map((post) => (
              <button
                key={post.slug}
                type="button"
                onMouseDown={(event) => {
                  event.preventDefault();
                  addPost(post.slug);
                }}
                className="flex w-full items-center justify-between px-3 py-2 text-left text-xs transition-colors hover:bg-accent"
              >
                <span className="truncate">{post.title}</span>
                <span className="ml-2 flex-shrink-0 text-[10px] text-muted-foreground/50">
                  {post.collection}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
