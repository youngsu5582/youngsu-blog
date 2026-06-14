import type { MetadataRoute } from "next";
import {
  getAllPosts,
  getAllArticles,
  getAllNotes,
  getAllLibraryItems,
  getAllCategories,
  getAllTags,
  getAllSeries,
  getAlternatePost,
  getUrlSlug,
  type Post,
  type Article,
  type Note,
  type LibraryItem,
} from "@/lib/content";
import { siteConfig } from "@/config/site";

const STATIC_EPOCH = new Date("2026-01-01T00:00:00.000Z");

function latestDateForTaxonomy(
  name: string,
  field: "categories" | "tags",
  content: Array<Post | Article | Note>,
) {
  const matchingDates = content
    .filter((item) => item[field]?.includes(name))
    .map((item) => new Date(item.date).getTime())
    .filter((time) => Number.isFinite(time));

  if (matchingDates.length === 0) return new Date();

  return new Date(Math.max(...matchingDates));
}

function latestDateForContent(content: Array<Post | Article | Note | LibraryItem>) {
  const dates = content
    .map((item) => new Date(item.date).getTime())
    .filter((time) => Number.isFinite(time));

  if (dates.length === 0) return STATIC_EPOCH;

  return new Date(Math.max(...dates));
}

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getAllPosts();
  const articles = getAllArticles();
  const notes = getAllNotes();
  const libraryItems = getAllLibraryItems();
  const categories = getAllCategories();
  const tags = getAllTags();
  const series = getAllSeries();
  const taxonomyContent = [...posts, ...articles, ...notes];
  const latestPostDate = latestDateForContent(posts);
  const latestArticleDate = latestDateForContent(articles);
  const latestNoteDate = latestDateForContent(notes);
  const latestLibraryDate = latestDateForContent(libraryItems);
  const latestSiteDate = latestDateForContent([...taxonomyContent, ...libraryItems]);

  // Posts
  const postUrls = posts.map((post: Post) => {
    const alternatePost = getAlternatePost(post);
    const languageAlternates = alternatePost
      ? {
          [post.lang]: `${siteConfig.url}/posts/${getUrlSlug(post.slug)}`,
          [alternatePost.lang]: `${siteConfig.url}/posts/${getUrlSlug(alternatePost.slug)}`,
          "x-default": `${siteConfig.url}/posts/${getUrlSlug(
            post.lang === "ko" ? post.slug : alternatePost.slug,
          )}`,
        }
      : undefined;

    return {
      url: `${siteConfig.url}/posts/${getUrlSlug(post.slug)}`,
      lastModified: new Date(post.date),
      changeFrequency: "monthly" as const,
      priority: 0.8,
      ...(languageAlternates ? { alternates: { languages: languageAlternates } } : {}),
    };
  });

  // Articles
  const articleUrls = articles.map((article: Article) => ({
    url: `${siteConfig.url}/articles/${getUrlSlug(article.slug)}`,
    lastModified: new Date(article.date),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  // Notes
  const noteUrls = notes.map((note: Note) => ({
    url: `${siteConfig.url}/notes/${getUrlSlug(note.slug)}`,
    lastModified: new Date(note.date),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  // Library
  const libraryUrls = libraryItems.map((item: LibraryItem) => ({
    url: `${siteConfig.url}/library/${getUrlSlug(item.slug)}`,
    lastModified: new Date(item.date),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  // Category pages
  const categoryUrls = categories.map((category) => ({
    url: `${siteConfig.url}/categories/${encodeURIComponent(category.name)}`,
    lastModified: latestDateForTaxonomy(category.name, "categories", taxonomyContent),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  // Tag pages
  const tagUrls = tags.map((tag) => ({
    url: `${siteConfig.url}/tags/${encodeURIComponent(tag.name)}`,
    lastModified: latestDateForTaxonomy(tag.name, "tags", taxonomyContent),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  // Series pages
  const seriesUrls = series.map((item) => ({
    url: `${siteConfig.url}/series/${item.slug}${item.lang === "en" ? "?lang=en" : ""}`,
    lastModified: new Date(item.latestDate),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [
    // Homepage
    {
      url: siteConfig.url,
      lastModified: latestSiteDate,
      changeFrequency: "daily",
      priority: 1.0,
    },
    // Main listing pages
    {
      url: `${siteConfig.url}/posts`,
      lastModified: latestPostDate,
      changeFrequency: "daily",
      priority: 0.9,
      alternates: {
        languages: {
          ko: `${siteConfig.url}/posts`,
          en: `${siteConfig.url}/posts?lang=en`,
          "x-default": `${siteConfig.url}/posts`,
        },
      },
    },
    {
      url: `${siteConfig.url}/posts?lang=en`,
      lastModified: latestPostDate,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${siteConfig.url}/articles`,
      lastModified: latestArticleDate,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteConfig.url}/notes`,
      lastModified: latestNoteDate,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${siteConfig.url}/library`,
      lastModified: latestLibraryDate,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${siteConfig.url}/categories`,
      lastModified: latestSiteDate,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${siteConfig.url}/tags`,
      lastModified: latestSiteDate,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${siteConfig.url}/search`,
      lastModified: latestSiteDate,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${siteConfig.url}/series`,
      lastModified: latestPostDate,
      changeFrequency: "weekly",
      priority: 0.7,
      alternates: {
        languages: {
          ko: `${siteConfig.url}/series`,
          en: `${siteConfig.url}/series?lang=en`,
          "x-default": `${siteConfig.url}/series`,
        },
      },
    },
    {
      url: `${siteConfig.url}/series?lang=en`,
      lastModified: latestPostDate,
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${siteConfig.url}/archives`,
      lastModified: latestSiteDate,
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${siteConfig.url}/activities`,
      lastModified: latestSiteDate,
      changeFrequency: "weekly",
      priority: 0.5,
    },
    // Static pages
    {
      url: `${siteConfig.url}/about`,
      lastModified: STATIC_EPOCH,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    // All content
    ...postUrls,
    ...articleUrls,
    ...noteUrls,
    ...libraryUrls,
    ...categoryUrls,
    ...tagUrls,
    ...seriesUrls,
  ];
}
