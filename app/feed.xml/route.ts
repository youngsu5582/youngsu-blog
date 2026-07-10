import { getAllPosts, getAllArticles, getAllNotes, getUrlSlug, type Post, type Article, type Note } from "@/lib/content";
import { siteConfig } from "@/config/site";

// RSS 리더는 상대 경로를 해석할 기준이 없으므로 절대 URL로 변환
function toFeedHtml(html: string) {
  return html
    .replaceAll('src="/', `src="${siteConfig.url}/`)
    .replaceAll('href="/', `href="${siteConfig.url}/`);
}

export async function GET() {
  // 한국어 콘텐츠 수집
  const posts = getAllPosts("ko");
  const articles = getAllArticles();
  const notes = getAllNotes();

  // 모든 콘텐츠를 통합하여 날짜순 정렬
  const allContent = [
    ...posts.map((post: Post) => ({
      type: "posts" as const,
      title: post.title,
      slug: post.slug,
      description: post.description || "",
      html: post.html,
      date: new Date(post.date),
    })),
    ...articles.map((article: Article) => ({
      type: "articles" as const,
      title: article.title,
      slug: article.slug,
      description: article.description || "",
      html: article.html,
      date: new Date(article.date),
    })),
    ...notes.map((note: Note) => ({
      type: "notes" as const,
      title: note.title || "Untitled",
      slug: note.slug,
      description: "", // Notes don't have descriptions
      html: note.html,
      date: new Date(note.date),
    })),
  ]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 20);

  const items = allContent.map((item) => `
    <item>
      <title><![CDATA[${item.title}]]></title>
      <link>${siteConfig.url}/${item.type}/${getUrlSlug(item.slug)}</link>
      <description><![CDATA[${item.description}]]></description>
      <content:encoded><![CDATA[${toFeedHtml(item.html)}]]></content:encoded>
      <pubDate>${item.date.toUTCString()}</pubDate>
      <guid isPermaLink="true">${siteConfig.url}/${item.type}/${getUrlSlug(item.slug)}</guid>
    </item>
  `).join("");

  const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${siteConfig.name}</title>
    <link>${siteConfig.url}</link>
    <description>${siteConfig.description}</description>
    <language>ko</language>
    <atom:link href="${siteConfig.url}/feed.xml" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`;

  return new Response(feed, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
}
