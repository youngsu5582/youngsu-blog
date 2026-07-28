import { posts, articles, library, type Post, type Article, type LibraryItem } from "#site/content";
// @ts-expect-error — Turbopack cache issue with new collection
import { notes, type Note } from "#site/content";

export type { Post, Article, LibraryItem, Note };

/** 읽기 시간 계산 — 컴파일된 MDX body에서 한글 문자 수 기반 추정 */
export function calcReadingTimeFromBody(body: string): number {
  // 컴파일된 body에서 한글만 카운트 (JSX/JS 코드에는 한글 없음)
  const koreanChars = (body.match(/[가-힣]/g) || []).length;
  const minutes = Math.ceil(koreanChars / 500);
  return Math.max(1, minutes);
}

/** Velite의 slug에서 컬렉션 접두사를 제거 (posts/hello-world → hello-world) */
export function getUrlSlug(slug: string) {
  return slug.replace(/^(posts|articles|notes|library)\//, "");
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
  return posts.find((post: Post) => post.slug === slug || post.slug === `posts/${slug}`);
}

export function getBasePostSlug(slug: string) {
  return getUrlSlug(slug).replace(/-en$/, "");
}

export function getPostSlugForLang(slug: string, lang: "ko" | "en") {
  const baseSlug = getBasePostSlug(slug);
  return lang === "en" ? `${baseSlug}-en` : baseSlug;
}

export function getAlternatePost(post: Post) {
  const targetLang = post.lang === "en" ? "ko" : "en";
  return getPostBySlug(getPostSlugForLang(post.slug, targetLang));
}

export function getPostsByCategory(category: string, lang?: "ko" | "en") {
  return getAllPosts(lang).filter((post: Post) => post.categories.includes(category));
}

export function getPostsByTag(tag: string, lang?: "ko" | "en") {
  const canonicalTag = getCanonicalTagName(tag) ?? tag;
  return getAllPosts(lang).filter((post: Post) => post.tags.includes(canonicalTag));
}

/** 태그로 전 컬렉션 검색 (posts + articles + notes) */
export function getContentByTag(tag: string, lang?: "ko" | "en") {
  const canonicalTag = getCanonicalTagName(tag) ?? tag;
  const postResults = getPostsByTag(canonicalTag, lang);
  const articleResults = getAllArticles().filter((a: Article) => a.tags.includes(canonicalTag));
  const noteResults = getAllNotes().filter((n: Note) => n.tags.includes(canonicalTag));
  return { posts: postResults, articles: articleResults, notes: noteResults };
}

/** 카테고리로 전 컬렉션 검색 (posts + articles + notes) */
export function getContentByCategory(category: string, lang?: "ko" | "en") {
  const postResults = getPostsByCategory(category, lang);
  const articleResults = getAllArticles().filter((a: Article) => a.categories.includes(category));
  const noteResults = getAllNotes().filter((n: Note) => n.categories.includes(category));
  return { posts: postResults, articles: articleResults, notes: noteResults };
}

type SeriesPost = Post & {
  seriesOrder?: number;
  seriesDescription?: string;
  seriesStatus?: "ongoing" | "completed";
};

function getSeriesOrder(post: Post) {
  const order = (post as SeriesPost).seriesOrder;
  return typeof order === "number" && Number.isFinite(order) ? order : Number.POSITIVE_INFINITY;
}

export function sortSeriesPosts(seriesPosts: Post[]) {
  return [...seriesPosts].sort((a: Post, b: Post) => {
    const orderDiff = getSeriesOrder(a) - getSeriesOrder(b);
    if (orderDiff !== 0) return orderDiff;

    const dateDiff = new Date(a.date).getTime() - new Date(b.date).getTime();
    return dateDiff !== 0 ? dateDiff : a.slug.localeCompare(b.slug);
  });
}

export function getAdjacentSeriesPosts(seriesPosts: Post[], currentSlug: string) {
  const currentIndex = seriesPosts.findIndex((post) => getUrlSlug(post.slug) === currentSlug);

  return {
    prev: currentIndex > 0 ? seriesPosts[currentIndex - 1] : undefined,
    next:
      currentIndex >= 0 && currentIndex < seriesPosts.length - 1
        ? seriesPosts[currentIndex + 1]
        : undefined,
  };
}

export function getPostsBySeries(series: string, lang?: "ko" | "en") {
  return sortSeriesPosts(getAllPosts(lang).filter((post: Post) => post.series === series));
}

export interface SeriesSummary {
  name: string;
  slug: string;
  lang: "ko" | "en";
  posts: Post[];
  latestDate: string;
  description?: string;
  status: "ongoing" | "completed";
}

export function getSeriesSlug(series: string) {
  return series
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9가-힣]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getAllSeries(lang?: "ko" | "en"): SeriesSummary[] {
  const grouped = new Map<string, Post[]>();

  getAllPosts(lang).forEach((post: Post) => {
    if (!post.series) return;
    const key = `${post.lang}:${post.series}`;
    grouped.set(key, [...(grouped.get(key) ?? []), post]);
  });

  return Array.from(grouped.entries())
    .map(([key, groupedPosts]) => {
      const name = key.slice(key.indexOf(":") + 1);
      const postsInSeries = sortSeriesPosts(groupedPosts);
      const firstSeriesPost = postsInSeries.find(
        (post) => (post as SeriesPost).seriesDescription || (post as SeriesPost).seriesStatus,
      ) as SeriesPost | undefined;
      return {
        name,
        slug: getSeriesSlug(name),
        lang: postsInSeries[0].lang as "ko" | "en",
        posts: postsInSeries,
        latestDate: postsInSeries[postsInSeries.length - 1].date,
        description: firstSeriesPost?.seriesDescription,
        status: firstSeriesPost?.seriesStatus ?? "ongoing",
      };
    })
    .sort((a, b) => new Date(b.latestDate).getTime() - new Date(a.latestDate).getTime());
}

export function getSeriesBySlug(slug: string, lang?: "ko" | "en") {
  return getAllSeries(lang).find((series) => series.slug === slug);
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
  // Notes
  getAllNotes().forEach((note: Note) => {
    note.categories.forEach((cat: string) => {
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

/** Resolve legacy case variants to the tag spelling used by the current URL. */
export function getCanonicalTagName(tag: string, lang?: "ko" | "en") {
  const normalized = tag.trim().toLocaleLowerCase();
  return getAllTags(lang).find(({ name }) => name.toLocaleLowerCase() === normalized)?.name;
}

// Articles
export function getAllArticles() {
  return articles
    .filter((a: Article) => a.status !== "draft")
    .sort((a: Article, b: Article) => {
      const d = new Date(b.date).getTime() - new Date(a.date).getTime();
      return d !== 0 ? d : b.slug.localeCompare(a.slug);
    });
}

export function getArticleBySlug(slug: string) {
  return articles.find((a: Article) => a.slug === slug || a.slug === `articles/${slug}`);
}

export function getArticlesByMoc(moc: string) {
  return getAllArticles().filter((article: Article) => article.moc === moc);
}

// Library
export function getAllLibraryItems() {
  return library.sort((a: LibraryItem, b: LibraryItem) => {
    const d = new Date(b.date).getTime() - new Date(a.date).getTime();
    return d !== 0 ? d : b.slug.localeCompare(a.slug);
  });
}

export function getLibraryItemBySlug(slug: string) {
  return library.find((item: LibraryItem) => item.slug === slug || item.slug === `library/${slug}`);
}

export function getLibraryItemsByMediaType(mediaType: "book" | "movie") {
  return getAllLibraryItems().filter((item: LibraryItem) => item.mediaType === mediaType);
}

// Notes
export function getAllNotes() {
  return notes.sort((a: Note, b: Note) => {
    const d = new Date(b.date).getTime() - new Date(a.date).getTime();
    return d !== 0 ? d : b.slug.localeCompare(a.slug);
  });
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
