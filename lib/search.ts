import { getAllPosts, getAllArticles, getAllLibraryItems, getAllNotes, type Note } from "@/lib/content";

export interface SearchItem {
  title: string;
  slug: string;
  description: string;
  tags: string[];
  categories: string[];
  type: "post" | "article" | "library" | "note";
  lang?: string;
}

export type SearchTypeFilter = SearchItem["type"] | "all";

export interface SearchFilterOptions {
  query?: string;
  type?: SearchTypeFilter;
}

export interface HighlightPart {
  text: string;
  match: boolean;
}

function normalizeSearchText(value: string) {
  return value.trim().toLowerCase();
}

export function matchesSearchQuery(item: SearchItem, query: string) {
  const terms = normalizeSearchText(query).split(/\s+/).filter(Boolean);
  if (terms.length === 0) return true;

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

  return terms.every((term) => haystack.includes(term));
}

export function filterSearchItems(items: SearchItem[], options: SearchFilterOptions = {}) {
  const type = options.type ?? "all";
  return items.filter((item) => {
    if (type !== "all" && item.type !== type) return false;
    return matchesSearchQuery(item, options.query ?? "");
  });
}

export function getSearchFacets(items: SearchItem[]) {
  const order: SearchItem["type"][] = ["post", "article", "note", "library"];
  const counts = new Map<SearchItem["type"], number>();
  items.forEach((item) => counts.set(item.type, (counts.get(item.type) ?? 0) + 1));
  return order
    .map((type) => ({ type, count: counts.get(type) ?? 0 }))
    .filter((facet) => facet.count > 0);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function splitHighlightedText(text: string, query: string): HighlightPart[] {
  const terms = normalizeSearchText(query).split(/\s+/).filter(Boolean).map(escapeRegExp);
  if (terms.length === 0) return [{ text, match: false }];

  const pattern = new RegExp(`(${terms.join("|")})`, "gi");
  const parts = text.split(pattern).filter((part) => part.length > 0);

  return parts.map((part) => ({
    text: part,
    match: terms.some((term) => new RegExp(`^${term}$`, "i").test(part)),
  }));
}

export function buildSearchIndex(): SearchItem[] {
  const posts = getAllPosts();
  const articles = getAllArticles();
  const libraryItems = getAllLibraryItems();
  const notes = getAllNotes();

  const postItems: SearchItem[] = posts.map((post) => ({
    title: post.title,
    slug: post.slug.replace(/^posts\//, ""),
    description: post.description || "",
    tags: post.tags || [],
    categories: post.categories || [],
    type: "post" as const,
    lang: post.lang || "ko",
  }));

  const articleItems: SearchItem[] = articles.map((article) => ({
    title: article.title,
    slug: article.slug.replace(/^articles\//, ""),
    description: article.description || "",
    tags: article.tags || [],
    categories: article.categories || [],
    type: "article" as const,
  }));

  const libraryItemsSearchable: SearchItem[] = libraryItems.map((item) => ({
    title: item.title,
    slug: item.slug.replace(/^library\//, ""),
    description: item.description || "",
    tags: item.tags || [],
    categories: item.categories || [],
    type: "library" as const,
  }));

  const noteItems: SearchItem[] = notes.map((note: Note) => ({
    title: note.title || note.slug.replace(/^notes\//, ""),
    slug: note.slug.replace(/^notes\//, ""),
    description: "",
    tags: note.tags || [],
    categories: [],
    type: "note" as const,
  }));

  return [...postItems, ...articleItems, ...libraryItemsSearchable, ...noteItems];
}
