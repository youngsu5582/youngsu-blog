import Link from "next/link";
import type { Metadata } from "next";
import { Search, SlidersHorizontal } from "lucide-react";

import {
  buildSearchIndex,
  filterSearchItems,
  getSearchFacets,
  splitHighlightedText,
  type SearchItem,
  type SearchTypeFilter,
} from "@/lib/search";

interface SearchPageProps {
  searchParams: Promise<{ q?: string; type?: string }>;
}

export const metadata: Metadata = {
  title: "검색",
  description: "블로그 포스트, 아티클, 노트를 검색합니다.",
  alternates: {
    canonical: "/search",
  },
};

const typeLabels: Record<SearchItem["type"], string> = {
  post: "Posts",
  article: "Articles",
  note: "Notes",
  library: "Library",
};

function getItemHref(item: SearchItem) {
  const basePath =
    item.type === "article"
      ? "/articles"
      : item.type === "library"
        ? "/library"
        : item.type === "note"
          ? "/notes"
          : "/posts";

  return `${basePath}/${item.slug}`;
}

function getValidType(type?: string): SearchTypeFilter {
  return type === "post" || type === "article" || type === "library" || type === "note"
    ? type
    : "all";
}

function HighlightedText({ text, query }: { text: string; query: string }) {
  return splitHighlightedText(text, query).map((part, index) =>
    part.match ? (
      <mark key={`${part.text}:${index}`} className="rounded bg-primary/15 px-0.5 text-foreground">
        {part.text}
      </mark>
    ) : (
      <span key={`${part.text}:${index}`}>{part.text}</span>
    ),
  );
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q = "", type } = await searchParams;
  const query = q.trim();
  const selectedType = getValidType(type);
  const searchIndex = buildSearchIndex();
  const queryMatches = filterSearchItems(searchIndex, { query });
  const facets = getSearchFacets(queryMatches);
  const results = query
    ? filterSearchItems(searchIndex, { query, type: selectedType }).slice(0, 30)
    : [];

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-1 text-xs text-muted-foreground">
          <Search className="h-3.5 w-3.5" />
          Search
        </div>
        <h1 className="text-3xl font-bold tracking-tight theme-heading">검색</h1>
        <p className="text-sm text-muted-foreground">
          포스트, 아티클, 노트, 라이브러리를 한 번에 검색합니다. 예: <code>/search?q=homelab</code>
        </p>
      </section>

      <form action="/search" className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="포스트, 아티클, 노트 검색..."
            className="min-h-11 flex-1 rounded-lg border border-input bg-background px-4 text-sm outline-none transition focus:ring-2 focus:ring-ring"
          />
          <label className="sr-only" htmlFor="search-type">
            콘텐츠 타입
          </label>
          <select
            id="search-type"
            name="type"
            defaultValue={selectedType}
            className="min-h-11 rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:ring-2 focus:ring-ring"
          >
            <option value="all">전체</option>
            <option value="post">Posts</option>
            <option value="article">Articles</option>
            <option value="note">Notes</option>
            <option value="library">Library</option>
          </select>
          <button
            type="submit"
            className="min-h-11 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
          >
            검색
          </button>
        </div>

        {query && facets.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border/60 pt-4 text-xs">
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <SlidersHorizontal className="h-3.5 w-3.5" /> 필터
            </span>
            <Link
              href={`/search?q=${encodeURIComponent(query)}`}
              className={`rounded-full border px-3 py-1 transition ${
                selectedType === "all"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              전체 {queryMatches.length}
            </Link>
            {facets.map((facet) => (
              <Link
                key={facet.type}
                href={`/search?q=${encodeURIComponent(query)}&type=${facet.type}`}
                className={`rounded-full border px-3 py-1 transition ${
                  selectedType === facet.type
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {typeLabels[facet.type]} {facet.count}
              </Link>
            ))}
          </div>
        )}
      </form>

      <section className="space-y-4">
        {query ? (
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{query}</span> 검색 결과 {results.length}개
            {selectedType !== "all" && ` · ${typeLabels[selectedType]} 필터 적용`}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">검색어를 입력해 주세요.</p>
        )}

        <div className="divide-y divide-border overflow-hidden rounded-xl border border-border">
          {results.map((item) => (
            <Link
              key={`${item.type}:${item.slug}`}
              href={getItemHref(item)}
              className="block space-y-2 p-4 transition hover:bg-muted/40"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  {typeLabels[item.type]}
                  {item.lang ? ` · ${item.lang}` : ""}
                </span>
                {item.categories.slice(0, 2).map((category) => (
                  <span key={category} className="text-xs text-muted-foreground">
                    {category}
                  </span>
                ))}
              </div>
              <h2 className="text-base font-semibold text-foreground">
                <HighlightedText text={item.title} query={query} />
              </h2>
              {item.description && (
                <p className="line-clamp-2 text-sm text-muted-foreground">
                  <HighlightedText text={item.description} query={query} />
                </p>
              )}
            </Link>
          ))}
        </div>

        {query && results.length === 0 && (
          <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            조건에 맞는 결과가 없습니다. 검색어를 줄이거나 타입 필터를 전체로 바꿔보세요.
          </div>
        )}
      </section>
    </div>
  );
}
