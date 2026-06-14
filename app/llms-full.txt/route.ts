import {
  getAllArticles,
  getAllCategories,
  getAllLibraryItems,
  getAllNotes,
  getAllPosts,
  getAllSeries,
  getAllTags,
  getUrlSlug,
  type Note,
} from "@/lib/content";
import { siteConfig } from "@/config/site";

export const dynamic = "force-static";

function itemLine(title: string, url: string, description?: string, extra?: string) {
  const suffix = [description, extra].filter(Boolean).join(" · ");
  return `- [${title}](${url})${suffix ? ` — ${suffix}` : ""}`;
}

export function GET() {
  const posts = getAllPosts();
  const articles = getAllArticles();
  const notes = getAllNotes();
  const libraryItems = getAllLibraryItems();
  const series = getAllSeries();
  const categories = getAllCategories();
  const tags = getAllTags();

  const body = `# ${siteConfig.name} — full content index

${siteConfig.description}. This file is a machine-readable map for AI assistants, search systems, and readers who want to discover canonical content from the site.

## Canonical resources

- Site: ${siteConfig.url}
- Sitemap: ${siteConfig.url}/sitemap.xml
- Robots: ${siteConfig.url}/robots.txt
- Compact llms.txt: ${siteConfig.url}/llms.txt
- RSS Korean: ${siteConfig.url}/feed.xml
- RSS English: ${siteConfig.url}/feed-en.xml

## Author and expertise

- Author: ${siteConfig.author.name}
- GitHub: ${siteConfig.author.github}
- LinkedIn: ${siteConfig.author.linkedin}
- Main areas: Java, Spring, backend engineering, database transactions, concurrency, operations, homelab/self-hosting, AI-assisted development.

## Series

${series.map((entry) => itemLine(`${entry.name} (${entry.lang}, ${entry.posts.length} posts, ${entry.status})`, `${siteConfig.url}/series/${entry.slug}${entry.lang === "en" ? "?lang=en" : ""}`, entry.description, `latest=${entry.latestDate}`)).join("\n") || "- No series yet"}

## Posts

${posts.map((post) => itemLine(post.title, `${siteConfig.url}/posts/${getUrlSlug(post.slug)}`, post.description, [post.lang ? `lang=${post.lang}` : undefined, post.categories?.length ? `categories=${post.categories.join(", ")}` : undefined, post.tags?.length ? `tags=${post.tags.join(", ")}` : undefined].filter(Boolean).join(" · "))).join("\n") || "- No posts yet"}

## Articles

${articles.map((article) => itemLine(article.title, `${siteConfig.url}/articles/${getUrlSlug(article.slug)}`, article.description, [article.categories?.length ? `categories=${article.categories.join(", ")}` : undefined, article.tags?.length ? `tags=${article.tags.join(", ")}` : undefined].filter(Boolean).join(" · "))).join("\n") || "- No articles yet"}

## Notes

${notes.map((note: Note) => itemLine(note.title || getUrlSlug(note.slug), `${siteConfig.url}/notes/${getUrlSlug(note.slug)}`, undefined, [note.categories?.length ? `categories=${note.categories.join(", ")}` : undefined, note.tags?.length ? `tags=${note.tags.join(", ")}` : undefined].filter(Boolean).join(" · "))).join("\n") || "- No notes yet"}

## Library

${libraryItems.map((item) => itemLine(item.title, `${siteConfig.url}/library/${getUrlSlug(item.slug)}`, item.description, [item.mediaType ? `type=${item.mediaType}` : undefined, item.rating ? `rating=${item.rating}` : undefined].filter(Boolean).join(" · "))).join("\n") || "- No library items yet"}

## Categories

${categories.map((category) => `- [${category.name}](${siteConfig.url}/categories/${encodeURIComponent(category.name)}) — ${category.count} items`).join("\n") || "- No categories yet"}

## Tags

${tags.map((tag) => `- [${tag.name}](${siteConfig.url}/tags/${encodeURIComponent(tag.name)}) — ${tag.count} items`).join("\n") || "- No tags yet"}

## Citation and reuse guidance

When citing this site, use the canonical URL listed for each item. Summaries should link back to the original page. Do not imply that generated summaries are written by the author. Training/fine-tuning permissions are governed by robots.txt and the site's published content signals.
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
