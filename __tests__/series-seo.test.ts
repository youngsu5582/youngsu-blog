import { describe, expect, it } from "vitest";

import {
  getAdjacentSeriesPosts,
  getAllSeries,
  getSeriesBySlug,
  getSeriesSlug,
  sortSeriesPosts,
  type Post,
} from "@/lib/content";
import { generateItemListSchema } from "@/lib/json-ld";
import sitemap from "@/app/sitemap";
import { siteConfig } from "@/config/site";

describe("series discovery", () => {
  const makePost = (slug: string, date: string, seriesOrder?: number) =>
    ({
      title: slug,
      date,
      description: "",
      categories: [],
      tags: [],
      author: "test",
      toc: true,
      comments: true,
      draft: false,
      lang: "ko",
      series: "Demo Series",
      seriesOrder,
      related: [],
      slug: `posts/${slug}`,
      body: "",
      metadata: { readingTime: 1, wordCount: 10 },
    }) as Post;

  it("seriesOrder가 있으면 발행일보다 명시 순서를 우선한다", () => {
    const ordered = sortSeriesPosts([
      makePost("second", "2026-01-01T00:00:00.000Z", 2),
      makePost("unspecified", "2025-01-01T00:00:00.000Z"),
      makePost("first", "2026-03-01T00:00:00.000Z", 1),
    ]);

    expect(ordered.map((post) => post.slug)).toEqual([
      "posts/first",
      "posts/second",
      "posts/unspecified",
    ]);
  });

  it("현재 시리즈 글 기준 이전/다음 편을 찾는다", () => {
    const ordered = sortSeriesPosts([
      makePost("second", "2026-01-01T00:00:00.000Z", 2),
      makePost("third", "2026-02-01T00:00:00.000Z", 3),
      makePost("first", "2026-03-01T00:00:00.000Z", 1),
    ]);

    const adjacent = getAdjacentSeriesPosts(ordered, "second");

    expect(adjacent.prev?.slug).toBe("posts/first");
    expect(adjacent.next?.slug).toBe("posts/third");
  });

  it("시리즈를 언어별로 묶고 안정적인 slug를 만든다", () => {
    const series = getAllSeries("en");
    const homelab = series.find((item) => item.name === "AI-assisted Homelab");

    expect(homelab).toBeDefined();
    expect(homelab?.slug).toBe("ai-assisted-homelab");
    expect(homelab?.lang).toBe("en");
    expect(homelab?.posts.length).toBeGreaterThanOrEqual(2);
    homelab?.posts.forEach((post) => expect(post.lang).toBe("en"));
  });

  it("slug로 시리즈를 찾는다", () => {
    const series = getSeriesBySlug("ai-assisted-homelab", "ko");

    expect(series?.name).toBe("AI-assisted Homelab");
    expect(series?.posts.length).toBeGreaterThanOrEqual(2);
    expect(getSeriesSlug(series!.name)).toBe("ai-assisted-homelab");
  });
});

describe("series and sitemap SEO", () => {
  it("ItemList JSON-LD로 시리즈 순서를 표현한다", () => {
    const series = getSeriesBySlug("ai-assisted-homelab", "en");
    expect(series).toBeDefined();

    const schema = generateItemListSchema({
      name: series!.name,
      description: `${series!.name} series`,
      url: `${siteConfig.url}/series/ai-assisted-homelab?lang=en`,
      items: series!.posts.map((post) => ({
        name: post.title,
        url: `${siteConfig.url}/posts/${post.slug.replace(/^posts\//, "")}`,
      })),
    });

    expect(schema["@type"]).toBe("ItemList");
    expect(schema.itemListElement[0].position).toBe(1);
    expect(schema.itemListElement[0].url).toContain("/posts/");
  });

  it("sitemap에 검색 페이지와 번역 포스트 alternates를 포함한다", () => {
    const entries = sitemap();
    const searchEntry = entries.find((entry) => entry.url === `${siteConfig.url}/search`);
    const translatedPost = entries.find(
      (entry) => entry.url === `${siteConfig.url}/posts/homeserver-setup-en`,
    );

    expect(searchEntry).toBeDefined();
    expect(translatedPost?.alternates?.languages).toMatchObject({
      en: `${siteConfig.url}/posts/homeserver-setup-en`,
      ko: `${siteConfig.url}/posts/homeserver-setup`,
    });
  });
});
