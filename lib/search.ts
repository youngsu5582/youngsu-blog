import { getAllPosts, getAllArticles, getAllLibraryItems } from "@/lib/content";

export interface SearchItem {
  title: string;
  slug: string;
  description: string;
  tags: string[];
  categories: string[];
  type: "post" | "article" | "library";
}

export function buildSearchIndex(): SearchItem[] {
  const posts = getAllPosts();
  const articles = getAllArticles();
  const libraryItems = getAllLibraryItems();

  const postItems: SearchItem[] = posts.map((post) => ({
    title: post.title,
    slug: post.slug.replace(/^posts\//, ""),
    description: post.description || "",
    tags: post.tags || [],
    categories: post.categories || [],
    type: "post" as const,
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

  return [...postItems, ...articleItems, ...libraryItemsSearchable];
}
