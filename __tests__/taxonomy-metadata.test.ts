import { describe, expect, it } from "vitest";

import { siteConfig } from "@/config/site";
import { generateMetadata as generateCategoryMetadata } from "@/app/categories/[category]/page";
import { generateMetadata as generateTagMetadata } from "@/app/tags/[tag]/page";
import { generateMetadata as generateSeriesMetadata } from "@/app/series/[slug]/page";
import sitemap from "@/app/sitemap";

describe("taxonomy metadata", () => {
  it("카테고리 페이지는 현재 언어의 canonical을 가진다", async () => {
    const metadata = await generateCategoryMetadata({
      params: Promise.resolve({ category: "Spring" }),
      searchParams: Promise.resolve({ lang: "en" }),
    });

    expect(metadata.alternates?.canonical).toBe(`${siteConfig.url}/categories/Spring?lang=en`);
    expect(metadata.robots).toBeUndefined();
  });

  it("부모 필터가 있는 카테고리 변형은 색인하지 않는다", async () => {
    const metadata = await generateCategoryMetadata({
      params: Promise.resolve({ category: "Spring" }),
      searchParams: Promise.resolve({ lang: "ko", parent: "Backend" }),
    });

    expect(metadata.robots).toEqual({ index: false, follow: true });
  });

  it("태그 목록은 follow만 허용하고 색인하지 않는다", async () => {
    const metadata = await generateTagMetadata({
      params: Promise.resolve({ tag: "GitHub" }),
      searchParams: Promise.resolve({}),
    });

    expect(metadata.robots).toEqual({ index: false, follow: true });
    expect(metadata.alternates?.canonical).toBe(`${siteConfig.url}/tags/GitHub`);
  });

  it("영어 시리즈 canonical은 lang 쿼리를 포함한다", async () => {
    const metadata = await generateSeriesMetadata({
      params: Promise.resolve({ slug: "ai-assisted-homelab" }),
      searchParams: Promise.resolve({ lang: "en" }),
    });

    expect(metadata.alternates?.canonical).toBe(
      `${siteConfig.url}/series/ai-assisted-homelab?lang=en`,
    );
  });

  it("noindex 태그 URL은 sitemap에서 제외한다", () => {
    const entries = sitemap();

    expect(entries.some((entry) => entry.url.includes("/tags"))).toBe(false);
  });
});
