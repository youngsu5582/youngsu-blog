import { getAllPosts } from "@/lib/content";

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
  return posts.map((post) => ({
    title: post.title,
    slug: post.slug.replace(/^posts\//, ""),
    description: post.description || "",
    tags: post.tags || [],
    categories: post.categories || [],
    type: "post" as const,
  }));
}
