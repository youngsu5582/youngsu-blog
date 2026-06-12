import { describe, expect, it } from "vitest";

import { getAllSeries, getSeriesBySlug, getSeriesSlug } from "@/lib/content";
import { generateItemListSchema } from "@/lib/json-ld";
import sitemap from "@/app/sitemap";

describe("series discovery", () => {
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
      url: "https://youngsu5582.today/series/ai-assisted-homelab?lang=en",
      items: series!.posts.map((post) => ({
        name: post.title,
        url: `https://youngsu5582.today/posts/${post.slug.replace(/^posts\//, "")}`,
      })),
    });

    expect(schema["@type"]).toBe("ItemList");
    expect(schema.itemListElement[0].position).toBe(1);
    expect(schema.itemListElement[0].url).toContain("/posts/");
  });

  it("sitemap에 검색 페이지와 번역 포스트 alternates를 포함한다", () => {
    const entries = sitemap();
    const searchEntry = entries.find((entry) => entry.url === "https://youngsu5582.today/search");
    const translatedPost = entries.find(
      (entry) => entry.url === "https://youngsu5582.today/posts/homeserver-setup-en",
    );

    expect(searchEntry).toBeDefined();
    expect(translatedPost?.alternates?.languages).toMatchObject({
      en: "https://youngsu5582.today/posts/homeserver-setup-en",
      ko: "https://youngsu5582.today/posts/homeserver-setup",
    });
  });
});
