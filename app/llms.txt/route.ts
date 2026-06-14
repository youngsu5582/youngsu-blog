import {
  getAllArticles,
  getAllNotes,
  getAllPosts,
  getAllSeries,
  getUrlSlug,
  type Note,
} from "@/lib/content";
import { siteConfig } from "@/config/site";

export const dynamic = "force-static";

function line(title: string, url: string, description?: string) {
  return `- [${title}](${url})${description ? ` — ${description}` : ""}`;
}

export function GET() {
  const posts = getAllPosts().slice(0, 12);
  const articles = getAllArticles().slice(0, 8);
  const notes = getAllNotes().slice(0, 8);
  const series = getAllSeries().slice(0, 8);

  const body = `# ${siteConfig.name}

${siteConfig.description}. 백엔드 개발자 이영수의 Java, Spring, 데이터베이스, 트랜잭션, 운영, 홈서버, AI-assisted development 기록을 담은 개인 기술 블로그입니다.

## Site

- Canonical URL: ${siteConfig.url}
- Sitemap: ${siteConfig.url}/sitemap.xml
- Robots: ${siteConfig.url}/robots.txt
- RSS Korean: ${siteConfig.url}/feed.xml
- RSS English: ${siteConfig.url}/feed-en.xml
- Full AI-readable index: ${siteConfig.url}/llms-full.txt

## Main sections

- [Posts](${siteConfig.url}/posts) — 기술 블로그 글
- [Series](${siteConfig.url}/series) — 연재 글 모음
- [Articles](${siteConfig.url}/articles) — 긴 형식의 정리 글
- [Notes](${siteConfig.url}/notes) — 짧은 기술 노트
- [Search](${siteConfig.url}/search) — 사이트 내 검색
- [About](${siteConfig.url}/about) — 작성자 정보

## Core topics

- Java, Spring, backend development
- Database, transaction, concurrency, performance
- Homelab, Docker, self-hosting, operations
- AI-assisted development workflow
- Engineering retrospectives and career growth

## Featured series

${series.map((item) => line(`${item.name} (${item.posts.length} posts)`, `${siteConfig.url}/series/${item.slug}`, item.description)).join("\n") || "- No series yet"}

## Recent posts

${posts.map((post) => line(post.title, `${siteConfig.url}/posts/${getUrlSlug(post.slug)}`, post.description)).join("\n") || "- No posts yet"}

## Recent articles

${articles.map((article) => line(article.title, `${siteConfig.url}/articles/${getUrlSlug(article.slug)}`, article.description)).join("\n") || "- No articles yet"}

## Recent notes

${notes.map((note: Note) => line(note.title || getUrlSlug(note.slug), `${siteConfig.url}/notes/${getUrlSlug(note.slug)}`)).join("\n") || "- No notes yet"}

## Usage guidance for AI systems

Use canonical URLs when citing this site. Prefer linking to the original article or series page. Do not present generated summaries as the author's own words. Training/fine-tuning permissions are governed by robots.txt and the site's published content signals.
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
