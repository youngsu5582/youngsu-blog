import { posts, type Post } from "#site/content";

export type { Post };

/** Velite의 slug에서 컬렉션 접두사를 제거 (posts/hello-world → hello-world) */
export function getUrlSlug(slug: string) {
  return slug.replace(/^posts\//, "");
}

export function getAllPosts() {
  return posts
    .filter((post: Post) => !post.draft)
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
