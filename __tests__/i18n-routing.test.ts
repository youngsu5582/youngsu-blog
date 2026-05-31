import { describe, expect, it } from "vitest";
import { getLanguageSwitchTarget } from "@/lib/i18n-routing";

describe("getLanguageSwitchTarget", () => {
  it("posts 목록에서는 lang query를 전환한다", () => {
    expect(getLanguageSwitchTarget("/posts", "en")).toBe("/posts?lang=en");
    expect(getLanguageSwitchTarget("/posts?lang=en", "ko")).toBe("/posts");
    expect(getLanguageSwitchTarget("/posts?page=2", "en")).toBe("/posts?lang=en");
  });

  it("카테고리/태그 목록에서는 같은 경로에 lang query를 전환한다", () => {
    expect(getLanguageSwitchTarget("/categories/backend", "en")).toBe("/categories/backend?lang=en");
    expect(getLanguageSwitchTarget("/tags/java?lang=en", "ko")).toBe("/tags/java");
  });

  it("번역본이 있는 글 상세에서는 반대 언어 글로 이동한다", () => {
    expect(getLanguageSwitchTarget("/posts/blog-migration-to-custom-blog", "en")).toBe("/posts/blog-migration-to-custom-blog-en");
    expect(getLanguageSwitchTarget("/posts/blog-migration-to-custom-blog-en", "ko")).toBe("/posts/blog-migration-to-custom-blog");
  });

  it("번역본이 없는 글 상세에서는 대상 언어 글 목록으로 보낸다", () => {
    expect(getLanguageSwitchTarget("/posts/order-data-handling", "en")).toBe("/posts?lang=en");
  });
});
