import { describe, expect, it } from "vitest";

import {
  absoluteSiteUrl,
  buildRootLanguageAlternates,
  buildTranslatedPostAlternates,
} from "@/lib/seo";
import { generateArticleSchema, generatePersonSchema, generateWebSiteSchema } from "@/lib/json-ld";

describe("SEO URL helpers", () => {
  it("상대 이미지 경로를 siteConfig 기반 절대 URL로 만든다", () => {
    expect(absoluteSiteUrl("/assets/img/thumbnail/example.png")).toBe(
      "https://youngsu5582.today/assets/img/thumbnail/example.png",
    );
  });

  it("이미 절대 URL인 값은 그대로 둔다", () => {
    expect(absoluteSiteUrl("https://cdn.example.com/image.png")).toBe(
      "https://cdn.example.com/image.png",
    );
  });

  it("존재하지 않는 /en 루트 alternate를 생성하지 않는다", () => {
    expect(buildRootLanguageAlternates()).toEqual({ ko: "/" });
  });

  it("번역 포스트 alternate는 slug-en 규칙을 그대로 사용한다", () => {
    expect(
      buildTranslatedPostAlternates({
        currentLang: "ko",
        currentSlug: "homeserver-setup",
        alternateLang: "en",
        alternateSlug: "homeserver-setup-en",
      }),
    ).toEqual({
      ko: "https://youngsu5582.today/posts/homeserver-setup",
      en: "https://youngsu5582.today/posts/homeserver-setup-en",
      "x-default": "https://youngsu5582.today/posts/homeserver-setup",
    });
  });
});

describe("JSON-LD SEO schemas", () => {
  it("BlogPosting image는 절대 URL로 출력한다", () => {
    const schema = generateArticleSchema({
      title: "테스트 글",
      description: "테스트 설명",
      datePublished: "2026-06-01T00:00:00.000Z",
      author: "이영수",
      image: "/assets/img/thumbnail/example.png",
      url: "https://youngsu5582.today/posts/example",
    });

    expect(schema.image).toBe("https://youngsu5582.today/assets/img/thumbnail/example.png");
  });

  it("WebSite SearchAction은 실제 /search 페이지를 가리킨다", () => {
    const schema = generateWebSiteSchema();

    expect(schema.potentialAction.target.urlTemplate).toBe(
      "https://youngsu5582.today/search?q={search_term_string}",
    );
  });

  it("Person schema는 sameAs로 공개 프로필을 제공한다", () => {
    const schema = generatePersonSchema();

    expect(schema["@type"]).toBe("Person");
    expect(schema.sameAs).toContain("https://github.com/youngsu5582");
    expect(schema.sameAs).toContain("https://linkedin.com/in/youngsu5582");
  });
});
