import { describe, expect, it } from "vitest";

import { siteConfig } from "@/config/site";
import {
  generateMetadata as generateCategoryMetadata,
  generateStaticParams as generateCategoryStaticParams,
} from "@/app/categories/[category]/[lang]/page";
import {
  generateMetadata as generateCategoryWithParentMetadata,
  generateStaticParams as generateCategoryWithParentStaticParams,
} from "@/app/categories/[category]/[lang]/[parent]/page";
import {
  generateMetadata as generateTagMetadata,
  generateStaticParams as generateTagStaticParams,
} from "@/app/tags/[tag]/[lang]/page";
import { generateMetadata as generateSeriesMetadata } from "@/app/series/[slug]/page";
import sitemap from "@/app/sitemap";

describe("taxonomy metadata", () => {
  it("카테고리 페이지는 현재 언어의 canonical을 가진다", async () => {
    const metadata = await generateCategoryMetadata({
      params: Promise.resolve({ category: "Spring", lang: "en" }),
    });

    expect(metadata.alternates?.canonical).toBe(`${siteConfig.url}/categories/Spring?lang=en`);
    expect(metadata.robots).toBeUndefined();
  });

  it("부모 필터가 있는 카테고리 변형은 색인하지 않는다", async () => {
    const metadata = await generateCategoryWithParentMetadata({
      params: Promise.resolve({ category: "Spring", lang: "ko", parent: "Backend" }),
    });

    expect(metadata.robots).toEqual({ index: false, follow: true });
  });

  it("태그 목록은 follow만 허용하고 색인하지 않는다", async () => {
    const metadata = await generateTagMetadata({
      params: Promise.resolve({ tag: "GitHub", lang: "ko" }),
    });

    expect(metadata.robots).toEqual({ index: false, follow: true });
    expect(metadata.alternates?.canonical).toBe(`${siteConfig.url}/tags/GitHub`);
  });

  it("태그 · 카테고리 페이지는 ko · en 을 모두 빌드 때 미리 만든다", async () => {
    const tagParams = await generateTagStaticParams();
    const categoryParams = await generateCategoryStaticParams();

    for (const params of [tagParams, categoryParams]) {
      expect(new Set(params.map((p) => p.lang))).toEqual(new Set(["ko", "en"]));
      expect(params.filter((p) => p.lang === "ko")).toHaveLength(params.length / 2);
    }
    expect(tagParams).toContainEqual({ tag: "CI/CD", lang: "en" });
  });

  it("카테고리 목록이 링크하는 부모 → 자식 조합을 미리 만든다", async () => {
    const params = await generateCategoryWithParentStaticParams();

    expect(params.length).toBeGreaterThan(0);
    expect(params.every((p) => p.parent && p.category !== p.parent)).toBe(true);
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
