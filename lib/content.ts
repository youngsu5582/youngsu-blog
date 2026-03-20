import { posts, articles, library, type Post, type Article, type LibraryItem } from "#site/content";
// @ts-expect-error — Turbopack cache issue with new collection
import { notes, type Note } from "#site/content";

export type { Post, Article, LibraryItem, Note };

/** 읽기 시간 계산 — 컴파일된 MDX body에서 추정 (한글+영문) */
export function calcReadingTimeFromBody(body: string): number {
  // Extract string literals from compiled MDX (actual content)
  const strings = body.match(/"[^"]{2,}"/g) || [];
  const text = strings.join(" ");
  const koreanChars = (text.match(/[가-힣]/g) || []).length;
  const englishWords = (text.match(/[a-zA-Z]+/g) || []).length;
  const minutes = Math.ceil(koreanChars / 500 + englishWords / 200);
  return Math.max(1, minutes);
}

/** Velite의 slug에서 컬렉션 접두사를 제거 (posts/hello-world → hello-world) */
export function getUrlSlug(slug: string) {
  return slug.replace(/^(posts|articles|library)\//, "");
}

export function getAllPosts(lang?: "ko" | "en") {
  return posts
    .filter((post: Post) => !post.draft)
    .filter((post: Post) => !lang || post.lang === lang)
    .sort((a: Post, b: Post) => {
      const diff = new Date(b.date).getTime() - new Date(a.date).getTime();
      return diff !== 0 ? diff : b.slug.localeCompare(a.slug);
    });
}

export function getPostBySlug(slug: string) {
  return posts.find(
    (post: Post) => post.slug === slug || post.slug === `posts/${slug}`,
  );
}

export function getPostsByCategory(category: string, lang?: "ko" | "en") {
  return getAllPosts(lang).filter((post: Post) => post.categories.includes(category));
}

export function getPostsByTag(tag: string, lang?: "ko" | "en") {
  return getAllPosts(lang).filter((post: Post) => post.tags.includes(tag));
}

/** 태그로 전 컬렉션 검색 (posts + articles + notes) */
export function getContentByTag(tag: string, lang?: "ko" | "en") {
  const postResults = getPostsByTag(tag, lang);
  const articleResults = getAllArticles().filter((a: Article) => a.tags.includes(tag));
  const noteResults = getAllNotes().filter((n: Note) => n.tags.includes(tag));
  return { posts: postResults, articles: articleResults, notes: noteResults };
}

/** 카테고리로 전 컬렉션 검색 (posts + articles) */
export function getContentByCategory(category: string, lang?: "ko" | "en") {
  const postResults = getPostsByCategory(category, lang);
  const articleResults = getAllArticles().filter((a: Article) => a.categories.includes(category));
  return { posts: postResults, articles: articleResults };
}

export function getPostsBySeries(series: string) {
  return getAllPosts()
    .filter((post: Post) => post.series === series)
    .sort((a: Post, b: Post) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export function getAllCategories(lang?: "ko" | "en") {
  const categories = new Map<string, number>();
  // Posts
  getAllPosts(lang).forEach((post: Post) => {
    post.categories.forEach((cat: string) => {
      categories.set(cat, (categories.get(cat) || 0) + 1);
    });
  });
  // Articles
  getAllArticles().forEach((article: Article) => {
    article.categories.forEach((cat: string) => {
      categories.set(cat, (categories.get(cat) || 0) + 1);
    });
  });
  return Array.from(categories.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }));
}

export function getAllTags(lang?: "ko" | "en") {
  const tags = new Map<string, number>();
  // Posts
  getAllPosts(lang).forEach((post: Post) => {
    post.tags.forEach((tag: string) => {
      tags.set(tag, (tags.get(tag) || 0) + 1);
    });
  });
  // Articles
  getAllArticles().forEach((article: Article) => {
    article.tags.forEach((tag: string) => {
      tags.set(tag, (tags.get(tag) || 0) + 1);
    });
  });
  // Notes
  getAllNotes().forEach((note: Note) => {
    note.tags.forEach((tag: string) => {
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
    .sort((a: Article, b: Article) => { const d = new Date(b.date).getTime() - new Date(a.date).getTime(); return d !== 0 ? d : b.slug.localeCompare(a.slug); });
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
    .sort((a: LibraryItem, b: LibraryItem) => { const d = new Date(b.date).getTime() - new Date(a.date).getTime(); return d !== 0 ? d : b.slug.localeCompare(a.slug); });
}

export function getLibraryItemBySlug(slug: string) {
  return library.find((item: LibraryItem) => item.slug === slug || item.slug === `library/${slug}`);
}

export function getLibraryItemsByMediaType(mediaType: "book" | "movie") {
  return getAllLibraryItems().filter((item: LibraryItem) => item.mediaType === mediaType);
}

// Notes
export function getAllNotes() {
  return notes
    .sort((a: Note, b: Note) => { const d = new Date(b.date).getTime() - new Date(a.date).getTime(); return d !== 0 ? d : b.slug.localeCompare(a.slug); });
}

export function getNoteBySlug(slug: string) {
  return notes.find((n: Note) => n.slug === slug || n.slug === `notes/${slug}`);
}

export function getAllNoteTags() {
  const tags = new Map<string, number>();
  getAllNotes().forEach((note: Note) => {
    note.tags.forEach((tag: string) => {
      tags.set(tag, (tags.get(tag) || 0) + 1);
    });
  });
  return Array.from(tags.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }));
}
