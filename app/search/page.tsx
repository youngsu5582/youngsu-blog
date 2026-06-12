import Link from "next/link";
import type { Metadata } from "next";
import { Search } from "lucide-react";

import { buildSearchIndex, type SearchItem } from "@/lib/search";

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export const metadata: Metadata = {
  title: "검색",
  description: "블로그 포스트, 아티클, 노트를 검색합니다.",
  alternates: {
    canonical: "/search",
  },
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

function matchesQuery(item: SearchItem, query: string) {
  const haystack = [
    item.title,
    item.description,
    item.type,
    item.lang,
    ...item.tags,
    ...item.categories,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => haystack.includes(term));
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q = "" } = await searchParams;
  const query = q.trim();
  const results = query
    ? buildSearchIndex()
        .filter((item) => matchesQuery(item, query))
        .slice(0, 30)
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
          URL 쿼리로도 검색할 수 있도록 둔 공개 검색 페이지입니다. 예:{" "}
          <code>/search?q=homelab</code>
        </p>
      </section>

      <form action="/search" className="flex flex-col gap-3 sm:flex-row">
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="포스트, 아티클, 노트 검색..."
          className="min-h-11 flex-1 rounded-lg border border-input bg-background px-4 text-sm outline-none transition focus:ring-2 focus:ring-ring"
        />
        <button
          type="submit"
          className="min-h-11 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
        >
          검색
        </button>
      </form>

      <section className="space-y-4">
        {query ? (
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{query}</span> 검색 결과 {results.length}
            개
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">검색어를 입력해 주세요.</p>
        )}

        <div className="divide-y divide-border rounded-xl border border-border">
          {results.map((item) => (
            <Link
              key={`${item.type}:${item.slug}`}
              href={getItemHref(item)}
              className="block space-y-2 p-4 transition hover:bg-muted/40"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  {item.type}
                  {item.lang ? ` · ${item.lang}` : ""}
                </span>
                {item.categories.slice(0, 2).map((category) => (
                  <span key={category} className="text-xs text-muted-foreground">
                    {category}
                  </span>
                ))}
              </div>
              <h2 className="text-base font-semibold text-foreground">{item.title}</h2>
              {item.description && (
                <p className="line-clamp-2 text-sm text-muted-foreground">{item.description}</p>
              )}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
