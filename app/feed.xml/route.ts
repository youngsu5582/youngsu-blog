import { getAllPosts } from "@/lib/content";
import { siteConfig } from "@/config/site";

export async function GET() {
  const posts = getAllPosts();

  const items = posts.slice(0, 20).map((post) => `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${siteConfig.url}/posts/${post.slug.replace(/^posts\//, "")}</link>
      <description><![CDATA[${post.description || ""}]]></description>
      <pubDate>${new Date(post.date).toUTCString()}</pubDate>
      <guid isPermaLink="true">${siteConfig.url}/posts/${post.slug.replace(/^posts\//, "")}</guid>
    </item>
  `).join("");

  const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
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
