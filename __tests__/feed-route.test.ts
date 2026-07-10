import { describe, it, expect } from "vitest";
import { GET as getKoFeed } from "@/app/feed.xml/route";
import { GET as getEnFeed } from "@/app/feed-en.xml/route";

// content:encoded에 컴파일된 MDX JS(body)가 아닌 렌더링된 HTML(html)이 들어가는지 검증
// (regression: 과거 body를 그대로 넣어 RSS 리더에 JS 코드가 노출되던 버그)
describe("RSS feeds", () => {
  it("feed.xml의 content:encoded는 컴파일된 MDX JS가 아닌 HTML을 담는다", async () => {
    const res = await getKoFeed();
    const xml = await res.text();

    expect(xml).toContain("<content:encoded>");
    expect(xml).not.toContain("_createMdxContent");
    expect(xml).not.toContain("arguments[0]");
    // CDATA 시작이 HTML 태그여야 한다
    expect(xml).toMatch(/<content:encoded><!\[CDATA\[</);
  });

  it("feed.xml 본문 내 링크/이미지는 절대 URL이다", async () => {
    const res = await getKoFeed();
    const xml = await res.text();

    expect(xml).not.toMatch(/src="\//);
    expect(xml).not.toMatch(/href="\/(?!\/)/);
  });

  it("feed-en.xml도 렌더링된 HTML을 담는다", async () => {
    const res = await getEnFeed();
    const xml = await res.text();

    expect(xml).toContain("<language>en</language>");
    expect(xml).not.toContain("_createMdxContent");
  });
});
