import { getAllPosts, getUrlSlug, type Post } from "@/lib/content";
import { siteConfig } from "@/config/site";

export async function GET() {
  // 영어 포스트만 포함 (articles와 notes는 lang 필드가 없으므로 제외)
  const posts = getAllPosts("en");

  const items = posts.slice(0, 20).map((post: Post) => `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${siteConfig.url}/posts/${getUrlSlug(post.slug)}</link>
      <description><![CDATA[${post.description || ""}]]></description>
      <content:encoded><![CDATA[${post.body}]]></content:encoded>
      <pubDate>${new Date(post.date).toUTCString()}</pubDate>
      <guid isPermaLink="true">${siteConfig.url}/posts/${getUrlSlug(post.slug)}</guid>
    </item>
  `).join("");

  const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${siteConfig.name} - English</title>
    <link>${siteConfig.url}</link>
    <description>${siteConfig.description} (English posts)</description>
    <language>en</language>
    <atom:link href="${siteConfig.url}/feed-en.xml" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`;

  return new Response(feed, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
}
