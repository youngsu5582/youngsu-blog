import { describe, it, expect } from "vitest";
import { buildSearchIndex } from "@/lib/search";

describe("buildSearchIndex", () => {
  it("검색 인덱스를 반환한다", () => {
    const index = buildSearchIndex();
    expect(Array.isArray(index)).toBe(true);
    expect(index.length).toBeGreaterThan(0);
  });

  it("각 아이템에 필수 필드가 있다", () => {
    const index = buildSearchIndex();
    index.forEach((item) => {
      expect(item).toHaveProperty("title");
      expect(item).toHaveProperty("slug");
      expect(item).toHaveProperty("type");
      expect(["post", "article", "library"]).toContain(item.type);
    });
  });

  it("포스트에 lang 필드가 있다", () => {
    const index = buildSearchIndex();
    const posts = index.filter((i) => i.type === "post");
    posts.forEach((p) => {
      expect(p.lang).toBeDefined();
      expect(["ko", "en"]).toContain(p.lang);
    });
  });
});
