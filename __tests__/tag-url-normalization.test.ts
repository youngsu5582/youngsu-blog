import { describe, expect, it } from "vitest";

import { getCanonicalTagName, getContentByTag, type Note } from "@/lib/content";

describe("태그 URL 표기 정규화", () => {
  it("대소문자가 다른 태그를 현재 표기로 해석한다", () => {
    expect(getCanonicalTagName("github")).toBe("GitHub");
    expect(getCanonicalTagName("dispatcherservlet")).toBe("DispatcherServlet");
    expect(getCanonicalTagName("cli")).toBe("CLI");
  });

  it("legacy 대소문자 URL도 현재 태그와 같은 콘텐츠를 반환한다", () => {
    const legacy = getContentByTag("github");
    const current = getContentByTag("GitHub");

    expect(legacy.posts.map((post) => post.slug)).toEqual(current.posts.map((post) => post.slug));
    expect(legacy.articles.map((article) => article.slug)).toEqual(current.articles.map((article) => article.slug));
    expect(legacy.notes.map((note: Note) => note.slug)).toEqual(current.notes.map((note: Note) => note.slug));
  });
});
