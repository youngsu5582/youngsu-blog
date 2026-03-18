import { posts, articles, library, type Post, type Article, type LibraryItem } from "#site/content";

export type { Post, Article, LibraryItem };

/** Velite의 slug에서 컬렉션 접두사를 제거 (posts/hello-world → hello-world) */
export function getUrlSlug(slug: string) {
  return slug.replace(/^(posts|articles|library)\//, "");
}

export function getAllPosts(lang?: "ko" | "en") {
  return posts
    .filter((post: Post) => !post.draft)
    .filter((post: Post) => !lang || post.lang === lang)
    .sort((a: Post, b: Post) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getPostBySlug(slug: string) {
  return posts.find(
    (post: Post) => post.slug === slug || post.slug === `posts/${slug}`,
  );
}

export function getPostsByCategory(category: string) {
  return getAllPosts().filter((post: Post) => post.categories.includes(category));
}

export function getPostsByTag(tag: string) {
  return getAllPosts().filter((post: Post) => post.tags.includes(tag));
}

export function getAllCategories() {
  const categories = new Map<string, number>();
  getAllPosts().forEach((post: Post) => {
    post.categories.forEach((cat: string) => {
      categories.set(cat, (categories.get(cat) || 0) + 1);
    });
  });
  return Array.from(categories.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }));
}

export function getAllTags() {
  const tags = new Map<string, number>();
  getAllPosts().forEach((post: Post) => {
    post.tags.forEach((tag: string) => {
      tags.set(tag, (tags.get(tag) || 0) + 1);
    });
  });
  return Array.from(tags.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }));
}

// Articles
export function getAllArticles() {
  return articles
    .filter((a: Article) => a.status !== "draft")
    .sort((a: Article, b: Article) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getArticleBySlug(slug: string) {
  return articles.find((a: Article) => a.slug === slug || a.slug === `articles/${slug}`);
}

export function getArticlesByMoc(moc: string) {
  return getAllArticles().filter((article: Article) => article.moc === moc);
}

// Library
export function getAllLibraryItems() {
  return library
    .sort((a: LibraryItem, b: LibraryItem) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getLibraryItemBySlug(slug: string) {
  return library.find((item: LibraryItem) => item.slug === slug || item.slug === `library/${slug}`);
}

export function getLibraryItemsByMediaType(mediaType: "book" | "movie") {
  return getAllLibraryItems().filter((item: LibraryItem) => item.mediaType === mediaType);
}
